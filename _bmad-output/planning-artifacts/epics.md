---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md
---

# minions - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for minions, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Engineers can submit a scoped engineering task to Minions for autonomous execution.
FR2: Engineers can provide task context, constraints, and expected outcomes as part of task submission.
FR3: Minions can validate whether a submitted task contains the minimum information required to start a run.
FR4: Minions can classify a task as in-scope, out-of-scope, or insufficiently specified before execution begins.
FR5: Engineers can initiate Minions through approved internal interfaces.
FR6: Minions can retrieve repository context relevant to a submitted task.
FR7: Minions can retrieve related work context from approved engineering systems.
FR8: Minions can aggregate task context from GitHub, Slack, and Azure DevOps into a run-specific working context.
FR9: Minions can identify the code areas, files, and test surfaces most relevant to a submitted task.
FR10: Minions can detect when critical context is missing or conflicting during task preparation.
FR11: Minions can execute a task autonomously within an isolated run environment.
FR12: Minions can create, modify, and organize code changes needed to satisfy a scoped engineering task.
FR13: Minions can make execution decisions during a run without requiring step-by-step human supervision.
FR14: Minions can maintain task progress state throughout a run.
FR15: Minions can stop execution when a task crosses defined autonomy boundaries.
FR16: Minions can run validation steps relevant to the target repository before producing a pull request.
FR17: Minions can determine whether resulting code changes meet the requirement of working code with tests.
FR18: Minions can capture validation evidence from test and verification steps.
FR19: Minions can distinguish between successful completion, partial completion, and failed completion states.
FR20: Minions can prevent pull request creation when required validation conditions are not met.
FR21: Minions can create a branch or equivalent change set for a completed run.
FR22: Minions can create a pull request automatically when a run satisfies completion criteria.
FR23: Minions can include a structured summary of what was changed in the pull request output.
FR24: Minions can include validation results and relevant execution evidence in the pull request output.
FR25: Minions can link a pull request back to the original task or request context.
FR26: Minions can classify failures by type, including task ambiguity, environment failure, unsupported workflow, validation failure, and implementation difficulty.
FR27: Minions can return structured failure summaries when a run does not complete successfully.
FR28: Minions can preserve useful intermediate state and evidence from incomplete runs.
FR29: Engineers can inspect why a run failed or stopped.
FR30: Minions can indicate when a task requires human takeover or refinement instead of autonomous continuation.
FR31: Platform stakeholders can define and enforce execution boundaries for Minions.
FR32: Minions can operate only through approved integrations and execution paths.
FR33: Minions can record an auditable history of run inputs, actions, outputs, and outcomes.
FR34: Platform stakeholders can review what context, tools, and changes were involved in a run.
FR35: Minions can distinguish between actions allowed during autonomous execution and actions requiring human approval.
FR36: Engineers and stakeholders can view run status while a task is in progress.
FR37: Engineers and stakeholders can retrieve completed run summaries after execution finishes.
FR38: Engineers and stakeholders can inspect failure-stage diagnostics for unsuccessful runs.
FR39: Engineers and stakeholders can understand whether a run produced a PR, a partial result, or a blocked outcome.
FR40: Operators can use Minions through a direct operational interface for administration, debugging, and controlled execution.
FR41: The system can support the addition of new minion types beyond autonomous PR generation.
FR42: The system can support additional repositories and teams after MVP without changing the core product model.
FR43: The system can support future lifecycle stages beyond implementation and PR creation.
FR44: Minions can expose structured run data for future reporting, orchestration, and platform expansion needs.

### NonFunctional Requirements

