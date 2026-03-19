import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createExecutionRunnerFromEnv } from "./agent-runner.js";
import { PiSubscriptionAuthManager } from "./pi-auth.js";
import { createAzureDevOpsClientFromEnv, mapAzureWorkItemToTaskPayload } from "./azure-devops.js";
import { createGitHubDeliveryRunnerFromEnv } from "./github-delivery.js";
import { createGsdOrchestratorFromEnv } from "./gsd-orchestrator.js";
import { MinionsPlatform } from "./minions.js";
import { createGitHubPrPreflightFromEnv } from "./preflight.js";
import { inferSequenceSeedsFromRepository } from "./repository-sequence.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

function seedPlatform(platform, runtime = {}) {
  const orchestrationMode = process.env.MINIONS_ORCHESTRATION_MODE || "single-runner";
  platform.onboardSupportedTarget({
    repositoryId: "repo/minions-app",
    teamId: "team-core",
    repositoryPath: process.env.MINIONS_DEFAULT_REPOSITORY_PATH || process.cwd(),
    executionMode: process.env.MINIONS_EXECUTION_MODE || "simulated",
    deliveryMode: process.env.MINIONS_DELIVERY_MODE || "simulated",
    orchestrator: orchestrationMode === "gsd-team" ? runtime.orchestrator || null : null,
    metadata: {
      language: "javascript",
      defaultBranch: "main",
      visibility: "internal",
    },
  });

  platform.registerLinkedContext({
    system: "github",
    id: "123",
    summary: "Keep autonomous PR output deterministic and reviewable.",
    topic: "delivery",
  });
  platform.registerLinkedContext({
    system: "slack",
    id: "456",
    summary: "The team wants explicit failure summaries and operator visibility.",
    topic: "failure-handling",
  });
  platform.registerLinkedContext({
    system: "azure-devops",
    id: "789",
    summary: "Current feature request tracks the intake and validation milestone.",
    topic: "planning",
  });
}

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    req.on("data", (chunk) => {
      buffer += chunk;
    });
    req.on("end", () => {
      if (!buffer) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(buffer));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function buildTaskPayload(body) {
  return {
    title: body.title,
    objective: body.objective,
    repository: body.repository || "repo/minions-app",
    constraints: Array.isArray(body.constraints)
      ? body.constraints
      : String(body.constraints || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
    expectedOutcome: body.expectedOutcome,
    linkedItems: body.linkedItems || [
      { system: "github", id: "123" },
      { system: "slack", id: "456" },
    ],
    requestedActions: body.requestedActions || ["modify-code", "create-tests"],
  };
}

function buildAzureTaskPayload(body, workItem) {
  return mapAzureWorkItemToTaskPayload(workItem, {
    repository: body.repository,
    repositoryFieldName: process.env.AZURE_DEVOPS_REPOSITORY_FIELD,
    requestedActions: body.requestedActions || ["modify-code", "create-tests"],
    additionalConstraints: body.additionalConstraints || [],
  });
}

function buildTaskSummary(task) {
  return {
    id: task.id,
    title: task.title,
    repository: task.repository,
    status: task.status,
    createdAt: task.createdAt,
    runId: task.runId || null,
  };
}

function buildRunSummary(run) {
  return {
    id: run.id,
    taskRequestId: run.taskRequestId,
    currentOutcomeState: run.currentOutcomeState,
    currentStage: run.progressState.currentStage,
    latestTransitionTime: run.progressState.latestTransitionTime,
    branch: run.delivery?.branch?.name || null,
    pullRequestId: run.delivery?.pullRequest?.id || null,
  };
}

async function serveStatic(reqPath, res) {
  const safePath = reqPath === "/" ? "/index.html" : reqPath;
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    notFound(res);
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
    };
    res.writeHead(200, {
      "content-type": contentTypes[ext] || "application/octet-stream",
    });
    res.end(content);
  } catch {
    notFound(res);
  }
}

