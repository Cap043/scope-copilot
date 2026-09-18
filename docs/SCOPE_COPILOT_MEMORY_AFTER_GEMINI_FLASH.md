# Scope Copilot — Project Memory & Technical Decision Log

**Last updated:** 2026-09-15  
**Current phase:** Step 5 — Extraction quality + atomicity tests

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

# 8. Exact SOW Input Plan — LOCKED

The first experience is:

> **Define your project scope**

### V1 inputs

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

### Later adapters

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

# 9. Scope Normalization & AI Extraction

This is the current development area.

The extraction pipeline is:

```text
Raw SOW text
      ↓
Normalize
      ↓
Gemini extraction
      ↓
Validate structured JSON
      ↓
Validate source evidence
      ↓
Human review/edit
      ↓
Approved Scope Baseline
```

Important principle:

> AI proposes scope; the agency owns and approves the scope.

The raw SOW must remain untouched.

The structured scope is an interpretation of the SOW, not the authoritative source.

---

## 10. Normalized Scope Contract

Current normalized structure:

```json
{
  "deliverables": [],
  "features": [],
  "exclusions": [],
  "clientResponsibilities": [],
  "revisionLimits": [],
  "timeline": {},
  "assumptions": []
}
```

Each extracted item uses source evidence.

Typical item structure:

```json
{
  "title": "Homepage",
  "description": "...",
  "sourceReferences": [
    {
      "quote": "homepage",
      "section": "Statement of Work"
    }
  ]
}
```

### Categories

#### Deliverables

Concrete things the agency agrees to produce or deliver.

#### Features

Specific functionality, behavior, or capability included in the project.

#### Exclusions

Explicitly excluded functionality, deliverables, or work.

#### Client Responsibilities

Explicit actions or obligations assigned to the client.

Examples:
- provide logo
- provide photography
- provide hosting access
- approve designs

#### Revision Limits

Explicit limits on revisions, corrections, or review rounds.

#### Timeline

Contains:
- duration
- start condition
- dependencies

#### Assumptions

Explicit project assumptions, constraints, or planning premises.

---

# 11. Extraction Quality Rules — LOCKED

The Gemini extraction prompt is intentionally strict.

### Absolute atomicity

Every extracted item must represent exactly **one independently understandable scope concept**.

Complex sentences and comma-separated lists should be split into atomic concepts.

Example:

Bad:

```text
Responsive website with homepage, about, classes, trainers and contact pages
```

Good:

```text
Homepage
About page
Classes page
Trainers page
Contact page
```

Likewise:

Bad:

```text
Contact form with email delivery and Google Maps
```

Good:

```text
Contact form
Email delivery
Google Maps
```

### Mutually exclusive categories

A concept must belong to exactly one category.

Never duplicate the same concept across:

- deliverables
- features
- exclusions
- clientResponsibilities
- revisionLimits
- timeline
- assumptions

### Client Responsibilities vs Assumptions

Use this tie-breaker:

**Client Responsibility**
- Explicitly states that the client must provide, perform, approve, supply, or grant access to something.

**Assumption**
- Describes a condition, constraint, expectation, or premise under which the project is planned.

Explicit client action/obligation → `clientResponsibilities`.

Project condition/premise/limitation → `assumptions`.

Never duplicate the same concept in both.

---

# 12. Evidence Validation — CRITICAL

Every extracted item must contain at least one source reference.

Every `sourceReferences.quote` must be an **exact literal substring** of the original SOW.

The validator currently uses:

```ts
sourceText.includes(reference.quote)
```

Do **NOT** weaken this validation by normalizing whitespace.

Do not:
- paraphrase quotes
- rewrite grammar
- normalize punctuation
- correct spelling
- reconstruct text
- join words across line breaks

The source evidence must be directly traceable to the original SOW.

### Duplicate evidence rule

The same exact source quote must not be reused to represent multiple extracted concepts.

This prevents one piece of SOW evidence from silently supporting unrelated concepts.

---

# 13. Current Evidence Issue

The real Flash Lite extraction test exposed an important edge case.

The SOW contains line breaks inside phrases.

For example:

```text
trainer
information
```

Gemini sometimes returns:

```text
trainer information
```

which fails:

```ts
sourceText.includes("trainer information")
```

The prompt was strengthened to explicitly preserve whitespace and line breaks.

That fixed some cases.

The latest run still failed on:

```text
Invalid source reference: "trainer information"
```

while other line-break evidence was preserved correctly.

Therefore:

> **Do not weaken the validator. Continue improving the extraction prompt/model behavior instead.**

---

# 14. Current Planned Prompt Improvements

Before moving on from Step 5, add/verify a prompt section requiring:

