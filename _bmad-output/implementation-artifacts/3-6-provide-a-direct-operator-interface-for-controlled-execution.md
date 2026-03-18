# Story 3.6: Provide a Direct Operator Interface for Controlled Execution

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an operator,
I want a direct operational interface for administration, debugging, and controlled execution,
so that I can inspect and manage runs within approved limits.

## Acceptance Criteria

1. An authorized operator can access the operational interface.
2. Within approved scope, the interface exposes run administration or debugging controls and relevant run metadata.
3. Operator actions are recorded for auditability.
4. Actions outside operator scope are blocked.
5. Blocked operator actions return a clear authorization failure outcome.

## Tasks / Subtasks

- [x] Define the direct operator-interface contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the persisted run-state and status models from earlier Epic 3 stories.
  - [x] Define the minimum set of approved administration/debugging actions and related metadata exposure.
  - [x] Keep the contract limited to controlled operator access, not general-user status viewing.

- [x] Implement authorized operator access and controls. (AC: 1, 2)
  - [x] Allow authorized operators to access the direct operational interface.
  - [x] Expose only approved-scope administration/debugging actions and relevant run metadata.
  - [x] Keep the available controls bounded by approved operator scope.

- [x] Implement operator-action audit and blocked-action handling. (AC: 3, 4, 5)
  - [x] Record operator actions for auditability.
  - [x] Block actions outside allowed scope.
  - [x] Return a clear authorization failure outcome for blocked actions.

- [x] Add automated tests for authorized and blocked operator actions. (AC: 1, 2, 3, 4, 5)
  - [x] Authorized-operator test: approved actions and metadata are available within scope.
  - [x] Audit test: operator actions are recorded.
  - [x] Blocked-action test: out-of-scope actions are denied with clear authorization failure.
  - [x] Separation test: this story does not collapse into the read-only status access already covered by Story `3.5`.

## Dev Notes

- Story `3.6` builds on the run-state and status surfaces created earlier in Epic 3. Reuse them rather than inventing a second operator-only run model. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-5-expose-in-progress-run-status-to-engineers-and-operators.md]
- This story is about controlled operator access, not open-ended administrative power. Operator scope must be explicit and bounded.
- Auditability of operator actions is required here, but do not expand this into the full run ledger or later failure-analysis epics.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `3.6` scoped to:
  - operator-interface authorization layer
  - bounded operator-control service/module
  - operator-action audit hook
  - authorization-failure responses
  - tests
- Do not expand the slice into full audit-ledger design or post-run analytics.

### Technical Requirements

- Story `3.6` must allow only authorized operators to access the operational interface. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.6: Provide a Direct Operator Interface for Controlled Execution]
- The interface must expose only approved-scope administration/debugging actions and relevant run metadata.
- Operator actions must be recorded for auditability.
- Out-of-scope actions must be blocked with a clear authorization failure outcome.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no operator-interface or admin-control patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible operator-interface surface needed for Story `3.6`.

### Library / Framework Requirements

- No approved runtime, auth/admin framework, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `3.6` silently choose the platform architecture. Keep the operator-interface slice minimal and reversible.

### File Structure Requirements

- Keep Story `3.6` code adjacent to the run-state/status pipeline and clearly separate it from general-user status reads.
- Use explicit terminology around `operator interface`, `approved scope`, `auditability`, and `authorization failure`.
- Persist only the minimum operator-action audit metadata needed here.

### Testing Requirements

- Add automated tests for authorized operator controls, blocked actions, and operator-action audit recording.
- Tests must prove operator scope is enforced.
- Tests must prove this story remains distinct from the read-only status surface in Story `3.5`.
- Tests must prove blocked actions return a clear authorization failure outcome.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.6: Provide a Direct Operator Interface for Controlled Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-5-expose-in-progress-run-status-to-engineers-and-operators.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `3.3` and `3.5`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `3.6` was constrained to a bounded operator interface only.
- The file explicitly reuses the run-state/status surfaces created earlier in Epic 3.
- Full audit-ledger and broader analytics concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-6-provide-a-direct-operator-interface-for-controlled-execution.md
