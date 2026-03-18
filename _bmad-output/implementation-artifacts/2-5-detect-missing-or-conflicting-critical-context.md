# Story 2.5: Detect Missing or Conflicting Critical Context

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to detect missing or conflicting critical context during task preparation,
so that unsafe or low-confidence runs are blocked before execution.

## Acceptance Criteria

1. Critical-context checks run after the Epic 2 preparation stages have completed.
2. The system evaluates whether required context is present and internally consistent.
3. The system assigns exactly one preparation outcome: `ready`, `blocked-missing-context`, or `blocked-conflicting-context`.
4. When preparation is blocked, the blocking reasons are recorded in structured form.
5. Blocking reasons are exposed to the engineer or operator reviewing the task.

## Tasks / Subtasks

- [x] Define the final critical-context evaluation contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the outputs from Stories `2.1` through `2.4` as the full Epic 2 preparation input set.
  - [x] Define the minimum set of required and internally consistent context conditions for preparation readiness.
  - [x] Keep the outcome space limited to `ready`, `blocked-missing-context`, or `blocked-conflicting-context`.

- [x] Implement final preparation-state evaluation. (AC: 1, 2, 3)
  - [x] Require the Epic 2 preparation stages to have completed before evaluation runs.
  - [x] Evaluate whether required context is present and whether the assembled preparation data is internally consistent.
  - [x] Persist a single final preparation outcome for the task.

- [x] Implement structured blocking-reason reporting. (AC: 4, 5)
  - [x] Record missing-context and conflicting-context reasons in structured form.
  - [x] Return the blocking reasons to engineers or operators reviewing the task.
  - [x] Preserve the recorded blocking reasons so later failure/audit stories can reuse them without recomputation.

- [x] Add automated tests for ready and blocked preparation outcomes. (AC: 1, 2, 3, 4, 5)
  - [x] Ready-path test: complete and internally consistent preparation data yields `ready`.
  - [x] Missing-context test: absent required context yields `blocked-missing-context` with recorded reasons.
  - [x] Conflicting-context test: inconsistent preparation data yields `blocked-conflicting-context` with recorded reasons.
  - [x] Exposure test: blocking reasons are preserved and reviewable by authorized users.

## Dev Notes

- Story `2.5` closes Epic 2. It must consume the outputs of Stories `2.1` through `2.4`, not rerun those stages independently. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-2-retrieve-related-work-context-from-approved-systems.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-3-build-a-run-specific-working-context.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-4-identify-relevant-code-and-test-surfaces.md]
- This story is the final preparation readiness decision for Epic 2, distinct from the earlier Story `1.2` minimum run-readiness check. Story `1.2` validated minimum submission readiness; Story `2.5` validates whether the prepared context is complete and coherent enough to continue. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- Keep the preparation outcomes exactly as approved: `ready`, `blocked-missing-context`, or `blocked-conflicting-context`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- This story must not start execution. It only decides whether the prepared task context is safe and coherent enough to hand off to later execution stages.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `2.5` scoped to:
  - preparation-state reader across Stories `2.1` to `2.4`
  - final critical-context evaluation service/module
  - preparation outcome persistence
  - structured blocking-reason model
  - tests
- Do not expand the slice into execution orchestration or failure-history systems from later epics.

### Technical Requirements

- Story `2.5` must evaluate the full Epic 2 preparation state and assign exactly one final preparation outcome. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- Missing required context and conflicting context must be distinguished explicitly.
- Blocking reasons must be structured, persisted, and exposed to authorized reviewers.
- Keep the final evaluation deterministic and reviewable. No opaque heuristics should decide whether preparation is complete enough to continue.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no final-preparation-state or workflow-engine patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible critical-context evaluation surface needed for Story `2.5`.

### Library / Framework Requirements

- No approved runtime, framework, persistence layer, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `2.5` silently choose the platform architecture. Keep the evaluation slice minimal and reversible.

### File Structure Requirements

- Keep Story `2.5` code adjacent to the Epic 2 preparation pipeline so the final preparation outcome remains coherent with prior stages.
- Use explicit terminology around `critical context`, `preparation outcome`, `missing context`, `conflicting context`, and `blocking reasons`.
- Persist only the minimum final preparation outcome and structured blocking reasons needed by later stages.

### Testing Requirements

- Add automated tests for all three preparation outcomes.
- Tests must prove this story consumes the outputs of Stories `2.1` through `2.4`.
- Tests must prove structured blocking reasons are persisted and reviewable.
- Tests must prove this story does not begin execution or replace later failure-classification stories.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-2-retrieve-related-work-context-from-approved-systems.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-3-build-a-run-specific-working-context.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-4-identify-relevant-code-and-test-surfaces.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `2.1` through `2.4`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `2.5` was constrained to final critical-context evaluation only.
- The file explicitly distinguishes missing-context blocks from conflicting-context blocks.
- Execution start and later failure-history concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-5-detect-missing-or-conflicting-critical-context.md
