# Story 4.2: Determine Completion Status from Validation Evidence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to determine whether a run is successful, partial, or failed based on validation evidence,
so that pull request creation only happens for runs that meet the working-code-with-tests standard.

## Acceptance Criteria

1. Completion evaluation runs only after validation has completed for a run.
2. The system assigns exactly one completion state: `successful`, `partial`, or `failed`.
3. The evidence used for the completion determination is stored with the run.
4. If validation evidence does not satisfy the required completion criteria, the run is not marked ready for PR creation.
5. The system records why the working-code-with-tests standard was not met.

## Tasks / Subtasks

- [x] Define the completion-evaluation contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the completed validation outputs from Story `4.1` and evidence inputs from Story `4.3`.
  - [x] Define the minimum completion-state model and evidence linkage needed for run outcome evaluation.
  - [x] Keep the contract limited to outcome determination, not branch or PR creation.

- [x] Implement completion-state evaluation from validation evidence. (AC: 1, 2, 3)
  - [x] Require validation to have completed before evaluation begins.
  - [x] Assign exactly one completion state of `successful`, `partial`, or `failed`.
  - [x] Persist the completion state together with the evidence used for determination.

- [x] Implement unmet-standard recording and gating. (AC: 4, 5)
  - [x] Detect when the validation evidence does not satisfy the working-code-with-tests standard.
  - [x] Prevent the run from being marked ready for PR creation when the standard is unmet.
  - [x] Record the reasons the run did not meet the completion standard.

- [x] Add automated tests for successful, partial, and failed outcomes. (AC: 1, 2, 3, 4, 5)
  - [x] Successful-outcome test: passing evidence yields `successful`.
  - [x] Partial-outcome test: incomplete or mixed evidence yields `partial`.
  - [x] Failed-outcome test: failed evidence yields `failed`.
  - [x] Gating test: non-successful outcomes are not marked ready for PR creation.

## Dev Notes

- Story `4.2` is the completion-state decision layer for Epic 4. It must consume validation outputs rather than rerunning validation. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-1-run-repository-relevant-validation.md]
- The core product standard is working code with tests. This story translates validation evidence into the allowed run outcome states against that standard. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- Branch creation and PR publication belong to Stories `4.4` and `4.5`; keep delivery artifacts out of this story. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.4: Create a Delivery Branch for a Completed Run] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.5: Publish a Pull Request with Summary and Evidence]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `4.2` scoped to:
  - validation-output reader
  - completion-evaluation service/module
  - run outcome persistence
  - unmet-standard reasoning capture
  - tests
- Do not expand the slice into branch creation or PR delivery.

### Technical Requirements

- Story `4.2` must require completed validation before evaluation. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.2: Determine Completion Status from Validation Evidence]
- The completion state must be exactly one of `successful`, `partial`, or `failed`.
- The evidence used for the determination must be stored with the run.
- Non-successful or evidence-insufficient outcomes must not be marked ready for PR creation and must record why the standard was not met.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no run-outcome evaluation patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible completion-evaluation surface needed for Story `4.2`.

### Library / Framework Requirements

- No approved runtime, rules engine, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `4.2` silently choose the platform architecture. Keep the evaluation slice minimal and reversible.

### File Structure Requirements

- Keep Story `4.2` code adjacent to Story `4.1` validation outputs and clearly separate from delivery artifacts.
- Use explicit terminology around `completion state`, `successful`, `partial`, `failed`, and `working-code-with-tests standard`.
- Persist only the minimum outcome and rationale data needed by later delivery-gating stories.

### Testing Requirements

- Add automated tests for all three completion states.
- Tests must prove evaluation uses validation evidence instead of ad hoc assumptions.
- Tests must prove non-successful outcomes are not marked ready for PR creation.
- Tests must prove this story does not create branches or pull requests.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.2: Determine Completion Status from Validation Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.4: Create a Delivery Branch for a Completed Run]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.5: Publish a Pull Request with Summary and Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-1-run-repository-relevant-validation.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `4.1`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `4.2` was constrained to completion-state evaluation only.
- Delivery artifact creation was kept out of this story by design.
- The working-code-with-tests standard was preserved as the explicit gating principle.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md
