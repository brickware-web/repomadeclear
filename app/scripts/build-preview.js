import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
// Public design preview only. Never copy scanner outputs, source evidence, or secrets.
mkdirSync('dist/api', { recursive: true });
for (const file of ['index.html', 'client.js', 'style.css']) copyFileSync(`src/web/${file}`, `dist/${file}`);
writeFileSync('dist/api/config.json', JSON.stringify({ authReady: false, githubReady: false, scanningReady: false, billingReady: false, detailsRequirePayment: true }));
writeFileSync('dist/api/session.json', JSON.stringify({ signedIn: false }));
