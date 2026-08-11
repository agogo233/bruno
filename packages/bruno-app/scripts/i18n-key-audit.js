#!/usr/bin/env node
/*
 * i18n-key-audit.js
 * Scans src/ for static t('KEY') calls and verifies every key resolves to
 * a string in BOTH en.json and zh-CN.json (object -> MISSING, leaf mismatch flagged).
 * OPENAPI_SYNC.CONNECT.FEATURES is expected to be an array (returnObjects usage).
 * Exits non-zero when broken keys are found.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LOCALE = path.join(ROOT, 'src', 'i18n', 'translation');
const langs = ['en', 'zh-CN'];

const json = {};
for (const l of langs) {
  json[l] = JSON.parse(fs.readFileSync(path.join(LOCALE, `${l}.json`), 'utf8'));
}

const resolve = (o, k) =>
  k.split('.').reduce((a, b) => (a && typeof a === 'object') ? a[b] : undefined, o);

const ARRAY_KEYS = new Set([
  'OPENAPI_SYNC.CONNECT.FEATURES'
]);

const STATIC = /t\(\s*'([A-Z0-9_\.]+)'/g;

const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(?:js|ts|tsx)$/.test(f) && !/\.spec\.(?:js|ts|tsx)$/.test(f)) files.push(p);
  }
}
walk(SRC);

const broken = {};
const dynamic = {};
for (const f of files) {
  const rel = f.replace(ROOT + '/', '');
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split(/\r?\n/);
  const staticMatches = [];
  let m;
  while ((m = STATIC.exec(src))) staticMatches.push(m[1]);
  // collect labelKey-driven dynamic keys referenced from REQUEST_PANE.OAUTH2
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const dl = ln.match(/labelKey:\s*'([A-Z0-9_]+)'/);
    if (dl && /REQUEST_PANE\.OAUTH2/.test(ln)) {
      dynamic[`REQUEST_PANE.OAUTH2.${dl[1]}`] = rel;
    }
  }
  for (const k of staticMatches) {
    if (!k || !/^[A-Z]/.test(k) || k.endsWith('.')) continue;
    const expectArray = ARRAY_KEYS.has(k);
    const veredict = langs.every(l => {
      const v = resolve(json[l], k);
      return expectArray ? Array.isArray(v) : typeof v === 'string';
    });
    if (!veredict) {
      (broken[k] = broken[k] || []).push(rel);
    }
  }
}
for (const k of Object.keys(dynamic)) {
  const veredict = langs.every(l => typeof resolve(json[l], k) === 'string');
  if (!veredict) {
    (broken[k] = broken[k] || []).push(dynamic[k]);
  }
}

let total = 0;
for (const [k, fs2] of Object.entries(broken)) {
  const uniq = [...new Set(fs2)].join(', ');
  total += fs2.length;
  console.log(`[BAD] ${k}  (${fs2.length})  ${uniq}`);
}

if (total === 0) {
  console.log('OK: all t() keys resolve to string in both en and zh-CN.');
  process.exit(0);
}
console.log(`FAIL: ${total} broken t() key usages across ${Object.keys(broken).length} keys.`);
process.exit(1);