export function createApp(options = {}) {
  const repositoryPath = process.env.MINIONS_DEFAULT_REPOSITORY_PATH || process.cwd();
  const executionMode = options.executionMode || process.env.MINIONS_EXECUTION_MODE || "simulated";
  const orchestrationMode = options.orchestrationMode || process.env.MINIONS_ORCHESTRATION_MODE || "single-runner";
  const deliveryMode = options.deliveryMode || process.env.MINIONS_DELIVERY_MODE || "simulated";
  const executionRunner = options.executionRunner || createExecutionRunnerFromEnv({ executionMode });
  const orchestrator =
    options.orchestrator ||
    createGsdOrchestratorFromEnv({
      orchestrationMode,
      executionRunner,
    });
  const platform = new MinionsPlatform({
    executionRunner,
    executionTimeoutMs: options.executionTimeoutMs || Number(process.env.MINIONS_EXECUTION_TIMEOUT_MS || 90000),
    githubDeliveryRunner: options.githubDeliveryRunner || createGitHubDeliveryRunnerFromEnv({ deliveryMode }),
    githubPrPreflight: options.githubPrPreflight || createGitHubPrPreflightFromEnv(),
    orchestrationMode,
    sequenceSeeds: options.sequenceSeeds || inferSequenceSeedsFromRepository(repositoryPath),
  });
  const azureClient = options.azureClient || createAzureDevOpsClientFromEnv();
  const piAuthManager = options.piAuthManager || new PiSubscriptionAuthManager();
  seedPlatform(platform, { orchestrator });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const { pathname } = url;

      if (pathname === "/api/health" && req.method === "GET") {
        json(res, 200, {
          ok: true,
          service: "minions-ui-api",
          runtime: {
            executionMode,
            orchestrationMode,
            deliveryMode,
          },
          piAuth: await piAuthManager.getState(),
        });
        return;
      }

      if (pathname === "/api/pi/auth/status" && req.method === "GET") {
        json(res, 200, await piAuthManager.getState());
        return;
      }

      if (pathname === "/api/pi/auth/login" && req.method === "POST") {
        json(res, 200, await piAuthManager.createLoginJob());
        return;
      }

      if (pathname.match(/^\/api\/pi\/auth\/jobs\/[^/]+$/) && req.method === "GET") {
        const jobId = pathname.split("/").pop();
        const result = await piAuthManager.getJob(jobId);
        json(res, result.ok ? 200 : 404, result);
        return;
      }

      if (pathname.match(/^\/api\/pi\/auth\/jobs\/[^/]+\/launch$/) && req.method === "POST") {
        const jobId = pathname.split("/")[5];
        const result = await piAuthManager.launchLoginBootstrap(jobId);
        json(res, result.ok ? 200 : 404, result);
        return;
      }

      if (pathname.match(/^\/api\/pi\/auth\/browser\/[^/]+$/) && req.method === "GET") {
        const jobId = pathname.split("/").pop();
        const result = await piAuthManager.getJob(jobId);
        if (!result.ok) {
          notFound(res);
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end(piAuthManager.renderBrowserPage(jobId));
        return;
      }

      if (pathname === "/api/tasks" && req.method === "GET") {
        const tasks = platform.listTasks().map(buildTaskSummary);
        json(res, 200, { tasks });
        return;
      }

      if (pathname === "/api/repositories" && req.method === "GET") {
        json(res, 200, {
          repositories: [...platform.supportedTargets.values()].map((target) => ({
            repositoryId: target.repositoryId,
            teamId: target.teamId,
            repositoryPath: target.repositoryPath,
            executionMode: target.executionMode,
            orchestrationMode,
            deliveryMode: target.deliveryMode,
            metadata: target.metadata,
          })),
        });
        return;
      }

      if (pathname === "/api/tasks" && req.method === "POST") {
        const body = await parseBody(req);
        const result = platform.submitTaskRequest(buildTaskPayload(body), {
          requesterIdentity: body.requesterIdentity || "engineer:web-user",
          entryPoint: body.entryPoint || "slack/minions",
        });

        json(res, result.ok ? 201 : 400, result);
        return;
      }

      if (pathname === "/api/intake/azure-work-item" && req.method === "POST") {
        const body = await parseBody(req);
        const workItemId = body.workItemId;

        if (!workItemId) {
          json(res, 400, { error: "workItemId is required" });
          return;
        }

        if (!azureClient.isConfigured()) {
          json(res, 503, {
            error:
              "Azure DevOps integration is not configured. Set AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT, and AZURE_DEVOPS_PAT.",
          });
          return;
        }

        const workItem = await azureClient.getWorkItem(workItemId);
        const taskPayload = buildAzureTaskPayload(body, workItem);
        const result = platform.submitTaskRequest(taskPayload, {
          requesterIdentity: body.requesterIdentity || "engineer:azure-import",
          entryPoint: body.entryPoint || "slack/minions",
        });

        json(res, result.ok ? 201 : 400, {
          ...result,
          importedFrom: {
            system: "azure-devops",
            workItemId: String(workItem.id),
          },
        });
        return;
      }

      if (pathname.match(/^\/api\/tasks\/[^/]+$/) && req.method === "GET") {
        const taskId = pathname.split("/").pop();
        json(res, 200, { task: platform.getTask(taskId) });
        return;
      }

      if (pathname.match(/^\/api\/tasks\/[^/]+\/run$/) && req.method === "POST") {
        const taskId = pathname.split("/")[3];
        const result = await platform.runAutonomousFlow(taskId);
        json(res, result.ok ? 200 : 422, result);
        return;
      }

      if (pathname === "/api/runs" && req.method === "GET") {
        const runs = platform.listRuns().map(buildRunSummary);
        json(res, 200, { runs });
        return;
      }

      if (pathname.match(/^\/api\/runs\/[^/]+$/) && req.method === "GET") {
        const runId = pathname.split("/").pop();
        json(res, 200, { run: platform.getRun(runId) });
        return;
      }

      if (pathname.match(/^\/api\/runs\/[^/]+\/status$/) && req.method === "GET") {
        const runId = pathname.split("/")[3];
        const role = url.searchParams.get("role") || "engineer";
        const result = platform.getInProgressStatus(runId, { role });
        json(res, result.ok ? 200 : result.denied ? 403 : 422, result);
        return;
      }

      if (pathname.match(/^\/api\/runs\/[^/]+\/history$/) && req.method === "GET") {
        const runId = pathname.split("/")[3];
        const role = url.searchParams.get("role") || "engineer";
        const result = platform.getCompletedRunHistory(runId, { role });
        json(res, result.ok ? 200 : result.denied ? 403 : 422, result);
        return;
      }

      if (pathname.match(/^\/api\/runs\/[^/]+\/structured$/) && req.method === "GET") {
        const runId = pathname.split("/")[3];
        const role = url.searchParams.get("role") || "internal-consumer";
        const result = platform.getStructuredRunData(runId, { role });
        json(res, result.ok ? 200 : result.denied ? 403 : 422, result);
        return;
      }

      if (pathname.match(/^\/api\/runs\/[^/]+\/diagnostics$/) && req.method === "GET") {
        const runId = pathname.split("/")[3];
        const result = platform.getFailureStageDiagnostics(runId, { role: "operator" });
        json(res, result.ok ? 200 : result.denied ? 403 : 422, result);
        return;
      }

      if (pathname.match(/^\/api\/runs\/[^/]+\/operator-action$/) && req.method === "POST") {
        const runId = pathname.split("/")[3];
        const body = await parseBody(req);
        const result = platform.accessOperatorInterface(runId, { role: "operator", name: "Web Operator" }, body.action);
        json(res, result.ok ? 200 : 403, result);
        return;
      }

      await serveStatic(pathname, res);
    } catch (error) {
      json(res, 500, {
        error: error instanceof Error ? error.message : "Unknown server error",
      });
    }
  });

  return { server, platform };
}

export async function startServer({ port = Number(process.env.PORT || 3000), host = "127.0.0.1" } = {}) {
  const { server, platform } = createApp();

  await new Promise((resolve) => {
    server.listen(port, host, resolve);
  });

  return { server, platform, port, host };
}

if (process.argv[1] === __filename) {
  const { port, host } = await startServer();
  console.log(`Minions server running on http://${host}:${port}`);
  console.log(
    `Runtime modes: execution=${process.env.MINIONS_EXECUTION_MODE || "simulated"} orchestration=${process.env.MINIONS_ORCHESTRATION_MODE || "single-runner"} delivery=${process.env.MINIONS_DELIVERY_MODE || "simulated"}`,
  );
}
