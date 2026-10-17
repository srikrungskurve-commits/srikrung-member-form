import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthApi } from '../assets/login-api.mjs';
const origin = 'https://login.example.test';
const config = { apiBase: '/auth', lineAuthorizationOrigins: ['https://access.line.me'] };
const reply = (data, status = 200, type = 'application/json') => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': type } });
test('unconfigured API cannot authenticate or send credentials', async () => {
  let requests = 0;
  const api = createAuthApi({ ...config, apiBase: null }, { origin, fetcher: () => { requests++; } });
  await assert.rejects(api.login('SK00001', 'test-password'), { code: 'NOT_CONFIGURED' });
  await assert.rejects(api.setPassword('test-password'), { code: 'NOT_CONFIGURED' });
  assert.equal(requests, 0);
});
test('credentials only sent to configured same-origin API with no-store and cookies', async () => {
  const api = createAuthApi(config, { origin, fetcher: async (url, options) => {
    assert.equal(url, `${origin}/auth/login`);
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { member_id: 'SK00001', password: 'test-password' });
    return reply({ authenticated: true });
  } });
  assert.equal((await api.login('SK00001', 'test-password')).authenticated, true);
});
test('cross-origin API blocked before sending password', async () => {
  const api = createAuthApi({ ...config, apiBase: 'https://other.example/auth' }, { origin, fetcher: () => assert.fail('must not fetch') });
  await assert.rejects(api.login('SK1', 'password'), { code: 'UNSAFE_API_ORIGIN' });
});
test('configured authentication never transmits passwords over plaintext HTTP', async () => {
  const api = createAuthApi(config, { origin: 'http://login.example.test', fetcher: () => assert.fail('must not fetch') });
  await assert.rejects(api.login('SK1', 'password'), { code: 'UNSAFE_API_ORIGIN' });
});
test('HTTP 200 alone cannot report login or password success', async () => {
  const api = createAuthApi(config, { origin, fetcher: async () => reply({}) });
  await assert.rejects(api.login('SK1', 'password'), { code: 'REQUEST_REJECTED' });
  await assert.rejects(api.setPassword('password'), { code: 'REQUEST_REJECTED' });
  await assert.rejects(api.session(), { code: 'INVALID_RESPONSE' });
});
test('expired, rate limited, HTML and offline responses fail closed', async () => {
  for (const [fetcher, code] of [
    [async () => reply({}, 401), 'SESSION_EXPIRED'],
    [async () => reply({}, 429), 'RATE_LIMITED'],
    [async () => reply({}, 200, 'text/html'), 'INVALID_RESPONSE'],
    [async () => { throw Error('offline'); }, 'CONNECTION_FAILED']
  ]) await assert.rejects(createAuthApi(config, { origin, fetcher }).session(), { code });
});
test('LINE redirect accepts only HTTPS official authorization origin', async () => {
  for (const authorization_url of ['https://evil.example/login', 'javascript:alert(1)', 'http://access.line.me/login']) {
    const api = createAuthApi(config, { origin, fetcher: async () => reply({ authorization_url }) });
    await assert.rejects(api.startLine('SK1'), { code: 'INVALID_RESPONSE' });
  }
  const api = createAuthApi(config, { origin, fetcher: async () => reply({ authorization_url: 'https://access.line.me/oauth2/v2.1/authorize?state=server-issued' }) });
  assert.match(await api.startLine('SK1'), /^https:\/\/access\.line\.me\//);
});
test('authenticated session requires member ID, ACTIVE and an explicit known role', async () => {
  for (const session of [{ state: 'authenticated' }, { state: 'authenticated', member_id: 'SK1', member_status: 'SUSPENDED', role: 'ADMIN' }, { state: 'authenticated', member_id: 'SK1', member_status: 'ACTIVE', role: 'OWNER' }]) {
    await assert.rejects(createAuthApi(config, { origin, fetcher: async () => reply(session) }).session(), { code: 'INVALID_RESPONSE' });
  }
  const session = { state: 'authenticated', member_id: 'SK1', member_status: 'ACTIVE', role: 'MEMBER' };
  assert.deepEqual(await createAuthApi(config, { origin, fetcher: async () => reply(session) }).session(), session);
});
test('bad LINE URLs, malformed JSON, invalid credentials and disabled server cannot authenticate', async () => {
  await assert.rejects(createAuthApi(config, { origin, fetcher: async () => reply({}) }).startLine('SK1'), { code: 'INVALID_RESPONSE' });
  await assert.rejects(createAuthApi(config, { origin, fetcher: async () => new Response('{bad', { headers: { 'Content-Type': 'application/json' } }) }).session(), { code: 'INVALID_RESPONSE' });
  await assert.rejects(createAuthApi(config, { origin, fetcher: async () => reply({}, 401) }).login('SK1', 'password'), { code: 'INVALID_CREDENTIALS' });
  await assert.rejects(createAuthApi(config, { origin, fetcher: async () => reply({}, 503) }).session(), { code: 'SERVICE_NOT_READY' });
});
