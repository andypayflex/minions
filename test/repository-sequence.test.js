import assert from "node:assert/strict";
import test from "node:test";

import {
  inferSequenceSeedsFromMemory,
  mergeSequenceSeeds,
} from "../src/repository-sequence.js";
import { MinionsPlatform } from "../src/minions.js";

test("mergeSequenceSeeds keeps the maximum value for each prefix", () => {
  assert.deepEqual(
    mergeSequenceSeeds(
      { task: 1, run: 1, branch: 0, pr: 0 },
      { task: 4, run: 3, branch: 4, pr: 2 },
      { task: 2, run: 9, branch: 1, pr: 5 },
    ),
    { task: 4, run: 9, branch: 4, pr: 5 },
  );
});

test("platform sequence seeds continue task and run numbering", () => {
  const platform = new MinionsPlatform({
    sequenceSeeds: {
      task: 7,
      run: 7,
      branch: 3,
      pr: 5,
    },
  });

  const created = platform.submitTaskRequest(
    {
      title: "Continue numbering",
      objective: "Verify seeded identifiers continue from prior repo state",
      repository: "repo/minions-app",
      constraints: ["keep it deterministic"],
      expectedOutcome: "task numbering continues",
    },
    {
      requesterIdentity: "engineer:aiden",
      entryPoint: "slack/minions",
    },
  );

  assert.equal(created.taskRequestId, "task-0008");
  assert.equal(platform.nextId("run"), "run-0008");
  assert.equal(platform.nextId("branch"), "branch-0004");
  assert.equal(platform.nextId("pr"), "pr-0006");
});

test("inferSequenceSeedsFromMemory derives maximum ids from existing platform state", () => {
  const platform = new MinionsPlatform();

  platform.tasks.set("task-0003", { id: "task-0003" });
  platform.tasks.set("task-0012", { id: "task-0012" });
  platform.runs.set("run-0009", {
    id: "run-0009",
    delivery: {
      branch: { id: "branch-0004" },
      pullRequest: { id: "pr-0002" },
    },
  });

  assert.deepEqual(inferSequenceSeedsFromMemory(platform), {
    task: 12,
    run: 9,
    branch: 4,
    pr: 2,
  });
});
