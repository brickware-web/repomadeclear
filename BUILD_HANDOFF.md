# Build handoff — 2026-10-30

## Repository boundary repair and live GitHub validation

Created a dedicated Git repository at /Users/kyaryeh/Documents/git/repomadeclear after GitHub Desktop incorrectly picked up the parent repository and unrelated sibling projects. Parent Git repository was not modified. Root ignore rules exclude local secrets, private keys, dependencies, build output and scan artifacts.

GITHUB_CLIENT_SECRET is now configured in Vercel Production; deployment dpl_E7XeoByu1sY2mAJVEkXx8zXkKMmM is ready. User completed live OAuth authorization and installed App 5550419 with selected repository brickware-web/repomadeclear, installation 177088622. Live picker displays that installation and repository. GitHub repository was verified empty, so no branches exist yet. Hosted scanning remains unimplemented. These facts supersede credentials-pending notes below.

## Hosted GitHub connection — credentials pending, 2026-10-30

User confirmed email delivery and successful verified sign-in; screenshot shows signed-in account. Both domains validated in Vercel and custom-domain HTTPS signup loaded. Supabase Site URL is now https://www.repomadeclear.com (save toast verified).

User registered GitHub App `repo-made-clear` under brickware-web. App ID 5550419, client ID Iv23li0TML7YRHUcHKJY. Requested permissions Contents read and mandatory Metadata read; public installability; webhook disabled; expiring user tokens left enabled. Both www.repomadeclear.com/github/callback and repomadeclear.vercel.app/github/callback registered. User explicitly chose to submit registration themselves. Latest UI: zero client secrets and zero key pairs; GitHub says a private key must be generated before installation. Owner must create credentials and store GITHUB_CLIENT_SECRET in Vercel Production, not chat. The private key is not consumed by this user-token implementation but GitHub requires it for installing the App.

Implemented and deployed `/api/github` Vercel function, authenticated against Supabase on every request, exact host/origin checks, PKCE and browser binding, one-use state atomically consumed in Postgres, user-bound expiring JWE encryption of GitHub tokens, selected-repository/read-only installation checks, branch and access revalidation, durable selection metadata, local disconnect. Tokens expire after at most 8 hours and require reconnect; refresh/webhook revocation are still future work. No scanning or paid data routes are exposed. Disconnect deletes the saved connection but does not uninstall or revoke the GitHub App; UI discloses that distinction.

Migration app/migrations/001_github_connections.sql applied to dedicated Supabase project. RLS ON; direct reads/writes revoked from authenticated and anon; narrow RPC uses auth.uid() exclusively, no user-id parameter, encrypted payloads, atomic one-use state and 30 calls/minute/user. Live SQL checks returned true for RLS, blocked direct reads, blocked direct writes, and blocked anonymous RPC. This is connection storage, not a completed project/scan tenant data layer. Automated API tests use in-memory store doubles; live OAuth and cross-user integration acceptance remain pending credentials.

31 tests and hosted build pass. Deployment dpl_J8Ku4LKMUYXJg64iUcBKVGgDmAPu ready; public GET /api/github returns intended Method not allowed JSON. Vercel Production has GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_CLIENT_ID and generated server-only GITHUB_TOKEN_ENCRYPTION_KEY. GITHUB_CLIENT_SECRET is missing, so backend/status and UI fail closed with GitHub unavailable. After owner saves secret, redeploy and validate installation/OAuth/repository/branch flow with selected repository only. Never expose encryption key or client secret to browser build.

Canonical source saved in VS Code app/. Temporary deployment staging /private/tmp/rmc-github-build. GitHub auto-deploy remains disconnected. Original Site preserved.

## Live managed accounts — 2026-10-30

Dedicated Supabase project `ylefxstaiqvnhksbcapa` (Repo Made Clear, Brickware AI) is healthy. The older `bpcjvcusgfuykwghqrme` belongs to another app and was not changed. New project's email signup enabled, anonymous signup disabled, email confirmation required (verified live settings endpoint). Supabase Site URL was set to https://repomadeclear.vercel.app; custom-domain follow-up is in progress.

