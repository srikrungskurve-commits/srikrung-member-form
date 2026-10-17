import test from 'node:test';
import assert from 'node:assert/strict';
import { memberError, newPasswordError } from '../assets/login-validation.mjs';
test('member validation accepts existing ID styles and rejects empty, spaces and control characters', () => {
  for (const id of ['AM0006', 'CH001', 'SK00001', ' AM0006 ']) assert.equal(memberError(id), '');
  for (const id of ['', '  ', 'AM 0006', 'AM\u0000006', 'X'.repeat(65)]) assert.notEqual(memberError(id), '');
});
test('new passwords enforce bounds, reject all-space values and require confirmation', () => {
  assert.notEqual(newPasswordError('short', 'short'), '');
  assert.notEqual(newPasswordError('x'.repeat(129), 'x'.repeat(129)), '');
  assert.notEqual(newPasswordError(' '.repeat(15), ' '.repeat(15)), '');
  assert.notEqual(newPasswordError('A long password 123', 'Another password 123'), '');
  assert.equal(newPasswordError('A long password 123', 'A long password 123'), '');
  assert.equal(newPasswordError('รหัสผ่านภาษาไทยที่ยาวพอ123', 'รหัสผ่านภาษาไทยที่ยาวพอ123'), '');
});
