# Story 1.4: Enforce Approved Initiation Paths

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want Minions runs to start only from approved internal interfaces and execution paths,
so that unauthorized entry points cannot trigger autonomous work.

## Acceptance Criteria

1. When a run-start request arrives from a configured approved interface, the system verifies the request origin before allowing it to continue through the pre-run workflow.
2. For approved requests, the verified source is recorded in task metadata.
3. When a run-start request arrives from an unapproved interface or path, the system rejects it.
4. Rejected requests record the rejection reason for audit.
5. Origin verification remains separate from scope classification and autonomy-policy evaluation.

## Tasks / Subtasks

- [x] Define the approved-initiation-path model and verification rules. (AC: 1, 2, 3, 4, 5)
  - [x] Identify the minimal source/origin metadata required to verify where a run-start request came from.
  - [x] Express approved interfaces and execution paths as explicit configuration or deterministic rules.
  - [x] Keep the rule set limited to origin verification; do not mix in scope classification or approval-gate policy logic.

- [x] Implement origin verification for run-start requests. (AC: 1, 2, 3)
  - [x] Evaluate each run-start request against the approved-initiation-path rules before it can proceed through the pre-run workflow.
  - [x] Allow only verified approved requests to continue.
  - [x] Reject unapproved origins before any downstream autonomous-work trigger can occur.

- [x] Persist approved-source and rejection audit metadata. (AC: 2, 4)
  - [x] Record the approved source in task metadata for allowed requests.
  - [x] Record the rejection reason and evaluated origin details for blocked requests.
  - [x] Preserve the verification outcome so later stories can consume it without recomputing origin logic ad hoc.

- [x] Add automated tests for approved and unapproved origins. (AC: 1, 2, 3, 4, 5)
  - [x] Approved-path test: a request from a configured approved source is allowed and has source metadata persisted.
  - [x] Unapproved-path test: a request from an unapproved source is rejected with an audit reason.
  - [x] Safety test: origin verification does not perform scope classification, policy approval evaluation, or execution start.
  - [x] Consistency test: previously ready and in-scope tasks are still blocked if their run-start origin is unapproved.

## Dev Notes

- Story `1.4` sits after the earlier pre-run intake slices: Story `1.1` defines the task-request contract, Story `1.2` defines readiness, and Story `1.3` defines scope classification. Do not duplicate those responsibilities here. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md]
- This story verifies where a run-start request came from. It does not determine whether a task is in-scope or whether an action requires approval. Those remain Story `1.3` and Story `1.5` respectively. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- The product brief suggests the approved team workflow is likely initiated from Slack and supported by GitHub and Azure DevOps context, but it does not lock the implementation to any one transport in this repo. Model approved sources explicitly instead of hardcoding assumptions into later execution logic. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Onboarding]
- Origin verification must block unauthorized entry points before autonomous work starts. It must not provision Docker, gather external context, or invoke execution. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- Record source metadata and rejection reasons in a way later audit stories can reuse, but do not design the full audit ledger here. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

### Project Structure Notes

- The current workspace is still planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing module and naming conventions.
- If bootstrapping a new codebase, keep Story `1.4` adjacent to the prior Epic 1 intake slices:
  - run-start request entry layer
  - origin-verification service/module
  - approved-source configuration/rules
  - task metadata update and rejection audit fields
  - tests
- Do not expand the slice into policy evaluation, context aggregation, or execution orchestration.
- If the target repository is still this planning-only workspace, stop before coding and produce architecture plus application scaffolding first.

### Technical Requirements

- Origin verification must evaluate the source of a run-start request, not the task content itself. Scope/content concerns remain with Stories `1.2` and `1.3`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md]
- Approved requests must persist the verified source in task metadata. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- Unapproved requests must be rejected and must record the rejection reason for auditability. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- Origin verification must happen before continuing through the pre-run workflow and before any autonomous-work trigger.
- Keep source rules deterministic and reviewable. No hidden allowlists or ad hoc manual exceptions inside this story.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no concrete service-boundary or transport-layer patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible surface for approved-origin verification.

### Library / Framework Requirements

- No approved runtime, framework, persistence layer, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `1.4` silently choose the platform architecture. Keep the verification slice minimal and reversible.

### File Structure Requirements

- Keep Story `1.4` code adjacent to the earlier Epic 1 intake pipeline so source verification remains part of pre-run gating.
- Use explicit terminology around `origin`, `approved interface`, `execution path`, `verified source`, and `rejection reason`.
- Persist only the minimum source-verification metadata and rejection reason needed by later audit and governance stories.

### Testing Requirements

- Add automated tests for approved and rejected origins.
- Tests must prove only approved origins can continue through the pre-run workflow.
- Tests must prove the approved source is persisted on allowed requests.
- Tests must prove rejection reasons are recorded for blocked requests.
- Tests must prove this story does not classify scope, evaluate autonomy policy, or start execution.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Onboarding]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `1.2` and `1.3`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `1.4` was constrained to approved-origin verification only.
- The file explicitly separates interface-path checks from scope classification and policy-gate logic.
- Source metadata persistence and rejection-audit reasons were included as reusable downstream guardrails.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-4-enforce-approved-initiation-paths.md
