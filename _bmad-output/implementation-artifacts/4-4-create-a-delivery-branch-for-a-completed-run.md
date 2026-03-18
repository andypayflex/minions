# Story 4.4: Create a Delivery Branch for a Completed Run

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to create a branch or equivalent change set for a completed run,
so that validated work can be packaged for review.

## Acceptance Criteria

1. Delivery branch creation starts only for a run marked successful and ready for delivery.
2. The system creates a branch or equivalent change set tied to that run.
3. The delivery artifact identifier is recorded in the run record.
4. If delivery branch creation fails, the failure stage and reason are recorded.
5. Delivery-branch failure prevents pull request creation for that run.

## Tasks / Subtasks

- [x] Define the delivery-branch creation contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the successful completion state from Story `4.2` as the only delivery-branch entry condition.
  - [x] Define the minimum delivery artifact model and identifier linkage to the run.
  - [x] Keep the contract limited to branch/change-set creation, not PR publication.

- [x] Implement delivery-branch creation for successful runs. (AC: 1, 2, 3)
  - [x] Require a run marked successful and ready for delivery before branch creation begins.
  - [x] Create a branch or equivalent change set tied to the run.
  - [x] Persist the delivery artifact identifier in the run record.

- [x] Implement delivery-branch failure handling. (AC: 4, 5)
  - [x] Detect delivery-branch creation failures.
  - [x] Record the failure stage and reason in the run record.
  - [x] Prevent pull request creation when delivery-branch creation fails.

- [x] Add automated tests for successful and failed delivery-branch creation. (AC: 1, 2, 3, 4, 5)
  - [x] Successful-branch test: a successful run produces a recorded delivery artifact identifier.
  - [x] Failure test: branch-creation failure records stage and reason.
  - [x] Entry-condition test: non-successful runs cannot create delivery branches.
  - [x] Guardrail test: this story does not publish pull requests yet.

## Dev Notes

- Story `4.4` starts the delivery-artifact path only after Story `4.2` marks a run successful. Do not let partial or failed runs create delivery branches. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md]
- PR publication belongs to Story `4.5`; keep branch/change-set creation isolated here. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.5: Publish a Pull Request with Summary and Evidence]
- Delivery-artifact identifiers created here become the input to PR creation and must remain linked to the run record.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `4.4` scoped to:
  - successful-run eligibility check
  - delivery-branch/change-set creation service
  - run-linked delivery artifact persistence
  - branch-failure handling
  - tests
- Do not expand the slice into PR body assembly or PR publication.

### Technical Requirements

- Story `4.4` must require a successful run marked ready for delivery. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.4: Create a Delivery Branch for a Completed Run]
- The system must create a branch or equivalent change set tied to the run.
- The delivery artifact identifier must be recorded in the run record.
- Delivery-branch failure must record stage and reason and must prevent PR creation.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no branch-creation integration patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible delivery-branch surface needed for Story `4.4`.

### Library / Framework Requirements

- No approved runtime, git/provider integration library, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `4.4` silently choose the platform architecture. Keep the delivery-branch slice minimal and reversible.

### File Structure Requirements

- Keep Story `4.4` code adjacent to completion-state outputs and clearly separate from PR publication.
- Use explicit terminology around `delivery branch`, `change set`, `delivery artifact identifier`, and `branch-creation failure`.
- Persist only the minimum delivery-artifact metadata needed by PR-publication stories.

### Testing Requirements

- Add automated tests for successful branch creation, failure handling, and entry gating.
- Tests must prove partial/failed runs cannot create delivery branches.
- Tests must prove failures prevent PR creation.
- Tests must prove this story does not publish pull requests.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.4: Create a Delivery Branch for a Completed Run]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.5: Publish a Pull Request with Summary and Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `4.1` and `4.2`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `4.4` was constrained to delivery-branch creation only.
- Successful-run gating was made explicit.
- PR-publication concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md
