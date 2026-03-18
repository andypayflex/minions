import { execFileSync } from "node:child_process";

function parseNumericSuffix(value, prefix) {
  const match = String(value || "").match(new RegExp(`^${prefix}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
}

function parseBranchNumericSuffix(branchName) {
  const match = String(branchName || "").match(/^minions\/task-(\d{4,})$/);
  return match ? Number(match[1]) : 0;
}

function runGit(repositoryPath, args) {
  return execFileSync("git", args, {
    cwd: repositoryPath,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function runGh(repositoryPath, args) {
  return execFileSync("gh", args, {
    cwd: repositoryPath,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

export function inferSequenceSeedsFromRepository(repositoryPath) {
  const seeds = {
    task: 0,
    run: 0,
    branch: 0,
    pr: 0,
  };

  try {
    const branches = runGit(repositoryPath, ["branch", "--format", "%(refname:short)"])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const branch of branches) {
      const number = parseBranchNumericSuffix(branch);
      if (number > 0) {
        seeds.task = Math.max(seeds.task, number);
        seeds.branch = Math.max(seeds.branch, number);
      }
    }
  } catch {
    // Ignore local branch discovery failures.
  }

  try {
    const pulls = JSON.parse(runGh(repositoryPath, ["pr", "list", "--state", "all", "--limit", "100", "--json", "number,headRefName"]));
    for (const pull of pulls) {
      seeds.pr = Math.max(seeds.pr, Number(pull.number) || 0);
      const branchNumber = parseBranchNumericSuffix(pull.headRefName);
      if (branchNumber > 0) {
        seeds.task = Math.max(seeds.task, branchNumber);
        seeds.branch = Math.max(seeds.branch, branchNumber);
      }
    }
  } catch {
    // Ignore GitHub discovery failures when gh is unavailable or unauthenticated.
  }

  seeds.run = seeds.task;
  return seeds;
}

export function mergeSequenceSeeds(...seedSets) {
  const merged = {
    task: 0,
    run: 0,
    branch: 0,
    pr: 0,
  };

  for (const seedSet of seedSets) {
    if (!seedSet) {
      continue;
    }

    for (const key of Object.keys(merged)) {
      merged[key] = Math.max(merged[key], Number(seedSet[key]) || 0);
    }
  }

  return merged;
}

export function inferSequenceSeedsFromMemory(platform) {
  const seeds = {
    task: 0,
    run: 0,
    branch: 0,
    pr: 0,
  };

  for (const task of platform.tasks.values()) {
    seeds.task = Math.max(seeds.task, parseNumericSuffix(task.id, "task"));
  }

  for (const run of platform.runs.values()) {
    seeds.run = Math.max(seeds.run, parseNumericSuffix(run.id, "run"));
    seeds.branch = Math.max(seeds.branch, parseNumericSuffix(run.delivery?.branch?.id, "branch"));
    seeds.pr = Math.max(seeds.pr, parseNumericSuffix(run.delivery?.pullRequest?.id, "pr"));
  }

  return seeds;
}
