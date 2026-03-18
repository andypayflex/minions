# Story 4.1: Run Repository-Relevant Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to run validation steps relevant to the target repository,
so that change delivery is based on repository-specific quality checks.

## Acceptance Criteria

1. Validation begins only when autonomous code changes are available in an active run.
2. The system executes the validation steps configured for the target repository.
3. The validation stage, start time, and completion state are recorded.
4. If one or more validation steps fail to execute or return failure, the failing validation-step results are recorded.
5. Validation failure prevents the run from being marked ready for pull request creation.

## Tasks / Subtasks

- [x] Define the repository-relevant validation contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the active run and repository change outputs from Epic 3 as the only validation entry point.
  - [x] Define the minimum model for repository-specific validation steps and validation-stage metadata.
  - [x] Keep the contract limited to executing configured validation, not determining overall completion status yet.

- [x] Implement validation execution against active repository changes. (AC: 1, 2, 3)
  - [x] Require an active run with autonomous code changes before validation can begin.
  - [x] Execute the validation steps configured for the target repository.
  - [x] Record validation stage, start time, and completion state in run state or validation state.

- [x] Implement validation-failure capture. (AC: 4, 5)
  - [x] Detect validation-step execution failures and failing validation results.
  - [x] Record the failing validation-step results in structured form.
  - [x] Prevent the run from being marked ready for PR creation when validation fails.

- [x] Add automated tests for passing and failing validation. (AC: 1, 2, 3, 4, 5)
  - [x] Happy-path test: active run changes execute configured repository validation and record stage metadata.
  - [x] Failing-step test: failing validation steps are captured and stored.
  - [x] Entry-condition test: validation does not begin without active run changes.
  - [x] Guardrail test: this story does not yet assign overall completion status or create delivery artifacts.

## Dev Notes

- Story `4.1` begins Epic 4 after execution work exists. It must consume the outputs of Epic 3 rather than recreate execution behavior. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-2-execute-repository-changes-autonomously.md]
- Validation here is repository-relevant and repository-configured. Do not collapse it into overall success/partial/failed determination; that belongs to Story `4.2`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.2: Determine Completion Status from Validation Evidence]
- Evidence capture is separated into Story `4.3`; only the validation-step results required to drive stage failure need to be recorded here. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.3: Capture Structured Validation Evidence]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `4.1` scoped to:
  - active-run validation entry check
  - repository-validation service/module
  - validation-stage metadata persistence
  - validation-failure capture
  - tests
- Do not expand the slice into completion-state evaluation, evidence summarization, or PR delivery.

### Technical Requirements

- Story `4.1` must require autonomous code changes in an active run. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.1: Run Repository-Relevant Validation]
- The system must execute validation steps configured for the target repository.
- Validation stage, start time, and completion state must be recorded.
- Failing validation-step results must be recorded and must block readiness for PR creation.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no validation-pipeline patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible validation-execution surface needed for Story `4.1`.

### Library / Framework Requirements

- No approved runtime, test runner, validation framework, or persistence layer is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `4.1` silently choose the platform architecture. Keep the validation slice minimal and reversible.

### File Structure Requirements

- Keep Story `4.1` code adjacent to the execution pipeline and clearly separated from completion evaluation and delivery logic.
- Use explicit terminology around `validation step`, `repository-relevant validation`, `validation stage`, and `failing results`.
- Persist only the minimum validation-stage metadata and failing-step data needed by later stories.

### Testing Requirements

- Add automated tests for successful validation, failing validation, and missing entry conditions.
- Tests must prove validation is tied to repository-specific configured steps.
- Tests must prove failures block readiness for PR creation.
- Tests must prove this story does not yet assign overall completion state or create PR artifacts.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.1: Run Repository-Relevant Validation]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.2: Determine Completion Status from Validation Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.3: Capture Structured Validation Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-2-execute-repository-changes-autonomously.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epic 3 execution stories.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `4.1` was constrained to repository-relevant validation execution only.
- Completion-state evaluation and evidence summarization were kept out of this story by design.
- Entry conditions were tied explicitly to active-run repository changes.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-1-run-repository-relevant-validation.md
