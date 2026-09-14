# Scope Copilot — Architecture Decisions

## Current Stack

### Frontend / Application

* Next.js 16.3.5
* React 19
* TypeScript
* App Router
* Tailwind CSS v4
* shadcn/ui
* Base UI primitives
* Nova preset
* Lucide icons

### Backend

* Next.js Server Components
* Next.js Server Actions
* PostgreSQL
* Neon
* Prisma 7.10.0

### AI

Initial development:

* Gemini

Architecture must remain provider-agnostic so OpenAI or other providers can be added later.

## Database Architecture

PostgreSQL is the source of truth.

The project originally used a temporary in-memory array while the initial UI was being developed.

That approach has been removed.

Do NOT reintroduce in-memory project storage as the application's persistence layer.

Current flow:

Client Component
→ Server Action
→ Database Layer
→ Prisma
→ Neon PostgreSQL

## Database Models

Current models:

* Organization
* User
* Client
* Project

Planned models:

* ScopeDocument
* ScopeItem
* ClientRequest
* Analysis
* Decision
* ChangeOrder
* Approval
* ActivityLog
* AgencyPolicy

Later:

* ScopeDriftEvent
* EffortRecord
* ProjectMetric
* AIUsage

## Organization Ownership

Every customer belongs to an organization.

Projects, clients, and future scope data must be associated with the correct organization.

Current development code uses a temporary:

`development-org`

This MUST be replaced when authentication is implemented.

Production code must never rely on `development-org`.

## Prisma

Prisma 7 requires a PostgreSQL driver adapter.

Current architecture uses:

* `@prisma/adapter-pg`
* `pg`
* Prisma Client

The Prisma client is centralized in:

`lib/db/index.ts`

Do not instantiate independent Prisma clients throughout the application.

## Database Layer

Database operations belong in:

`lib/`

For example:

`lib/projects.ts`

Components should not directly access Prisma.

## Server Actions

Client components should communicate with server-side database operations through Server Actions where appropriate.

Pattern:

```text
Client Component
      ↓
Server Action
      ↓
lib/<domain>.ts
      ↓
Prisma
      ↓
PostgreSQL
```

Server Actions should validate incoming data before performing mutations.

## Scope Baseline

The original project scope should eventually be treated as an immutable baseline.

Approved changes create new scope versions rather than silently rewriting history.

Conceptually:

```text
Original SOW
    ↓
Scope Baseline v1
    ↓
Approved Change
    ↓
Scope Baseline v2
```

Maintain an audit trail.

## AI Architecture

Do not couple business logic directly to a specific AI provider.

Use an abstraction such as:

```text
AIProvider
├── GeminiProvider
├── OpenAIProvider
└── Future providers
```

The application should be able to route different operations to different models.

Simple tasks can use cheaper/faster models.

Ambiguous reasoning can use stronger models.

## AI Pipeline

```text
SOW
 ↓
SOW Extraction
 ↓
Structured Scope
 ↓
Client Request
 ↓
Request Extraction
 ↓
Scope Comparison
 ↓
Evidence Retrieval
 ↓
Decision Engine
 ↓
Impact Analysis
 ↓
Tradeoff Engine
 ↓
User Decision
 ↓
Change Order
 ↓
Approval
 ↓
Scope Ledger
```

## Evidence Requirement

AI output should be grounded in actual project data.

A decision should ideally identify:

* relevant SOW item
* exclusion
* revision rule
* assumption
* previous project decision

Never invent a clause that does not exist.

## Security Principles

* Never expose database credentials to client-side code.
* Validate Server Action inputs.
* Enforce organization ownership on database queries.
* Do not trust client-supplied organization IDs.
* AI output is untrusted data.
* External client content must eventually be treated as potentially adversarial.
* Do not allow client-provided text to override system instructions.
* Maintain audit history for important decisions.

## Current Route Structure

```text
/
└── redirect to /dashboard

/dashboard

/projects
/projects/[projectId]
```

Planned project workspace:

```text
/projects/[projectId]

Overview
Scope
Requests
Changes
Activity
```

## Current Database Flow

Project creation currently works through:

```text
ProjectForm
    ↓
createProjectAction
    ↓
createProject
    ↓
Prisma
    ↓
Neon
```

Project listing:

```text
ProjectsPage
    ↓
getProjects
    ↓
Prisma
    ↓
Neon
```

Project detail:

```text
ProjectPage
    ↓
getProject(projectId)
    ↓
Prisma
    ↓
Neon
```

## Important Temporary State

Authentication is not implemented yet.

Until authentication is added, development project creation uses a temporary organization.

The next architectural milestone is authentication and organization ownership.

## Base UI Rules

This project uses Base UI rather than Radix primitives.

Do not use `asChild` with Base UI components.

For Dialog triggers:

```tsx
<DialogTrigger render={<Button />}>
  New Project
</DialogTrigger>
```

When rendering a Next.js Link through the Button component:

```tsx
<Button
  nativeButton={false}
  render={<Link href="/projects" />}
>
  Back to projects
</Button>
```

Keep using the Button component when the design calls for a button.

## Architectural Principle

Prefer boring, explicit architecture over unnecessary abstraction.

Build feature-by-feature.

Keep the application runnable after every meaningful change.
