import assert from "node:assert/strict";
import test from "node:test";

import {
  createGitHubPrPreflightFromEnv,
  GitHubPrPreflight,
  parseGitStatusEntries,
} from "../src/preflight.js";

function createExec(results = {}) {
  return async (command, args) => {
    const key = `${command} ${args.join(" ")}`;
    if (!(key in results)) {
      throw new Error(`unexpected command: ${key}`);
    }
    const value = results[key];
    if (value instanceof Error) {
      throw value;
    }
    return value;
  };
}

test("GitHubPrPreflight passes when gh auth and git origin checks succeed", async () => {
  const preflight = new GitHubPrPreflight({
    exec: createExec({
      "gh --version": { stdout: "gh version 2.0.0", stderr: "" },
      "gh auth status": { stdout: "logged in", stderr: "" },
      "git rev-parse --is-inside-work-tree": { stdout: "true\n", stderr: "" },
      "git remote get-url origin": { stdout: "https://github.com/example/repo.git\n", stderr: "" },
      "git status --short": { stdout: "", stderr: "" },
    }),
  });

  const result = await preflight.checkRunStart(process.cwd());
  assert.equal(result.ok, true);
  assert.deepEqual(result.failedChecks, []);
});

test("GitHubPrPreflight fails when gh auth is missing", async () => {
  const preflight = new GitHubPrPreflight({
    exec: createExec({
      "gh --version": { stdout: "gh version 2.0.0", stderr: "" },
      "gh auth status": new Error("not logged in"),
      "git rev-parse --is-inside-work-tree": { stdout: "true\n", stderr: "" },
      "git remote get-url origin": { stdout: "https://github.com/example/repo.git\n", stderr: "" },
      "git status --short": { stdout: "", stderr: "" },
    }),
  });

  const result = await preflight.checkRunStart(process.cwd());
  assert.equal(result.ok, false);
  assert.equal(result.failedChecks.includes("gh-authenticated"), true);
});

test("createGitHubPrPreflightFromEnv requires clean worktree by default and allows explicit disable", () => {
  const requiredByDefault = createGitHubPrPreflightFromEnv({ env: {} });
  assert.equal(requiredByDefault.requireCleanWorktree, true);

  const disabled = createGitHubPrPreflightFromEnv({
    env: { MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE: "false" },
  });
  assert.equal(disabled.requireCleanWorktree, false);
});

test("run-start preflight fails on dirty non-runtime files", async () => {
  const exec = createExec({
    "gh --version": { stdout: "gh version 2.0.0", stderr: "" },
    "gh auth status": { stdout: "logged in", stderr: "" },
    "git rev-parse --is-inside-work-tree": { stdout: "true\n", stderr: "" },
    "git remote get-url origin": { stdout: "https://github.com/example/repo.git\n", stderr: "" },
    "git status --short": { stdout: " M src/file.js\n", stderr: "" },
  });

  const required = new GitHubPrPreflight({ exec, requireCleanWorktree: true });
  const result = await required.checkRunStart(process.cwd());
  assert.equal(result.ok, false);
  assert.equal(result.failedChecks.includes("git-worktree-clean"), true);
});

test("run-start preflight ignores .tmp runtime artifacts", async () => {
  const exec = createExec({
    "gh --version": { stdout: "gh version 2.0.0", stderr: "" },
    "gh auth status": { stdout: "logged in", stderr: "" },
    "git rev-parse --is-inside-work-tree": { stdout: "true\n", stderr: "" },
    "git remote get-url origin": { stdout: "https://github.com/example/repo.git\n", stderr: "" },
    "git status --short": { stdout: "?? .tmp/session.json\n", stderr: "" },
  });

  const required = new GitHubPrPreflight({ exec, requireCleanWorktree: true });
  const result = await required.checkRunStart(process.cwd());
  assert.equal(result.ok, true);
  assert.equal(result.failedChecks.includes("git-worktree-clean"), false);
});

test("delivery preflight allows dirty repo after execution", async () => {
  const exec = createExec({
    "gh --version": { stdout: "gh version 2.0.0", stderr: "" },
    "gh auth status": { stdout: "logged in", stderr: "" },
    "git rev-parse --is-inside-work-tree": { stdout: "true\n", stderr: "" },
    "git remote get-url origin": { stdout: "https://github.com/example/repo.git\n", stderr: "" },
    "git status --short": { stdout: " M src/file.js\n", stderr: "" },
  });

  const preflight = new GitHubPrPreflight({ exec, requireCleanWorktree: true });
  const result = await preflight.checkDelivery(process.cwd());
  assert.equal(result.ok, true);
  assert.equal(result.failedChecks.includes("git-worktree-clean"), false);
  assert.equal(result.checks.some((entry) => entry.name === "git-worktree-clean"), false);
});

test("parseGitStatusEntries preserves .tmp paths for filtering", () => {
  const entries = parseGitStatusEntries(" M src/file.js\n?? .tmp/run/log.txt\n");
  assert.deepEqual(
    entries.map((entry) => entry.path),
    ["src/file.js", ".tmp/run/log.txt"],
  );
});
