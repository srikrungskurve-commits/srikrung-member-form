// Contract derived from inspected Make TEST route. No secret values or live requests.
// The caller must verify LINE ID token server-side before supplying verifiedLineUserId.
const nonempty = (x) => typeof x === "string" && x.trim().length > 0;
export function buildFollowMakePayload({verifiedLineUserId, fullName, phone, displayName="", followReferrerId="", submissionId, workerAuth, now=Date.now()}) {
  if (!nonempty(verifiedLineUserId) || !/^U[A-Za-z0-9_-]+$/.test(verifiedLineUserId)) throw Error("INVALID_VERIFIED_LINE_ID");
  if (!nonempty(fullName) || [...fullName.trim()].length > 120) throw Error("INVALID_NAME");
  if (typeof phone !== "string" || !/^0[0-9]{9}$/.test(phone)) throw Error("INVALID_PHONE");
  if (typeof followReferrerId !== "string" || !/^[A-Za-z0-9_-]{0,64}$/.test(followReferrerId)) throw Error("INVALID_FOLLOW_REFERRER");
  if (!nonempty(submissionId)) throw Error("INVALID_SUBMISSION_ID");
  if (!nonempty(workerAuth)) throw Error("MISSING_WORKER_AUTH");
  if (!Number.isFinite(now)) throw Error("INVALID_TIMESTAMP");
  return {action:"LINE_FOLLOW_FORM", worker_auth:workerAuth, request_timestamp:Math.floor(now/1000)*1000,
    line_user_id:verifiedLineUserId, full_name:fullName.trim(), phone,
    line_display_name:String(displayName||""), line_follow_referrer_id:followReferrerId,
    submission_id:submissionId};
}
export function interpretFollowMakeResponse(httpStatus, body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return {kind:"UNCONFIRMED", retryAutomatically:false};
  if (httpStatus === 200 && body.success === true && body.persisted === true &&
      body.line_follow_status === "COMPLETED" && nonempty(body.submission_id))
    return {kind:"PERSISTED",submissionId:body.submission_id,retryAutomatically:false};
  if (httpStatus === 200 && body.code === "LINE_FOLLOW_ALREADY_COMPLETED" && body.success === false)
    return {kind:"ALREADY_COMPLETED",retryAutomatically:false};
  if (httpStatus === 409 && body.code === "LINE_USER_DUPLICATE_REVIEW")
    return {kind:"DUPLICATE_REVIEW",retryAutomatically:false};
  return {kind:"UNCONFIRMED",retryAutomatically:false};
}
