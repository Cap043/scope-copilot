# Scope Copilot — Development Guide

## Development Philosophy

Build the product incrementally.

Do not attempt to build the entire SaaS in one pass.

Every feature should follow:

```text
Purpose
 ↓
Database changes
 ↓
Server/API logic
 ↓
AI logic if required
 ↓
UI
 ↓
Error states
 ↓
Security
 ↓
Testing
 ↓
Git commit
```

Keep the application working after each step.

## Coding Style

Use TypeScript.

Prefer clear, straightforward code over clever abstractions.

Add concise comments to important code when the comment explains:

* why something exists
* an important workflow
* a non-obvious architectural decision
* a temporary implementation

Do not add comments that merely restate obvious code.

## Git Workflow

For each meaningful feature:

```bash
git status
git add .
git commit -m "short meaningful message"
git push
```

Keep commits focused.

Do not mix unrelated refactors into feature commits unless necessary.

## Current Repository

GitHub:

`https://github.com/Cap043/scope-copilot.git`

Primary branch:

`main`

## Environment Variables

Secrets belong in `.env`.

Never commit secrets.

`.env` should remain ignored by Git.

Current database configuration includes:

* `DATABASE_URL`
* `DATABASE_URL_POOLED`

Do not paste database credentials into source files.

## Database Workflow

After schema changes:

```bash
npx prisma validate
```

During development, create a migration:

```bash
npx prisma migrate dev --name <migration-name>
```

Regenerate Prisma Client when necessary:

```bash
npx prisma generate
```

Verify the application:

```bash
npm run build
```

## Current Development Checkpoint

The following currently works:

* Next.js application
* Dashboard
* Projects page
* Project creation UI
* Server Action project creation
* PostgreSQL persistence
* Neon connection
* Prisma 7
* Project list from database
* Project detail from database
* Project cards using Prisma data
* Production build

A persistence test has also been completed successfully:

1. Create project
2. Open project
3. Stop development server
4. Restart development server
5. Project remains available

This confirms projects are persisted in PostgreSQL rather than application memory.

## Current Temporary Implementation

Authentication has not yet been implemented.

Project creation currently uses:

`development-org`

This is temporary and must be replaced with the authenticated user's organization.

Do not build additional organization logic around this temporary ID.

## Next Milestone

### Authentication + Organization Ownership

The next major task is to implement authentication.

Expected architecture:

```text
Authenticated User
       ↓
Organization
       ↓
Projects / Clients / Scope
```

After authentication:

* identify the authenticated user
* determine their organization
* create projects under that organization
* filter project queries by organization
* prevent cross-organization access
* remove the `development-org` dependency

Authentication technology selected for the project:

**Better Auth**

Check current official documentation before implementation because authentication libraries can change their APIs.

## Product Build Order

After authentication:

### 1. SOW ingestion

Allow:

* PDF
* DOCX
* TXT
* pasted text

Extract:

* deliverables
* features
* exclusions
* revision limits
* timeline
* assumptions

User reviews the extracted scope before it becomes the baseline.

### 2. Client Request Analysis

User pastes a client request.

The system analyzes it against the project's current scope.

Return:

* classification
* confidence
* evidence
* estimated effort
* timeline impact
* suggested price
* recommendation
* alternatives

### 3. Human Override

User must be able to override the AI recommendation.

The override should be recorded for future agency-specific intelligence.

### 4. Scope Policy

Allow agencies to define courtesy/review/charge thresholds.

### 5. Scope Drift

Track cumulative unpriced work.

### 6. Change Orders

Generate approval-ready change requests.

### 7. Client Approval

Provide a simple client-facing approval page without requiring a full account.

### 8. Scope Ledger

Maintain an auditable history of scope decisions and approved changes.

### 9. Margin Intelligence

Eventually connect scope decisions to:

* effort
* project value
* actual work
* estimated margin
* unpriced work

## Do Not Build Yet

Do not prematurely add:

* mobile app
* Gmail OAuth
* Slack integration
* Teams integration
* Stripe billing
* CRM
* time tracker
* calendar
* team chat
* complex analytics
* enterprise SSO
* white-labeling
* browser extension
* accounting
* generic project management
* proposal software
* contract management

These can be reconsidered after the core product proves useful.

## Definition of Done — Core Product

The first meaningful product milestone is:

> An agency can upload a real SOW, paste a real client request, receive a trustworthy scope decision backed by evidence and commercial impact, choose an action, and produce an approval-ready change request.

Everything before that should primarily support reaching this milestone.

## Testing Mindset

Test both happy paths and failure paths.

At minimum:

* invalid project ID
* missing project
* missing client
* invalid project value
* missing SOW
* ambiguous client request
* AI failure
* database failure
* unauthorized project access
* malformed uploaded document

AI failures should degrade gracefully rather than breaking the project workspace.

## Product Trust

The product is making recommendations about money and client relationships.

Therefore:

* show evidence
* show uncertainty
* allow human override
* keep an audit trail
* don't pretend AI decisions are legal determinations
* don't silently modify scope
* don't automatically send client communications without user approval

## Guiding Principle

Build the smallest version that solves the real decision problem extremely well.

Do not turn Scope Copilot into a generic agency management platform.
