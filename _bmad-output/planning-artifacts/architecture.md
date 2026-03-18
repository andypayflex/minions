# Minions Architecture

## Overview

This repository now contains the initial Minions product codebase. It implements the story backlog as a dependency-free Node 22 domain model with deterministic services, in-memory persistence, and automated tests.

The goal of this architecture is not to lock in the long-term platform stack. It exists to satisfy the BMAD story prerequisite that the planning-only workspace be turned into an actual application scaffold before story execution begins.

## Stack

- Runtime: Node.js 22
- Language: modern JavaScript modules
- Testing: built-in `node:test`
- Persistence: in-memory repositories inside the platform model

## Core Model

- `TaskRequest`
  - Intake payload, requester/source metadata, Epic 1 gate results, and task audit trail
- `RunRecord`
  - Preparation state, execution state, validation state, delivery artifacts, summaries, preserved state, and run ledger
- `SupportedTarget`
  - Repository/team onboarding record with code surface metadata and validation configuration
- `MinionType`
  - Extensible capability registration record
- `WorkflowModel`
  - Canonical lifecycle stages plus additive extension support

## Service Boundaries

- Epic 1
  - Intake, minimum readiness, scope classification, approved-origin verification, autonomy policy evaluation
- Epic 2
  - Repository context retrieval, related-work retrieval, working-context assembly, relevance analysis, final preparation outcome
- Epic 3
  - Isolated environment startup, repository execution, progress persistence, runtime boundary stops, in-progress status, direct operator controls
- Epic 4
  - Repository-specific validation, structured evidence, completion evaluation, delivery branch creation, PR publication, delivery gating
- Epic 5
  - Failure classification, failure summaries, intermediate preservation, completed history, stage diagnostics, auditable ledger review
- Epic 6
  - Minion registration, repository/team onboarding, structured run data exposure, additive workflow-stage extension

## Design Constraints

- No external integrations are called directly. Approved systems and repositories are modeled as explicit registries so the backlog can be implemented deterministically.
- Every service writes explicit state that later stories reuse instead of recomputing hidden logic.
- Secrets and unrestricted agent context are modeled as sensitive fields and are redacted from user-facing reads.
- The run ledger is authoritative for audit review; summary/history APIs are derived views.
