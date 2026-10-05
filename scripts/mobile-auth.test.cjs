const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, imports = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: (id) => { if (id in imports) return imports[id]; throw new Error(`Unexpected import: ${id}`); },
    URL, Headers, Response, Request, AbortController, AbortSignal, Error, setTimeout, clearTimeout,
    process: { env: {} }, console, ...globals,
  }, { filename: file });
  return module.exports;
}

function backend(fetchImpl) {
  const env = { NEON_AUTH_BASE_URL: 'https://auth.example.test/auth', NEON_AUTH_ORIGIN: 'https://vaya.example.test' };
  const auth = load('web/lib/passenger-auth.ts', { './site-url': { getSiteUrl: () => new URL('https://vaya.example.test') } }, { process: { env }, fetch: fetchImpl });
  const routes = {};
  for (const name of ['sign-in', 'sign-up', 'session', 'sign-out']) {
    routes[name] = load(`web/app/api/mobile/auth/${name}/route.ts`, {
      '@/lib/passenger-auth': auth,
      '@/lib/db': { isDatabaseConfigured: () => true },
      '@/lib/db/public': { ensurePassengerForAuthUser: async ({ name, email, city }) => ({ id: 'passenger-1', name, email, city }) },
    });
  }
  return { auth, routes };
}

const user = { id: 'auth-1', name: 'Test Passenger', email: 'passenger@example.test' };
const signInRequest = () => new Request('https://internal.example.test/api/mobile/auth/sign-in', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: user.email, password: 'ValidPassword123' }),
});

test('sign-in, restore, and sign-out transfer the session cookie and canonical origin', async () => {
  const calls = [];
  const { routes } = backend(async (url, init) => {
    calls.push({ url, init });
    assert.equal(init.headers.origin, 'https://vaya.example.test');
    assert.ok(init.signal);
    if (url.endsWith('/sign-in/email')) return Response.json({ user }, { headers: { 'set-cookie': 'session_token=signed-token; HttpOnly; Secure; Path=/' } });
    if (url.endsWith('/get-session')) { assert.equal(init.headers.cookie, 'session_token=signed-token'); return Response.json({ user }); }
    return Response.json({ success: true });
  });
  const signedIn = await routes['sign-in'].POST(signInRequest());
  assert.equal(signedIn.status, 200);
  const payload = await signedIn.json();
  assert.equal(payload.passenger.email, user.email);
  assert.equal(payload.session, 'session_token=signed-token');
  const sessionRequest = new Request('https://internal.example.test/api/mobile/auth/session', { headers: { 'x-vaya-session': payload.session } });
  assert.equal((await routes.session.GET(sessionRequest)).status, 200);
  assert.equal((await routes['sign-out'].POST(sessionRequest)).status, 200);
  assert.equal(calls.length, 3);
});

test('origin rejection is a configuration error, not invalid credentials', async () => {
  const { routes } = backend(async () => Response.json({ message: 'Invalid origin' }, { status: 403 }));
  const response = await routes['sign-in'].POST(signInRequest());
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /NEON_AUTH_ORIGIN/);
});

test('auth outages preserve the distinction from expired sessions', async () => {
  const { auth } = backend(async () => { throw new Error('Network unavailable'); });
  await assert.rejects(auth.getPassengerSession('session_token=valid'), (error) => error.status === 503);
  const expired = backend(async () => Response.json({}, { status: 401 }));
  assert.equal((await expired.auth.getPassengerSession('session_token=expired')).status, 'unauthenticated');
});

test('malformed auth responses do not invalidate saved sessions', async () => {
  const { auth } = backend(async () => new Response('<html>Unavailable</html>'));
  await assert.rejects(auth.getPassengerSession('session_token=valid'), (error) => error.status === 503);
});

