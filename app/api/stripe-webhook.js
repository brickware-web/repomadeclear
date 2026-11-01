import {stripeWebhook} from '../src/stripe-webhook.js';
export const config={api:{bodyParser:false}};
export default stripeWebhook({key:process.env.STRIPE_SECRET_KEY,secret:process.env.STRIPE_WEBHOOK_SECRET,url:process.env.SUPABASE_URL,serviceKey:process.env.SUPABASE_SERVICE_ROLE_KEY});
