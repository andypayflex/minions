# Story 4.3: Capture Structured Validation Evidence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to capture structured validation evidence from test and verification steps,
so that pull request outputs and troubleshooting views can reference concrete results.

## Acceptance Criteria

1. When validation or verification steps produce outputs, evidence capture stores structured evidence for each step.
2. Stored evidence includes result status and associated run stage.
3. Evidence remains linked to the run record.
4. If a validation step produces incomplete or malformed output, the evidence is recorded as incomplete.
5. Raw result association is preserved without corrupting the run record.

## Tasks / Subtasks

- [x] Define the structured validation-evidence model. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse validation-step outputs from Story `4.1` as the primary evidence source.
  - [x] Define the minimum structured evidence shape including step identity, result status, and associated run stage.
  - [x] Include an explicit incomplete-evidence representation for malformed or partial validation output.

- [x] Implement evidence capture and run linkage. (AC: 1, 2, 3)
  - [x] Capture structured evidence for each validation or verification step output.
  - [x] Link captured evidence to the associated run record.
  - [x] Preserve run-stage association for each evidence item.

- [x] Implement incomplete/malformed evidence handling. (AC: 4, 5)
  - [x] Detect incomplete or malformed validation output.
  - [x] Record the evidence as incomplete rather than silently dropping it.
  - [x] Preserve the raw result association without corrupting the run record.

- [x] Add automated tests for complete and incomplete evidence capture. (AC: 1, 2, 3, 4, 5)
  - [x] Complete-evidence test: structured evidence is stored for each validation step with run-stage linkage.
  - [x] Incomplete-evidence test: malformed output is stored as incomplete and raw-result-linked.
  - [x] Run-linkage test: evidence remains attached to the run record.
  - [x] Guardrail test: evidence capture does not itself determine overall completion status.

## Dev Notes

- Story `4.3` is the evidence-modeling layer for Epic 4. It should consume validation outputs from Story `4.1` and feed completion evaluation, PR summary, and troubleshooting stories later. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-1-run-repository-relevant-validation.md]
- Do not collapse evidence capture into run-outcome evaluation. Story `4.2` uses evidence; it does not define the evidence model itself. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md]
- Preserve malformed or partial outputs as incomplete evidence instead of discarding them. That is critical for later review and troubleshooting.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `4.3` scoped to:
  - validation-output reader
  - structured-evidence model/service
  - run-linked evidence persistence
  - incomplete-evidence handling
  - tests
- Do not expand the slice into completion evaluation or PR publication.

### Technical Requirements

- Story `4.3` must capture structured evidence for each validation or verification step output. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.3: Capture Structured Validation Evidence]
- Evidence must include result status and associated run stage.
- Evidence must remain linked to the run record.
- Incomplete or malformed outputs must be stored as incomplete evidence, with raw-result association preserved.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no evidence-storage patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible validation-evidence surface needed for Story `4.3`.

### Library / Framework Requirements

- No approved runtime, persistence layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `4.3` silently choose the platform architecture. Keep the evidence-capture slice minimal and reversible.

### File Structure Requirements

- Keep Story `4.3` code adjacent to validation outputs and separate from completion evaluation and PR delivery.
- Use explicit terminology around `validation evidence`, `result status`, `run stage`, `incomplete evidence`, and `raw result association`.
- Persist only the minimum evidence data needed by later outcome and PR stories.

### Testing Requirements

- Add automated tests for complete evidence, incomplete evidence, and run linkage.
- Tests must prove malformed output is preserved safely rather than dropped.
- Tests must prove evidence capture remains separate from completion-state evaluation.
- Tests must prove this story does not create delivery artifacts.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 4.3: Capture Structured Validation Evidence]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-1-run-repository-relevant-validation.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-2-determine-completion-status-from-validation-evidence.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `4.1` and `4.2`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `4.3` was constrained to structured evidence capture only.
- Incomplete-evidence preservation was made explicit.
- Completion-state and PR-delivery concerns were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/4-3-capture-structured-validation-evidence.md
