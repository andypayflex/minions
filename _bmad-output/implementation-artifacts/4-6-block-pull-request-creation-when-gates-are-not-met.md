# Story 4.6: Block Pull Request Creation When Gates Are Not Met

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want pull request creation blocked unless completion gates are satisfied,
so that Minions cannot deliver unqualified output as if it were complete.

## Acceptance Criteria

1. When a run is partial, failed, or missing required validation evidence, delivery gating blocks pull request creation.
2. The system records which required gate was not satisfied.
3. If a blocked run later becomes eligible after re-evaluation, delivery gating can be re-run.
4. Pull request creation is allowed only if all required gates are satisfied.
5. Prior blocked-gate history is preserved in the run record.

## Tasks / Subtasks

- [x] Define the delivery-gating contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the completion-state outputs from Story `4.2`, the evidence state from Story `4.3`, and the delivery/publication path from Stories `4.4` and `4.5`.
  - [x] Define the minimum set of required gates for PR eligibility.
  - [x] Include blocked-gate history in the gating model so prior gate failures remain visible.

- [x] Implement PR-delivery gating evaluation. (AC: 1, 2, 4)
  - [x] Detect runs that are partial, failed, or missing required validation evidence.
  - [x] Block PR creation when any required gate is unsatisfied.
  - [x] Allow PR creation only when all required gates are satisfied.

- [x] Implement blocked-gate recording and re-evaluation handling. (AC: 2, 3, 5)
  - [x] Record which required gate was not satisfied for blocked runs.
  - [x] Support re-running the delivery-gating check when run state changes.
  - [x] Preserve prior blocked-gate history in the run record across re-evaluations.

- [x] Add automated tests for blocked and re-evaluated delivery gating. (AC: 1, 2, 3, 4, 5)
  - [x] Blocked-run test: partial/failed/missing-evidence runs cannot create PRs and record the failed gate.
  - [x] Eligible-run test: all required gates satisfied allows PR creation.
  - [x] Re-evaluation test: a previously blocked run can become eligible after state changes.
  - [x] History test: prior blocked-gate history remains preserved after re-evaluation.

## Dev Notes

- Story `4.6` is the final delivery gate for Epic 4. It must sit in front of PR creation logic and decide whether Stories `4.4` and `4.5` may proceed. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-5-publish-a-pull-request-with-summary-and-evidence.md]
- The product promise is a reviewable PR with working code and tests. This story protects that promise by blocking PR publication when completion gates are unmet. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- Preserve gate history across re-evaluation so operators and reviewers can see that a run was previously blocked.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `4.6` scoped to:
  - delivery-gating evaluation service/module
  - blocked-gate persistence/history
  - re-evaluation trigger/entrypoint
  - PR-eligibility check
  - tests
- Do not expand the slice into broader review workflow or merge automation.

### Technical Requirements

- Story `4.6` must block PR creation for partial, failed, or missing-evidence runs. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.6: Block Pull Request Creation When Gates Are Not Met]
- The system must record which required gate was not satisfied.
- Re-evaluation must be possible, and prior blocked-gate history must be preserved.
- PR creation is allowed only when all required gates are satisfied.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no delivery-gating patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible delivery-gating surface needed for Story `4.6`.

### Library / Framework Requirements

- No approved runtime, rules engine, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `4.6` silently choose the platform architecture. Keep the gating slice minimal and reversible.

### File Structure Requirements

- Keep Story `4.6` code adjacent to completion-state, evidence, and PR-eligibility readers.
- Use explicit terminology around `delivery gate`, `required gate`, `blocked-gate history`, `re-evaluation`, and `PR eligibility`.
- Persist only the minimum gating outcome and history data needed by later audit/review work.

### Testing Requirements

- Add automated tests for blocked PR gating, successful PR eligibility, re-evaluation, and history preservation.
- Tests must prove blocked runs cannot create PRs.
- Tests must prove all required gates must be satisfied before PR creation is allowed.
- Tests must prove prior blocked-gate history persists across state changes.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.6: Block Pull Request Creation When Gates Are Not Met]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-3-capture-structured-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-5-publish-a-pull-request-with-summary-and-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `4.2` through `4.5`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `4.6` was constrained to delivery-gating logic only.
- Re-evaluation and blocked-gate history were made explicit.
- Broader review/merge workflow concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-6-block-pull-request-creation-when-gates-are-not-met.md
