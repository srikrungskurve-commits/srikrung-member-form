// Staging-only Worker -> Make transport. Integrate only AFTER reviewing the real
// sr ikrung-line-follow-api Worker and preserving its ID-token verification.
// Never expose MAKE_WORKER_AUTH or Make webhook URL to browser clients.
import {buildFollowMakePayload,interpretFollowMakeResponse} from "./line-follow-make-contract.js";
export async function forwardVerifiedFollowToMake(input, {webhookUrl,workerAuth,fetchImpl=fetch,timeoutMs=12000}={}) {
  if (typeof webhookUrl!=="string" || !/^https:\/\//.test(webhookUrl)) throw Error("INVALID_MAKE_WEBHOOK_URL");
  // No network request is made when input validation fails.
  const payload=buildFollowMakePayload({...input,workerAuth});
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetchImpl(webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),redirect:"error",signal:controller.signal});
    let body=null;
    try {body=await response.json()} catch { /* 200 Accepted and HTML are unconfirmed */ }
    const result=interpretFollowMakeResponse(response.status,body,payload.submission_id);
    if (result.kind==="PERSISTED" && body.line_user_id!==payload.line_user_id)
      return {kind:"UNCONFIRMED",retryAutomatically:false};
    return result;
  } catch {
    // The write could have succeeded before timeout: never blindly resubmit.
    return {kind:"UNCONFIRMED",retryAutomatically:false};
  } finally {clearTimeout(timeout)}
}
