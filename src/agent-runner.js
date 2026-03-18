import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["taskType", "shouldProceed", "summary", "reasoning", "relevantFiles", "testFiles", "notes"],
  properties: {
    taskType: {
      type: "string",
      enum: ["code-change", "documentation", "analysis-only", "blocked"],
    },
    shouldProceed: { type: "boolean" },
    summary: { type: "string" },
    reasoning: { type: "string" },
    relevantFiles: {
      type: "array",
      items: { type: "string" },
    },
    testFiles: {
      type: "array",
      items: { type: "string" },
    },
    notes: {
      type: "array",
      items: { type: "string" },
    },
  },
};

const FINAL_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["outcome", "summary", "changedFiles", "commandsRun", "notes"],
  properties: {
    outcome: {
      type: "string",
      enum: ["completed", "partial", "blocked", "failed"],
    },
    summary: { type: "string" },
    changedFiles: {
      type: "array",
      items: { type: "string" },
    },
    commandsRun: {
      type: "array",
      items: { type: "string" },
    },
    notes: {
      type: "array",
      items: { type: "string" },
    },
  },
};

const RUNNER_PROVIDER = "pi-rpc";
const ANALYSIS_TAG = "MINIONS_ANALYSIS_RESULT";
const EXECUTION_TAG = "MINIONS_EXECUTION_RESULT";
const UNSUPPORTED_PI_PROVIDER_VALUES = new Set(["codex"]);

