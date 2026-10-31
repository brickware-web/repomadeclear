# Repo Made Clear

Updated: 2026-10-30. This records today's product decisions; it does not imply implementation or customer validation.

## Identity and purpose

Chosen name: **Repo Made Clear**. Chosen domain: **repomadeclear.com**. A previous registry check returned no registration record; purchase and ownership remain unconfirmed.

User's category: **Lineage Tracing software**. Initial scope is software relationships/architecture tracing, not a guarantee of field-level database lineage or complete runtime tracing.

Audience: nontechnical stakeholders, particularly people receiving board presentations. Primary operator: a technical lead who prepares and reviews the explanation. Buyer and pricing remain hypotheses.

Promise: **Connect your GitHub repository and get an interactive map of your software, with plain-English explanations and evidence behind each connection.**

## Confirmed customer journey

1. Register and sign in with email and password.
2. Connect GitHub and grant access to selected repositories.
3. Select a repository and branch.
4. Scan supported code and configuration.
5. Show a clear high-level diagram as a free preview. Before paying, users cannot open component detail, move or reconnect arrows, edit, or export/download through the application.
6. After payment, unlock interactive explanations, connections and evidence, and editing capabilities.
7. Rescan to see what changed, subject to usage limits that still need definition.

Payment unlock is a confirmed product direction, but conversion effectiveness is untested. A visible preview cannot be protected against screenshots or all browser copying. Use a static preview and server-authorized paid operations; never advertise absolute copying prevention. Free preview scan costs need quotas and abuse controls.

## Human editing is part of the core product

Technical users can add missing components/connections, edit explanation text, move components, reconnect arrows, and add design rationale or context unavailable in code. Plain-English explanations remain available in the paid product.

Separate three layers:
- Scan findings: source evidence and machine-derived relationships.
- Human overlays: corrections, custom components/edges, explanations, and design decisions, labeled with author and update time.
- Presentation layout: positions, grouping, and collapsed/expanded views.

Rescanning must not silently overwrite human work. Keep overrides and mark removed/changed source evidence for review. Manual assertions are labeled as such, not presented as scanner-verified. Review timestamps are not proof of compliance.

## Diagram expectations and honest limits

Reference: user-provided screenshot of nested AWS regions/VPCs/subnets/services and arrows. Adopt nested grouping and progressive drilldown, with a simple overview for nontechnical viewers.

Code and manifests can establish some application relationships. Infrastructure files can describe deployment topology. Actual cloud deployment, cross-repository links, runtime-only calls, failover, and spending may require additional sources. A dependency declaration is not proof of active use. Each arrow has a relationship type, not an assumed execution order.

Do not request .env secrets as input. Safe variable names, source references, deployment configuration, and sanitized examples can help analysis. Explanations must show evidence, uncertainty, scan timestamp, and unsupported coverage. No fabricated costs or business outcomes.

## Proposed MVP boundaries — recommendations, not validated facts

- One connected GitHub identity/installation context and one selected repository per map initially.
- JavaScript/TypeScript with a documented subset of Next.js/Node patterns and selected database/external-service integrations.
- Managed accounts, selected-repo access, background scans, static preview, payment entitlement, expandable map, manual overlays, basic export, and manual rescan.
- A consistent diagram style; readable by nontechnical viewers.
- Store scan commit/time and basic diff data immediately. Full version browsing is later.
- Build reliable extraction before adding AI paraphrases. AI may help explain supported findings; it must not invent graph edges.

Later, as requested: switch between multiple GitHub connections using a switcher; multiple chart designs; user-facing versions and timestamp history. Clarify later whether “multiple GitHubs” means accounts, organizations, repositories, or all three. Do not imply a cross-repository graph is included automatically.

Deferred: live cloud discovery, actual billing imports, all programming languages, formal governance/compliance verification, enterprise SSO, automated board-impact assertions.

## Constraints and validation

$500 initial cash budget; 8–10 hours/week; target at least $2,000/month owner profit before personal tax, with labor tracked separately. No customers or payments established in this chat.

Recommended first gate: spend no more than $100 incremental cash and 30–40 hours on extraction feasibility and representative testing. Test three supported repositories with their technical owners, check connection accuracy and manual repair effort, then observe nontechnical comprehension. Seek a paid pilot before broadening support. Track hypothesis → source/test → result → decision → next action.

Unknowns: target customer's actual stack and repo size, willingness to grant code access, price and billing interval, scan quotas, refund policy, exact initial export format, model/provider, domain ownership, current coding subscription, deployment provider. Resolve only when a milestone depends on them.
