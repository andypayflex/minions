import test from "node:test";
import assert from "node:assert/strict";

import { MinionsPlatform } from "../src/minions.js";

function buildPlatform() {
  const platform = new MinionsPlatform({
    clock: (() => {
      let tick = 0;
      return () => `2026-03-17T10:${String(tick++).padStart(2, "0")}:00.000Z`;
    })(),
  });

  platform.onboardSupportedTarget({
    repositoryId: "repo/minions-app",
    teamId: "team-core",
    metadata: {
      language: "javascript",
      defaultBranch: "main",
    },
    files: [
      { path: "src/intake/service.js", area: "intake", type: "code", keywords: ["task", "submission", "intake"] },
      { path: "src/preparation/context.js", area: "preparation", type: "code", keywords: ["context", "repository", "working"] },
      { path: "src/execution/run.js", area: "execution", type: "code", keywords: ["execution", "run", "autonomous"] },
      { path: "test/intake.test.js", area: "intake", type: "test", keywords: ["task", "submission", "validation"] },
      { path: "test/execution.test.js", area: "execution", type: "test", keywords: ["execution", "validation", "run"] },
    ],
    validationSteps: [
      { id: "unit-tests", status: "passed", output: "5 passing" },
      { id: "lint", status: "passed", output: "0 issues" },
    ],
  });

  platform.registerLinkedContext({
    system: "github",
    id: "123",
    summary: "Existing intake implementation should stay deterministic.",
    topic: "intake",
    conflictKey: "branching-model",
    conflictValue: "topic-branch",
  });
  platform.registerLinkedContext({
    system: "slack",
    id: "456",
    summary: "Keep repository validation strict.",
    topic: "validation",
    conflictKey: "branching-model",
    conflictValue: "topic-branch",
  });
  platform.registerLinkedContext({
    system: "azure-devops",
    id: "789",
    summary: "Linked work item unavailable during sync.",
    unavailable: true,
    reason: "azure-devops timed out",
  });

  return platform;
}

function submitScopedTask(platform, overrides = {}) {
  const result = platform.submitTaskRequest(
    {
      title: "Implement scoped task intake",
      objective: "Create autonomous intake and validation support for the minions repository",
      repository: "repo/minions-app",
      constraints: ["preserve existing workflow", "add tests"],
      expectedOutcome: "working intake path with tests",
      linkedItems: [
        { system: "github", id: "123" },
        { system: "slack", id: "456" },
        { system: "azure-devops", id: "789" },
      ],
      requestedActions: ["modify-code", "create-tests"],
      protectedSecrets: ["SHOULD_NOT_LEAK"],
      unrestrictedAgentContext: { token: "hidden-token" },
      ...overrides,
    },
    {
      requesterIdentity: "engineer:aiden",
      entryPoint: "slack/minions",
    },
  );

  assert.equal(result.ok, true);
  return result.taskRequestId;
}

function prepareTaskForExecution(platform, taskId) {
  assert.equal(platform.validateMinimumRunReadiness(taskId).result, "ready");
  assert.equal(platform.classifyScope(taskId).result, "in-scope");
  assert.equal(platform.verifyInitiationPath(taskId).allowed, true);
  assert.equal(platform.evaluateAutonomyPolicy(taskId).outcome, "fully-autonomous");
  assert.equal(platform.retrieveRepositoryContext(taskId).ok, true);
  assert.equal(platform.retrieveRelatedWorkContext(taskId).ok, true);
  assert.equal(platform.buildWorkingContext(taskId).ok, true);
  assert.equal(platform.identifyRelevantChangeSurface(taskId).ok, true);
  assert.equal(platform.evaluateCriticalContext(taskId).result, "ready");
  return platform.tasks.get(taskId).runId;
}

async function createSuccessfulRun(platform) {
  const taskId = submitScopedTask(platform);
  const runId = prepareTaskForExecution(platform, taskId);
  assert.equal((await platform.startIsolatedRunEnvironment(taskId)).ok, true);
  assert.equal(platform.executeRepositoryChanges(runId).ok, true);
  assert.equal(platform.runRepositoryValidation(runId).ok, true);
  assert.equal(platform.captureStructuredValidationEvidence(runId).ok, true);
  assert.equal(platform.determineCompletionStatus(runId).state, "successful");
  assert.equal(platform.createDeliveryBranch(runId).ok, true);
  assert.equal(platform.publishPullRequest(runId).ok, true);
  return { taskId, runId };
}

