import { createClient } from '@supabase/supabase-js';
import { accountTransport } from './hosted-auth.js';
const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
});
const accounts = accountTransport(client.auth, sessionStorage);
const callback = location.pathname === '/github/callback' ? new URLSearchParams(location.search) : null;
if (callback) history.replaceState(null, '', '/#login');
async function github(action, data = {}) {
  const {data: current, error} = await client.auth.getSession();
  if (error || !current.session) throw new Error('Sign in, then connect GitHub again.');
  const response = await fetch('/api/github', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${current.session.access_token}`},body:JSON.stringify({...data,action}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'GitHub connection could not be completed.');
  return result;
}
globalThis.rmcHostedRequest = async (route,data) => {
  if(route === '/api/config') {
    const response = await fetch('/api/config');
    if(!response.ok) throw new Error('Could not load account configuration.');
    return response.json();
  }
  if(route === '/api/session') {
    const result = await accounts(route);
    if(result.signedIn && !result.recovery) Object.assign(result,await github('status'));
    return result;
  }
  if(route.startsWith('/api/github/')) {
    const url = new URL(route,location.origin), action=url.pathname.split('/').at(-1);
    const payload={...Object.fromEntries(url.searchParams),...data};
    if(action==='connect') {
      const bytes=crypto.getRandomValues(new Uint8Array(32));
      const binding=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
      sessionStorage.setItem('rmc-github-binding',binding); payload.binding=binding;
    }
    return github(action,payload);
  }
  return accounts(route,data);
};
// Finish email callback processing before the application's hash router runs.
const result = await client.auth.getSession();
if (result.error) {
  history.replaceState(null, '', location.pathname + '#login');
  globalThis.rmcAuthCallbackError = 'This email link expired or could not be verified. Request a new link and try again.';
}
if(callback) {
  try {
    if(callback.has('error')) throw new Error('GitHub authorization was cancelled. You can connect again.');
    await github('callback',{code:callback.get('code'),state:callback.get('state'),binding:sessionStorage.getItem('rmc-github-binding')});
  } catch(error) { globalThis.rmcAuthCallbackError=error.message; }
  finally { sessionStorage.removeItem('rmc-github-binding'); }
}
await import('./web/client.js');
client.auth.onAuthStateChange((event) => {
  if (['SIGNED_OUT', 'SIGNED_IN', 'PASSWORD_RECOVERY'].includes(event)) setTimeout(() => window.dispatchEvent(new Event('rmc-auth-changed')), 0);
});
