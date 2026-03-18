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

export function buildCodexAnalysisPrompt(packet) {
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

export function buildCodexExecutionPrompt(packet) {
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
  ].join("\n");
}

export class CodexCliRunner {
  constructor(options = {}) {
    this.command = options.command || "codex";
    this.model = options.model || null;
    this.sandbox = options.sandbox || "workspace-write";
    this.fullAuto = options.fullAuto ?? this.sandbox === "workspace-write";
    this.env = options.env || process.env;
    this.spawnImpl = options.spawnImpl || spawn;
    this.analysisResponseSchema = options.analysisResponseSchema || ANALYSIS_RESPONSE_SCHEMA;
    this.finalResponseSchema = options.finalResponseSchema || FINAL_RESPONSE_SCHEMA;
  }

  async _runWithSchema({ packet, prompt, schema }) {
    if (!packet?.repository?.repositoryPath) {
      throw new Error("repository.repositoryPath is required for Codex CLI execution");
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "minions-codex-"));
    const schemaPath = path.join(tempDir, "final-response.schema.json");
    const outputPath = path.join(tempDir, "final-response.json");
    if (schema) {
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));
    }

    const args = [
      "exec",
      "-",
      "--json",
      ...(this.fullAuto ? ["--full-auto"] : []),
      "--skip-git-repo-check",
      "--ephemeral",
      ...(this.fullAuto ? [] : ["--sandbox", this.sandbox]),
      "--output-last-message",
      outputPath,
      "--cd",
      packet.repository.repositoryPath,
    ];

    if (schema) {
      args.splice(args.indexOf("--output-last-message"), 0, "--output-schema", schemaPath);
    }

    if (this.model) {
      args.push("--model", this.model);
    }

    let stdout = "";
    let stderr = "";

    try {
      const exitCode = await new Promise((resolve, reject) => {
        const child = this.spawnImpl(this.command, args, {
          cwd: packet.repository.repositoryPath,
          env: this.env,
          stdio: ["pipe", "pipe", "pipe"],
        });

        child.stdout?.on("data", (chunk) => {
          stdout += chunk.toString();
        });
        child.stderr?.on("data", (chunk) => {
          stderr += chunk.toString();
        });
        child.on("error", reject);
        child.on("close", resolve);
        child.stdin?.end(prompt);
      });

      let final = null;
      try {
        const output = await fs.readFile(outputPath, "utf8");
        if (schema) {
          final = parseJsonFile(output);
        } else {
          try {
            final = parseJsonFile(output);
          } catch {
            final = output.trim();
          }
        }
      } catch {
        final = null;
      }

      const ok = exitCode === 0 && (schema ? Boolean(final) : true);
      return {
        ok,
        exitCode,
        stdout,
        stderr,
        final,
        prompt,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async analyze(packet) {
    return this._runWithSchema({
      packet,
      prompt: buildCodexAnalysisPrompt(packet),
      schema: this.analysisResponseSchema,
    });
  }

  async run(packet) {
    return this._runWithSchema({
      packet,
      prompt: buildCodexExecutionPrompt(packet),
      schema: null,
    });
  }
}

export function createExecutionRunnerFromEnv(overrides = {}) {
  const executionMode = overrides.executionMode || process.env.MINIONS_EXECUTION_MODE || "simulated";

  if (executionMode !== "agent-runner") {
    return null;
  }

  return new CodexCliRunner({
    command: overrides.command || process.env.MINIONS_CODEX_COMMAND || "codex",
    model: overrides.model || process.env.MINIONS_CODEX_MODEL || null,
    sandbox: overrides.sandbox || process.env.MINIONS_CODEX_SANDBOX || "workspace-write",
    fullAuto:
      overrides.fullAuto ??
      (process.env.MINIONS_CODEX_FULL_AUTO === undefined
        ? undefined
        : process.env.MINIONS_CODEX_FULL_AUTO !== "false"),
    spawnImpl: overrides.spawnImpl,
    env: overrides.env,
  });
}
