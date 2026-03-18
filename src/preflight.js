import { execFile } from "node:child_process";

function runExecFile(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(
          Object.assign(new Error(stderr?.trim() || error.message || `command failed: ${command}`), {
            code: error.code,
            stdout,
            stderr,
          }),
        );
        return;
      }

      resolve({
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
      });
    });
  });
}

export function isRuntimeArtifactPath(filePath) {
  const normalized = String(filePath || "").trim().replace(/\\/g, "/");
  return normalized === ".tmp" || normalized.startsWith(".tmp/");
}

export function parseGitStatusEntries(stdout = "") {
  return String(stdout || "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({
      raw: line,
      path: line.slice(3),
      indexStatus: line[0],
      workTreeStatus: line[1],
    }));
}

export function filterRuntimeArtifactStatusEntries(entries = []) {
  return entries.filter((entry) => !isRuntimeArtifactPath(entry?.path));
}

export class GitHubPrPreflight {
  constructor(options = {}) {
    this.exec = options.exec || runExecFile;
    this.ghCommand = options.ghCommand || "gh";
    this.gitCommand = options.gitCommand || "git";
    this.env = options.env || process.env;
    this.requireCleanWorktree = options.requireCleanWorktree ?? true;
  }

  async checkRunStart(repositoryPath, options = {}) {
    return this.#check(repositoryPath, {
      requireCleanWorktree: options.requireCleanWorktree ?? this.requireCleanWorktree,
    });
  }

  async checkDelivery(repositoryPath, options = {}) {
    return this.#check(repositoryPath, {
      requireCleanWorktree: options.requireCleanWorktree ?? false,
    });
  }

  async check(repositoryPath) {
    return this.checkRunStart(repositoryPath);
  }

  async #check(repositoryPath, options = {}) {
    const requireCleanWorktree = options.requireCleanWorktree ?? true;
    const checks = [];
    const add = (name, ok, detail = null) => checks.push({ name, ok, detail });

    try {
      await this.exec(this.ghCommand, ["--version"], { cwd: repositoryPath, env: this.env });
      add("gh-installed", true);
    } catch (error) {
      add("gh-installed", false, error.message);
    }

    try {
      await this.exec(this.ghCommand, ["auth", "status"], { cwd: repositoryPath, env: this.env });
      add("gh-authenticated", true);
    } catch (error) {
      add("gh-authenticated", false, error.message);
    }

    try {
      const result = await this.exec(this.gitCommand, ["rev-parse", "--is-inside-work-tree"], {
        cwd: repositoryPath,
        env: this.env,
      });
      add("git-worktree", result.stdout.trim() === "true", result.stdout.trim());
    } catch (error) {
      add("git-worktree", false, error.message);
    }

    try {
      const result = await this.exec(this.gitCommand, ["remote", "get-url", "origin"], {
        cwd: repositoryPath,
        env: this.env,
      });
      add("git-origin-remote", Boolean(result.stdout.trim()), result.stdout.trim() || null);
    } catch (error) {
      add("git-origin-remote", false, error.message);
    }

    if (requireCleanWorktree) {
      try {
        const result = await this.exec(this.gitCommand, ["status", "--short"], {
          cwd: repositoryPath,
          env: this.env,
        });
        const entries = parseGitStatusEntries(result.stdout);
        const blockingEntries = filterRuntimeArtifactStatusEntries(entries);
        const clean = blockingEntries.length === 0;
        add(
          "git-worktree-clean",
          clean,
          clean
            ? "clean"
            : blockingEntries.length === entries.length
              ? "dirty"
              : "dirty (runtime artifacts ignored)",
        );
      } catch (error) {
        add("git-worktree-clean", false, error.message);
      }
    }

    const failedChecks = checks.filter((entry) => !entry.ok).map((entry) => entry.name);
    return {
      ok: failedChecks.length === 0,
      checks,
      failedChecks,
    };
  }
}

export function createGitHubPrPreflightFromEnv(overrides = {}) {
  const env = overrides.env || process.env;
  const configured = String(env.MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE || "").toLowerCase();
  const requireCleanWorktreeFromEnv = configured === "" ? true : !["0", "false", "no"].includes(configured);

  return new GitHubPrPreflight({
    exec: overrides.exec,
    ghCommand: overrides.ghCommand || env.MINIONS_GH_COMMAND || "gh",
    gitCommand: overrides.gitCommand || env.MINIONS_GIT_COMMAND || "git",
    env: overrides.env,
    requireCleanWorktree: overrides.requireCleanWorktree ?? requireCleanWorktreeFromEnv,
  });
}
