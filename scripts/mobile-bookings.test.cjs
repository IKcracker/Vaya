const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module, exports: module.exports, require: id => {
      if (id in imports) return imports[id];
      throw Error(`Unexpected import: ${id}`);
    }, Request, Response, URL, Date, Error, console,
  }, { filename: file });
  return module.exports;
}

const tables = Object.fromEntries(['bookings', 'trips', 'drivers', 'passengers', 'payments', 'activityLogs', 'driverDocuments', 'driverVehicles', 'safetyCases']
  .map(name => [name, new Proxy({ table: name }, { get: (table, key) => key === 'table' ? name : `${name}.${String(key)}` })]));
const predicate = op => (...args) => ({ op, args });
const orm = Object.fromEntries(['and', 'or', 'eq', 'ne', 'gte', 'lt', 'ilike', 'asc', 'desc'].map(op => [op, predicate(op)]));
orm.sql = (parts, ...values) => ({ sql: parts.join('?'), values });
function matches(condition, rows) {
  if (!condition) return true;
  const { op, args } = condition;
  if (op === 'and') return args.every(value => matches(value, rows));
  if (op === 'or') return args.some(value => matches(value, rows));
  const [table, key] = String(args[0]).split('.');
  const actual = rows[table]?.[key];
  return op === 'eq' ? actual === args[1] : actual !== args[1];
}
function database(options = {}) {
  const state = {
    drivers: [{ id: 'driver-1', email: 'driver@example.test', status: 'Approved' }],
    passengers: [{ id: 'passenger-1', name: 'Passenger', email: 'passenger@example.test', phone: 'private' }],
    trips: [{ id: 'trip-1', publicId: 'TRIP-1', driverId: 'driver-1', departureAt: new Date('2030-01-01'), status: options.tripStatus ?? 'Scheduled', seatsBooked: 2 }],
    bookings: [{ id: 'booking-1', publicId: 'BK-1', tripId: 'trip-1', passengerId: 'passenger-1', status: options.bookingStatus ?? 'Awaiting payment', paymentStatus: options.paymentStatus ?? 'Pending', seats: 2 }],
    payments: options.attempt ? [{ id: 'payment-1', publicId: 'PAY-1', bookingId: 'booking-1', status: options.attempt, amountCents: 20000 }] : [],
    activityLogs: [],
  };
  const events = [];
  function query(run) {
    const q = { then: (resolve, reject) => Promise.resolve().then(run).then(resolve, reject) };
    return q;
  }
  const db = {
    select(selection) {
      let table, condition, joined = [];
      const q = query(() => state[table.table].flatMap(row => {
        const rows = { [table.table]: row };
        for (const join of joined) rows[join.table] = state[join.table][0];
        if (!matches(condition, rows)) return [];
        return [selection ? Object.fromEntries(Object.entries(selection).map(([key, column]) => {
          const [name, prop] = column.split('.');
          return [key, rows[name]?.[prop]];
        })) : { ...row }];
      }));
      q.from = value => { table = value; return q; };
      q.innerJoin = value => { joined.push(value); return q; };
      q.where = value => { condition = value; return q; };
      q.limit = () => q;
      q.orderBy = () => q;
      q.for = mode => { events.push(`lock:${table.table}:${mode}`); return q; };
      return q;
    },
    update(table) {
      let values, condition;
      const q = query(() => {
        const rows = state[table.table].filter(row => matches(condition, { [table.table]: row }));
        for (const row of rows) {
          events.push(`update:${table.table}`);
          for (const [key, value] of Object.entries(values)) {
            if (value?.sql && key === 'seatsBooked') row[key] = Math.max(0, row[key] - value.values[1]);
            else if (value?.sql && key === 'status') {
              if (!['Cancelled', 'Completed'].includes(row.status)) row.status = 'Confirmed';
            } else row[key] = value;
          }
        }
        return rows;
      });
      q.set = value => { values = value; return q; };
      q.where = value => { condition = value; return q; };
      q.returning = () => q;
      return q;
    },
    insert(table) {
      let values;
      const q = query(() => {
        if (options.auditFails && table === tables.activityLogs) throw Error('Audit unavailable');
        state[table.table].push({ id: 'new-row', ...values });
        events.push(`insert:${table.table}`);
        return [state[table.table].at(-1)];
      });
      q.values = value => { values = value; return q; };
      q.returning = () => q;
      return q;
    },
  };
  const imports = {
    'server-only': {}, 'drizzle-orm': orm, './index': { getDb: () => db }, './schema': tables,
    './driver-documents': { getDriverVerificationSummary: async () => ({ readyToApprove: true }) },
    './transaction': { withDbTransaction: async callback => {
      const snapshot = structuredClone(state);
      events.push('begin');
      try { const result = await callback(db); events.push('commit'); return result; }
      catch (error) { Object.assign(state, snapshot); events.push('rollback'); throw error; }
    } },
  };
  return { state, events, bookings: load('web/lib/db/mobile-bookings.ts', imports), public: load('web/lib/db/public.ts', imports) };
}

