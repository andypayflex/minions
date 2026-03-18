# Story 6.4: Extend the Workflow Model to Future Lifecycle Stages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform stakeholder,
I want the workflow model to support future lifecycle stages beyond implementation and PR creation,
so that Minions can grow into a broader internal SDLC platform.

## Acceptance Criteria

1. When a new lifecycle stage is defined within approved expansion rules, the workflow model can represent it without breaking existing task, run, and delivery records.
2. The existing MVP execution flow remains operable after the stage is added.
3. Proposed lifecycle-stage extensions that would invalidate the MVP run model are rejected.
4. Rejected extensions record the compatibility failure for review.
5. Workflow-model extension remains additive rather than a rewrite of the current system.

## Tasks / Subtasks

- [x] Define the future-lifecycle-stage extension contract. (AC: 1, 2, 3, 4, 5)
  - [x] Reuse the existing task, run, and delivery record model as the baseline compatibility surface.
  - [x] Define the minimum additive representation for new lifecycle stages under approved expansion rules.
  - [x] Include compatibility validation and rejection handling in the contract.

- [x] Implement additive workflow-model extension handling. (AC: 1, 2)
  - [x] Allow an approved new lifecycle stage to be represented in the workflow model.
  - [x] Preserve operability of the existing MVP execution flow after extension.
  - [x] Keep extension additive to the current model rather than introducing a replacement model.

- [x] Implement incompatible-extension rejection handling. (AC: 3, 4)
  - [x] Detect lifecycle-stage proposals that would invalidate the MVP run model.
  - [x] Reject incompatible extensions.
  - [x] Record the compatibility failure for review.

- [x] Add automated tests for additive and incompatible workflow-model extensions. (AC: 1, 2, 3, 4, 5)
  - [x] Additive-extension test: a compliant lifecycle stage is represented without breaking current records.
  - [x] MVP-stability test: the existing execution flow remains operable after extension.
  - [x] Incompatible-extension test: invalidating stage proposals are rejected with recorded compatibility failure.
  - [x] Model-integrity test: extension remains additive rather than replacing the current system.

## Dev Notes

- Story `6.4` is about making the workflow model extensible, not about implementing the future lifecycle stages themselves. Keep the work at the model/compatibility boundary. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.4: Extend the Workflow Model to Future Lifecycle Stages]
- The PRD explicitly requires that future lifecycle-stage support not invalidate the MVP execution model. Preserve current task/run/delivery behavior as the compatibility baseline. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Extensibility & Platform Evolution]
- Do not expand this story into planning, QA, release, or orchestration implementations. Those are future consumers of the extensible workflow model.

### Project Structure Notes

- The current workspace remains planning-only. No application source tree, architecture document, UX spec, or project-context file was found.
- If implementation occurs in the actual product repository, follow that repository's existing structure and naming conventions.
- If bootstrapping a new codebase, keep Story `6.4` scoped to:
  - workflow-model extension contract
  - compatibility-validation service/module
  - additive lifecycle-stage representation
  - compatibility-failure recording
  - tests
- Do not expand the slice into implementation of future SDLC stage behavior.

### Technical Requirements

- Story `6.4` must allow additive representation of approved new lifecycle stages without breaking existing task, run, and delivery records. [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.4: Extend the Workflow Model to Future Lifecycle Stages]
- Existing MVP execution flow must remain operable after extension.
- Incompatible stage proposals must be rejected and record compatibility failure.
- The extension model must remain additive rather than replacing the current system.

### Architecture Compliance

- No architecture document was available at `/Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md`.
- No application source tree exists in this workspace, so no workflow-model extension patterns could be extracted.
- In the absence of architecture, implement only the smallest reversible workflow-extension surface needed for Story `6.4`.

### Library / Framework Requirements

- No approved runtime, modeling layer, or test framework is specified in the planning artifacts.
- Reuse the actual product repository's stack if one exists.
- If no stack exists yet, do not let Story `6.4` silently choose the platform architecture. Keep the extension slice minimal and reversible.

### File Structure Requirements

- Keep Story `6.4` code adjacent to the canonical task/run/delivery model and clearly separate it from concrete future-stage implementations.
- Use explicit terminology around `workflow model`, `lifecycle stage`, `additive extension`, `compatibility validation`, and `MVP stability`.
- Persist only the minimum extension and compatibility metadata needed by this story.

### Testing Requirements

- Add automated tests for additive extension, MVP stability, incompatible extension rejection, and model integrity.
- Tests must prove the current MVP flow remains operable after extension.
- Tests must prove incompatible stages are rejected with recorded reasons.
- Tests must prove this story does not implement future-stage runtime behavior.

### References

- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/epics.md#Story 6.4: Extend the Workflow Model to Future Lifecycle Stages]
- [Source: /Users/andydev/dev/minions/_bmad-output/planning-artifacts/prd.md#Extensibility & Platform Evolution]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Previous story intelligence loaded from Epics 1-5 task/run/delivery-model story files.
- Implemented in the bootstrapped Node.js product scaffold in /Users/andydev/dev/minions.
- Architecture scaffold created at /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md.

### Completion Notes List

- Story `6.4` was constrained to additive workflow-model extension only.
- MVP compatibility and stability were made explicit.
- Future-stage behavior implementation was kept out of this story by design.

### File List
- /Users/andydev/dev/minions/package.json
- /Users/andydev/dev/minions/_bmad-output/planning-artifacts/architecture.md
- /Users/andydev/dev/minions/src/minions.js
- /Users/andydev/dev/minions/test/minions.test.js

### Change Log
- 2026-03-17: Completed implementation in the local Node.js scaffold with architecture, story-aligned services, and automated tests.


- /Users/andydev/dev/minions/_bmad-output/implementation-artifacts/6-4-extend-the-workflow-model-to-future-lifecycle-stages.md