test('a valid null session response expires credentials rather than reporting an outage', async () => {
  const { auth, routes } = backend(async () => Response.json(null));
  assert.equal((await auth.getPassengerSession('session_token=expired')).status, 'unauthenticated');
  const response = await routes.session.GET(new Request('https://vaya.example.test/api/mobile/auth/session', {
    headers: { 'x-vaya-session': 'session_token=expired' },
  }));
  assert.equal(response.status, 401);
});

test('missing cookies never produce a successful sign-in', async () => {
  const { routes } = backend(async () => Response.json({ user }));
  assert.equal((await routes['sign-in'].POST(signInRequest())).status, 502);
});

test('email-verification sign-up returns an actionable result without claiming a session', async () => {
  const { routes } = backend(async () => Response.json({ user }));
  const response = await routes['sign-up'].POST(new Request('https://vaya.example.test/api/mobile/auth/sign-up', {
    method: 'POST', body: JSON.stringify({ name: user.name, email: user.email, password: 'ValidPassword123', city: 'Pretoria' }),
  }));
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.session, null);
  assert.match(payload.message, /verify/);
});

test('cookie parsing handles Expires commas and excludes cleared cookies', () => {
  const { auth } = backend(async () => Response.json({}));
  const headers = { get: () => 'session_token=abc; Expires=Wed, 09 Jun 2030 10:18:14 GMT, session_data=xyz; Path=/, removed=; Max-Age=0' };
  assert.equal(auth.sessionCookieFromHeaders(headers), 'session_token=abc; session_data=xyz');
});

test('CORS allows explicit Expo Web origins and rejects unrelated sites', () => {
  const cors = load('web/lib/mobile-cors.ts', { './site-url': { getSiteUrl: () => new URL('https://vaya.example.test') } }, {
    process: { env: { NODE_ENV: 'production', MOBILE_WEB_ORIGINS: 'http://localhost:8081' } },
  });
  assert.equal(cors.mobileCorsHeaders('http://localhost:8081')['Access-Control-Allow-Origin'], 'http://localhost:8081');
  assert.match(cors.mobileCorsHeaders('http://localhost:8081')['Access-Control-Allow-Headers'], /X-Vaya-Session/);
  assert.equal(cors.mobileCorsHeaders('https://untrusted.example.test'), null);
});

test('large sessions survive secure storage limits and failed replacement writes', async () => {
  const { readSession, writeSession } = load('mobile/src/lib/session-storage.ts');
  const data = new Map([['vaya.passenger.session', 'legacy-token']]);
  let fail = false;
  const storage = {
    getItemAsync: async (key) => data.get(key) ?? null,
    setItemAsync: async (key, value) => { assert.ok(value.length <= 1800); if (fail) throw new Error('Keychain failure'); data.set(key, value); },
    deleteItemAsync: async (key) => { data.delete(key); },
  };
  assert.equal(await readSession(storage), 'legacy-token');
  const token = 'session_token=' + 'x'.repeat(6000);
  await writeSession(storage, token);
  assert.equal(await readSession(storage), token);
  fail = true;
  await assert.rejects(writeSession(storage, 'replacement'));
  assert.equal(await readSession(storage), token);
  fail = false;
  await writeSession(storage, null);
  assert.equal(await readSession(storage), null);
  assert.equal(data.size, 0);
});

test('mobile client preserves HTTP status and validates sign-in payloads', async () => {
  const storage = new Map();
  let response = Response.json({}, { status: 401 });
  const client = load('mobile/src/lib/auth.ts', {
    'expo-secure-store': {}, 'react-native': { Platform: { OS: 'web' } },
    './session-storage': {}, '@/lib/api': { API_URL: 'https://vaya.example.test', normalizeConnectionError: (error) => error },
  }, {
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    fetch: async (_url, init) => { assert.ok(init.signal); return response.clone(); },
  });
  await assert.rejects(client.fetchPassengerSession('expired'), (error) => client.isExpiredSession(error));
  response = Response.json({ user });
  await assert.rejects(client.passengerSignIn(user.email, 'ValidPassword123'), /valid session/);
  assert.equal(storage.size, 0);
  response = Response.json({ user, passenger: { email: user.email }, session: null, message: 'Verify your email, then sign in.' });
  const created = await client.passengerSignUp({ name: user.name, email: user.email, password: 'ValidPassword123', city: 'Pretoria' });
  assert.equal(created.session, null);
  assert.match(created.message, /Verify/);
  assert.equal(storage.size, 0);
  response = Response.json({ user, passenger: { email: user.email }, session: 'signed-token' });
  await client.passengerSignIn(user.email, 'ValidPassword123');
  await client.storeSession('signed-token');
  assert.equal(await client.readStoredSession(), 'signed-token');
  response = Response.json({}, { status: 503 });
  await client.passengerSignOut('signed-token');
  assert.equal(await client.readStoredSession(), null);
});

