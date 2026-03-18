# Story 5.1: Classify Run Failures by Type

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to classify unsuccessful runs by failure type,
so that users and operators can quickly understand what blocked autonomy.

## Acceptance Criteria

1. Failure classification runs only when a run stops without successful completion.
2. The system assigns a failure type from the supported failure taxonomy.
3. The failure classification is stored with the run outcome.
4. If the failure cannot be confidently mapped to a known type, the run is recorded as `unclassified-failure`.
5. Evidence needed for later review is preserved when classification is uncertain.

## Tasks / Subtasks

- [x] Define the failure-taxonomy contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse failure conditions already exposed by Epics 1-4 rather than inventing a second outcome model.
  - [x] Define the minimum supported failure taxonomy aligned to the PRD: task ambiguity, environment failure, unsupported workflow, validation failure, and implementation difficulty.
  - [x] Include explicit handling for `unclassified-failure`.

- [x] Implement run-failure classification. (AC: 1, 2, 3, 4)
  - [x] Trigger classification only for runs that did not complete successfully.
  - [x] Assign a single failure type when the failure maps confidently to the supported taxonomy.
  - [x] Persist the failure classification with the run outcome.

- [x] Implement uncertain-classification handling. (AC: 4, 5)
  - [x] Record uncertain failures as `unclassified-failure`.
  - [x] Preserve evidence references needed for later human review.
  - [x] Avoid overwriting or discarding earlier run-state and validation evidence.

- [x] Add automated tests for classified and unclassified failures. (AC: 1, 2, 3, 4, 5)
  - [x] Classified-failure test: a known failure mode maps to the expected taxonomy entry.
  - [x] Unclassified-failure test: uncertain failures are recorded as `unclassified-failure`.
  - [x] Persistence test: the failure classification is stored with the run outcome.
  - [x] Evidence-preservation test: uncertain classification retains evidence for later review.

## Dev Notes

- Story `5.1` consumes failure signals produced across Epics 1-4; it does not replace or reinterpret the earlier run-state models. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- The PRD explicitly names the failure-type categories this story should support. Keep the taxonomy aligned to those categories and add `unclassified-failure` only as the fallback. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Failure Handling & Recovery]
- Failure summaries belong to Story `5.2`; this story should stop at structured failure typing plus evidence retention. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.2: Produce Structured Failure Summaries]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `5.1` scoped to:
  - run-outcome/failure-signal reader
  - failure-taxonomy classification service
  - run-linked failure classification persistence
  - evidence-preservation linkage
  - tests
- Do not expand the slice into failure-summary formatting or diagnostics display.

### Technical Requirements

- Story `5.1` must classify only unsuccessful runs. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.1: Classify Run Failures by Type]
- The supported failure taxonomy should align to the PRD categories.
- Uncertain failures must be recorded as `unclassified-failure`.
- Evidence needed for later review must remain preserved and linked.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no failure-classification patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible failure-classification surface needed for Story `5.1`.

### Library / Framework Requirements

- No approved runtime, rules engine, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `5.1` silently choose the platform architecture. Keep the classification slice minimal and reversible.

### File Structure Requirements

- Keep Story `5.1` code adjacent to run-outcome readers and clearly separate it from summary-generation and diagnostics surfaces.
- Use explicit terminology around `failure type`, `taxonomy`, `unclassified-failure`, and `preserved evidence`.
- Persist only the minimum failure classification and evidence linkage needed by later stories.

### Testing Requirements

- Add automated tests for known taxonomy mapping, unclassified failures, persistence, and evidence retention.
- Tests must prove successful runs are not classified as failures.
- Tests must prove uncertain cases do not drop evidence.
- Tests must prove this story does not generate failure summaries yet.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.1: Classify Run Failures by Type]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.2: Produce Structured Failure Summaries]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Failure Handling & Recovery]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epics 1-4 story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `5.1` was constrained to failure-type classification only.
- The PRD failure taxonomy was preserved as the primary contract.
- Failure summaries and diagnostics were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-1-classify-run-failures-by-type.md
