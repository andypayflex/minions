# Story 5.6: Record an Auditable Run Ledger

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want every run to have an auditable record of inputs, actions, outputs, and outcomes,
so that the platform remains governable and reviewable.

## Acceptance Criteria

1. As a run progresses through its lifecycle, meaningful run events are recorded in an auditable ledger.
2. The ledger remains linked to the run identifier.
3. When a stakeholder reviews a completed run, they can determine what context, tools, and changes were involved.
4. The ledger shows which actions were autonomous versus approval-gated or blocked.
5. The ledger remains reviewable without requiring reconstruction from separate subsystems.

## Tasks / Subtasks

- [x] Define the auditable run-ledger contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the event-rich outputs already established across Epics 1-5 instead of inventing a parallel event stream.
  - [x] Define the minimum ledger-entry model for inputs, actions, outputs, outcomes, and autonomy/approval classification.
  - [x] Keep the contract focused on ledger recording and reviewability, not analytics/reporting expansion from Epic 6.

- [x] Implement run-ledger recording across lifecycle events. (AC: 1, 2, 4)
  - [x] Record meaningful events as a run progresses through intake, preparation, execution, validation, delivery, and failure-handling stages.
  - [x] Link every ledger entry to the run identifier.
  - [x] Capture whether each action was autonomous, approval-gated, or blocked.

- [x] Implement stakeholder review retrieval over the ledger. (AC: 3, 5)
  - [x] Make the ledger reviewable for completed runs without requiring manual reconstruction.
  - [x] Ensure stakeholders can determine what context, tools, and changes were involved.
  - [x] Keep review retrieval distinct from the higher-level history/summary views in Story `5.4`.

- [x] Add automated tests for ledger recording and reviewability. (AC: 1, 2, 3, 4, 5)
  - [x] Lifecycle-recording test: meaningful run events create linked ledger entries.
  - [x] Classification test: ledger entries identify autonomous vs. approval-gated vs. blocked actions.
  - [x] Reviewability test: a stakeholder can reconstruct inputs, tools, changes, and outcomes from the ledger alone.
  - [x] Separation test: this story does not drift into analytics/reporting features from Epic 6.

## Dev Notes

- Story `5.6` is the audit backbone for the platform. It should build from the events and states created across Epics 1-5, not compete with them. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Oversight, Governance & Auditability]
- Keep the ledger reviewable and governable. It is not a BI/reporting feature yet; broader structured reporting comes later in Epic 6. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Epic 6: Platform Expansion and Reusable Run Data]
- History summaries in Story `5.4` are user-facing convenience views; the run ledger here is the authoritative auditable record.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `5.6` scoped to:
  - run-ledger event model
  - lifecycle-event recording service/module
  - run-linked ledger persistence
  - stakeholder review reader
  - tests
- Do not expand the slice into reporting dashboards or orchestration APIs.

### Technical Requirements

- Story `5.6` must record auditable inputs, actions, outputs, and outcomes across the run lifecycle. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.6: Record an Auditable Run Ledger]
- Ledger entries must remain linked to the run identifier.
- Ledger entries must show which actions were autonomous, approval-gated, or blocked.
- Stakeholders must be able to determine context, tools, and changes from the ledger without reconstructing separate subsystems manually.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no ledger/event-store patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible auditable-ledger surface needed for Story `5.6`.

### Library / Framework Requirements

- No approved runtime, event/ledger persistence layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `5.6` silently choose the platform architecture. Keep the ledger slice minimal and reversible.

### File Structure Requirements

- Keep Story `5.6` code adjacent to lifecycle-event sources and clearly separate it from summary/history convenience views.
- Use explicit terminology around `run ledger`, `auditable record`, `lifecycle events`, `autonomous`, `approval-gated`, and `blocked`.
- Persist only the minimum ledger data needed for audit review in this story.

### Testing Requirements

- Add automated tests for lifecycle recording, autonomy classification, run linkage, and stakeholder reviewability.
- Tests must prove the ledger can stand on its own for audit review.
- Tests must prove this story does not drift into reporting/analytics features.
- Tests must prove ledger entries remain linked to the originating run.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.6: Record an Auditable Run Ledger]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Oversight, Governance & Auditability]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Epic 6: Platform Expansion and Reusable Run Data]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-4-expose-run-history-and-completed-summaries.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epics 1-5 run-state and history-related story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `5.6` was constrained to the auditable run ledger only.
- The ledger was positioned as the authoritative audit record, distinct from summaries and history views.
- Reporting and orchestration expansion were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-6-record-an-auditable-run-ledger.md
