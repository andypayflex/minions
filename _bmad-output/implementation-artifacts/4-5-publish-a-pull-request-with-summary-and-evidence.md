# Story 4.5: Publish a Pull Request with Summary and Evidence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineer,
I want Minions to publish a pull request that includes what changed and how it was validated,
so that I can review a complete and traceable delivery artifact.

## Acceptance Criteria

1. Pull request creation executes only when a delivery branch exists for a successful run.
2. The system creates a pull request automatically.
3. The pull request includes a structured summary of code changes and validation results.
4. The pull request links back to the original task or request context.
5. Relevant execution evidence needed for review is included in the pull request output.

## Tasks / Subtasks

- [x] Define the PR-publication contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the delivery artifact from Story `4.4`, the completion/evidence outputs from Stories `4.2` and `4.3`, and the original task context from Epic 1.
  - [x] Define the minimum PR body/content model for summary, validation results, evidence references, and task linkage.
  - [x] Keep the contract limited to PR publication, not delivery gating decisions.

- [x] Implement automatic PR publication from a delivery branch. (AC: 1, 2)
  - [x] Require a delivery branch/change set tied to a successful run.
  - [x] Create the pull request automatically from that delivery artifact.
  - [x] Link the PR to the run and task context.

- [x] Implement PR summary, validation, and evidence assembly. (AC: 3, 4, 5)
  - [x] Include a structured summary of what changed.
  - [x] Include validation results and relevant execution evidence needed for review.
  - [x] Link the PR back to the original task or request context in a traceable way.

- [x] Add automated tests for PR publication content and linkage. (AC: 1, 2, 3, 4, 5)
  - [x] PR-creation test: a successful run with a delivery branch creates a PR automatically.
  - [x] Summary-content test: the PR includes structured change and validation summaries.
  - [x] Task-linkage test: the PR links back to the originating task/request context.
  - [x] Evidence-content test: relevant execution evidence is included for review.

## Dev Notes

- Story `4.5` is the first user-visible delivery artifact in the product: the PR. It must consume the delivery branch from Story `4.4` plus the outcome/evidence data from Stories `4.2` and `4.3`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-3-capture-structured-validation-evidence.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md]
- The product brief treats autonomous PR generation with working code and tests as the central MVP outcome. Preserve that framing in the PR content model. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- Delivery gating belongs to Story `4.6`; do not collapse gate evaluation into PR publication here. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.6: Block Pull Request Creation When Gates Are Not Met]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `4.5` scoped to:
  - delivery-branch eligibility reader
  - PR-publication service/module
  - PR summary/evidence assembly
  - task-context linkage
  - tests
- Do not expand the slice into delivery-gate evaluation or review-workflow automation beyond PR creation.

### Technical Requirements

- Story `4.5` must require an existing delivery branch for a successful run. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.5: Publish a Pull Request with Summary and Evidence]
- The PR must include structured change summaries, validation results, and relevant execution evidence.
- The PR must link back to the original task/request context.
- Keep PR content deterministic and traceable. Do not rely on unstructured ad hoc summaries alone.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no PR-publication integration patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible PR-publication surface needed for Story `4.5`.

### Library / Framework Requirements

- No approved runtime, provider API client, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `4.5` silently choose the platform architecture. Keep the PR-publication slice minimal and reversible.

### File Structure Requirements

- Keep Story `4.5` code adjacent to delivery-branch outputs and evidence readers.
- Use explicit terminology around `pull request`, `structured summary`, `validation results`, `execution evidence`, and `task linkage`.
- Persist only the minimum PR-publication metadata needed by later audit or review stories.

### Testing Requirements

- Add automated tests for PR creation, PR content assembly, and task linkage.
- Tests must prove evidence and validation data appear in the PR output.
- Tests must prove publication requires an existing delivery artifact.
- Tests must prove this story does not decide delivery gating policy.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.5: Publish a Pull Request with Summary and Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.6: Block Pull Request Creation When Gates Are Not Met]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Executive Summary]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-3-capture-structured-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-4-create-a-delivery-branch-for-a-completed-run.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `4.2`, `4.3`, and `4.4`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `4.5` was constrained to PR publication only.
- The file explicitly ties PR content to run evidence and original task linkage.
- Delivery-gate policy was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-5-publish-a-pull-request-with-summary-and-evidence.md
