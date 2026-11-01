import test from 'node:test';import assert from 'node:assert/strict';
import {hasPaidAccess,requirePaidRepository} from '../src/paid-access.js';
const active={status:'active',paymentVerified:true,accessUntil:2000};
test('unverified, expired, refunded, disputed and inactive payments cannot unlock access',()=>{
 assert.equal(hasPaidAccess(active,1000),true);
 for(const record of [null,{paid:true},{...active,paymentVerified:false},{...active,status:'incomplete'},{...active,status:'past_due'},{...active,accessUntil:1000},{...active,refunded:true},{...active,disputed:true}])assert.equal(hasPaidAccess(record,1000),false);
});
test('paid access stays bound to authenticated user and current repository membership',async()=>{
 let lookedUp;const options={userId:'user-a',installation:'1',repository:'2',now:1000,readEntitlement:async id=>{lookedUp=id;return active;},repositories:async()=>[{id:2}]};
 assert.equal((await requirePaidRepository(options)).repo.id,2);assert.equal(lookedUp,'user-a');
 await assert.rejects(()=>requirePaidRepository({...options,repositories:async()=>[]}),/no longer accessible/);
 await assert.rejects(()=>requirePaidRepository({...options,readEntitlement:async()=>null}),/Payment is required/);
 await assert.rejects(()=>requirePaidRepository({...options,userId:null}),/Sign in/);
});
