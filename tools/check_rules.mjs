// House-rule scan (CLAUDE.md): render code must be a pure function of time.
//   node tools/check_rules.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['film', 'lib'];
const PREVIEW_ONLY = new Set(['film/preview.js']);
const RULES = [
  [/Math\.random\s*\(/, 'Math.random (use rng()/hash() from lib/motion.js)'],
  [/\bsetTimeout\s*\(|\bsetInterval\s*\(/, 'timers'],
  [/\brequestAnimationFrame\s*\(/, 'requestAnimationFrame outside film/preview.js'],
  [/\bDate\.now\s*\(|\bperformance\.now\s*\(/, 'wall-clock time outside film/preview.js'],
  [/transition\s*:/, 'CSS transitions'],
  [/@keyframes|animation\s*:/, 'CSS animations'],
  [/shadowBlur/, 'glow / shadowBlur'],
];

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p);
  else if (/\.(js|mjs|html|css)$/.test(f) && !/\.test\.js$/.test(f)) files.push(p);
});
ROOTS.forEach(walk);

const problems = [];
for (const f of files) {
  if (PREVIEW_ONLY.has(f)) continue;
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    for (const [re, what] of RULES) if (re.test(code)) problems.push(`${f}:${i + 1}  ${what}`);
  });
}
if (problems.length) {
  console.error(`house-rule violations:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`house rules ok (${files.length} files)`);