NFR1: The system must provide task submission acknowledgment quickly enough that users can confirm a run has started without ambiguity.
NFR2: The system must complete core run-state transitions and status updates in a timeframe that keeps engineers informed during execution.
NFR3: The end-to-end time from task submission to PR creation must be materially better than the current manual workflow for eligible tasks.
NFR4: The system must preserve usable responsiveness for operational interfaces while autonomous runs are in progress.
NFR5: Autonomous runs must execute in a repeatable manner under the same task and environment conditions.
NFR6: The system must preserve run state, evidence, and outcome records even when a run fails or stops early.
NFR7: The system must degrade gracefully when external integrations are unavailable or return incomplete data.
NFR8: The system must make incomplete, failed, and successful outcomes distinguishable to users and operators.
NFR9: All execution must occur inside isolated Docker environments with no unrestricted host-level execution.
NFR10: Integration credentials and secrets must be protected from unauthorized disclosure and must not be exposed as general agent context.
NFR11: Access to task execution, repository actions, and operational controls must be limited to approved users and systems.
NFR12: The system must maintain a clear control boundary between autonomous PR creation and higher-risk actions requiring human approval.
NFR13: Every run must produce an auditable record of inputs, actions, outputs, and final outcome.
NFR14: Operators must be able to inspect what context sources, tools, validations, and changes were involved in a run.
NFR15: The system must produce troubleshooting information sufficient to diagnose blocked, failed, and partial runs without reconstructing the run manually.
NFR16: The system must expose structured run data suitable for monitoring, reporting, and future orchestration use.
NFR17: The system must integrate reliably with GitHub, Slack, Azure DevOps, and Docker as first-class dependencies of the MVP workflow.
NFR18: Integration failures must be surfaced explicitly and tied to the affected stage of execution.
NFR19: The system must tolerate intermittent integration issues without corrupting run state or losing traceability.
NFR20: The system must preserve clear contracts for inbound task context and outbound execution artifacts across all supported integrations.
NFR21: The MVP must support the initial team’s expected run volume without operational degradation that prevents practical day-to-day use.
NFR22: The architecture must allow expansion to additional repositories and teams without requiring a full redesign of the product model.
NFR23: The system must support future growth in minion types, workflow stages, and operational reporting without invalidating the MVP execution model.

### Additional Requirements

- No architecture document was provided for this workflow run.
- No additional architecture-derived requirements were extracted in Step 1.

### UX Design Requirements

- No UX design document was provided for this workflow run.
- No UX design requirements were extracted in Step 1.

### FR Coverage Map

FR1: Epic 1 - Scoped task submission for autonomous execution
FR2: Epic 1 - Task context, constraints, and expected outcomes captured at submission
FR3: Epic 1 - Minimum-information validation before run start
FR4: Epic 1 - In-scope, out-of-scope, or insufficient-specification classification
FR5: Epic 1 - Approved internal interfaces for run initiation
FR6: Epic 2 - Repository context retrieval for submitted tasks
FR7: Epic 2 - Related work context retrieval from approved engineering systems
FR8: Epic 2 - Aggregated context from GitHub, Slack, and Azure DevOps
FR9: Epic 2 - Relevant files, code areas, and test surface identification
FR10: Epic 2 - Missing or conflicting context detection during preparation
FR11: Epic 3 - Autonomous execution inside isolated run environments
FR12: Epic 3 - Controlled code creation and modification during execution
FR13: Epic 3 - In-run decision making without step-by-step supervision
FR14: Epic 3 - Persistent run progress state
FR15: Epic 3 - Stop conditions at autonomy boundaries
FR16: Epic 4 - Repository-relevant validation before PR creation
FR17: Epic 4 - Working-code-with-tests completion determination
FR18: Epic 4 - Validation evidence capture
FR19: Epic 4 - Success, partial, and failed completion states
FR20: Epic 4 - Prevent PR creation when validation gates fail
FR21: Epic 4 - Branch or equivalent change set creation
FR22: Epic 4 - Automatic PR creation on satisfied completion criteria
FR23: Epic 4 - Structured change summary in PR output
FR24: Epic 4 - Validation results and evidence included in PR output
FR25: Epic 4 - PR linked to original task or request context
FR26: Epic 5 - Failure classification by type
FR27: Epic 5 - Structured failure summaries
FR28: Epic 5 - Preservation of useful intermediate state and evidence
FR29: Epic 5 - Failure inspection by engineers
FR30: Epic 5 - Human takeover or task refinement signaling
FR31: Epic 1 - Execution boundary definition and enforcement
FR32: Epic 1 - Approved-only integrations and execution paths
FR33: Epic 5 - Auditable history of run inputs, actions, outputs, and outcomes
FR34: Epic 5 - Stakeholder review of context, tools, and changes used in a run
FR35: Epic 1 - Distinction between autonomous and approval-required actions
FR36: Epic 3 - In-progress run status visibility
FR37: Epic 5 - Retrieval of completed run summaries
FR38: Epic 5 - Failure-stage diagnostics for unsuccessful runs
FR39: Epic 5 - Outcome visibility across PR, partial, and blocked states
FR40: Epic 3 - Direct operator interface for administration and debugging
FR41: Epic 6 - Support for additional minion types
FR42: Epic 6 - Support for additional repositories and teams
FR43: Epic 6 - Support for future lifecycle stages
FR44: Epic 6 - Structured run data for reporting and orchestration