Published managed browser authentication with official @supabase/supabase-js. Hosted client supports password signup/login, email confirmation links, recovery links, password update, local signout, persisted sessions and automatic refresh. Hosted sessions use Supabase's browser storage, not the earlier process-local Node cookie implementation. Browser state is NOT authorization for repository data or paid actions. All hosted repository/scan/payment features remain unavailable; no protected data or backend routes were published. Future hosted APIs must independently validate access tokens and enforce tenant/paid permissions.

Build: `scripts/build-hosted.js` bundles only account UI/assets and safe config, rejects non-publishable keys, uses Vercel production SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. `vercel.json` permits browser connections only to the dedicated project. Original local Node server remains separate. Code saved in VS Code project; GitHub auto-deploy still not connected. 25 automated tests passed. Live public signup rendering and provider configuration verified; actual email delivery, signup, login, refresh and recovery end-to-end await the owner entering their own password. No account was created by the agent.

Supabase's current default sender only delivers to team members (initial test admin@brickware.ai); custom SMTP is required for customer emails and editable templates. Hosted UI uses default email LINKS, not the older local code templates. Custom SMTP, production data access, paid entitlement, GitHub connection and scanning remain outstanding.

Domain: user purchased/attached repomadeclear.com and www.repomadeclear.com. GoDaddy A @ changed from Parked to 216.198.79.1 (TTL600); CNAME www changed from repomadeclear.com to 360ddf4293bbaa0a.vercel-dns-017.com (TTL3600), exactly matching Vercel requirements. Both saves confirmed. Nameservers and other DNS records preserved. Vercel apex redirects 308 to www. Propagation/TLS verification pending at this note.

## Vercel website preview — 2026-10-30

User requested launch on Vercel. Published https://repomadeclear.vercel.app in `brickware-webs-projects/repomadeclear`. Public HTTP check returned 200; `/api/config` reports all services unavailable and `/api/session` reports signed out. This is a static design preview, not working hosted authentication/scanning or production readiness. Supabase was still provisioning during account setup; no Supabase credentials were deployed.

Reproducible preview configuration: `app/vercel.json` runs `node scripts/build-preview.js`, output `dist/`. Build copies only three web assets and explicit unavailable-service JSON responses. No scanner artifacts, evidence, secrets or backend are published. Existing local Node app remains unchanged. Deployment used an allowlisted temporary staging directory and Vercel CLI, not GitHub; GitHub auto-deploy is NOT connected and the parent-Git-root caution still applies. For later Git import, choose `app` as Root Directory after explicitly publishing the actual project code.

Next: finish Supabase setup and replace volatile sessions with hosted persistent sessions before enabling real accounts on Vercel. Do not simply add credentials to this static preview and claim authentication works.

## Design update — 2026-10-30

User requested the supplied Vercel screenshots as a visual reference: minimal monochrome account screen first, and a spacious marketing homepage reached by clicking the top-left logo. Implemented in `app/src/web/` with a custom nested-diamond SVG mark. Default `/` shows login; `#home` shows marketing; `#signup`, `#login`, `#recover`, and `#verify` preserve account flows. Homepage sections include product, workflow, and transparent pricing availability. No unsupported social-login buttons or customer logos were added. Both details and editing stay paid. Service setup is still required.

All 20 existing tests pass. Browser verification confirmed sign-in rendering, diamond-to-home navigation and home-to-signup navigation at a narrow viewport. Desktop CSS is responsive; no external service configuration or deployment was performed.

## Current implementation status — account/GitHub foundation, 2026-10-30

Canonical working project is now `/Users/kyaryeh/Documents/git/repomadeclear`; this is the folder open in VS Code. The older LineageTracing copy is not the active application workspace. Its existing Site was preserved.

