import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { MinionsPlatform } from "../src/minions.js";
import { createGitHubPrPreflightFromEnv } from "../src/preflight.js";

const execFileAsync = promisify(execFile);

async function git(repositoryPath, args) {
  await execFileAsync("git", args, { cwd: repositoryPath });
}

async function createTempGitRepo() {
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), "minions-github-pr-policy-"));
  await fs.mkdir(path.join(repositoryPath, "src"), { recursive: true });
  await fs.writeFile(path.join(repositoryPath, "src", "feature.js"), "export const feature = () => 'before';\n");
  await fs.writeFile(path.join(repositoryPath, "package.json"), '{"name":"github-pr-policy-test","private":true}\n');
  await git(repositoryPath, ["init", "-b", "main"]);
  await git(repositoryPath, ["config", "user.name", "Minions Test"]);
  await git(repositoryPath, ["config", "user.email", "minions@example.com"]);
  await git(repositoryPath, ["add", "."]);
  await git(repositoryPath, ["commit", "-m", "Initial commit"]);
  await git(repositoryPath, ["remote", "add", "origin", "https://github.com/example/repo.git"]);
  return repositoryPath;
}

test("runAutonomousFlow honors disabled clean-worktree preflight policy for github-pr delivery", async () => {
  const repositoryPath = await createTempGitRepo();
  const ghCalls = [];
  const deliveryCalls = [];

  try {
    await fs.writeFile(path.join(repositoryPath, "package.json"), '{"name":"github-pr-policy-test","private":true,"dirty":true}\n');

    const preflight = createGitHubPrPreflightFromEnv({
      env: {
        MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE: "false",
      },
      exec: async (command, args, options = {}) => {
        if (command === "gh") {
          ghCalls.push({ command, args, cwd: options.cwd });
          if (args.join(" ") === "--version") {
            return { stdout: "gh version 2.0.0\n", stderr: "" };
          }
          if (args.join(" ") === "auth status") {
            return { stdout: "logged in\n", stderr: "" };
          }
        }

        if (command === "git") {
          const key = args.join(" ");
          if (key === "rev-parse --is-inside-work-tree") {
            return { stdout: "true\n", stderr: "" };
          }
          if (key === "remote get-url origin") {
            return { stdout: "https://github.com/example/repo.git\n", stderr: "" };
          }
          if (key === "status --short") {
            return { stdout: " M package.json\n", stderr: "" };
          }
        }

        throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
      },
    });

    const platform = new MinionsPlatform({
      githubPrPreflight: preflight,
      githubDeliveryRunner: {
        async publishPullRequest(options) {
          deliveryCalls.push(options);
          return {
            pullRequest: {
              id: "PR_policy",
              number: 77,
              url: "https://github.com/example/repo/pull/77",
              state: "OPEN",
              title: options.title,
              baseRefName: options.baseBranch,
              headRefName: options.branchName,
            },
          };
        },
      },
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
              summary: "Update the feature implementation.",
              reasoning: "Small isolated change in src/feature.js.",
              relevantFiles: ["src/feature.js"],
              testFiles: [],
              notes: [],
            },
          };
        },
        async run(packet) {
          await fs.writeFile(path.join(packet.repository.repositoryPath, "src", "feature.js"), "export const feature = () => 'after';\n");
          return {
            ok: true,
            exitCode: 0,
            stdout: "",
            stderr: "",
            final: {
              summary: "Updated the feature implementation.",
              changedFiles: ["src/feature.js"],
              commandsRun: [],
              notes: [],
              outcome: "completed",
            },
          };
        },
      },
    });

    platform.onboardSupportedTarget({
      repositoryId: "repo/github-pr-policy-target",
      teamId: "team-core",
      repositoryPath,
      executionMode: "agent-runner",
      deliveryMode: "github-pr",
      validationSteps: [],
      metadata: {
        language: "javascript",
        defaultBranch: "main",
      },
    });

    const taskId = platform.submitTaskRequest(
      {
        title: "Update the feature implementation",
        objective: "Change the local repo feature and publish a PR even when the source repo is dirty",
        repository: "repo/github-pr-policy-target",
        constraints: ["keep it deterministic"],
        expectedOutcome: "working branch, commit, and GitHub PR",
      },
      {
        requesterIdentity: "engineer:aiden",
        entryPoint: "slack/minions",
      },
    ).taskRequestId;

    const result = await platform.runAutonomousFlow(taskId);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.pullRequest.mode, "github-pr");
    assert.equal(result.pullRequest.github.number, 77);
    assert.equal(deliveryCalls.length, 1);
    assert.equal(ghCalls.length, 4);

    const run = platform.getRun(result.runId);
    const preflightLedger = run.ledger.filter((entry) => entry.eventType === "github-pr-preflight-run-start-checked");
    assert.equal(preflightLedger.length, 1);
    assert.equal(preflightLedger[0].detail.ok, true);
    assert.equal(preflightLedger[0].detail.failedChecks.length, 0);
    const cleanCheck = preflightLedger[0].detail.checks.find((check) => check.name === "git-worktree-clean");
    assert.equal(cleanCheck, undefined);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});