```text
### EVIDENCE MUST PRESERVE LINE BREAKS INSIDE PHRASES

When an evidence phrase crosses a line break in the SOW, the quote MUST
include that line break exactly as it appears.

If words are separated by a newline in the original source, do not join them.

The validator performs a literal substring match against the original SOW.
A semantically correct quote is still invalid if its characters or
whitespace do not match the source exactly.
```

Also strengthen timeline dependency atomicity:

```text
### TIMELINE DEPENDENCY ATOMICITY

Each independently meaningful timeline dependency MUST be represented
as a separate dependency.

If multiple dependencies appear in one sentence, split them into
separate dependencies.

Each dependency should have supporting evidence that directly covers
that dependency.
```

---

# 15. Current Gemini Setup

AI provider abstraction is used so application logic is not directly coupled to Gemini.

Current model:

```env
GEMINI_MODEL=gemini-flash-lite-latest
```

Provider fallback:

```ts
model: process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest"
```

Reason:

Stronger Gemini Flash models produced free-tier rate/availability problems during development.

Flash Lite is currently sufficient for development/testing.

This is **not necessarily the final production model**.

---

# 16. Current Extraction Implementation

Main files:

```text
lib/
├── scope-schema.ts
├── ai/
│   ├── gemini-schema.ts
│   ├── gemini.ts
│   ├── provider.ts
│   └── scope/
│       └── extract.ts
```

### `lib/scope-schema.ts`

Contains:

- Zod normalized scope schema
- `NormalizedScope` type
- source-reference validation

The validator checks:

1. Every quote exists literally in `sourceText`.
2. Timeline references are also validated.
3. Duplicate exact quotes are rejected.

---

# 17. Current Real Extraction Test

Manual script:

```text
scripts/test-scope-extraction.ts
```

Run with:

```bash
node --env-file=.env --import tsx scripts/test-scope-extraction.ts
```

Current deliberately clumped test SOW:

```text
STATEMENT OF WORK — EXTRACTION QUALITY TEST

The agency will build a responsive website for the client. The website
will include a homepage, about page, classes page, trainers page,
pricing page, and contact page.

The website features will include a contact form, Google Maps,
Google Analytics, SEO metadata, and CMS editing for class and trainer
information.

The client will provide the logo, brand colors, photography, trainer
information, written content, hosting access, and timely feedback and
approvals.

The project excludes user accounts, online booking, payment processing,
e-commerce functionality, mobile applications, workout tracking,
member dashboards, CRM integration, and marketing automation.

The project includes two rounds of design revisions and one round of
minor content corrections.

The project will be completed within five weeks after kickoff, subject
to the client providing required content and assets and approving
designs on time.

The project assumes approximately six primary pages, approval of the
CMS structure before implementation, no custom backend beyond the CMS
and contact form, final content before implementation, and standard
third-party service behavior.
```

---

# 18. Latest Real Extraction Result

Latest run produced:

### Deliverables

7 atomic items:

- Homepage
- About page
- Classes page
- Trainers page
- Pricing page
- Contact page
- Responsive website

### Features

5 items:

- Contact form
- Google Maps
- Google Analytics
- SEO metadata
- CMS editing for class and trainer information

The CMS quote correctly preserved its newline:

```text
CMS editing for class and trainer
information.
```

### Exclusions

9 items:

- User accounts
- Online booking
- Payment processing
- E-commerce functionality
- Mobile applications
- Workout tracking
- Member dashboards
- CRM integration
- Marketing automation

### Client Responsibilities

7 items:

- Provide logo
- Provide brand colors
- Provide photography
- Provide trainer information
- Provide written content
- Provide hosting access
- Provide timely feedback and approvals

### Revision Limits

2 items:

- Two rounds of design revisions
- One round of minor content corrections

### Timeline

- five weeks
- kickoff
- client providing required content and assets
- approving designs on time

### Assumptions

5 items:

- approximately six primary pages
- approval of the CMS structure before implementation
- no custom backend beyond the CMS and contact form
- final content before implementation
- standard third-party service behavior

### Current failure

The validator rejected:

```text
trainer information
```

because that phrase crosses a newline in the original SOW.

Error:

```text
Extraction failed: Error: Gemini returned invalid source references.
```

This means the extraction is **much better**, but Step 5 is not finished yet.

---

# 19. Temporary Debugging Code

During evidence debugging, `extractScope()` temporarily contains:

```ts
if (!validateScopeSourceReferences(parsed.data, trimmedText)) {
  console.dir(parsed.data, { depth: null });
  throw new Error("Gemini returned invalid source references.");
}
```

Once the evidence issue is resolved, remove the temporary `console.dir`.

---

# 20. Tests

Current test suite:

```text
6 files
20 tests
20 passing
```

Tests currently cover:

