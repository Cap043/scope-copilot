# Scope Copilot — Project Memory & Technical Decision Log

**Last updated:** 2026-09-15  
**Current phase:** Core product foundation → Scope normalization and AI extraction next.

---

## 1. Product

**AI Scope Decision & Margin Copilot**  
Working name: **Scope Copilot**

### Core promise

> Before you say yes to a client request, know what it will cost you.

Alternative positioning:

> Stop doing client extras for free.

### Target customer

Primary:
- US/UK/Canada/Australia/EU small web-development agencies
- 2–15 people
- Roughly $2k–$25k projects
- Roughly 5–30 active projects/month

Secondary:
- Shopify developers
- Webflow agencies
- Software consultancies
- Design studios
- Branding agencies
- AI automation agencies

### Business goal

Build a genuinely useful solo-dev SaaS with a realistic path toward approximately **$250 MRR**, targeting international customers with negligible upfront cost.

---

## 2. Product Direction — LOCKED

The product must **not** become another generic:

> AI detects scope creep → generates change order → client approves

tool.

The differentiation is the **decision before the change is accepted**.

When a client asks for an extra, the product should help decide:
- Is it included?
- Should we absorb it as courtesy?
- Should we charge?
- Should we swap another deliverable?
- Should we defer it?
- What will it cost in hours/money?
- What happens to timeline and margin?
- What should we tell the client?
- Are tiny requests accumulating into scope drift?

The core question is:

> **What should I actually do about this client request?**

---

## 3. Decision Model

### Classifications

- `IN_SCOPE`
- `COURTESY`
- `REVIEW`
- `MATERIAL_CHANGE`
- `MAJOR_CHANGE`

### Actions

- `ABSORB`
- `CHARGE`
- `SWAP`
- `DEFER`
- Later: `RENEGOTIATE`

### AI principles

- AI should say **“likely out of scope”**, not make binding legal determinations.
- Ambiguous requests should become `REVIEW`.
- Human controls the final price/decision.
- Important decisions should be grounded in actual SOW/scope evidence.

---

## 4. Product Architecture

```text
Client Request
      ↓
Request Analysis
      ↓
Compare against:
- Original SOW / current scope
- Agency policy
- Project history
      ↓
Decision Engine
      ↓
Impact Analysis
- effort
- timeline
- dependencies
- value
      ↓
Tradeoff Engine
- absorb
- charge
- swap
- defer
      ↓
Change Order if needed
      ↓
Client Approval
      ↓
Scope Ledger
      ↓
Scope Drift
      ↓
Margin Intelligence
```

---

## 5. Major Differentiators — LOCKED

### Scope Decision Engine
Go beyond binary in/out-of-scope decisions.

### Tradeoff Engine
Recommend absorb/charge/swap/defer based on effort, timeline, dependencies, value and agency policy.

### Scope Drift Radar
Detect cumulative small requests that become meaningful scope erosion.

### Agency Scope Memory / Policy
Example:
```text
<30 min      → courtesy
30–90 min    → review
>90 min      → charge
```
Eventually learn from agency overrides/history.

### Request Evidence Graph
Every important decision should cite the actual scope item/exclusion supporting it.

### Impact Card
Eventually show:
- effort
- timeline impact
- dependencies
- value

### Scope Simulator
Answer:
> What happens if I accept all pending requests?

### Client-safe negotiation
Separate internal recommendation from client-facing wording.

### Retroactive Scope Recovery
Identify completed unpriced work.

### Margin Intelligence
Eventually connect project value, budgeted/actual effort and margin erosion.

---

## 6. Roadmap — LOCKED

### V1
- Scope extraction
- Request analysis
- Explainable decision
- Effort
- Timeline
- Price
- Human override

### V1.5
- Courtesy rules
- Tradeoff engine
- Scope drift
- Request history

### V2
- Change orders
- Client approval
- Scope ledger
- Versioning

### V2.5
- Margin intelligence
- What-if simulator
- Retroactive recovery

### V3
- Email/Gmail/Outlook
- Slack/Teams
- Voice
- Screenshot intelligence
- Agency-specific scope memory

