// Client validation improves feedback; the real server must repeat all checks.
// A URL value is an editable form hint only, never an authenticated identity.
export function memberIdFromSearch(search) {
  const values = new URLSearchParams(search).getAll('member_id');
  if (values.length !== 1 || !/^[A-Za-z0-9_-]{1,64}$/.test(values[0])) return '';
  return values[0];
}
export function memberError(value) {
  if (typeof value !== 'string' || !value.trim()) return 'กรุณากรอกรหัสสมาชิก';
  const member = value.trim();
  if (member.length > 64 || /[\s\u0000-\u001f\u007f]/u.test(member)) return 'รหัสสมาชิกต้องไม่มีช่องว่าง และยาวไม่เกิน 64 ตัวอักษร';
  return '';
}
export function newPasswordError(password, confirmation) {
  if (typeof password !== 'string' || password.length < 15 || password.length > 128) return 'กรุณาใช้รหัสผ่าน 15–128 ตัวอักษร';
  if (!password.trim()) return 'รหัสผ่านต้องไม่เป็นช่องว่างทั้งหมด';
  if (password !== confirmation) return 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
  return '';
}
