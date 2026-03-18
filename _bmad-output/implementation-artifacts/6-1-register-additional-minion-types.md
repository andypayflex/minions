# Story 6.1: Register Additional Minion Types

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want the platform to support registration of additional minion types,
so that new autonomous capabilities can be introduced beyond PR generation.

## Acceptance Criteria

1. The platform can store a new minion type as an available capability when it is defined within approved platform rules.
2. Existing PR-generation minion behavior remains intact after new minion-type registration.
3. Proposed minion types that violate platform capability rules are rejected.
4. Rejected registrations record the reason for rejection.
5. Minion-type registration remains consistent with the existing execution model rather than bypassing it.

## Tasks / Subtasks

- [x] Define the minion-type registration contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the existing platform capability and workflow assumptions established across Epics 1-5.
  - [x] Define the minimum minion-type registration model and approval-rule set.
  - [x] Keep the contract focused on registration and validation, not on implementing the behavior of new minion types.

- [x] Implement approved minion-type registration. (AC: 1, 2)
  - [x] Allow a new minion type to be stored as an available platform capability when it complies with approved rules.
  - [x] Ensure registration leaves the current PR-generation minion path unchanged.
  - [x] Keep the new minion-type record aligned to the core product model rather than introducing a parallel system.

- [x] Implement invalid-registration rejection handling. (AC: 3, 4)
  - [x] Detect minion-type definitions that violate platform capability rules.
  - [x] Reject the registration attempt.
  - [x] Record the rejection reason for later review.

- [x] Add automated tests for valid and invalid minion-type registration. (AC: 1, 2, 3, 4, 5)
  - [x] Valid-registration test: a compliant minion type is stored successfully.
  - [x] Stability test: existing PR-generation behavior is not altered by registration.
  - [x] Invalid-registration test: violating definitions are rejected with recorded reasons.
  - [x] Model-integrity test: registration does not bypass the established execution model.

## Dev Notes

- Story `6.1` is about platform extensibility, not implementation of a new minion itself. Keep it focused on registration, validation, and compatibility with the current model. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.1: Register Additional Minion Types]
- The PRD positions this as future platform expansion beyond autonomous PR generation. Preserve MVP behavior as the stable baseline. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Extensibility & Platform Evolution]
- Do not drift into orchestration, execution, or lifecycle implementation for new minions here.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `6.1` scoped to:
  - minion-type registration model
  - capability-rule validation service/module
  - platform capability persistence
  - rejection-reason recording
  - tests
- Do not expand the slice into new minion execution runtimes or cross-minion orchestration.

### Technical Requirements

- Story `6.1` must support storage of new minion types as available platform capabilities. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.1: Register Additional Minion Types]
- Existing PR-generation behavior must remain intact.
- Violating minion-type definitions must be rejected and recorded.
- Registration must preserve the established core product model.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no capability-registry patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible minion-registration surface needed for Story `6.1`.

### Library / Framework Requirements

- No approved runtime, registry/persistence layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `6.1` silently choose the platform architecture. Keep the registration slice minimal and reversible.

### File Structure Requirements

- Keep Story `6.1` code adjacent to platform-capability configuration and separate from the MVP execution path.
- Use explicit terminology around `minion type`, `platform capability`, `registration`, and `rejection reason`.
- Persist only the minimum capability-registration metadata needed by later expansion work.

### Testing Requirements

- Add automated tests for compliant registration, rejected registration, and PR-generation-path stability.
- Tests must prove new capability registration does not break the MVP path.
- Tests must prove violating definitions are rejected with recorded reasons.
- Tests must prove this story does not implement actual new minion behavior.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.1: Register Additional Minion Types]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Extensibility & Platform Evolution]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epics 1-5 story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `6.1` was constrained to platform minion-type registration only.
- MVP PR-generation stability was made explicit.
- New minion execution behavior was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/6-1-register-additional-minion-types.md
