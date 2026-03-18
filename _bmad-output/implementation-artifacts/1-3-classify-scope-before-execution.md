# Story 1.3: Classify Scope Before Execution

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to classify a request as in-scope, out-of-scope, or insufficiently specified,
so that unsupported or unsafe work does not enter autonomous execution.

## Acceptance Criteria

1. Scope classification runs only after a task has passed the Story `1.2` minimum run-readiness validation.
2. Classification evaluates the task against configured scope rules and assigns exactly one result: `in-scope`, `out-of-scope`, or `insufficiently specified`.
3. The system stores the classification result and rationale with the task record.
4. If a task is classified as `out-of-scope` or `insufficiently specified`, the system prevents run creation.
5. A blocked classification returns the result and rationale to the engineer or operator reviewing the task.

## Tasks / Subtasks

- [x] Define the first explicit scope-classification rule set. (AC: 1, 2, 3)
  - [x] Reuse the Story `1.1` task-request contract and the Story `1.2` readiness result as the only required inputs.
  - [x] Express the initial scope rules in a deterministic form that can produce exactly one of the three allowed outcomes.
  - [x] Keep the rules limited to scope determination; do not mix in entry-point authorization, approval gates, or execution orchestration.

- [x] Implement pre-execution scope classification over ready task requests. (AC: 1, 2, 3, 4)
  - [x] Require a `ready` result from Story `1.2` before classification can proceed.
  - [x] Evaluate the task against the configured scope rules and persist a single classification outcome plus rationale.
  - [x] Prevent run creation or downstream execution preparation when the outcome is `out-of-scope` or `insufficiently specified`.

- [x] Implement reviewer-facing classification feedback. (AC: 3, 4, 5)
  - [x] Return the stored classification result and rationale in a structured form.
  - [x] Ensure the rationale explains why a task is unsupported or still lacks enough specification for safe autonomy.
  - [x] Preserve the rationale with the task record so later governance stories can build on it without recomputing scope ad hoc.

- [x] Add automated tests for all classification outcomes. (AC: 1, 2, 3, 4, 5)
  - [x] `in-scope` test: a ready task matching supported rules is classified as `in-scope`.
  - [x] `out-of-scope` test: a ready task outside supported rules is classified as `out-of-scope` with rationale.
  - [x] `insufficiently specified` test: a task lacking enough clarity for scope rules is classified as `insufficiently specified`.
  - [x] Gatekeeping test: classification does not run for not-ready tasks and does not create runs for blocked outcomes.

## Dev Notes

- Story `1.3` depends on the prior slices already established: Story `1.1` provides the task-request record and Story `1.2` provides the binary readiness result. Do not duplicate intake or readiness logic here. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- This story owns scope classification only. It must not decide whether a request came from an approved interface; that belongs to Story `1.4`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- This story must not evaluate approval-gated autonomy boundaries; that belongs to Story `1.5`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- A not-ready task from Story `1.2` should not be reinterpreted as an `in-scope` or `out-of-scope` decision. Preserve the separation between readiness failure and scope determination. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- This story still must not create a run, provision Docker, gather GitHub/Slack/Azure DevOps context, or invoke execution. Those behaviors belong to later workflow stages and later epics. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing naming, module, and layering conventions.
- If bootstrapping a new codebase, keep Story `1.3` adjacent to the previous intake slices:
  - task-request read access
  - readiness-result dependency
  - scope-rules module/service
  - persisted classification result and rationale
  - tests
- Do not expand the slice into entry-point verification, policy approval evaluation, context aggregation, or execution engines.
- If the target repository is still this planning-only workspace, stop before coding and produce architecture plus application scaffolding first.

### Technical Requirements

- Story `1.3` consumes the Story `1.1` task-request data and the Story `1.2` readiness result; classification must not invent a parallel task-state model. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- Classification output is constrained to exactly three values: `in-scope`, `out-of-scope`, or `insufficiently specified`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- The rationale for classification must be stored, not just returned transiently, so downstream stories and reviewers can inspect why the decision was made. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- `out-of-scope` and `insufficiently specified` outcomes must block run creation. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- Scope rules should be deterministic and reviewable. Avoid opaque heuristics in this story because no architecture or ML decisioning guidance has been approved.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no concrete service or storage patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible classification surface needed for Story `1.3`.

### Library / Framework Requirements

- No approved runtime, persistence layer, framework, or test library is defined in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not use Story `1.3` to choose long-term architecture. Keep the classification slice minimal and reversible.

### File Structure Requirements

- Keep Story `1.3` code close to the Story `1.1` and Story `1.2` intake pipeline so task-state transitions remain coherent.
- Use explicit terminology around `scope`, `classification`, `rationale`, and `pre-execution`.
- Persist only the minimum classification result and rationale needed by later stories; do not design full governance or audit models here.

### Testing Requirements

- Add automated tests for all three allowed classification outcomes.
- Tests must prove classification requires a ready task from Story `1.2`.
- Tests must prove blocked outcomes do not create runs.
- Tests must prove rationale is persisted and returned for reviewer inspection.
- If the target codebase already has classifier, service, or persistence test conventions, follow those patterns.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `1.1` and `1.2`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `1.3` was constrained to deterministic scope classification only.
- The file explicitly depends on the readiness output from Story `1.2`.
- Entry-point authorization, policy gates, and execution were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md
