# Story 5.3: Preserve Intermediate State and Evidence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to preserve useful intermediate state and evidence from incomplete runs,
so that failed work is still inspectable and potentially recoverable.

## Acceptance Criteria

1. When a run stops before successful completion, the system preserves the latest relevant state, evidence, and delivery artifacts produced so far.
2. Preserved items remain associated with the run.
3. If state preservation encounters a partial persistence failure, the system records what was and was not preserved.
4. Partial preservation failure does not overwrite already-saved run evidence.
5. Preserved intermediate state remains available for later inspection and recovery-oriented workflows.

## Tasks / Subtasks

- [x] Define the intermediate-state preservation contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse existing run state, validation evidence, delivery artifacts, and current work-state outputs from earlier stories.
  - [x] Define the minimum preservation inventory: relevant state, evidence, and delivery artifacts.
  - [x] Include explicit partial-preservation reporting in the contract.

- [x] Implement preservation on incomplete run finalization. (AC: 1, 2, 5)
  - [x] Trigger preservation when a run ends before successful completion.
  - [x] Preserve the latest relevant state, evidence, and delivery artifacts produced so far.
  - [x] Keep preserved items linked to the originating run for later inspection.

- [x] Implement partial-preservation failure handling. (AC: 3, 4)
  - [x] Detect when some preservation steps succeed and others fail.
  - [x] Record what was preserved and what was not.
  - [x] Prevent already-saved evidence from being overwritten during partial-failure handling.

- [x] Add automated tests for full and partial preservation. (AC: 1, 2, 3, 4, 5)
  - [x] Full-preservation test: an incomplete run preserves relevant state, evidence, and delivery artifacts.
  - [x] Partial-preservation test: failures record preserved vs. unpreserved items accurately.
  - [x] Non-overwrite test: existing saved evidence remains intact when later preservation steps fail.
  - [x] Linkage test: preserved items remain associated with the run.

## Dev Notes

- Story `5.3` depends on the run-state, evidence, and delivery artifacts created across Epics 3 and 4. It should preserve them, not redefine them. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-3-capture-structured-validation-evidence.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md]
- This story is about preservation and linkage, not about presenting history or diagnostics. History access belongs to Story `5.4`; diagnostics belong to Story `5.5`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.4: Expose Run History and Completed Summaries] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]
- Partial-preservation handling must be safe. Never overwrite already-saved evidence when later persistence operations fail.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `5.3` scoped to:
  - incomplete-run finalization hook
  - preservation inventory service/module
  - preserved-item/run linkage
  - partial-preservation reporting
  - tests
- Do not expand the slice into history retrieval or diagnostics rendering.

### Technical Requirements

- Story `5.3` must preserve relevant state, evidence, and delivery artifacts for incomplete runs. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.3: Preserve Intermediate State and Evidence]
- Preserved items must remain associated with the run.
- Partial preservation failures must record what was and was not preserved.
- Already-saved evidence must not be overwritten by later preservation failures.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no state-preservation patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible state-preservation surface needed for Story `5.3`.

### Library / Framework Requirements

- No approved runtime, persistence layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `5.3` silently choose the platform architecture. Keep the preservation slice minimal and reversible.

### File Structure Requirements

- Keep Story `5.3` code adjacent to run/evidence/artifact persistence boundaries.
- Use explicit terminology around `intermediate state`, `preserved evidence`, `delivery artifacts`, and `partial preservation failure`.
- Persist only the minimum preservation-reporting metadata needed by later history/troubleshooting stories.

### Testing Requirements

- Add automated tests for preservation success, partial failure, non-overwrite guarantees, and run linkage.
- Tests must prove incomplete runs preserve recoverable state.
- Tests must prove saved evidence is not overwritten on later failures.
- Tests must prove this story does not itself expose history views.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.3: Preserve Intermediate State and Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-3-capture-structured-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epics 3 and 4 artifact-producing stories.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `5.3` was constrained to preservation and linkage only.
- Partial-preservation safety was made explicit.
- History and diagnostics presentation were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-3-preserve-intermediate-state-and-evidence.md
