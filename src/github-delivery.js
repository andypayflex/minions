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

export class GitHubCliDeliveryRunner {
  constructor(options = {}) {
    this.ghCommand = options.ghCommand || "gh";
    this.gitCommand = options.gitCommand || "git";
    this.env = options.env || process.env;
    this.execFileImpl = options.execFileImpl || execFile;
    this.defaultBaseBranch = options.defaultBaseBranch || null;
    this.defaultDraft = Boolean(options.defaultDraft);
  }

  _run(command, args, repositoryPath) {
    return new Promise((resolve, reject) => {
      this.execFileImpl(command, args, { cwd: repositoryPath, env: this.env }, (error, stdout, stderr) => {
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

  async publishPullRequest(options) {
    const repositoryPath = options.repositoryPath;
    const branchName = options.branchName;
    const baseBranch = options.baseBranch || this.defaultBaseBranch || "main";
    const title = options.title;
    const body = options.body;
    const draft = options.draft ?? this.defaultDraft;

    const pushResult = await this._run(this.gitCommand, ["push", "-u", "origin", branchName], repositoryPath);

    const createArgs = [
      "pr",
      "create",
      "--base",
      baseBranch,
      "--head",
      branchName,
      "--title",
      title,
      "--body",
      body,
    ];
    if (draft) {
      createArgs.push("--draft");
    }

    const createResult = await this._run(this.ghCommand, createArgs, repositoryPath);
    const createdUrl = createResult.stdout.trim().split(/\s+/).at(-1) || null;

    const viewResult = await this._run(
      this.ghCommand,
      ["pr", "view", branchName, "--json", "id,number,url,state,title,baseRefName,headRefName"],
      repositoryPath,
    );
    const detail = JSON.parse(viewResult.stdout);

    return {
      push: pushResult,
      pullRequest: {
        id: detail.id,
        number: detail.number,
        url: detail.url || createdUrl,
        state: detail.state,
        title: detail.title,
        baseRefName: detail.baseRefName,
        headRefName: detail.headRefName,
      },
    };
  }
}

export function createGitHubDeliveryRunnerFromEnv(overrides = {}) {
  const deliveryMode = overrides.deliveryMode || process.env.MINIONS_DELIVERY_MODE || "simulated";

  if (deliveryMode !== "github-pr") {
    return null;
  }

  return new GitHubCliDeliveryRunner({
    ghCommand: overrides.ghCommand || process.env.MINIONS_GH_COMMAND || "gh",
    gitCommand: overrides.gitCommand || process.env.MINIONS_GIT_COMMAND || "git",
    env: overrides.env,
    execFileImpl: overrides.execFileImpl,
    defaultBaseBranch: overrides.defaultBaseBranch || process.env.MINIONS_GITHUB_BASE_BRANCH || null,
    defaultDraft:
      overrides.defaultDraft ?? ["1", "true", "yes"].includes(String(process.env.MINIONS_GITHUB_PR_DRAFT || "").toLowerCase()),
  });
}
