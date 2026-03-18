# Story 2.3: Build a Run-Specific Working Context

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to aggregate task, repository, and engineering-system context into one working context,
so that downstream execution uses a coherent task view.

## Acceptance Criteria

1. Context aggregation runs only after task submission data and external context have been retrieved.
2. The system produces a single run-specific working context for the task.
3. The system records the source inputs used to build that working context.
4. Duplicate or conflicting context elements are detected and flagged during aggregation.
5. Conflicting context prevents the task from advancing without a resolved preparation outcome.

## Tasks / Subtasks

- [x] Define the run-specific working-context model. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse task-request data from Epic 1 plus the preparation-state outputs from Stories `2.1` and `2.2`.
  - [x] Define the minimum unified working-context shape needed by downstream relevance analysis and execution planning.
  - [x] Include source-input traceability in the model so the system can show exactly which inputs formed the context.

- [x] Implement working-context aggregation. (AC: 1, 2, 3)
  - [x] Require repository context and any available approved-systems context before aggregation runs.
  - [x] Build a single run-specific working-context object for the task.
  - [x] Persist the aggregated context together with the source-input references used to produce it.

- [x] Implement duplicate/conflict detection and gating. (AC: 4, 5)
  - [x] Detect duplicate and conflicting context elements during aggregation.
  - [x] Flag conflicts in a structured form associated with the preparation record.
  - [x] Prevent the task from advancing when conflicts leave the working context unresolved.

- [x] Add automated tests for coherent and conflicting context assembly. (AC: 1, 2, 3, 4, 5)
  - [x] Happy-path test: repository plus related-work inputs produce a single working context with traceable source inputs.
  - [x] Duplicate-input test: duplicates are handled deterministically and flagged as needed.
  - [x] Conflicting-input test: conflicting context blocks advancement and records the conflict details.
  - [x] Guardrail test: this story does not rank files/tests or start execution.

## Dev Notes

- Story `2.3` is the first assembly point in Epic 2. It must consume the outputs from Stories `2.1` and `2.2`, not bypass them. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-2-retrieve-related-work-context-from-approved-systems.md]
- The working context must remain run-specific and traceable to its inputs. Do not discard which source documents or systems contributed each part of the assembled context. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context]
- Conflict detection here is about input coherence, not code relevance ranking or critical-context blocking outcomes. Relevance ranking belongs to Story `2.4`; final preparation outcome assignment belongs to Story `2.5`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- Do not introduce execution logic or repository modifications in this story. This remains a preparation-state assembly slice.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `2.3` scoped to:
  - preparation-state readers for Stories `2.1` and `2.2`
  - working-context assembly service/module
  - source-input traceability model
  - duplicate/conflict detection
  - tests
- Do not expand the slice into code-surface ranking, final preparation-outcome evaluation, or execution orchestration.

### Technical Requirements

- Story `2.3` must consume task submission data, repository context, and approved-systems context together. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context]
- The working context must be singular and run-specific, not a loose collection of unrelated records.
- Source inputs used to build the context must be stored for traceability.
- Duplicate and conflicting context elements must be flagged, and unresolved conflicts must block progress.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no context-assembly or data-model patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible working-context assembly surface needed for Story `2.3`.

### Library / Framework Requirements

- No approved runtime, framework, persistence layer, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `2.3` silently choose the platform architecture. Keep the assembly slice minimal and reversible.

### File Structure Requirements

- Keep Story `2.3` code adjacent to Stories `2.1` and `2.2` within the Epic 2 preparation pipeline.
- Use explicit terminology around `working context`, `source inputs`, `duplicate`, and `conflict`.
- Persist only the minimum assembled working-context object and its traceability metadata needed by later stories.

### Testing Requirements

- Add automated tests for successful context assembly, duplicate handling, and conflict blocking.
- Tests must prove source-input traceability is preserved.
- Tests must prove unresolved conflicts block advancement.
- Tests must prove this story does not perform relevance ranking or execution.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.3: Build a Run-Specific Working Context]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-1-retrieve-repository-context-for-a-task.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-2-retrieve-related-work-context-from-approved-systems.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `2.1` and `2.2`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `2.3` was constrained to run-specific working-context assembly only.
- Source-input traceability and conflict handling were preserved as first-class requirements.
- Relevance ranking and final preparation-outcome assignment were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-3-build-a-run-specific-working-context.md
