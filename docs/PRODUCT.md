# Scope Copilot — Product Context

## Product

**Working name:** Scope Copilot
**Category:** AI-powered scope decision and margin intelligence SaaS

## Core Problem

Small agencies regularly receive client requests that are difficult to classify:

* Is this already included?
* Is it reasonable to absorb as a courtesy?
* Should we charge?
* Should we remove something else to make room?
* Should we defer it?
* How much time and money will it actually cost?
* What happens to the project timeline and margin?

Existing scope-management products tend to focus on detecting scope creep and generating change orders.

Scope Copilot focuses on the decision **before** the change order:

> "A client asked for something. What should I actually do?"

## Core Promise

> Before you say yes to a client request, know what it will cost you.

Alternative positioning:

> Stop doing client extras for free.

## Target Customer

Primary:

* Small web-development agencies
* US / UK / Canada / Australia initially
* Approximately 2–15 people
* Approximately $2k–$25k projects
* Multiple active projects

Secondary:

* Shopify developers
* Webflow agencies
* Software consultancies
* Design studios
* Branding agencies
* AI automation agencies

## Core Decision Model

Requests can be classified as:

* `IN_SCOPE`
* `COURTESY`
* `REVIEW`
* `MATERIAL_CHANGE`
* `MAJOR_CHANGE`

Recommended actions:

* `ABSORB`
* `CHARGE`
* `SWAP`
* `DEFER`

The AI should not simply say "out of scope = charge client."

It should consider effort, project economics, agency policy, scope evidence, history, and available tradeoffs.

## Core Differentiators

### 1. Scope Decision Engine

Answers:

> What should I do about this request?

Rather than only:

> Is this in or out of scope?

### 2. Tradeoff Engine

Shows alternatives such as:

* Charge for the additional work
* Absorb it as a courtesy
* Swap another deliverable
* Defer it to a later phase

### 3. Scope Drift Radar

Detects cumulative small requests.

Example:

7 individually minor requests → 6.8 hours → approximately $1,020 of unpriced work.

The product should recognize the cumulative commercial impact.

### 4. Agency Scope Policy

Agencies can define rules such as:

* <30 minutes → courtesy
* 30–90 minutes → review
* > 90 minutes → usually charge

The system should eventually learn from the agency's historical decisions.

### 5. Evidence-Based Decisions

AI decisions should reference actual scope evidence:

* deliverables
* exclusions
* revision limits
* assumptions
* previous approved changes

Avoid unsupported claims and hallucinated contract language.

### 6. Impact Analysis

Meaningful requests should show:

* estimated effort
* timeline impact
* dependencies
* suggested price
* margin impact
* recommended action

### 7. Client-Safe Negotiation

Internal recommendation and client-facing communication are separate.

Internal:

> Charge approximately $1,400.

Client-facing:

Professional, concise language explaining the requested change and its impact.

## Example

Project:

* Acme Website
* $5,000
* 6 weeks

SOW:

* 5 pages
* CMS
* contact form
* 2 revisions
* authentication explicitly excluded

Client request:

> "Can we add customer login and order history?"

Potential analysis:

* Classification: `MATERIAL_CHANGE`
* Confidence: high
* Evidence: authentication is excluded from the SOW
* Estimated effort: 12–16 hours
* Timeline: +3–4 days
* Suggested price: $1,200–$1,600
* Recommendation: `CHARGE`
* Alternative: `SWAP` another deliverable

## Product Principle

The product should help an agency make a commercially intelligent decision while preserving the client relationship.

It should never behave like an aggressive "scope police" tool.

## AI Principle

AI is used where reasoning, extraction, comparison, estimation, and communication provide genuine value.

Do not add AI merely for marketing.

## Human Control

AI recommendations are advisory.

The agency/user makes the final decision.

For ambiguous requests, prefer:

`REVIEW`

rather than pretending to know the answer.

The system should use language such as:

> "Likely outside the current scope"

rather than making binding legal determinations.

## Long-Term Vision

Scope Copilot should evolve from a request analyzer into an agency's scope and margin intelligence layer:

SOW → Request → Decision → Tradeoff → Change → Approval → Scope Ledger → Drift → Margin Intelligence → Predictive Risk

