# Story 3.1: Start an Isolated Run Environment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Minions,
I want to start a task inside an isolated run environment,
so that autonomous execution stays inside approved technical boundaries.

## Acceptance Criteria

1. Run initialization begins only for a task whose preparation outcome is `ready`.
2. The system provisions an isolated run environment for the task.
3. The system records the environment identifier and initialization status in run state.
4. If the isolated environment cannot be provisioned successfully, the run is marked failed at environment startup.
5. Environment-startup failure prevents autonomous task execution from proceeding.

## Tasks / Subtasks

- [x] Define the isolated-run initialization contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the final Epic 2 preparation outcome as the only eligibility gate for environment startup.
  - [x] Define the minimum run-state fields needed at startup, including environment identifier and initialization status.
  - [x] Keep the contract limited to environment startup and failure capture; do not include repository execution logic yet.

- [x] Implement isolated-environment provisioning for ready tasks. (AC: 1, 2, 3)
  - [x] Require a `ready` preparation outcome from Story `2.5` before run initialization can start.
  - [x] Provision the isolated run environment for the task.
  - [x] Persist the environment identifier and initialization status in run state.

- [x] Implement startup-failure handling. (AC: 4, 5)
  - [x] Detect environment-provisioning failures during startup.
  - [x] Mark the run as failed at environment startup in run state.
  - [x] Prevent any autonomous repository execution from proceeding after startup failure.

- [x] Add automated tests for successful and failed environment startup. (AC: 1, 2, 3, 4, 5)
  - [x] Ready-task test: a prepared task provisions an isolated environment and records run-state metadata.
  - [x] Startup-failure test: provisioning failure marks the run failed at environment startup.
  - [x] Guardrail test: non-ready preparation outcomes cannot start an isolated run environment.
  - [x] Safety test: this story does not execute repository modifications yet.

## Dev Notes

- Story `3.1` is the first execution-stage story. It must consume the final preparation outcome from Story `2.5`, not recreate the preparation pipeline. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-5-detect-missing-or-conflicting-critical-context.md]
- The product brief explicitly calls for Docker-based isolated execution. Model the execution environment as isolated and disposable, but keep this story focused on startup only. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage] [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- Repository modification belongs to Story `3.2`. This story ends at environment readiness or startup failure. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.2: Execute Repository Changes Autonomously]

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `3.1` scoped to:
  - ready-task eligibility check
  - isolated-environment startup service/module
  - run-state initialization
  - startup-failure capture
  - tests
- Do not expand the slice into repository execution, progress-state history, or operator controls.

### Technical Requirements

- Story `3.1` must require a `ready` preparation outcome from Story `2.5`. [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-5-detect-missing-or-conflicting-critical-context.md]
- The run state must record at least environment identifier and initialization status. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.1: Start an Isolated Run Environment]
- Startup failure must block further execution and be recorded explicitly.
- Keep startup behavior deterministic and reviewable. No silent fallback from failed isolated execution to unrestricted host execution.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no execution-engine patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible environment-startup surface needed for Story `3.1`.

### Library / Framework Requirements

- No approved runtime, container/orchestration library, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `3.1` silently choose the platform architecture. Keep the startup slice minimal and reversible.

### File Structure Requirements

- Keep Story `3.1` code adjacent to the transition from preparation state into run state.
- Use explicit terminology around `isolated run environment`, `initialization status`, `environment identifier`, and `startup failure`.
- Persist only the minimum environment-startup metadata needed by later execution stories.

### Testing Requirements

- Add automated tests for ready-task startup and startup failure.
- Tests must prove non-ready tasks cannot start execution.
- Tests must prove failure is recorded in run state and blocks later repository execution.
- Tests must prove this story does not yet modify repository contents.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.1: Start an Isolated Run Environment]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 3.2: Execute Repository Changes Autonomously]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#Core Usage]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/product-brief-minions-2026-03-17.md#MVP Scope]
- [Source: /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/2-5-detect-missing-or-conflicting-critical-context.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epic 2 story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `3.1` was constrained to isolated-environment startup only.
- The file explicitly depends on the final Epic 2 preparation outcome.
- Repository execution was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/3-1-start-an-isolated-run-environment.md