- organization behavior
- project organization isolation
- scope schema
- Gemini provider
- extraction pipeline
- extraction quality
- atomicity
- duplicate evidence detection
- invalid source references

Latest status:

```text
20/20 passing
```

PostgreSQL SSL warning is present but not a test failure.

Important:

> Automated tests currently mock Gemini/provider behavior. The manual real-model extraction script is required to evaluate actual Gemini behavior.

---

# 21. Extraction Quality Tests

Current quality tests include:

### Atomicity

A deliberately clumped SOW with five comma-separated features must result in five feature objects.

### No duplicate evidence

Different concepts with different exact source quotes must remain unique.

### Duplicate evidence rejection

If Gemini uses the same exact source quote for multiple concepts/categories, extraction must fail.

This is intentional.

---

# 22. ScopeBaseline

Database model:

```prisma
model ScopeBaseline {
  id String @id @default(cuid())
  projectId String
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  version Int @default(1)
  status String @default("DRAFT")
  sourceType String
  sourceText String @db.Text
  structuredScope Json
  approvedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, version])
  @@index([projectId])
}
```

Statuses:

- `DRAFT`
- `APPROVED`
- `ARCHIVED`

Source types:

- `PASTE`
- `PDF`
- `DOCX`
- `TXT`

The database persistence exists, but **do not continue building persistence/review UI until Step 5 is considered sufficiently locked**.

---

# 23. Why `sourceText` + `structuredScope`?

The AI output is an interpretation.

The original SOW remains authoritative.

```text
sourceText
    +
structuredScope
```

This enables:

- evidence
- auditability
- debugging
- human review
- future grounding
- future RAG/retrieval

Structured scope is the canonical approved memory.

RAG is a future retrieval layer, not the underlying scope memory.

---

# 24. RAG Decision

Do not add RAG yet.

Preferred future architecture:

```text
Approved ScopeBaseline
        ↓
Structured scope = canonical memory
        +
Source chunks/evidence = retrieval layer
        ↓
Hybrid retrieval
        ↓
Decision Engine
```

For small SOWs, structured retrieval/context may be enough.

Vector retrieval becomes more useful when there are:

- large SOWs
- many versions
- amendments
- many requests
- long project histories
- external documents

Do not embed the entire SOW blindly and call that the product's memory.

---

# 25. Current Technical Stack

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
- `@prisma/adapter-pg`
- `pg`
- Better Auth 1.7.x
- Vitest 5
- Gemini via `@google/genai`
- `tsx`

---

# 26. UI Framework Rule

This project uses:

> **shadcn/ui + Base UI + Nova**

Not Radix.

Base UI does not support Radix `asChild`.

For Dialog trigger:

```tsx
<DialogTrigger render={<Button />}>
```

For Button + Next.js Link:

```tsx
<Button
  nativeButton={false}
  render={<Link href="..." />}
/>
```

Do not blindly use Radix examples.

---

# 27. Prisma 7

Prisma 7 uses:

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

# 28. Authentication / Multitenancy

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

Organization represents the agency/workspace.

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

# 29. Tenant Isolation — CRITICAL

Never trust an organization ID supplied by the browser.

Derive it from the authenticated session:

```text
Authenticated session
        ↓
activeOrganizationId
        ↓
database query
```

Not:

```text
Browser → organizationId → database
```

Every future organization-owned resource must follow the same rule:

- scopes
- requests
- decisions
- change orders
- margin data

Project access must use:

- requested project ID
- authenticated organization ID

---

# 30. Current Repository Structure

Relevant current structure:

```text
scope-copilot/
├── .env
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── components.json
├── eslint.config.mjs
├── package.json
├── prisma7.config.ts
├── tsconfig.json
├── vitest.config.mts
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── (auth)/
│   │   ├── invitation/
│   │   ├── login/
│   │   ├── onboarding/
│   │   └── signup/
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   └── projects/
│   │       ├── actions.ts
│   │       ├── page.tsx
│   │       └── [projectId]/
│   │           ├── actions.ts
│   │           └── page.tsx
│   │
│   └── api/
│       └── auth/
│
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   ├── projects/
│   │   └── scope/
│   │       └── scope-input.tsx
│   └── ui/
│
├── lib/
│   ├── auth-client.ts
│   ├── auth-session.ts
│   ├── auth.ts
│   ├── organization-access.ts
│   ├── organization.ts
│   ├── projects.ts
│   ├── scope-schema.ts
│   ├── scope.ts
│   ├── utils.ts
│   ├── ai/
│   │   ├── gemini-schema.ts
│   │   ├── gemini.ts
│   │   ├── provider.ts
│   │   └── scope/
│   │       └── extract.ts
│   ├── db/
│   │   └── index.ts
│   └── generated/
│       └── prisma/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── scripts/
│   └── test-scope-extraction.ts
│
├── tests/
│   ├── organization.test.ts
│   ├── project-isolation.test.ts
│   ├── scope-schema.test.ts
│   ├── gemini-provider.test.ts
│   ├── scope-extraction.test.ts
│   └── extraction-quality.test.ts
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT.md
    ├── PRODUCT.md
    └── SCOPE_COPILOT_MEMORY.md
```