User reconfirmed the journey and explicitly answered: **details and editing both paid**. Free users get only a static high-level map. Keep paid detail/edit/export checks on the server when those endpoints are built.

Implemented this milestone in `app/`:
- Customer shell at `http://localhost:4174`, started with `npm start`. The previous developer map preview on port 4173 is a separate tool and was not replaced.
- Managed Supabase Auth adapter (implementation recommendation) for email/password registration, sign-in, verification codes, recovery codes and password update. No password storage or custom password hashing. Server-held provider tokens, opaque HttpOnly cookies, email-confirmation checks, recovery isolation, session expiry, same-origin/host checks and bounded requests.
- GitHub App user authorization with PKCE and one-use session-bound callback state. Installation/repository/branch selection checks both user and App access, selected repositories, and Contents/Metadata read-only permissions. Rechecks access when saving selection; tokens remain server-side. Local disconnect implemented.
- No fake success paths. Without configuration, registration is disabled with a setup message. A selected branch does not trigger a scan. Customer routes do not serve developer maps, scan outputs or protected details.
- Twenty automated tests pass. Seven new tests cover account/security/provider boundaries using test doubles; thirteen previous scanner/editor tests still pass.
- Local browser check passed for the unconfigured customer shell: page rendering, recovery and code view switching, and disabled registration. Screenshot: `/private/tmp/repo-made-clear-account-screen.png`. Live email delivery and real GitHub OAuth were NOT tested because credentials are not configured.

Read `app/ACCOUNTS_SETUP.md` and `.env.example` next. No external accounts, GitHub App, email sender or paid services were created. Do not request secrets in chat; the owner configures them in the ignored local `.env`. Supabase Confirm email must be enabled and confirmation/recovery templates must include the email code. GitHub setup uses the callback URL documented in the guide.

Limitations: volatile single-process sessions/connections, no refresh, no durable users/projects/scan jobs/entitlements, no hosted source intake, no paid checkout, no webhooks, no production revocation/deletion workflow. All project/scan routes currently fail closed as unavailable; this is NOT a finished paywall. Production authentication, user/tenant isolation, webhook replay and payment bypass acceptance remain outstanding. Scanner scope is still explicit JS/TS source imports; configuration extraction is not implemented.

Next: configure and live-test managed email and GitHub App; build bounded GitHub source intake, persistent tenant-owned projects and background scans, unchanged-scan cache and quotas; serve a strictly limited static preview; then implement verified payment entitlements for detail/edit/export and paid rescans. Determine actual terms and prices before scans/payment go live. Representative repository validation and the three-owner pilot gate remain open.

Repository caution: `git rev-parse --show-toplevel` still returned `/Users/kyaryeh/Documents/git`, the parent of the intended project. Do not stage, commit, pull or push from the parent tree. No Git publishing or remote changes were made in this milestone.

## Prior scanner/editor milestone — 2026-10-30

The local extraction and human-editing slices are implemented in `app/`. Read `app/README.md` for precise scope and commands. The existing Site remains unchanged. Stage 1 customer validation is still outstanding; stage 2's edit/rescan model and offline editor are implemented, with browser acceptance still pending.

