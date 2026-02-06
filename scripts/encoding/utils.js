import fs from 'node:fs';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.toml', '.md', '.css', '.html'
]);

const DEFAULT_IGNORES = new Set([
  'node_modules', '.git', 'dist', 'dist-ssr', '.npm-cache'
]);

export const isTextFile = (filePath) => TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());

export const shouldIgnoreDir = (dirName, extraIgnores = []) => {
  if (DEFAULT_IGNORES.has(dirName)) return true;
  return extraIgnores.includes(dirName);
};

export const readBytes = (filePath) => fs.readFileSync(filePath);

export const detectEncodingIssues = (bytes) => {
  const issues = [];
  if (bytes.length >= 2) {
    const b0 = bytes[0];
    const b1 = bytes[1];
    if ((b0 === 0xff && b1 === 0xfe) || (b0 === 0xfe && b1 === 0xff)) {
      issues.push('utf16-bom');
    }
  }

  const limit = Math.min(200, bytes.length);
  let nulls = 0;
  for (let i = 0; i < limit; i += 1) {
    if (bytes[i] === 0x00) nulls += 1;
  }
  if (nulls >= 5) issues.push('possible-utf16');

  return issues;
};

export const containsReplacementChar = (bytes) => {
  // U+FFFD in UTF-8: 0xEF 0xBF 0xBD
  for (let i = 0; i < bytes.length - 2; i += 1) {
    if (bytes[i] === 0xef && bytes[i + 1] === 0xbf && bytes[i + 2] === 0xbd) {
      return true;
    }
  }
  return false;
};
