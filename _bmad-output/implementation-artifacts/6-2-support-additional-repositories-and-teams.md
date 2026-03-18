# Story 6.2: Support Additional Repositories and Teams

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want the platform to onboard additional repositories and teams,
so that the MVP model can expand without redesigning the core workflow.

## Acceptance Criteria

1. When onboarding configuration is completed through approved platform controls, a new repository or team is stored as a supported execution target.
2. Existing supported targets continue to operate unchanged after onboarding.
3. Incomplete onboarding data or data that violates support constraints blocks the onboarding attempt.
4. Blocked onboarding returns the specific reasons the target could not be enabled.
5. Repository/team onboarding remains consistent with the current core workflow model.

## Tasks / Subtasks

- [x] Define the repository/team onboarding contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the existing supported-target assumptions from the MVP execution model.
  - [x] Define the minimum onboarding model for repositories, teams, and support constraints.
  - [x] Keep the contract focused on onboarding and validation, not on rewriting the workflow model.

- [x] Implement approved onboarding of repositories and teams. (AC: 1, 2)
  - [x] Allow new repositories or teams to be stored as supported execution targets when approved controls are satisfied.
  - [x] Preserve existing supported targets and workflows unchanged.
  - [x] Keep onboarding aligned with the established execution path rather than creating target-specific special cases.

- [x] Implement blocked-onboarding handling. (AC: 3, 4)
  - [x] Detect incomplete onboarding data and support-constraint violations.
  - [x] Block the onboarding attempt when constraints are not met.
  - [x] Return and record the specific reasons the target could not be enabled.

- [x] Add automated tests for valid and invalid onboarding. (AC: 1, 2, 3, 4, 5)
  - [x] Valid-onboarding test: a compliant repository/team target is stored successfully.
  - [x] Stability test: existing supported targets continue operating unchanged.
  - [x] Invalid-onboarding test: incomplete or violating input is blocked with explicit reasons.
  - [x] Model-integrity test: onboarding does not redesign or fork the core workflow model.

## Dev Notes

- Story `6.2` is expansion of the supported-target surface, not a redesign of the workflow engine. Preserve the current model and onboard targets into it. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.2: Support Additional Repositories and Teams]
- The PRD explicitly calls out expansion to additional repositories and teams as a future capability that must not require a full redesign. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Extensibility & Platform Evolution]
- Do not broaden this story into multi-team rollout policy or broader operational governance.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `6.2` scoped to:
  - supported-target onboarding model
  - onboarding validation service/module
  - repository/team target persistence
  - blocked-onboarding reason handling
  - tests
- Do not expand the slice into workflow redesign or org-wide rollout tooling.

### Technical Requirements

- Story `6.2` must store new repositories or teams as supported execution targets when approved controls are satisfied. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.2: Support Additional Repositories and Teams]
- Existing supported targets must continue to operate unchanged.
- Incomplete or violating onboarding data must block enablement and return explicit reasons.
- Onboarding must remain compatible with the core workflow model.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no onboarding/configuration patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible repository/team onboarding surface needed for Story `6.2`.

### Library / Framework Requirements

- No approved runtime, configuration store, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `6.2` silently choose the platform architecture. Keep the onboarding slice minimal and reversible.

### File Structure Requirements

- Keep Story `6.2` code adjacent to platform target configuration and separate from the MVP execution logic.
- Use explicit terminology around `supported execution target`, `onboarding`, `support constraints`, and `blocked enablement`.
- Persist only the minimum onboarding metadata and reason data needed by later expansion stories.

### Testing Requirements

- Add automated tests for successful onboarding, blocked onboarding, and existing-target stability.
- Tests must prove onboarding does not fork or redesign the core workflow model.
- Tests must prove blocked attempts return explicit reasons.
- Tests must prove this story does not implement team-specific execution behavior.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.2: Support Additional Repositories and Teams]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Extensibility & Platform Evolution]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epics 1-5 story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `6.2` was constrained to supported-target onboarding only.
- Core workflow compatibility was made explicit.
- Org-wide rollout and execution customization were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/6-2-support-additional-repositories-and-teams.md
