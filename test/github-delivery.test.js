import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { execFile } from "node:child_process";

import { GitHubCliDeliveryRunner } from "../src/github-delivery.js";
import { MinionsPlatform } from "../src/minions.js";
import { createGitHubPrPreflightFromEnv } from "../src/preflight.js";

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
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), "minions-github-pr-"));
  await runExecFile("git", ["init", "-b", "main"], { cwd: repositoryPath });
  await runExecFile("git", ["config", "user.name", "Minions Test"], { cwd: repositoryPath });
  await runExecFile("git", ["config", "user.email", "minions@example.com"], { cwd: repositoryPath });
  await fs.mkdir(path.join(repositoryPath, "src"), { recursive: true });
  await fs.writeFile(
    path.join(repositoryPath, "package.json"),
    JSON.stringify({
      name: "github-pr-target",
      private: true,
      type: "module",
      scripts: { test: "node --test" },
    }),
  );
  await fs.writeFile(path.join(repositoryPath, "src", "feature.js"), "export const feature = () => 'before';\n");
  await runExecFile("git", ["add", "-A"], { cwd: repositoryPath });
  await runExecFile("git", ["commit", "-m", "Initial commit"], { cwd: repositoryPath });

  const remotePath = await fs.mkdtemp(path.join(os.tmpdir(), "minions-github-pr-remote-"));
  await runExecFile("git", ["init", "--bare"], { cwd: remotePath });
  await runExecFile("git", ["remote", "add", "origin", remotePath], { cwd: repositoryPath });
  await runExecFile("git", ["push", "-u", "origin", "main"], { cwd: repositoryPath });

  return repositoryPath;
}

function createMockExecFile() {
  const calls = [];
  const mock = (command, args, options, callback) => {
    calls.push({ command, args, cwd: options.cwd });

    if (command === "git" && args[0] === "push") {
      callback(null, "branch pushed\n", "");
      return;
    }

    if (command === "gh" && args[0] === "pr" && args[1] === "create") {
      callback(null, "https://github.com/andypayflex/minions/pull/12\n", "");
      return;
    }

    if (command === "gh" && args[0] === "pr" && args[1] === "view") {
      callback(
        null,
        JSON.stringify({
          id: "PR_kwDOExample",
          number: 12,
          url: "https://github.com/andypayflex/minions/pull/12",
          state: "OPEN",
          title: "Minions: Demo",
          baseRefName: "main",
          headRefName: "minions/task-0001",
        }),
        "",
      );
      return;
    }

    callback(new Error(`unexpected command: ${command} ${args.join(" ")}`));
  };

  return { mock, calls };
}

async function prepareGithubPrTask(platform, repositoryPath, title = "Update the feature implementation") {
  platform.onboardSupportedTarget({
    repositoryId: "repo/github-pr-target",
    teamId: "team-core",
    repositoryPath,
    deliveryMode: "github-pr",
    metadata: {
      language: "javascript",
      defaultBranch: "main",
    },
  });
  platform.registerLinkedContext({
    system: "github",
    id: "123",
    summary: "Keep the delivery reviewable.",
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
      title,
      objective: "Change the local repo feature and publish a PR",
      repository: "repo/github-pr-target",
      constraints: ["keep it deterministic", "add tests if needed"],
      expectedOutcome: "working branch, commit, and GitHub PR",
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

  return taskId;
}

test("GitHubCliDeliveryRunner pushes the branch and captures the created PR metadata", async () => {
  const { mock, calls } = createMockExecFile();
  const runner = new GitHubCliDeliveryRunner({
    execFileImpl: mock,
  });

  const result = await runner.publishPullRequest({
    repositoryPath: "/tmp/minions",
    branchName: "minions/task-0001",
    baseBranch: "main",
    title: "Minions: Demo",
    body: "Demo body",
  });

  assert.equal(result.pullRequest.number, 12);
  assert.equal(result.pullRequest.url, "https://github.com/andypayflex/minions/pull/12");
  assert.deepEqual(
    calls.map((entry) => [entry.command, entry.args[0], entry.args[1]]),
    [
      ["git", "push", "-u"],
      ["gh", "pr", "create"],
      ["gh", "pr", "view"],
    ],
  );
});

test("platform github-pr delivery publishes a PR through the configured runner", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    const preflightCalls = [];
    const platform = new MinionsPlatform({
      githubPrPreflight: {
        async checkRunStart() {
          preflightCalls.push("run-start");
          return {
            ok: true,
            checks: [],
            failedChecks: [],
          };
        },
        async checkDelivery() {
          preflightCalls.push("delivery");
          return {
            ok: true,
            checks: [],
            failedChecks: [],
          };
        },
      },
      githubDeliveryRunner: {
        async publishPullRequest(options) {
          return {
            pullRequest: {
              id: "PR_mock",
              number: 12,
              url: "https://github.com/andypayflex/minions/pull/12",
              state: "OPEN",
              title: options.title,
              baseRefName: options.baseBranch,
              headRefName: options.branchName,
            },
          };
        },
      },
    });

    const taskId = await prepareGithubPrTask(platform, repositoryPath);

    const startup = await platform.startIsolatedRunEnvironment(taskId);
    const runId = startup.runId;
    const runRepositoryPath = startup.environment.repositoryPath;
    assert.deepEqual(preflightCalls, ["run-start"]);
    assert.notEqual(runRepositoryPath, repositoryPath);
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

    const pullRequest = await platform.publishPullRequestAsync(runId);
    assert.equal(pullRequest.ok, true);
    assert.deepEqual(preflightCalls, ["run-start", "delivery"]);
    assert.equal(pullRequest.pullRequest.mode, "github-pr");
    assert.equal(platform.runs.get(runId).delivery.stopPoint.stage, "delivery");
    assert.equal(pullRequest.pullRequest.github.number, 12);
    assert.equal(pullRequest.pullRequest.github.url, "https://github.com/andypayflex/minions/pull/12");
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("github-pr run startup blocks on dirty non-runtime files but ignores .tmp artifacts", async () => {
  const repositoryPath = await createTempGitRepo();

  try {
    const platform = new MinionsPlatform({
      githubPrPreflight: createGitHubPrPreflightFromEnv({
        env: {
          ...process.env,
          MINIONS_GH_COMMAND: "true",
          MINIONS_GIT_COMMAND: "git",
          MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE: "true",
        },
      }),
    });

    await fs.mkdir(path.join(repositoryPath, ".tmp"), { recursive: true });
    await fs.writeFile(path.join(repositoryPath, ".tmp", "session.json"), "{}\n");

    const taskId = await prepareGithubPrTask(platform, repositoryPath);
    const allowedStartup = await platform.startIsolatedRunEnvironment(taskId);
    if (!allowedStartup.ok) {
      assert.fail(JSON.stringify(allowedStartup, null, 2));
    }
    assert.equal(allowedStartup.ok, true);

    await fs.writeFile(path.join(repositoryPath, "README.md"), "dirty\n");

    const secondTaskId = await prepareGithubPrTask(platform, repositoryPath, "Second update");
    const blockedStartup = await platform.startIsolatedRunEnvironment(secondTaskId);
    assert.equal(blockedStartup.ok, false);
    assert.equal(blockedStartup.preflight.failedChecks.includes("git-worktree-clean"), true);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});
