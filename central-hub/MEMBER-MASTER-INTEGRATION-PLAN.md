# Member Master — approved integration plan (2026-10-24)

Scope approved: use existing `Srikrung_Member_Master` for LINE Follow, customer benefits registration, and customer/member identity lookup for Central Login. Integrate one workflow at a time. Member registration route changes last.

## Single identity record
- Immutable `customer_id` once assigned; `line_user_id` unique when present; `member_id` unique when assigned.
- A LINE Follow without registered membership is `CUSTOMER`, not `ACTIVE`.
- Never create another customer record merely because a benefits form or login event occurs.
- New fields are optional for older records; do not replace previously populated values with blanks.
- Make.com Data Store record **Key** migrations require an explicit, audited resolution strategy: LINE-only records and member-keyed records may currently coexist. Avoid blind add/replace and silent overwrite.
- Backfill any stable ID with a staged migration and duplicate scan. If atomic uniqueness cannot be enforced by Make.com Data Store, use a server-side identity layer / durable transactional index before production rollout.

## Entry points
1. LINE OA follow webhook: trusted LINE event, lookup by line_user_id, create lightweight identity only when absent. LINE User ID capture is *not* proof of website-session authentication.
2. Benefits form (name, phone, optional `line_follow_referrer_id`): operates on the existing LINE customer, fills missing values or updates approved fields only after authenticated ownership verification. Benefits registration is **related and belongs to the same Member Master**, but must not activate membership or change ACTIVE referrer.
3. Central Login: verify password/LINE proof server-side, read Member Master by immutable identity, create secure session and authorize access. Do **not** store password hashes, OTP secrets, or active sessions as general-purpose Member Master fields; use dedicated auth storage.
4. Member registration: only after the first two flows pass, refactor existing `CUSTOMER_MEMBER_REGISTER_CHECK`, `CHECK_REFERRER`, `MEMBER_CUSTOMER_REGISTER` to use the same identity and prevent duplicate members.

## Deployment gates, each independent
A. Record current schema, Data Store Key strategy and all Make Scenario readers/writers. Export a backup/snapshot.
B. Follow sandbox/staging: same LINE repeated -> one record; member record unchanged; no erasure.
C. Benefits sandbox/staging: same customer updated, referrer stored separately, no ACTIVE side effect.
D. Login sandbox/staging: verified identity; password/session in auth backend; denied users cannot access other customers.
E. Member route sandbox/staging: unique LINE/member constraints, ACTIVE referrer, edit versus insert semantics.
F. Only after explicit review, apply production configuration changes one small piece at a time; Save each Make module/Scenario, and Deploy only with approval.

## Current state
This document is a DESIGN checkpoint only. No Make.com Data Store record, Scenario, Cloudflare Worker or production login has been modified by this document.
