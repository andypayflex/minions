import { MinionsPlatform } from "./minions.js";

function createDemoPlatform() {
  const platform = new MinionsPlatform();

  platform.onboardSupportedTarget({
    repositoryId: "repo/minions-app",
    teamId: "team-core",
    metadata: {
      language: "javascript",
      defaultBranch: "main",
    },
    files: [
      { path: "src/intake/service.js", area: "intake", type: "code", keywords: ["task", "submission", "intake"] },
      { path: "src/preparation/context.js", area: "preparation", type: "code", keywords: ["context", "repository"] },
      { path: "src/execution/run.js", area: "execution", type: "code", keywords: ["execution", "run"] },
      { path: "test/intake.test.js", area: "intake", type: "test", keywords: ["task", "validation"] },
    ],
    validationSteps: [
      { id: "unit-tests", status: "passed", output: "12 passing" },
      { id: "lint", status: "passed", output: "0 issues" },
    ],
  });

  platform.registerLinkedContext({
    system: "github",
    id: "123",
    summary: "Prior task discussed deterministic intake behavior.",
    topic: "intake",
  });
  platform.registerLinkedContext({
    system: "slack",
    id: "456",
    summary: "Team agreed to preserve validation evidence in PR output.",
    topic: "delivery",
  });

  return platform;
}

function print(label, value) {
  console.log(`\n${label}`);
  console.log(JSON.stringify(value, null, 2));
}

const platform = createDemoPlatform();

const submission = platform.submitTaskRequest(
  {
    title: "Add scoped task intake",
    objective: "Implement the first Minions intake path and preserve validation evidence",
    repository: "repo/minions-app",
    constraints: ["preserve deterministic rules", "add tests"],
    expectedOutcome: "working code with tests and PR summary",
    linkedItems: [
      { system: "github", id: "123" },
      { system: "slack", id: "456" },
    ],
    requestedActions: ["modify-code", "create-tests"],
    protectedSecrets: ["DO_NOT_EXPOSE"],
    unrestrictedAgentContext: { token: "hidden" },
  },
  {
    requesterIdentity: "engineer:aiden",
    entryPoint: "slack/minions",
  },
);

const taskId = submission.taskRequestId;
print("Submitted Task", submission);
print("Minimum Run Readiness", platform.validateMinimumRunReadiness(taskId));
print("Scope Classification", platform.classifyScope(taskId));
print("Origin Verification", platform.verifyInitiationPath(taskId));
print("Autonomy Policy", platform.evaluateAutonomyPolicy(taskId));
print("Repository Context", platform.retrieveRepositoryContext(taskId));
print("Related Work Context", platform.retrieveRelatedWorkContext(taskId));
print("Working Context", platform.buildWorkingContext(taskId));
print("Relevant Change Surface", platform.identifyRelevantChangeSurface(taskId));
print("Critical Context Outcome", platform.evaluateCriticalContext(taskId));

const startup = platform.startIsolatedRunEnvironment(taskId);
const runId = startup.runId;
print("Environment Startup", startup);
print("Repository Execution", platform.executeRepositoryChanges(runId));
print("In-Progress Status", platform.getInProgressStatus(runId, { role: "engineer" }));
print("Validation", platform.runRepositoryValidation(runId));
print("Structured Evidence", platform.captureStructuredValidationEvidence(runId));
print("Completion", platform.determineCompletionStatus(runId));
print("Delivery Branch", platform.createDeliveryBranch(runId));
print("Pull Request", platform.publishPullRequest(runId));
print("Completed History", platform.getCompletedRunHistory(runId, { role: "engineer" }));