## Epic List

### Epic 1: Scoped Task Intake and Execution Guardrails
Engineers can submit a bounded task through approved interfaces, with scope checks and autonomy boundaries enforced before any run begins.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR31, FR32, FR35

### Epic 2: Context Preparation and Task Understanding
Minions can gather repository and work-item context, identify the relevant change surface, and stop early when critical context is missing.
**FRs covered:** FR6, FR7, FR8, FR9, FR10

### Epic 3: Autonomous Run Execution and Progress Control
Minions can execute work inside an isolated environment, maintain progress state, and expose controlled in-progress visibility to engineers and operators.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR36, FR40

### Epic 4: Validation-Gated Change Delivery
Minions can validate code changes, create a branch, and publish a pull request with evidence and traceability only when completion criteria are met.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25

### Epic 5: Failure Handling, Audit, and Troubleshooting
Engineers and stakeholders can understand failures, inspect run history, and recover from incomplete or blocked outcomes without treating the system as a black box.
**FRs covered:** FR26, FR27, FR28, FR29, FR30, FR33, FR34, FR37, FR38, FR39

### Epic 6: Platform Expansion and Reusable Run Data
The platform can support future minion types, broader team adoption, and structured reporting or orchestration growth without changing the core product model.
**FRs covered:** FR41, FR42, FR43, FR44

## Epic 1: Scoped Task Intake and Execution Guardrails

Engineers can submit a bounded task through approved interfaces, with scope checks and autonomy boundaries enforced before any run begins.

### Story 1.1: Submit a Scoped Engineering Task

As an engineer,
I want to submit a structured task with context, constraints, and expected outcomes,
So that Minions can evaluate and execute the request without guesswork.

**Acceptance Criteria:**

**Given** an authenticated engineer is using an approved Minions entry point
**When** they submit a task with title, objective, relevant repository, constraints, and expected outcome
**Then** the system stores a new task request with a unique identifier
**And** the request remains available for pre-run evaluation

**Given** a task submission omits one or more required fields
**When** the engineer attempts to submit the task
**Then** the system rejects the submission with field-level feedback
**And** no execution run is started

### Story 1.2: Validate Minimum Run Readiness

As Minions,
I want to validate whether a task contains the minimum information required to start,
So that autonomous runs only begin on sufficiently specified work.

**Acceptance Criteria:**

**Given** a newly submitted task request
**When** pre-run validation executes
**Then** the system checks for the required submission fields and execution prerequisites
**And** it records a validation result of ready or not-ready

**Given** a task fails minimum-information validation
**When** validation completes
**Then** the system marks the task as insufficiently specified
**And** it returns the missing-information reasons to the engineer

### Story 1.3: Classify Scope Before Execution

As Minions,
I want to classify a request as in-scope, out-of-scope, or insufficiently specified,
So that unsupported or unsafe work does not enter autonomous execution.

**Acceptance Criteria:**

**Given** a task has passed minimum-information validation
**When** scope classification runs against configured scope rules
**Then** the system assigns exactly one classification result
**And** it stores the rationale for that decision

**Given** a task is classified as out-of-scope or insufficiently specified
**When** classification completes
**Then** the system prevents run creation
**And** it returns the classification result and rationale to the engineer

### Story 1.4: Enforce Approved Initiation Paths

As a platform stakeholder,
I want Minions runs to start only from approved internal interfaces and execution paths,
So that unauthorized entry points cannot trigger autonomous work.

**Acceptance Criteria:**

**Given** a run-start request arrives from a configured approved interface
**When** the system verifies the request origin
**Then** the request is allowed to continue through the pre-run workflow
**And** the approved source is recorded in task metadata

**Given** a run-start request arrives from an unapproved interface or path
**When** origin verification runs
**Then** the request is rejected
**And** the rejection reason is recorded for audit

### Story 1.5: Apply Autonomy Boundaries and Approval Gates

