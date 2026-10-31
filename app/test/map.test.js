import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { renderMap } from '../src/map.js';

test('the offline editor embeds hostile labels as data and authorizes only its exact script', () => {
  const malicious = '</script><script>globalThis.pwned=true</script>';
  const scan = { repository: malicious, branch: 'main', commit: 'a'.repeat(40), scannedAt: '2026-10-30T12:00:00Z', nodes: [{ id: 'a'.repeat(24), label: malicious }], edges: [], coverage: { supported: malicious, gaps: [malicious], scannedFiles: 1, omittedFiles: 0, unresolvedReferences: 0, omittedCalls: 0 }, usage: { elapsedMs: 1, aiTokens: 0, aiCostUsd: 0 } };
  const html = renderMap(scan);
  const scripts = [...html.matchAll(/<script data-rmc-editor>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.ok(!html.includes(malicious));
  assert.ok(html.includes('&lt;/script&gt;'));
  const script = scripts[0][1];
  assert.doesNotThrow(() => new vm.Script(script));
  assert.ok(html.includes(`script-src 'sha256-${createHash('sha256').update(script).digest('base64')}'`));
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(html.includes("form-action 'none'"));
});