test("Story 1.1 submits valid tasks and rejects missing required fields", () => {
  const platform = buildPlatform();
  const invalid = platform.submitTaskRequest({
    title: "",
    objective: "Build something",
    repository: "",
    constraints: [],
    expectedOutcome: "",
  });

  assert.equal(invalid.ok, false);
  assert.deepEqual(invalid.fieldFeedback, {
    title: "required",
    repository: "required",
    constraints: "required",
    expectedOutcome: "required",
  });
  assert.equal(platform.tasks.size, 0);

  const taskId = submitScopedTask(platform);
  const task = platform.tasks.get(taskId);
  assert.match(task.id, /^task-/);
  assert.equal(task.status, "submitted");
  assert.equal(task.runId, undefined);
});

test("Story 1.2 records ready and not-ready minimum run-readiness outcomes", () => {
  const platform = buildPlatform();
  const readyTaskId = submitScopedTask(platform);
  const ready = platform.validateMinimumRunReadiness(readyTaskId);
  assert.equal(ready.result, "ready");

  const incomplete = platform.submitTaskRequest(
    {
      title: "Missing prerequisites",
      objective: "Needs verification",
      repository: "repo/minions-app",
      constraints: ["stay safe"],
      expectedOutcome: "validated task",
    },
    {},
  );
  const notReady = platform.validateMinimumRunReadiness(incomplete.taskRequestId);
  assert.equal(notReady.result, "not-ready");
  assert.equal(notReady.reasons.some((reason) => reason.kind === "missing-prerequisite"), true);
});

test("Story 1.3 classifies scope with deterministic in-scope, out-of-scope, and insufficient outcomes", () => {
  const platform = buildPlatform();

  const inScopeId = submitScopedTask(platform);
  platform.validateMinimumRunReadiness(inScopeId);
  assert.equal(platform.classifyScope(inScopeId).result, "in-scope");

  const outScopeId = submitScopedTask(platform, {
    title: "Deploy changes to production",
    requestedActions: ["deploy"],
  });
  platform.validateMinimumRunReadiness(outScopeId);
  assert.equal(platform.classifyScope(outScopeId).result, "out-of-scope");

  const vagueId = submitScopedTask(platform, {
    objective: "Maybe update TBD flows once we know more",
  });
  platform.validateMinimumRunReadiness(vagueId);
  assert.equal(platform.classifyScope(vagueId).result, "insufficiently specified");
});

test("Stories 1.4 and 1.5 enforce approved origins and autonomy policy boundaries", () => {
  const platform = buildPlatform();
  const taskId = submitScopedTask(platform);
  platform.validateMinimumRunReadiness(taskId);
  platform.classifyScope(taskId);
  assert.equal(platform.verifyInitiationPath(taskId).allowed, true);
  assert.equal(platform.evaluateAutonomyPolicy(taskId).outcome, "fully-autonomous");

  const badOriginId = submitScopedTask(platform);
  platform.validateMinimumRunReadiness(badOriginId);
  platform.classifyScope(badOriginId);
  const blockedOrigin = platform.verifyInitiationPath(badOriginId, { source: "public-webhook" });
  assert.equal(blockedOrigin.allowed, false);

  const approvalTaskId = submitScopedTask(platform, {
    requestedActions: ["schema-migration"],
  });
  platform.validateMinimumRunReadiness(approvalTaskId);
  platform.classifyScope(approvalTaskId);
  platform.verifyInitiationPath(approvalTaskId);
  assert.equal(platform.evaluateAutonomyPolicy(approvalTaskId).outcome, "requires-approval");
});

