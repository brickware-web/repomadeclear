import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { scanRepository } from './scanner.js';
import { renderMap } from './map.js';
const [root, ref = 'HEAD', repository = 'local-repository', destination = 'output'] = process.argv.slice(2);
if (!root) {
  console.error('Usage: npm run scan -- /path/to/git-repo [branch] [safe-repository-label] [output-directory]');
  process.exitCode = 1;
} else {
  try {
    const scan = scanRepository(path.resolve(root), { ref, repository });
    const output = path.resolve(destination, scan.commit);
    if (existsSync(path.join(output, 'scan.json'))) {
      const previous = JSON.parse(readFileSync(path.join(output, 'scan.json'), 'utf8'));
      if (previous.scannerVersion !== scan.scannerVersion || previous.repository !== scan.repository || previous.branch !== scan.branch) throw new Error('Output already contains a different scan context. Choose another output directory.');
      console.log(`Existing immutable findings retained: ${path.join(output, 'map.html')}`);
      process.exit(0);
    }
    mkdirSync(output, { recursive: true, mode: 0o700 });
    writeFileSync(path.join(output, 'scan.json'), JSON.stringify(scan, null, 2), { mode: 0o600, flag: 'wx' });
    writeFileSync(path.join(output, 'map.html'), renderMap(scan), { mode: 0o600, flag: 'wx' });
    console.log(`Scanned ${scan.coverage.scannedFiles} files and ${scan.edges.length} references in ${scan.usage.elapsedMs} ms. AI cost: $0.\nMap: ${path.join(output, 'map.html')}`);
  } catch (error) {
    // Never print Git stderr or source text: they may contain sensitive material.
    console.error(error.status !== undefined ? 'Git snapshot could not be read within the scan limits.' : error.message);
    process.exitCode = 1;
  }
}