As a platform stakeholder,
I want the system to distinguish autonomous actions from approval-required actions before execution starts,
So that Minions remains inside defined governance limits.

**Acceptance Criteria:**

**Given** a task has been classified as in-scope
**When** policy evaluation runs before execution
**Then** the system determines whether the requested work is fully autonomous, requires approval, or must be blocked
**And** it stores the evaluated policy outcome with the task

**Given** a task would require an approval-gated action outside the allowed autonomy boundary
**When** policy evaluation completes
**Then** the system prevents autonomous execution from starting
**And** it reports which boundary caused the block

## Epic 2: Context Preparation and Task Understanding

Minions can gather repository and work-item context, identify the relevant change surface, and stop early when critical context is missing.

### Story 2.1: Retrieve Repository Context for a Task

As Minions,
I want to retrieve repository context for a submitted task,
So that execution planning is grounded in the actual codebase.

**Acceptance Criteria:**

**Given** an in-scope task includes repository identification
**When** repository context retrieval starts
**Then** the system collects the target repository metadata and accessible codebase context for that task
**And** it stores that context as part of the run preparation state

**Given** repository access fails or the repository cannot be resolved
**When** repository context retrieval completes
**Then** the system records the failure against the preparation stage
**And** it does not advance the task to autonomous execution

### Story 2.2: Retrieve Related Work Context from Approved Systems

As Minions,
I want to retrieve related work context from approved engineering systems,
So that task execution is informed by the surrounding request history and delivery state.

**Acceptance Criteria:**

**Given** a task references linked items in approved systems
**When** related work context retrieval starts
**Then** the system collects available task-relevant context from those systems
**And** it associates each retrieved item with the current task preparation record

**Given** one approved system is unavailable or returns incomplete data
**When** retrieval finishes
**Then** the system records the partial retrieval result and affected source
**And** it preserves all successfully retrieved context without corruption

### Story 2.3: Build a Run-Specific Working Context

As Minions,
I want to aggregate task, repository, and engineering-system context into one working context,
So that downstream execution uses a coherent task view.

**Acceptance Criteria:**

**Given** task submission data and external context have been retrieved
**When** context aggregation runs
**Then** the system produces a single run-specific working context for the task
**And** it records the source inputs used to build that context

**Given** duplicate or conflicting context elements are detected during aggregation
**When** aggregation completes
**Then** the system flags the conflicting inputs
**And** it prevents the task from advancing without a resolved preparation outcome

### Story 2.4: Identify Relevant Code and Test Surfaces

As Minions,
I want to identify the code areas, files, and test surfaces most relevant to the task,
So that autonomous execution starts from the highest-value change surface.

**Acceptance Criteria:**

**Given** a run-specific working context exists
**When** relevance analysis runs
**Then** the system produces a ranked set of code areas, files, and test surfaces for the task
**And** it stores that result in the preparation state for later execution use

**Given** the system cannot identify a sufficiently relevant change surface
**When** relevance analysis completes
**Then** the system records that preparation could not confidently target the codebase
**And** it does not proceed to autonomous execution

### Story 2.5: Detect Missing or Conflicting Critical Context

As Minions,
I want to detect missing or conflicting critical context during task preparation,
So that unsafe or low-confidence runs are blocked before execution.

**Acceptance Criteria:**

**Given** context preparation stages have completed
**When** critical-context checks run
**Then** the system evaluates whether required context is present and internally consistent
**And** it assigns a preparation outcome of ready, blocked-missing-context, or blocked-conflicting-context

**Given** the preparation outcome is blocked due to missing or conflicting context
**When** preparation closes
**Then** the system records the blocking reasons in a structured form
**And** it exposes those reasons to the engineer or operator reviewing the task

## Epic 3: Autonomous Run Execution and Progress Control

Minions can execute work inside an isolated environment, maintain progress state, and expose controlled in-progress visibility to engineers and operators.

### Story 3.1: Start an Isolated Run Environment

As Minions,
I want to start a task inside an isolated run environment,
So that autonomous execution stays inside approved technical boundaries.

**Acceptance Criteria:**

**Given** a task is ready for execution
**When** run initialization starts
**Then** the system provisions an isolated run environment for that task
**And** it records the environment identifier and initialization status in run state

**Given** the isolated environment cannot be provisioned successfully
**When** run initialization completes
**Then** the system marks the run as failed at environment startup
**And** it prevents any autonomous task execution from proceeding

