import { createApp } from "../src/server.js";

process.env.MINIONS_DEFAULT_REPOSITORY_PATH = process.env.REPO_PATH;
process.env.MINIONS_EXECUTION_MODE = "simulated";
process.env.MINIONS_DELIVERY_MODE = "github-pr";
process.env.MINIONS_GITHUB_PR_REQUIRE_CLEAN_WORKTREE = "false";
process.env.MINIONS_GH_COMMAND = "true";

const { platform } = createApp();
const submit = platform.submitTaskRequest(
  {
    title: "Live preflight policy check",
    objective: "Verify github-pr startup respects disabled clean-worktree policy",
    repository: "repo/minions-app",
    constraints: ["keep deterministic"],
    expectedOutcome: "environment startup succeeds despite dirty source repo when policy disabled",
  },
  { requesterIdentity: "engineer:web-user", entryPoint: "slack/minions" },
);
const taskId = submit.taskRequestId;
const result = await platform.runAutonomousFlow(taskId);
const run = platform.getRun(result.runId);
console.log(
  JSON.stringify(
    {
      ok: result.ok,
      stage: result.stage || null,
      runId: result.runId,
      environmentStatus: run.environment?.status || null,
      environmentRepoPath: run.environment?.repositoryPath || null,
      worktreePath: run.environment?.worktree?.path || null,
      ledgerTail: (run.ledger || []).slice(-12),
      deliveryStopPoint: run.delivery?.stopPoint || null,
      failure: result.detail?.failure || null,
    },
    null,
    2,
  ),
);
