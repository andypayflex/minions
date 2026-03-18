# Story 2.1: Retrieve Repository Context for a Task

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to retrieve repository context for a submitted task,
so that execution planning is grounded in the actual codebase.

## Acceptance Criteria

1. Repository context retrieval runs only for a task that has passed the Epic 1 pre-run gates and includes repository identification.
2. Retrieval collects target repository metadata and accessible codebase context for the task.
3. Retrieved repository context is stored as part of run preparation state.
4. If repository access fails or the repository cannot be resolved, the failure is recorded against the preparation stage.
5. Repository-resolution failure prevents the task from advancing to autonomous execution.

## Tasks / Subtasks

- [x] Define the repository-context retrieval contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the Story `1.1` repository identifier from the task-request contract.
  - [x] Define the minimum repository metadata and codebase context required at this stage.
  - [x] Keep the contract limited to repository resolution and accessible repository context, not broader engineering-system aggregation.

- [x] Implement repository resolution and retrieval over eligible tasks. (AC: 1, 2, 3)
  - [x] Require the task to have cleared the Epic 1 gating pipeline before repository retrieval begins.
  - [x] Resolve the target repository and collect the approved repository metadata and available codebase context.
  - [x] Persist the retrieval output into run preparation state for downstream Epic 2 stories.

- [x] Implement repository-failure handling. (AC: 4, 5)
  - [x] Detect unresolved repositories and repository-access failures.
  - [x] Record the failure against the preparation stage in structured form.
  - [x] Prevent advancement toward execution when repository retrieval fails.

- [x] Add automated tests for resolved and unresolved repositories. (AC: 1, 2, 3, 4, 5)
  - [x] Resolved-path test: a gated task with valid repository identification stores repository context in preparation state.
  - [x] Unresolved-path test: an unknown repository identifier records a preparation-stage failure.
  - [x] Access-failure test: an inaccessible repository records failure without corrupting preparation state.
  - [x] Guardrail test: repository retrieval does not aggregate external-system context or start execution.

## Dev Notes

- Story `2.1` begins Epic 2 only after the Epic 1 intake/governance pipeline has completed. It should consume the outputs of Stories `1.1` through `1.5`, not recreate them. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-5-apply-autonomy-boundaries-and-approval-gates.md]
- The product direction explicitly calls for GitHub-integrated context gathering, but this story is repository-context only. Do not broaden it into Slack/Azure DevOps retrieval; that belongs to Story `2.2`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.2: Retrieve Related Work Context from Approved Systems]
- Store repository context as preparation-state data for later working-context and relevance-analysis stories. Do not perform ranking of files or tests here; that belongs to Story `2.4`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces]
- Failure to resolve the repository must stop progression toward autonomous execution. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.1: Retrieve Repository Context for a Task]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `2.1` scoped to:
  - gated task-state read access
  - repository-resolution service/module
  - repository-context preparation-state record
  - preparation-stage failure handling
  - tests
- Do not expand the slice into cross-system context aggregation, relevance ranking, or execution orchestration.

### Technical Requirements

- Story `2.1` consumes the `repository` field introduced in Story `1.1`; do not invent a second repository-identification scheme. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- Retrieved repository context must be persisted as part of preparation state for later Epic 2 stories. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.1: Retrieve Repository Context for a Task]
- Unresolved or inaccessible repositories must record a preparation-stage failure and block advancement.
- Keep repository retrieval deterministic and reviewable. No hidden fallback repositories or implicit overrides.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no repository-integration patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible repository-context slice needed for Story `2.1`.

### Library / Framework Requirements

- No approved runtime, framework, repository client, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `2.1` silently choose the platform architecture. Keep the retrieval slice minimal and reversible.

### File Structure Requirements

- Keep Story `2.1` code adjacent to the Epic 1 gating pipeline and the Epic 2 preparation-state slice.
- Use explicit terminology around `repository context`, `preparation state`, `repository resolution`, and `preparation-stage failure`.
- Persist only the minimum repository metadata and accessible codebase context needed by later stories.

### Testing Requirements

- Add automated tests for successful repository resolution and failure scenarios.
- Tests must prove repository retrieval only runs for tasks that have cleared the Epic 1 gating chain.
- Tests must prove failure blocks further progress.
- Tests must prove this story does not aggregate external-system context or perform relevance ranking.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.1: Retrieve Repository Context for a Task]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.2: Retrieve Related Work Context from Approved Systems]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-5-apply-autonomy-boundaries-and-approval-gates.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epic 1 story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `2.1` was constrained to repository-context retrieval only.
- The file explicitly depends on the Epic 1 gating outputs and the Story `1.1` repository identifier.
- External-system aggregation and relevance ranking were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md
