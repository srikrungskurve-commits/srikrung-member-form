import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const root = new URL('../', import.meta.url);
const target = resolve(process.argv[2] || 'staging-output');
// Explicit allowlist: never upload the repository root or legacy form webhooks.
const files = ['login.html', 'login-review.html', 'assets/login.css', 'assets/login.js', 'assets/login-api.mjs', 'assets/login-config.js', 'assets/login-validation.mjs', 'assets/first-time-demo.mjs'];
const config = await readFile(new URL('assets/login-config.js', root), 'utf8');
if (!/apiBase:\s*null/.test(config)) throw Error('Staging UI preview must keep real authentication disabled.');
for (const file of files) { const to = resolve(target, file); await mkdir(dirname(to), { recursive: true }); await copyFile(new URL(file, root), to); }
await writeFile(resolve(target, 'index.html'), '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=login.html"><title>Srikrung Login Preview</title></head><body><a href="login.html">เปิดหน้า Login</a></body></html>');
await writeFile(resolve(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
await writeFile(resolve(target, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Cache-Control: no-store\n');
console.log(`Built UI-only staging assets in ${target}. No existing member/Admin forms included.`);