function formatList(items, fallback = "none") {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function parseJsonFile(content) {
  const trimmed = String(content || "").trim();
  if (!trimmed) {
    return null;
  }

  return JSON.parse(trimmed);
}

function extractTaggedJson(text, tag) {
  const source = String(text || "");
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<${escapedTag}>([\\s\\S]*?)<\\/${escapedTag}>`, "g");
  let match = null;
  for (const candidate of source.matchAll(pattern)) {
    match = candidate;
  }

  if (!match) {
    return null;
  }

  const payload = String(match[1] || "").trim();
  if (!payload) {
    return null;
  }

  return JSON.parse(payload);
}

function collectTextContent(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => collectTextContent(item)).filter(Boolean).join("\n");
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  if (typeof value.text === "string") {
    return value.text;
  }

  if (Array.isArray(value.content)) {
    return value.content.map((item) => collectTextContent(item)).filter(Boolean).join("\n");
  }

  return "";
}

function tryParseTaggedContract(text, tag) {
  try {
    return extractTaggedJson(text, tag);
  } catch {
    return null;
  }
}

function normalizeRpcResponsePayload(event) {
  const message = event?.message;
  if (message && typeof message === "object") {
    return message;
  }

  return event;
}

export function buildAnalysisPrompt(packet) {
  const repositoryFiles = (packet.repository?.files || []).slice(0, 200).map((file) =>
    [file.path, file.area ? `area=${file.area}` : null, file.type ? `type=${file.type}` : null]
      .filter(Boolean)
      .join(" | "),
  );
  const validationSteps = (packet.repository?.validationSteps || []).map((step) =>
    [step.id || "validation-step", step.command ? `command=${step.command}` : null].filter(Boolean).join(" | "),
  );
  const relatedContext = (packet.context?.relatedWork || []).map((item) =>
    [item.source || "context", item.id ? `id=${item.id}` : null, item.summary || item.topic || null]
      .filter(Boolean)
      .join(" | "),
  );

  return [
    "You are investigating a Minions repository task before execution.",
    "Your job is to classify the task, identify likely repository surfaces, and decide whether the task should proceed.",
    "Do not make edits. Inspect mentally from the provided repo summary only.",
    "Return your final answer with one tagged JSON block and no extra formatting around the tags.",
    `Wrap the final JSON object in <${ANALYSIS_TAG}>...</${ANALYSIS_TAG}>.`,
    "",
    "Task",
    `- taskId: ${packet.task.id}`,
    `- title: ${packet.task.title}`,
    `- objective: ${packet.task.objective}`,
    `- expectedOutcome: ${packet.task.expectedOutcome}`,
    "- constraints:",
    formatList(packet.task.constraints || []),
    "",
    "Repository",
    `- repositoryId: ${packet.repository.repositoryId}`,
    `- repositoryPath: ${packet.repository.repositoryPath}`,
    "",
    "Repository File Summary",
    formatList(repositoryFiles),
    "",
    "Repository Validation Steps",
    formatList(validationSteps),
    "",
    "Related Context",
    formatList(relatedContext),
    "",
    "Working Context Summary",
    JSON.stringify(packet.context?.workingContext || {}, null, 2),
    "",
    "Return JSON with:",
    '- taskType: "code-change", "documentation", "analysis-only", or "blocked"',
    "- shouldProceed: true unless the task is unsafe, impossible, or clearly out of scope for the repository",
    "- summary: concise description of the intended work",
    "- reasoning: why these repo surfaces matter",
    "- relevantFiles: likely files to inspect or edit, including new file paths if documentation should be created",
    "- testFiles: likely test or verification surfaces",
    "- notes: short operator-facing caveats or follow-ups",
  ].join("\n");
}

export function buildExecutionPrompt(packet) {
  const relevantFiles = (packet.context?.relevantFiles || []).map((file) =>
    [file.path, file.area ? `area=${file.area}` : null, file.type ? `type=${file.type}` : null]
      .filter(Boolean)
      .join(" | "),
  );
  const validationSteps = (packet.context?.validationSteps || []).map((step) =>
    [step.id || "validation-step", step.command ? `command=${step.command}` : null].filter(Boolean).join(" | "),
  );
  const relatedContext = (packet.context?.relatedWork || []).map((item) =>
    [item.source || "context", item.id ? `id=${item.id}` : null, item.summary || item.topic || null]
      .filter(Boolean)
      .join(" | "),
  );

  return [
    "You are executing a Minions autonomous repository task.",
    "Work inside the provided repository only and stay within the stated task scope.",
    "If you cannot complete the task safely, return outcome=blocked or outcome=failed rather than guessing.",
    "Return your final answer with one tagged JSON block and no extra formatting around the tags.",
    `Wrap the final JSON object in <${EXECUTION_TAG}>...</${EXECUTION_TAG}>.`,
    "",
    "Task",
    `- taskId: ${packet.task.id}`,
    `- title: ${packet.task.title}`,
    `- objective: ${packet.task.objective}`,
    `- expectedOutcome: ${packet.task.expectedOutcome}`,
    "- constraints:",
    formatList(packet.task.constraints || []),
    "",
    "Repository",
    `- repositoryId: ${packet.repository.repositoryId}`,
    `- repositoryPath: ${packet.repository.repositoryPath}`,
    "",
    "Task Analysis",
    `- taskType: ${packet.context?.analysis?.taskType || "unspecified"}`,
    `- shouldProceed: ${String(packet.context?.analysis?.shouldProceed ?? true)}`,
    `- summary: ${packet.context?.analysis?.summary || "none"}`,
    `- reasoning: ${packet.context?.analysis?.reasoning || "none"}`,
    "",
    "Relevant Files",
    formatList(relevantFiles),
    "",
    "Validation Steps",
    formatList(validationSteps),
    "",
    "Related Context",
    formatList(relatedContext),
    "",
    "Working Context Summary",
    JSON.stringify(packet.context?.workingContext || {}, null, 2),
    "",
    "Instructions",
    "- Inspect the repository before editing.",
    "- Make the smallest coherent implementation that satisfies the task.",
    "- Run relevant repository validation commands when appropriate.",
    "- End with a short final summary that names the key files you changed and any validation you ran.",
    "",
    "Return JSON with:",
    '- outcome: "completed", "partial", "blocked", or "failed"',
    "- summary: concise implementation result",
    "- changedFiles: repository-relative changed file paths",
    "- commandsRun: relevant validation or shell commands that were run",
    "- notes: short operator-facing caveats or follow-ups",
  ].join("\n");
}

function normalizePiProvider(provider) {
  const value = String(provider || "").trim();
  if (!value) {
    return null;
  }

  if (UNSUPPORTED_PI_PROVIDER_VALUES.has(value.toLowerCase())) {
    return null;
  }

  return value;
}

export class PiRpcRunner {
  constructor(options = {}) {
    this.command = options.command || "pi";
    this.provider = normalizePiProvider(options.provider);
    this.model = options.model || null;
    this.modelProvider = options.modelProvider || this.provider || null;
    this.sessionDir = options.sessionDir || null;
    this.extraArgs = Array.isArray(options.extraArgs) ? options.extraArgs : [];
    this.env = options.env || process.env;
    this.spawnImpl = options.spawnImpl || spawn;
    this.analysisResponseSchema = options.analysisResponseSchema || ANALYSIS_RESPONSE_SCHEMA;
    this.finalResponseSchema = options.finalResponseSchema || FINAL_RESPONSE_SCHEMA;
  }

  _buildArgs(packet) {
    const args = ["--mode", "rpc", "--no-session"];

    if (this.provider) {
      args.push("--provider", this.provider);
    }

    if (this.model) {
      args.push("--model", this.model);
    }

    if (this.sessionDir) {
      args.push("--session-dir", this.sessionDir);
    }

    args.push(...this.extraArgs);
    return args;
  }

  async _runPrompt({ packet, prompt, tag, schema }) {
    if (!packet?.repository?.repositoryPath) {
      throw new Error("repository.repositoryPath is required for Pi RPC execution");
    }

    const args = this._buildArgs(packet);
    let stdout = "";
    let stderr = "";
    let assistantText = "";
    const events = [];
    const responses = [];
    let exitCode = null;

    const child = this.spawnImpl(this.command, args, {
      cwd: packet.repository.repositoryPath,
      env: this.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let resolved = false;
    const lines = [];

    const handleStdoutChunk = (chunk) => {
      const text = chunk.toString();
      stdout += text;
      lines.push(text);
      const buffered = lines.join("");
      const records = buffered.split("\n");
      lines.length = 0;
      const trailing = records.pop();
      if (trailing) {
        lines.push(trailing);
      }

      for (const rawRecord of records) {
        const record = rawRecord.endsWith("\r") ? rawRecord.slice(0, -1) : rawRecord;
        if (!record.trim()) {
          continue;
        }

        let payload;
        try {
          payload = JSON.parse(record);
        } catch {
          continue;
        }

        if (payload?.type === "response") {
          responses.push(payload);
          continue;
        }

        events.push(payload);

        if (payload?.type === "message_end") {
          const message = normalizeRpcResponsePayload(payload);
          if (message?.role === "assistant") {
            assistantText = collectTextContent(message.content || message);
          }
        }

        if (payload?.type === "turn_end") {
          const message = normalizeRpcResponsePayload(payload);
          const turnText = collectTextContent(message?.content || payload?.message?.content || "");
          if (turnText) {
            assistantText = turnText;
          }
        }

        if (payload?.type === "agent_end" && Array.isArray(payload.messages)) {
          for (let index = payload.messages.length - 1; index >= 0; index -= 1) {
            const candidate = payload.messages[index];
            if (candidate?.role === "assistant") {
              const textContent = collectTextContent(candidate.content || candidate);
              if (textContent) {
                assistantText = textContent;
                break;
              }
            }
          }
        }
      }
    };

    const exit = await new Promise((resolve, reject) => {
      child.stdout?.on("data", handleStdoutChunk);
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        exitCode = code;
        if (!resolved && lines.length > 0) {
          handleStdoutChunk("\n");
        }
        resolved = true;
        resolve(code);
      });

      child.stdin?.write(`${JSON.stringify({ id: "prompt-1", type: "prompt", message: prompt })}\n`);
      child.stdin?.write(`${JSON.stringify({ id: "assistant-text-1", type: "get_last_assistant_text" })}\n`);
      child.stdin?.end();
    });

    const assistantResponse = responses.find((response) => response?.id === "assistant-text-1");
    const reportedAssistantText = assistantResponse?.data?.text;
    if (typeof reportedAssistantText === "string" && reportedAssistantText.trim()) {
      assistantText = reportedAssistantText;
    }

    const final = tryParseTaggedContract(assistantText, tag) || tryParseTaggedContract(stdout, tag);
    const ok = exit === 0 && Boolean(final);
    return {
      ok,
      exitCode,
      stdout,
      stderr,
      final,
      prompt,
      provider: RUNNER_PROVIDER,
      modelProvider: this.modelProvider,
      events,
      responses,
      assistantText,
      expectedSchema: schema,
    };
  }

  async analyze(packet) {
    return this._runPrompt({
      packet,
      prompt: buildAnalysisPrompt(packet),
      tag: ANALYSIS_TAG,
      schema: this.analysisResponseSchema,
    });
  }

  async run(packet) {
    return this._runPrompt({
      packet,
      prompt: buildExecutionPrompt(packet),
      tag: EXECUTION_TAG,
      schema: this.finalResponseSchema,
    });
  }
}

export function createExecutionRunnerFromEnv(overrides = {}) {
  const executionMode = overrides.executionMode || process.env.MINIONS_EXECUTION_MODE || "simulated";

  if (executionMode !== "agent-runner") {
    return null;
  }

  const configuredProvider = overrides.provider ?? process.env.MINIONS_PI_PROVIDER ?? null;
  const normalizedProvider = normalizePiProvider(configuredProvider);

  return new PiRpcRunner({
    command: overrides.command || process.env.MINIONS_PI_COMMAND || "pi",
    provider: normalizedProvider,
    modelProvider: overrides.modelProvider || normalizedProvider,
    model: overrides.model || process.env.MINIONS_PI_MODEL || null,
    sessionDir: overrides.sessionDir || process.env.MINIONS_PI_SESSION_DIR || null,
    extraArgs:
      overrides.extraArgs ||
      (process.env.MINIONS_PI_ARGS
        ? process.env.MINIONS_PI_ARGS
            .split(/\s+/)
            .map((item) => item.trim())
            .filter(Boolean)
        : []),
    spawnImpl: overrides.spawnImpl,
    env: overrides.env,
  });
}
