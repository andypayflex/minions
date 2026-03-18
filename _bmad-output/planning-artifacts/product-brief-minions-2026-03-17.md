---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - /Users/andydev/dev/minions/_bmad-output/planning-artifacts/research/technical-stripe-agentic-commerce-and-minions-research-2026-03-17.md
date: 2026-03-17
author: Andydev
---

# Product Brief: minions

## Executive Summary

Minions is an internal autonomous PR generation platform for well-scoped engineering work. It is designed to turn bounded requests into pull requests containing working code with tests, using isolated Docker-based execution environments and a controlled set of integrations. The initial product is intentionally narrow: it serves one team, focuses on one primary workflow, and is optimized for one outcome: reliable autonomous PR generation.

The core opportunity is to eliminate repetitive engineering overhead that does not require constant human attention but still consumes it today: context gathering, repo navigation, routine implementation, validation, and PR assembly. Existing solutions either operate at a lower-level harness layer or as general coding assistants without the workflow, policy, and execution controls required for dependable autonomous delivery inside our environment.

Our approach is to build an internal minions platform on top of an open orchestration substrate, using `gsd-build/get-shit-done` as the starting framework. The platform will integrate with GitHub, Slack, and Azure DevOps, execute work inside Docker, and allow minions to create pull requests automatically once they meet the quality bar. Success means engineers can delegate well-scoped work and reliably receive PRs that are ready for human review.

---

## Core Vision

### Problem Statement

Engineering teams spend too much time on well-understood but execution-heavy work that still requires manual context gathering, repetitive edits, local validation, and PR preparation. Interactive coding assistants can help, but they do not reliably operate as autonomous workers within a controlled internal workflow. We need internal minions that can take responsibility for bounded engineering tasks and return PR-ready results.

### Problem Impact

This problem creates consistent delivery drag. Small and medium engineering tasks still require full manual attention, even when the path is already clear. Engineers lose time to setup and repetition, routine work competes with deeper technical work, and the team lacks a dependable mechanism for converting clearly defined requests into validated code artifacts at speed.

### Why Existing Solutions Fall Short

Current options split into two useful but different layers. `pi.dev` is a minimal, extensible terminal coding harness with SDK, RPC, extensions, and packages, but it deliberately omits built-in features such as sub-agents, plan mode, and permission gates. That makes it a flexible low-level foundation, not a complete workflow system for autonomous internal delivery. General-purpose coding assistants can generate code, but they still do not provide the execution isolation, policy controls, workflow orchestration, and integration model needed for trustworthy autonomous internal work. We need something closer to a delivery system than a raw harness.

### Proposed Solution

Build an internal minions platform using `gsd-build/get-shit-done` as the initial orchestration substrate. The system will accept scoped requests, gather context from GitHub, Slack, and Azure DevOps, execute tasks autonomously inside Docker, apply changes in a controlled workspace, validate them locally, and create pull requests automatically when the output meets the completion standard. The MVP is intentionally constrained to one team and one primary workflow: autonomous PR generation for well-scoped engineering tasks.

### Key Differentiators

- Internal ownership of workflows, rules, policies, and execution infrastructure
- Docker-based isolated execution for repeatability and safety
- Autonomous PR generation as the explicit north-star workflow
- Tight integration with existing systems: GitHub, Slack, and Azure DevOps
- Clear completion standard: working code with tests
- A specialized minion platform built on top of a workflow system, rather than a raw coding harness

## Target Users

### Primary Users

**Primary Persona 1: Aiden, Product Engineer**

Aiden is a product engineer on the initial team using Minions. He works across feature delivery, bug fixes, and small-to-medium maintenance tasks. His day is interrupted by repetitive execution work: tracing code paths, applying routine edits, running tests, fixing small failures, and assembling pull requests. He is comfortable reviewing code, but he does not want to spend full focus on every scoped engineering task.

Aiden's goal is to delegate bounded work and get back a pull request with working code and tests. He values speed, predictability, and minimal supervision during execution. Success for him means he can hand off a clearly defined task and receive a PR that is ready for review rather than a vague draft or partial output.

