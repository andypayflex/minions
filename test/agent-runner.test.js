import assert from "node:assert/strict";
import test from "node:test";

import { createExecutionRunnerFromEnv } from "../src/agent-runner.js";

test("subscription-auth runner forces Codex provider during Pi RPC", () => {
  const runner = createExecutionRunnerFromEnv({
    executionMode: "agent-runner",
    provider: "openai-codex",
    model: "gpt-5.4",
    extraArgs: [],
  });

  const args = runner._buildArgs({ repository: { repositoryPath: process.cwd() } });

  assert.deepEqual(args.slice(0, 6), ["--mode", "rpc", "--no-session", "--provider", "openai-codex", "--no-extensions"]);
  assert.ok(args.includes("--model"));
  assert.ok(args.includes("gpt-5.4"));
  assert.equal(args.includes("--model-provider"), false);
});

test("non-subscription runner preserves explicit provider behavior", () => {
  const runner = createExecutionRunnerFromEnv({
    executionMode: "agent-runner",
    provider: "anthropic",
    model: "claude-sonnet-4",
    extraArgs: [],
  });

  const args = runner._buildArgs({ repository: { repositoryPath: process.cwd() } });

  assert.ok(args.includes("--provider"));
  assert.ok(args.includes("anthropic"));
  assert.equal(args.includes("--model-provider"), false);
});
