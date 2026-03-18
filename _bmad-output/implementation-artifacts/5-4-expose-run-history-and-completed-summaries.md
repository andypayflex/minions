# Story 5.4: Expose Run History and Completed Summaries

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineer or stakeholder,
I want to retrieve completed run summaries and auditable run history,
so that I can inspect what happened after execution finishes.

## Acceptance Criteria

1. When a completed run exists, an authorized user can request the run summary or history.
2. The system returns final outcome, key stage history, and associated summary artifacts.
3. Returned history includes links to relevant evidence and delivery records.
4. Unauthorized requests for completed run history are denied.
5. Denials are handled according to audit policy.

## Tasks / Subtasks

- [x] Define the completed-history retrieval contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse preserved run state, failure summaries, evidence, and delivery artifacts from earlier stories.
  - [x] Define the minimum completed-history response shape for final outcome, key stage history, summaries, and linked records.
  - [x] Include authorization and denial-handling requirements in the contract.

- [x] Implement authorized completed-history retrieval. (AC: 1, 2, 3)
  - [x] Require the run to be completed before returning history and summary data.
  - [x] Return final outcome, key stage history, and associated summary artifacts.
  - [x] Include links to relevant evidence and delivery records in the response.

- [x] Implement unauthorized-request denial handling. (AC: 4, 5)
  - [x] Deny unauthorized completed-history requests.
  - [x] Handle denials according to audit policy or equivalent authorization/audit handling.
  - [x] Keep denial handling separate from operator-only diagnostics access in Story `5.5`.

- [x] Add automated tests for authorized and unauthorized completed-history access. (AC: 1, 2, 3, 4, 5)
  - [x] Authorized-history test: completed runs return final outcome, key stage history, and summary artifacts.
  - [x] Linkage test: returned history includes relevant evidence and delivery links.
  - [x] Unauthorized-history test: access is denied and handled according to policy.
  - [x] Entry-condition test: incomplete runs are not treated as completed-history reads.

## Dev Notes

- Story `5.4` is the completed-run retrieval layer, built on top of the summary and preservation work from Stories `5.2` and `5.3`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-2-produce-structured-failure-summaries.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-3-preserve-intermediate-state-and-evidence.md]
- Keep this story focused on completed run history retrieval, not deep stage diagnostics. Those belong to Story `5.5`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]
- Returned history should be reviewable and linked, not a raw dump of every internal event.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `5.4` scoped to:
  - completed-run history reader
  - summary/history response service
  - evidence/delivery link assembly
  - authorization and denial handling
  - tests
- Do not expand the slice into deep diagnostics tooling or full audit-ledger browsing.

### Technical Requirements

- Story `5.4` must return final outcome, key stage history, and summary artifacts for completed runs. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.4: Expose Run History and Completed Summaries]
- Returned history must include links to relevant evidence and delivery records.
- Unauthorized requests must be denied and handled according to audit policy.
- Keep completed-history reads distinct from in-progress status reads from Story `3.5`.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no history-query or authorization patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible completed-history retrieval surface needed for Story `5.4`.

### Library / Framework Requirements

- No approved runtime, query layer, auth framework, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `5.4` silently choose the platform architecture. Keep the retrieval slice minimal and reversible.

### File Structure Requirements

- Keep Story `5.4` code adjacent to summary/history readers and separate from in-progress status and deep diagnostics surfaces.
- Use explicit terminology around `completed run`, `history`, `summary artifacts`, `evidence links`, and `delivery records`.
- Persist only the minimum denial/audit metadata needed here.

### Testing Requirements

- Add automated tests for authorized history retrieval, link inclusion, unauthorized denial, and completed-run gating.
- Tests must prove completed-history output is linked and reviewable.
- Tests must prove incomplete runs are not misclassified as completed-history reads.
- Tests must prove this story does not expose deep operator diagnostics.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.4: Expose Run History and Completed Summaries]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 5.5: Inspect Failure-Stage Diagnostics]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-2-produce-structured-failure-summaries.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-3-preserve-intermediate-state-and-evidence.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `5.2` and `5.3`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `5.4` was constrained to completed-run history retrieval only.
- Evidence and delivery linkage were made explicit.
- Deep diagnostics were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-4-expose-run-history-and-completed-summaries.md
