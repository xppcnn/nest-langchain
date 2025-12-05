---

description: "Task list for Expense Invoice Agent (Human-in-the-Loop)"
---

# Tasks: Expense Invoice Agent (Human-in-the-Loop)

**Input**: plan.md, spec.md for `001-expense-agent`  
**Prerequisites**: plan.md (done), spec.md (done)  
**Tests**: TDD required (per constitution)

## Phase 1: Setup

- [ ] T001 Update `.env.example` with `DATABASE_URL`, `OPENAI_API_KEY`, and file storage paths in project root
- [ ] T002 Install dependencies and verify build/lint/test: `pnpm install && pnpm run lint && pnpm test`
- [ ] T003 Ensure Drizzle config points to feature DB URL; verify `drizzle.config.ts` and `.specify/memory/constitution.md` constraints

## Phase 2: Foundational (Blocking)

- [ ] T004 Create Drizzle schemas for invoices/expense_requests/review_decisions/audit_logs/notifications in `src/database/schema/expenses.ts` and export via `src/database/schema/index.ts`
- [ ] T005 Generate and apply Drizzle migrations for new tables in `drizzle/`
- [ ] T006 Add upload storage provider (e.g., local fs) and Multer config in `src/invoices/upload.provider.ts`
- [ ] T007 Implement duplicate detection helper in `src/invoices/duplicate.service.ts` (hashing + vendor/date/amount match)
- [ ] T008 Implement audit logging service in `src/review/audit.service.ts`
- [ ] T009 Implement notification service placeholder (email/queue stub) in `src/notifications/notifications.service.ts`
- [ ] T010 Scaffold LangChain v1 invoice extraction chain in `src/ai/invoice-extraction.chain.ts` (fields: vendor/date/total/tax/currency/line items)
- [ ] T011 Scaffold LangGraph v1 state machine skeleton in `src/agent/expense/expense.graph.ts` (states: Uploaded -> PendingReview -> NeedsCorrection -> Approved/Rejected)

## Phase 3: User Story 1 - Submit Invoice for Reimbursement (P1) 🎯 MVP

- [ ] T012 [US1] Contract test for upload endpoint `POST /invoices/upload` in `tests/contract/invoices/upload.spec.ts`
- [ ] T013 [US1] Integration test for extraction + draft creation in `tests/integration/invoices/extraction.spec.ts`
- [ ] T014 [US1] Implement upload controller + DTO validation in `src/invoices/invoices.controller.ts`
- [ ] T015 [US1] Implement upload service: store file, call extraction chain, map to draft expense in `src/invoices/invoices.service.ts`
- [ ] T016 [US1] Implement extraction chain logic (LangChain v1) in `src/ai/invoice-extraction.chain.ts`
- [ ] T017 [US1] Persist draft expense + enqueue review state in `src/invoices/invoices.service.ts`
- [ ] T018 [US1] Integrate duplicate detection into upload flow in `src/invoices/invoices.service.ts`
- [ ] T019 [US1] Write audit log entries for upload/draft creation in `src/review/audit.service.ts`

## Phase 4: User Story 2 - Human Review & Correction Loop (P2)

- [ ] T020 [US2] Contract test for review APIs (list/detail/approve/reject/correction) in `tests/contract/review/review.spec.ts`
- [ ] T021 [US2] Integration test for approve/reject/correction loop in `tests/integration/review/flow.spec.ts`
- [ ] T022 [US2] Implement review queue endpoints in `src/review/review.controller.ts`
- [ ] T023 [US2] Implement review service transitions (approve/reject/needs-correction) in `src/review/review.service.ts`
- [ ] T024 [US2] Wire LangGraph state transitions for human decision gating in `src/agent/expense/expense.graph.ts`
- [ ] T025 [US2] Handle corrections/resubmissions and status updates in `src/review/review.service.ts`
- [ ] T026 [US2] Audit log reviewer actions and comments in `src/review/audit.service.ts`
- [ ] T027 [US2] Notify employee on “Needs Correction” state in `src/notifications/notifications.service.ts`

## Phase 5: User Story 3 - Auditability & Notifications (P3)

- [ ] T028 [US3] Contract test for notifications and audit retrieval in `tests/contract/notifications/notifications.spec.ts`
- [ ] T029 [US3] Integration test for status-change notifications in `tests/integration/notifications/status.spec.ts`
- [ ] T030 [US3] Implement notification dispatch (email placeholder) in `src/notifications/notifications.service.ts`
- [ ] T031 [US3] Implement audit log query endpoint in `src/review/audit.controller.ts`
- [ ] T032 [US3] Implement CSV export on approval in `src/exports/exports.service.ts`
- [ ] T033 [US3] Trigger export after approval (hook from review service) in `src/exports/exports.service.ts`

## Phase 6: Polish & Cross-Cutting

- [ ] T034 Add quickstart and API usage notes in `specs/001-expense-agent/quickstart.md`
- [ ] T035 Harden global error filter and JSON logging policy in `src/common/filters/http-exception.filter.ts` and wire in `src/app.module.ts`
- [ ] T036 Add basic rate limiting/guard configuration for upload/review endpoints in `src/app.module.ts`
- [ ] T037 Finalize `.env.example` and README snippet for invoice agent usage in project root

## Dependencies & Execution Order

- Phase 1 → Phase 2 → User Stories (US1 → US2 → US3) → Polish
- US1 must finish before US2/US3; US2 before US3 for audit/export hooks
- Parallel opportunities: tasks marked [P] (none marked; default sequential due to dependencies). Unit/contract/integration tests can run in parallel per phase once implementations exist.

