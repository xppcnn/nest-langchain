# Feature Specification: Expense Invoice Agent (Human-in-the-Loop)

**Feature Branch**: `001-expense-agent`  
**Created**: 2025-12-05  
**Status**: Draft  
**Input**: User description: "使用nest和langchain 搭建一个agent ,该anget是复制企业报销的agent,在用户上传相应的发票后 需要humen in loop 才可以继续"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Invoice for Reimbursement (Priority: P1)

An employee uploads an invoice to start an expense reimbursement request. The
system extracts key fields, creates a draft expense record, and routes it to a
human reviewer before any reimbursement can proceed.

**Why this priority**: Core entry point; without upload + extraction the agent
cannot operate.

**Independent Test**: Upload a valid invoice and confirm a draft expense with
extracted fields is created and placed in the review queue, without any payout.

**Acceptance Scenarios**:

1. **Given** an authenticated employee with an invoice file, **When** they upload
   the invoice, **Then** a draft expense is created with extracted fields and
   status "Pending Review".
2. **Given** a draft expense awaiting review, **When** no human approval exists,
   **Then** no reimbursement or downstream action is triggered.

---

### User Story 2 - Human Review & Correction Loop (Priority: P2)

Finance reviewers inspect extracted data, correct errors, request clarifications
from the employee, and then approve or reject. The process must block until a
human decision is recorded.

**Why this priority**: Ensures compliance and accuracy before reimbursement.

**Independent Test**: A reviewer edits extracted fields, adds a comment, and
approves; the expense status transitions to "Approved" only after the human
action is saved.

**Acceptance Scenarios**:

1. **Given** a pending review item, **When** the reviewer updates fields and
   approves, **Then** the expense status becomes "Approved" and the audit trail
   records the decision.
2. **Given** a pending review item, **When** the reviewer requests changes,
   **Then** the employee is notified and the expense returns to "Needs
   Correction" until resubmitted.

---

### User Story 3 - Auditability & Notifications (Priority: P3)

Stakeholders need visibility into review progress and outcomes. The system must
notify the right party at each state change and maintain an audit log of uploads,
extractions, reviewer actions, and approvals.

**Why this priority**: Reduces rework, improves trust, and supports compliance.

**Independent Test**: Trigger each state change (upload, pending review,
correction requested, approved, rejected) and verify targeted notifications plus
an audit log entry for each step.

**Acceptance Scenarios**:

1. **Given** a status change to "Needs Correction", **When** it occurs, **Then**
   the employee receives a notification with required fixes and the log records
   who requested them.
2. **Given** an approval decision, **When** it is saved, **Then** approver,
   timestamp, and final fields are logged and visible for audit.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Invoice is unreadable or missing mandatory fields → place in manual review with
  explicit "Need re-upload" status.
- Duplicate invoice detected (same number/vendor/date/amount) → block submission
  and surface duplicate warning to reviewer.
- Currency or tax fields absent → mark missing and require reviewer fill-in.
- User uploads multiple invoices in one batch → each should be tracked and
  reviewable individually.
- Reviewer unavailable or SLA breach → escalate notification to backup reviewer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated employees to upload invoice files
  with basic metadata (employee, vendor, amount, date).
- **FR-002**: System MUST extract key fields (vendor, date, total, tax, currency,
  line items if present) from uploaded invoices and map them into a draft expense.
- **FR-003**: System MUST detect potential duplicate invoices and flag them prior
  to review.
- **FR-004**: System MUST route every draft expense to a human review queue; no
  reimbursement or downstream action occurs until a human approves.
- **FR-005**: Reviewers MUST be able to edit extracted fields, add comments, and
  approve or reject; approval writes an immutable audit record.
- **FR-006**: System MUST support a correction loop: reviewers request changes,
  employees resubmit, and items return to the queue.
- **FR-007**: System MUST notify the right party at each status change (upload,
  needs correction, approved, rejected).
- **FR-008**: System MUST maintain an audit log of uploads, extractions,
  reviewer actions, decisions, and timestamps.
- **FR-009**: System MUST enforce that each invoice remains blocked until at
  least one human approval is recorded.
- **FR-010**: System MUST export approved expense data as CSV with required
  finance fields immediately after human approval; export is available for
  downstream processing.
- **FR-011**: System SHOULD support Chinese and English invoices at launch; other
  languages are marked unsupported and surfaced for manual handling.

### Key Entities *(include if feature involves data)*

- **Employee**: actor submitting invoices; has identity/contact.
- **Invoice**: uploaded document with vendor, date, totals, currency, tax, and
  line items.
- **Expense Request**: draft/approved record derived from an invoice; includes
  status, extracted fields, reviewer comments.
- **Review Decision**: approval/rejection with reviewer, timestamp, notes, and
  field corrections.
- **Notification**: message sent to employee or reviewer tied to status changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥95% of uploaded invoices create a draft expense with all required
  header fields populated without blocker errors.
- **SC-002**: 100% of expenses remain blocked from reimbursement until at least
  one human approval is recorded.
- **SC-003**: 90% of invoices receive a human review decision within 1 business
  day; escalations are logged for the rest.
- **SC-004**: Duplicate detection prevents at least 90% of double-submissions
  before approval.
- **SC-005**: User satisfaction: ≥85% of submitting employees report the upload
  and correction loop is clear and actionable (post-interaction survey).

