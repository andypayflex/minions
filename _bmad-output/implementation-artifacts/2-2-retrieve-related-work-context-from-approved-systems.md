# Story 2.2: Retrieve Related Work Context from Approved Systems

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to retrieve related work context from approved engineering systems,
so that task execution is informed by the surrounding request history and delivery state.

## Acceptance Criteria

1. Related-work retrieval runs only for an eligible task that references linked items in approved systems.
2. The system retrieves available task-relevant context from approved engineering systems and associates each item with the current preparation record.
3. Partial retrieval is preserved when one approved system is unavailable or returns incomplete data.
4. The affected source is recorded when a system is unavailable or incomplete.
5. Successfully retrieved context remains intact and uncorrupted even when another source fails.

## Tasks / Subtasks

- [x] Define the approved-systems retrieval contract. (AC: 1, 2, 3, 4, 5)
  - [x] Identify the minimum linked-item references and source metadata needed to retrieve related work context.
  - [x] Model approved engineering-system sources explicitly, consistent with product artifacts naming GitHub, Slack, and Azure DevOps.
  - [x] Keep the contract limited to related-work retrieval; do not merge data into a unified working context yet.

- [x] Implement related-work retrieval over approved systems. (AC: 1, 2)
  - [x] Require the task to reference linked items in approved systems before attempting retrieval.
  - [x] Retrieve available task-relevant context from each approved referenced source.
  - [x] Associate each retrieved context item with the current preparation record.

- [x] Implement partial-retrieval handling. (AC: 3, 4, 5)
  - [x] Detect unavailable or incomplete source responses.
  - [x] Record the affected source and partial retrieval result without discarding successfully retrieved context from other systems.
  - [x] Preserve the integrity of already retrieved items when one source fails.

- [x] Add automated tests for full and partial external-context retrieval. (AC: 1, 2, 3, 4, 5)
  - [x] Full-path test: linked approved systems return context that is associated with preparation state.
  - [x] Partial-path test: one unavailable source records partial retrieval and affected-source metadata while preserving successful items.
  - [x] Missing-links test: no retrieval occurs when the task has no approved linked references.
  - [x] Guardrail test: this story does not aggregate the unified working context or perform execution.

## Dev Notes

- Story `2.2` complements Story `2.1`. Repository context remains in Story `2.1`; related-work context from GitHub, Slack, and Azure DevOps belongs here. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- The product brief names GitHub, Slack, and Azure DevOps as the core approved engineering systems for MVP. Model them as explicit approved sources rather than generic arbitrary integrations. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- Do not aggregate retrieved data into a single run-specific working context in this story; that belongs to Story `2.3`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context]
- Partial retrieval must be survivable. One failing source cannot corrupt already retrieved context from another source. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.2: Retrieve Related Work Context from Approved Systems]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `2.2` scoped to:
  - linked-item/source reference parsing
  - approved-systems retrieval service/module
  - related-work preparation-state record
  - partial-retrieval handling
  - tests
- Do not expand the slice into unified working-context assembly, relevance ranking, or execution orchestration.

### Technical Requirements

- Story `2.2` should consume task-linked references from the intake/preparation chain rather than inventing a second task-context model.
- Approved system names should stay aligned to the planning artifacts: GitHub, Slack, and Azure DevOps. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- Retrieved items must be associated individually with the preparation record, not flattened into a final working-context object yet.
- Partial failure must preserve successfully retrieved context and record the affected source explicitly.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no integration-client or connector patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible related-work retrieval surface needed for Story `2.2`.

### Library / Framework Requirements

- No approved runtime, framework, integration client, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `2.2` silently choose the platform architecture. Keep the retrieval slice minimal and reversible.

### File Structure Requirements

- Keep Story `2.2` code adjacent to Story `2.1` within the Epic 2 preparation pipeline.
- Use explicit terminology around `approved systems`, `related work context`, `partial retrieval`, and `affected source`.
- Persist only the minimum related-work items and partial-failure metadata needed by later context-assembly stories.

### Testing Requirements

- Add automated tests for successful retrieval, partial retrieval, and no-linked-item scenarios.
- Tests must prove successful items are preserved when another source fails.
- Tests must prove this story does not assemble the final working context or start execution.
- Tests must prove only approved-system references are eligible for retrieval.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.2: Retrieve Related Work Context from Approved Systems]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epic 1 and Story `2.1`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `2.2` was constrained to approved-systems related-work retrieval only.
- The file explicitly preserves partial retrieval without corrupting successful context.
- Working-context assembly was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-2-retrieve-related-work-context-from-approved-systems.md