### Story 3.2: Execute Repository Changes Autonomously

As Minions,
I want to create and modify repository changes within the isolated run,
So that the task can be completed without step-by-step human supervision.

**Acceptance Criteria:**

**Given** an isolated run environment is active and preparation data is available
**When** autonomous execution begins
**Then** the system can create, modify, and organize repository changes for the scoped task
**And** it records the execution stage transitions in the run state

**Given** autonomous execution encounters a repository-write failure
**When** the failure occurs
**Then** the system records the failed execution stage and reason
**And** it stops further modification attempts for that run

### Story 3.3: Persist Run Progress State

As Minions,
I want to maintain run progress state throughout execution,
So that users and operators can understand where work stands.

**Acceptance Criteria:**

**Given** a run moves through execution stages
**When** the stage changes
**Then** the system updates the persisted run progress state with the current stage and timestamp
**And** prior stage history remains available for audit and troubleshooting

**Given** a run stops unexpectedly during execution
**When** the stop is detected
**Then** the system preserves the latest known progress state
**And** it marks the run as interrupted or failed without losing prior stage history

### Story 3.4: Enforce Stop Conditions at Autonomy Boundaries

As Minions,
I want to stop execution when a task crosses a defined autonomy boundary,
So that the platform does not continue into unauthorized behavior.

**Acceptance Criteria:**

**Given** a run is in progress
**When** the system detects an action or condition outside the task’s allowed autonomy boundary
**Then** the system stops execution before performing the blocked action
**And** it records the stop reason in the run state

**Given** a stop condition is triggered
**When** execution halts
**Then** the system marks the run outcome as boundary-stopped
**And** it preserves the current work state for later inspection

### Story 3.5: Expose In-Progress Run Status to Engineers and Operators

As an engineer or operator,
I want to view current run status while execution is in progress,
So that I can monitor autonomous work without interrupting it.

**Acceptance Criteria:**

**Given** a run exists in a non-terminal state
**When** an authorized user requests run status
**Then** the system returns the current run stage, latest transition time, and current outcome state
**And** it does not expose protected secrets or unrestricted agent context

**Given** an unauthorized user requests run status
**When** access control is evaluated
**Then** the request is denied
**And** the denial is recorded according to operational audit policy

### Story 3.6: Provide a Direct Operator Interface for Controlled Execution

As an operator,
I want a direct operational interface for administration, debugging, and controlled execution,
So that I can inspect and manage runs within approved limits.

**Acceptance Criteria:**

**Given** an authorized operator accesses the operational interface
**When** they request run administration or debugging actions within approved scope
**Then** the system exposes those controls and relevant run metadata
**And** it records operator actions for auditability

**Given** an operator attempts an action outside their allowed scope
**When** authorization is evaluated
**Then** the system blocks the action
**And** it returns a clear authorization failure outcome

## Epic 4: Validation-Gated Change Delivery

Minions can validate code changes, create a branch, and publish a pull request with evidence and traceability only when completion criteria are met.

### Story 4.1: Run Repository-Relevant Validation

As Minions,
I want to run validation steps relevant to the target repository,
So that change delivery is based on repository-specific quality checks.

**Acceptance Criteria:**

**Given** autonomous code changes are available in an active run
**When** validation begins
**Then** the system executes the validation steps configured for the target repository
**And** it records the validation stage, start time, and completion state

**Given** one or more validation steps fail to execute or return failure
**When** validation completes
**Then** the system records the failing validation step results
**And** it prevents the run from being marked ready for pull request creation

### Story 4.2: Determine Completion Status from Validation Evidence

As Minions,
I want to determine whether a run is successful, partial, or failed based on validation evidence,
So that pull request creation only happens for runs that meet the working-code-with-tests standard.

**Acceptance Criteria:**

**Given** validation has completed for a run
**When** completion evaluation executes
**Then** the system assigns exactly one completion state of successful, partial, or failed
**And** it stores the evidence used for that determination

**Given** the validation evidence does not satisfy the required completion criteria
**When** completion evaluation finishes
**Then** the system does not mark the run as ready for PR creation
**And** it records why the working-code-with-tests standard was not met

### Story 4.3: Capture Structured Validation Evidence

