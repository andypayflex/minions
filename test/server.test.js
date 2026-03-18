import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/server.js";

async function withServer(fn) {
  const { server } = createApp();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test("server serves health, task submission, run execution, and history APIs", async (t) => {
  try {
    await withServer(async (baseUrl) => {
      const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
      assert.equal(health.ok, true);

      const created = await fetch(`${baseUrl}/api/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Create a task from the UI",
          objective: "Exercise the live API",
          constraints: "keep it deterministic\nshow status",
          expectedOutcome: "working browser flow",
        }),
      }).then((response) => response.json());

      assert.equal(created.ok, true);
      const taskId = created.taskRequestId;

      const taskList = await fetch(`${baseUrl}/api/tasks`).then((response) => response.json());
      assert.equal(taskList.tasks.length, 1);

      const runResultResponse = await fetch(`${baseUrl}/api/tasks/${taskId}/run`, {
        method: "POST",
      });
      assert.equal(runResultResponse.status, 200);
      const runResult = await runResultResponse.json();
      assert.equal(runResult.ok, true);

      const runId = runResult.runId;
      const runs = await fetch(`${baseUrl}/api/runs`).then((response) => response.json());
      assert.equal(runs.runs.length, 1);

      const history = await fetch(`${baseUrl}/api/runs/${runId}/history`).then((response) => response.json());
      assert.equal(history.history.finalOutcome, "successful");

      const structured = await fetch(`${baseUrl}/api/runs/${runId}/structured`).then((response) => response.json());
      assert.equal(structured.data.canonicalRunRecord, runId);
    });
  } catch (error) {
    if (error?.code === "EPERM") {
      t.skip("sandbox does not allow opening a local HTTP listener");
      return;
    }

    throw error;
  }
});

test("server enforces authorization on status and operator routes", async (t) => {
  try {
    await withServer(async (baseUrl) => {
      const created = await fetch(`${baseUrl}/api/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Create a task from the UI",
          objective: "Exercise the live API",
          constraints: "keep it deterministic",
          expectedOutcome: "working browser flow",
        }),
      }).then((response) => response.json());

      const runResult = await fetch(`${baseUrl}/api/tasks/${created.taskRequestId}/run`, {
        method: "POST",
      }).then((response) => response.json());

      const deniedStructured = await fetch(`${baseUrl}/api/runs/${runResult.runId}/structured?role=guest`);
      assert.equal(deniedStructured.status, 403);

      const operatorAction = await fetch(`${baseUrl}/api/runs/${runResult.runId}/operator-action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "merge-run" }),
      });
      assert.equal(operatorAction.status, 403);
    });
  } catch (error) {
    if (error?.code === "EPERM") {
      t.skip("sandbox does not allow opening a local HTTP listener");
      return;
    }

    throw error;
  }
});

test("server imports tasks from Azure DevOps work items", async () => {
  const azureClient = {
    isConfigured() {
      return true;
    },
    async getWorkItem(workItemId) {
      return {
        id: Number(workItemId),
        url: "https://dev.azure.com/org/project/_workitems/edit/55",
        fields: {
          "System.Title": "Investigate Azure ticket",
          "System.Description": "<p>Look at the repo and complete the requested change.</p>",
          "System.WorkItemType": "User Story",
          "System.State": "Active",
          "System.Tags": "backend; api",
        },
      };
    },
  };

  const { platform } = createApp({ azureClient });
  const workItem = await azureClient.getWorkItem(55);
  const created = platform.submitTaskRequest(
    {
      title: workItem.fields["System.Title"],
      objective: "Look at the repo and complete the requested change.",
      repository: "repo/minions-app",
      constraints: ["User Story from Azure DevOps", "Current state: Active", "Tag: backend", "Tag: api"],
      expectedOutcome: "Resolve Azure DevOps work item 55 with working code, tests, and review-ready delivery output.",
      linkedItems: [{ system: "azure-devops", id: "55" }],
      requestedActions: ["modify-code", "create-tests"],
    },
    {
      requesterIdentity: "engineer:azure-import",
      entryPoint: "slack/minions",
    },
  );

  assert.equal(created.ok, true);
  const task = platform.getTask(created.taskRequestId);
  assert.equal(task.title, "Investigate Azure ticket");
  assert.deepEqual(task.linkedItems, [{ system: "azure-devops", id: "55" }]);
});
