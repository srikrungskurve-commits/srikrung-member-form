# LINE Follow → Member Master: rollout checklist

Status: prepared only. No live Make/Cloudflare changes.

## Existing Make workflow (from reviewed setup)
Scenario: Srikrung Form Member
- Webhook 1 → Router 2: action == MEMBER_LINE_FOLLOW
- Data Store 82 Search records on Srikrung_Member_Master: line_user_id == incoming line_user_id; limit 1
- Router 83:
  - LINE_USER_ALREADY_EXISTS: 82.Key Exists → Data Store 84
  - LINE_USER_NOT_FOUND: 82.Key Does not exist → Data Store 85

## Before changing Make
1. Export/snapshot Member Master and capture Data Store structure and each record Key.
2. Inspect counts of duplicate line_user_id and whether the same identity exists under LINE_* and member_id keys.
3. Preserve routes used by member registration and vehicle permission checks.
4. Confirm LINE event authenticity at the receiving server; never trust line_user_id from an unauthenticated browser POST.

## Proposed behavior for each branch
- Existing LINE user: **do not run DS84 Add/replace** simply because follow event repeats. Continue with no write and optionally send a welcome response.
- New LINE user: DS85 creates a skeletal CUSTOMER record with a stable key; never overwrite a different existing Key.
- Guard against concurrent repeated follow events: Search→insert alone is not atomic. A duplicate-safe server endpoint or durable unique index is required before claiming strict 1 LINE = 1 customer.
- Member registration must reuse the same customer identity and avoid a separate member-keyed record. Do not change existing Keys without migration tests.

## Benefits form
The current line-follow-form.html already uses LIFF ID token and Cloudflare API endpoint /line-follow. Treat it as the benefits registration screen, not the server's LINE OA follow webhook.
When authenticated:
- Read by verified LINE user ID from the server; prefill full_name, phone, line_follow_referrer_id if stored.
- Update permitted contact fields in the **same record**, preserving member_id, member_status, referrer_member_id and vehicle-related rights.
- Never allow benefits form to make a member ACTIVE or silently replace the referral used for actual membership.
- Return explicit confirmed-write status; avoid treating HTTP 200 alone as proof of storage success.

## Test cases before Save / deployment
- Same follow event twice → one existing record, no update.
- Benefits submission after follow → enriches same record.
- Existing ACTIVE member follows again → membership and all other fields unchanged.
- Bad ID token or expired session → no read/write.
- Concurrent repeated events → cannot create two customer identities.
- Member edit later → same identity as follow and benefits.

## Execution boundary
GitHub code may be edited on feature branch, but the Make Scenario and live Data Store cannot be verified or updated through the connected GitHub tool. Changes to Make require inspection/access to its configuration. After each Make module change press Save; scenario save is not the same as Cloudflare Deploy.