**Primary Persona 2: Priya, Tech Lead**

Priya is responsible for delivery quality, architectural consistency, and team throughput. She is less interested in raw code generation than in whether Minions can operate safely within team rules and produce outputs that are reviewable and trustworthy. She wants the team to move faster without losing control over standards.

Priya's goal is to use Minions as a controlled execution layer for well-scoped work. She values policy boundaries, test-backed output, auditability, and predictable review quality. Success for her means Minions reduce engineering drag without increasing operational or code quality risk.

### Secondary Users

**Secondary Persona 1: Quinn, QA / Quality Stakeholder**

Quinn benefits when Minions produce PRs with working code and tests instead of incomplete changes. This reduces the amount of manual back-and-forth required to reach a testable state. Quinn is not the main operator, but the quality of Minion output directly affects their workload.

**Secondary Persona 2: Morgan, Platform / Security Stakeholder**

Morgan is responsible for ensuring that autonomous execution stays inside approved boundaries. Morgan cares about Docker isolation, integration permissions, audit trails, and clear restrictions on what Minions can and cannot do. Their success metric is safe autonomy, not just fast autonomy.

**Secondary Persona 3: Emma, Engineering Manager**

Emma benefits from improved throughput, faster PR creation, and less time lost to repetitive engineering tasks. She is a stakeholder in adoption and operational success, even if she is not a daily hands-on user.

### User Journey

**Discovery**

The first users discover Minions as an internal team capability introduced for a specific engineering workflow: autonomous PR generation for well-scoped tasks. Adoption starts inside one team rather than as a company-wide rollout.

**Onboarding**

Aiden or Priya connects to Minions through the approved team workflow, likely initiated from Slack and supported by GitHub and Azure DevOps context. They learn what types of requests are in scope, what quality bar Minions must meet, and what the boundaries of autonomy are.

**Core Usage**

A user submits a scoped request with enough context for execution. Minions gather context from GitHub, Slack, and Azure DevOps, execute the task inside Docker, make changes in a controlled workspace, run tests, and create a PR automatically if the output meets the quality standard.

**Success Moment**

The "aha" moment happens when the user sees that Minions can take a real engineering task and return a pull request with working code and tests, without requiring manual intervention during the run. The value is not just code generation; it is complete, reviewable task execution.

**Long-term Usage**

Over time, Minions become part of the team's normal delivery workflow for bounded engineering tasks. Engineers use them to reduce repetitive work, leads use them to improve throughput, and platform stakeholders use governance controls to keep autonomy safe and sustainable.

## Success Metrics

The success of Minions will be measured by whether it reliably turns well-scoped engineering requests into reviewable pull requests with working code and tests. The primary user outcome is not "AI usage" or "agent activity." It is reduced engineering effort for bounded tasks while preserving quality and control.

User success will be visible when engineers consistently trust Minions with scoped work, receive PRs that meet the completion standard, and spend less time on repetitive execution overhead. Tech leads and stakeholders will see success when Minion-generated outputs are reviewable, test-backed, and safe to operate within team rules.

### Business Objectives

**3-Month Objectives**

- Prove that one team can successfully use Minions for autonomous PR generation on well-scoped engineering tasks.
- Establish a reliable Docker-based execution workflow integrated with GitHub, Slack, and Azure DevOps.
- Demonstrate that Minion-generated PRs can meet the baseline standard of working code with tests.
- Build internal trust by showing that autonomy can operate within clear boundaries and still produce useful outputs.

**12-Month Objectives**

- Increase the volume of bounded engineering work delegated to Minions without degrading quality.
- Expand confidence in the platform as an internal execution layer for additional minion types or adjacent workflows.
- Reduce delivery friction for repetitive engineering tasks across the participating team or teams.
- Create a foundation for broader internal platform adoption based on measurable productivity and quality gains.

### Key Performance Indicators

**User Success KPIs**

