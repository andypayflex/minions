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

export async function createLocalDeliveryCommit(repositoryPath, message) {
  await ensureLocalGitRepository(repositoryPath);

  const status = await readWorkingTreeStatus(repositoryPath);
  if (status.clean) {
    throw new Error("repository has no local changes to commit");
  }

  await runGit(repositoryPath, ["add", "-A"]);
  const staged = await runGit(repositoryPath, ["diff", "--cached", "--name-only"]);
  const stagedFiles = staged.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await runGit(repositoryPath, ["commit", "-m", message]);

  const head = await runGit(repositoryPath, ["rev-parse", "HEAD"]);
  return {
    commitSha: head.stdout.trim(),
    stagedFiles,
  };
}
