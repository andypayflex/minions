import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildCodexAnalysisPrompt, buildCodexExecutionPrompt, CodexCliRunner } from "../src/agent-runner.js";
import { MinionsPlatform } from "../src/minions.js";

function createMockSpawn(finalPayload) {
  return (command, args) => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = {
      end(input) {
        child.stdinInput = String(input || "");
        const outputPath = args[args.indexOf("--output-last-message") + 1];
        fs.writeFile(outputPath, JSON.stringify(finalPayload, null, 2))
          .then(() => {
            child.stdout.emit("data", Buffer.from('{"type":"agent-message","delta":"working"}\n'));
            child.emit("close", 0);
          })
          .catch((error) => child.emit("error", error));
      },
    };
    child.command = command;
    child.args = args;
    return child;
  };
}

test("buildCodexExecutionPrompt includes task, repo, and file context", () => {
  const prompt = buildCodexExecutionPrompt({
    task: {
      id: "task-0001",
      title: "Fix intake flow",
      objective: "Implement the requested repository change",
      constraints: ["keep tests passing", "touch only relevant files"],
      expectedOutcome: "working change with validation evidence",
    },
    repository: {
      repositoryId: "repo/minions-app",
      repositoryPath: "/tmp/minions-target",
    },
    context: {
      relevantFiles: [{ path: "src/intake.js", area: "src", type: "code" }],
      validationSteps: [{ id: "test", command: "npm test" }],
      relatedWork: [{ source: "azure-devops", id: "55", summary: "Investigate ticket 55" }],
      workingContext: { taskSummary: { title: "Fix intake flow" } },
    },
  });

  assert.match(prompt, /Fix intake flow/);
  assert.match(prompt, /\/tmp\/minions-target/);
  assert.match(prompt, /src\/intake\.js/);
  assert.match(prompt, /npm test/);
  assert.match(prompt, /Investigate ticket 55/);
});

test("buildCodexAnalysisPrompt includes repository summary and task framing", () => {
  const prompt = buildCodexAnalysisPrompt({
    task: {
      id: "task-0001",
      title: "Review repository structure",
      objective: "Investigate the repo and propose a documentation update",
      constraints: ["keep the work scoped"],
      expectedOutcome: "clear plan for a small doc change",
    },
    repository: {
      repositoryId: "repo/minions-app",
      repositoryPath: "/tmp/minions-target",
      files: [{ path: "src/intake.js", area: "src", type: "code" }],
      validationSteps: [{ id: "test", command: "npm test" }],
    },
    context: {
      relatedWork: [{ source: "azure-devops", id: "55", summary: "Investigate ticket 55" }],
      workingContext: { taskSummary: { title: "Review repository structure" } },
    },
  });

  assert.match(prompt, /Review repository structure/);
  assert.match(prompt, /Repository File Summary/);
  assert.match(prompt, /src\/intake\.js/);
  assert.match(prompt, /taskType/);
});

