import fs from "node:fs/promises";
import path from "node:path";

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function normalizeList(items) {
  return [...new Set((items || []).map((item) => String(item || "").trim()).filter(Boolean))];
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export class GsdTeamOrchestrator {
  constructor(options = {}) {
    this.executionRunner = options.executionRunner || null;
    this.teamName = options.teamName || process.env.MINIONS_GSD_TEAM || "gsd-execution";
    this.piRoot = options.piRoot || path.resolve(process.cwd(), ".pi");
    this.approximate = options.approximate ?? true;
  }

  async run(packet) {
    if (!this.executionRunner || typeof this.executionRunner.run !== "function") {
      throw new Error("GSD orchestration requires an execution runner");
    }

    const teamConfigPath = path.join(this.piRoot, "agents", "teams.yaml");
    const teamConfig = await readIfExists(teamConfigPath);
    const executorPrompt = await readIfExists(path.join(this.piRoot, "agents", "gsd-executor.md"));
    const verifierPrompt = await readIfExists(path.join(this.piRoot, "agents", "gsd-verifier.md"));

    const orchestrationContext = {
      mode: "gsd-team",
      teamName: this.teamName,
      approximate: this.approximate,
      teamConfigLoaded: Boolean(teamConfig),
      agentsReferenced: normalizeList([
        executorPrompt ? "gsd-executor" : "",
        verifierPrompt ? "gsd-verifier" : "",
      ]),
      notes: [
        this.approximate
          ? "Runtime GSD orchestration is currently a non-interactive approximation that preserves the Minions execution contract."
          : "Runtime GSD orchestration is active.",
      ],
    };

    const runnerPacket = {
      ...packet,
      context: {
        ...(packet.context || {}),
        orchestration: clone(orchestrationContext),
      },
    };

    const result = await this.executionRunner.run(runnerPacket);
    const final = result?.final && typeof result.final === "object" ? result.final : null;
    const notes = normalizeList([
      ...(Array.isArray(final?.notes) ? final.notes : []),
      ...orchestrationContext.notes,
      `GSD team selected: ${this.teamName}`,
      teamConfig ? `Loaded team config from ${teamConfigPath}` : "Team config not found; used default runtime team selection.",
    ]);

    return {
      ...result,
      provider: "gsd-team",
      orchestrated: true,
      orchestration: orchestrationContext,
      final: final
        ? {
            ...final,
            notes,
          }
        : final,
    };
  }
}

export function createGsdOrchestratorFromEnv(overrides = {}) {
  const orchestrationMode = overrides.orchestrationMode || process.env.MINIONS_ORCHESTRATION_MODE || "single-runner";

  if (orchestrationMode !== "gsd-team") {
    return null;
  }

  return new GsdTeamOrchestrator({
    executionRunner: overrides.executionRunner,
    teamName: overrides.teamName,
    piRoot: overrides.piRoot,
    approximate: overrides.approximate,
  });
}
