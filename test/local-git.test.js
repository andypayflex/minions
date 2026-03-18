import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { execFile } from "node:child_process";

import { MinionsPlatform } from "../src/minions.js";
import {
  createLocalDeliveryBranch,
  createLocalDeliveryCommit,
  readWorkingTreeStatus,
} from "../src/local-git.js";

function runExecFile(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
      });
    });
  });
}

async function createTempGitRepo() {
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), "minions-local-git-"));
  await runExecFile("git", ["init", "-b", "main"], { cwd: repositoryPath });
  await runExecFile("git", ["config", "user.name", "Minions Test"], { cwd: repositoryPath });
  await runExecFile("git", ["config", "user.email", "minions@example.com"], { cwd: repositoryPath });
  await fs.mkdir(path.join(repositoryPath, "src"), { recursive: true });
  await fs.writeFile(
    path.join(repositoryPath, "package.json"),
    JSON.stringify({
      name: "local-git-target",
      private: true,
      type: "module",
      scripts: {
        test: "node --test",
      },
    }),
  );
  await fs.writeFile(path.join(repositoryPath, "src", "feature.js"), "export const feature = () => 'before';\n");
  await runExecFile("git", ["add", "-A"], { cwd: repositoryPath });
  await runExecFile("git", ["commit", "-m", "Initial commit"], { cwd: repositoryPath });
  return repositoryPath;
}

test("local git helpers create a branch and commit staged changes", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    const branch = await createLocalDeliveryBranch(repositoryPath, "minions/task-0001");
    assert.equal(branch.name, "minions/task-0001");
    assert.equal(branch.baseRef, "main");

    await fs.writeFile(path.join(repositoryPath, "src", "feature.js"), "export const feature = () => 'after';\n");
    const status = await readWorkingTreeStatus(repositoryPath);
    assert.equal(status.clean, false);
    assert.equal(status.entries[0].path, "src/feature.js");

    const commit = await createLocalDeliveryCommit(repositoryPath, "Minions: Update feature");
    assert.match(commit.commitSha, /^[0-9a-f]{40}$/);
    assert.deepEqual(commit.stagedFiles, ["src/feature.js"]);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("platform local-git delivery creates a real branch and commit for a completed run", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    const platform = new MinionsPlatform({
      clock: (() => {
        let tick = 0;
        return () => `2026-03-18T09:${String(tick++).padStart(2, "0")}:00.000Z`;
      })(),
    });

    platform.onboardSupportedTarget({
      repositoryId: "repo/local-git-target",
      teamId: "team-core",
      repositoryPath,
      deliveryMode: "local-git",
      metadata: {
        language: "javascript",
        defaultBranch: "main",
      },
    });
    platform.registerLinkedContext({
      system: "github",
      id: "123",
      summary: "Keep the change narrow and reviewable.",
      topic: "delivery",
    });
    platform.registerLinkedContext({
      system: "slack",
      id: "456",
      summary: "Preserve validation evidence in delivery output.",
      topic: "validation",
    });

    const taskId = platform.submitTaskRequest(
      {
        title: "Update the feature implementation",
        objective: "Change the local repo feature and prepare delivery output",
        repository: "repo/local-git-target",
        constraints: ["keep it deterministic", "add tests if needed"],
        expectedOutcome: "working branch and commit",
        linkedItems: [
          { system: "github", id: "123" },
          { system: "slack", id: "456" },
        ],
        requestedActions: ["modify-code", "create-tests"],
      },
      {
        requesterIdentity: "engineer:aiden",
        entryPoint: "slack/minions",
      },
    ).taskRequestId;

    assert.equal(platform.validateMinimumRunReadiness(taskId).result, "ready");
    assert.equal(platform.classifyScope(taskId).result, "in-scope");
    assert.equal(platform.verifyInitiationPath(taskId).allowed, true);
    assert.equal(platform.evaluateAutonomyPolicy(taskId).outcome, "fully-autonomous");
    assert.equal(platform.retrieveRepositoryContext(taskId).ok, true);
    assert.equal(platform.retrieveRelatedWorkContext(taskId).ok, true);
    assert.equal(platform.buildWorkingContext(taskId).ok, true);
    assert.equal(platform.identifyRelevantChangeSurface(taskId).ok, true);
    assert.equal(platform.evaluateCriticalContext(taskId).result, "ready");

    const startup = platform.startIsolatedRunEnvironment(taskId);
    const runId = startup.runId;
    await fs.writeFile(path.join(repositoryPath, "src", "feature.js"), "export const feature = () => 'after';\n");
    assert.equal(
      platform.executeRepositoryChanges(runId, {
        changes: [
          {
            path: "src/feature.js",
            action: "modify",
            summary: "Updated src/feature.js for delivery",
          },
        ],
      }).ok,
      true,
    );
    assert.equal(platform.runRepositoryValidation(runId).ok, true);
    assert.equal(platform.captureStructuredValidationEvidence(runId).ok, true);
    assert.equal(platform.determineCompletionStatus(runId).state, "successful");

    const branch = await platform.createDeliveryBranchAsync(runId);
    assert.equal(branch.ok, true);
    assert.equal(branch.branch.name, `minions/${taskId}`);
    assert.equal(branch.branch.mode, "local-git");

    const pullRequest = await platform.publishPullRequestAsync(runId);
    assert.equal(pullRequest.ok, true);
    assert.equal(pullRequest.pullRequest.mode, "local-git");
    assert.match(pullRequest.pullRequest.commitSha, /^[0-9a-f]{40}$/);
    assert.deepEqual(pullRequest.pullRequest.stagedFiles, ["src/feature.js"]);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});