- Scanner version 0.2.0 / schema version 2 reads committed Git objects without executing source. Each source file and explicit ES reference has a fingerprint; evidence includes repository, branch, commit and line range. Connection IDs survive harmless line shifts. Changed resolved destinations are detected even when import text stays identical.
- The scanner now rejects an empty/nested folder that would silently fall back to a parent Git repository. Environment and secret-like files remain excluded. Resource caps remain enforced; no AI calls are made.
- The local map editor provides component and connection selection, separate human explanations/rationale, custom components/edges, connection correction, drag/keyboard layout changes, and separate edit-file save/load. Human assertions are clearly labeled; reconnected arrows do not inherit detected evidence.
- Original findings are immutable. Human edits and layout are separate collections with author/time metadata. Rescans preserve edits and flag changed/missing evidence. Missing evidence cannot be acknowledged as current. Local browser storage is optional convenience; use an edits JSON file as the portable backup across scans.
- Thirteen automated tests pass, including real temporary Git rescan sequences, overlay preservation/conflicts, evidence and secret exclusions, input limits, parent-folder scope protection, import context validation, generated-script syntax and CSP/escaping checks.
- Latest actual application-source snapshot: five scanned files, twelve references, 74 ms, $0 AI usage. Artifact: `app/output/51d07b824e1ffef22a2061b7a32096dad4a88f58/map.html`. This is internal verification, not customer validation. Synthetic cases remain confined to tests.
- Browser visual/interaction QA was attempted but blocked by browser URL policy for local file URLs. Do not claim it passed. Verify the map manually in a browser (see README checklist).
- The user supplied `https://github.com/brickware-web/repomadeclear` and `/Users/kyaryeh/Documents/git/repomadeclear/`. After the user made GitHub public, connected API access succeeded and the commit API reported an empty repository. The local folder was empty and Git was falling back to its parent. Neither destination was changed; no code was published or pushed.
- No deployment, authentication, GitHub App, billing, paid entitlement or tenant isolation exists. This offline map contains protected details and must not be used as a free customer preview. Source findings are not overwritten on repeat output, but early cache lookup and hosted scan-frequency enforcement remain unfinished.
- No paid service provisioned. App and root docs remain local without a configured backup remote. The public empty GitHub repository is not yet a backup of this project.

Next: browser QA of the local editor, then real representative repository extraction/owner review. Continue to separately stored authenticated overlays when accounts arrive. Preserve the three-repository pilot validation gate and test server access/paid entitlements before customer use. Publishing this local code to the now-public repository requires a separate explicit request; do not include scan outputs or customer evidence.

## Original handoff context

Read `AGENTS.md` and `PROJECT_BRIEF.md`. The original documentation-only handoff below records the agreed staged direction.

Suggested next-chat request:
> Read AGENTS.md, PROJECT_BRIEF.md, and BUILD_HANDOFF.md in this project. Start building Repo Made Clear in app/. First deliver a bounded real repository scanner and an evidence-backed map using a representative supported repository. Preserve the old Site. Follow the staged plan and keep the $500 budget in mind. Do not substitute demo findings for real scan results.

## Verified local starting state

- Root: `/Users/kyaryeh/Documents/ChatGPT/LineageTracing`.
- Existing prototype: `sites/clearbrief/dist/index.html`, `style.css`, `app.js`.
- Existing Site: https://clearbrief-tech-updates-ky.yikpuitim1999.chatgpt.site/
- Existing prototype git checkout was clean before these root documents were added. The workspace root is not itself a git repository; these new documents are local and are not yet backed up by the nested Site repository.
- Inspection confirms a fictional workflow, browser-local notes, export/presentation tools, and public GitHub metadata/root package.json inspection. It does not implement the proposed authenticated scanner.
- No domain registration, hosting migration, account purchase, code-access credential setup, or deployment was performed today.

## Recommended development setup

Use Codex on this local project as the primary coding assistant; free VS Code is optional for viewing/editing files. Use ChatGPT chat for planning/copy/product feedback. Keep Sites as the existing visual prototype, rather than assuming its current static implementation provides the server jobs, custom auth, secure GitHub integration, and payment enforcement required here.

Recommended architecture, to validate at implementation: TypeScript/React web application, a mature interactive graph library, managed email/password auth and Postgres, a server-side GitHub App integration, a background scanner, and hosted payment checkout with verified webhooks. React Flow and an automatic layout library are candidates, not purchased dependencies. Choose hosting after measuring scanner runtime/memory, rather than assuming every scan fits a short web request.

## Build sequence and acceptance

