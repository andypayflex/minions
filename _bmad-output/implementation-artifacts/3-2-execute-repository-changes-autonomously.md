# Story 3.2: Execute Repository Changes Autonomously

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to create and modify repository changes within the isolated run,
so that the task can be completed without step-by-step human supervision.

## Acceptance Criteria

1. Autonomous repository execution begins only when an isolated run environment is active and preparation data is available.
2. The system can create, modify, and organize repository changes for the scoped task.
3. The system records execution stage transitions in run state.
4. If a repository-write failure occurs, the system records the failed execution stage and reason.
5. A repository-write failure stops further modification attempts for that run.

## Tasks / Subtasks

- [x] Define the autonomous repository-execution contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the active isolated run environment from Story `3.1` and the preparation data from Epic 2 as prerequisites.
  - [x] Define the minimum execution-stage model needed to capture repository modification progress.
  - [x] Keep the contract limited to repository changes and execution-stage recording; do not include validation or PR delivery.

- [x] Implement autonomous repository change execution within the isolated run. (AC: 1, 2, 3)
  - [x] Require an active isolated environment and preparation data before execution can begin.
  - [x] Enable create/modify/organize repository changes for the scoped task.
  - [x] Record execution stage transitions in run state as work proceeds.

- [x] Implement repository-write failure handling. (AC: 4, 5)
  - [x] Detect write failures while modifying the repository.
  - [x] Record the failed execution stage and failure reason in run state.
  - [x] Stop further modification attempts for the current run after a write failure.

- [x] Add automated tests for successful execution and repository-write failures. (AC: 1, 2, 3, 4, 5)
  - [x] Happy-path test: an active isolated environment plus preparation data can produce recorded repository changes.
  - [x] Stage-recording test: execution transitions are persisted in run state.
  - [x] Write-failure test: a repository-write failure records the failed stage and blocks further modifications.
  - [x] Guardrail test: this story does not yet run validation or create pull requests.

## Dev Notes

- Story `3.2` depends directly on Story `3.1` isolated-environment startup and the preparation outputs from Epic 2. Do not bypass the established entry conditions. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-1-start-an-isolated-run-environment.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-5-detect-missing-or-conflicting-critical-context.md]
- This story owns repository modification only. Validation belongs to Epic 4, and operator visibility is separated into Stories `3.5` and `3.6`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.5: Expose In-Progress Run Status to Engineers and Operators]
- Execution stage transitions recorded here become the foundation for Story `3.3` progress-state persistence. Keep the execution-stage model explicit and reusable. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.3: Persist Run Progress State]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `3.2` scoped to:
  - active-run eligibility check
  - repository-execution service/module
  - execution-stage transition recording
  - write-failure handling
  - tests
- Do not expand the slice into validation, PR creation, or operator UI concerns.

### Technical Requirements

- Story `3.2` must require an active isolated environment from Story `3.1`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-1-start-an-isolated-run-environment.md]
- The system must be able to create, modify, and organize repository changes for the scoped task. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.2: Execute Repository Changes Autonomously]
- Execution stage transitions must be recorded in run state.
- Repository-write failures must record failed stage and reason, then stop further modification attempts.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no repository-edit execution patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible repository-execution surface needed for Story `3.2`.

### Library / Framework Requirements

- No approved runtime, repository-edit library, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `3.2` silently choose the platform architecture. Keep the execution slice minimal and reversible.

### File Structure Requirements

- Keep Story `3.2` code adjacent to Story `3.1` within the run-state/execution pipeline.
- Use explicit terminology around `repository execution`, `execution stage`, `write failure`, and `active run`.
- Persist only the minimum execution-stage metadata needed by later progress-state and validation stories.

### Testing Requirements

- Add automated tests for successful repository execution and write failures.
- Tests must prove execution requires an active isolated environment and preparation data.
- Tests must prove write failures stop further modifications.
- Tests must prove this story does not run validation or create pull requests.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.2: Execute Repository Changes Autonomously]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.3: Persist Run Progress State]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-1-start-an-isolated-run-environment.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-5-detect-missing-or-conflicting-critical-context.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `3.1` and Epic 2 story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `3.2` was constrained to autonomous repository execution only.
- Execution-stage transitions were kept explicit for downstream reuse.
- Validation and PR-delivery concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-2-execute-repository-changes-autonomously.md