### V4
- Historical pricing intelligence
- Predictive scope risk
- Automated recommendations
- Agency-wide margin intelligence

---

## 7. Explicitly Deferred

Do not build early:
- Mobile app
- Gmail OAuth
- Slack/Teams integrations
- Stripe billing
- Auto-send
- CRM
- Time tracker
- Calendar
- Team chat
- Full client portal
- White-labeling
- Complex analytics
- Enterprise SSO
- Multi-language
- Browser extension
- Generic project management
- Contract management
- Proposal software
- Accounting
- Full agency OS

The product must stay focused on **scope decisions and margin protection**.

---

## 8. Exact SOW Input Plan — LOCKED

The first experience is:

> **Define your project scope**

V1 inputs:
1. Paste text
2. PDF
3. DOCX
4. TXT

All must converge into one internal pipeline:

```text
Paste ──────┐
PDF ────────┤
DOCX ───────┼→ Normalize → Structured Scope
TXT ────────┘
```

Later adapters:
- screenshots
- email
- Gmail
- Outlook
- Slack
- Teams
- voice
- Google Drive
- Notion

These are **input adapters**, not separate intelligence systems.

---

## 9. Structured Scope Representation

Planned normalized structure:

```json
{
  "deliverables": [],
  "features": [],
  "exclusions": [],
  "revisionLimits": [],
  "timeline": {},
  "assumptions": []
}
```

Extract:
- Deliverables
- Features
- Exclusions
- Revision limits
- Timeline
- Assumptions

The original/normalized source remains available as evidence.

---

## 10. Scope Baseline

A `ScopeBaseline` belongs to a `Project`.

Conceptually:

```text
Organization
    ↓
Project
    ↓
ScopeBaseline
```

It stores:
- project
- version
- status
- source type
- source text
- structured scope JSON
- approval timestamp
- timestamps

Statuses:
- `DRAFT`
- `APPROVED`
- `ARCHIVED`

Source types:
- `PASTE`
- `PDF`
- `DOCX`
- `TXT`

### Why both sourceText and structuredScope?

The AI output is an interpretation, not the authoritative source.

```text
sourceText
+
structuredScope
```

This enables evidence, auditability, debugging and future grounding.

### Versioning

Scope is versioned from day one:

```text
v1 → original SOW
v2 → revised scope
v3 → later approved modification
```

Unique `(projectId, version)` prevents duplicate versions.

---

## 11. Current Technical Stack

- Next.js 16.3.5
- TypeScript
- React 19
- App Router
- Tailwind CSS v4
- shadcn/ui
- Base UI + Nova preset
- PostgreSQL
- Neon PostgreSQL
- Prisma 7.10.0
- Better Auth 1.7.4
- Vitest 5
- Gemini initially for AI development/testing
- Low-cost managed deployment planned
- Stripe later

### UI framework rule

This project uses **Base UI + Nova**, not Radix.

Base UI does not support Radix `asChild`.

Use:
```tsx
<DialogTrigger render={<Button />}>
```

For Button + Link:
```tsx
<Button
  nativeButton={false}
  render={<Link href="..." />}
/>
```

---

## 12. Prisma 7

Prisma 7 uses the PostgreSQL driver adapter:

- `@prisma/adapter-pg`
- `pg`

Generated client:
```text
lib/generated/prisma
```

Database client:
```text
lib/db/index.ts
```

---

## 13. Authentication / Multitenancy

Better Auth is the authentication foundation.

Flow:

```text
Sign up
   ↓
User / Session
   ↓
Onboarding
   ↓
Create Organization
   ↓
Owner Membership
   ↓
Dashboard
```

Email/password is sufficient for V1.

### Organization model

- Organization = agency/workspace
- User = authenticated person
- Member = user ↔ organization
- Client = organization-owned client
- Project = organization-owned project/client project

Hierarchy:

```text
Organization
├── Client
│    └── Project
│
└── Project
     └── ScopeBaseline
```

---

## 14. Tenant Isolation Rule — CRITICAL

Never trust an organization ID supplied by the browser.

Derive it from the authenticated session:

