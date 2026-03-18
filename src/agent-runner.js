import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
    "- Return only the final JSON object that matches the required schema.",
  ].join("\n");
}

export class CodexCliRunner {
  constructor(options = {}) {
    this.command = options.command || "codex";
    this.model = options.model || null;
    this.sandbox = options.sandbox || "workspace-write";
    this.env = options.env || process.env;
    this.spawnImpl = options.spawnImpl || spawn;
    this.finalResponseSchema = options.finalResponseSchema || FINAL_RESPONSE_SCHEMA;
  }

  async run(packet) {
    if (!packet?.repository?.repositoryPath) {
      throw new Error("repository.repositoryPath is required for Codex CLI execution");
    }

    const prompt = buildCodexExecutionPrompt(packet);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "minions-codex-"));
    const schemaPath = path.join(tempDir, "final-response.schema.json");
    const outputPath = path.join(tempDir, "final-response.json");
    await fs.writeFile(schemaPath, JSON.stringify(this.finalResponseSchema, null, 2));

    const args = [
      "exec",
      "-",
      "--json",
      "--skip-git-repo-check",
      "--ephemeral",
      "--sandbox",
      this.sandbox,
      "--output-schema",
      schemaPath,
      "--output-last-message",
      outputPath,
      "--cd",
      packet.repository.repositoryPath,
    ];

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
        final = parseJsonFile(await fs.readFile(outputPath, "utf8"));
      } catch {
        final = null;
      }

      const ok = exitCode === 0 && Boolean(final);
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
    spawnImpl: overrides.spawnImpl,
    env: overrides.env,
  });
}
