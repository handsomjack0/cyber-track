import fs from 'node:fs';
import path from 'node:path';
import { isTextFile, shouldIgnoreDir, readBytes, detectEncodingIssues, containsReplacementChar } from './utils.js';

const root = process.cwd();
const extraIgnores = process.argv.slice(2);

const results = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (shouldIgnoreDir(entry.name, extraIgnores)) continue;
      walk(path.join(dir, entry.name));
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (!isTextFile(filePath)) continue;

    const bytes = readBytes(filePath);
    const issues = detectEncodingIssues(bytes);
    const hasReplacement = containsReplacementChar(bytes);

    if (issues.length > 0 || hasReplacement) {
      results.push({
        file: path.relative(root, filePath),
        issues: [...issues, ...(hasReplacement ? ['replacement-char'] : [])]
      });
    }
  }
};

walk(root);

if (results.length === 0) {
  console.log('OK: no encoding issues detected.');
  process.exit(0);
}

console.log('Encoding issues detected:');
for (const item of results) {
  console.log(`- ${item.file}: ${item.issues.join(', ')}`);
}
process.exit(1);
