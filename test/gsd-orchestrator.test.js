import assert from "node:assert/strict";
import test from "node:test";

import { GsdTeamOrchestrator } from "../src/gsd-orchestrator.js";

test("GsdTeamOrchestrator wraps the execution runner and preserves Minions result contract", async () => {
  const orchestrator = new GsdTeamOrchestrator({
    executionRunner: {
      async run(packet) {
        assert.equal(packet.context.orchestration.mode, "gsd-team");
        return {
          ok: true,
          provider: "pi-rpc",
          modelProvider: "anthropic",
          exitCode: 0,
          stdout: "",
          stderr: "",
          final: {
            outcome: "completed",
            summary: "Implemented via orchestrated flow.",
            changedFiles: ["src/feature.js"],
            commandsRun: ["bun test"],
            notes: ["Runner completed successfully."],
          },
        };
      },
    },
    approximate: true,
  });

  const result = await orchestrator.run({
    task: { id: "task-1", title: "Title", objective: "Obj", constraints: [], expectedOutcome: "Done" },
    repository: { repositoryId: "repo/test", repositoryPath: process.cwd() },
    context: {},
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "gsd-team");
  assert.equal(result.orchestrated, true);
  assert.equal(result.final.changedFiles[0], "src/feature.js");
  assert.equal(result.final.notes.some((note) => note.includes("GSD team selected")), true);
});
