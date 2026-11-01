import test from 'node:test';import assert from 'node:assert/strict';import Stripe from 'stripe';import {Readable} from 'node:stream';import {stripeWebhook} from '../src/stripe-webhook.js';
const key='sk_test_placeholder',secret='whsec_test',stripe=new Stripe(key);
async function send(handler,event,override){const payload=JSON.stringify(event);const req=Readable.from([payload]);req.method='POST';req.headers={'stripe-signature':override||stripe.webhooks.generateTestHeaderString({payload,secret})};const res={setHeader(){},end(){}};await handler(req,res);return res.statusCode;}
test('signed webhook retries are idempotent audit events, never entitlement writes',async()=>{
 const rows=new Map();const db={from(table){assert.equal(table,'rmc_payment_events');return {async upsert(row,options){assert.deepEqual(options,{onConflict:'event_id',ignoreDuplicates:true});if(!rows.has(row.event_id))rows.set(row.event_id,row);return {error:null};}};}};
 const handler=stripeWebhook({key,secret,serviceKey:'placeholder'},{db,stripe});const event={id:'evt_one',type:'invoice.paid',livemode:false};
 assert.equal(await send(handler,event),200);assert.equal(await send(handler,event),200);assert.equal(rows.size,1);
 assert.equal(await send(handler,{...event,livemode:true}),400);assert.equal(await send(handler,event,'invalid'),400);assert.equal(rows.size,1);
});
test('webhook storage errors request Stripe retry rather than reporting success',async()=>{
 const handler=stripeWebhook({key,secret,serviceKey:'placeholder'},{stripe,db:{from:()=>({upsert:async()=>({error:new Error('offline')})})}});
 assert.equal(await send(handler,{id:'evt_one',type:'invoice.paid',livemode:false}),503);
});
