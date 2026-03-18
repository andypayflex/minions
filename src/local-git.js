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

export async function createLocalDeliveryBranch(repositoryPath, branchName) {
  await ensureLocalGitRepository(repositoryPath);

  const baseRefResult = await runGit(repositoryPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const baseRef = baseRefResult.stdout.trim();
  await runGit(repositoryPath, ["checkout", "-b", branchName]);

  return {
    name: branchName,
    baseRef,
  };
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
  const attributablePaths = [...currentPathSet].filter((path) => !baselinePathSet.has(path));
  const preExistingPaths = [...currentPathSet].filter((path) => baselinePathSet.has(path));

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
