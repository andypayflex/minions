import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { analyzeLocalRepositoryTarget } from "../src/local-repository.js";
import { MinionsPlatform } from "../src/minions.js";

async function withTempRepo(fn) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "minions-repo-"));

  try {
    await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
    await fs.mkdir(path.join(tempDir, "test"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({
        name: "fixture",
        scripts: {
          test: "node --test",
          lint: "eslint .",
        },
      }),
    );
    await fs.writeFile(path.join(tempDir, "src", "feature.js"), "export const value = 1;\n");
    await fs.writeFile(path.join(tempDir, "test", "feature.test.js"), "import assert from 'node:assert/strict';\n");

    await fn(tempDir);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test("analyzeLocalRepositoryTarget derives code surfaces and validation steps from disk", async () => {
  await withTempRepo(async (repositoryPath) => {
    const analyzed = analyzeLocalRepositoryTarget({
      repositoryId: "repo/fixture",
      teamId: "team-fixture",
      repositoryPath,
    });

    assert.equal(analyzed.metadata.packageJsonPresent, true);
    assert.equal(analyzed.files.some((file) => file.path === "src/feature.js"), true);
    assert.equal(analyzed.files.some((file) => file.type === "test"), true);
    assert.deepEqual(
      analyzed.validationSteps.map((step) => step.id),
      ["test", "lint"],
    );
  });
});

test("platform retrieveRepositoryContext uses real local repository analysis when repositoryPath is configured", async () => {
  await withTempRepo(async (repositoryPath) => {
    const platform = new MinionsPlatform();
    platform.onboardSupportedTarget({
      repositoryId: "repo/fixture",
      teamId: "team-fixture",
      repositoryPath,
    });

    const taskId = platform.submitTaskRequest(
      {
        title: "Analyze local repo",
        objective: "Read repository context from disk",
        repository: "repo/fixture",
        constraints: ["inspect actual files"],
        expectedOutcome: "repository metadata on the run",
        requestedActions: ["modify-code"],
      },
      {
        requesterIdentity: "engineer:aiden",
        entryPoint: "slack/minions",
      },
    ).taskRequestId;

    platform.validateMinimumRunReadiness(taskId);
    platform.classifyScope(taskId);
    platform.verifyInitiationPath(taskId);
    platform.evaluateAutonomyPolicy(taskId);

    const repositoryContext = platform.retrieveRepositoryContext(taskId);
    assert.equal(repositoryContext.ok, true);
    assert.equal(repositoryContext.repositoryContext.metadata.repositoryPath, repositoryPath);
    assert.equal(repositoryContext.repositoryContext.files.some((file) => file.path === "src/feature.js"), true);
  });
});