- Percentage of submitted scoped tasks that result in an automatically created PR.
- Percentage of Minion-created PRs that contain working code and tests at first review.
- Median time from task submission to PR creation.
- Percentage of engineers on the initial team who reuse Minions for more than one task per month.

**Quality KPIs**

- First-pass local validation rate for Minion runs.
- CI pass rate for Minion-created PRs on the first full pipeline run.
- Percentage of Minion-created PRs merged without major rework.
- Post-merge defect rate for Minion-created changes compared with team baseline.

**Operational KPIs**

- Median Minion run duration per PR-generation task.
- Failure rate by run category, such as context failure, execution failure, test failure, or integration failure.
- Percentage of runs completed fully inside approved Docker execution boundaries.
- Audit coverage rate for prompts, tool actions, diffs, and run outcomes.

**Strategic KPIs**

- Estimated engineering time saved on bounded tasks compared with the current manual workflow.
- Growth in delegated task volume over time within the initial team.
- Stakeholder confidence in platform safety and usefulness, measured through structured internal feedback at defined review points.

The core rule for all metrics is that they must measure useful delivery outcomes, quality, and safety, not just activity volume.

## MVP Scope

### Core Features

The long-term product vision for Minions is an internal platform of specialized autonomous agents that can support the full software development lifecycle, from request intake and planning through implementation, validation, review support, and delivery coordination.

The MVP, however, is intentionally focused on the first high-value execution layer: autonomous PR generation for well-scoped engineering tasks within one team.

The MVP core features are:

- A request intake flow that allows users to submit scoped engineering tasks with enough context to execute
- Integration with GitHub, Slack, and Azure DevOps to gather task context and support the engineering workflow
- Docker-based isolated execution for every Minion run
- Autonomous task execution that can analyze code, modify code, and prepare changes in a controlled workspace
- Local validation that checks whether the result produces working code with tests
- Automatic pull request creation when the Minion output meets the completion standard
- Run summaries and traceability for what the Minion did, what changed, and what validation was performed

These features are essential because they create the first reliable proof point for the broader Minions platform: a bounded engineering request can be converted into a reviewable PR with tested code.

### Out of Scope for MVP

The following are out of scope for the first MVP release, even though they are part of the broader Minions vision:

- Full SDLC coverage across planning, implementation, QA, release, and post-release operations in the initial release
- Multi-team rollout
- Autonomous production deployments
- Autonomous merges without human review
- Broad multi-minion orchestration across the entire lifecycle
- Financial, billing, or payment-related agent actions
- Full platform generalization for every engineering and operational workflow from day one

These are deferred not because they are unimportant, but because the MVP needs to validate one critical slice of the lifecycle before expanding to the full system.

### MVP Success Criteria

The MVP is successful if it proves all of the following:

- One team can use Minions in a real internal workflow for scoped engineering tasks
- Minions can autonomously create pull requests with working code and tests
- The execution model works reliably inside Docker with the required integrations
- Users trust the outputs enough to keep delegating bounded work
- The quality of Minion-generated PRs is high enough that review remains efficient rather than becoming cleanup work
- The team can demonstrate measurable time savings on repetitive engineering tasks without introducing unacceptable safety or quality risk

These criteria act as the validation gate before the platform expands into more of the software development lifecycle.

### Future Vision

If the MVP succeeds, Minions will evolve into a full internal SDLC platform made up of specialized agents operating across the lifecycle.

That expanded vision includes:

- Planning minions that turn backlog items, requirements, and discussions into implementation-ready work
- Development minions that produce working code and PRs
- QA minions that generate and run tests, validate behavior, and summarize failures
- Review minions that analyze PRs for regressions, risks, and policy compliance
- Release minions that assist with promotion readiness, release coordination, and controlled deployment workflows
- Documentation and research minions that maintain internal knowledge and generate decision support artifacts
- Cross-minion orchestration that allows work to move through the lifecycle in controlled stages

The long-term goal is for Minions to become an internal operating system for software delivery: a governed platform where specialized autonomous agents can help the team complete the software development lifecycle end to end while keeping outputs reviewable, testable, and controllable.
