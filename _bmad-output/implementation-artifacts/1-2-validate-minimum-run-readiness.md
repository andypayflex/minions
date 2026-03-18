# Story 1.2: Validate Minimum Run Readiness

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to validate whether a task contains the minimum information required to start,
so that autonomous runs only begin on sufficiently specified work.

## Acceptance Criteria

1. Pre-run validation can execute against a newly submitted task request created by Story `1.1`.
2. Validation checks the required submission fields and explicit execution prerequisites needed to start later pre-run workflow stages.
3. Validation records exactly one result for the task: `ready` or `not-ready`.
4. When the task fails minimum-information validation, the system marks it as insufficiently specified.
5. A failed validation returns structured missing-information reasons to the engineer or operator reviewing the task.

## Tasks / Subtasks

- [x] Define the minimum run-readiness rule set for the Story `1.1` task-request contract. (AC: 1, 2, 3)
  - [x] Reuse the Story `1.1` canonical fields and persisted metadata as the basis for readiness evaluation.
  - [x] Identify the minimum deterministic prerequisites required before later stories can classify scope or start execution.
  - [x] Keep the rule set explicit and narrow; do not include scope classification, policy-gate logic, or external context gathering.

- [x] Implement a pre-run validation step over persisted task requests. (AC: 1, 2, 3, 4)
  - [x] Load a task request by identifier and evaluate it against the minimum run-readiness rule set.
  - [x] Persist a validation result of `ready` or `not-ready` plus the evaluated timestamp or equivalent validation metadata.
  - [x] Mark failed requests as `insufficiently specified` or equivalent not-ready state without creating a run.

- [x] Implement structured missing-information feedback. (AC: 4, 5)
  - [x] Return machine-readable missing-information reasons tied to the specific failed fields or prerequisites.
  - [x] Ensure the reviewer can distinguish a missing-field failure from a missing-execution-prerequisite failure.
  - [x] Preserve the reasons with the task record so Story `1.3` can consume readiness outcomes without recomputing ad hoc logic.

- [x] Add automated tests for ready and not-ready outcomes. (AC: 1, 2, 3, 4, 5)
  - [x] Ready-path test: a Story `1.1`-compatible task request produces `ready`.
  - [x] Missing-field test: an incomplete task request produces `not-ready` plus field-specific reasons.
  - [x] Missing-prerequisite test: a request with submission data but absent required pre-run metadata produces `not-ready`.
  - [x] Safety test: validation does not create a run, classify scope, or invoke external integrations.

## Dev Notes

- Story `1.2` must build directly on the Story `1.1` task-request contract and persisted pre-run record. Do not redefine the intake payload independently. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- This story owns minimum-information validation only. It does not decide whether a task is in-scope or out-of-scope; that belongs to Story `1.3`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.2: Validate Minimum Run Readiness] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- This story must not start autonomous execution, provision Docker, or gather GitHub/Slack/Azure DevOps context. Those behaviors belong to later epics and later workflow stages. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- The output of this story is a deterministic readiness result and structured reasons, not a policy decision. Approval gates remain Story `1.5`. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- Preserve compatibility with the narrow Story `1.1` model. If Story `1.1` created only a task-request record and source metadata, Story `1.2` must extend that slice rather than inventing a broader platform object model. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]

### Project Structure Notes

- The current workspace still contains planning artifacts only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing naming and layering conventions.
- If bootstrapping a new codebase, keep Story `1.2` limited to a vertical slice adjacent to Story `1.1`:
  - task-request read model or repository access
  - readiness-validation service/module
  - persisted readiness result or status update
  - reviewer-facing validation feedback structure
  - tests
- Do not broaden the slice into classification engines, execution orchestration, or integration clients.
- If the target repository is still this planning-only workspace, stop before coding and produce architecture plus application scaffolding first.

### Technical Requirements

- Story `1.2` consumes the Story `1.1` fields `title`, `objective`, `repository`, `constraints`, and `expectedOutcome`, plus system metadata such as requester identity and entry point recorded during intake. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- Minimum run readiness must be deterministic and reproducible from the stored task request. Avoid hidden operator judgment or dynamic heuristics in this story.
- Validation output must be binary at this stage: `ready` or `not-ready`. Do not add `in-scope`, `out-of-scope`, or approval-gated outcomes here. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.2: Validate Minimum Run Readiness]
- Failed validation must mark the task as insufficiently specified and return structured reasons. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.2: Validate Minimum Run Readiness]
- Validation must be side-effect free with respect to execution: no run creation, no code execution, no external integration calls.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no codebase-specific patterns could be extracted.
- In the absence of architecture, implement only the minimum validation surface needed for Story `1.2` and leave broader workflow design decisions reversible.

### Library / Framework Requirements

- No approved runtime, persistence layer, framework, or test library is defined in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists, do not let Story `1.2` silently choose long-term architecture. Keep implementation minimal and local to the readiness-validation slice.

### File Structure Requirements

- Keep Story `1.2` code adjacent to the Story `1.1` intake slice so the task-request contract stays cohesive.
- Use explicit terminology around `readiness`, `pre-run`, `validation result`, and `insufficiently specified`.
- Persist only the minimum readiness outcome and reasons needed by downstream stories; do not design full run-state or audit-event schemas here.

### Testing Requirements

- Add automated tests for both `ready` and `not-ready` outcomes.
- Tests must prove reuse of the Story `1.1` contract rather than a second intake schema.
- Tests must prove structured missing-information reasons are preserved and reviewable.
- Tests must prove this story does not classify scope, start runs, or call external systems.
- If the target codebase already has validator, service, or persistence test conventions, follow those patterns.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.2: Validate Minimum Run Readiness]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Story `1.1`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `1.2` was constrained to deterministic readiness validation only.
- The file explicitly reuses the Story `1.1` task-request contract to prevent schema drift.
- Scope classification, policy gating, and execution were kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md