When continuing, inspect the actual working tree before assuming a file exists or does not exist.

---

# 31. Development Methodology — LOCKED

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

Keep the app runnable after every meaningful step.

Use concise comments explaining important workflow/security decisions.

Do not dump huge amounts of code unnecessarily.

When changing code, clearly identify:

- exact file
- exact section
- what to replace/add
- why the change is necessary

---

# 32. Git Workflow

Use:

```bash
git add .
git commit -m "..."
git push origin main
```

Always test/build before meaningful commits.

Previous major checkpoint:

```text
Add Gemini SOW extraction pipeline
```

That commit was successfully pushed.

**Do not create a new commit tonight.**

Tomorrow, after Step 5 is complete:

1. Run tests.
2. Run build if appropriate.
3. Inspect Git diff/status.
4. Commit.
5. Push.

---

# 33. Development Data Policy

Current Neon data is disposable development/test data.

During development:

> Prefer a clean destructive reset when safe instead of overcomplicating data-preserving migrations.

Once real/customer data exists:

> Preserve customer data and use careful migrations.

---

# 34. Current Roadmap Position

```text
[1] Model configuration                  ✅
[2] Normalized scope contract             ✅
[3] Gemini extraction                     ✅
[4] Evidence validation                   ✅
[5] Extraction quality + atomicity tests ← CURRENT
[6] Persist normalized extraction
[7] Scope review/edit UI
[8] Scope approval
[9] Scope version foundation
[10] Client request intake
[11] Request → scope comparison
[12] Decision engine
[13] Effort / cost / margin impact
[14] Recommended action
[15] Client-safe response
[16] Scope Drift Radar
[17] Margin intelligence
[18] RAG / external integrations when justified
```

---

# 35. What Is Already Done

```text
Auth
  ↓
Organizations
  ↓
Tenant isolation
  ↓
Project foundation
  ↓
ScopeBaseline
  ↓
Paste scope
  ↓
Gemini extraction
  ↓
Normalized scope schema
  ↓
Evidence validation
  ↓
Automated extraction-quality tests
```

Current automated status:

```text
20/20 tests passing
```

---

# 36. EXACT NEXT SESSION START

Do **not** jump to persistence or Review UI immediately.

First continue Step 5.

Run:

```bash
node --env-file=.env --import tsx scripts/test-scope-extraction.ts
```

The immediate remaining issue is Gemini evidence fidelity around line breaks.

Specifically:

```text
trainer
information
```

must not become:

```text
trainer information
```

The validator remains strict.

After fixing/testing this:

```text
Real Gemini extraction
        ↓
Evidence validation
        ↓
Atomicity verification
        ↓
Full test suite
        ↓
Step 5 complete
        ↓
Step 6 — Persist normalized extraction
```

---

# 37. Important Current Decision

Do **not** endlessly optimize Gemini extraction.

The goal of Step 5 is:

> Make extraction sufficiently trustworthy and deterministic that the human review layer can safely correct edge cases.

The human review/edit stage is intentionally part of the product.

We do not need perfect AI extraction before building it.

But the following must remain non-negotiable:

- no hallucinated scope
- atomic concepts
- mutually exclusive categories
- literal evidence grounding
- duplicate evidence rejection
- structured output validation

---

# 38. Continuation Rules

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
11. Do not weaken evidence validation to accommodate model mistakes.
12. Prefer deterministic application validation over trusting AI output.
13. Do not add RAG prematurely.
14. Do not build PDF/DOCX/TXT adapters until the paste extraction pipeline is stable enough.
15. Keep the raw SOW untouched.
16. Treat the approved structured scope as canonical product memory.
17. Use concise comments for important workflow/security logic.
18. Avoid unnecessary architectural complexity.
19. Keep the app runnable after each meaningful change.
20. Do not commit/push unfinished Step 5 work.

---

# 39. Current Session Ending State

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
                AI EXTRACTION
                       ✅
                        ↓
             EVIDENCE VALIDATION
                       ✅
                        ↓
          EXTRACTION QUALITY TESTS
                       ↓
                 CURRENT STEP 5
                       ↓
          Fix remaining evidence edge
                       ↓
             Full test verification
                       ↓
          STEP 6: PERSIST EXTRACTION
```

**Next development session begins with the remaining Step 5 extraction-quality/evidence issue.**

Do not change the roadmap.

Do not jump ahead.

Do not resurrect discarded ideas.

Continue from the exact current state above.