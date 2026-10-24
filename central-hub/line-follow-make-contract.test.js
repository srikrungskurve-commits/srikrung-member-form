import test from "node:test"; import assert from "node:assert/strict";
import {buildFollowMakePayload,interpretFollowMakeResponse} from "./line-follow-make-contract.js";
const args={verifiedLineUserId:"U12345",fullName:"คุณเอ",phone:"0812345678",submissionId:"lf1_123",workerAuth:"test-only"};
test("payload uses verified line ID and floored epoch ms",()=>{const x=buildFollowMakePayload({...args,now:1700000000999});assert.equal(x.request_timestamp,1700000000000);assert.equal(x.action,"LINE_FOLLOW_FORM");assert.equal(x.phone,"0812345678");assert.equal(x.line_user_id,"U12345")});
test("rejects invalid data before sending",()=>{assert.throws(()=>buildFollowMakePayload({...args,phone:"812345678"}));assert.throws(()=>buildFollowMakePayload({...args,workerAuth:""}))});
test("requires persistence proof, not HTTP 200 alone",()=>{assert.equal(interpretFollowMakeResponse(200,{success:true}).kind,"UNCONFIRMED");assert.equal(interpretFollowMakeResponse(200,{success:true,persisted:true,line_follow_status:"COMPLETED",submission_id:"lf1_abc"}).kind,"PERSISTED")});
test("handles already completed and duplicate separately",()=>{assert.equal(interpretFollowMakeResponse(200,{success:false,code:"LINE_FOLLOW_ALREADY_COMPLETED"}).kind,"ALREADY_COMPLETED");assert.equal(interpretFollowMakeResponse(409,{code:"LINE_USER_DUPLICATE_REVIEW"}).kind,"DUPLICATE_REVIEW")});
