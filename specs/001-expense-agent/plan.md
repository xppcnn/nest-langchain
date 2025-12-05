# Implementation Plan: Expense Invoice Agent (Human-in-the-Loop)

**Branch**: `001-expense-agent` | **Date**: 2025-12-05 | **Spec**: `specs/001-expense-agent/spec.md`
**Input**: Feature specification from `/specs/001-expense-agent/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a NestJS-based expense invoice agent that ingests uploaded invoices,
extracts fields via LangChain v1, orchestrates a human-in-the-loop review
workflow (LangGraph v1 for stateful flow), and blocks reimbursement until human
approval. LLM calls are routed through OpenRouter. Outputs approved data via CSV
export; supports Chinese/English invoices at launch, other languages flagged for
manual handling.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) with NestJS 11.x (Express)  
**Primary Dependencies**: LangChain v1, LangGraph v1, Drizzle ORM, postgres-js, JWT auth stack, OpenRouter client  
**Storage**: PostgreSQL via Drizzle ORM (no other ORM)  
**Testing**: Jest + @nestjs/testing; integration for LangChain/LangGraph flows  
**Target Platform**: Linux server (containerized), REST API for internal use  
**Project Type**: Single backend project  
**Performance Goals**: p95 < 2s for invoice upload+extraction response; p95 < 300ms for review actions/reads  
**Constraints**: All DB access through Drizzle; human approval required before any payout/export; structured logging JSON; no raw SQL; all LLM traffic must go through OpenRouter with env-driven config and allow-listed models  
**Scale/Scope**: Aim for ~10k invoices/day; concurrent reviewers O(100)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- NestJS module-first: plan to add dedicated modules (agent/workflow, invoices, review, exports) with DI boundaries. ✅
- LangChain v1 only: chains/tools built with v1 APIs; no legacy patterns. ✅
- LangGraph v1 for stateful workflows: review orchestration in LangGraph graph service. ✅
- Drizzle ORM only: DB schema and access via Drizzle; no raw SQL. ✅
- TypeScript strict, no `any` without justification. ✅
- TDD: unit + integration tests required per module; AI workflows covered. ✅
- Structured error handling/logging: Nest exception filters + JSON logs. ✅
- Express middleware minimal; prefer Nest guards/interceptors/pipes. ✅
- OpenRouter as sole LLM provider: all LLM calls routed through OpenRouter; no direct vendor calls. ✅

Gate status: PASS (no violations). Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-expense-agent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── agent/                     # LangGraph graphs and orchestrators
│   └── expense/               # Expense agent graph, policies, routing
├── ai/                        # LangChain chains/tools (OCR/extraction) as services
├── invoices/                  # Module: upload API, file handling, extraction trigger
├── review/                    # Module: review queue, approvals, corrections, audit log
├── exports/                   # Module: CSV export service and scheduling
├── notifications/             # Module: notification dispatch (email/placeholder)
├── database/                  # Drizzle schema/services (existing)
├── auth/                      # Existing auth module reuse
└── app.module.ts

tests/
├── integration/
│   ├── invoices/
│   ├── review/
│   └── agent/
├── contract/                  # API contract tests for uploads/review/export
└── unit/
    ├── ai/
    ├── agent/
    ├── invoices/
    ├── review/
    └── exports/
```

**Structure Decision**: Single NestJS backend. New modules under `src/agent`,
`src/ai`, `src/invoices`, `src/review`, `src/exports`, `src/notifications`, using
Drizzle via `src/database`. Tests grouped by unit/contract/integration.

## Complexity Tracking

Not applicable (no constitution violations planned).
