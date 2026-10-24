import test from "node:test";import assert from "node:assert/strict";import {verifyLineIdToken} from "./line-follow-line-identity.js";
const channelId="2011453803",lineUserId="U"+"a".repeat(32);
test("accepts matching audience and verified subject",async()=>{
const fetchImpl=async()=>({ok:true,json:async()=>({aud:channelId,sub:lineUserId,exp:Math.floor(Date.now()/1000)+120,name:"Tester"})});
assert.equal((await verifyLineIdToken("a.b.c",{channelId,fetchImpl})).lineUserId,lineUserId);
});
test("rejects mismatched audience",async()=>{
const fetchImpl=async()=>({ok:true,json:async()=>({aud:"other",sub:lineUserId,exp:Math.floor(Date.now()/1000)+120})});
await assert.rejects(verifyLineIdToken("a.b.c",{channelId,fetchImpl}),/CLAIMS_INVALID/);
});
test("rejects rejected tokens",async()=>{await assert.rejects(verifyLineIdToken("bad",{channelId,fetchImpl:async()=>({ok:false})}),/INVALID/)});
