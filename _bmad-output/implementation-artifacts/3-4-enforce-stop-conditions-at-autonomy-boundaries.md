# Story 3.4: Enforce Stop Conditions at Autonomy Boundaries

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to stop execution when a task crosses a defined autonomy boundary,
so that the platform does not continue into unauthorized behavior.

## Acceptance Criteria

1. During an in-progress run, the system can detect actions or conditions outside the task’s allowed autonomy boundary.
2. The system stops execution before performing the blocked action.
3. The stop reason is recorded in run state.
4. The run outcome is marked as `boundary-stopped` when a stop condition triggers.
5. The current work state is preserved for later inspection.

## Tasks / Subtasks

- [x] Define the runtime stop-condition contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the autonomy-boundary policy concepts established in Story `1.5`.
  - [x] Define the minimum runtime signals needed to detect a boundary-crossing action or condition.
  - [x] Keep the contract limited to runtime stop enforcement, not pre-execution policy evaluation.

- [x] Implement runtime stop-condition detection and enforcement. (AC: 1, 2, 3, 4)
  - [x] Monitor in-progress execution for actions or conditions outside the allowed autonomy boundary.
  - [x] Stop execution before the blocked action is performed.
  - [x] Record the stop reason and mark the run outcome as `boundary-stopped`.

- [x] Implement current-work-state preservation on boundary stop. (AC: 5)
  - [x] Preserve the current work state when execution halts due to a boundary stop.
  - [x] Keep the preserved state linked to the stopped run for later inspection.
  - [x] Avoid erasing prior progress-state history when the stop occurs.

- [x] Add automated tests for boundary-stop behavior. (AC: 1, 2, 3, 4, 5)
  - [x] Boundary-crossing test: a blocked runtime action is stopped before execution continues.
  - [x] Stop-reason test: the boundary reason is recorded in run state.
  - [x] Outcome test: the run is marked `boundary-stopped`.
  - [x] Preservation test: current work state remains available for later inspection.

## Dev Notes

- Story `3.4` is the runtime counterpart to Story `1.5`. Story `1.5` decides allowed autonomy before execution starts; Story `3.4` enforces stop conditions when runtime behavior crosses those limits. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-5-apply-autonomy-boundaries-and-approval-gates.md]
- This story depends on an active run and the persisted run state from Stories `3.1` through `3.3`. Do not re-implement startup or progress persistence here. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-1-start-an-isolated-run-environment.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md]
- Preserve current work state on a boundary stop so later troubleshooting and failure-handling stories can inspect it.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `3.4` scoped to:
  - runtime boundary-detection service/module
  - execution-stop enforcement
  - stop-reason recording
  - work-state preservation
  - tests
- Do not expand the slice into general failure classification or operator UI.

### Technical Requirements

- Story `3.4` must stop execution before the blocked action is performed. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.4: Enforce Stop Conditions at Autonomy Boundaries]
- The run outcome must be marked `boundary-stopped`.
- The stop reason must be recorded in run state.
- Current work state must be preserved for later inspection.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no runtime-policy-enforcement patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible runtime stop-enforcement surface needed for Story `3.4`.

### Library / Framework Requirements

- No approved runtime, policy-enforcement library, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `3.4` silently choose the platform architecture. Keep the stop-enforcement slice minimal and reversible.

### File Structure Requirements

- Keep Story `3.4` code adjacent to the run-state/execution pipeline and clearly separated from pre-execution policy evaluation.
- Use explicit terminology around `autonomy boundary`, `boundary stop`, `stop reason`, and `current work state`.
- Persist only the minimum boundary-stop metadata and preserved-state linkage needed by later stories.

### Testing Requirements

- Add automated tests for boundary detection, stop enforcement, and preserved work state.
- Tests must prove the blocked action is prevented before it executes.
- Tests must prove the run outcome is recorded as `boundary-stopped`.
- Tests must prove this story does not replace later failure-summary or operator-status stories.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.4: Enforce Stop Conditions at Autonomy Boundaries]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-5-apply-autonomy-boundaries-and-approval-gates.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-1-start-an-isolated-run-environment.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `1.5`, `3.1`, and `3.3`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `3.4` was constrained to runtime autonomy-boundary enforcement only.
- The file explicitly separates runtime stop logic from pre-execution policy decisions.
- Preserved work-state requirements were included for downstream inspection use.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-4-enforce-stop-conditions-at-autonomy-boundaries.md
