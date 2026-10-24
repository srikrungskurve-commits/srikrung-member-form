// Safe staging-only mapping of LINE Follow + benefits into the same customer record.
// Not a Make.com/Cloudflare connector; no external writes.
export function upsertLineCustomer(store, lineId) {
  if (!/^U[A-Za-z0-9_]{4,80}$/.test(lineId)) throw Error("INVALID_LINE");
  const matches = store.filter(x => x.line_user_id === lineId);
  if (matches.length > 1) throw Error("DUPLICATE_LINE_REQUIRES_REVIEW");
  if (matches.length === 1) return {created:false,record:matches[0]};
  const record = {customer_id:"C"+String(store.length+1).padStart(6,"0"),line_user_id:lineId,member_id:null,member_status:"CUSTOMER",full_name:null,phone:null,line_follow_referrer_id:null};
  store.push(record);
  return {created:true,record};
}
export function updateBenefits(store,lineId,verifiedLineId,data) {
  if (lineId !== verifiedLineId) throw Error("NOT_AUTHENTICATED_AS_OWNER");
  const matches=store.filter(x=>x.line_user_id===lineId);
  if (matches.length !== 1) throw Error(matches.length?"DUPLICATE_LINE_REQUIRES_REVIEW":"CUSTOMER_NOT_FOUND");
  if(typeof data.full_name!=="string"||!data.full_name.trim()||typeof data.phone!=="string"||!/^0[0-9]{9}$/.test(data.phone)) throw Error("INVALID_BENEFITS_DATA");
  const r=matches[0];
  if(data.line_follow_referrer_id!==undefined && data.line_follow_referrer_id!==null && data.line_follow_referrer_id!=="" && !/^[A-Za-z0-9_-]{1,64}$/.test(data.line_follow_referrer_id)) throw Error("INVALID_FOLLOW_REFERRER");
  // Complete all validation before mutating the existing record.
  r.full_name=data.full_name.trim();r.phone=data.phone;
  if(data.line_follow_referrer_id!==undefined && data.line_follow_referrer_id!==null && data.line_follow_referrer_id!=="") r.line_follow_referrer_id=data.line_follow_referrer_id;
  return r; // do not alter member_id, status or membership referrer
}
