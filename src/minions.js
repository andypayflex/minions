import { analyzeLocalRepositoryTarget } from "./local-repository.js";
import { createGitHubDeliveryRunnerFromEnv } from "./github-delivery.js";
import { createGitHubPrPreflightFromEnv } from "./preflight.js";
import {
  captureWorktreeBaseline,
  createLocalDeliveryBranch,
  createLocalDeliveryCommit,
  diffWorktreePathsFromBaseline,
  readWorkingTreeStatus,
} from "./local-git.js";
import path from "node:path";
import { inferSequenceSeedsFromMemory, mergeSequenceSeeds } from "./repository-sequence.js";

const APPROVED_SYSTEMS = new Set(["github", "slack", "azure-devops"]);
const TERMINAL_OUTCOMES = new Set([
  "successful",
  "partial",
  "failed",
  "blocked",
  "boundary-stopped",
  "interrupted",
]);
const SENSITIVE_KEYS = new Set([
  "secret",
  "secrets",
  "secretContext",
  "unrestrictedAgentContext",
  "protectedSecrets",
  "token",
  "apiKey",
]);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
}

function isBlank(value) {
  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null;
}

function normalizeWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function redactSensitive(value) {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === "object") {
    const redacted = {};

    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) {
        continue;
      }

      redacted[key] = redactSensitive(entry);
    }

    return redacted;
  }

  return value;
}

function createResult(ok, data = {}) {
  return { ok, ...data };
}

function normalizeRepositoryRelativePath(repositoryPath, filePath) {
  const value = String(filePath || "").trim();
  if (!value) {
    return "";
  }

  if (!repositoryPath || !path.isAbsolute(value)) {
    return value;
  }

  const relativePath = path.relative(repositoryPath, value);
  if (!relativePath || relativePath.startsWith("..")) {
    return value;
  }

  return relativePath;
}

function withTimeout(promise, timeoutMs, message = "operation timed out") {
  let timeoutId = null;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        ok: false,
        exitCode: null,
        stdout: "",
        stderr: "",
        final: null,
        timedOut: true,
        error: message,
      });
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }),
    timeoutPromise,
  ]);
}

function inferAreaFromPath(filePath) {
  return String(filePath || "").split(/[\\/]/).filter(Boolean)[0] || "root";
}

function inferFileTypeFromPath(filePath) {
  const lower = String(filePath || "").toLowerCase();
  return lower.includes("test") || lower.includes("spec") || lower.includes("__tests__") ? "test" : "code";
}

export class MinionsPlatform {
  constructor(config = {}) {
    this.clock = config.clock || (() => new Date().toISOString());
    this.executionRunner = config.executionRunner || null;
    this.executionTimeoutMs = Number(config.executionTimeoutMs || 90000);
    this.githubDeliveryRunner = config.githubDeliveryRunner || createGitHubDeliveryRunnerFromEnv();
    this.githubPrPreflight = config.githubPrPreflight || createGitHubPrPreflightFromEnv();
    this.orchestrationMode = config.orchestrationMode || "single-runner";
    this.sequence = new Map();

    this.approvedInitiationPaths = new Set(
      config.approvedInitiationPaths || ["slack/minions", "operator-console/manual"],
    );
    this.allowedRuntimeActions = new Set(
      config.allowedRuntimeActions || ["modify-code", "create-tests", "reorganize-files"],
    );
    this.operatorActions = new Set(
      config.operatorActions || ["inspect-run", "pause-run", "resume-run", "retry-delivery-gates"],
    );

    this.tasks = new Map();
    this.runs = new Map();
    this.supportedTargets = new Map();
    this.targetRejections = [];
    this.linkedContexts = new Map();
    this.minionTypes = new Map();
    this.minionTypeRejections = [];
    this.workflowCompatibilityFailures = [];

    this.workflowModel = {
      lifecycleStages: [
        "intake",
        "readiness",
        "scope",
        "origin",
        "policy",
        "preparation",
        "environment-startup",
        "execution",
        "validation",
        "delivery",
        "history",
      ],
      extensions: [],
    };

    this._seedDefaultMinion();

    for (const target of config.supportedTargets || []) {
      this.onboardSupportedTarget(target);
    }

    for (const entry of config.linkedContexts || []) {
      this.registerLinkedContext(entry);
    }

    this._seedSequences(config.sequenceSeeds || {});
  }

  now() {
    return this.clock();
  }

  _seedSequences(sequenceSeeds = {}) {
    const merged = mergeSequenceSeeds(sequenceSeeds, inferSequenceSeedsFromMemory(this));
    for (const [prefix, value] of Object.entries(merged)) {
      if ((Number(value) || 0) > 0) {
        this.sequence.set(prefix, Number(value));
      }
    }
  }

  nextId(prefix) {
    const current = this.sequence.get(prefix) || 0;
    const next = current + 1;
    this.sequence.set(prefix, next);
    return `${prefix}-${String(next).padStart(4, "0")}`;
  }

  registerLinkedContext(entry) {
    const key = `${entry.system}:${entry.id}`;
    this.linkedContexts.set(key, clone(entry));
  }

  listTasks() {
    return [...this.tasks.values()].map((task) => redactSensitive(task));
  }

  listRuns() {
    return [...this.runs.values()].map((run) => redactSensitive(run));
  }

  getTask(taskId) {
    return redactSensitive(this._requireTask(taskId));
  }

  getRun(runId) {
    return redactSensitive(this._requireRun(runId));
  }

  _seedDefaultMinion() {
    this.minionTypes.set("pr-generator", {
      id: "pr-generator",
      name: "PR Generator",
      capabilities: ["autonomous-pr-generation"],
      entryLifecycleStage: "intake",
      deliveryStage: "delivery",
      modelConsistency: "core-workflow",
      createdAt: this.now(),
    });
  }