function providerHarness(api) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState: (initial) => { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], (value) => { slots[i] = value; }]; },
    useRef: (initial) => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useCallback: (callback) => callback,
    useMemo: (factory) => factory(),
    useEffect: (effect) => { const i = cursor++; if (!(i in slots)) { slots[i] = true; effects.push(effect); } },
  };
  const provider = load('mobile/src/providers/passenger-auth-provider.tsx', {
    react, 'react/jsx-runtime': { jsx: (_type, props) => ({ props }) }, '@/lib/auth': api,
  });
  return {
    render: () => { cursor = 0; return provider.PassengerAuthProvider({ children: null }).props.value; },
    start: () => effects.splice(0).forEach((effect) => effect()),
  };
}

const flush = async () => { await new Promise(setImmediate); await new Promise(setImmediate); };

test('session restore preserves stored credentials on outage and clears only expired credentials', async () => {
  for (const status of [503, 401]) {
    let clears = 0;
    const harness = providerHarness({
      readStoredSession: async () => 'saved-token',
      fetchPassengerSession: async () => { throw Object.assign(new Error('Auth failure'), { status }); },
      isExpiredSession: (error) => error.status === 401,
      storeSession: async () => { clears++; },
    });
    harness.render(); harness.start(); await flush();
    assert.equal(harness.render().loading, false);
    assert.equal(clears, status === 401 ? 1 : 0);
  }
});

test('late session restore cannot sign the user back in after sign-out', async () => {
  let resolveSession;
  const pending = new Promise((resolve) => { resolveSession = resolve; });
  const harness = providerHarness({
    readStoredSession: async () => 'saved-token', fetchPassengerSession: () => pending,
    passengerSignOut: async () => {}, isExpiredSession: () => false,
  });
  harness.render(); harness.start(); await flush();
  await harness.render().signOut();
  resolveSession({ authenticated: true, user, passenger: { email: user.email } });
  await flush();
  assert.equal(harness.render().session, null);
  assert.equal(harness.render().user, null);
});

test('sign-in persists and displays the returned account without an unnecessary second request', async () => {
  let saved;
  const harness = providerHarness({
    passengerSignIn: async () => ({ session: 'signed-token', user, passenger: { email: user.email } }),
    storeSession: async (token) => { saved = token; },
    fetchPassengerSession: () => { throw new Error('Unexpected session waterfall'); },
  });
  await harness.render().signIn(user.email, 'ValidPassword123');
  const value = harness.render();
  assert.equal(saved, 'signed-token');
  assert.equal(value.session, 'signed-token');
  assert.equal(value.user.email, user.email);
  assert.equal(value.loading, false);
});

test('verification-required sign-up returns a notice without persisting or authenticating', async () => {
  const harness = providerHarness({
    passengerSignUp: async () => ({ session: null, user, message: 'Verify your email, then sign in.' }),
    storeSession: () => { throw new Error('No session should be stored'); },
  });
  const message = await harness.render().signUp({ name: user.name, email: user.email, password: 'ValidPassword123', city: 'Pretoria' });
  assert.match(message, /Verify/);
  assert.equal(harness.render().session, null);
  assert.equal(harness.render().user, null);
});
