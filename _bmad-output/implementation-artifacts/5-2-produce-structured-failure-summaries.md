# Story 5.2: Produce Structured Failure Summaries

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineer,
I want a structured summary when a run does not complete successfully,
so that I can decide whether to refine the task, retry, or take over manually.

## Acceptance Criteria

1. Run summarization executes only when a run ends in `partial`, `failed`, `blocked`, or `boundary-stopped` state.
2. The system produces a structured failure summary including failure type, failed stage, and blocking reasons.
3. The failure summary is linked to the run record.
4. Returned summaries contain enough detail to distinguish unsupported work, missing context, environment failure, validation failure, and implementation difficulty.
5. Returned summaries avoid exposing protected secrets or unrestricted agent context.

## Tasks / Subtasks

- [x] Define the structured failure-summary model. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the failure classification from Story `5.1` plus run-state and gate/evidence outputs from earlier epics.
  - [x] Define the minimum summary shape for failure type, failed stage, blocking reasons, and run linkage.
  - [x] Include explicit redaction rules for protected secrets and unrestricted agent context.

- [x] Implement failure-summary generation for unsuccessful runs. (AC: 1, 2, 3)
  - [x] Trigger summary generation only for non-successful terminal outcomes.
  - [x] Produce the structured summary with failure type, failed stage, and blocking reasons.
  - [x] Link the generated summary to the run record.

- [x] Implement safe review-output handling. (AC: 4, 5)
  - [x] Ensure the summary distinguishes the major failure categories expected by users and operators.
  - [x] Redact protected secrets and unrestricted agent context before returning the summary.
  - [x] Preserve enough actionable detail for retry, refinement, or takeover decisions.

- [x] Add automated tests for summary generation and redaction. (AC: 1, 2, 3, 4, 5)
  - [x] Failure-summary test: an unsuccessful run produces a linked structured summary.
  - [x] Distinction test: different failure categories produce distinguishable summaries.
  - [x] Redaction test: protected secrets and unrestricted agent context are excluded from summary output.
  - [x] Entry-condition test: successful runs do not generate failure summaries.

## Dev Notes

- Story `5.2` depends on Story `5.1` failure classification and on existing run-state/failure signals from Epics 1-4. Do not duplicate failure typing logic here. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-1-classify-run-failures-by-type.md]
- The main purpose is operational clarity for retry, refinement, or human takeover. Keep the summary structured and decision-oriented. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md]
- Detailed stage diagnostics belong to Story `5.5`; this story should stop at a structured summary layer. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `5.2` scoped to:
  - failure-summary assembly service/module
  - run-linked summary persistence
  - redaction layer
  - review-output formatter
  - tests
- Do not expand the slice into full diagnostics inspection or audit-ledger modeling.

### Technical Requirements

- Story `5.2` must generate summaries only for unsuccessful terminal outcomes. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.2: Produce Structured Failure Summaries]
- Summaries must include failure type, failed stage, and blocking reasons.
- Summaries must be linked to the run record.
- Summaries must distinguish key failure categories while avoiding secret/context leakage.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no summary-generation patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible failure-summary surface needed for Story `5.2`.

### Library / Framework Requirements

- No approved runtime, templating/formatting library, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `5.2` silently choose the platform architecture. Keep the summary slice minimal and reversible.

### File Structure Requirements

- Keep Story `5.2` code adjacent to failure classification and run-state readers.
- Use explicit terminology around `failure summary`, `failed stage`, `blocking reasons`, `redaction`, and `run linkage`.
- Persist only the minimum summary data needed by later history/review surfaces.

### Testing Requirements

- Add automated tests for summary generation, category distinction, run linkage, and redaction.
- Tests must prove successful runs do not emit failure summaries.
- Tests must prove the output remains actionable without exposing protected data.
- Tests must prove this story does not provide deep stage-diagnostics inspection.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.2: Produce Structured Failure Summaries]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-1-classify-run-failures-by-type.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Failure Handling & Recovery]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `5.1` and earlier epic outputs.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `5.2` was constrained to structured failure-summary generation only.
- Redaction requirements were made explicit.
- Deep diagnostics were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-2-produce-structured-failure-summaries.md
