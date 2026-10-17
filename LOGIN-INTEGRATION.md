# Central Login — front-end handoff

Branch: `feature/central-login`. Entry: `login.html`. Existing member/customer and Admin pages are untouched. No authentication backend, fake users, local password database or local Session is included.

## Preview

Serve this repository with a static HTTP server and open `/login.html`. Expand the screen review controls below the card to inspect four layouts. Every review layout carries a visible warning and does not establish authentication. The default API configuration is disabled; submission reports that real authentication is not connected.

## Files

- `login.html`: four views plus verified password entry/completion steps.
- `assets/login.css`: responsive green/blue styling based on the supplied reference.
- `assets/login.js`: UI state, validation, loading/error handling and integration controller.
- `assets/login-api.mjs`: isolated, fail-closed API adapter.
- `assets/login-config.js`: API path (currently null), fixed destination and LINE authorization origin allowlist. No secrets.
- `tests/login-api.test.mjs`: adapter security/error tests. Run `node --test tests/login-api.test.mjs`.

## Proposed API contract (not existing endpoints)

Set `apiBase` to a same-origin path only after server integration and approval. No API is called while it is null. Deploy front end and reverse-proxied authentication API on the same origin. All responses must be JSON, with `Cache-Control: no-store`.

| Method/path relative to apiBase | Request | Required response |
| --- | --- | --- |
| GET `/session` | Session cookie | `{state:"authenticated", member_id, member_status:"ACTIVE", role:"MEMBER"\|"ADMIN"\|"SUB_ADMIN", last_login_at, device_label}` or `{state:"anonymous"}` or `{state:"expired"}` |
| POST `/login` | `{member_id,password}` | `{authenticated:true}` plus secure Session cookie; UI rechecks `/session` before navigation |
| POST `/logout` | `{}` | `{success:true}` only after server revokes current Session and clears cookie |
| POST `/password/line/start` | `{member_id}` | `{authorization_url}` on official LINE authorization origin |
| GET `/password/status` | Server-issued restricted verification cookie | `{verified:true}` only after secure LINE verification, matching bound member and ACTIVE check |
| POST `/password/complete` | `{password}` plus restricted cookie | `{success:true}` only after durable password update, proof consumption, Session revocation and required notification handling |

LINE callback must be handled by the server; redirect to `/login.html#password`. The hash merely selects the UI; no URL flag, token, LINE User ID, or browser storage proves verification. The server must manage OAuth state, nonce and PKCE as applicable, verify LINE tokens/signature and bind the one-time proof to the exact member and purpose. Do not use LINE User ID supplied in a URL as proof. Verification is checked again when completing the password change.

Server is authoritative for ACTIVE, role and resource permissions. Successful login/session must mean all eligibility checks passed, including Admin MFA when required. Authentication success does not grant access to existing unsecured Admin endpoints; protect them server-side before enabling destination navigation. `destination` is a fixed same-origin configuration value; `/member/` is a placeholder and must be replaced with an approved protected landing page. No destination accepts external/query-provided redirects.

Use password hashing with unique salt and an approved password KDF; the UI currently requires 15–128 characters and server must enforce a compatible policy. Reject compromised passwords. Use HttpOnly/Secure/SameSite cookies, server-side expiry/revocation, origin validation and CSRF protections on every mutation (the adapter sends a custom request header). Rate-limit and avoid account enumeration. Never log passwords or tokens. Notify linked LINE owner/Admin for password setup/change and new devices without exposing secrets. Device text and login time must come from the server; do not imply that the UI's sample text is a verified device.

## Remaining integration

Confirm Make Member Master schema/ACTIVE rules and bound LINE records; implement Worker auth endpoints and DB migrations; prepare isolated Staging secrets/tables; select Login domain, LINE callback, and protected landing page. Google Login and direct LINE sign-in buttons are present to match the reference, but deliberately have no active provider adapter. Clicking either displays a clear connection-not-ready message. `providerSignIn` in `assets/login.js` is the isolated integration point for those future flows; it must only be enabled with verified server-side account linking and ACTIVE/role checks. The separate LINE button on the password screen is for password verification. No registration flow is added.

Commit, push, changes to Cloudflare/Make/LINE, Staging deployment and Production deployment still require separate user approval.

## Front-end completion update

Additional files: `assets/login-validation.mjs`, `tests/login-validation.test.mjs`, `login-review.html`, `scripts/build-preview.mjs`, `.gitignore`. Run all tests with `node --test tests/*.test.mjs` (11 tests). The member ID check only rejects empty input, internal whitespace/control characters and lengths above 64; it does not assume a specific member code prefix. Password UI validation rejects mismatch, bounds violations and all-whitespace input; server enforcement is still mandatory.

`node scripts/build-preview.mjs <output-directory>` produces `login-standalone.html` with inline CSS/JS and no module file imports, plus a four-screen review. Open the standalone file directly in a browser for UI review without installing a server. Fonts fall back to system fonts in this offline deliverable. API remains null; it must not be enabled under a `file:` origin. The source files should be served over HTTP for further development and later HTTPS for actual use.

Review query `?review=login|welcome|expired|password` only selects a visibly labeled layout and skips all API initialization. It never establishes authentication. A separate review button exposes the new-password fields with an explicit unverified warning and does not set the LINE verification state. Matching passwords in this view still cannot be saved. No flag can force the completed state.

Unconfigured requests display a Thai message and do not send credentials. Malformed JSON, unsupported Session roles/non-ACTIVE responses, 401/403/429/503 responses, unsafe LINE origins and network failures fail closed. On every restored page (`pageshow`), real Session initialization is repeated when configured. Passwords are cleared on view changes, submission completion and when the document becomes hidden. Inputs support autocomplete, focus indicators, labels, required validation in Thai and keyboard use.

The current delivery scope is front-end only, per the latest user instruction to defer backend/Make/LINE integration. No Worker implementation, database changes, real account validation, LINE messages or publicly deployed preview is included. The review layouts are screenshots of actual running HTML/CSS, not evidence of an authenticated Session.


## First-time demo (isolated UI)
The First-time tab uses first-time-demo.mjs with DEMO0001/DEMO0002 only. It does not call the API, store passwords, create sessions, or change real LINE verification. Demo passwords are validated in memory and inputs cleared on navigation/completion/errors. Keep apiBase null for UI staging.