test('unpaid cancellation releases seats once and retries are idempotent', async () => {
  const db = database({ tripStatus: 'Full' });
  await db.bookings.cancelUnpaidBooking(' PASSENGER@EXAMPLE.TEST ', 'BK-1');
  assert.equal(db.state.trips[0].seatsBooked, 0);
  assert.equal(db.state.trips[0].status, 'Scheduled');
  assert.equal(db.state.bookings[0].status, 'Cancelled');
  assert.equal(db.state.activityLogs.length, 1);
  assert.deepEqual(db.events.slice(0, 3), ['begin', 'lock:trips:update', 'lock:bookings:update']);
  await db.bookings.cancelUnpaidBooking('passenger@example.test', 'BK-1');
  assert.equal(db.state.activityLogs.length, 1);
});

test('cancellation cannot release someone else’s booking, paid seats, or checkout attempts', async () => {
  for (const [options, email, error] of [
    [{}, 'other@example.test', /BOOKING_NOT_FOUND/],
    [{ paymentStatus: 'Paid' }, 'passenger@example.test', /BOOKING_CANNOT_CANCEL/],
    [{ bookingStatus: 'Confirmed' }, 'passenger@example.test', /BOOKING_CANNOT_CANCEL/],
    [{ tripStatus: 'Boarding' }, 'passenger@example.test', /BOOKING_CANNOT_CANCEL/],
    [{ tripStatus: 'Completed' }, 'passenger@example.test', /BOOKING_CANNOT_CANCEL/],
    [{ attempt: 'Pending' }, 'passenger@example.test', /BOOKING_CHECKOUT_STARTED/],
    [{ attempt: 'Failed' }, 'passenger@example.test', /BOOKING_CHECKOUT_STARTED/],
  ]) {
    const db = database(options);
    await assert.rejects(db.bookings.cancelUnpaidBooking(email, 'BK-1'), error);
    assert.equal(db.state.trips[0].seatsBooked, 2);
    assert.equal(db.events.filter(event => event.startsWith('update:')).length, 0);
  }
});

test('cancellation rolls back the booking and seat count if the audit write fails', async () => {
  const db = database({ auditFails: true });
  await assert.rejects(db.bookings.cancelUnpaidBooking('passenger@example.test', 'BK-1'), /Audit unavailable/);
  assert.equal(db.state.bookings[0].status, 'Awaiting payment');
  assert.equal(db.state.trips[0].seatsBooked, 2);
  assert.equal(db.events.at(-1), 'rollback');
});

test('driver passenger lists require trip ownership and do not include passenger phone numbers', async () => {
  const db = database();
  assert.equal(await db.bookings.getDriverTripPassengers('other@example.test', 'TRIP-1'), null);
  const list = await db.bookings.getDriverTripPassengers('DRIVER@example.test', 'TRIP-1');
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'Passenger');
  assert.equal(list[0].seats, 2);
  assert.equal('phone' in list[0], false);
});

test('driver completion updates linked bookings atomically and closed trips cannot reopen', async () => {
  const db = database();
  await db.public.updateMobileDriverTripStatus('driver@example.test', 'TRIP-1', 'Completed');
  assert.equal(db.state.trips[0].status, 'Completed');
  assert.equal(db.state.bookings[0].status, 'Completed');
  assert.equal(db.events.at(-1), 'commit');
  await assert.rejects(db.public.updateMobileDriverTripStatus('driver@example.test', 'TRIP-1', 'Scheduled'), /TRIP_CLOSED/);
  const fail = database({ auditFails: true });
  await assert.rejects(fail.public.updateMobileDriverTripStatus('driver@example.test', 'TRIP-1', 'Cancelled'), /Audit unavailable/);
  assert.equal(fail.state.trips[0].status, 'Scheduled');
  assert.equal(fail.state.bookings[0].status, 'Awaiting payment');
});

test('boarding cannot roll back to a state that permits editing', async () => {
  const db = database({ tripStatus: 'Boarding' });
  await assert.rejects(db.public.updateMobileDriverTripStatus('driver@example.test', 'TRIP-1', 'On schedule'), /TRIP_LOCKED/);
  assert.equal(db.state.trips[0].status, 'Boarding');
});

test('checkout rechecks the locked booking after cancellation', async () => {
  const db = database();
  await db.bookings.cancelUnpaidBooking('passenger@example.test', 'BK-1');
  await assert.rejects(db.public.createPendingMobilePayment({ bookingDatabaseId: 'booking-1', reference: 'PAY-1', amountCents: 20000 }), /BOOKING_CLOSED/);
  assert.equal(db.state.payments.length, 0);
});

