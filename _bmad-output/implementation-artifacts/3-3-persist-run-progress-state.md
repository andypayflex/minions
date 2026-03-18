# Story 3.3: Persist Run Progress State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to maintain run progress state throughout execution,
so that users and operators can understand where work stands.

## Acceptance Criteria

1. When a run moves through execution stages, the system updates persisted run progress state with the current stage and timestamp.
2. Prior stage history remains available for audit and troubleshooting.
3. If a run stops unexpectedly, the latest known progress state is preserved.
4. Unexpected stops mark the run as interrupted or failed without losing prior stage history.
5. Persisted progress state is available for later run-status and operator-interface stories.

## Tasks / Subtasks

- [x] Define the persisted progress-state model. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse execution-stage transitions from Story `3.2` as the canonical input source.
  - [x] Define the minimum persisted shape for current stage, timestamps, terminal/non-terminal state, and prior stage history.
  - [x] Keep the model focused on progress-state persistence, not operator presentation.

- [x] Implement progress-state persistence on stage transitions. (AC: 1, 2, 5)
  - [x] Update run progress state whenever the execution stage changes.
  - [x] Persist the current stage and transition timestamp.
  - [x] Preserve the persisted state for later read access by Stories `3.5` and `3.6`.

- [x] Implement interrupted/failed stop preservation. (AC: 2, 3, 4)
  - [x] Detect unexpected run stops during execution.
  - [x] Preserve the latest known progress state and prior stage history.
  - [x] Mark the run as interrupted or failed without erasing previous transitions.

- [x] Add automated tests for stage-history persistence and unexpected stops. (AC: 1, 2, 3, 4, 5)
  - [x] Stage-transition test: current stage and timestamp are persisted on each transition.
  - [x] History-preservation test: prior stage history remains available after multiple transitions.
  - [x] Unexpected-stop test: interrupted/failed states preserve the latest known progress state.
  - [x] Reuse test: persisted progress state is readable for later status-view stories.

## Dev Notes

- Story `3.3` consumes execution-stage transitions from Story `3.2`; it should not invent an independent execution lifecycle. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-2-execute-repository-changes-autonomously.md]
- The persisted progress state created here is the foundation for Story `3.5` run-status visibility and Story `3.6` operator controls. Keep it authoritative and reusable. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.5: Expose In-Progress Run Status to Engineers and Operators] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.6: Provide a Direct Operator Interface for Controlled Execution]
- This story records progress only. It does not decide access permissions, render UI, or execute repository changes.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `3.3` scoped to:
  - execution-stage transition listener/service
  - persisted run-progress model
  - stage-history persistence
  - interrupted/failed-state preservation
  - tests
- Do not expand the slice into run-status access control or operator UI.

### Technical Requirements

- Story `3.3` must persist current stage plus timestamp on each transition. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.3: Persist Run Progress State]
- Prior stage history must remain available for audit and troubleshooting.
- Unexpected stops must preserve the latest known progress state and prior history.
- Persisted progress state must be readable by later stories that expose run status.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no run-state persistence patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible progress-state persistence surface needed for Story `3.3`.

### Library / Framework Requirements

- No approved runtime, persistence layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `3.3` silently choose the platform architecture. Keep the persistence slice minimal and reversible.

### File Structure Requirements

- Keep Story `3.3` code adjacent to Stories `3.1` and `3.2` within the run-state pipeline.
- Use explicit terminology around `run progress state`, `current stage`, `stage history`, `interrupted`, and `failed`.
- Persist only the minimum current-state and history data needed by later visibility stories.

### Testing Requirements

- Add automated tests for stage persistence, history retention, and unexpected-stop preservation.
- Tests must prove the model reads from the execution-stage source established in Story `3.2`.
- Tests must prove persisted progress state is reusable by later stories.
- Tests must prove this story does not expose status directly to users or operators yet.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.3: Persist Run Progress State]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.5: Expose In-Progress Run Status to Engineers and Operators]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.6: Provide a Direct Operator Interface for Controlled Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-2-execute-repository-changes-autonomously.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `3.1` and `3.2`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `3.3` was constrained to run-progress persistence only.
- The file explicitly reuses execution-stage transitions from Story `3.2`.
- Status exposure was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md
