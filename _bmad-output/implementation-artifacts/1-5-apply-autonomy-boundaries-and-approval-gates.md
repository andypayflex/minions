# Story 1.5: Apply Autonomy Boundaries and Approval Gates

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want the system to distinguish autonomous actions from approval-required actions before execution starts,
so that Minions remains inside defined governance limits.

## Acceptance Criteria

1. Policy evaluation runs only after a task has been classified as `in-scope`.
2. Policy evaluation determines exactly one outcome for the task: `fully-autonomous`, `requires-approval`, or `blocked`.
3. The evaluated policy outcome is stored with the task.
4. If a task would require an approval-gated action outside the allowed autonomy boundary, the system prevents autonomous execution from starting.
5. Blocked or approval-gated outcomes return the boundary rationale that caused the decision.

## Tasks / Subtasks

- [x] Define the first autonomy-boundary policy model and evaluation rules. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the outputs from Story `1.3` scope classification and Story `1.4` origin verification as prerequisites to policy evaluation.
  - [x] Express autonomy-boundary decisions in a deterministic rule set that can yield exactly `fully-autonomous`, `requires-approval`, or `blocked`.
  - [x] Keep the rule set limited to governance/policy evaluation; do not re-implement readiness, scope classification, or source verification.

- [x] Implement pre-execution policy evaluation for eligible tasks. (AC: 1, 2, 3, 4)
  - [x] Require an `in-scope` classification before policy evaluation can proceed.
  - [x] Evaluate the task against the configured autonomy-boundary rules and persist a single policy outcome plus rationale.
  - [x] Prevent autonomous execution start when the outcome is `requires-approval` or `blocked` unless a future story explicitly handles approval continuation.

- [x] Implement reviewer-facing boundary rationale reporting. (AC: 3, 4, 5)
  - [x] Return the stored policy outcome and the specific boundary rationale in structured form.
  - [x] Make it clear whether the task is blocked outright or only requires human approval.
  - [x] Preserve the boundary rationale with the task record so downstream execution and audit flows can consume it without recomputing policy logic.

- [x] Add automated tests for all policy outcomes. (AC: 1, 2, 3, 4, 5)
  - [x] `fully-autonomous` test: an in-scope task within allowed limits is marked autonomous.
  - [x] `requires-approval` test: an in-scope task that crosses an approval-gated boundary is marked approval-required with rationale.
  - [x] `blocked` test: a task outside allowed autonomy boundaries is blocked with rationale.
  - [x] Guardrail test: policy evaluation does not run for tasks that are not in-scope and does not start execution for non-autonomous outcomes.

## Dev Notes

- Story `1.5` is the final Epic 1 governance slice. It must build on the prior pre-run pipeline rather than restating it: Story `1.1` intake, Story `1.2` readiness, Story `1.3` scope classification, and Story `1.4` approved-origin verification. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md] [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-4-enforce-approved-initiation-paths.md]
- This story owns autonomy-boundary policy evaluation only. It does not classify scope or verify request origin. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- The outcome space is governance-oriented: `fully-autonomous`, `requires-approval`, or `blocked`. Keep it distinct from the readiness outcomes in Story `1.2` and the scope outcomes in Story `1.3`.
- This story determines whether execution may proceed autonomously, but it must not itself provision Docker, gather context, or start execution. Those behaviors belong to later epics. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- Boundary rationale must be explicit and stored. A future operator or reviewer should be able to see which autonomy limit forced approval or blocking. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing module and naming conventions.
- If bootstrapping a new codebase, keep Story `1.5` adjacent to the existing Epic 1 intake/governance slices:
  - task-state read access
  - policy-evaluation service/module
  - autonomy-boundary rules/configuration
  - persisted policy outcome and rationale
  - tests
- Do not expand the slice into actual human-approval workflows, context gathering, or execution orchestration.
- If the target repository is still this planning-only workspace, stop before coding and produce architecture plus application scaffolding first.

### Technical Requirements

- Policy evaluation must require an `in-scope` task from Story `1.3`; do not run it for tasks already blocked earlier in the pre-run pipeline. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md]
- Policy outcomes are constrained to exactly `fully-autonomous`, `requires-approval`, or `blocked`. Do not mix these with prior readiness or scope values. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- The evaluated policy outcome and rationale must be persisted with the task. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- `requires-approval` and `blocked` outcomes must prevent autonomous execution start in this story.
- Keep autonomy-boundary rules deterministic and reviewable. No opaque heuristics or hidden exceptions should determine whether the system can proceed autonomously.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no concrete policy-engine or storage patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible policy-evaluation surface needed for Story `1.5`.

### Library / Framework Requirements

- No approved runtime, framework, persistence layer, or test library is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `1.5` silently choose the platform architecture. Keep the policy-evaluation slice minimal and reversible.

### File Structure Requirements

- Keep Story `1.5` code adjacent to the earlier Epic 1 gating pipeline so the pre-run decision chain remains coherent.
- Use explicit terminology around `autonomy boundary`, `policy outcome`, `requires approval`, `blocked`, and `boundary rationale`.
- Persist only the minimum policy outcome and rationale needed by later execution and audit flows.

### Testing Requirements

- Add automated tests for all three policy outcomes.
- Tests must prove policy evaluation requires an in-scope task and consumes the earlier pre-run state rather than duplicating it.
- Tests must prove non-autonomous outcomes prevent execution start.
- Tests must prove boundary rationale is persisted and reviewable.
- Tests must prove this story does not perform execution, context gathering, or source verification.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.5: Apply Autonomy Boundaries and Approval Gates]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.3: Classify Scope Before Execution]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 1.4: Enforce Approved Initiation Paths]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-1-submit-a-scoped-engineering-task.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-2-validate-minimum-run-readiness.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-3-classify-scope-before-execution.md]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-4-enforce-approved-initiation-paths.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Stories `1.3` and `1.4`.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `1.5` was constrained to autonomy-boundary policy evaluation only.
- The file explicitly consumes the prior Epic 1 gating outputs instead of re-implementing them.
- Approval-required and blocked outcomes were both defined as execution-stopping states for this story.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/1-5-apply-autonomy-boundaries-and-approval-gates.md