1. **Extraction feasibility.** Define supported file patterns and graph schema. Analyze a small representative authorized repository without executing it. Output nodes, typed edges, file/line evidence, commit, and coverage gaps. Negative fixture proves an unused package does not become a confirmed integration. Measure runtime and expected scan cost.
2. **Map and human edits.** Show overview and expandable details, save custom notes/components/edges and layout separately. Prove rescan preserves edits and flags stale evidence. Use fixture data only when visibly labeled in development.
3. **Accounts and real GitHub connection.** Email verification/reset, selected-repo installation, repository/branch picker, background scan status, access revocation and deletion. Verify project isolation and repository access for each signed-in user.
4. **Preview and payment.** Free static preview; paid details/edit/export endpoints check server-side entitlement. Choose actual offer/price before configuring live checkout. Verify signed, idempotent payment webhooks; no entitlement from a redirect alone. Test unpaid API requests, duplicate events, cancellation policy, and scan abuse limits.
5. **Pilot and launch readiness.** Three representative users/repositories, understandable failure states, export, support/contact, retention/deletion policy, privacy/terms, monitoring, usage caps. Review secrets handling and access control before real customer code. Deploy only a clearly described readiness level.

## Costs and tool choice

Verified official pages on 2026-10-30:
- OpenAI pricing: https://learn.chatgpt.com/docs/pricing — Plus $20/month with Codex, usage limits; Pro from $100/month. Subscription usage is limited and optional extra credits/API-key billing differ. Existing user's actual plan is unknown.
- Cursor: https://cursor.com/pricing — current page lists Free, Plus $8/month (Grok only), Premium $30/month, Super $100, Ultra $200. Third-party models are billed separately by usage. Do not quote stale $20 Pro pricing without rechecking.
- VS Code: https://code.visualstudio.com/docs/supporting/faq — free for private/commercial use. Full Visual Studio is not necessary for this web app.

Recommendation: use an existing eligible Codex subscription first, or budget $20/month for Plus if appropriate. Do not buy both Cursor and an upgraded Codex plan at the outset. No promise that Plus covers all weekly development; measure actual consumption before upgrading.

Distinguish (1) coding-assistant subscription/overages, (2) the app's model/API usage serving customers, (3) hosting/database/email/processing, and (4) payment processing fees. Do not assume a personal subscription gives unlimited production inference. Recheck available credits and commercial integration terms before choosing production model access.

Illustrative $500 cash envelope, not quotes or purchase authorization:
- Domain reserve $25, ownership not yet confirmed.
- Three months coding tool reserve $60, less if already covered.
- Hosting/database/email/processing reserve $120.
- Product AI testing reserve $45.
- Contingency $250.
Total $500, excluding founder labor and taxes. Costs can exceed this without limits; defer paid infrastructure until needed and enforce quotas. A small pilot operating estimate of $40–125/month from prior discussion is an estimate, excludes coding subscription and payment fees, and must be replaced by measured costs.

Reduce tokens by retaining these handoff docs, using small completed milestones, sending relevant code excerpts rather than whole repos to explanation models, caching by commit/content hash, and regenerating only changed explanations. Use stronger models for difficult analysis only after measuring quality; do not select a model based on cost alone. Record actual token usage and cost per scan.

## Important product judgments

The paywall is the user's chosen flow, not validated conversion research. A visible sample explanation on a separate demo may help sell the benefit without changing the locked customer preview. Recommend experiments, but do not silently change the user's paywall.

Eraser already offers interactive architecture maps; click-to-expand is not a proven competitive advantage. Test whether evidence-backed plain-English reporting plus durable human context solves a paying customer's recurring need.

User corrections must never become fabricated code evidence. Store internal scan timestamps now even though the full history UI is later. Screenshots of a visible map cannot be reliably blocked.

Logo refinement — 2026-10-30: user supplied a precise mark reference. Header and hero now use a thin black outer diamond outline, a white gap, and a solid black inner diamond. Replaced the earlier thick nested mark.

Local test bypass was removed at the user’s request on 2026-10-30. Normal managed-auth login remains required.
