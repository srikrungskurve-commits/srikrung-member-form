import { loginConfig } from './login-config.js';
import { AuthError, createAuthApi } from './login-api.mjs';
import { memberError, newPasswordError } from './login-validation.mjs';
const api = createAuthApi(loginConfig);
// Sign-in providers are deliberately not wired to an unverified account-linking flow.
// Supply an approved provider adapter here only after server-side linking is ready.
const providerSignIn = Object.freeze({ line: null, google: null });
const el = id => document.getElementById(id);
const panels = ['login', 'welcome', 'expired', 'password'];
let preview = false;
let busy = false;
let lineVerified = false;
const errors = {
  NOT_CONFIGURED: 'ยังไม่ได้เชื่อมต่อระบบยืนยันตัวตน จึงยังเข้าสู่ระบบหรือเปลี่ยนรหัสผ่านไม่ได้',
  SESSION_EXPIRED: 'การยืนยันตัวตนหมดอายุ กรุณาเข้าสู่ระบบหรือยืนยันผ่าน LINE อีกครั้ง',
  RATE_LIMITED: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
  REQUEST_REJECTED: 'ไม่สามารถยืนยันคำขอได้ กรุณาตรวจสอบข้อมูลหรือสถานะบัญชี',
  CONNECTION_FAILED: 'ติดต่อระบบไม่ได้ กรุณาลองใหม่อีกครั้ง',
  INVALID_RESPONSE: 'ระบบตอบกลับไม่ถูกต้อง ยังไม่ได้ยืนยันความสำเร็จ',
  UNSAFE_API_ORIGIN: 'การตั้งค่าการเชื่อมต่อยังไม่ถูกต้อง'
};
Object.assign(errors, { INVALID_CREDENTIALS: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบรหัสสมาชิกและรหัสผ่าน', NOT_ALLOWED: 'บัญชีหรือคำขอนี้ยังไม่ได้รับสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ', SERVICE_NOT_READY: 'ระบบยืนยันตัวตนยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง' });
function message(text) { el('message').textContent = text; el('message').hidden = false; el('message').focus(); }
function clearPasswords() { document.querySelectorAll('input[type=password], input[data-was-password]').forEach(input => { input.value = ''; input.type = 'password'; }); document.querySelectorAll('[data-toggle]').forEach(button => { button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', 'แสดงรหัสผ่าน'); }); }
function step(index) { document.querySelectorAll('.steps li').forEach((li, i) => { if (i === index) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); }); }
function show(name, isPreview = false) {
  preview = isPreview;
  clearPasswords();
  panels.forEach(panel => { el(`${panel}-panel`).hidden = panel !== name; });
  el('message').hidden = true;
  el('preview-note').hidden = !preview;
  document.querySelectorAll('[data-go]').forEach(button => { if (button.closest('.tabs')) { if (button.dataset.go === (name === 'password' ? 'password' : 'login') && button.textContent !== 'ครั้งแรก') button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); } });
  if (name === 'password') { lineVerified = false; el('verify-step').hidden = false; el('new-password-form').hidden = true; el('password-done').hidden = true; el('new-password-caption').textContent = 'Server ยืนยัน LINE เดิมและสถานะ ACTIVE แล้ว'; step(0); }
  if (name === 'welcome' && preview) { el('session-member').textContent = 'ตัวอย่างหน้าจอ — ยังไม่ยืนยันบัญชี'; el('session-time').textContent = '—'; el('session-device').textContent = '—'; }
  el(`${name}-panel`).querySelector('h2').setAttribute('tabindex', '-1');
  el(`${name}-panel`).querySelector('h2').focus({ preventScroll: true });
}
async function run(action) {
  if (busy) return;
  busy = true;
  document.querySelectorAll('button').forEach(b => { b.disabled = true; });
  el('message').hidden = true;
  try { await action(); }
  catch (error) { message(errors[error instanceof AuthError ? error.code : 'INVALID_RESPONSE'] || errors.INVALID_RESPONSE); }
  finally { busy = false; document.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
}
function enter() {
  // Never accept a redirect URL from query parameters or an API response.
  const target = new URL(loginConfig.destination, location.origin);
  if (target.origin !== location.origin) throw new AuthError('INVALID_RESPONSE');
  location.assign(target.href);
}
function renderSession(session) {
  if (session.state === 'authenticated') {
    show('welcome');
    el('session-member').textContent = typeof session.member_id === 'string' ? session.member_id : '—';
    const date = new Date(session.last_login_at);
    el('session-time').textContent = Number.isFinite(date.getTime()) ? date.toLocaleString('th-TH') : '—';
    el('session-device').textContent = typeof session.device_label === 'string' ? session.device_label : '—';
  } else show(session.state === 'expired' ? 'expired' : 'login');
}
async function checkedSession() {
  try { return await api.session(); }
  catch (error) {
    if (error.code === 'SESSION_EXPIRED') return { state: 'expired' };
    throw error;
  }
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => show(button.dataset.go)));
document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => show(button.dataset.preview, true)));
document.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', () => {
  const input = el(button.dataset.toggle); const visible = input.type === 'password';
  input.dataset.wasPassword = 'true'; input.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible)); button.setAttribute('aria-label', visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
}));
for (const provider of ['line', 'google']) el(`${provider}-signin`).addEventListener('click', () => {
  const name = provider === 'line' ? 'LINE' : 'Google';
  if (preview || !providerSignIn[provider]) { message(`ยังไม่ได้เชื่อม ${name} Login กับบัญชีสมาชิกจริง กรุณาใช้รหัสสมาชิกและรหัสผ่านเมื่อระบบพร้อม`); return; }
  run(() => providerSignIn[provider]());
});
for (const prefix of ['login', 'expired']) el(`${prefix}-form`).addEventListener('submit', event => {
  event.preventDefault();
  const member = el(prefix === 'login' ? 'member-id' : 'expired-member').value.trim();
  const passwordInput = el(prefix === 'login' ? 'password' : 'expired-password');
  if (memberError(member)) { message(memberError(member)); return; }
  if (preview) { message('ตัวอย่างหน้าจอเท่านั้น กรุณาเลือกเมนูเข้าสู่ระบบด้านบนเพื่อใช้งานจริง'); return; }
  run(async () => { try { await api.login(member, passwordInput.value); const session = await api.session(); if (session.state !== 'authenticated') throw new AuthError('REQUEST_REJECTED'); enter(); } finally { clearPasswords(); } });
});
el('continue-button').addEventListener('click', () => run(async () => {
  if (preview) { message('นี่คือตัวอย่างหน้าจอ กรุณากลับไปเข้าสู่ระบบเพื่อยืนยันบัญชีจริง'); return; }
  const session = await checkedSession(); if (session.state === 'authenticated') enter(); else renderSession(session);
}));
el('switch-account').addEventListener('click', () => run(async () => { if (!preview) await api.logout(); show('login'); }));
el('line-form').addEventListener('submit', event => { event.preventDefault(); const member = el('line-member').value.trim(); if (memberError(member)) { message(memberError(member)); return; } if (preview) { message('ตัวอย่างหน้าจอเท่านั้น กรุณาเลือกเมนูตั้งรหัสด้านบนเพื่อยืนยันตัวตนจริง'); return; } run(async () => location.assign(await api.startLine(member))); });
el('new-password-form').addEventListener('submit', event => {
  event.preventDefault();
  const password = el('new-password').value;
  const validationError = newPasswordError(password, el('confirm-password').value);
  if (validationError) { message(validationError); return; }
  if (preview || !lineVerified) { message('ยังไม่ได้ยืนยันผ่าน LINE เดิม จึงไม่บันทึกรหัสผ่าน กรุณายืนยันตัวตนจริงก่อน'); return; }
  run(async () => { try { await api.setPassword(password); lineVerified = false; el('new-password-form').hidden = true; el('password-done').hidden = false; step(2); } finally { clearPasswords(); } });
});
// The callback is handled by the server. No verification tokens are accepted from the URL.
async function initialize() {
  el('connection-note').textContent = loginConfig.apiBase ? 'ระบบจะตรวจสอบบัญชีและสิทธิ์ผ่าน Server' : 'อยู่ระหว่างเตรียมเชื่อม API · ยังไม่เปิดให้เข้าสู่ระบบจริง';
  const route = location.hash === '#password' ? 'password' : 'login';
  show(route);
  const review = new URLSearchParams(location.search).get('review');
  if (panels.includes(review)) { document.body.classList.add('review-sheet'); show(review, true); return; }
  if (!loginConfig.apiBase) return;
  await run(async () => {
    if (route === 'password') { const status = await api.passwordStatus(); if (status.verified === true) { lineVerified = true; el('verify-step').hidden = true; el('new-password-form').hidden = false; step(1); } }
    else renderSession(await checkedSession());
  });
}
initialize();
window.addEventListener('pageshow', event => { if (event.persisted) initialize(); });
el('preview-password-fields').addEventListener('click', () => {
  show('password', true);
  el('verify-step').hidden = true;
  el('new-password-form').hidden = false;
  el('new-password-caption').textContent = 'ตัวอย่างช่องกรอกเท่านั้น — ยังไม่ได้ยืนยัน LINE และไม่บันทึกรหัสผ่าน';
  step(1);
});
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('invalid', () => {
    input.setAttribute('aria-invalid', 'true');
    if (input.validity.valueMissing) input.setCustomValidity('กรุณากรอกข้อมูลในช่องนี้');
    else if (input.validity.tooShort || input.validity.tooLong) input.setCustomValidity('กรุณาใช้รหัสผ่าน 15–128 ตัวอักษร');
  });
  input.addEventListener('input', () => { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); });
});
document.addEventListener('visibilitychange', () => { if (document.hidden) clearPasswords(); });