```text
Authenticated session
        ↓
activeOrganizationId
        ↓
database query
```

not:

```text
Browser → organizationId → database
```

Project access uses both:
- requested project ID
- authenticated organization ID

The same rule must apply to every future organization-owned resource:
- scopes
- requests
- decisions
- change orders
- margin data

---

## 15. Organization Creation

We deliberately chose explicit workspace creation.

Current onboarding:

> **What is the name of your agency?**

Do not add unnecessary onboarding questions such as agency size, role, project count or industry unless they later serve a real product purpose.

Better Auth creates the creator as owner by default.

---

## 16. Invitation Flow

Invitation acceptance/routing is now **tested and working**.

Flow:

```text
User A
  ↓
Organization
  ↓
Invitation
  ↓
User B logs in
  ↓
Server detects pending invitation
  ↓
Invitation page
  ↓
Accept
  ↓
Better Auth creates Member
  ↓
Organization becomes active
  ↓
Dashboard
```

We intentionally did **not** build:
- invitation management UI
- invite button
- email provider

The acceptance foundation was tested with disposable development database invitation data.

Proper invitation creation/email UX belongs later.

For production, revisit stronger invitation security and email verification.

---

## 17. Dashboard Routing

```text
/dashboard
    ↓
Authenticated?
 ├── NO → /login
 └── YES
       ↓
Active organization?
 ├── YES → dashboard
 └── NO
       ↓
Pending invitation?
 ├── YES → /invitation/[id]
 └── NO → /onboarding
```

---

## 18. Current Application Data

### Client

- id
- name
- email
- organizationId
- createdAt
- updatedAt

### Project

- id
- name
- value
- startDate
- targetEndDate
- organizationId
- clientId
- createdAt
- updatedAt

Dates are optional.

### ScopeBaseline

Conceptually:

```text
ScopeBaseline
├── id
├── projectId
├── version
├── status
├── sourceType
├── sourceText
├── structuredScope
├── approvedAt
├── createdAt
└── updatedAt
```

---

## 19. Current Product UI

The project page shows:
- project identity
- client
- project value
- start date
- target end date
- Scope section

The scope section now supports:

```text
Paste scope
    ↓
Server Action
    ↓
Validate project belongs to active organization
    ↓
Create ScopeBaseline
    ↓
DRAFT
```

The first user-facing concept is:

> **Define your project scope**

Paste is the first working input.

PDF/DOCX/TXT will later use the same pipeline.

---

## 20. Testing Foundation

Vitest is configured.

Scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Previously verified:
```text
2 test files
5 tests
5 passed
```

Tests cover:
- organization behavior
- project organization isolation

Manual testing confirmed:
- User B cannot access User A's project by URL.
- Invitation acceptance works end-to-end.

---

## 21. Development Methodology — LOCKED

Every meaningful feature should follow:

```text
1. Purpose
2. DB changes
3. Server/API
4. AI logic
5. UI
6. Error states
7. Security
8. Tests
9. Commit
```

Keep the app runnable after each meaningful step.

Use concise comments for important workflow/security decisions.

Git checkpoint:

```bash
git add .
git commit -m "..."
git push origin main
```

Always test/build before meaningful commits.

---

## 22. Development Data Policy

Current Neon data is disposable development/test data.

During development:

> Prefer a clean destructive reset when safe instead of overcomplicating data-preserving migrations.

Once real/customer data exists:

> Preserve customer data and use careful migrations.

---

## 23. Current Reported Repository Structure

The latest reported working tree is:

```text
scope-copilot/
├── AGENTS.md
├── CLAUDE.md
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma7.config.ts
├── README.md
├── skills-lock.json
├── tsconfig.json
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── dashboard/
│       │   └── page.tsx
│       └── projects/
│           ├── page.tsx
│           └── [projectId]/
│               └── page.tsx
├── components/
│   ├── dashboard/
│   │   └── stat-card.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── projects/
│   │   ├── project-card.tsx
│   │   └── project-form.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── separator.tsx
├── lib/
│   ├── projects.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260913182741_init/
│           └── migration.sql
└── public/
```

