# Story 2.4: Identify Relevant Code and Test Surfaces

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to identify the code areas, files, and test surfaces most relevant to the task,
so that autonomous execution starts from the highest-value change surface.

## Acceptance Criteria

1. Relevance analysis runs only after a run-specific working context exists.
2. The system produces a ranked set of code areas, files, and test surfaces for the task.
3. The ranked relevance output is stored in preparation state for later execution use.
4. If the system cannot identify a sufficiently relevant change surface, it records that preparation could not confidently target the codebase.
5. A missing relevant change surface prevents the task from proceeding to autonomous execution.

## Tasks / Subtasks

- [x] Define the first relevance-analysis contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the run-specific working context from Story `2.3` as the single analysis input.
  - [x] Define the minimum ranked output shape for code areas, files, and test surfaces.
  - [x] Keep the contract limited to relevance analysis, not final critical-context blocking or execution planning.

- [x] Implement ranked relevance analysis over the working context. (AC: 1, 2, 3)
  - [x] Require an existing run-specific working context before analysis begins.
  - [x] Produce a ranked set of relevant code areas, files, and test surfaces.
  - [x] Persist the ranked relevance output into preparation state for downstream use.

- [x] Implement low-confidence/no-surface handling. (AC: 4, 5)
  - [x] Detect when the system cannot confidently identify a sufficient change surface.
  - [x] Record the low-confidence targeting outcome in structured form.
  - [x] Prevent progress toward execution when no sufficient change surface is available.

- [x] Add automated tests for confident and low-confidence relevance analysis. (AC: 1, 2, 3, 4, 5)
  - [x] Ranked-path test: a working context yields stored ranked code and test surfaces.
  - [x] Low-confidence test: insufficient targeting confidence is recorded and blocks progression.
  - [x] Persistence test: ranked relevance output remains available for downstream execution use.
  - [x] Guardrail test: this story does not assign final preparation outcomes beyond relevance-targeting results.

## Dev Notes

- Story `2.4` depends on the assembled working context from Story `2.3`. Do not analyze repository or external-system inputs independently here. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-3-build-a-run-specific-working-context.md]
- The output is a ranked set of relevant code areas, files, and test surfaces. Keep it explicitly preparation-state data, not execution logic. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces]
- Failure to find a confident change surface must be recorded and must block autonomous execution, but the final preparation blocking categories belong to Story `2.5`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- Do not perform repository retrieval, related-work retrieval, or context assembly here; those belong to Stories `2.1` through `2.3`.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `2.4` scoped to:
  - working-context reader
  - relevance-analysis service/module
  - ranked code/test-surface output model
  - low-confidence targeting record
  - tests
- Do not expand the slice into final preparation-outcome assignment or execution orchestration.

### Technical Requirements

- Story `2.4` must consume the working context produced by Story `2.3`; do not invent a parallel analysis input model. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-3-build-a-run-specific-working-context.md]
- The output must include ranked code areas, files, and test surfaces. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces]
- Low-confidence or no-surface outcomes must be recorded and must block progression.
- Keep relevance ranking deterministic and reviewable. No opaque heuristics without traceable output.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no code-indexing or relevance-analysis patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible relevance-analysis surface needed for Story `2.4`.

### Library / Framework Requirements

- No approved runtime, framework, repository-analysis toolchain, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `2.4` silently choose the platform architecture. Keep the relevance-analysis slice minimal and reversible.

### File Structure Requirements

- Keep Story `2.4` code adjacent to Story `2.3` within the Epic 2 preparation pipeline.
- Use explicit terminology around `relevance analysis`, `ranked surfaces`, `code areas`, `test surfaces`, and `low-confidence targeting`.
- Persist only the minimum ranked targeting output needed by later execution-planning and blocking stories.

### Testing Requirements

- Add automated tests for ranked relevance output and low-confidence blocking.
- Tests must prove the analysis requires the Story `2.3` working context.
- Tests must prove ranked output is persisted for downstream use.
- Tests must prove this story does not assign the final preparation outcome categories from Story `2.5`.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.4: Identify Relevant Code and Test Surfaces]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 2.5: Detect Missing or Conflicting Critical Context]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-3-build-a-run-specific-working-context.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `2.3`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `2.4` was constrained to relevance analysis only.
- The file explicitly depends on the Story `2.3` working context.
- Final preparation-outcome classification was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-4-identify-relevant-code-and-test-surfaces.md
