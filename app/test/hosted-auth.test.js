import test from 'node:test';
import assert from 'node:assert/strict';
import { accountTransport } from '../src/hosted-auth.js';
function setup(overrides = {}) {
  const values = new Map(); let listener; const calls = [];
  const auth = { onAuthStateChange(fn) { listener = fn; },
    getSession: async () => ({ data: { session: { access_token: 'test-only' } } }),
    getUser: async () => ({ data: { user: { id: 'u1', email: 'owner@example.test', email_confirmed_at: '2026-01-01' } } }),
    signOut: async options => { calls.push(['logout', options]); listener('SIGNED_OUT'); return { data: {} }; },
    updateUser: async data => { calls.push(['password', data]); return { data: {} }; }, ...overrides };
  const request = accountTransport(auth, { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) });
  return { request, calls, emit: event => listener(event) };
}
test('hosted account display validates user with Supabase; no entitlement or repository access', async () => {
  const { request } = setup();
  assert.equal((await request('/api/session')).signedIn, true);
  assert.equal((await request('/api/session')).paid, false);
  await assert.rejects(request('/api/projects/secret'), /not available/);
  await assert.rejects(request('/api/github/connect'), /not available/);
});
test('unconfirmed users are signed out and rejected', async () => {
  const { request, calls } = setup({ getUser: async () => ({ data: { user: { id: 'u1' } } }) });
  assert.deepEqual(await request('/api/session'), { signedIn: false });
  assert.equal(calls[0][0], 'logout');
});
test('password recovery requires recovery event, verified user, strong password, then signs out globally', async () => {
  const { request, emit, calls } = setup();
  await assert.rejects(request('/api/auth/password', { password: 'a-long-test-password' }), /reset link/);
  emit('PASSWORD_RECOVERY');
  assert.equal((await request('/api/session')).recovery, true);
  await assert.rejects(request('/api/auth/password', { password: 'short' }), /12–128/);
  await request('/api/auth/password', { password: 'a-long-test-password' });
  assert.equal(calls[0][0], 'password');
  assert.deepEqual(calls[1], ['logout', { scope: 'global' }]);
});
test('provider rejects invalid session; local session content alone is never trusted', async () => {
  const { request } = setup({ getUser: async () => ({ error: { status: 401, message: 'private diagnostics' } }) });
  await assert.rejects(request('/api/session'), /could not be completed/);
});
test('provider email quota errors remain explicit without disclosing diagnostics', async () => {
  const { request } = setup({ resetPasswordForEmail: async () => ({ error: { status: 429, message: 'private' } }) });
  await assert.rejects(request('/api/auth/recover', { email: 'owner@example.test' }), /wait/);
});
