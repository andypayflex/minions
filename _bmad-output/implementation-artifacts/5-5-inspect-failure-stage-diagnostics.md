# Story 5.5: Inspect Failure-Stage Diagnostics

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an operator,
I want to inspect diagnostics for the stage where a run failed or stopped,
so that I can troubleshoot without reconstructing the run manually.

## Acceptance Criteria

1. When a run has a recorded failed or blocked stage, an authorized operator can request diagnostics for that stage.
2. The system returns diagnostics associated with that stage, including related evidence references.
3. Diagnostics identify whether the outcome was `partial`, `blocked`, `failed`, or `boundary-stopped`.
4. If stage diagnostics are incomplete because an upstream integration failed, the system identifies them as incomplete.
5. Incomplete diagnostics preserve visibility into the upstream failure source.

## Tasks / Subtasks

- [x] Define the stage-diagnostics retrieval contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse run-stage history, failure classification, preserved evidence, and summary outputs from earlier stories.
  - [x] Define the minimum stage-diagnostics response shape including stage identity, related evidence references, and terminal outcome type.
  - [x] Include explicit incomplete-diagnostics handling for upstream integration failures.

- [x] Implement authorized stage-diagnostics retrieval. (AC: 1, 2, 3)
  - [x] Require a recorded failed or blocked stage before diagnostics can be requested.
  - [x] Return diagnostics for that stage together with related evidence references.
  - [x] Identify whether the outcome was `partial`, `blocked`, `failed`, or `boundary-stopped`.

- [x] Implement incomplete-diagnostics visibility handling. (AC: 4, 5)
  - [x] Detect when stage diagnostics are incomplete due to upstream integration failure.
  - [x] Mark the diagnostics as incomplete rather than silently omitting the gap.
  - [x] Preserve visibility into the upstream failure source.

- [x] Add automated tests for complete and incomplete stage diagnostics. (AC: 1, 2, 3, 4, 5)
  - [x] Diagnostics-read test: authorized operators can retrieve diagnostics for failed/blocked stages.
  - [x] Outcome-identification test: returned diagnostics identify the terminal outcome type correctly.
  - [x] Incomplete-diagnostics test: upstream failure produces visible incomplete diagnostics.
  - [x] Guardrail test: this story does not replace completed-history retrieval from Story `5.4`.

## Dev Notes

- Story `5.5` is the deep troubleshooting slice for operators. It should build on, not replace, the completed history and summary layers from Stories `5.2` and `5.4`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-2-produce-structured-failure-summaries.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-4-expose-run-history-and-completed-summaries.md]
- This story is operator-focused and stage-specific. Keep it distinct from general history retrieval and from the operator interface controls in Story `3.6`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-6-provide-a-direct-operator-interface-for-controlled-execution.md]
- Upstream integration gaps must remain visible. Do not hide missing diagnostics behind empty responses.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `5.5` scoped to:
  - stage-diagnostics reader
  - operator-authorized diagnostics service
  - incomplete-diagnostics handling
  - evidence-reference assembly
  - tests
- Do not expand the slice into general history browsing or admin-control surfaces.

### Technical Requirements

- Story `5.5` must require a recorded failed or blocked stage. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]
- Diagnostics must return related evidence references and identify the terminal outcome category.
- Incomplete diagnostics due to upstream integration failures must be identified explicitly.
- Visibility into the upstream failure source must be preserved.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no diagnostics-query patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible stage-diagnostics surface needed for Story `5.5`.

### Library / Framework Requirements

- No approved runtime, query layer, auth framework, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `5.5` silently choose the platform architecture. Keep the diagnostics slice minimal and reversible.

### File Structure Requirements

- Keep Story `5.5` code adjacent to run-stage history and evidence readers and clearly separate it from general history retrieval.
- Use explicit terminology around `stage diagnostics`, `failed stage`, `blocked stage`, `incomplete diagnostics`, and `upstream failure source`.
- Persist only the minimum diagnostics metadata and incomplete-diagnostics markers needed by this story.

### Testing Requirements

- Add automated tests for authorized diagnostics retrieval, outcome identification, and incomplete diagnostics.
- Tests must prove upstream integration gaps remain visible.
- Tests must prove this story remains distinct from completed-history retrieval and operator controls.
- Tests must prove stage diagnostics require a failed or blocked stage.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-6-provide-a-direct-operator-interface-for-controlled-execution.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-2-produce-structured-failure-summaries.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-4-expose-run-history-and-completed-summaries.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `5.2`, `5.4`, and `3.6`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `5.5` was constrained to stage-specific diagnostics only.
- Incomplete-diagnostics visibility was made explicit.
- General history retrieval and operator-control concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-5-inspect-failure-stage-diagnostics.md
