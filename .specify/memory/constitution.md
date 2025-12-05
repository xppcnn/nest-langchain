<!--
Sync Impact Report:
Version change: 1.1.0 → 1.2.0 (MINOR: added LLM provider principle)
Modified principles: Added Principle IX - OpenRouter as LLM provider
Added sections: Principle IX - OpenRouter Provider
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section references this file
  ✅ .specify/templates/spec-template.md - No changes needed, already generic
  ✅ .specify/templates/tasks-template.md - No changes needed, already generic
Follow-up TODOs: None
-->

# Nest LangChain Constitution

## Core Principles

### I. NestJS Module-First Architecture (NON-NEGOTIABLE)

Every feature MUST be implemented as a self-contained NestJS module. Modules
MUST follow dependency injection patterns, expose clear interfaces, and be
independently testable. Controllers handle HTTP concerns only; business logic
belongs in services. Shared functionality (database, auth, configuration) MUST
be provided via NestJS modules with proper exports/imports.

**Rationale**: NestJS's module system provides dependency injection, testing
isolation, and clear boundaries. Violating this leads to tight coupling and
untestable code.

### II. LangChain v1 API Compliance

All AI/LLM integrations MUST use LangChain v1 APIs and patterns. Chains,
agents, and tools MUST be constructed using LangChain v1's chain construction
methods. Legacy v0.x patterns are forbidden. LangChain components MUST be
wrapped in NestJS services for dependency injection and lifecycle management.

**Rationale**: LangChain v1 provides stable, well-documented APIs with
improved error handling and type safety. Mixing versions causes maintenance
burden and unexpected behavior.

### III. LangGraph v1 for Stateful Workflows

Complex multi-step AI workflows, agent orchestration, and stateful processes
MUST use LangGraph v1. State machines and graph-based flows MUST be defined
using LangGraph v1's graph construction APIs. LangGraph graphs MUST be
encapsulated in NestJS services with proper state management and persistence.

**Rationale**: LangGraph v1 provides explicit state management for complex AI
workflows. Ad-hoc state management leads to race conditions and debugging
nightmares.

### IV. TypeScript Type Safety (NON-NEGOTIABLE)

All code MUST use strict TypeScript with no `any` types except in exceptional
cases (with explicit justification). DTOs, entities, and service interfaces
MUST have complete type definitions. LangChain and LangGraph integrations MUST
use proper type definitions from their respective packages.

**Rationale**: Type safety catches errors at compile time, improves IDE
support, and serves as living documentation. `any` defeats the purpose of
TypeScript.

### V. Express Middleware & HTTP Layer

Express middleware usage MUST be explicit and minimal. NestJS guards,
interceptors, and pipes are preferred over raw Express middleware. When
Express middleware is necessary (CORS, compression, etc.), it MUST be
configured via NestJS's adapter pattern and documented.

**Rationale**: NestJS provides abstraction over Express. Direct Express usage
should be exceptional to maintain consistency and testability.

### VI. Test-Driven Development

Unit tests MUST be written before or alongside implementation. Each service,
controller, and module MUST have corresponding test files. Integration tests
MUST verify LangChain chains and LangGraph workflows execute correctly.
Mocking strategies MUST isolate external dependencies (LLM APIs, databases).

**Rationale**: TDD ensures code is testable by design, catches regressions,
and provides documentation through examples. Tests without TDD often test
implementation details rather than behavior.

### VII. Structured Error Handling & Logging

All errors MUST be caught and transformed into consistent HTTP responses using
NestJS exception filters. Logging MUST use structured formats (JSON) with
appropriate log levels. LangChain and LangGraph execution errors MUST be
logged with context (chain state, graph node, input data).

**Rationale**: Consistent error handling improves debugging and user
experience. Structured logs enable monitoring and alerting in production.

### VIII. Drizzle ORM for Database Access (NON-NEGOTIABLE)

All database access MUST use Drizzle ORM. Raw SQL queries are forbidden except
in exceptional cases (with explicit justification and review). Database schemas
MUST be defined using Drizzle's schema definition API in `src/database/schema/`.
Database operations MUST be encapsulated in NestJS services that inject the
Drizzle database instance via dependency injection. Migrations MUST be managed
using Drizzle Kit (`drizzle-kit`).

**Rationale**: Drizzle ORM provides type-safe database access, excellent
TypeScript integration, and SQL-like query builder that prevents SQL injection.
Using a single ORM ensures consistency, maintainability, and leverages Drizzle's
type inference for database schemas.

### IX. OpenRouter as LLM Provider (NON-NEGOTIABLE)

All LLM traffic MUST be routed via OpenRouter. Direct calls to other LLM
providers are forbidden unless proxied through OpenRouter. API keys and routing
config MUST be managed via environment variables and injected through NestJS
configuration. Models and costs MUST be tracked per environment for governance
and observability.

**Rationale**: Centralizing LLM access through OpenRouter enforces policy, cost
control, auditability, and consistent routing while allowing model choice.

## Technology Stack Requirements

**Framework**: NestJS 11.x with Express adapter  
**Language**: TypeScript 5.x with strict mode  
**AI Libraries**: LangChain v1.x, LangGraph v1.x  
**Database**: PostgreSQL  
**ORM**: Drizzle ORM (REQUIRED - no alternatives)  
**LLM Provider**: OpenRouter (required; no direct vendor calls outside OpenRouter)  
**Testing**: Jest with NestJS testing utilities  
**API Style**: RESTful with OpenAPI/Swagger documentation  

**Version Constraints**: MUST pin LangChain and LangGraph to v1.x major
version. Minor/patch updates require dependency audit. Major version upgrades
require explicit approval and migration plan. Drizzle ORM versions MUST be
pinned and major version upgrades require explicit approval and migration plan.
OpenRouter integration must be versioned/compatible with client SDK in use;
model allow-list/deny-list must be reviewed on major changes.

## Development Workflow

**Branch Strategy**: Feature branches from main, PR required for merge.  
**Code Review**: All PRs MUST pass linting, type checking, and tests.  
**Constitution Compliance**: Reviewers MUST verify PRs comply with all
constitution principles. Violations MUST be addressed before merge.

**Quality Gates**:
- All tests passing (unit + integration)
- No TypeScript errors or warnings
- No ESLint errors
- LangChain/LangGraph integration tests passing
- API documentation updated

## Governance

This constitution supersedes all other development practices. Amendments
require:
- Version increment (semantic versioning: MAJOR.MINOR.PATCH)
- Documentation of change rationale
- Update to this file with sync impact report
- Verification that templates and examples remain consistent

All PRs and code reviews MUST verify compliance with constitution principles.
Complexity that violates principles MUST be justified in the Complexity
Tracking section of implementation plans.

**Version**: 1.2.0 | **Ratified**: 2025-12-05 | **Last Amended**: 2025-12-05