test("Stories 2.1 through 2.5 build preparation state and block missing or conflicting context", () => {
  const platform = buildPlatform();
  const taskId = submitScopedTask(platform);
  prepareTaskForExecution(platform, taskId);
  const run = platform.runs.get(platform.tasks.get(taskId).runId);

  assert.equal(run.preparation.repositoryContext.repositoryId, "repo/minions-app");
  assert.equal(run.preparation.relatedWork.partial, true);
  assert.equal(run.preparation.workingContext.sourceInputs.length >= 3, true);
  assert.equal(run.preparation.relevance.sufficientConfidence, true);
  assert.equal(run.preparation.finalOutcome.result, "ready");

  const conflicting = new MinionsPlatform();
  conflicting.onboardSupportedTarget({
    repositoryId: "repo/minions-app",
    teamId: "team-core",
    files: [{ path: "src/only.js", area: "core", type: "code", keywords: ["task"] }],
    validationSteps: [{ id: "unit", status: "passed" }],
  });
  conflicting.registerLinkedContext({
    system: "github",
    id: "1",
    summary: "A",
    conflictKey: "branching-model",
    conflictValue: "topic-branch",
  });
  conflicting.registerLinkedContext({
    system: "slack",
    id: "2",
    summary: "B",
    conflictKey: "branching-model",
    conflictValue: "trunk",
  });
  const conflictingTaskId = conflicting.submitTaskRequest(
    {
      title: "Task",
      objective: "task",
      repository: "repo/minions-app",
      constraints: ["clear"],
      expectedOutcome: "done",
      linkedItems: [
        { system: "github", id: "1" },
        { system: "slack", id: "2" },
      ],
      requestedActions: ["modify-code"],
    },
    {
      requesterIdentity: "engineer:aiden",
      entryPoint: "slack/minions",
    },
  ).taskRequestId;
  conflicting.validateMinimumRunReadiness(conflictingTaskId);
  conflicting.classifyScope(conflictingTaskId);
  conflicting.verifyInitiationPath(conflictingTaskId);
  conflicting.evaluateAutonomyPolicy(conflictingTaskId);
  conflicting.retrieveRepositoryContext(conflictingTaskId);
  conflicting.retrieveRelatedWorkContext(conflictingTaskId);
  conflicting.buildWorkingContext(conflictingTaskId);
  conflicting.identifyRelevantChangeSurface(conflictingTaskId);
  const blocked = conflicting.evaluateCriticalContext(conflictingTaskId);
  assert.equal(blocked.result, "blocked-conflicting-context");
});

test("Stories 3.1 through 3.4 start runs, persist progress, capture write failures, and stop at runtime boundaries", async () => {
  const platform = buildPlatform();
  const taskId = submitScopedTask(platform);
  const runId = prepareTaskForExecution(platform, taskId);
  assert.equal((await platform.startIsolatedRunEnvironment(taskId)).ok, true);
  assert.equal(platform.executeRepositoryChanges(runId).ok, true);

  const run = platform.runs.get(runId);
  assert.equal(run.progressState.history.length >= 3, true);

  const boundary = platform.enforceRuntimeStopCondition(runId, {
    type: "merge",
    crossesBoundary: true,
    reason: "merge requires human approval",
  });
  assert.equal(boundary.ok, false);
  assert.equal(platform.runs.get(runId).currentOutcomeState, "boundary-stopped");
  assert.equal(Boolean(platform.runs.get(runId).execution.currentWorkState), true);

  const failingPlatform = buildPlatform();
  const failingTaskId = submitScopedTask(failingPlatform);
  const failingRunId = prepareTaskForExecution(failingPlatform, failingTaskId);
  await failingPlatform.startIsolatedRunEnvironment(failingTaskId);
  const writeFailure = failingPlatform.executeRepositoryChanges(failingRunId, {
    forceWriteFailure: "filesystem write denied",
  });
  assert.equal(writeFailure.ok, false);
  assert.equal(failingPlatform.runs.get(failingRunId).failureReason, "filesystem write denied");
});

