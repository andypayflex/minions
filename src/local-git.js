import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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

async function runGit(repositoryPath, args) {
  return runExecFile("git", args, {
    cwd: repositoryPath,
    env: process.env,
  });
}

export async function ensureLocalGitRepository(repositoryPath) {
  const result = await runGit(repositoryPath, ["rev-parse", "--is-inside-work-tree"]);
  if (result.stdout.trim() !== "true") {
    throw new Error(`repository is not an initialized git work tree: ${repositoryPath}`);
  }
}

export async function readCurrentBranch(repositoryPath) {
  await ensureLocalGitRepository(repositoryPath);
  const result = await runGit(repositoryPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  return result.stdout.trim();
}

export async function resolveGitCommonDir(repositoryPath) {
  await ensureLocalGitRepository(repositoryPath);
  const result = await runGit(repositoryPath, ["rev-parse", "--git-common-dir"]);
  return path.resolve(repositoryPath, result.stdout.trim());
}

export async function createLocalDeliveryBranch(repositoryPath, branchName) {
  await ensureLocalGitRepository(repositoryPath);

  const baseRef = await readCurrentBranch(repositoryPath);
  await runGit(repositoryPath, ["checkout", "-b", branchName]);

  return {
    name: branchName,
    baseRef,
  };
}

export async function ensureLocalBranch(repositoryPath, branchName) {
  await ensureLocalGitRepository(repositoryPath);
  const baseRef = await readCurrentBranch(repositoryPath);
  const existing = await runGit(repositoryPath, ["branch", "--list", branchName]);

  if (existing.stdout.trim()) {
    await runGit(repositoryPath, ["checkout", branchName]);
    return {
      name: branchName,
      baseRef,
      existed: true,
    };
  }

  await runGit(repositoryPath, ["checkout", "-b", branchName]);
  return {
    name: branchName,
    baseRef,
    existed: false,
  };
}

export async function createRunWorktree(sourceRepositoryPath, branchName, options = {}) {
  await ensureLocalGitRepository(sourceRepositoryPath);
  const commonDir = await resolveGitCommonDir(sourceRepositoryPath);
  const worktreeRoot = options.worktreeRoot || path.join(commonDir, "minions-worktrees");
  await fs.mkdir(worktreeRoot, { recursive: true });

  const worktreePath = await fs.mkdtemp(path.join(worktreeRoot, "run-"));
  const sourceBranch = await readCurrentBranch(sourceRepositoryPath);

  try {
    await runGit(sourceRepositoryPath, ["worktree", "add", "-b", branchName, worktreePath]);
  } catch (error) {
    await fs.rm(worktreePath, { recursive: true, force: true });
    throw error;
  }

  return {
    path: worktreePath,
    branchName,
    sourceRepositoryPath,
    sourceBranch,
    commonDir,
    createdAt: new Date().toISOString(),
    cleanupStatus: "pending",
  };
}

export async function removeRunWorktree(worktreePath) {
  if (!worktreePath) {
    return;
  }

  try {
    await runGit(worktreePath, ["worktree", "remove", "--force", worktreePath]);
  } catch (error) {
    await fs.rm(worktreePath, { recursive: true, force: true });
    throw error;
  }
}

export async function readWorkingTreeStatus(repositoryPath) {
  await ensureLocalGitRepository(repositoryPath);
  const result = await runGit(repositoryPath, ["status", "--short"]);
  const entries = result.stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({
      raw: line,
      path: line.slice(3),
      indexStatus: line[0],
      workTreeStatus: line[1],
    }));

  return {
    clean: entries.length === 0,
    entries,
  };
}

export async function readHeadSha(repositoryPath) {
  await ensureLocalGitRepository(repositoryPath);
  const result = await runGit(repositoryPath, ["rev-parse", "HEAD"]);
  return result.stdout.trim();
}

export async function captureWorktreeBaseline(repositoryPath) {
  const status = await readWorkingTreeStatus(repositoryPath);
  const headSha = await readHeadSha(repositoryPath);
  const pathSet = [...new Set(status.entries.map((entry) => entry.path).filter(Boolean))];

  return {
    capturedAt: new Date().toISOString(),
    headSha,
    entries: status.entries,
    pathSet,
  };
}

export async function diffWorktreePathsFromBaseline(repositoryPath, baseline) {
  const status = await readWorkingTreeStatus(repositoryPath);
  const baselinePathSet = new Set(Array.isArray(baseline?.pathSet) ? baseline.pathSet.filter(Boolean) : []);
  const currentPathSet = new Set(status.entries.map((entry) => entry.path).filter(Boolean));
  const currentEntries = status.entries;
  const attributablePaths = [...currentPathSet].filter((filePath) => !baselinePathSet.has(filePath));
  const preExistingPaths = [...currentPathSet].filter((filePath) => baselinePathSet.has(filePath));

  return {
    clean: status.clean,
    currentEntries,
    attributablePaths,
    preExistingPaths,
  };
}

export async function createLocalDeliveryCommit(repositoryPath, message, scopedFiles = []) {
  await ensureLocalGitRepository(repositoryPath);

  const status = await readWorkingTreeStatus(repositoryPath);
  if (status.clean) {
    throw new Error("repository has no local changes to commit");
  }

  const files = [...new Set(scopedFiles.map((file) => String(file || "").trim()).filter(Boolean))];
  if (files.length === 0) {
    throw new Error("repository has no delivery-scoped files to commit");
  }

  await runGit(repositoryPath, ["add", "--", ...files]);
  const staged = await runGit(repositoryPath, ["diff", "--cached", "--name-only", "--", ...files]);
  const stagedFiles = staged.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (stagedFiles.length === 0) {
    throw new Error("repository has no staged delivery-scoped changes to commit");
  }

  await runGit(repositoryPath, ["commit", "-m", message]);

  const head = await runGit(repositoryPath, ["rev-parse", "HEAD"]);
  return {
    commitSha: head.stdout.trim(),
    stagedFiles,
  };
}
