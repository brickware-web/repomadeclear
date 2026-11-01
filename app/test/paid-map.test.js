import test from 'node:test';import assert from 'node:assert/strict';
import {paidMap} from '../src/paid-map.js';import {credentialVault} from '../src/github-store.js';
const config={encryptionKey:'ab'.repeat(32)},user={id:'alice'},repository={id:12,full_name:'org/repo'},body={action:'details'};
test('unpaid detail and edit calls return no findings and never query scan storage',async()=>{for(const action of ['details','edit'])await assert.rejects(paidMap({config,user,repository,body:{action}},{payments:{paid:async()=>({paid:false}),db:{from(){throw Error('must not read');}}}}),e=>e.status===402);});
test('paid findings remain bound to the authenticated account and repository',async()=>{
 const scan={repository:'org/repo',branch:'main',nodes:[],edges:[],commit:'a'.repeat(40),scannerVersion:'test'};
 const vault=credentialVault(config.encryptionKey),envelope=await vault.seal({scan},'alice','scan',60);
 const filters=[];const payments={paid:async()=>({paid:true}),db:{from:table=>({select:()=>({eq:(column,value)=>{filters.push([column,value]);return {maybeSingle:async()=>({data:table==='rmc_scans'?{envelope,scan_key:'one'}:null})};}})})}};
 const result=await paidMap({config,user,repository,body},{payments});assert.equal(result.scan.repository,'org/repo');assert.ok(filters.every(([c,v])=>c==='user_id'&&v==='alice'));
 await assert.rejects(paidMap({config,user:{id:'bob'},repository,body},{payments}),e=>e.status===403);
 await assert.rejects(paidMap({config,user,repository:{...repository,full_name:'org/other'},body},{payments}),e=>e.status===403);
 await assert.rejects(paidMap({config,user,repository,body:{action:'edit',version:99}},{payments}),e=>e.status===409);
});
