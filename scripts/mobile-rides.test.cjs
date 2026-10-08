const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: id => { if (id in imports) return imports[id]; throw Error(`Unexpected import: ${id}`); },
    URL, URLSearchParams, Error, AbortController, setTimeout, clearTimeout,
    process: { env: { DATABASE_URL: 'postgresql://example.test/db', EXPO_PUBLIC_API_URL: 'https://vaya.example.test' } },
    ...globals,
  });
  return module.exports;
}

test('missing deployed map API produces an actionable error', async () => {
  const api = load('mobile/src/lib/api.ts', {
    'expo-constants': {}, 'expo-device': { isDevice: true }, 'react-native': { Platform: { OS: 'ios' } },
  }, { fetch: async () => new Response('<html>Not found</html>', { status: 404 }) });
  await assert.rejects(api.getRoutePreview('Johannesburg', 'Durban'), /Deploy the latest backend/);
});

test('HTML success responses are rejected before rendering rides', async () => {
  const api = load('mobile/src/lib/api.ts', {
    'expo-constants': {}, 'expo-device': { isDevice: true }, 'react-native': { Platform: { OS: 'ios' } },
  }, { fetch: async () => new Response('<html>Login</html>') });
  await assert.rejects(api.searchTrips({ from: 'Johannesburg', to: 'Durban', passengers: 1 }), /invalid response/);
});

const { Pool } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');
const neonDrizzle = require('drizzle-orm/neon-serverless');

for (const fails of [false, true]) {
  test(`real transaction driver ${fails ? 'rolls back failed writes' : 'commits successful writes'} and releases connections`, async () => {
    const events = [];
    const failure = Error('Booking insert failed');
    class TestPool extends Pool {
      async connect() {
        events.push('connect');
        return {
          async query(query) {
            const text = (typeof query === 'string' ? query : query.text).trim();
            events.push(text);
            if (fails && text === 'insert into bookings default values') throw failure;
            return { rows: [], fields: [], rowCount: 0 };
          },
          release() { events.push('release'); },
        };
      }
      async end() { events.push('end'); }
    }
    const helper = load('web/lib/db/transaction.ts', {
      'server-only': {}, './schema': {},
      '@neondatabase/serverless': { Pool: TestPool },
      'drizzle-orm/neon-serverless': neonDrizzle,
    });
    const result = helper.withDbTransaction(async tx => {
      await tx.execute(sql.raw('update trips set seats_booked = seats_booked + 1'));
      await tx.execute(sql.raw('insert into bookings default values'));
      return 'BK-1';
    });
    if (fails) await assert.rejects(result, error => error.cause === failure);
    else assert.equal(await result, 'BK-1');
    assert.deepEqual(events, [
      'connect', 'begin',
      'update trips set seats_booked = seats_booked + 1',
      'insert into bookings default values',
      fails ? 'rollback' : 'commit', 'release', 'end',
    ]);
  });
}
