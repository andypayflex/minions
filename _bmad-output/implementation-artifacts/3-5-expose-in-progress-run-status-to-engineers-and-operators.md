# Story 3.5: Expose In-Progress Run Status to Engineers and Operators

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineer or operator,
I want to view current run status while execution is in progress,
so that I can monitor autonomous work without interrupting it.

## Acceptance Criteria

1. For a run in a non-terminal state, an authorized user can request run status.
2. The system returns the current run stage, latest transition time, and current outcome state.
3. Run-status responses do not expose protected secrets or unrestricted agent context.
4. Unauthorized status requests are denied.
5. Denied requests are recorded according to operational audit policy.

## Tasks / Subtasks

- [x] Define the in-progress run-status read contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the persisted run progress state from Story `3.3` as the authoritative status source.
  - [x] Define the minimum authorized status response shape.
  - [x] Keep the contract limited to read-only status access, not operator control actions.

- [x] Implement authorized run-status retrieval. (AC: 1, 2, 3)
  - [x] Require the run to be in a non-terminal state before returning in-progress status.
  - [x] Return the current run stage, latest transition time, and current outcome state from persisted run state.
  - [x] Exclude secrets and unrestricted agent context from the returned status payload.

- [x] Implement unauthorized-request denial and audit handling. (AC: 4, 5)
  - [x] Deny unauthorized run-status requests.
  - [x] Record denied requests according to audit policy or equivalent run/audit tracking.
  - [x] Keep denied-request recording separate from interactive operator controls in Story `3.6`.

- [x] Add automated tests for authorized and unauthorized status access. (AC: 1, 2, 3, 4, 5)
  - [x] Authorized-read test: a non-terminal run returns the correct current status fields.
  - [x] Redaction test: protected secrets and unrestricted agent context are not exposed.
  - [x] Unauthorized-read test: access is denied and recorded.
  - [x] Terminal-run test: in-progress status semantics do not apply to terminal runs.

## Dev Notes

- Story `3.5` is read-only visibility over the run-progress state created in Story `3.3`. Do not add operator control actions here; that belongs to Story `3.6`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.6: Provide a Direct Operator Interface for Controlled Execution]
- Access control applies here, but the story is about viewing status, not broader administration.
- The product requirements explicitly prohibit exposing protected secrets or unrestricted agent context in status outputs. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.5: Expose In-Progress Run Status to Engineers and Operators]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `3.5` scoped to:
  - run-progress-state reader
  - status-response service/module
  - authorization check for status access
  - denied-request audit hook
  - tests
- Do not expand the slice into operator control actions or debugging tools.

### Technical Requirements

- Story `3.5` must read from the persisted run-progress state established in Story `3.3`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md]
- Authorized responses must include current run stage, latest transition time, and current outcome state. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.5: Expose In-Progress Run Status to Engineers and Operators]
- Status output must exclude protected secrets and unrestricted agent context.
- Unauthorized requests must be denied and recorded.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no status-API or authorization patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible status-read surface needed for Story `3.5`.

### Library / Framework Requirements

- No approved runtime, auth framework, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `3.5` silently choose the platform architecture. Keep the status-read slice minimal and reversible.

### File Structure Requirements

- Keep Story `3.5` code adjacent to persisted run-state readers and separate from operator control surfaces.
- Use explicit terminology around `run status`, `authorized user`, `non-terminal state`, `denied request`, and `redacted context`.
- Persist only the minimum denied-request tracking needed by audit policy.

### Testing Requirements

- Add automated tests for authorized status access, unauthorized denial, and secret/context redaction.
- Tests must prove the response is driven by persisted run-progress state.
- Tests must prove terminal runs are handled distinctly from in-progress status requests.
- Tests must prove this story does not expose operator control actions.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.5: Expose In-Progress Run Status to Engineers and Operators]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-3-persist-run-progress-state.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `3.3`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `3.5` was constrained to read-only in-progress run-status access.
- Secret/context redaction and denied-request recording were preserved as explicit guardrails.
- Operator control actions were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-5-expose-in-progress-run-status-to-engineers-and-operators.md
