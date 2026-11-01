import Stripe from 'stripe';
import {createClient} from '@supabase/supabase-js';
export function stripeWebhook(settings,dependencies={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const send=status=>{res.statusCode=status;res.end();};
  if(req.method!=='POST')return send(405);
  if(!settings.key||!settings.secret||!settings.serviceKey)return send(503);
  try{
   let raw=Buffer.alloc(0);
   for await(const chunk of req){raw=Buffer.concat([raw,Buffer.from(chunk)]);if(raw.length>262144)return send(413);}
   const stripe=dependencies.stripe||new Stripe(settings.key);let event;
   try{event=stripe.webhooks.constructEvent(raw,req.headers['stripe-signature'],settings.secret);}catch{return send(400);}
   const live=/^(sk|rk)_live_/.test(settings.key);
   if(event.livemode!==live||typeof event.id!=='string'||event.id.length>255||typeof event.type!=='string'||event.type.length>255)return send(400);
   // Audit only: current invoice and payment state govern every protected request.
   const db=dependencies.db||createClient(settings.url,settings.serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
   const {error}=await db.from('rmc_payment_events').upsert({event_id:event.id,event_type:event.type},{onConflict:'event_id',ignoreDuplicates:true});
   return send(error?503:200);
  }catch{return send(503);}
 };
}
