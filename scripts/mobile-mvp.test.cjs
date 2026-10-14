const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(file, imports = {}, globals = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(
    source,
    {
      module,
      exports: module.exports,
      require: (id) => {
        if (id in imports) return imports[id];
        throw new Error("Unexpected import: " + id);
      },
      URL,
      Request,
      Response,
      Headers,
      Error,
      Buffer,
      Date,
      AbortSignal,
      process: { env: {} },
      console,
      ...globals,
    },
    { filename: file },
  );
  return module.exports;
}
function recovery(name, fetch) {
  const site = { getSiteUrl: () => new URL("https://vaya.example.test") };
  const auth = load(
    "web/lib/passenger-auth.ts",
    { "./site-url": site },
    {
      fetch,
      process: {
        env: {
          NEON_AUTH_BASE_URL: "https://auth.example.test/auth",
          NEON_AUTH_ORIGIN: "https://vaya.example.test",
        },
      },
    },
  );
  return load("web/app/api/mobile/auth/" + name + "/route.ts", {
    "@/lib/passenger-auth": auth,
    "@/lib/site-url": site,
  });
}
const post = (body) =>
  new Request("https://untrusted.example.test/api", {
    method: "POST",
    body: JSON.stringify(body),
  });
test("recovery validates inputs and fixes the reset destination to the configured site", async () => {
  const calls = [];
  const api = recovery("forgot-password", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ status: true });
  });
  assert.equal((await api.POST(post({ email: "invalid" }))).status, 400);
  assert.equal(calls.length, 0);
  const response = await api.POST(
    post({
      email: " User@Example.test ",
      redirectTo: "https://untrusted.example.test",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    email: "user@example.test",
    redirectTo: "https://vaya.example.test/reset-password",
  });
  assert.equal(calls[0].init.headers.origin, "https://vaya.example.test");
  assert.match((await response.json()).message, /If an account exists/);
});
test("recovery preserves rate limits and rejects invalid upstream responses", async () => {
  for (const [upstream, status] of [
    [Response.json({ message: "Too many requests" }, { status: 429 }), 429],
    [new Response("<html>Unavailable</html>"), 503],
  ]) {
    const api = recovery("forgot-password", async () => upstream.clone());
    assert.equal(
      (await api.POST(post({ email: "user@example.test" }))).status,
      status,
    );
  }
});
test("password reset rejects weak passwords and expired links without claiming success", async () => {
  let calls = 0;
  const api = recovery("reset-password", async () => {
    calls++;
    return Response.json({ message: "Invalid token" }, { status: 400 });
  });
  assert.equal(
    (await api.POST(post({ token: "token", newPassword: "short" }))).status,
    400,
  );
  assert.equal(calls, 0);
  const response = await api.POST(
    post({ token: "expired", newPassword: "ValidPassword123" }),
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /expired/);
  const success = recovery("reset-password", async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), {
      token: "token",
      newPassword: "ValidPassword123",
    });
    return Response.json({ status: true });
  });
  assert.equal(
    (
      await success.POST(
        post({ token: "token", newPassword: "ValidPassword123" }),
      )
    ).status,
    200,
  );
});
test("onboarding persists independently on native and web", async () => {
  for (const platform of ["ios", "web"]) {
    const data = new Map();
    let nativeCalls = 0;
    const store = {
      getItemAsync: async (key) => {
        nativeCalls++;
        return data.get(key) || null;
      },
      setItemAsync: async (key, value) => {
        nativeCalls++;
        data.set(key, value);
      },
    };
    const api = load(
      "mobile/src/lib/onboarding-storage.ts",
      {
        "expo-secure-store": store,
        "react-native": { Platform: { OS: platform } },
      },
      {
        localStorage: {
          getItem: (key) => data.get(key) || null,
          setItem: (key, value) => data.set(key, value),
        },
      },
    );
    assert.equal(await api.readOnboardingCompleted(), false);
    await api.completeOnboarding();
    assert.equal(await api.readOnboardingCompleted(), true);
    if (platform === "web") assert.equal(nativeCalls, 0);
  }
});
test("location preferences prevent writes and reject missing or null coordinates", async () => {
  let sharing = false,
    writes = 0;
  const api = load("web/app/api/mobile/driver/trips/[id]/location/route.ts", {
    "@/lib/db": { isDatabaseConfigured: () => true },
    "@/lib/passenger-auth": {
      getMobileSessionCookie: () => "",
      getPassengerSession: async () => ({
        status: "authenticated",
        user: { email: "driver@example.test" },
      }),
    },
    "@/lib/db/public": {
      getMobilePrivacyPreferencesByEmail: async () => ({
        locationSharing: sharing,
      }),
      updateMobileDriverLiveLocationByEmail: async () => {
        writes++;
        return { latitude: -26, longitude: 28 };
      },
    },
  });
  const params = { params: Promise.resolve({ id: "trip-1" }) };
  assert.equal(
    (await api.POST(post({ latitude: null, longitude: null }), params)).status,
    400,
  );
  assert.equal(
    (await api.POST(post({ latitude: -26, longitude: 28 }), params)).status,
    409,
  );
  assert.equal(writes, 0);
  sharing = true;
  assert.equal(
    (await api.POST(post({ latitude: -26, longitude: 28 }), params)).status,
    200,
  );
  assert.equal(writes, 1);
});
test("hidden driver photos cannot be downloaded from the public endpoint", async () => {
  let visible = false;
  const api = load("web/app/api/public/drivers/[id]/profile-image/route.ts", {
    "@/lib/db": { isDatabaseConfigured: () => true },
    "@/lib/db/profile-images": {
      getDriverProfileImageById: async () => ({
        email: "driver@example.test",
        driverStatus: "Approved",
        contentType: "image/png",
        fileData: "aGVsbG8=",
      }),
    },
    "@/lib/db/public": {
      getMobilePrivacyPreferencesByEmail: async () => ({
        profileVisible: visible,
      }),
    },
  });
  const args = [
    new Request("https://vaya.example.test/photo"),
    { params: Promise.resolve({ id: "driver-1" }) },
  ];
  assert.equal((await api.GET(...args)).status, 404);
  visible = true;
  const response = await api.GET(...args);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("driver mode is remembered for the matching account and defaults safely for another account", async () => {
  for (const platform of ["web", "ios"]) {
    const data = new Map();
    const storage = {
      getItemAsync: async (key) => data.get(key) || null,
      setItemAsync: async (key, value) => data.set(key, value),
    };
    const api = load(
      "mobile/src/lib/travel-mode-storage.ts",
      {
        "expo-secure-store": storage,
        "react-native": { Platform: { OS: platform } },
      },
      {
        localStorage: {
          getItem: (key) => data.get(key) || null,
          setItem: (key, value) => data.set(key, value),
        },
      },
    );
    assert.equal(await api.readTravelMode("driver@example.test"), "passenger");
    await api.saveTravelMode("DRIVER@example.test", "driver");
    assert.equal(await api.readTravelMode("driver@example.test"), "driver");
    assert.equal(await api.readTravelMode("another@example.test"), "passenger");
    await api.saveTravelMode("driver@example.test", "passenger");
    assert.equal(await api.readTravelMode("driver@example.test"), "passenger");
  }
});
function bookingDatabase(ownerEmail) {
  const tables = Object.fromEntries(
    [
      "passengers",
      "drivers",
      "trips",
      "bookings",
      "payments",
      "activityLogs",
      "driverDocuments",
      "driverVehicles",
      "safetyCases",
    ].map((name) => [
      name,
      new Proxy(
        { name },
        {
          get: (table, key) =>
            key === "name" ? name : name + "." + String(key),
        },
      ),
    ]),
  );
  const passenger = {
    id: "passenger-1",
    name: "Test passenger",
    email: "passenger@example.test",
    city: "Pretoria",
    status: "Active",
  };
  const trip = {
    id: "trip-1",
    publicId: "TRIP-1",
    fromCity: "Pretoria",
    toCity: "Durban",
    fareCents: 20000,
    departureAt: new Date("2030-01-01"),
  };
  let writes = 0;
  const predicates = [];
  const tx = {
    select: () => {
      let table;
      const query = {
        from: (value) => {
          table = value;
          return query;
        },
        innerJoin: () => query,
        where: () => query,
        limit: async () =>
          table === tables.trips ? [{ email: ownerEmail }] : [passenger],
      };
      return query;
    },
    update: (table) => {
      writes++;
      const query = {
        set: () => query,
        where: (condition) => {
          predicates.push(condition);
          return query;
        },
        returning: async () => [trip],
      };
      return query;
    },
    insert: (table) => {
      writes++;
      const query = {
        values: () => query,
        returning: async () =>
          table === tables.bookings
            ? [
                {
                  id: "booking-1",
                  publicId: "BK-1",
                  seats: 1,
                  status: "Awaiting payment",
                  paymentStatus: "Pending",
                  amountCents: 20000,
                },
              ]
            : [passenger],
      };
      return query;
    },
  };
  const sql = (parts, ...values) => ({ sql: parts.join("?"), values });
  const fn = (...values) => ({ values });
  const api = load(
    "web/lib/db/public.ts",
    {
      "server-only": {},
      "drizzle-orm": {
        sql,
        and: fn,
        or: fn,
        eq: fn,
        asc: fn,
        desc: fn,
        gte: fn,
        ilike: fn,
        lt: fn,
        ne: fn,
      },
      "./index": {},
      "./transaction": { withDbTransaction: (callback) => callback(tx) },
      "./driver-documents": {},
      "./schema": tables,
    },
    { crypto: { randomUUID: () => "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" } },
  );
  return { api, writes: () => writes, predicates };
}
test("self-booking is rejected before creating passengers, reserving seats or writing bookings", async () => {
  const db = bookingDatabase(" PASSENGER@EXAMPLE.TEST ");
  await assert.rejects(
    db.api.createPublicBooking({
      tripId: "TRIP-1",
      seats: 1,
      passenger: {
        name: "Test",
        email: "passenger@example.test",
        city: "Pretoria",
      },
    }),
    /OWN_TRIP_BOOKING/,
  );
  assert.equal(db.writes(), 0);
});
test("passengers can book another driver and ownership is checked in the atomic seat update", async () => {
  const db = bookingDatabase("another-driver@example.test");
  const booking = await db.api.createPublicBooking({
    tripId: "TRIP-1",
    seats: 1,
    passenger: {
      name: "Test",
      email: "passenger@example.test",
      city: "Pretoria",
    },
  });
  assert.equal(booking.id, "BK-1");
  assert.equal(booking.seats, 1);
  const predicate = JSON.stringify(db.predicates[0]);
  assert.match(predicate, /not exists/);
  assert.match(predicate, /passenger@example.test/);
});
test("both booking APIs return a clear forbidden response for the owner", async () => {
  for (const kind of ["mobile", "public"]) {
    const api = load("web/app/api/" + kind + "/bookings/route.ts", {
      "@/lib/db": { isDatabaseConfigured: () => true },
      "@/lib/db/public": {
        getPassengerAccountByEmail: async () => ({
          name: "Driver",
          email: "driver@example.test",
          city: "Pretoria",
        }),
        createPublicBooking: async () => {
          throw new Error("OWN_TRIP_BOOKING");
        },
      },
      "@/lib/passenger-auth": {
        getMobileSessionCookie: () => "",
        getPassengerSession: async () => ({
          status: "authenticated",
          user: { email: "driver@example.test" },
        }),
      },
    });
    const response = await api.POST(
      post({
        tripId: "TRIP-1",
        seats: 1,
        passenger: {
          name: "Driver",
          email: "driver@example.test",
          city: "Pretoria",
        },
      }),
    );
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /cannot book your own ride/);
  }
});

function ownershipHarness(fetchDriver) {
  const slots = [];
  let cursor = 0,
    session = "current-session",
    effect;
  const react = {
    useState: (initial) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useCallback: (callback) => callback,
  };
  const hook = load("mobile/src/hooks/use-trip-ownership.ts", {
    react: react,
    "expo-router": {
      useFocusEffect: (callback) => {
        effect = callback;
      },
    },
    "@/lib/auth": { fetchMobileDriver: fetchDriver },
    "@/providers/passenger-auth-provider": {
      usePassengerAuth: () => ({ session }),
    },
  });
  return {
    render: () => {
      cursor = 0;
      return hook.useTripOwnership("TRIP-1");
    },
    focus: () => effect(),
    guest: () => {
      session = null;
    },
  };
}
const finish = async () => {
  await new Promise(setImmediate);
  await new Promise(setImmediate);
};
test("client ownership checks wait for the account and do not carry ownership into guest browsing", async () => {
  for (const own of [true, false]) {
    const harness = ownershipHarness(async () => ({
      trips: own ? [{ id: "TRIP-1" }] : [{ id: "OTHER-TRIP" }],
    }));
    assert.equal(harness.render().checked, false);
    harness.focus();
    await finish();
    assert.equal(harness.render().checked, true);
    assert.equal(harness.render().owned, own);
    harness.guest();
    assert.equal(harness.render().owned, false);
  }
});
test("ownership outages keep booking disabled and a retry can recover", async () => {
  let available = false;
  const harness = ownershipHarness(async () => {
    if (!available) throw new Error("Temporarily unavailable");
    return { trips: [] };
  });
  harness.render();
  harness.focus();
  await finish();
  const failed = harness.render();
  assert.equal(failed.checked, false);
  assert.match(failed.error, /Temporarily unavailable/);
  available = true;
  failed.retry();
  harness.render();
  harness.focus();
  await finish();
  assert.equal(harness.render().checked, true);
  assert.equal(harness.render().error, null);
});
