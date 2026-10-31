import { EncryptJWT, jwtDecrypt } from 'jose';
import { HttpError } from './providers.js';
export function credentialVault(hexKey) {
  if (!/^[a-f0-9]{64}$/i.test(hexKey || '')) throw new Error('A 32-byte credential encryption key is required');
  const key = Buffer.from(hexKey, 'hex');
  return {
    seal: (data, user, purpose, seconds) => new EncryptJWT(data).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).setSubject(user).setAudience(purpose).setIssuer('repo-made-clear').setIssuedAt().setExpirationTime(Math.floor(Date.now()/1000)+seconds).encrypt(key),
    async open(value, user, purpose) {
      try { return (await jwtDecrypt(value, key, { issuer: 'repo-made-clear', audience: purpose, subject: user, keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] })).payload; }
      catch { throw new HttpError(403, 'GitHub connection expired. Connect again.'); }
    }
  };
}
export function githubStore(config, token, fetcher = fetch) {
  return async (action, payload = {}) => {
    let response;
    try { response = await fetcher(`${config.authURL}/rest/v1/rpc/rmc_github`, { method: 'POST', headers: { apikey: config.authKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }), signal: AbortSignal.timeout(10000), redirect:'error' }); }
    catch { throw new HttpError(503, 'Connection storage is unavailable. Please try again.'); }
    if (!response.ok) throw new HttpError(503, 'Connection storage is not ready. Please try again later.');
    const result = await response.json();
    if (result.limited) throw new HttpError(429, 'Too many connection requests. Wait a minute and try again.');
    return result;
  };
}
