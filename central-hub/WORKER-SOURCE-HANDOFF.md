# LINE Follow Worker: source handoff (next blocking step)

Target **only** Cloudflare Worker `srikrung-line-follow-api`, not `srikrung-admin-auth`.
The current GitHub code under `central-hub/` is staging components only; it is **not deployed or wired into the live Worker**.

## Work instructions
1. Open Cloudflare Workers & Pages and select the exact Worker `srikrung-line-follow-api`.
2. Read its current deployed source and binding **names** (not secret values); check route `POST /line-follow` and `POST /line-follow/status` if present.
3. Save an export of current source/route map as a secure local backup. Do **not** print or commit credentials, Make webhook URLs containing tokens, LINE secrets, or personally identifying records.
4. Identify how the Worker verifies LINE ID tokens, derives the verified LINE User ID, produces the submission ID, forwards to Make, parses reply, handles retries/status and CORS.
5. Compare with `central-hub/line-follow-line-identity.js`, `line-follow-make-contract.js`, and `line-follow-make-transport.js`. Report discrepancies before any replacement.
6. Do not edit/deploy Production. If a staging Worker exists, inspect staging configuration but do not assume secrets/bindings match.
7. If any editor changes occur: Save a version/draft and confirm; deployment is a separate action requiring approval.
8. Return a source-level change proposal and exact test plan, using TEST Make route only with no writes to `Srikrung_Member_Master`.

## Critical Make contract (confirmed from TEST handoff)
- `action = LINE_FOLLOW_FORM`, `request_timestamp` in epoch milliseconds rounded down to seconds.
- `worker_auth` only server-side, matching Make route secret; do not expose in LIFF client.
- 200 / `success:true,persisted:true`: confirmed only with matching submission and LINE user ID.
- 200 / `LINE_FOLLOW_ALREADY_COMPLETED`: no write; do not treat plain 200 as persistence.
- 409 / `LINE_USER_DUPLICATE_REVIEW`: stop, no retry.
- Unrecognized, non-JSON, timeout, 5xx: indeterminate; do not automatically duplicate the request.

## Current status
Routing passed 4/4 with simulated records on Make TEST. Real database read/write and live Worker end-to-end integration are NOT TESTED. Production deployment remains BLOCKED.
