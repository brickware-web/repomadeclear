// Development verification: snapshot the application's actual source, never fictional findings.
import { copyFileSync, cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const app = path.resolve(import.meta.dirname, '..');
const snapshot = mkdtempSync(path.join(tmpdir(), 'repo-made-clear-source-'));
cpSync(path.join(app, 'src'), path.join(snapshot, 'src'), { recursive: true });
copyFileSync(path.join(app, 'package.json'), path.join(snapshot, 'package.json'));
const git = args => execFileSync('git', ['-C', snapshot, ...args], { stdio: 'pipe' });
git(['init', '-b', 'main']); git(['add', '.']);
git(['-c', 'user.name=Local source snapshot', '-c', 'user.email=snapshot@example.invalid', '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Snapshot of actual Repo Made Clear source for extraction verification']);
execFileSync(process.execPath, [path.join(app, 'src/cli.js'), snapshot, 'main', 'repo-made-clear-local-source-snapshot', path.join(app, 'output')], { stdio: 'inherit' });
console.log(`Evidence snapshot retained locally at: ${snapshot}`);
