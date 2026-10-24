import test from "node:test";import assert from "node:assert/strict";import {forwardVerifiedFollowToMake} from "./line-follow-make-transport.js";
const input={verifiedLineUserId:"U12345",fullName:"Example Person",phone:"0812345678",submissionId:"lf1_abc"};
test("forwards validated POST to Make and accepts matching receipt",async()=>{
 let req;const fakeFetch=async (url,options)=>{req={url,options};return {status:200,json:async()=>({success:true,persisted:true,line_follow_status:"COMPLETED",submission_id:"lf1_abc",line_user_id:"U12345"})}};
 const r=await forwardVerifiedFollowToMake(input,{webhookUrl:"https://example.invalid/hook",workerAuth:"test-secret",fetchImpl:fakeFetch});
 assert.equal(r.kind,"PERSISTED");assert.equal(req.options.method,"POST");assert.equal(JSON.parse(req.options.body).request_timestamp%1000,0);
});
test("does not accept a different LINE user receipt",async()=>{
 const fetchImpl=async()=>({status:200,json:async()=>({success:true,persisted:true,line_follow_status:"COMPLETED",submission_id:"lf1_abc",line_user_id:"UOTHER"})});
 assert.equal((await forwardVerifiedFollowToMake(input,{webhookUrl:"https://example.invalid/hook",workerAuth:"test-secret",fetchImpl})).kind,"UNCONFIRMED");
});
test("non-JSON and timeouts are unconfirmed; never auto retry",async()=>{
 const fetchImpl=async()=>({status:200,json:async()=>{throw Error("not JSON")}});
 const r=await forwardVerifiedFollowToMake(input,{webhookUrl:"https://example.invalid/hook",workerAuth:"test-secret",fetchImpl});
 assert.deepEqual(r,{kind:"UNCONFIRMED",retryAutomatically:false});
});