As Minions,
I want to capture structured validation evidence from test and verification steps,
So that pull request outputs and troubleshooting views can reference concrete results.

**Acceptance Criteria:**

**Given** validation or verification steps produce outputs
**When** evidence capture runs
**Then** the system stores structured evidence for each step, including result status and associated run stage
**And** the evidence remains linked to the run record

**Given** a validation step produces incomplete or malformed output
**When** evidence capture processes that output
**Then** the system records the evidence as incomplete
**And** it preserves the raw result association without corrupting the run record

### Story 4.4: Create a Delivery Branch for a Completed Run

As Minions,
I want to create a branch or equivalent change set for a completed run,
So that validated work can be packaged for review.

**Acceptance Criteria:**

**Given** a run is marked successful and ready for delivery
**When** delivery branch creation starts
**Then** the system creates a branch or equivalent change set tied to that run
**And** it records the delivery artifact identifier in the run record

**Given** delivery branch creation fails
**When** the failure occurs
**Then** the system records the failure stage and reason
**And** it prevents pull request creation for that run

### Story 4.5: Publish a Pull Request with Summary and Evidence

As an engineer,
I want Minions to publish a pull request that includes what changed and how it was validated,
So that I can review a complete and traceable delivery artifact.

**Acceptance Criteria:**

**Given** a delivery branch exists for a successful run
**When** pull request creation executes
**Then** the system creates a pull request automatically
**And** the pull request includes a structured summary of code changes and validation results

**Given** a pull request is created for a run
**When** the PR body is assembled
**Then** the system links the pull request back to the original task or request context
**And** it includes relevant execution evidence needed for review

### Story 4.6: Block Pull Request Creation When Gates Are Not Met

As a platform stakeholder,
I want pull request creation blocked unless completion gates are satisfied,
So that Minions cannot deliver unqualified output as if it were complete.

**Acceptance Criteria:**

**Given** a run is partial, failed, or missing required validation evidence
**When** delivery gating is evaluated
**Then** the system blocks pull request creation
**And** it records which required gate was not satisfied

**Given** a blocked run later becomes eligible after re-evaluation
**When** delivery gating is re-run
**Then** the system allows pull request creation only if all required gates are satisfied
**And** it preserves the prior blocked-gate history in the run record

## Epic 5: Failure Handling, Audit, and Troubleshooting

Engineers and stakeholders can understand failures, inspect run history, and recover from incomplete or blocked outcomes without treating the system as a black box.

### Story 5.1: Classify Run Failures by Type

As Minions,
I want to classify unsuccessful runs by failure type,
So that users and operators can quickly understand what blocked autonomy.

**Acceptance Criteria:**

**Given** a run stops without successful completion
**When** failure classification executes
**Then** the system assigns a failure type from the supported failure taxonomy
**And** it stores the classification with the run outcome

**Given** the failure cannot be confidently mapped to a known type
**When** classification completes
**Then** the system records the run as unclassified-failure
**And** it preserves the evidence needed for later review

### Story 5.2: Produce Structured Failure Summaries

As an engineer,
I want a structured summary when a run does not complete successfully,
So that I can decide whether to refine the task, retry, or take over manually.

**Acceptance Criteria:**

**Given** a run ends in partial, failed, blocked, or boundary-stopped state
**When** run summarization executes
**Then** the system produces a structured failure summary including failure type, failed stage, and blocking reasons
**And** it links the summary to the run record

**Given** a failure summary is requested for review
**When** the summary is returned
**Then** it includes enough detail to distinguish unsupported work, missing context, environment failure, validation failure, and implementation difficulty
**And** it avoids exposing protected secrets or unrestricted agent context

### Story 5.3: Preserve Intermediate State and Evidence

As Minions,
I want to preserve useful intermediate state and evidence from incomplete runs,
So that failed work is still inspectable and potentially recoverable.

**Acceptance Criteria:**

**Given** a run stops before successful completion
**When** failure handling finalizes the run
**Then** the system preserves the latest relevant state, evidence, and delivery artifacts produced so far
**And** those records remain associated with the run

**Given** state preservation encounters a partial persistence failure
**When** preservation completes
**Then** the system records what was and was not preserved
**And** it does not overwrite already-saved run evidence

### Story 5.4: Expose Run History and Completed Summaries

As an engineer or stakeholder,
I want to retrieve completed run summaries and auditable run history,
So that I can inspect what happened after execution finishes.