test('late payment settlement preserves cancelled and completed booking statuses and settles once', async () => {
  for (const status of ['Cancelled', 'Completed', 'Awaiting payment']) {
    const db = database({ bookingStatus: status, attempt: 'Pending' });
    await db.public.settleMobilePayment('PAY-1');
    assert.equal(db.state.bookings[0].status, status === 'Awaiting payment' ? 'Confirmed' : status);
    assert.equal(db.state.bookings[0].paymentStatus, 'Paid');
    assert.equal(db.state.payments[0].status, 'Settled');
    await db.public.settleMobilePayment('PAY-1');
    assert.equal(db.state.activityLogs.length, 1);
  }
});

test('booking cancellation and passenger-list routes enforce identity and preserve ownership errors', async () => {
  for (const kind of ['passenger', 'driver']) {
    let auth = { status: 'unauthenticated' }, calls = 0;
    const api = load(kind === 'passenger' ? 'web/app/api/mobile/bookings/[id]/route.ts' : 'web/app/api/mobile/driver/trips/[id]/route.ts', {
      '@/lib/db': { isDatabaseConfigured: () => true }, '@/lib/db/public': {},
      '@/lib/passenger-auth': { getPassengerSession: async () => auth, getMobileSessionCookie: () => '' },
      '@/lib/db/mobile-bookings': {
        cancelUnpaidBooking: async email => { calls++; assert.equal(email, 'account@example.test'); throw Error('BOOKING_NOT_FOUND'); },
        getDriverTripPassengers: async email => { calls++; assert.equal(email, 'account@example.test'); return null; },
      },
    });
    const method = kind === 'passenger' ? api.DELETE : api.GET;
    const args = [new Request('https://vaya.test/api'), { params: Promise.resolve({ id: 'reference' }) }];
    assert.equal((await method(...args)).status, 401);
    assert.equal(calls, 0);
    auth = { status: 'authenticated', user: { email: 'account@example.test' } };
    assert.equal((await method(...args)).status, 404);
    assert.equal(calls, 1);
  }
});

test('seat links reject fractional, excessive and malformed counts', () => {
  const api = load('mobile/src/lib/trip-state.ts');
  assert.equal(api.parseSeatCount(undefined), 1);
  for (const count of ['1', '3', '8']) assert.equal(api.parseSeatCount(count), Number(count));
  for (const count of ['0', '9', '1.5', 'Infinity', '', '-1', ['2']]) assert.equal(api.parseSeatCount(count), null);
});

test('active journeys remain upcoming after departure and terminal bookings stay in history', () => {
  const api = load('mobile/src/lib/trip-state.ts');
  const trip = { departureAt: '2020-01-01', bookingStatus: 'Confirmed', tripStatus: 'Boarding' };
  assert.equal(api.isUpcomingBooking(trip, Date.now()), true);
  assert.equal(api.isUpcomingBooking({ ...trip, tripStatus: 'On schedule' }, Date.now()), true);
  assert.equal(api.isUpcomingBooking({ ...trip, bookingStatus: 'Cancelled' }, Date.now()), false);
  assert.equal(api.isUpcomingBooking({ ...trip, tripStatus: 'Completed' }, Date.now()), false);
});

test('reservation-release UI matches the server’s boarding, checkout and payment restrictions', () => {
  const api = load('mobile/src/lib/trip-state.ts');
  const booking = { status: 'Awaiting payment', paymentStatus: 'Pending', payments: [], trip: { departureAt: '2030-01-01', status: 'Scheduled' } };
  assert.equal(api.canReleaseReservation(booking, Date.now()), true);
  assert.equal(api.canReleaseReservation({ ...booking, payments: [{}] }, Date.now()), false);
  assert.equal(api.canReleaseReservation({ ...booking, paymentStatus: 'Paid' }, Date.now()), false);
  assert.equal(api.canReleaseReservation({ ...booking, trip: { ...booking.trip, status: 'Boarding' } }, Date.now()), false);
  assert.equal(api.canReleaseReservation(booking, new Date('2031-01-01').getTime()), false);
});

test('booking creation validates the quote and uses the signed-in passenger instead of client identity', async () => {
  let received;
  const api = load('web/app/api/mobile/bookings/route.ts', {
    '@/lib/db': { isDatabaseConfigured: () => true },
    '@/lib/passenger-auth': { getPassengerSession: async () => ({ status: 'authenticated', user: { email: 'account@example.test' } }), getMobileSessionCookie: () => '' },
    '@/lib/db/public': {
      getPassengerAccountByEmail: async email => ({ email, name: 'Passenger', city: 'Pretoria' }),
      createPublicBooking: async input => { received = input; return { id: 'BK-1' }; },
    },
  });
  const request = body => new Request('https://vaya.test/api', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await api.POST(request({ tripId: 'TRIP-1', seats: 1, expectedFareCents: -1 }))).status, 400);
  assert.equal(received, undefined);
  assert.equal((await api.POST(request({ tripId: 'TRIP-1', seats: 2, expectedFareCents: 20000, passenger: { email: 'other@example.test' } }))).status, 201);
  assert.equal(received.passenger.email, 'account@example.test');
  assert.equal(received.expectedFareCents, 20000);
  assert.equal(received.seats, 2);
});