test("Stories 3.5 and 3.6 expose in-progress status with redaction and bounded operator access", async () => {
  const platform = buildPlatform();
  const taskId = submitScopedTask(platform);
  const runId = prepareTaskForExecution(platform, taskId);
  await platform.startIsolatedRunEnvironment(taskId);
  platform.executeRepositoryChanges(runId);

  const status = platform.getInProgressStatus(runId, { role: "engineer" });
  assert.equal(status.ok, true);
  assert.equal(status.status.currentStage, "execution");
  assert.equal("secretContext" in status.status, false);
  assert.equal("unrestrictedAgentContext" in status.status, false);

  const denied = platform.getInProgressStatus(runId, { role: "viewer" });
  assert.equal(denied.ok, false);
  assert.equal(platform.runs.get(runId).deniedRequests.length > 0, true);

  const operatorInspect = platform.accessOperatorInterface(runId, { role: "operator", name: "Morgan" });
  assert.equal(operatorInspect.ok, true);
  const blockedAction = platform.accessOperatorInterface(runId, { role: "operator", name: "Morgan" }, "merge-run");
  assert.equal(blockedAction.ok, false);
});

test("Stories 4.1 through 4.6 validate runs, capture evidence, determine completion, publish delivery artifacts, and preserve gate history", async () => {
  const platform = buildPlatform();
  const { runId, taskId } = await createSuccessfulRun(platform);
  const run = platform.runs.get(runId);

  assert.equal(run.validation.completionState, "completed");
  assert.equal(run.evidence.length, 2);
  assert.equal(run.completion.state, "successful");
  assert.equal(Boolean(run.delivery.branch), true);
  assert.equal(Boolean(run.delivery.pullRequest), true);
  assert.equal(run.delivery.pullRequest.taskLink, taskId);
  assert.equal(run.delivery.gateHistory.length >= 2, true);

  const partialPlatform = buildPlatform();
  const partialTaskId = submitScopedTask(partialPlatform);
  const partialRunId = prepareTaskForExecution(partialPlatform, partialTaskId);
  await partialPlatform.startIsolatedRunEnvironment(partialTaskId);
  partialPlatform.executeRepositoryChanges(partialRunId);
  partialPlatform.runRepositoryValidation(partialRunId, {
    steps: [{ id: "unit-tests", malformed: true, rawOutput: "???" }],
  });
  partialPlatform.captureStructuredValidationEvidence(partialRunId);
  assert.equal(partialPlatform.determineCompletionStatus(partialRunId).state, "partial");
  const blocked = partialPlatform.publishPullRequest(partialRunId);
  assert.equal(blocked.ok, false);
  assert.equal(partialPlatform.runs.get(partialRunId).delivery.gateHistory.at(-1).eligible, false);
});

test("runAutonomousFlow blocks duplicate active runs and completed delivery reruns", async () => {
  const platform = buildPlatform();
  const taskId = submitScopedTask(platform);
  const runId = prepareTaskForExecution(platform, taskId);
  await platform.startIsolatedRunEnvironment(taskId);
  platform.executeRepositoryChanges(runId);

  const duplicateActive = await platform.runAutonomousFlow(taskId);
  assert.equal(duplicateActive.ok, false);
  assert.equal(duplicateActive.reason, "task already has an active run in progress");
  assert.equal(duplicateActive.runId, runId);

  const deliveredPlatform = buildPlatform();
  const delivered = await createSuccessfulRun(deliveredPlatform);
  deliveredPlatform._markRunDeliveredSuccessfully(deliveredPlatform.runs.get(delivered.runId));

  const duplicateDelivered = await deliveredPlatform.runAutonomousFlow(delivered.taskId);
  assert.equal(duplicateDelivered.ok, false);
  assert.equal(duplicateDelivered.reason, "task already has a completed delivery run");
  assert.equal(duplicateDelivered.runId, delivered.runId);
  assert.equal(deliveredPlatform.runs.get(delivered.runId).currentOutcomeState, "successful");
});

test("Stories 5.1 through 5.3 classify failures, summarize them safely, and preserve intermediate state", async () => {
  const platform = buildPlatform();
  const taskId = submitScopedTask(platform);
  const runId = prepareTaskForExecution(platform, taskId);
  await platform.startIsolatedRunEnvironment(taskId);
  platform.executeRepositoryChanges(runId);
  platform.runRepositoryValidation(runId, {
    steps: [{ id: "unit-tests", status: "failed", output: "1 failing" }],
  });
  platform.captureStructuredValidationEvidence(runId);
  platform.determineCompletionStatus(runId);

  const failure = platform.classifyRunFailure(runId);
  assert.equal(failure.type, "validation-failure");

  const summary = platform.produceFailureSummary(runId);
  assert.equal(summary.failureType, "validation-failure");
  assert.equal("protectedSecrets" in summary, false);
  assert.equal("unrestrictedAgentContext" in summary, false);

  const preserved = platform.preserveIntermediateState(runId, { failOn: ["deliveryArtifacts"] });
  assert.equal(Boolean(preserved.preserved.progressState), true);
  assert.equal(preserved.failures.length, 1);
});

