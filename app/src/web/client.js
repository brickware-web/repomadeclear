const $ = id => document.getElementById(id);
let mode = 'login', config, session;
const say = text => { $('notice').textContent = text; };
async function api(route, data) {
  if (globalThis.rmcHostedRequest) return globalThis.rmcHostedRequest(route, data);
  const response = await fetch(route, { credentials: 'same-origin', ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Request failed.'); return result;
}
function act(fn) { return async event => { event?.preventDefault(); try { await fn(); } catch (error) { say(error.message); } }; }
function setMode(value) {
  mode = value;
  const signup = mode === 'signup';
  $('nav-signup').textContent = signup ? 'Log in' : 'Sign up';
  $('nav-signup').dataset.mode = signup ? 'login' : 'signup';
  const note = document.querySelector('.signup-note');
  note.firstChild.textContent = signup ? 'Already have an account? ' : 'New to Repo Made Clear? ';
  note.querySelector('button').textContent = signup ? 'Log in' : 'Sign up';
  note.querySelector('button').dataset.mode = signup ? 'login' : 'signup';
  $('auth-title').textContent = ({login: 'Log in to Repo Made Clear', signup: 'Create your account', recover: 'Reset your password', verify: 'Check your email'})[mode]; $('password-label').hidden = !['signup', 'login'].includes(mode); $('password').required = ! $('password-label').hidden;
  $('password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('code-fields').hidden = mode !== 'verify'; $('code').required = mode === 'verify';
  $('auth-submit').textContent = ({ signup: 'Create account', login: 'Sign in', recover: 'Send recovery code', verify: 'Verify email code' })[mode];
}
function choices(element, rows, placeholder, value, label) {
  element.replaceChildren(new Option(placeholder, ''));
  for (const row of rows) element.add(new Option(label(row), String(value(row))));
  element.disabled = rows.length === 0;
}
async function installations() {
  const data = await api('/api/github/installations');
  $('install').href = data.installURL;
  choices($('installation'), data.installations, 'Choose an installation', i => i.id, i => i.account);
  choices($('repository'), [], 'Choose a repository', r => r.id, r => r.name);
  choices($('branch'), [], 'Choose a branch', b => b.name, b => b.name); $('select').disabled = true;
  if (!data.installations.length) say('Choose repositories on GitHub, then refresh access. Installations granting all repositories are not accepted in this preview.');
}
async function refresh() {
  session = await api('/api/session');
  $('account').hidden = session.signedIn; $('logout').hidden = !session.signedIn;
  $('recovery').hidden = !session.recovery; $('github').hidden = !session.signedIn || session.recovery;
  $('auth-submit').disabled = !config.authReady;
  $('connect').disabled = !(session.githubReady ?? config.githubReady);

  $('identity').textContent = session.email ? `Signed in as ${session.email}` : '';
  $('picker').hidden = !session.githubConnected;
  $('connect').hidden = !!session.githubConnected; $('disconnect').hidden = !session.githubConnected;
  if (session.githubConnected) await installations();
  route();
}
function route() {
  const page = location.hash.slice(1) || 'login';
  const home = ['home', 'product', 'how-it-works', 'pricing'].includes(page);
  $('home-page').hidden = !home; $('auth-page').hidden = home;
  $('home-nav').hidden = !home; $('nav-login').hidden = !home || !!session?.signedIn;
  $('nav-signup').hidden = !!session?.signedIn;
  document.body.classList.toggle('marketing', home);
  if (home) { $('nav-signup').textContent = 'Sign up'; $('nav-signup').dataset.mode = 'signup'; }
  if (['signup', 'login', 'recover', 'verify'].includes(page)) setMode(page);
  document.title = home ? 'Repo Made Clear — Software, explained.' : 'Repo Made Clear — Your account';
  if (['product', 'how-it-works', 'pricing'].includes(page)) document.getElementById(page).scrollIntoView();
  else window.scrollTo(0, 0);
}
document.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => { location.hash = button.dataset.mode; route(); }; });
window.addEventListener('hashchange', route);
route();
$('auth-form').onsubmit = act(async () => {
  const data = { email: $('email').value, ...(mode === 'signup' || mode === 'login' ? { password: $('password').value } : {}), ...(mode === 'verify' ? { code: $('code').value, type: $('code-type').value } : {}) };
  try {
    const result = await api(`/api/auth/${mode}`, data); say(result.message || (result.recovery ? 'Code verified. Choose your new password.' : 'You are signed in.'));
    if (!config.emailLinks && (mode === 'signup' || mode === 'recover')) { $('code-type').value = mode === 'signup' ? 'signup' : 'recovery'; location.hash = 'verify'; setMode('verify'); }
    await refresh();
  } finally { $('password').value = ''; $('code').value = ''; }
});
$('password-form').onsubmit = act(async () => { try { const result = await api('/api/auth/password', { password: $('new-password').value }); say(result.message); location.hash = 'login'; setMode('login'); await refresh(); } finally { $('new-password').value = ''; } });
$('logout').onclick = act(async () => { await api('/api/auth/logout', {}); say('You are signed out.'); await refresh(); });
$('connect').onclick = act(async () => { const data = await api('/api/github/connect', {}); location.assign(data.url); });
$('disconnect').onclick = act(async () => { await api('/api/github/disconnect', {}); say('Your saved connection is cleared. You can also revoke the App in GitHub settings.'); await refresh(); });
$('refresh').onclick = act(installations);
$('installation').onchange = act(async () => {
  choices($('repository'), [], 'Choose a repository', r => r.id, r => r.name); choices($('branch'), [], 'Choose a branch', b => b.name, b => b.name); $('select').disabled = true;
  if (!$('installation').value) return;
  const data = await api('/api/github/repositories?installation=' + encodeURIComponent($('installation').value));
  choices($('repository'), data.repositories, 'Choose a repository', r => r.id, r => r.name);
});
const selectionQuery = () => new URLSearchParams({ installation: $('installation').value, repository: $('repository').value });
$('repository').onchange = act(async () => {
  choices($('branch'), [], 'Choose a branch', b => b.name, b => b.name); $('select').disabled = true;
  if (!$('repository').value) return;
  const data = await api('/api/github/branches?' + selectionQuery()); choices($('branch'), data.branches, 'Choose a branch', b => b.name, b => b.name);
});
$('branch').onchange = () => { $('select').disabled = !$('branch').value; };
$('select').onclick = act(async () => { const data = await api('/api/github/select?' + selectionQuery(), { branch: $('branch').value }); $('selection').textContent = data.message; say('Repository and branch verified. No code has been scanned yet.'); });
(async () => { try { config = await api('/api/config'); route(); await refresh(); say(globalThis.rmcAuthCallbackError || (session.recovery ? 'Email verified. Choose your new password.' : session.signedIn ? 'You are signed in.' : !config.authReady ? 'Account service setup is needed before you can register. No account has been created.' : !config.githubReady ? 'Email accounts are configured. GitHub service setup is still needed.' : 'Create an account or sign in to begin.')); if (config.emailLinks) document.querySelector('[data-mode="verify"]').hidden = true; } catch (error) { say(error.message); } })();

window.addEventListener('rmc-auth-changed', act(refresh));
