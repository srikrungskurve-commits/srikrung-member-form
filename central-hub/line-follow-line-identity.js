// Staging integration component; NOT installed into production Worker.
// Verify ID token on server, never trust a line_user_id from a browser request.
import {forwardVerifiedFollowToMake} from "./line-follow-make-transport.js";
export async function verifyLineIdToken(idToken,{channelId,fetchImpl=fetch}={}) {
  if(typeof idToken!=="string" || !idToken || !/^[0-9]+$/.test(String(channelId||""))) throw Error("MISSING_LINE_VERIFICATION_INPUT");
  const response=await fetchImpl("https://api.line.me/oauth2/v2.1/verify",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({id_token:idToken,client_id:String(channelId)}),redirect:"error"
  });
  if(!response.ok) throw Error("LINE_ID_TOKEN_INVALID");
  const result=await response.json();
  if(String(result.aud)!==String(channelId) || typeof result.sub!=="string" || !/^U[a-fA-F0-9]{32}$/.test(result.sub)) throw Error("LINE_ID_TOKEN_CLAIMS_INVALID");
  if(typeof result.exp!=="number" || result.exp <= Math.floor(Date.now()/1000)) throw Error("LINE_ID_TOKEN_EXPIRED");
  return {lineUserId:result.sub,displayName:typeof result.name==="string"?result.name:""};
}
export async function submitFollowAfterVerifiedLine(data,config) {
  const {lineUserId,displayName}=await verifyLineIdToken(data.id_token,{channelId:config.lineChannelId,fetchImpl:config.fetchImpl});
  return forwardVerifiedFollowToMake({
    verifiedLineUserId:lineUserId,displayName,fullName:data.full_name,phone:data.phone,
    followReferrerId:data.line_follow_referrer_id||"",submissionId:config.submissionId
  },{webhookUrl:config.makeWebhookUrl,workerAuth:config.workerAuth,fetchImpl:config.fetchImpl});
}