**Acceptance Criteria:**

**Given** a completed run exists
**When** an authorized user requests the run summary or history
**Then** the system returns the final outcome, key stage history, and associated summary artifacts
**And** it includes links to relevant evidence and delivery records

**Given** an unauthorized user requests completed run history
**When** access control is evaluated
**Then** the request is denied
**And** the denial is handled according to audit policy

### Story 5.5: Inspect Failure-Stage Diagnostics

As an operator,
I want to inspect diagnostics for the stage where a run failed or stopped,
So that I can troubleshoot without reconstructing the run manually.

**Acceptance Criteria:**

**Given** a run has a recorded failed or blocked stage
**When** an authorized operator requests diagnostics
**Then** the system returns the diagnostics associated with that stage, including related evidence references
**And** it identifies whether the outcome was partial, blocked, failed, or boundary-stopped

**Given** stage diagnostics are incomplete because an upstream integration failed
**When** diagnostics are viewed
**Then** the system identifies the diagnostics as incomplete
**And** it preserves visibility into the upstream failure source

### Story 5.6: Record an Auditable Run Ledger

As a platform stakeholder,
I want every run to have an auditable record of inputs, actions, outputs, and outcomes,
So that the platform remains governable and reviewable.

**Acceptance Criteria:**

**Given** a run progresses through its lifecycle
**When** meaningful run events occur
**Then** the system records an auditable ledger of inputs, actions, outputs, and final outcome
**And** the ledger remains linked to the run identifier

**Given** a stakeholder reviews a completed run
**When** they inspect the run ledger
**Then** they can determine what context, tools, and changes were involved
**And** they can see which actions were autonomous versus approval-gated or blocked

## Epic 6: Platform Expansion and Reusable Run Data

The platform can support future minion types, broader team adoption, and structured reporting or orchestration growth without changing the core product model.

### Story 6.1: Register Additional Minion Types

As a platform stakeholder,
I want the platform to support registration of additional minion types,
So that new autonomous capabilities can be introduced beyond PR generation.

**Acceptance Criteria:**

**Given** the platform has a supported minion registration mechanism
**When** a stakeholder defines a new minion type within approved platform rules
**Then** the system stores the minion type as an available platform capability
**And** it keeps the existing PR-generation minion behavior intact

**Given** a proposed minion type violates platform capability rules
**When** registration is evaluated
**Then** the system rejects the registration attempt
**And** it records the reason for rejection

### Story 6.2: Support Additional Repositories and Teams

As a platform stakeholder,
I want the platform to onboard additional repositories and teams,
So that the MVP model can expand without redesigning the core workflow.

**Acceptance Criteria:**

**Given** a new repository or team is proposed for onboarding
**When** onboarding configuration is completed through approved platform controls
**Then** the system stores the repository or team as a supported execution target
**And** existing supported targets continue to operate unchanged

**Given** onboarding data is incomplete or violates support constraints
**When** onboarding validation runs
**Then** the system blocks the onboarding attempt
**And** it returns the specific reasons the target could not be enabled

### Story 6.3: Expose Structured Run Data for Reporting and Orchestration

As a platform stakeholder,
I want structured run data to be available for reporting and future orchestration,
So that the platform can expand operationally without reworking the run model.

**Acceptance Criteria:**

**Given** a run record exists
**When** structured run data is requested by an approved internal consumer
**Then** the system returns a structured representation of run inputs, states, outputs, and outcomes
**And** the format remains linked to the canonical run record

**Given** a consumer requests structured run data without approval
**When** authorization is evaluated
**Then** the request is denied
**And** the denial follows the platform’s audit policy

### Story 6.4: Extend the Workflow Model to Future Lifecycle Stages

As a platform stakeholder,
I want the workflow model to support future lifecycle stages beyond implementation and PR creation,
So that Minions can grow into a broader internal SDLC platform.

**Acceptance Criteria:**

**Given** the platform defines a new lifecycle stage within approved expansion rules
**When** that stage is added to the workflow model
**Then** the system can represent it without breaking existing task, run, and delivery records
**And** the existing MVP execution flow remains operable

**Given** a proposed lifecycle-stage extension would invalidate the MVP run model
**When** compatibility validation runs
**Then** the system rejects the extension
**And** it records the compatibility failure for review
