// Pure DEMO data model. Not authentication, not a production database.
export function blankState(){return {customers:{},lineIndex:{},members:{},forms:{},events:[]};}
export function registerLine(state,lineId){
  if(!/^U[A-Za-z0-9_]{4,80}$/.test(lineId))throw Error("INVALID_LINE_ID");
  const existingId=state.lineIndex[lineId];
  if(existingId)return {customer_id:existingId,created:false};
  const id="DEMO-C"+String(Object.keys(state.customers).length+1).padStart(4,"0");
  state.customers[id]={customer_id:id,line_user_id:lineId,member_id:null,status:"CUSTOMER"};
  state.lineIndex[lineId]=id;
  return {customer_id:id,created:true};
}
export function createWebsiteCustomer(state){
  const id="DEMO-C"+String(Object.keys(state.customers).length+1).padStart(4,"0");
  state.customers[id]={customer_id:id,line_user_id:null,member_id:null,status:"CUSTOMER"};
  return id;
}
export function linkLineAfterVerifiedProof(state,customerId,lineId,verified){
  if(verified!==true)throw Error("VERIFICATION_REQUIRED");
  const c=state.customers[customerId];if(!c)throw Error("NOT_FOUND");
  if(state.lineIndex[lineId]&&state.lineIndex[lineId]!==customerId)throw Error("LINE_ALREADY_LINKED");
  if(c.line_user_id&&c.line_user_id!==lineId)throw Error("ALREADY_LINKED_TO_OTHER_LINE");
  c.line_user_id=lineId;state.lineIndex[lineId]=customerId;
}
export function activateMembership(state,customerId,memberId,referrerId){
  const c=state.customers[customerId];if(!c)throw Error("NOT_FOUND");
  if(c.member_id)throw Error("ALREADY_MEMBER");
  if(!/^[A-Z]{2}[0-9]{4,10}$/.test(memberId))throw Error("INVALID_MEMBER_ID");
  if(state.members[memberId])throw Error("DUPLICATE_MEMBER_ID");
  if(!referrerId||state.members[referrerId]?.status!=="ACTIVE")throw Error("REFERRER_NOT_ACTIVE");
  c.member_id=memberId;c.status="ACTIVE";state.members[memberId]={customer_id:customerId,status:"ACTIVE",referrer_member_id:referrerId};
}
export function saveForm(state,actorId,ownerId,moduleId,payload){
  if(!state.customers[actorId]||!state.customers[ownerId])throw Error("NOT_FOUND");
  if(actorId!==ownerId)throw Error("FORBIDDEN");
  if(!["benefits","member-profile"].includes(moduleId))throw Error("MODULE_NOT_ALLOWED");
  const key=ownerId+":"+moduleId;
  const old=state.forms[key];
  state.forms[key]={...payload,customer_id:ownerId,module_id:moduleId,version:(old?.version||0)+1};
  state.events.push({type:old?"UPDATE":"CREATE",key});
  return state.forms[key];
}
export function readForm(state,actorId,ownerId,moduleId){
  if(actorId!==ownerId)throw Error("FORBIDDEN");
  return state.forms[ownerId+":"+moduleId]||null;
}
