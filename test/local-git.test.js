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
  createRunWorktree,
  ensureLocalBranch,
  readCurrentBranch,
  readWorkingTreeStatus,
  removeRunWorktree,
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

    const commit = await createLocalDeliveryCommit(repositoryPath, "Minions: Update feature", ["src/feature.js"]);
    assert.match(commit.commitSha, /^[0-9a-f]{40}$/);
    assert.deepEqual(commit.stagedFiles, ["src/feature.js"]);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("local git helper stages only delivery-scoped files", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    await createLocalDeliveryBranch(repositoryPath, "minions/task-0002");
    await fs.writeFile(path.join(repositoryPath, "src", "feature.js"), "export const feature = () => 'after';\n");
    await fs.writeFile(path.join(repositoryPath, "package.json"), '{"name":"github-pr-target","private":true}\n');

    const commit = await createLocalDeliveryCommit(repositoryPath, "Minions: Scoped commit", ["src/feature.js"]);
    assert.deepEqual(commit.stagedFiles, ["src/feature.js"]);

    const status = await readWorkingTreeStatus(repositoryPath);
    assert.equal(status.entries.some((entry) => entry.path === "package.json"), true);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("local git helpers create and remove an isolated run worktree", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    const sourceBranchBefore = await readCurrentBranch(repositoryPath);
    const worktree = await createRunWorktree(repositoryPath, "minions/task-worktree");
    assert.match(worktree.path, /run-/);
    assert.equal(worktree.sourceBranch, "main");
    assert.equal(await readCurrentBranch(repositoryPath), sourceBranchBefore);
    assert.equal(await readCurrentBranch(worktree.path), "minions/task-worktree");

    await fs.writeFile(path.join(worktree.path, "src", "feature.js"), "export const feature = () => 'worktree';\n");

    const sourceStatus = await readWorkingTreeStatus(repositoryPath);
    assert.equal(sourceStatus.clean, true);
    assert.equal(await readCurrentBranch(repositoryPath), "main");

    const worktreeStatus = await readWorkingTreeStatus(worktree.path);
    assert.equal(worktreeStatus.entries[0].path, "src/feature.js");

    await removeRunWorktree(worktree.path);
    await assert.rejects(() => fs.access(worktree.path));
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("ensureLocalBranch creates a branch ref without switching the source checkout", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    const beforeBranch = await readCurrentBranch(repositoryPath);
    const created = await ensureLocalBranch(repositoryPath, "minions/task-branch-only");
    assert.equal(created.name, "minions/task-branch-only");
    assert.equal(created.baseRef, "main");
    assert.equal(created.existed, false);
    assert.equal(await readCurrentBranch(repositoryPath), beforeBranch);

    const existing = await ensureLocalBranch(repositoryPath, "minions/task-branch-only");
    assert.equal(existing.existed, true);
    assert.equal(await readCurrentBranch(repositoryPath), beforeBranch);
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

    const startup = await platform.startIsolatedRunEnvironment(taskId);
    const runId = startup.runId;
    const runRepositoryPath = startup.environment.repositoryPath;
    assert.notEqual(runRepositoryPath, repositoryPath);
    assert.equal(await readCurrentBranch(repositoryPath), "main");
    assert.equal(await readCurrentBranch(runRepositoryPath), `minions/${taskId}`);
    await fs.writeFile(path.join(runRepositoryPath, "src", "feature.js"), "export const feature = () => 'after';\n");
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
    assert.equal(platform.runs.get(runId).delivery.stopPoint.stage, "delivery-branch");

    const pullRequest = await platform.publishPullRequestAsync(runId);
    assert.equal(pullRequest.ok, true);
    assert.equal(pullRequest.pullRequest.mode, "local-git");
    assert.match(pullRequest.pullRequest.commitSha, /^[0-9a-f]{40}$/);
    assert.deepEqual(pullRequest.pullRequest.stagedFiles, ["src/feature.js"]);
    assert.equal(platform.runs.get(runId).delivery.stopPoint.reason.includes("stops here"), true);

    platform._markRunDeliveredSuccessfully(platform.runs.get(runId));
    assert.equal(platform.runs.get(runId).currentOutcomeState, "successful");
    assert.equal(platform.runs.get(runId).progressState.currentStage, "delivery");
    assert.equal(platform.tasks.get(taskId).status, "delivery-complete");
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("runAutonomousFlow recovers timed-out agent execution from baseline delta and ignores runtime artifacts", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    await fs.mkdir(path.join(repositoryPath, ".tmp"), { recursive: true });
    await fs.writeFile(path.join(repositoryPath, "package.json"), '{"name":"preexisting-dirty"}\n');

    const platform = new MinionsPlatform({
      executionTimeoutMs: 25,
      executionRunner: {
        async analyze() {
          return {
            ok: true,
            exitCode: 0,
            stdout: "",
            stderr: "",
            final: {
              taskType: "code-change",
              shouldProceed: true,
              summary: "Update the feature with a small UI-facing refinement.",
              reasoning: "The task is narrow and should stay within src/feature.js.",
              relevantFiles: ["src/feature.js"],
              testFiles: [],
              notes: [],
            },
          };
        },
        async run(packet) {
          await fs.mkdir(path.join(packet.repository.repositoryPath, ".tmp"), { recursive: true });
          await fs.writeFile(path.join(packet.repository.repositoryPath, "src", "feature.js"), "export const feature = () => 'after';\n");
          await fs.writeFile(path.join(packet.repository.repositoryPath, ".tmp", "minions-e2e.log"), "runtime log\n");
          return new Promise(() => {});
        },
      },
    });

    platform.onboardSupportedTarget({
      repositoryId: "repo/local-git-target",
      teamId: "team-core",
      repositoryPath,
      executionMode: "agent-runner",
      deliveryMode: "local-git",
      validationSteps: [{ id: "unit-tests", command: "node --test" }],
      metadata: {
        language: "javascript",
        defaultBranch: "main",
      },
    });

    const taskId = platform.submitTaskRequest(
      {
        title: "Update the feature implementation",
        objective: "Change the local repo feature and prepare delivery output",
        repository: "repo/local-git-target",
        constraints: ["keep it deterministic", "add tests if needed"],
        expectedOutcome: "working branch and commit",
        linkedItems: [],
        requestedActions: ["modify-code", "create-tests"],
      },
      {
        requesterIdentity: "engineer:aiden",
        entryPoint: "slack/minions",
      },
    ).taskRequestId;

    const result = await platform.runAutonomousFlow(taskId);
    assert.equal(result.ok, true, JSON.stringify(result));

    const run = platform.runs.get(result.runId);
    assert.equal(run.execution.agentRun.recoveredFromWorktree, true);
    assert.deepEqual(run.execution.currentWorkState.changedFiles, ["src/feature.js"]);
    assert.equal(run.delivery.pullRequest.mode, "local-git");
    assert.match(run.delivery.pullRequest.commitSha, /^[0-9a-f]{40}$/);
    assert.deepEqual(run.delivery.pullRequest.stagedFiles, ["src/feature.js"]);
    assert.equal(run.delivery.branch.attributablePaths.includes(".tmp/minions-e2e.log"), false);
    assert.equal(run.delivery.branch.attributablePaths.includes("package.json"), false);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});