test("Stories 5.4 through 5.6 expose history, diagnostics, and a reconstructable run ledger", async () => {
  const platform = buildPlatform();
  const { runId } = await createSuccessfulRun(platform);

  const history = platform.getCompletedRunHistory(runId, { role: "engineer" });
  assert.equal(history.ok, true);
  assert.equal(history.history.finalOutcome, "successful");
  assert.equal(history.history.links.delivery.length, 1);

  const failingPlatform = buildPlatform();
  const taskId = submitScopedTask(failingPlatform);
  const failingRunId = prepareTaskForExecution(failingPlatform, taskId);
  await failingPlatform.startIsolatedRunEnvironment(taskId);
  failingPlatform.executeRepositoryChanges(failingRunId);
  failingPlatform.runRepositoryValidation(failingRunId, {
    steps: [{ id: "unit-tests", status: "failed", output: "1 failing" }],
  });
  failingPlatform.captureStructuredValidationEvidence(failingRunId);
  failingPlatform.determineCompletionStatus(failingRunId);
  failingPlatform.classifyRunFailure(failingRunId);
  failingPlatform.produceFailureSummary(failingRunId);

  const diagnostics = failingPlatform.getFailureStageDiagnostics(failingRunId, { role: "operator" });
  assert.equal(diagnostics.ok, true);
  assert.equal(diagnostics.diagnostics.outcomeType, "failed");

  const ledger = failingPlatform.reviewRunLedger(failingRunId);
  assert.equal(ledger.entries.length > 0, true);
  assert.equal(ledger.autonomySummary.some((entry) => entry.autonomyClass === "blocked"), true);
});

test("Stories 6.1 through 6.4 register capabilities, onboard targets, expose structured run data, and extend workflow stages additively", async () => {
  const platform = buildPlatform();
  const registration = platform.registerMinionType({
    id: "qa-helper",
    name: "QA Helper",
    capabilities: ["qa-assist"],
    entryLifecycleStage: "intake",
  });
  assert.equal(registration.ok, true);

  const invalidRegistration = platform.registerMinionType({
    id: "unsafe",
    name: "Unsafe",
    capabilities: ["skip-policy"],
    bypassesExecutionModel: true,
  });
  assert.equal(invalidRegistration.ok, false);

  const onboarding = platform.onboardSupportedTarget({
    repositoryId: "repo/second-app",
    teamId: "team-growth",
    files: [{ path: "src/app.js", area: "core", type: "code", keywords: ["app"] }],
    validationSteps: [{ id: "unit", status: "passed" }],
  });
  assert.equal(onboarding.ok, true);

  const invalidOnboarding = platform.onboardSupportedTarget({
    repositoryId: "",
    teamId: "team-growth",
    files: [],
    validationSteps: [],
  });
  assert.equal(invalidOnboarding.ok, false);

  const { runId } = await createSuccessfulRun(platform);
  const structured = platform.getStructuredRunData(runId, { role: "internal-consumer" });
  assert.equal(structured.ok, true);
  assert.equal(structured.data.canonicalRunRecord, runId);
  assert.equal("environment" in structured.data.states, true);
  assert.equal("effectiveRepositoryPath" in structured.data.repository, true);

  const deniedStructured = platform.getStructuredRunData(runId, { role: "guest" });
  assert.equal(deniedStructured.ok, false);

  const extension = platform.extendWorkflowModel({
    id: "release-readiness",
    name: "Release Readiness",
    appliesAfter: "delivery",
    additive: true,
  });
  assert.equal(extension.ok, true);

  const incompatible = platform.extendWorkflowModel({
    id: "delivery",
    appliesAfter: "missing-stage",
    additive: false,
    replacesCoreStage: true,
  });
  assert.equal(incompatible.ok, false);
});
