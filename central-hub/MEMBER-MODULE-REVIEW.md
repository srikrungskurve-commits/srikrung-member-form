# First member module — inspection notes

Checked repository main/index.html against Central Hub demo.

1. The original form validates a proposed member ID using CUSTOMER_MEMBER_REGISTER_CHECK.
2. The form checks referrer with CHECK_REFERRER.
3. The final submit uses MEMBER_CUSTOMER_REGISTER.
4. The existing editData() function navigates backwards from preview, retaining unsent field values. It is not an update of a previously saved member.
5. Central Hub currently uses browser-only simulated records. The mock member button does not call the original form.
6. The demo LINE-first route and login-first route may create distinct mock customer entries. Do not silently combine them based on matching text.

Next required work: develop a shared connector interface for getProfile(), registerMember() and updateProfile() with a mock implementation first. Later, a verified server-side connector can replace the mock.

Acceptance: repeated use opens the same customer profile, cannot register twice, updates preserve member ID, and denied users cannot read someone else's data.

Keep all changes on feature/central-hub-demo-v1. Do not modify live Data Stores or deploy production.
