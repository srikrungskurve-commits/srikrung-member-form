// Demo-only connector. No network access and no real customer data.
import {readForm,saveForm,activateMembership} from "./identity-model.js";
export function createMemberConnector(state,actorCustomerId){
  function current(){const c=state.customers[actorCustomerId];if(!c)throw Error("NOT_FOUND");return c}
  return {
    getProfile(){
      const c=current();
      return {customer_id:c.customer_id,member_id:c.member_id,status:c.status,details:readForm(state,actorCustomerId,actorCustomerId,"member-profile")};
    },
    registerMember({member_id,referrer_member_id}){
      current();
      activateMembership(state,actorCustomerId,member_id,referrer_member_id);
      return this.getProfile();
    },
    updateProfile({full_name,phone}){
      const c=current();
      if(!c.member_id)throw Error("MEMBERSHIP_REQUIRED");
      if(typeof full_name!=="string"||!full_name.trim())throw Error("INVALID_NAME");
      if(typeof phone!=="string"||!/^0[0-9]{9}$/.test(phone))throw Error("INVALID_PHONE");
      saveForm(state,actorCustomerId,actorCustomerId,"member-profile",{name:full_name.trim(),phone});
      return this.getProfile();
    }
  };
}
