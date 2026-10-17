import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirstTimeDemo } from '../assets/first-time-demo.mjs';
const password = 'Demo-only-passphrase-2026';
function ready() { const d = createFirstTimeDemo(); d.move('start'); d.selectMember('DEMO0001'); d.move('verify'); d.move('password'); return d; }
test('demo cannot skip verification or accept real member IDs', () => {
  const d = createFirstTimeDemo();
  assert.throws(() => d.complete(password,password));
  assert.throws(() => d.move('password'));
  d.move('start'); assert.throws(() => d.selectMember('SK00001'));
  d.selectMember('demo0002'); assert.equal(d.snapshot().member,'DEMO0002');
});
test('demo validates passwords and retains neither credentials nor authentication', () => {
  const d = ready();
  assert.throws(() => d.complete('short','short'));
  assert.throws(() => d.complete(password,password+'x'));
  d.complete(password,password);
  assert.deepEqual(d.snapshot(),{ stage:'done',member:'DEMO0001',mode:'demo' });
  assert.ok(!JSON.stringify(d).includes(password));
});
test('demo supports back, edit and restart without leaking account state', () => {
  const d = ready(); d.back(); assert.equal(d.snapshot().stage,'verified');
  d.back(); d.move('edit'); d.selectMember('DEMO0002');
  d.move('verify'); d.move('password'); d.complete(password,password);
  d.back(); assert.equal(d.snapshot().stage,'password');
  d.move('restart'); assert.deepEqual(d.snapshot(),{stage:'intro',member:'',mode:'demo'});
  d.move('start'); d.reset(); assert.equal(d.snapshot().stage,'intro');
});
