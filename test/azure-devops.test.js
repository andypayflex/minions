import test from "node:test";
import assert from "node:assert/strict";

import {
  AzureDevOpsClient,
  mapAzureWorkItemToTaskPayload,
  stripHtml,
} from "../src/azure-devops.js";

test("stripHtml reduces Azure rich text to readable plain text", () => {
  assert.equal(stripHtml("<p>Hello<br>world</p><ul><li>Item</li></ul>"), "Hello\nworld\n\n  Item");
});

test("AzureDevOpsClient fetches a work item with configured credentials", async () => {
  let capturedRequest;
  const client = new AzureDevOpsClient({
    organization: "org",
    project: "project",
    personalAccessToken: "pat",
    fetchImpl: async (url, options) => {
      capturedRequest = { url: String(url), options };
      return {
        ok: true,
        async json() {
          return { id: 42, fields: { "System.Title": "Title" } };
        },
      };
    },
  });

  const item = await client.getWorkItem(42);
  assert.equal(item.id, 42);
  assert.match(capturedRequest.url, /_apis\/wit\/workitems\/42/);
  assert.equal(capturedRequest.options.headers.authorization.startsWith("Basic "), true);
});

test("mapAzureWorkItemToTaskPayload converts Azure fields into a Minions task", () => {
  const taskPayload = mapAzureWorkItemToTaskPayload(
    {
      id: 321,
      url: "https://dev.azure.com/org/project/_workitems/edit/321",
      fields: {
        "System.Title": "Fix account provisioning",
        "System.Description": "<p>Investigate the repo and resolve the onboarding failure.</p>",
        "System.Tags": "backend; onboarding",
        "System.WorkItemType": "Bug",
        "System.State": "Active",
        "System.AreaPath": "Platform\\Identity",
      },
    },
    {
      repository: "repo/minions-app",
    },
  );

  assert.equal(taskPayload.title, "Fix account provisioning");
  assert.equal(taskPayload.repository, "repo/minions-app");
  assert.equal(taskPayload.objective, "Investigate the repo and resolve the onboarding failure.");
  assert.equal(taskPayload.constraints.includes("Bug from Azure DevOps"), true);
  assert.deepEqual(taskPayload.linkedItems, [{ system: "azure-devops", id: "321" }]);
});