test("CodexCliRunner executes codex exec and parses structured output", async () => {
  let spawnedArgs = null;
  const runner = new CodexCliRunner({
    spawnImpl(command, args) {
      spawnedArgs = args;
      return createMockSpawn({
        outcome: "completed",
        summary: "Updated intake implementation.",
        changedFiles: ["src/intake.js", "test/intake.test.js"],
        commandsRun: ["npm test"],
        notes: ["Applied focused repository changes."],
      })(command, args);
    },
  });

  const result = await runner.run({
    task: {
      id: "task-0001",
      title: "Fix intake flow",
      objective: "Implement the requested repository change",
      constraints: ["keep tests passing"],
      expectedOutcome: "working change with validation evidence",
    },
    repository: {
      repositoryId: "repo/minions-app",
      repositoryPath: process.cwd(),
    },
    context: {
      relevantFiles: [{ path: "src/intake.js", area: "src", type: "code" }],
      validationSteps: [{ id: "test", command: "npm test" }],
      relatedWork: [],
      workingContext: {},
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 0);
  assert.equal(result.final.summary, "Updated intake implementation.");
  assert.deepEqual(result.final.changedFiles, ["src/intake.js", "test/intake.test.js"]);
  assert.equal(spawnedArgs.includes("--full-auto"), true);
  assert.match(result.prompt, /Fix intake flow/);
});

test("CodexCliRunner analyze executes codex exec and parses structured output", async () => {
  const runner = new CodexCliRunner({
    spawnImpl: createMockSpawn({
      taskType: "documentation",
      shouldProceed: true,
      summary: "Update docs for the repository workflow.",
      reasoning: "The task is investigative and should add a focused documentation artifact.",
      relevantFiles: ["README.md", "docs/workflow.md"],
      testFiles: [],
      notes: ["No code edits are required beyond documentation."],
    }),
  });

  const result = await runner.analyze({
    task: {
      id: "task-0001",
      title: "Document workflow",
      objective: "Summarize the repo workflow in a new doc",
      constraints: ["stay concise"],
      expectedOutcome: "new documentation file",
    },
    repository: {
      repositoryId: "repo/minions-app",
      repositoryPath: process.cwd(),
      files: [{ path: "README.md", area: "root", type: "code" }],
      validationSteps: [{ id: "test", command: "npm test" }],
    },
    context: {
      relatedWork: [],
      workingContext: {},
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 0);
  assert.equal(result.final.taskType, "documentation");
  assert.deepEqual(result.final.relevantFiles, ["README.md", "docs/workflow.md"]);
  assert.match(result.prompt, /Document workflow/);
});

test("platform uses execution runner when repository target is configured for agent-runner mode", async () => {
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), "minions-runner-target-"));

  try {
    await fs.mkdir(path.join(repositoryPath, "src"), { recursive: true });
    await fs.writeFile(
      path.join(repositoryPath, "package.json"),
      JSON.stringify({
        name: "runner-target",
        private: true,
        scripts: { test: "node --test" },
      }),
    );
    await fs.writeFile(path.join(repositoryPath, "src/feature.js"), "export const feature = () => 'before';\n");

    const platform = new MinionsPlatform({
      executionRunner: {
        async run() {
          return {
            ok: true,
            exitCode: 0,
            stdout: "",
            stderr: "",
            final: {
              outcome: "completed",
              summary: "Updated feature implementation.",
              changedFiles: ["src/feature.js"],
              commandsRun: ["npm test"],
              notes: ["Executed in codex runner"],
            },
          };
        },
      },
    });

    platform.onboardSupportedTarget({
      repositoryId: "repo/runner-target",
      teamId: "team-core",
      repositoryPath,
      executionMode: "agent-runner",
      metadata: {
        language: "javascript",
        defaultBranch: "main",
      },
    });
    platform.registerLinkedContext({
      system: "github",
      id: "123",
      summary: "Keep the repository change scoped.",
      topic: "execution",
    });
    platform.registerLinkedContext({
      system: "slack",
      id: "456",
      summary: "Run the relevant validation after code changes.",
      topic: "validation",
    });

    const taskId = platform.submitTaskRequest(
      {
        title: "Implement the requested repository change",
        objective: "Update the feature implementation and keep the repo healthy",
        repository: "repo/runner-target",
        constraints: ["preserve project structure", "keep tests passing"],
        expectedOutcome: "working code with validation evidence",
        linkedItems: [
          { system: "github", id: "123" },
          { system: "slack", id: "456" },
        ],
        requestedActions: ["modify-code", "create-tests"],
      },
      {
        requesterIdentity: "engineer:aiden",
        entryPoint: "slack/minions",
      },
    ).taskRequestId;

    assert.equal(platform.validateMinimumRunReadiness(taskId).result, "ready");
    assert.equal(platform.classifyScope(taskId).result, "in-scope");
    assert.equal(platform.verifyInitiationPath(taskId).allowed, true);
    assert.equal(platform.evaluateAutonomyPolicy(taskId).outcome, "fully-autonomous");
    assert.equal(platform.retrieveRepositoryContext(taskId).ok, true);
    assert.equal(platform.retrieveRelatedWorkContext(taskId).ok, true);
    assert.equal(platform.buildWorkingContext(taskId).ok, true);
    assert.equal(platform.identifyRelevantChangeSurface(taskId).ok, true);
    assert.equal(platform.evaluateCriticalContext(taskId).result, "ready");
    const startup = platform.startIsolatedRunEnvironment(taskId);
    const execution = await platform.executeRepositoryChangesAsync(startup.runId);

    assert.equal(execution.ok, true);
    assert.deepEqual(execution.currentWorkState.changedFiles, ["src/feature.js"]);
    assert.deepEqual(execution.currentWorkState.commandsRun, ["npm test"]);
    assert.equal(platform.runs.get(startup.runId).execution.agentRun.summary, "Updated feature implementation.");
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});

test("runAutonomousFlow uses AI task analysis so broad repo-analysis tasks do not block on heuristic relevance", async () => {
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), "minions-analysis-target-"));

  try {
    await fs.mkdir(path.join(repositoryPath, "src"), { recursive: true });
    await fs.writeFile(
      path.join(repositoryPath, "package.json"),
      JSON.stringify({
        name: "analysis-target",
        private: true,
        scripts: { test: "node --test" },
      }),
    );
    await fs.writeFile(path.join(repositoryPath, "src/feature.js"), "export const feature = () => 'before';\n");

    const platform = new MinionsPlatform({
      executionRunner: {
        async analyze() {
          return {
            ok: true,
            exitCode: 0,
            stdout: "",
            stderr: "",
            final: {
              taskType: "documentation",
              shouldProceed: true,
              summary: "Create a repo improvements note.",
              reasoning: "The task is broad, but a documentation artifact is an appropriate first step.",
              relevantFiles: ["docs/repo-improvements.md", "src/feature.js"],
              testFiles: [],
              notes: ["Proceed without relying on keyword file matching."],
            },
          };
        },
        async run() {
          return {
            ok: true,
            exitCode: 0,
            stdout: "",
            stderr: "",
            final: {
              outcome: "completed",
              summary: "Created a repository improvements note.",
              changedFiles: ["docs/repo-improvements.md"],
              commandsRun: ["npm test"],
              notes: ["Completed after AI planning stage."],
            },
          };
        },
      },
    });

    platform.onboardSupportedTarget({
      repositoryId: "repo/analysis-target",
      teamId: "team-core",
      repositoryPath,
      executionMode: "agent-runner",
      metadata: {
        language: "javascript",
        defaultBranch: "main",
      },
    });

    const taskId = platform.submitTaskRequest(
      {
        title: "Investigate the repo and document improvements",
        objective: "Analyse the repository and create a small improvement note based on what you find",
        repository: "repo/analysis-target",
        constraints: ["keep it focused", "prefer documentation over broad code changes"],
        expectedOutcome: "a concise repository improvements note",
        linkedItems: [],
        requestedActions: ["modify-code"],
      },
      {
        requesterIdentity: "engineer:aiden",
        entryPoint: "slack/minions",
      },
    ).taskRequestId;

    const result = await platform.runAutonomousFlow(taskId);
    assert.equal(result.ok, true);

    const run = platform.runs.get(result.runId);
    assert.equal(run.preparation.analysis.taskType, "documentation");
    assert.equal(run.preparation.finalOutcome.result, "ready");
    assert.deepEqual(run.preparation.relevance.rankedFiles.map((file) => file.path).slice(0, 2), [
      "docs/repo-improvements.md",
      "src/feature.js",
    ]);
    assert.deepEqual(run.execution.currentWorkState.changedFiles, ["docs/repo-improvements.md"]);
  } finally {
    await fs.rm(repositoryPath, { recursive: true, force: true });
  }
});
