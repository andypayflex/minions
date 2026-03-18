# Story 6.3: Expose Structured Run Data for Reporting and Orchestration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want structured run data to be available for reporting and future orchestration,
so that the platform can expand operationally without reworking the run model.

## Acceptance Criteria

1. When an approved internal consumer requests structured run data, the system returns a structured representation of run inputs, states, outputs, and outcomes.
2. Returned structured data remains linked to the canonical run record.
3. Unauthorized structured-run-data requests are denied.
4. Denials follow the platform’s audit policy.
5. Structured run data exposure remains compatible with the existing run model rather than redefining it.

## Tasks / Subtasks

- [x] Define the structured-run-data exposure contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the canonical run model and auditable run-ledger outputs created across Epics 1-5.
  - [x] Define the minimum structured representation of run inputs, states, outputs, and outcomes.
  - [x] Keep the contract focused on data exposure for approved consumers, not on implementing reporting dashboards or orchestration engines.

- [x] Implement approved structured-run-data retrieval. (AC: 1, 2)
  - [x] Allow approved internal consumers to request structured run data.
  - [x] Return a structured representation linked to the canonical run record.
  - [x] Preserve compatibility with the current run model and lifecycle data.

- [x] Implement unauthorized-request denial handling. (AC: 3, 4)
  - [x] Deny unapproved structured-data requests.
  - [x] Handle denials according to audit policy.
  - [x] Keep denial handling aligned to existing authorization/audit patterns from prior stories.

- [x] Add automated tests for approved and denied structured-data access. (AC: 1, 2, 3, 4, 5)
  - [x] Approved-consumer test: structured run data is returned with canonical-run linkage.
  - [x] Compatibility test: returned data remains consistent with the existing run model.
  - [x] Unauthorized-consumer test: access is denied according to audit policy.
  - [x] Guardrail test: this story does not implement reporting dashboards or orchestration workflows.

## Dev Notes

- Story `6.3` should expose the run data already modeled across Epics 1-5, especially the auditable run ledger from Story `5.6`. Do not create a second canonical run representation. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-6-record-an-auditable-run-ledger.md]
- The PRD explicitly calls for structured run data suitable for monitoring, reporting, and future orchestration use. This story provides the reusable data contract, not the consumer applications themselves. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Auditability & Observability]
- Keep this story separate from analytics, dashboards, or workflow engines.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `6.3` scoped to:
  - structured-run-data contract/model
  - approved-consumer data-access service/module
  - canonical-run linkage
  - denial/audit handling
  - tests
- Do not expand the slice into reporting UIs or orchestration controllers.

### Technical Requirements

- Story `6.3` must return structured run inputs, states, outputs, and outcomes for approved internal consumers. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.3: Expose Structured Run Data for Reporting and Orchestration]
- Returned data must remain linked to the canonical run record.
- Unauthorized requests must be denied according to audit policy.
- Structured-data exposure must remain compatible with the existing run model.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no data-exposure API patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible structured-data exposure surface needed for Story `6.3`.

### Library / Framework Requirements

- No approved runtime, serialization/query layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `6.3` silently choose the platform architecture. Keep the exposure slice minimal and reversible.

### File Structure Requirements

- Keep Story `6.3` code adjacent to the canonical run model and audit-ledger readers.
- Use explicit terminology around `structured run data`, `approved internal consumer`, `canonical run record`, and `audit-policy denial`.
- Persist only the minimum access metadata needed by this exposure surface.

### Testing Requirements

- Add automated tests for approved access, denied access, canonical linkage, and model compatibility.
- Tests must prove this story reuses the existing run model instead of redefining it.
- Tests must prove dashboards/orchestration logic are not implemented here.
- Tests must prove unauthorized access is denied according to policy.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.3: Expose Structured Run Data for Reporting and Orchestration]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Auditability & Observability]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/5-6-record-an-auditable-run-ledger.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `5.6` and earlier run-model artifacts.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `6.3` was constrained to structured-run-data exposure only.
- Canonical-run linkage was made explicit.
- Dashboards and orchestration consumers were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/6-3-expose-structured-run-data-for-reporting-and-orchestration.md
