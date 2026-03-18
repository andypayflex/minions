# Story 1.1: Submit a Scoped Engineering Task

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineer,
I want to submit a structured task with context, constraints, and expected outcomes,
so that Minions can evaluate and execute the request without guesswork.

## Acceptance Criteria

1. An authenticated engineer using an approved Minions entry point can submit a task with `title`, `objective`, `relevant repository`, `constraints`, and `expected outcome`.
2. A valid submission creates a persisted task request with a unique identifier.
3. A valid submission remains available for pre-run evaluation and does not yet require execution orchestration logic from later stories.
4. A submission missing one or more required fields is rejected with field-level feedback.
5. An invalid submission does not start any execution run or downstream autonomous workflow.

## Tasks / Subtasks

- [x] Define the initial task-request contract and persisted state shape. (AC: 1, 2, 3)
  - [x] Model the canonical Story 1.1 submission fields: `title`, `objective`, `repository`, `constraints`, `expectedOutcome`.
  - [x] Include system-managed metadata needed by later stories: `taskRequestId`, `requesterIdentity`, `entryPoint`, `createdAt`, and an initial status such as `submitted` or equivalent pre-run state.
  - [x] Keep the model narrow; do not add scope classification, policy-gate, or execution-state fields owned by Stories 1.2-1.5.

- [x] Implement the first approved task-submission path. (AC: 1, 2, 3)
  - [x] Accept a structured submission from one approved MVP entry point only.
  - [x] Persist the task request and return the created identifier plus enough response data for a caller to reference the new request.
  - [x] Record the entry-point/source metadata, but defer multi-entry-point authorization rules to Story 1.4.

- [x] Implement required-field validation and rejection behavior. (AC: 4, 5)
  - [x] Validate presence of all required Story 1.1 fields before persistence.
  - [x] Return field-level validation feedback that identifies each missing or invalid required field.
  - [x] Ensure invalid submissions do not create a task request record and do not trigger any run creation side effect.

- [x] Add tests that lock the intake contract and rejection behavior. (AC: 1, 2, 3, 4, 5)
  - [x] Happy-path test: valid submission creates a unique task request in pre-run state.
  - [x] Validation test: each required field is enforced with field-level feedback.
  - [x] Safety test: invalid submission creates no task request and no run/execution record.
  - [x] Contract test: persisted record contains the Story 1.1-required fields and source metadata only.

## Dev Notes

- Story scope is intentionally narrow: this story creates the first intake slice only.
- This story feeds Epic 1 sequencing. Do not absorb work from Story 1.2 `Validate Minimum Run Readiness`, Story 1.3 `Classify Scope Before Execution`, Story 1.4 `Enforce Approved Initiation Paths`, or Story 1.5 `Apply Autonomy Boundaries and Approval Gates`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Epic 1: Scoped Task Intake and Execution Guardrails]
- The approved product direction is one-team MVP intake for well-scoped engineering work, likely initiated from Slack and supported by GitHub and Azure DevOps context, but this story is intake only. Do not implement external-system context gathering here. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Onboarding] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- The product brief anchors the platform on `gsd-build/get-shit-done` as the initial orchestration substrate, but no architecture document defines concrete service boundaries, framework, or storage choices. Do not invent a large platform design in this story. Implement the smallest viable intake slice consistent with the actual target repository. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Proposed Solution]
- Story 1.1 should create a task request record only. Run-readiness checks, scope classification, execution start, and policy gating belong to later stories. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.2: Validate Minimum Run Readiness] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]

### Project Structure Notes

- The current workspace contains planning artifacts only. No application source tree, architecture document, UX spec, or project-context file was found during story analysis.
- If implementation occurs in the eventual product repository, follow that repository's existing structure and naming conventions.
- If a new codebase must be bootstrapped, keep Story 1.1 isolated to a minimal intake vertical slice:
  - task-request domain model/entity
  - submission handler/interface
  - validation layer
  - persistence adapter
  - tests
- Do not bootstrap Docker execution, GitHub/Slack/Azure DevOps integrations, classification engines, or operator tooling in this story.
- If the target repository is still this planning-only workspace, stop before coding and create architecture plus actual application scaffolding first. This story file is ready-for-dev for the product codebase, not for the BMAD planning repo itself.

### Technical Requirements

- Required submission payload fields for Story 1.1 are derived directly from the approved acceptance criteria: `title`, `objective`, `relevant repository`, `constraints`, `expected outcome`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.1: Submit a Scoped Engineering Task]
- The created task request must have a unique identifier and remain available for pre-run evaluation. That means the persistence boundary must support later lookup by identifier. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.1: Submit a Scoped Engineering Task]
- Required-field validation in this story is submission-level only. Do not expand it into the broader readiness validation of FR3; that belongs to Story 1.2. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- Invalid submissions must be side-effect free with respect to autonomous execution. No run record, no Docker execution, no downstream orchestration trigger. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.1: Submit a Scoped Engineering Task]

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No codebase-specific architectural constraints were discoverable from source files because no product source tree exists in this workspace.
- Because architecture is absent, the developer must prefer the minimal implementation that satisfies Story 1.1 without making irreversible platform decisions that belong in architecture.

### Library / Framework Requirements

- No approved framework, runtime, database, transport, or test library is specified in the planning artifacts.
- Use the target product repository's existing stack if it already exists.
- If no stack exists yet, do not treat this story as permission to choose the long-term architecture for the product. Keep any bootstrap decision minimal and reversible, or establish architecture first.

### File Structure Requirements

- Keep all Story 1.1 code grouped by the intake slice rather than by future platform capabilities.
- Prefer explicit names around `task request`, `submission`, `intake`, and `pre-run` to preserve alignment with Epic 1 terminology.
- Any persistence artifacts introduced here must represent only the Story 1.1 task-request record, not full run/execution/audit schemas from later stories.

### Testing Requirements

- Add automated tests for both successful and rejected submissions.
- Tests must prove unique identifier assignment on valid creation.
- Tests must prove field-level validation feedback for missing required fields.
- Tests must prove invalid submissions are side-effect free and do not start downstream execution records or workflows.
- If the target codebase already has contract, handler, or persistence test patterns, follow those patterns rather than inventing a new style.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Epic 1: Scoped Task Intake and Execution Guardrails]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.1: Submit a Scoped Engineering Task]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.2: Validate Minimum Run Readiness]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Onboarding]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/research/technical-stripe-agentic-commerce-and-minions-research-2026-03-17.md#Recommended Project Framing]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- No previous story file existed.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Comprehensive story context created from the approved epic, PRD, product brief, and research artifacts.
- Story scope was explicitly narrowed to prevent overlap with Stories 1.2-1.5.
- Architecture absence was preserved as a guardrail instead of being silently invented.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md
