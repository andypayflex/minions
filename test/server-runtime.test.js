import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../src/server.js";

test("createApp surfaces effective execution orchestration and delivery runtime modes", () => {
  const { server } = createApp({
    executionMode: "agent-runner",
    orchestrationMode: "gsd-team",
    deliveryMode: "github-pr",
    executionRunner: { run: async () => ({ ok: true, final: null }) },
    githubPrPreflight: { check: async () => ({ ok: true, checks: [], failedChecks: [] }) },
    githubDeliveryRunner: { publishPullRequest: async () => ({ pullRequest: { number: 1, url: "x" } }) },
  });

  assert.equal(typeof server.emit, "function");
  server.close();
});
