# Karela

Scrum Requirement Engineering Assistance

## Current issues

Today’s tools (Jira + Xray/Zephyr + Cucumber + Camunda + Stately):

- Handle pieces of the chain (stories, acceptance tests, rules, states, tasks).
- But do not unify them in a structured, validated, human-in-the-loop workflow.
- They also lack guardrails: Gherkin is free text, DMN is external, and statecharts are isolated diagrams.

## What we do

- Unify the pieces in a structured, validated, human-in-the-loop workflow.
- Provide guardrails: Gherkin is structured, DMN is integrated, and statecharts are executable.

### 1. DSL-first approach

- One schema connects Story → Acceptance Criteria → DMN rules → Statecharts → Tasks.
- Each artifact is generated from the previous one, ensuring consistency and traceability.

### 2. Assistive AI

- LLMs propose (stories, ACs, DMN skeletons, tasks).
- DSLs + validators check.
- Humans approve.

Desire: AI-assisted but human-in-the-loop, mitigating LLM hallucinations.

### 3. Cross-artifact validation

- DMN overlap/gap detection (decision analysis).

- Story ↔ AC coverage checks (no Story without AC).

- AC ↔ Statechart mapping (no missing state).

- This provides quality gates across RE, not just within one artifact.

## What we want to help

- For Product Owners: reduces ambiguity and enforces consistency in User Stories and Acceptance Criteria.

- For Dev Teams: generates executable tests (Cucumber), decision logic (DMN), and tasks — speeding refinement.

- For Researchers: offers a framework to study AI-assisted RE with formal validation.

- For Industry: integrates with Jira (already ubiquitous) but adds rigor that current Jira plugins lack.
