import test from "node:test";
import assert from "node:assert/strict";
import {blankState,createWebsiteCustomer} from "./identity-model.js";
import {createMemberConnector} from "./member-connector.js";
test("register once, retrieve and edit stored profile",()=>{
 const s=blankState(),id=createWebsiteCustomer(s);
 s.members.CH0001={customer_id:"SEED",status:"ACTIVE"};
 const api=createMemberConnector(s,id);
 assert.equal(api.getProfile().member_id,null);
 api.registerMember({member_id:"AM00010",referrer_member_id:"CH0001"});
 assert.throws(()=>api.registerMember({member_id:"AM00011",referrer_member_id:"CH0001"}),/ALREADY_MEMBER/);
 assert.equal(api.updateProfile({full_name:"ทดสอบ หนึ่ง",phone:"0812345678"}).details.version,1);
 assert.equal(api.updateProfile({full_name:"ทดสอบ สอง",phone:"0812345678"}).details.version,2);
 assert.equal(api.getProfile().member_id,"AM00010");
 assert.equal(Object.keys(s.customers).length,1);
});
test("cannot update before membership activation",()=>{
 const s=blankState(),id=createWebsiteCustomer(s);
 assert.throws(()=>createMemberConnector(s,id).updateProfile({full_name:"ทดสอบ",phone:"0812345678"}),/MEMBERSHIP_REQUIRED/);
});