  _requireTask(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Unknown task ${taskId}`);
    }

    return task;
  }

  _requireRun(runId) {
    const run = this.runs.get(runId);

    if (!run) {
      throw new Error(`Unknown run ${runId}`);
    }

    return run;
  }

  _recordTaskAudit(task, eventType, detail, autonomyClass = "autonomous") {
    task.auditTrail.push({
      at: this.now(),
      eventType,
      autonomyClass,
      detail: clone(detail),
    });
  }

  _recordLedger(run, eventType, detail, autonomyClass = "autonomous") {
    run.ledger.push({
      at: this.now(),
      runId: run.id,
      eventType,
      autonomyClass,
      detail: clone(detail),
    });
  }

  _ensurePreparationRun(task) {
    if (task.runId) {
      return this._requireRun(task.runId);
    }

    if (task.policy?.outcome !== "fully-autonomous") {
      throw new Error("Task is not eligible for autonomous preparation");
    }

    const run = {
      id: this.nextId("run"),
      taskRequestId: task.id,
      currentOutcomeState: "preparing",
      progressState: {
        currentStage: "preparation",
        latestTransitionTime: this.now(),
        terminal: false,
        history: [
          {
            stage: "preparation",
            at: this.now(),
            state: "preparing",
          },
        ],
      },
      environment: null,
      preparation: {
        repositoryContext: null,
        relatedWork: {
          items: [],
          retrievalFailures: [],
          partial: false,
        },
        workingContext: null,
        conflicts: [],
        duplicates: [],
        analysis: null,
        relevance: null,
        finalOutcome: null,
        blockingReasons: [],
      },
      execution: {
        changes: [],
        currentWorkState: null,
        writeFailure: null,
        agentRun: null,
      },
      validation: null,
      evidence: [],
      completion: null,
      delivery: {
        gateHistory: [],
        branch: null,
        pullRequest: null,
      },
      failureClassification: null,
      failureSummary: null,
      preservedState: null,
      deniedRequests: [],
      operatorAudit: [],
      ledger: [],
    };

    task.runId = run.id;
    this.runs.set(run.id, run);

    for (const event of task.auditTrail) {
      run.ledger.push({
        at: event.at,
        runId: run.id,
        eventType: `task:${event.eventType}`,
        autonomyClass: event.autonomyClass,
        detail: clone(event.detail),
      });
    }

    this._recordLedger(run, "run-created", { taskRequestId: task.id });
    return run;
  }

  _transitionRun(run, stage, state = "active", detail = {}) {
    run.progressState.currentStage = stage;
    run.progressState.latestTransitionTime = this.now();
    run.progressState.terminal = TERMINAL_OUTCOMES.has(state);
    run.progressState.history.push({
      stage,
      at: run.progressState.latestTransitionTime,
      state,
      detail: clone(detail),
    });
    run.currentOutcomeState = state;
    this._recordLedger(run, "stage-transition", { stage, state, ...detail });
  }

  _markRunDeliveredSuccessfully(run) {
    const task = this._requireTask(run.taskRequestId);
    this._transitionRun(run, "delivery", "successful", {
      branchName: run.delivery.branch?.name || null,
      pullRequestId: run.delivery.pullRequest?.id || null,
    });
    task.status = "delivery-complete";
    run.failedStage = null;
    run.failureReason = null;
  }

  _denyRunRequest(run, actor, action, allowedRoles) {
    const denial = {
      at: this.now(),
      actor: clone(actor),
      action,
      reason: `actor role must be one of: ${allowedRoles.join(", ")}`,
    };
    run.deniedRequests.push(denial);
    this._recordLedger(run, "request-denied", denial, "blocked");
    return createResult(false, { denied: true, denial });
  }

  _roleAllowed(actor, allowedRoles) {
    return Boolean(actor && allowedRoles.includes(actor.role));
  }

  submitTaskRequest(payload, context = {}) {
    const fields = {
      title: payload.title,
      objective: payload.objective,
      repository: payload.repository,
      constraints: asArray(payload.constraints),
      expectedOutcome: payload.expectedOutcome,
    };
    const validationErrors = {};

    for (const [field, value] of Object.entries(fields)) {
      if (isBlank(value)) {
        validationErrors[field] = "required";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return createResult(false, {
        validationErrors,
        fieldFeedback: validationErrors,
        sideEffects: {
          taskCreated: false,
          runCreated: false,
        },
      });
    }

    const task = {
      id: this.nextId("task"),
      title: fields.title,
      objective: fields.objective,
      repository: fields.repository,
      constraints: fields.constraints,
      expectedOutcome: fields.expectedOutcome,
      requesterIdentity: context.requesterIdentity || "unknown-requester",
      entryPoint: context.entryPoint || "unknown-entry-point",
      linkedItems: clone(payload.linkedItems || []),
      requestedActions: clone(payload.requestedActions || []),
      protectedSecrets: clone(payload.protectedSecrets || []),
      unrestrictedAgentContext: clone(payload.unrestrictedAgentContext || null),
      createdAt: this.now(),
      status: "submitted",
      auditTrail: [],
    };

    this._recordTaskAudit(task, "submitted", {
      entryPoint: task.entryPoint,
      requesterIdentity: task.requesterIdentity,
      requiredFields: Object.keys(fields),
    });

    this.tasks.set(task.id, task);

    return createResult(true, {
      taskRequestId: task.id,
      task: clone(task),
      sideEffects: {
        taskCreated: true,
        runCreated: false,
      },
    });
  }

  validateMinimumRunReadiness(taskId) {
    const task = this._requireTask(taskId);
    const reasons = [];

    for (const field of ["title", "objective", "repository", "expectedOutcome"]) {
      if (isBlank(task[field])) {
        reasons.push({
          kind: "missing-field",
          field,
          reason: `${field} is required`,
        });
      }
    }

    if (isBlank(task.constraints)) {
      reasons.push({
        kind: "missing-field",
        field: "constraints",
        reason: "constraints are required",
      });
    }

    if (task.requesterIdentity === "unknown-requester") {
      reasons.push({
        kind: "missing-prerequisite",
        field: "requesterIdentity",
        reason: "requester identity must be verified",
      });
    }

    if (task.entryPoint === "unknown-entry-point") {
      reasons.push({
        kind: "missing-prerequisite",
        field: "entryPoint",
        reason: "entry point must be verified",
      });
    }

    task.readiness = {
      result: reasons.length === 0 ? "ready" : "not-ready",
      reasons,
      evaluatedAt: this.now(),
    };
    task.status =
      task.readiness.result === "ready" ? "ready-for-scope-classification" : "insufficiently-specified";

    this._recordTaskAudit(task, "minimum-run-readiness-evaluated", task.readiness);
    return clone(task.readiness);
  }

  classifyScope(taskId) {
    const task = this._requireTask(taskId);

    if (task.readiness?.result !== "ready") {
      return createResult(false, {
        reason: "task must be ready before scope classification",
      });
    }

    const text = `${task.title} ${task.objective} ${task.expectedOutcome} ${task.constraints.join(" ")}`.toLowerCase();
    const requestedActions = new Set(task.requestedActions.map((action) => String(action).toLowerCase()));

    let result = "in-scope";
    let rationale = "task matches the supported autonomous implementation workflow";

    if (text.includes("tbd") || text.includes("unknown") || text.includes("maybe")) {
      result = "insufficiently specified";
      rationale = "task still contains unresolved or speculative requirements";
    } else if (
      requestedActions.has("deploy") ||
      requestedActions.has("merge") ||
      requestedActions.has("production-data-change") ||
      text.includes("deploy") ||
      text.includes("production data")
    ) {
      result = "out-of-scope";
      rationale = "task requires workflow capabilities outside the supported MVP execution boundary";
    }

    task.scope = {
      result,
      rationale,
      evaluatedAt: this.now(),
    };
    task.status = result === "in-scope" ? "scope-approved" : result;

    this._recordTaskAudit(task, "scope-classified", task.scope, result === "in-scope" ? "autonomous" : "blocked");
    return clone(task.scope);
  }

  verifyInitiationPath(taskId, origin = {}) {
    const task = this._requireTask(taskId);
    const source = origin.source || task.entryPoint;
    const allowed = this.approvedInitiationPaths.has(source);

    task.originVerification = {
      allowed,
      source,
      evaluatedAt: this.now(),
      reason: allowed ? null : `origin ${source} is not an approved initiation path`,
      details: clone(origin.details || {}),
    };

    this._recordTaskAudit(
      task,
      "origin-verified",
      task.originVerification,
      allowed ? "autonomous" : "blocked",
    );

    return clone(task.originVerification);
  }

  evaluateAutonomyPolicy(taskId) {
    const task = this._requireTask(taskId);

    if (task.scope?.result !== "in-scope") {
      return createResult(false, {
        reason: "task must be in-scope before policy evaluation",
      });
    }

    if (!task.originVerification?.allowed) {
      return createResult(false, {
        reason: "origin must be approved before policy evaluation",
      });
    }

    const requestedActions = new Set(task.requestedActions.map((action) => String(action).toLowerCase()));
    let outcome = "fully-autonomous";
    let rationale = "requested actions stay within the configured autonomy boundary";

    if (requestedActions.has("deploy") || requestedActions.has("merge")) {
      outcome = "blocked";
      rationale = "merge and deploy actions are outside the allowed autonomy boundary";
    } else if (
      requestedActions.has("schema-migration") ||
      requestedActions.has("production-write") ||
      requestedActions.has("security-sensitive-change")
    ) {
      outcome = "requires-approval";
      rationale = "the task crosses an approval-gated autonomy boundary";
    }

    task.policy = {
      outcome,
      rationale,
      evaluatedAt: this.now(),
    };
    task.status = outcome === "fully-autonomous" ? "ready-for-preparation" : outcome;

    this._recordTaskAudit(
      task,
      "autonomy-policy-evaluated",
      task.policy,
      outcome === "fully-autonomous" ? "autonomous" : outcome === "requires-approval" ? "approval-gated" : "blocked",
    );

    return clone(task.policy);
  }

  async runAutonomousFlow(taskId) {
    const task = this._requireTask(taskId);

    if (task.runId) {
      const existingRun = this._requireRun(task.runId);

      if (existingRun.delivery?.pullRequest) {
        if (!TERMINAL_OUTCOMES.has(existingRun.currentOutcomeState)) {
          this._markRunDeliveredSuccessfully(existingRun);
        }

        return createResult(false, {
          stage: "delivery",
          reason: "task already has a completed delivery run",
          runId: existingRun.id,
          existingRun: clone({
            currentOutcomeState: existingRun.currentOutcomeState,
            currentStage: existingRun.progressState.currentStage,
            branch: existingRun.delivery.branch,
            pullRequest: existingRun.delivery.pullRequest,
          }),
        });
      }

      if (!TERMINAL_OUTCOMES.has(existingRun.currentOutcomeState)) {
        return createResult(false, {
          stage: existingRun.progressState.currentStage,
          reason: "task already has an active run in progress",
          runId: existingRun.id,
          existingRun: clone({
            currentOutcomeState: existingRun.currentOutcomeState,
            currentStage: existingRun.progressState.currentStage,
          }),
        });
      }
    }

    const readiness = this.validateMinimumRunReadiness(taskId);
    if (readiness.result !== "ready") {
      return createResult(false, { stage: "readiness", detail: readiness });
    }

    const scope = this.classifyScope(taskId);
    if (scope.result !== "in-scope") {
      return createResult(false, { stage: "scope", detail: scope });
    }

    const origin = this.verifyInitiationPath(taskId);
    if (!origin.allowed) {
      return createResult(false, { stage: "origin", detail: origin });
    }

    const policy = this.evaluateAutonomyPolicy(taskId);
    if (policy.outcome !== "fully-autonomous") {
      return createResult(false, { stage: "policy", detail: policy });
    }

    const repositoryContext = this.retrieveRepositoryContext(taskId);
    if (!repositoryContext.ok) {
      return createResult(false, { stage: "repository-context", detail: repositoryContext });
    }

    const relatedWork = this.retrieveRelatedWorkContext(taskId);
    if (!relatedWork.ok) {
      return createResult(false, { stage: "related-work", detail: relatedWork });
    }

    const workingContext = this.buildWorkingContext(taskId);
    if (!workingContext.ok) {
      return createResult(false, { stage: "working-context", detail: workingContext });
    }

    const analysis = await this.analyzeTaskAndRepoAsync(taskId);
    if (!analysis.ok) {
      return createResult(false, { stage: "analysis", detail: analysis });
    }

    const relevance = this.identifyRelevantChangeSurface(taskId);
    if (!relevance.ok) {
      return createResult(false, { stage: "relevance", detail: relevance });
    }

    const preparation = this.evaluateCriticalContext(taskId);
    if (preparation.result !== "ready") {
      return createResult(false, { stage: "critical-context", detail: preparation });
    }

    const startup = this.startIsolatedRunEnvironment(taskId);
    if (!startup.ok) {
      return createResult(false, { stage: "environment-startup", detail: startup });
    }

    const execution = await this.executeRepositoryChangesAsync(startup.runId);
    if (!execution.ok) {
      return createResult(false, { stage: "execution", detail: execution, runId: startup.runId });
    }

    const validation = this.runRepositoryValidation(startup.runId);
    if (!validation.ok) {
      return createResult(false, { stage: "validation", detail: validation, runId: startup.runId });
    }

    this.captureStructuredValidationEvidence(startup.runId);
    const completion = this.determineCompletionStatus(startup.runId);

    if (completion.state !== "successful") {
      this.classifyRunFailure(startup.runId);
      this.produceFailureSummary(startup.runId);
      this.preserveIntermediateState(startup.runId);
      return createResult(false, {
        stage: "completion",
        detail: completion,
        runId: startup.runId,
      });
    }

    const branch = await this.createDeliveryBranchAsync(startup.runId);
    if (!branch.ok) {
      this.classifyRunFailure(startup.runId);
      this.produceFailureSummary(startup.runId);
      this.preserveIntermediateState(startup.runId);
      return createResult(false, { stage: "delivery-branch", detail: branch, runId: startup.runId });
    }

    const pullRequest = await this.publishPullRequestAsync(startup.runId);
    if (!pullRequest.ok) {
      this.classifyRunFailure(startup.runId);
      this.produceFailureSummary(startup.runId);
      this.preserveIntermediateState(startup.runId);
      return createResult(false, { stage: "pull-request", detail: pullRequest, runId: startup.runId });
    }

    this._markRunDeliveredSuccessfully(this._requireRun(startup.runId));

    return createResult(true, {
      taskId,
      runId: startup.runId,
      completion,
      branch: branch.branch,
      pullRequest: pullRequest.pullRequest,
    });
  }

  retrieveRepositoryContext(taskId) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);
    const target = this.supportedTargets.get(task.repository);

    if (!target) {
      run.preparation.repositoryFailure = {
        stage: "repository-context",
        reason: `repository ${task.repository} could not be resolved`,
      };
      run.preparation.repositoryContext = null;
      run.currentOutcomeState = "blocked";
      this._recordLedger(run, "repository-context-failed", run.preparation.repositoryFailure, "blocked");

      return createResult(false, {
        preparationFailure: clone(run.preparation.repositoryFailure),
      });
    }

    if (target.failures?.repositoryAccess) {
      run.preparation.repositoryFailure = {
        stage: "repository-context",
        reason: target.failures.repositoryAccess,
      };
      this._recordLedger(run, "repository-context-failed", run.preparation.repositoryFailure, "blocked");

      return createResult(false, {
        preparationFailure: clone(run.preparation.repositoryFailure),
      });
    }

    let resolvedTarget = target;
    if (target.repositoryPath) {
      try {
        resolvedTarget = {
          ...target,
          ...analyzeLocalRepositoryTarget(target),
        };
        this.supportedTargets.set(task.repository, resolvedTarget);
      } catch (error) {
        run.preparation.repositoryFailure = {
          stage: "repository-context",
          reason: error instanceof Error ? error.message : "local repository analysis failed",
        };
        this._recordLedger(run, "repository-context-failed", run.preparation.repositoryFailure, "blocked");
        return createResult(false, {
          preparationFailure: clone(run.preparation.repositoryFailure),
        });
      }
    }

    run.preparation.repositoryContext = {
      repositoryId: resolvedTarget.repositoryId,
      teamId: resolvedTarget.teamId,
      metadata: clone(resolvedTarget.metadata || {}),
      files: clone(resolvedTarget.files || []),
      validationSteps: clone(resolvedTarget.validationSteps || []),
      retrievedAt: this.now(),
    };
    this._recordLedger(run, "repository-context-retrieved", {
      repositoryId: resolvedTarget.repositoryId,
      fileCount: run.preparation.repositoryContext.files.length,
    });

    return createResult(true, {
      repositoryContext: clone(run.preparation.repositoryContext),
      runId: run.id,
    });
  }

  retrieveRelatedWorkContext(taskId) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);
    const links = clone(task.linkedItems || []);

    if (links.length === 0) {
      run.preparation.relatedWork = {
        items: [],
        retrievalFailures: [],
        partial: false,
        retrievedAt: this.now(),
      };
      this._recordLedger(run, "related-work-skipped", { reason: "no approved linked references" });
      return createResult(true, { relatedWork: clone(run.preparation.relatedWork) });
    }

    const items = [];
    const retrievalFailures = [];

    for (const link of links) {
      if (!APPROVED_SYSTEMS.has(link.system)) {
        retrievalFailures.push({
          source: link.system,
          id: link.id,
          reason: "source is not an approved engineering system",
          incomplete: true,
        });
        continue;
      }

      const entry = this.linkedContexts.get(`${link.system}:${link.id}`);

      if (!entry) {
        retrievalFailures.push({
          source: link.system,
          id: link.id,
          reason: "linked context could not be retrieved",
          incomplete: true,
        });
        continue;
      }

      if (entry.unavailable || entry.incomplete) {
        retrievalFailures.push({
          source: link.system,
          id: link.id,
          reason: entry.reason || "source unavailable or incomplete",
          incomplete: true,
        });
      }

      if (!entry.unavailable) {
        items.push({
          source: link.system,
          id: link.id,
          summary: entry.summary,
          signals: clone(entry.signals || {}),
          topic: entry.topic || null,
          conflictKey: entry.conflictKey || null,
          conflictValue: entry.conflictValue || null,
        });
      }
    }

    run.preparation.relatedWork = {
      items,
      retrievalFailures,
      partial: retrievalFailures.length > 0,
      retrievedAt: this.now(),
    };

    this._recordLedger(run, "related-work-retrieved", {
      itemCount: items.length,
      partial: run.preparation.relatedWork.partial,
      failedSources: retrievalFailures.map((failure) => failure.source),
    });

    return createResult(true, { relatedWork: clone(run.preparation.relatedWork) });
  }

  buildWorkingContext(taskId) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);
    const repositoryContext = run.preparation.repositoryContext;

    if (!repositoryContext) {
      return createResult(false, {
        reason: "repository context is required before working context assembly",
      });
    }

    const sourceInputs = [
      { kind: "task", id: task.id },
      { kind: "repository", id: repositoryContext.repositoryId },
      ...run.preparation.relatedWork.items.map((item) => ({
        kind: item.source,
        id: item.id,
      })),
    ];

    const duplicates = [];
    const seen = new Set();

    for (const input of sourceInputs) {
      const key = `${input.kind}:${input.id}`;
      if (seen.has(key)) {
        duplicates.push(key);
      } else {
        seen.add(key);
      }
    }

    const conflicts = [];
    const conflictMap = new Map();

    for (const item of run.preparation.relatedWork.items) {
      if (!item.conflictKey) {
        continue;
      }

      const current = conflictMap.get(item.conflictKey);
      if (current && current !== item.conflictValue) {
        conflicts.push({
          key: item.conflictKey,
          values: [current, item.conflictValue],
        });
      } else {
        conflictMap.set(item.conflictKey, item.conflictValue);
      }
    }

    run.preparation.duplicates = duplicates;
    run.preparation.conflicts = conflicts;
    run.preparation.workingContext = {
      taskId: task.id,
      repositoryId: repositoryContext.repositoryId,
      taskSummary: {
        title: task.title,
        objective: task.objective,
        expectedOutcome: task.expectedOutcome,
        constraints: clone(task.constraints),
      },
      repositoryContext: clone(repositoryContext.metadata),
      relatedWork: clone(run.preparation.relatedWork.items),
      sourceInputs,
      createdAt: this.now(),
    };

    this._recordLedger(run, "working-context-built", {
      sourceCount: sourceInputs.length,
      duplicateCount: duplicates.length,
      conflictCount: conflicts.length,
    });

    return createResult(true, {
      workingContext: clone(run.preparation.workingContext),
      duplicates: clone(duplicates),
      conflicts: clone(conflicts),
    });
  }

  async analyzeTaskAndRepoAsync(taskId) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);
    const target = this.supportedTargets.get(task.repository);

    if (!run.preparation.workingContext || !run.preparation.repositoryContext) {
      return createResult(false, {
        reason: "working and repository context must exist before task analysis",
      });
    }

    let analysis = null;

    if (target?.executionMode === "agent-runner" && this.executionRunner?.analyze && target.repositoryPath) {
      try {
        const result = await this.executionRunner.analyze({
          task: {
            id: task.id,
            title: task.title,
            objective: task.objective,
            constraints: clone(task.constraints),
            expectedOutcome: task.expectedOutcome,
          },
          repository: {
            repositoryId: target.repositoryId,
            repositoryPath: target.repositoryPath,
            files: clone((run.preparation.repositoryContext.files || []).slice(0, 200)),
            validationSteps: clone(run.preparation.repositoryContext.validationSteps || []),
            metadata: clone(run.preparation.repositoryContext.metadata || {}),
          },
          context: {
            workingContext: clone(run.preparation.workingContext || {}),
            relatedWork: clone(run.preparation.relatedWork?.items || []),
          },
        });

        if (result?.ok && result.final) {
          analysis = {
            runner: result.provider || null,
            backend: result.provider || null,
            provider: result.modelProvider || null,
            modelProvider: result.modelProvider || null,
            taskType: result.final.taskType || "code-change",
            shouldProceed: result.final.shouldProceed !== false,
            summary: result.final.summary || "AI task analysis completed",
            reasoning: result.final.reasoning || "",
            relevantFiles: asArray(result.final.relevantFiles)
              .map((item) => normalizeRepositoryRelativePath(target.repositoryPath, item))
              .filter(Boolean),
            testFiles: asArray(result.final.testFiles)
              .map((item) => normalizeRepositoryRelativePath(target.repositoryPath, item))
              .filter(Boolean),
            notes: asArray(result.final.notes).map((item) => String(item)).filter(Boolean),
            completedAt: this.now(),
          };
        }
      } catch {
        analysis = null;
      }
    }

    if (!analysis) {
      const heuristicFiles = (run.preparation.repositoryContext.files || []).slice(0, 8).map((file) => file.path);
      analysis = {
        provider: "heuristic-fallback",
        taskType: "code-change",
        shouldProceed: true,
        summary: "Fallback preparation analysis based on repository metadata.",
        reasoning: "Execution runner analysis was unavailable, so Minions is proceeding with repository metadata only.",
        relevantFiles: heuristicFiles,
        testFiles: (run.preparation.repositoryContext.files || [])
          .filter((file) => file.type === "test")
          .slice(0, 4)
          .map((file) => file.path),
        notes: [],
        completedAt: this.now(),
      };
    }

    run.preparation.analysis = analysis;
    this._recordLedger(run, "task-analysis-completed", {
      runner: analysis.runner || null,
      backend: analysis.backend || null,
      provider: analysis.provider || null,
      modelProvider: analysis.modelProvider || null,
      taskType: analysis.taskType,
      shouldProceed: analysis.shouldProceed,
      relevantFileCount: analysis.relevantFiles.length,
      testFileCount: analysis.testFiles.length,
    });

    return createResult(true, {
      analysis: clone(run.preparation.analysis),
    });
  }

  identifyRelevantChangeSurface(taskId) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);

    if (!run.preparation.workingContext) {
      return createResult(false, {
        reason: "working context must exist before relevance analysis",
      });
    }

    const files = run.preparation.repositoryContext?.files || [];
    const keywords = new Set(
      normalizeWords(`${task.title} ${task.objective} ${task.expectedOutcome} ${task.constraints.join(" ")}`),
    );

    const heuristicRanked = files
      .map((file) => {
        const fileKeywords = new Set([
          ...normalizeWords(file.path),
          ...normalizeWords(file.area),
          ...normalizeWords((file.keywords || []).join(" ")),
        ]);
        const score = [...keywords].filter((word) => fileKeywords.has(word)).length;

        return {
          path: file.path,
          area: file.area || "unknown",
          type: file.type || "code",
          score,
        };
      })
      .sort((left, right) => right.score - left.score);

    const rankedByPath = new Map();
    for (const entry of heuristicRanked.filter((item) => item.score > 0)) {
      rankedByPath.set(entry.path, entry);
    }

    const analysisHints = [
      ...asArray(run.preparation.analysis?.relevantFiles),
      ...asArray(run.preparation.analysis?.testFiles),
    ];
    for (const hintedPath of analysisHints) {
      if (!hintedPath) {
        continue;
      }

      const existing = rankedByPath.get(hintedPath);
      if (existing) {
        rankedByPath.set(hintedPath, {
          ...existing,
          score: Math.max(existing.score, 1000),
          hintedByAnalysis: true,
        });
        continue;
      }

      const repositoryFile = files.find((file) => file.path === hintedPath);
      rankedByPath.set(hintedPath, {
        path: hintedPath,
        area: repositoryFile?.area || inferAreaFromPath(hintedPath),
        type: repositoryFile?.type || inferFileTypeFromPath(hintedPath),
        score: 1000,
        hintedByAnalysis: true,
      });
    }

    const relevantFiles = [...rankedByPath.values()].sort((left, right) => right.score - left.score);
    const topScore = relevantFiles[0]?.score || 0;
    const sufficientConfidence =
      topScore > 0 ||
      run.preparation.analysis?.shouldProceed === true ||
      ["analysis-only", "documentation"].includes(run.preparation.analysis?.taskType);

    run.preparation.relevance = {
      rankedFiles: relevantFiles,
      codeAreas: relevantFiles.filter((entry) => entry.type !== "test").map((entry) => entry.area),
      testSurfaces: relevantFiles.filter((entry) => entry.type === "test").map((entry) => entry.path),
      sufficientConfidence,
      lowConfidenceReason: sufficientConfidence
        ? null
        : "no sufficiently relevant code or test surface could be identified heuristically",
      analyzedAt: this.now(),
    };

    this._recordLedger(run, "relevance-analyzed", {
      sufficientConfidence,
      resultCount: relevantFiles.length,
    });

    return createResult(true, { relevance: clone(run.preparation.relevance) });
  }

  evaluateCriticalContext(taskId) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);
    const reasons = [];
    let result = "ready";

    if (run.preparation.repositoryFailure || !run.preparation.repositoryContext) {
      result = "blocked-missing-context";
      reasons.push({
        kind: "missing-context",
        reason: "repository context is missing or unresolved",
      });
    }

    if (!run.preparation.workingContext) {
      result = "blocked-missing-context";
      reasons.push({
        kind: "missing-context",
        reason: "working context has not been assembled",
      });
    }

    if (run.preparation.analysis?.shouldProceed === false || run.preparation.analysis?.taskType === "blocked") {
      result = "blocked-missing-context";
      reasons.push({
        kind: "missing-context",
        reason: run.preparation.analysis?.summary || "AI task analysis determined the run should not proceed",
      });
    }

    if (run.preparation.conflicts.length > 0) {
      result = "blocked-conflicting-context";
      reasons.length = 0;
      reasons.push(
        ...run.preparation.conflicts.map((conflict) => ({
          kind: "conflicting-context",
          reason: `conflict on ${conflict.key}`,
          detail: conflict,
        })),
      );
    }

    run.preparation.finalOutcome = {
      result,
      reasons,
      warnings:
        !run.preparation.relevance?.sufficientConfidence && result === "ready"
          ? [
              {
                kind: "advisory",
                reason:
                  run.preparation.relevance?.lowConfidenceReason ||
                  "heuristic relevance confidence is low, proceeding with AI-guided investigation",
              },
            ]
          : [],
      evaluatedAt: this.now(),
    };

    this._recordLedger(
      run,
      "critical-context-evaluated",
      run.preparation.finalOutcome,
      result === "ready" ? "autonomous" : "blocked",
    );

    return clone(run.preparation.finalOutcome);
  }

  startIsolatedRunEnvironment(taskId, options = {}) {
    const task = this._requireTask(taskId);
    const run = this._ensurePreparationRun(task);

    if (run.preparation.finalOutcome?.result !== "ready") {
      return createResult(false, {
        reason: "preparation must be ready before isolated run startup",
      });
    }

    const target = this.supportedTargets.get(task.repository);
    const failureReason = options.forceFailure || target?.failures?.environmentStartup;

    if (failureReason) {
      run.environment = {
        id: this.nextId("env"),
        status: "failed",
        reason: String(failureReason),
      };
      run.failedStage = "environment-startup";
      run.failureReason = run.environment.reason;
      this._transitionRun(run, "environment-startup", "failed", { reason: run.failureReason });
      return createResult(false, { environment: clone(run.environment) });
    }

    run.environment = {
      id: this.nextId("env"),
      status: "active",
      startedAt: this.now(),
    };
    this._transitionRun(run, "environment-startup", "active", {
      environmentId: run.environment.id,
    });

    return createResult(true, { environment: clone(run.environment), runId: run.id });
  }

  executeRepositoryChanges(runId, options = {}) {
    const run = this._requireRun(runId);

    if (run.environment?.status !== "active" || run.preparation.finalOutcome?.result !== "ready") {
      return createResult(false, {
        reason: "active environment and ready preparation are required before execution",
      });
    }

    const target = this.supportedTargets.get(this._requireTask(run.taskRequestId).repository);
    const failureReason = options.forceWriteFailure || target?.failures?.repositoryWrite;

    this._transitionRun(run, "execution", "active", { phase: "repository-change-application" });

    if (failureReason) {
      run.execution.writeFailure = {
        stage: "execution",
        reason: String(failureReason),
      };
      run.failedStage = "execution";
      run.failureReason = run.execution.writeFailure.reason;
      this._transitionRun(run, "execution", "failed", {
        reason: run.execution.writeFailure.reason,
      });

      return createResult(false, {
        writeFailure: clone(run.execution.writeFailure),
      });
    }

    const relevantFiles = run.preparation.relevance?.rankedFiles || [];
    const defaultChanges = relevantFiles.slice(0, 3).map((file) => ({
      path: file.path,
      action: "modify",
      summary: `Updated ${file.path} for ${this._requireTask(run.taskRequestId).title}`,
    }));

    run.execution.changes = clone(options.changes || defaultChanges);
    run.execution.currentWorkState = {
      changedFiles: run.execution.changes.map((change) => change.path),
      changeCount: run.execution.changes.length,
      lastUpdatedAt: this.now(),
    };
    run.hasAutonomousChanges = run.execution.changes.length > 0;

    this._transitionRun(run, "execution", "active", {
      changedFiles: run.execution.currentWorkState.changedFiles,
    });

    return createResult(true, {
      changes: clone(run.execution.changes),
      currentWorkState: clone(run.execution.currentWorkState),
    });
  }

  async executeRepositoryChangesAsync(runId, options = {}) {
    const run = this._requireRun(runId);
    const task = this._requireTask(run.taskRequestId);
    const target = this.supportedTargets.get(task.repository);

    if (
      target?.executionMode === "agent-runner" &&
      this.executionRunner &&
      target.repositoryPath &&
      !options.forceWriteFailure
    ) {
      return this._executeRepositoryChangesWithRunner(run, target);
    }

    return this.executeRepositoryChanges(runId, options);
  }

  async _executeRepositoryChangesWithRunner(run, target) {
    if (run.environment?.status !== "active" || run.preparation.finalOutcome?.result !== "ready") {
      return createResult(false, {
        reason: "active environment and ready preparation are required before execution",
      });
    }

    const task = this._requireTask(run.taskRequestId);
    this._transitionRun(run, "execution", "active", { phase: "repository-change-application" });

    let result;
    try {
      const executionPacket = {
        task: {
          id: task.id,
          title: task.title,
          objective: task.objective,
          constraints: clone(task.constraints),
          expectedOutcome: task.expectedOutcome,
        },
        repository: {
          repositoryId: target.repositoryId,
          repositoryPath: target.repositoryPath,
          metadata: clone(run.preparation.repositoryContext?.metadata || target.metadata || {}),
        },
        context: {
          workingContext: clone(run.preparation.workingContext || {}),
          analysis: clone(run.preparation.analysis || {}),
          relevantFiles: clone((run.preparation.relevance?.rankedFiles || []).slice(0, 12)),
          validationSteps: clone(run.preparation.repositoryContext?.validationSteps || target.validationSteps || []),
          relatedWork: clone(run.preparation.relatedWork?.items || []),
        },
      };
      const runtimeExecutor = target.orchestrator || this.executionRunner;
      result = await withTimeout(
        runtimeExecutor.run(executionPacket),
        this.executionTimeoutMs,
        `agent runner timed out after ${this.executionTimeoutMs}ms`,
      );
    } catch (error) {
      result = {
        ok: false,
        exitCode: null,
        stdout: "",
        stderr: "",
        final: null,
        error: error instanceof Error ? error.message : "agent runner failed unexpectedly",
      };
    }

    const final = result.final || null;
    const finalPayload = final && typeof final === "object" && !Array.isArray(final) ? final : null;
    const finalSummary =
      finalPayload?.summary ||
      (typeof final === "string" && final.trim() ? final.trim() : null);
    let changedFiles = Array.isArray(finalPayload?.changedFiles)
      ? [
          ...new Set(
            finalPayload.changedFiles
              .map((item) => normalizeRepositoryRelativePath(target.repositoryPath, item))
              .filter(Boolean),
          ),
        ]
      : [];
    const commandsRun = Array.isArray(finalPayload?.commandsRun)
      ? finalPayload.commandsRun.map((item) => String(item).trim()).filter(Boolean)
      : [];
    const notes = Array.isArray(finalPayload?.notes)
      ? finalPayload.notes.map((item) => String(item).trim()).filter(Boolean)
      : [];
    const failureReason =
      result.error ||
      finalSummary ||
      (result.exitCode === null ? "agent runner did not complete" : `agent runner exited with code ${result.exitCode}`);

    if (result.ok && target.repositoryPath && changedFiles.length === 0) {
      const status = await readWorkingTreeStatus(target.repositoryPath);
      changedFiles = [...new Set(status.entries.map((entry) => entry.path).filter(Boolean))];
    }

    if (!result.ok && target.repositoryPath) {
      const recovered = await this._recoverExecutionFromWorktree(run, target, {
        provider: result.provider || null,
        modelProvider: result.modelProvider || null,
        summary: finalSummary,
        failureReason,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        notes,
        commandsRun,
      });

      if (recovered) {
        return recovered;
      }
    }

    run.execution.agentRun = {
      runner: result.provider || null,
      provider: result.modelProvider || null,
      backend: result.provider || null,
      orchestrationMode: this.orchestrationMode,
      orchestrated: Boolean(result.orchestrated),
      exitCode: result.exitCode,
      outcome: finalPayload?.outcome || (result.ok ? "completed" : "failed"),
      summary: finalSummary,
      commandsRun,
      notes,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      completedAt: this.now(),
    };

    if (!result.ok || finalPayload?.outcome === "failed" || finalPayload?.outcome === "blocked") {
      run.execution.writeFailure = {
        stage: "execution",
        reason: failureReason,
      };
      run.failedStage = "execution";
      run.failureReason = failureReason;
      this._recordLedger(
        run,
        "agent-run-failed",
        {
          runner: result.provider || null,
          provider: result.modelProvider || null,
          backend: result.provider || null,
          exitCode: result.exitCode,
          outcome: run.execution.agentRun.outcome,
          reason: failureReason,
        },
        "blocked",
      );
      this._transitionRun(run, "execution", "failed", {
        reason: failureReason,
      });

      return createResult(false, {
        writeFailure: clone(run.execution.writeFailure),
      });
    }

    run.execution.writeFailure = null;
    run.execution.changes = changedFiles.map((filePath) => ({
      path: filePath,
      action: "modify",
      summary: final.summary || `Updated ${filePath} via autonomous runner`,
    }));
    run.execution.currentWorkState = {
      changedFiles,
      changeCount: changedFiles.length,
      commandsRun,
      notes,
      lastUpdatedAt: this.now(),
    };
    run.hasAutonomousChanges = changedFiles.length > 0;

    this._recordLedger(run, "agent-run-completed", {
      runner: result.provider || null,
      provider: result.modelProvider || null,
      backend: result.provider || null,
      exitCode: result.exitCode,
      outcome: run.execution.agentRun.outcome,
      changedFiles,
      commandCount: commandsRun.length,
    });
    this._transitionRun(run, "execution", "active", {
      changedFiles,
    });

    return createResult(true, {
      changes: clone(run.execution.changes),
      currentWorkState: clone(run.execution.currentWorkState),
      agentRun: clone(run.execution.agentRun),
    });
  }

  async _recoverExecutionFromWorktree(run, target, fallback = {}) {
    const status = await readWorkingTreeStatus(target.repositoryPath);
    const changedFiles = [...new Set(status.entries.map((entry) => entry.path).filter(Boolean))];

    if (changedFiles.length === 0) {
      return null;
    }

    run.execution.agentRun = {
      runner: fallback.provider || null,
      provider: fallback.modelProvider || null,
      backend: fallback.provider || null,
      exitCode: null,
      outcome: "completed",
      summary: fallback.summary || "Recovered execution result from repository worktree state.",
      commandsRun: clone(fallback.commandsRun || []),
      notes: [
        ...(fallback.notes || []),
        "Minions recovered this execution from the git worktree because the agent runner did not return a final result.",
      ],
      stdout: fallback.stdout || "",
      stderr: fallback.stderr || "",
      completedAt: this.now(),
      recoveredFromWorktree: true,
    };
    run.execution.writeFailure = null;
    run.execution.changes = changedFiles.map((filePath) => ({
      path: filePath,
      action: "modify",
      summary: fallback.summary || `Recovered ${filePath} from worktree state`,
    }));
    run.execution.currentWorkState = {
      changedFiles,
      changeCount: changedFiles.length,
      commandsRun: clone(fallback.commandsRun || []),
      notes: clone(run.execution.agentRun.notes),
      lastUpdatedAt: this.now(),
    };
    run.hasAutonomousChanges = changedFiles.length > 0;

    this._recordLedger(run, "agent-run-recovered", {
      runner: fallback.provider || null,
      provider: fallback.modelProvider || null,
      backend: fallback.provider || null,
      changedFiles,
      reason: fallback.failureReason || "agent runner did not return a final result",
    });
    this._transitionRun(run, "execution", "active", {
      changedFiles,
      recoveredFromWorktree: true,
    });

    return createResult(true, {
      changes: clone(run.execution.changes),
      currentWorkState: clone(run.execution.currentWorkState),
      agentRun: clone(run.execution.agentRun),
      recoveredFromWorktree: true,
    });
  }

  markUnexpectedStop(runId, reason, state = "interrupted") {
    const run = this._requireRun(runId);
    run.failedStage = run.progressState.currentStage;
    run.failureReason = reason;
    this._transitionRun(run, run.progressState.currentStage, state, { reason });
    return clone(run.progressState);
  }

  enforceRuntimeStopCondition(runId, proposedAction) {
    const run = this._requireRun(runId);
    const actionType = String(proposedAction.type || "unknown");
    const allowed = this.allowedRuntimeActions.has(actionType) && !proposedAction.crossesBoundary;

    if (allowed) {
      this._recordLedger(run, "runtime-action-allowed", { actionType });
      return createResult(true, { allowed: true });
    }

    run.stopReason = proposedAction.reason || `runtime action ${actionType} crosses an autonomy boundary`;
    run.failedStage = "runtime-boundary";
    run.execution.currentWorkState = {
      ...(run.execution.currentWorkState || {}),
      boundaryStopAt: this.now(),
    };
    this._transitionRun(run, "runtime-boundary", "boundary-stopped", {
      reason: run.stopReason,
    });

    return createResult(false, {
      allowed: false,
      stopReason: run.stopReason,
      preservedWorkState: clone(run.execution.currentWorkState),
    });
  }

  getInProgressStatus(runId, actor) {
    const run = this._requireRun(runId);

    if (!this._roleAllowed(actor, ["engineer", "operator"])) {
      return this._denyRunRequest(run, actor, "read-in-progress-status", ["engineer", "operator"]);
    }

    if (TERMINAL_OUTCOMES.has(run.currentOutcomeState)) {
      return createResult(false, {
        reason: "run is already terminal",
      });
    }

    const task = this._requireTask(run.taskRequestId);
    const status = redactSensitive({
      runId,
      currentStage: run.progressState.currentStage,
      latestTransitionTime: run.progressState.latestTransitionTime,
      currentOutcomeState: run.currentOutcomeState,
      secretContext: task.protectedSecrets,
      unrestrictedAgentContext: task.unrestrictedAgentContext,
    });
    this._recordLedger(run, "status-read", { actor: actor.role, currentStage: status.currentStage });
    return createResult(true, { status });
  }

  accessOperatorInterface(runId, actor, action = "inspect-run") {
    const run = this._requireRun(runId);

    if (!this._roleAllowed(actor, ["operator"])) {
      return this._denyRunRequest(run, actor, `operator:${action}`, ["operator"]);
    }

    if (!this.operatorActions.has(action)) {
      const blocked = {
        at: this.now(),
        actor: clone(actor),
        action,
        reason: "operator action is outside approved scope",
      };
      run.operatorAudit.push(blocked);
      this._recordLedger(run, "operator-action-blocked", blocked, "blocked");
      return createResult(false, { authorizationFailure: blocked });
    }

    const event = {
      at: this.now(),
      actor: clone(actor),
      action,
    };
    run.operatorAudit.push(event);
    this._recordLedger(run, "operator-action", event, "approval-gated");

    if (action === "pause-run" && !TERMINAL_OUTCOMES.has(run.currentOutcomeState)) {
      this._transitionRun(run, "operator-paused", "active", { actor: actor.name || actor.role });
    }

    if (action === "resume-run" && run.progressState.currentStage === "operator-paused") {
      this._transitionRun(run, "execution", "active", { actor: actor.name || actor.role });
    }

    if (action === "retry-delivery-gates") {
      return createResult(true, {
        action,
        metadata: {
          runId: run.id,
          deliveryGate: this.evaluateDeliveryGates(runId),
        },
      });
    }

    return createResult(true, {
      action,
      metadata: redactSensitive({
        runId: run.id,
        currentStage: run.progressState.currentStage,
        currentOutcomeState: run.currentOutcomeState,
        availableActions: [...this.operatorActions],
      }),
    });
  }

  runRepositoryValidation(runId, options = {}) {
    const run = this._requireRun(runId);

    if (!run.hasAutonomousChanges) {
      return createResult(false, {
        reason: "validation requires an active run with autonomous repository changes",
      });
    }

    const task = this._requireTask(run.taskRequestId);
    const target = this.supportedTargets.get(task.repository);
    const configuredSteps = clone(options.steps || target?.validationSteps || []);
    const startedAt = this.now();
    const steps = configuredSteps.map((step, index) => {
      const id = step.id || `validation-step-${index + 1}`;
      const resultStatus = step.malformed
        ? "incomplete"
        : step.status || (step.pass === false ? "failed" : "passed");
      return {
        id,
        resultStatus,
        output: step.output || null,
        rawOutput: step.rawOutput || null,
        malformed: Boolean(step.malformed),
      };
    });

    const completionState = steps.some((step) => step.resultStatus === "failed") ? "failed" : "completed";
    run.validation = {
      stage: "validation",
      startedAt,
      completedAt: this.now(),
      completionState,
      steps,
      failingSteps: steps.filter((step) => step.resultStatus === "failed"),
    };

    if (run.validation.failingSteps.length > 0) {
      run.failedStage = "validation";
      run.failureReason = `validation failed at ${run.validation.failingSteps[0].id}`;
    }

    this._transitionRun(run, "validation", "active", {
      stepCount: steps.length,
      completionState,
    });

    return createResult(true, { validation: clone(run.validation) });
  }

  captureStructuredValidationEvidence(runId) {
    const run = this._requireRun(runId);

    if (!run.validation) {
      return createResult(false, {
        reason: "validation must complete before evidence capture",
      });
    }

    run.evidence = run.validation.steps.map((step) => ({
      evidenceId: this.nextId("evidence"),
      stepId: step.id,
      resultStatus: step.resultStatus,
      runStage: "validation",
      incomplete: step.resultStatus === "incomplete" || step.malformed,
      rawResultAssociation: step.rawOutput || step.output || null,
    }));

    this._recordLedger(run, "validation-evidence-captured", {
      evidenceCount: run.evidence.length,
      incompleteCount: run.evidence.filter((item) => item.incomplete).length,
    });

    return createResult(true, { evidence: clone(run.evidence) });
  }

  determineCompletionStatus(runId) {
    const run = this._requireRun(runId);

    if (!run.validation) {
      return createResult(false, {
        reason: "validation must complete before completion evaluation",
      });
    }

    const evidence = run.evidence.length > 0 ? run.evidence : this.captureStructuredValidationEvidence(runId).evidence;
    let state = "successful";
    const unmetReasons = [];

    if (evidence.some((item) => item.resultStatus === "failed")) {
      state = "failed";
      unmetReasons.push("one or more validation steps failed");
    } else if (evidence.some((item) => item.incomplete)) {
      state = "partial";
      unmetReasons.push("validation evidence is incomplete");
    }

    run.completion = {
      state,
      evidenceIds: evidence.map((item) => item.evidenceId),
      unmetReasons,
      evaluatedAt: this.now(),
      readyForPullRequest: state === "successful",
    };

    if (state !== "successful" && !run.failedStage) {
      run.failedStage = "validation";
      run.failureReason = unmetReasons[0] || "working-code-with-tests standard not met";
    }

    run.currentOutcomeState = state;
    this._recordLedger(
      run,
      "completion-evaluated",
      run.completion,
      state === "successful" ? "autonomous" : "blocked",
    );

    return clone(run.completion);
  }

  evaluateDeliveryGates(runId) {
    const run = this._requireRun(runId);
    const failedGates = [];

    if (run.completion?.state !== "successful") {
      failedGates.push("completion-state-successful");
    }

    if (!run.evidence.length || run.evidence.some((item) => item.incomplete || item.resultStatus === "failed")) {
      failedGates.push("validation-evidence-complete");
    }

    const evaluation = {
      at: this.now(),
      eligible: failedGates.length === 0,
      failedGates,
    };
    run.delivery.gateHistory.push(evaluation);
    this._recordLedger(run, "delivery-gates-evaluated", evaluation, evaluation.eligible ? "autonomous" : "blocked");
    return clone(evaluation);
  }

  createDeliveryBranch(runId, options = {}) {
    const run = this._requireRun(runId);
    const gates = this.evaluateDeliveryGates(runId);

    if (!gates.eligible) {
      return createResult(false, {
        reason: "run is not eligible for delivery branch creation",
        gates,
      });
    }

    const task = this._requireTask(run.taskRequestId);
    const target = this.supportedTargets.get(task.repository);
    const failureReason = options.forceFailure || target?.failures?.deliveryBranch;

    if (failureReason) {
      run.failedStage = "delivery-branch";
      run.failureReason = String(failureReason);
      this._recordLedger(run, "delivery-branch-failed", {
        reason: run.failureReason,
      }, "blocked");
      return createResult(false, {
        failure: {
          stage: "delivery-branch",
          reason: run.failureReason,
        },
      });
    }

    run.delivery.branch = {
      id: this.nextId("branch"),
      name: `minions/${task.id}`,
      createdAt: this.now(),
    };
    this._recordLedger(run, "delivery-branch-created", run.delivery.branch);
    return createResult(true, { branch: clone(run.delivery.branch) });
  }

  async createDeliveryBranchAsync(runId, options = {}) {
    const run = this._requireRun(runId);
    const task = this._requireTask(run.taskRequestId);
    const target = this.supportedTargets.get(task.repository);

    if (["local-git", "github-pr"].includes(target?.deliveryMode) && target.repositoryPath && !options.forceFailure) {
      const gates = this.evaluateDeliveryGates(runId);

      if (!gates.eligible) {
        return createResult(false, {
          reason: "run is not eligible for delivery branch creation",
          gates,
        });
      }

      try {
        const branchName = `minions/${task.id}`;
        const localBranch = await createLocalDeliveryBranch(target.repositoryPath, branchName);
        const status = await readWorkingTreeStatus(target.repositoryPath);

        run.delivery.branch = {
          id: this.nextId("branch"),
          name: localBranch.name,
          baseRef: localBranch.baseRef,
          createdAt: this.now(),
          mode: "local-git",
          repositoryPath: target.repositoryPath,
          status,
        };
        this._recordLedger(run, "delivery-branch-created", run.delivery.branch);
        return createResult(true, { branch: clone(run.delivery.branch) });
      } catch (error) {
        run.failedStage = "delivery-branch";
        run.failureReason = error instanceof Error ? error.message : "local git branch creation failed";
        this._recordLedger(
          run,
          "delivery-branch-failed",
          {
            reason: run.failureReason,
            mode: "local-git",
          },
          "blocked",
        );
        return createResult(false, {
          failure: {
            stage: "delivery-branch",
            reason: run.failureReason,
          },
        });
      }
    }

    return this.createDeliveryBranch(runId, options);
  }

  publishPullRequest(runId) {
    const run = this._requireRun(runId);
    const gates = this.evaluateDeliveryGates(runId);

    if (!gates.eligible) {
      return createResult(false, {
        reason: "pull request creation is blocked until all delivery gates are satisfied",
        gates,
      });
    }

    if (!run.delivery.branch) {
      return createResult(false, {
        reason: "delivery branch is required before PR publication",
      });
    }

    const task = this._requireTask(run.taskRequestId);
    const pullRequest = {
      id: this.nextId("pr"),
      title: `Minions: ${task.title}`,
      taskLink: task.id,
      runLink: run.id,
      changeSummary: run.execution.changes.map((change) => ({
        path: change.path,
        summary: change.summary,
      })),
      validationResults: run.validation?.steps.map((step) => ({
        stepId: step.id,
        status: step.resultStatus,
      })) || [],
      evidenceRefs: run.evidence.map((item) => item.evidenceId),
      body: {
        summary: `Autonomous delivery for ${task.title}`,
        validation: run.validation?.completionState || "unknown",
        evidence: run.evidence.map((item) => item.evidenceId),
      },
      createdAt: this.now(),
    };

    run.delivery.pullRequest = pullRequest;
    this._recordLedger(run, "pull-request-created", {
      prId: pullRequest.id,
      taskLink: pullRequest.taskLink,
    });
    return createResult(true, { pullRequest: clone(pullRequest) });
  }

  async publishPullRequestAsync(runId, options = {}) {
    const run = this._requireRun(runId);
    const task = this._requireTask(run.taskRequestId);
    const target = this.supportedTargets.get(task.repository);

    if (["local-git", "github-pr"].includes(target?.deliveryMode) && target.repositoryPath) {
      const gates = this.evaluateDeliveryGates(runId);

      if (!gates.eligible) {
        return createResult(false, {
          reason: "pull request creation is blocked until all delivery gates are satisfied",
          gates,
        });
      }

      if (!run.delivery.branch) {
        return createResult(false, {
          reason: "delivery branch is required before PR publication",
        });
      }

      if (options.forceFailure || target?.failures?.pullRequest) {
        const failureReason = String(options.forceFailure || target.failures.pullRequest);
        run.failedStage = "pull-request";
        run.failureReason = failureReason;
        this._recordLedger(run, "pull-request-failed", { reason: failureReason, mode: "local-git" }, "blocked");
        return createResult(false, {
          failure: {
            stage: "pull-request",
            reason: failureReason,
          },
        });
      }

      try {
        if (target.deliveryMode === "github-pr") {
          const preflight = await this.githubPrPreflight.check(target.repositoryPath);
          this._recordLedger(run, "github-pr-preflight-checked", preflight, preflight.ok ? "autonomous" : "blocked");
          if (!preflight.ok) {
            return createResult(false, {
              reason: "github-pr preflight checks failed",
              preflight,
            });
          }
        }

        const commit = await createLocalDeliveryCommit(
          target.repositoryPath,
          `Minions: ${task.title}`,
          run.execution.changes.map((change) => change.path),
        );
        const pullRequest = {
          id: this.nextId("pr"),
          mode: target.deliveryMode,
          status: target.deliveryMode === "github-pr" ? "published" : "ready-for-remote-pr",
          title: `Minions: ${task.title}`,
          taskLink: task.id,
          runLink: run.id,
          branchName: run.delivery.branch.name,
          commitSha: commit.commitSha,
          changeSummary: run.execution.changes.map((change) => ({
            path: change.path,
            summary: change.summary,
          })),
          stagedFiles: commit.stagedFiles,
          validationResults:
            run.validation?.steps.map((step) => ({
              stepId: step.id,
              status: step.resultStatus,
            })) || [],
          evidenceRefs: run.evidence.map((item) => item.evidenceId),
          body: {
            summary: `Local git delivery prepared for ${task.title}`,
            validation: run.validation?.completionState || "unknown",
            evidence: run.evidence.map((item) => item.evidenceId),
          },
          createdAt: this.now(),
        };

        if (target.deliveryMode === "github-pr") {
          if (!this.githubDeliveryRunner) {
            throw new Error("GitHub delivery runner is not configured");
          }

          const published = await this.githubDeliveryRunner.publishPullRequest({
            repositoryPath: target.repositoryPath,
            branchName: run.delivery.branch.name,
            baseBranch: target.metadata?.defaultBranch || "main",
            title: pullRequest.title,
            body: [
              pullRequest.body.summary,
              "",
              `Task: ${task.id}`,
              `Run: ${run.id}`,
              "",
              "Validation",
              ...pullRequest.validationResults.map((step) => `- ${step.stepId}: ${step.status}`),
              "",
              "Evidence",
              ...pullRequest.evidenceRefs.map((ref) => `- ${ref}`),
            ].join("\n"),
          });

          pullRequest.github = {
            number: published.pullRequest.number,
            url: published.pullRequest.url,
            state: published.pullRequest.state,
            repository: target.repositoryId,
          };
          pullRequest.id = `pr-${String(published.pullRequest.number).padStart(4, "0")}`;
          pullRequest.status = "published";
        }

        run.delivery.pullRequest = pullRequest;
        this._recordLedger(run, "pull-request-created", {
          prId: pullRequest.id,
          taskLink: pullRequest.taskLink,
          mode: target.deliveryMode,
          commitSha: pullRequest.commitSha,
        });
        return createResult(true, { pullRequest: clone(pullRequest) });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "local git commit failed";
        run.failedStage = "pull-request";
        run.failureReason = reason;
        this._recordLedger(run, "pull-request-failed", { reason, mode: "local-git" }, "blocked");
        return createResult(false, {
          failure: {
            stage: "pull-request",
            reason,
          },
        });
      }
    }

    return this.publishPullRequest(runId);
  }

  classifyRunFailure(runId) {
    const run = this._requireRun(runId);

    if (run.completion?.state === "successful") {
      return createResult(false, {
        reason: "successful runs do not receive failure classifications",
      });
    }

    let type = "unclassified-failure";

    if (run.failedStage === "environment-startup") {
      type = "environment-failure";
    } else if (
      run.preparation.finalOutcome?.result === "blocked-missing-context" ||
      this._requireTask(run.taskRequestId).scope?.result === "insufficiently specified"
    ) {
      type = "task-ambiguity";
    } else if (
      this._requireTask(run.taskRequestId).scope?.result === "out-of-scope" ||
      this._requireTask(run.taskRequestId).policy?.outcome === "blocked" ||
      run.currentOutcomeState === "boundary-stopped"
    ) {
      type = "unsupported-workflow";
    } else if (run.validation?.completionState === "failed" || run.completion?.state === "failed") {
      type = "validation-failure";
    } else if (run.execution.writeFailure) {
      type = "implementation-difficulty";
    }

    run.failureClassification = {
      type,
      evidenceRefs: run.evidence.map((item) => item.evidenceId),
      classifiedAt: this.now(),
    };
    this._recordLedger(run, "failure-classified", run.failureClassification, "blocked");
    return clone(run.failureClassification);
  }

  produceFailureSummary(runId) {
    const run = this._requireRun(runId);

    if (!["partial", "failed", "blocked", "boundary-stopped", "interrupted"].includes(run.currentOutcomeState)) {
      return createResult(false, {
        reason: "failure summaries apply only to non-successful terminal outcomes",
      });
    }

    const classification = run.failureClassification || this.classifyRunFailure(runId);
    const task = this._requireTask(run.taskRequestId);
    const blockingReasons = [
      ...(run.preparation.finalOutcome?.reasons || []).map((reason) => reason.reason),
      ...(run.completion?.unmetReasons || []),
      run.failureReason,
    ].filter(Boolean);

    const summary = redactSensitive({
      runId: run.id,
      taskId: task.id,
      failureType: classification.type,
      failedStage: run.failedStage || run.progressState.currentStage,
      blockingReasons,
      protectedSecrets: task.protectedSecrets,
      unrestrictedAgentContext: task.unrestrictedAgentContext,
    });

    run.failureSummary = summary;
    this._recordLedger(run, "failure-summary-produced", summary, "blocked");
    return clone(summary);
  }

  preserveIntermediateState(runId, options = {}) {
    const run = this._requireRun(runId);

    if (run.currentOutcomeState === "successful") {
      return createResult(false, {
        reason: "intermediate preservation applies to incomplete runs only",
      });
    }

    const failOn = new Set(options.failOn || []);
    const inventory = {
      progressState: clone(run.progressState),
      evidence: clone(run.evidence),
      deliveryArtifacts: clone(run.delivery),
    };
    const preserved = {};
    const failures = [];

    for (const [key, value] of Object.entries(inventory)) {
      if (failOn.has(key)) {
        failures.push({
          item: key,
          reason: `${key} could not be preserved`,
        });
        continue;
      }

      preserved[key] = value;
    }

    run.preservedState = {
      preserved,
      failures,
      preservedAt: this.now(),
    };
    this._recordLedger(run, "intermediate-state-preserved", {
      preserved: Object.keys(preserved),
      failures,
    }, "blocked");
    return clone(run.preservedState);
  }

  getCompletedRunHistory(runId, actor) {
    const run = this._requireRun(runId);

    if (!this._roleAllowed(actor, ["engineer", "stakeholder", "operator"])) {
      return this._denyRunRequest(run, actor, "read-completed-history", [
        "engineer",
        "stakeholder",
        "operator",
      ]);
    }

    if (!TERMINAL_OUTCOMES.has(run.currentOutcomeState)) {
      return createResult(false, {
        reason: "run must be complete before history can be retrieved",
      });
    }

    const history = {
      finalOutcome: run.currentOutcomeState,
      keyStageHistory: clone(run.progressState.history),
      summaryArtifacts: {
        failureSummary: clone(run.failureSummary),
        pullRequest: clone(run.delivery.pullRequest),
      },
      links: {
        evidence: run.evidence.map((item) => item.evidenceId),
        delivery: run.delivery.branch ? [run.delivery.branch.id] : [],
      },
    };

    this._recordLedger(run, "completed-history-read", { actor: actor.role });
    return createResult(true, { history: redactSensitive(history) });
  }

  getFailureStageDiagnostics(runId, actor) {
    const run = this._requireRun(runId);

    if (!this._roleAllowed(actor, ["operator"])) {
      return this._denyRunRequest(run, actor, "read-stage-diagnostics", ["operator"]);
    }

    if (!run.failedStage && run.currentOutcomeState !== "boundary-stopped") {
      return createResult(false, {
        reason: "run has no recorded failed or blocked stage",
      });
    }

    const upstreamFailure = run.preparation.relatedWork.retrievalFailures[0] || run.preparation.repositoryFailure || null;
    const diagnostics = {
      stage: run.failedStage || run.progressState.currentStage,
      outcomeType: run.currentOutcomeState,
      evidenceRefs: run.evidence.map((item) => item.evidenceId),
      diagnostics: {
        failureReason: run.failureReason || run.stopReason || null,
        validation: clone(run.validation),
      },
      incomplete: Boolean(upstreamFailure),
      upstreamFailureSource: upstreamFailure ? upstreamFailure.source || upstreamFailure.stage : null,
    };

    this._recordLedger(run, "stage-diagnostics-read", { actor: actor.role });
    return createResult(true, { diagnostics: redactSensitive(diagnostics) });
  }

  reviewRunLedger(runId) {
    const run = this._requireRun(runId);
    const review = {
      runId,
      entries: clone(run.ledger),
      contextSources: run.ledger
        .filter((entry) => entry.eventType.includes("context") || entry.eventType.includes("related-work"))
        .map((entry) => entry.detail),
      changes: clone(run.execution.changes),
      autonomySummary: run.ledger.map((entry) => ({
        eventType: entry.eventType,
        autonomyClass: entry.autonomyClass,
      })),
    };
    return redactSensitive(review);
  }

  getStructuredRunData(runId, actor) {
    const run = this._requireRun(runId);

    if (!this._roleAllowed(actor, ["internal-consumer", "operator"])) {
      return this._denyRunRequest(run, actor, "read-structured-run-data", ["internal-consumer", "operator"]);
    }

    const structured = {
      runId,
      canonicalRunRecord: run.id,
      inputs: {
        task: redactSensitive(this._requireTask(run.taskRequestId)),
      },
      states: {
        progress: clone(run.progressState),
        preparation: clone(run.preparation),
        validation: clone(run.validation),
      },
      outputs: {
        changes: clone(run.execution.changes),
        evidence: clone(run.evidence),
        delivery: clone(run.delivery),
      },
      outcomes: {
        completion: clone(run.completion),
        failureClassification: clone(run.failureClassification),
      },
    };

    this._recordLedger(run, "structured-run-data-read", { actor: actor.role });
    return createResult(true, { data: redactSensitive(structured) });
  }

  registerMinionType(definition) {
    const reasons = [];

    if (isBlank(definition.id)) {
      reasons.push("minion type id is required");
    }

    if (isBlank(definition.name)) {
      reasons.push("minion type name is required");
    }

    if (asArray(definition.capabilities).length === 0) {
      reasons.push("at least one capability is required");
    }

    if (definition.bypassesExecutionModel) {
      reasons.push("minion type must remain consistent with the current execution model");
    }

    if (
      definition.entryLifecycleStage &&
      !this.workflowModel.lifecycleStages.includes(definition.entryLifecycleStage)
    ) {
      reasons.push("entry lifecycle stage is not part of the current workflow model");
    }

    if (reasons.length > 0) {
      const rejection = {
        at: this.now(),
        definition: clone(definition),
        reasons,
      };
      this.minionTypeRejections.push(rejection);
      return createResult(false, { rejection });
    }

    const record = {
      id: definition.id,
      name: definition.name,
      capabilities: asArray(definition.capabilities),
      entryLifecycleStage: definition.entryLifecycleStage || "intake",
      createdAt: this.now(),
      modelConsistency: "core-workflow",
    };
    this.minionTypes.set(record.id, record);
    return createResult(true, { minionType: clone(record) });
  }

  onboardSupportedTarget(target) {
    const reasons = [];

    if (isBlank(target.repositoryId)) {
      reasons.push("repositoryId is required");
    }

    if (isBlank(target.teamId)) {
      reasons.push("teamId is required");
    }

    if (!target.repositoryPath && asArray(target.files).length === 0) {
      reasons.push("target must include codebase file metadata");
    }

    if (!target.repositoryPath && asArray(target.validationSteps).length === 0) {
      reasons.push("target must define repository validation steps");
    }

    if (reasons.length > 0) {
      const rejection = {
        at: this.now(),
        target: clone(target),
        reasons,
      };
      this.targetRejections.push(rejection);
      return createResult(false, { rejection });
    }

    const record = {
      repositoryId: target.repositoryId,
      teamId: target.teamId,
      metadata: clone(target.metadata || {}),
      repositoryPath: target.repositoryPath || null,
      executionMode: target.executionMode || "simulated",
      deliveryMode: target.deliveryMode || "simulated",
      files: clone(target.files || []),
      validationSteps: clone(target.validationSteps || []),
      failures: clone(target.failures || {}),
      onboardedAt: this.now(),
    };
    this.supportedTargets.set(record.repositoryId, record);
    return createResult(true, { target: clone(record) });
  }

  extendWorkflowModel(stageDefinition) {
    const reasons = [];

    if (isBlank(stageDefinition.id)) {
      reasons.push("stage id is required");
    }

    if (!stageDefinition.additive) {
      reasons.push("workflow-stage extension must be additive");
    }

    if (
      stageDefinition.appliesAfter &&
      !this.workflowModel.lifecycleStages.includes(stageDefinition.appliesAfter) &&
      !this.workflowModel.extensions.some((entry) => entry.id === stageDefinition.appliesAfter)
    ) {
      reasons.push("extension must attach to an existing workflow stage");
    }

    if (
      this.workflowModel.lifecycleStages.includes(stageDefinition.id) ||
      this.workflowModel.extensions.some((entry) => entry.id === stageDefinition.id)
    ) {
      reasons.push("extension stage id must be unique");
    }

    if (stageDefinition.replacesCoreStage) {
      reasons.push("extension may not replace an existing MVP workflow stage");
    }

    if (reasons.length > 0) {
      const failure = {
        at: this.now(),
        proposal: clone(stageDefinition),
        reasons,
      };
      this.workflowCompatibilityFailures.push(failure);
      return createResult(false, { failure });
    }

    const extension = {
      id: stageDefinition.id,
      name: stageDefinition.name || stageDefinition.id,
      appliesAfter: stageDefinition.appliesAfter || "delivery",
      additive: true,
      createdAt: this.now(),
    };
    this.workflowModel.extensions.push(extension);
    return createResult(true, { extension: clone(extension) });
  }
}
