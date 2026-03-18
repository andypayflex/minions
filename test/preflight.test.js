import assert from "node:assert/strict";
import test from "node:test";

import { createGitHubPrPreflightFromEnv, GitHubPrPreflight } from "../src/preflight.js";

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

  const result = await preflight.check(process.cwd());
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

  const result = await preflight.check(process.cwd());
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

test("GitHubPrPreflight enforces clean worktree only when configured", async () => {
  const exec = createExec({
    "gh --version": { stdout: "gh version 2.0.0", stderr: "" },
    "gh auth status": { stdout: "logged in", stderr: "" },
    "git rev-parse --is-inside-work-tree": { stdout: "true\n", stderr: "" },
    "git remote get-url origin": { stdout: "https://github.com/example/repo.git\n", stderr: "" },
    "git status --short": { stdout: " M src/file.js\n", stderr: "" },
  });

  const allowed = new GitHubPrPreflight({ exec, requireCleanWorktree: false });
  const allowedResult = await allowed.check(process.cwd());
  assert.equal(allowedResult.ok, true);

  const required = new GitHubPrPreflight({ exec, requireCleanWorktree: true });
  const requiredResult = await required.check(process.cwd());
  assert.equal(requiredResult.ok, false);
  assert.equal(requiredResult.failedChecks.includes("git-worktree-clean"), true);
});