When continuing, inspect the actual current working tree before assuming a file exists or does not exist.

---

## 24. Milestone Checklist

### Foundation
- [x] Next.js application
- [x] TypeScript
- [x] Tailwind
- [x] shadcn/Base UI
- [x] PostgreSQL / Neon
- [x] Prisma
- [x] Better Auth
- [x] Sign up
- [x] Login
- [x] Logout
- [x] Sessions
- [x] Organizations
- [x] Organization creation
- [x] Owner membership
- [x] Invitation acceptance
- [x] Dashboard routing
- [x] Tenant isolation
- [x] Client model
- [x] Project model
- [x] Project isolation tests
- [x] ScopeBaseline model
- [x] Paste → ScopeBaseline persistence
- [x] Build passing
- [x] Tests passing

### Core Scope Product
- [x] Scope entry UI
- [x] Paste scope persistence
- [ ] Scope normalization
- [ ] AI scope extraction
- [ ] Structured scope display
- [ ] Human review/edit
- [ ] Scope approval
- [ ] Approved baseline
- [ ] PDF adapter
- [ ] DOCX adapter
- [ ] TXT adapter

### Scope Decision Engine
- [ ] Client request input
- [ ] Request parser
- [ ] SOW/request comparison
- [ ] Evidence grounding
- [ ] IN_SCOPE / COURTESY / REVIEW / MATERIAL_CHANGE / MAJOR_CHANGE
- [ ] Effort estimation
- [ ] Timeline impact
- [ ] Price recommendation
- [ ] Human override
- [ ] Tradeoff recommendation

### Later
- [ ] Scope drift
- [ ] Change orders
- [ ] Client approval
- [ ] Scope ledger
- [ ] Margin intelligence
- [ ] Simulator
- [ ] Retroactive recovery
- [ ] External integrations
- [ ] Predictive intelligence

---

## 25. First Real Product Definition of Done

> An agency can provide a real SOW, paste a real client request, receive a trustworthy scope decision grounded in actual scope evidence, see commercial impact, choose an action, and produce an approval-ready change request.

Until this works, avoid significant investment in billing, integrations, advanced team management, or marketing.

---

## 26. Exact Next Development Sequence

```text
Auth / Multitenancy
        ✅

Project foundation
        ✅

ScopeBaseline
        ✅

Paste scope
        ✅

        ↓ NEXT

Scope normalization
        ↓
AI extraction
        ↓
Validated structured scope
        ↓
Human review/edit
        ↓
Approved Scope Baseline
        ↓
PDF/DOCX/TXT adapters
        ↓
Client Request
        ↓
Scope Decision Engine
```

### Next session starts here

**Scope normalization + AI extraction.**

First objective:

```text
Raw scope text
      ↓
Normalize
      ↓
AI extraction
      ↓
Validate structured JSON
      ↓
Human review
```

Do not couple application logic directly to Gemini. Use an `AIProvider` abstraction so providers/models can change later.

---

## 27. Continuation Rules

1. Preserve the locked product direction.
2. Do not resurrect discarded product ideas or earlier brainstorming.
3. Inspect current source files before modifying them.
4. Do not introduce deferred features without a concrete reason.
5. Work incrementally, one meaningful feature at a time.
6. Make tenant isolation explicit for every new data-access path.
7. Test after every meaningful feature.
8. Keep Git checkpoints clean.
9. If a proposed change conflicts with a locked decision, flag it before implementing.
10. Keep the core product centered on **the decision around a client request**, not generic project management or AI novelty.

---

## 28. Current Session Ending State

```text
                    SCOPE COPILOT

                AUTH FOUNDATION
                      ✅
                       ↓
                 ORGANIZATION
                      ✅
                       ↓
                 MULTITENANCY
                      ✅
                       ↓
                 PROJECT DATA
                      ✅
                       ↓
               SCOPE BASELINE
                      ✅
                       ↓
                PASTE SCOPE
                      ✅
                       ↓
              ┌─────────────────┐
              │ NEXT: AI SCOPE │
              │    EXTRACTION   │
              └─────────────────┘
```

**Next development session should begin with scope normalization and AI extraction.**
