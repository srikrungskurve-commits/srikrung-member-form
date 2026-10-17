export class AuthError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export function createAuthApi(config, { fetcher = globalThis.fetch, origin = globalThis.location?.origin } = {}) {
  async function call(path, body) {
    if (!config.apiBase) throw new AuthError('NOT_CONFIGURED');
    const base = new URL(config.apiBase, origin);
    if (base.origin !== origin || base.protocol !== 'https:' || base.username || base.password) throw new AuthError('UNSAFE_API_ORIGIN');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetcher(`${base.href.replace(/\/$/, '')}${path}`, {
        method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
        cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-S-Kurve-Request': '1' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      if (response.status === 401) throw new AuthError(path === '/login' ? 'INVALID_CREDENTIALS' : 'SESSION_EXPIRED');
      if (response.status === 403) throw new AuthError('NOT_ALLOWED');
      if (response.status === 503) throw new AuthError('SERVICE_NOT_READY');
      if (!response.ok) throw new AuthError(response.status === 429 ? 'RATE_LIMITED' : 'REQUEST_REJECTED');
      if (!response.headers.get('content-type')?.includes('application/json')) throw new AuthError('INVALID_RESPONSE');
      try { return await response.json(); } catch { throw new AuthError('INVALID_RESPONSE'); }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('CONNECTION_FAILED');
    } finally { clearTimeout(timeout); }
  }
  return Object.freeze({
    async session() { const r = await call('/session'); if (!['authenticated', 'anonymous', 'expired'].includes(r?.state)) throw new AuthError('INVALID_RESPONSE'); if (r.state === 'authenticated' && (typeof r.member_id !== 'string' || !r.member_id.trim() || r.member_status !== 'ACTIVE' || !['MEMBER', 'ADMIN', 'SUB_ADMIN'].includes(r.role))) throw new AuthError('INVALID_RESPONSE'); return r; },
    async login(memberId, password) { const r = await call('/login', { member_id: memberId, password }); if (r?.authenticated !== true) throw new AuthError('REQUEST_REJECTED'); return r; },
    async logout() { const r = await call('/logout', {}); if (r?.success !== true) throw new AuthError('REQUEST_REJECTED'); },
    async startLine(memberId) { const r = await call('/password/line/start', { member_id: memberId }); let target; try { target = new URL(r?.authorization_url); } catch { throw new AuthError('INVALID_RESPONSE'); } if (!config.lineAuthorizationOrigins.includes(target.origin) || target.protocol !== 'https:' || target.username || target.password) throw new AuthError('INVALID_RESPONSE'); return target.href; },
    async passwordStatus() { const r = await call('/password/status'); if (typeof r?.verified !== 'boolean') throw new AuthError('INVALID_RESPONSE'); return r; },
    async setPassword(password) { const r = await call('/password/complete', { password }); if (r?.success !== true) throw new AuthError('REQUEST_REJECTED'); return r; }
  });
}
