# Live hosted accounts update — 2026-10-30

The Vercel deployment now uses the official Supabase browser SDK via `src/hosted-client.js` and `src/hosted-auth.js`, built by `npm run build`. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel. Never use a secret/service-role key in this build. Sessions persist in browser storage and refresh through Supabase; future APIs must verify the token with Supabase and enforce their own tenant/paid checks.

Hosted email verification and recovery use Supabase default email links. Set Site URL to the verified live origin. Confirm email must stay ON. Default sending is limited to project team members; use admin@brickware.ai for the owner's first test. Configure custom SMTP before opening registration to customers. Real email flows still need owner validation.

The guide below describes the separate local Node foundation; its code-based emails and process-local cookies do not describe the hosted deployment.

# Account and GitHub milestone — local development

Run `npm start` from `app/`, then open http://localhost:4174. This is the customer-facing shell; the offline `map.html` remains a separate developer editor. Without service configuration, the shell explains that setup is needed and registration is disabled. It does not fake accounts, repositories or scan results.

## Managed email accounts (implementation recommendation: Supabase)

Create/configure a hosted Supabase project yourself; this work has not provisioned or purchased one. Copy `.env.example` to `.env` locally. Set `SUPABASE_URL` to your project URL and `SUPABASE_PUBLISHABLE_KEY` to its publishable/anon key. No service-role key is needed. Do not paste secrets into chat.

Enable email/password sign-in and **Confirm email**. Configure signup-confirmation and recovery email templates to display the OTP using `{{ .Token }}`. This implementation uses an email code entered into the app, not a browser-token-fragment link. Configure an appropriate email sender and production delivery limits before inviting users. Set a minimum password length of 12. Test delivery, verification, expired/reused codes, and reset against the real project; mocked tests do not prove email delivery.

Passwords are forwarded over HTTPS to managed Auth, never stored or logged by the app. Sessions use an opaque HttpOnly/SameSite cookie; provider tokens remain in server memory. Every protected request revalidates the user with Auth. Unverified accounts are rejected. Recovery sessions can only set a password and sign out until reset completes. Successful reset invalidates that user's sessions in this process.

Current limit: one process, volatile sessions, maximum one hour, no refresh flow. Restarting signs users out. Multi-instance persistence, durable revocation, account deletion, abuse/CAPTCHA controls, and operational monitoring are required before launch. Supabase token revocation semantics also require evaluation before production.

## GitHub App

Register a **GitHub App**, not an OAuth App. Set repository permissions to **Contents: read-only**, plus GitHub's mandatory **Metadata: read-only**; request no other permissions. The adapter rejects installations with additional or write permissions. Use these local URLs:

- Homepage: `http://localhost:4174`
- User authorization callback: `http://localhost:4174/api/github/callback`
- Installation setup URL: `http://localhost:4174`

Set `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` in `.env`. No private key is required for this slice: it uses GitHub App **user access tokens**, whose access is the intersection of the App and the user. These tokens stay on the server. OAuth uses a session-bound, one-use state and PKCE challenge; callbacks expire after ten minutes.

Install the App using **Only select repositories**. Sign in to Repo Made Clear, connect GitHub, use the repository installation link, then refresh access. All-repository, suspended, unrelated-App, over-permissioned installations are omitted. Repository lists and branch selection recheck current user/installation access. Pagination is bounded at 1,000 entries; larger lists fail explicitly rather than silently truncating.

Disconnection clears this process's connection and selection; it does not uninstall the App from GitHub. Users can revoke the App in GitHub settings. Expired/revoked tokens fail closed and require reconnection. Webhook-driven revocation, refresh tokens, persistent connections and repository deletion are not yet implemented.

## Payment and scan boundary

User reconfirmed: **both details and editing require payment**. This shell states that promise and never serves the developer editor, saved outputs, customer evidence, or private credentials. No price or checkout is invented. No request/body flag can turn on a paid plan. Project/scan routes currently reject requests because hosted project storage and scanning are not implemented; this is not a completed entitlement system.

After choosing a branch, the server verifies access and records the selected commit in the current session. The UI explicitly says no scan has run. Next work: bounded source intake, durable per-user projects and background jobs, unchanged-scan cache, static preview projection, server-side detail/edit/export entitlements, and verified payment webhooks. Before scanning, show the supported coverage, configured price/terms and limits and require acknowledgement. Current scanner supports explicit JS/TS imports only, not configuration-driven infrastructure.

## Validation

`npm test` includes account session, email verification, recovery isolation, same-origin/host guards, session expiry, bounded authentication requests, OAuth session binding/replay, repository access rechecks, and withholding protected data. Provider doubles are confined to tests. Live Supabase/GitHub authorization and emails require real configuration and have not been verified.

The server binds only to `127.0.0.1`; this milestone is local development. Keep APP_ORIGIN exact (localhost and 127.0.0.1 differ). Do not deploy the server as-is. Sessions and rate limits are process-local; production requires TLS, durable storage, shared limits, background workers, retention/deletion and security review.

Official references used:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.github.io/auth/
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
