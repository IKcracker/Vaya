import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL_UNPOOLED or DATABASE_URL is required to seed Vaya"
  );
}

const sql = neon(connectionString);

console.log("Seeding Vaya CRM development data...");

await sql`
  INSERT INTO drivers (
    initials,
    name,
    email,
    phone,
    location,
    vehicle_make,
    vehicle_model,
    vehicle_year,
    checks,
    status,
    submitted_at,
    updated_at
  )
  VALUES
    ('TM', 'Thabo Mokoena', 'thabo.mokoena@vaya.demo', '071 555 1001', 'Polokwane, Limpopo', 'Toyota', 'Corolla', 2022, 'Licence + vehicle verified', 'Review', '2026-10-04T00:32:00+02:00', '2026-10-04T00:32:00+02:00'),
    ('LN', 'Lerato Ndlovu', 'lerato.ndlovu@vaya.demo', '072 555 1002', 'Midrand, Gauteng', 'Volkswagen', 'Polo', 2021, 'Vehicle disc missing', 'Needs info', '2026-10-03T23:50:00+02:00', '2026-10-04T00:05:00+02:00'),
    ('RM', 'Rendani Mulaudzi', 'rendani.mulaudzi@vaya.demo', '073 555 1003', 'Thohoyandou, Limpopo', 'Ford', 'Everest', 2023, 'All checks complete', 'Ready', '2026-10-03T22:45:00+02:00', '2026-10-04T00:15:00+02:00'),
    ('SK', 'Sibusiso Khumalo', 'sibusiso.khumalo@vaya.demo', '074 555 1004', 'Durban, KwaZulu-Natal', 'Toyota', 'Quest', 2020, 'Identity review outstanding', 'Review', '2026-10-03T21:20:00+02:00', '2026-10-03T21:20:00+02:00'),
    ('LM', 'Lebo Mokoena', 'lebo.mokoena@vaya.demo', '076 555 1005', 'Johannesburg, Gauteng', 'Toyota', 'Corolla', 2022, 'All checks complete', 'Approved', '2026-08-12T09:30:00+02:00', '2026-09-28T14:12:00+02:00'),
    ('AD', 'Anele Dlamini', 'anele.dlamini@vaya.demo', '078 555 1006', 'Cape Town, Western Cape', 'Volkswagen', 'Polo', 2022, 'All checks complete', 'Approved', '2026-08-18T11:00:00+02:00', '2026-09-29T09:10:00+02:00'),
    ('KM', 'Karabo Maseko', 'karabo.maseko@vaya.demo', '079 555 1007', 'Mbombela, Mpumalanga', 'Toyota', 'Starlet', 2023, 'All checks complete', 'Approved', '2026-09-02T10:15:00+02:00', '2026-09-30T16:35:00+02:00'),
    ('PM', 'Precious Molefe', 'precious.molefe@vaya.demo', '071 555 1008', 'Rustenburg, North West', 'Hyundai', 'i20', 2021, 'All checks complete', 'Approved', '2026-08-24T08:00:00+02:00', '2026-09-25T12:20:00+02:00'),
    ('NB', 'Neo Botha', 'neo.botha@vaya.demo', '072 555 1009', 'Bloemfontein, Free State', 'Suzuki', 'Ertiga', 2022, 'Licence verified, vehicle pending', 'Needs info', '2026-10-02T15:40:00+02:00', '2026-10-03T08:45:00+02:00'),
    ('ZN', 'Zanele Nkosi', 'zanele.nkosi@vaya.demo', '073 555 1010', 'Pretoria, Gauteng', 'Kia', 'Sonet', 2024, 'All checks complete', 'Approved', '2026-09-05T13:20:00+02:00', '2026-09-27T11:05:00+02:00'),
    ('MT', 'Mandla Tshabalala', 'mandla.tshabalala@vaya.demo', '074 555 1011', 'Kimberley, Northern Cape', 'Toyota', 'Urban Cruiser', 2022, 'All checks complete', 'Approved', '2026-08-30T07:45:00+02:00', '2026-09-26T17:15:00+02:00'),
    ('SM', 'Sipho Mthembu', 'sipho.mthembu@vaya.demo', '076 555 1012', 'Gqeberha, Eastern Cape', 'Renault', 'Triber', 2021, 'All checks complete', 'Suspended', '2026-08-10T12:00:00+02:00', '2026-10-01T10:30:00+02:00')
  ON CONFLICT (email) DO UPDATE SET
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    vehicle_make = EXCLUDED.vehicle_make,
    vehicle_model = EXCLUDED.vehicle_model,
    vehicle_year = EXCLUDED.vehicle_year,
    checks = EXCLUDED.checks,
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = EXCLUDED.updated_at
`;

await sql`
  INSERT INTO passengers (
    name,
    email,
    phone,
    city,
    trips_count,
    status,
    joined_at,
    updated_at
  )
  VALUES
    ('Thato Maseko', 'thato.maseko@example.com', '071 600 2001', 'Johannesburg', 0, 'Active', '2026-08-04T12:30:00+02:00', '2026-10-02T09:15:00+02:00'),
    ('Nokuthula Dube', 'nokuthula@example.com', '072 600 2002', 'Cape Town', 0, 'Active', '2026-08-14T10:00:00+02:00', '2026-09-28T12:20:00+02:00'),
    ('Kagiso Seabi', 'kagiso@example.com', '073 600 2003', 'Polokwane', 0, 'Active', '2026-09-01T14:00:00+02:00', '2026-10-03T18:10:00+02:00'),
    ('Mpho Baloyi', 'mpho@example.com', '074 600 2004', 'Mbombela', 0, 'Review', '2026-09-20T09:30:00+02:00', '2026-10-01T11:25:00+02:00'),
    ('Zinhle Mkhize', 'zinhle.mkhize@example.com', '076 600 2005', 'Durban', 0, 'Active', '2026-08-22T08:40:00+02:00', '2026-09-30T13:10:00+02:00'),
    ('Lesego Molefe', 'lesego.molefe@example.com', '078 600 2006', 'Rustenburg', 0, 'Active', '2026-09-06T13:25:00+02:00', '2026-10-02T16:45:00+02:00'),
    ('Ayanda Zulu', 'ayanda.zulu@example.com', '079 600 2007', 'Pretoria', 0, 'Active', '2026-09-08T16:10:00+02:00', '2026-10-01T15:35:00+02:00'),
    ('Refilwe Sello', 'refilwe.sello@example.com', '071 600 2008', 'Bloemfontein', 0, 'Active', '2026-09-12T11:50:00+02:00', '2026-10-03T07:30:00+02:00'),
    ('Siphesihle Dlamini', 'siphesihle.dlamini@example.com', '072 600 2009', 'Gqeberha', 0, 'Active', '2026-09-15T10:20:00+02:00', '2026-10-03T12:05:00+02:00'),
    ('Nomsa Mokoena', 'nomsa.mokoena@example.com', '073 600 2010', 'Kimberley', 0, 'Active', '2026-09-18T17:00:00+02:00', '2026-10-02T14:10:00+02:00'),
    ('Tebogo Moremi', 'tebogo.moremi@example.com', '074 600 2011', 'Johannesburg', 0, 'Active', '2026-09-22T18:15:00+02:00', '2026-10-03T20:10:00+02:00'),
    ('Andile Mthethwa', 'andile.mthethwa@example.com', '076 600 2012', 'Durban', 0, 'Suspended', '2026-08-28T15:00:00+02:00', '2026-10-01T09:45:00+02:00')
  ON CONFLICT (email) DO UPDATE SET
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    status = EXCLUDED.status,
    joined_at = EXCLUDED.joined_at,
    updated_at = EXCLUDED.updated_at
`;

await sql`
  INSERT INTO trips (
    public_id,
    from_city,
    to_city,
    driver_id,
    driver_name,
    departure_at,
    seat_capacity,
    seats_booked,
    fare_cents,
    status,
    created_at,
    updated_at
  )
  SELECT
    seed.public_id,
    seed.from_city,
    seed.to_city,
    d.id,
    seed.driver_name,
    seed.departure_at,
    seed.seat_capacity,
    seed.seats_booked,
    seed.fare_cents,
    seed.status,
    seed.created_at,
    seed.updated_at
  FROM (
    VALUES
      ('VY-1048', 'Johannesburg', 'Durban', 'lebo.mokoena@vaya.demo', 'Lebo Mokoena', '2026-10-09T06:30:00+02:00'::timestamptz, 4, 3, 28000, 'On schedule', '2026-10-01T08:00:00+02:00'::timestamptz, '2026-10-03T20:00:00+02:00'::timestamptz),
      ('VY-1051', 'Cape Town', 'Gqeberha', 'anele.dlamini@vaya.demo', 'Anele Dlamini', '2026-10-09T07:00:00+02:00'::timestamptz, 4, 4, 32000, 'Full', '2026-10-01T09:10:00+02:00'::timestamptz, '2026-10-03T21:15:00+02:00'::timestamptz),
      ('VY-1053', 'Polokwane', 'Pretoria', 'rendani.mulaudzi@vaya.demo', 'Rendani Mulaudzi', '2026-10-09T08:30:00+02:00'::timestamptz, 4, 2, 18000, 'On schedule', '2026-10-02T07:35:00+02:00'::timestamptz, '2026-10-03T18:50:00+02:00'::timestamptz),
      ('VY-1055', 'Mbombela', 'Pretoria', 'karabo.maseko@vaya.demo', 'Karabo Maseko', '2026-10-09T09:15:00+02:00'::timestamptz, 3, 1, 19000, 'Boarding', '2026-10-02T10:15:00+02:00'::timestamptz, '2026-10-04T00:05:00+02:00'::timestamptz),
      ('VY-1058', 'Rustenburg', 'Johannesburg', 'precious.molefe@vaya.demo', 'Precious Molefe', '2026-10-10T05:45:00+02:00'::timestamptz, 4, 2, 16000, 'Scheduled', '2026-10-02T11:00:00+02:00'::timestamptz, '2026-10-03T16:30:00+02:00'::timestamptz),
      ('VY-1060', 'Pretoria', 'Polokwane', 'zanele.nkosi@vaya.demo', 'Zanele Nkosi', '2026-10-10T06:15:00+02:00'::timestamptz, 4, 4, 18500, 'Full', '2026-10-02T12:20:00+02:00'::timestamptz, '2026-10-03T22:40:00+02:00'::timestamptz),
      ('VY-1063', 'Kimberley', 'Bloemfontein', 'mandla.tshabalala@vaya.demo', 'Mandla Tshabalala', '2026-10-10T07:30:00+02:00'::timestamptz, 5, 2, 21000, 'Scheduled', '2026-10-02T13:15:00+02:00'::timestamptz, '2026-10-03T14:00:00+02:00'::timestamptz),
      ('VY-1036', 'Cape Town', 'Worcester', 'anele.dlamini@vaya.demo', 'Anele Dlamini', '2026-10-01T08:00:00+02:00'::timestamptz, 4, 3, 12000, 'Completed', '2026-09-28T10:00:00+02:00'::timestamptz, '2026-10-01T12:30:00+02:00'::timestamptz),
      ('VY-1039', 'Johannesburg', 'Durban', 'lebo.mokoena@vaya.demo', 'Lebo Mokoena', '2026-10-02T06:00:00+02:00'::timestamptz, 4, 4, 28000, 'Completed', '2026-09-29T09:15:00+02:00'::timestamptz, '2026-10-02T15:10:00+02:00'::timestamptz),
      ('VY-1041', 'Pretoria', 'Polokwane', 'zanele.nkosi@vaya.demo', 'Zanele Nkosi', '2026-10-03T07:00:00+02:00'::timestamptz, 4, 3, 18000, 'Completed', '2026-09-30T16:00:00+02:00'::timestamptz, '2026-10-03T11:40:00+02:00'::timestamptz),
      ('VY-1044', 'Bloemfontein', 'Johannesburg', 'neo.botha@vaya.demo', 'Neo Botha', '2026-10-07T05:30:00+02:00'::timestamptz, 5, 0, 22000, 'Driver review', '2026-10-01T17:45:00+02:00'::timestamptz, '2026-10-03T09:05:00+02:00'::timestamptz),
      ('VY-1066', 'Gqeberha', 'East London', 'sipho.mthembu@vaya.demo', 'Sipho Mthembu', '2026-10-11T07:15:00+02:00'::timestamptz, 4, 0, 14500, 'Suspended', '2026-10-03T10:30:00+02:00'::timestamptz, '2026-10-03T10:30:00+02:00'::timestamptz)
  ) AS seed(
    public_id,
    from_city,
    to_city,
    driver_email,
    driver_name,
    departure_at,
    seat_capacity,
    seats_booked,
    fare_cents,
    status,
    created_at,
    updated_at
  )
  LEFT JOIN drivers d ON d.email = seed.driver_email
  ON CONFLICT (public_id) DO UPDATE SET
    driver_id = EXCLUDED.driver_id,
    driver_name = EXCLUDED.driver_name,
    departure_at = EXCLUDED.departure_at,
    seat_capacity = EXCLUDED.seat_capacity,
    seats_booked = EXCLUDED.seats_booked,
    fare_cents = EXCLUDED.fare_cents,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at
`;

await sql`
  INSERT INTO bookings (
    public_id,
    trip_id,
    passenger_id,
    seats,
    amount_cents,
    payment_status,
    status,
    created_at,
    updated_at
  )
  SELECT
    seed.public_id,
    t.id,
    p.id,
    seed.seats,
    seed.amount_cents,
    seed.payment_status,
    seed.status,
    seed.created_at,
    seed.updated_at
  FROM (
    VALUES
      ('BK-20491', 'VY-1048', 'thato.maseko@example.com', 1, 28000, 'Paid', 'Confirmed', '2026-10-02T08:15:00+02:00'::timestamptz, '2026-10-02T08:20:00+02:00'::timestamptz),
      ('BK-20492', 'VY-1051', 'nokuthula@example.com', 2, 64000, 'Paid', 'Confirmed', '2026-10-02T09:05:00+02:00'::timestamptz, '2026-10-02T09:08:00+02:00'::timestamptz),
      ('BK-20493', 'VY-1053', 'kagiso@example.com', 1, 18000, 'Pending', 'Awaiting payment', '2026-10-03T07:40:00+02:00'::timestamptz, '2026-10-03T07:40:00+02:00'::timestamptz),
      ('BK-20494', 'VY-1055', 'mpho@example.com', 1, 19000, 'Paid', 'Confirmed', '2026-10-03T08:15:00+02:00'::timestamptz, '2026-10-03T08:17:00+02:00'::timestamptz),
      ('BK-20495', 'VY-1058', 'lesego.molefe@example.com', 1, 16000, 'Paid', 'Confirmed', '2026-10-03T09:00:00+02:00'::timestamptz, '2026-10-03T09:03:00+02:00'::timestamptz),
      ('BK-20496', 'VY-1058', 'tebogo.moremi@example.com', 1, 16000, 'Paid', 'Confirmed', '2026-10-03T09:25:00+02:00'::timestamptz, '2026-10-03T09:28:00+02:00'::timestamptz),
      ('BK-20497', 'VY-1060', 'kagiso@example.com', 1, 18500, 'Paid', 'Confirmed', '2026-10-03T10:10:00+02:00'::timestamptz, '2026-10-03T10:13:00+02:00'::timestamptz),
      ('BK-20498', 'VY-1060', 'zinhle.mkhize@example.com', 1, 18500, 'Paid', 'Confirmed', '2026-10-03T10:45:00+02:00'::timestamptz, '2026-10-03T10:48:00+02:00'::timestamptz),
      ('BK-20499', 'VY-1063', 'nomsa.mokoena@example.com', 1, 21000, 'Paid', 'Confirmed', '2026-10-03T11:20:00+02:00'::timestamptz, '2026-10-03T11:23:00+02:00'::timestamptz),
      ('BK-20500', 'VY-1063', 'refilwe.sello@example.com', 1, 21000, 'Pending', 'Awaiting payment', '2026-10-03T11:55:00+02:00'::timestamptz, '2026-10-03T11:55:00+02:00'::timestamptz),
      ('BK-20501', 'VY-1036', 'nokuthula@example.com', 1, 12000, 'Refunded', 'Cancelled', '2026-09-30T13:00:00+02:00'::timestamptz, '2026-10-01T09:20:00+02:00'::timestamptz),
      ('BK-20502', 'VY-1039', 'ayanda.zulu@example.com', 1, 28000, 'Paid', 'Completed', '2026-10-01T08:30:00+02:00'::timestamptz, '2026-10-02T15:20:00+02:00'::timestamptz),
      ('BK-20503', 'VY-1041', 'andile.mthethwa@example.com', 1, 18000, 'Paid', 'Completed', '2026-10-02T10:10:00+02:00'::timestamptz, '2026-10-03T11:45:00+02:00'::timestamptz)
  ) AS seed(
    public_id,
    trip_public_id,
    passenger_email,
    seats,
    amount_cents,
    payment_status,
    status,
    created_at,
    updated_at
  )
  INNER JOIN trips t ON t.public_id = seed.trip_public_id
  INNER JOIN passengers p ON p.email = seed.passenger_email
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO payments (
    public_id,
    booking_id,
    amount_cents,
    method,
    status,
    created_at
  )
  SELECT
    seed.public_id,
    b.id,
    seed.amount_cents,
    seed.method,
    seed.status,
    seed.created_at
  FROM (
    VALUES
      ('PAY-88431', 'BK-20491', 28000, 'Card', 'Settled', '2026-10-02T08:20:00+02:00'::timestamptz),
      ('PAY-88432', 'BK-20492', 64000, 'Instant EFT', 'Settled', '2026-10-02T09:08:00+02:00'::timestamptz),
      ('PAY-88433', 'BK-20493', 18000, 'Card', 'Pending', '2026-10-03T07:40:00+02:00'::timestamptz),
      ('PAY-88434', 'BK-20494', 19000, 'Card', 'Settled', '2026-10-03T08:17:00+02:00'::timestamptz),
      ('PAY-88435', 'BK-20495', 16000, 'Card', 'Settled', '2026-10-03T09:03:00+02:00'::timestamptz),
      ('PAY-88436', 'BK-20496', 16000, 'Instant EFT', 'Settled', '2026-10-03T09:28:00+02:00'::timestamptz),
      ('PAY-88437', 'BK-20497', 18500, 'Card', 'Settled', '2026-10-03T10:13:00+02:00'::timestamptz),
      ('PAY-88438', 'BK-20498', 18500, 'Card', 'Settled', '2026-10-03T10:48:00+02:00'::timestamptz),
      ('PAY-88439', 'BK-20499', 21000, 'Instant EFT', 'Settled', '2026-10-03T11:23:00+02:00'::timestamptz),
      ('PAY-88440', 'BK-20500', 21000, 'Card', 'Pending', '2026-10-03T11:55:00+02:00'::timestamptz),
      ('PAY-88441', 'BK-20501', 12000, 'Card', 'Refunded', '2026-10-01T09:22:00+02:00'::timestamptz),
      ('PAY-88442', 'BK-20502', 28000, 'Card', 'Settled', '2026-10-01T08:35:00+02:00'::timestamptz),
      ('PAY-88443', 'BK-20503', 18000, 'Instant EFT', 'Settled', '2026-10-02T10:15:00+02:00'::timestamptz)
  ) AS seed(
    public_id,
    booking_public_id,
    amount_cents,
    method,
    status,
    created_at
  )
  INNER JOIN bookings b ON b.public_id = seed.booking_public_id
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO safety_cases (
    public_id,
    subject,
    trip_id,
    trip_label,
    priority,
    owner,
    note,
    status,
    created_at,
    updated_at
  )
  SELECT
    seed.public_id,
    seed.subject,
    t.id,
    seed.trip_label,
    seed.priority,
    seed.owner,
    seed.note,
    seed.status,
    seed.created_at,
    seed.updated_at
  FROM (
    VALUES
      ('SAFE-031', 'Passenger reported unsafe driving', 'VY-1041', 'VY-1041 · Pretoria → Polokwane', 'High', 'Unassigned', 'Passenger reported repeated speeding and harsh braking.', 'Open', '2026-10-04T00:55:00+02:00'::timestamptz, '2026-10-04T00:55:00+02:00'::timestamptz),
      ('SAFE-030', 'Dispute about pickup location', 'VY-1039', 'VY-1039 · Johannesburg → Durban', 'Medium', 'P. Molefe', 'Passenger and driver disagree on the confirmed pickup point.', 'Investigating', '2026-10-03T22:15:00+02:00'::timestamptz, '2026-10-04T00:10:00+02:00'::timestamptz),
      ('SAFE-029', 'Refund requested after cancellation', 'VY-1036', 'VY-1036 · Cape Town → Worcester', 'Low', 'T. Jacobs', 'Trip cancellation refund was requested after driver departure time changed.', 'Waiting', '2026-10-03T18:20:00+02:00'::timestamptz, '2026-10-03T19:05:00+02:00'::timestamptz),
      ('SAFE-028', 'Passenger no-show dispute', 'VY-1039', 'VY-1039 · Johannesburg → Durban', 'Low', 'T. Jacobs', 'Driver marked passenger as no-show; passenger disputes the timestamp.', 'Resolved', '2026-10-02T18:00:00+02:00'::timestamptz, '2026-10-03T09:00:00+02:00'::timestamptz),
      ('SAFE-027', 'Vehicle information did not match booking', 'VY-1041', 'VY-1041 · Pretoria → Polokwane', 'High', 'P. Molefe', 'Passenger reported a different vehicle registration at pickup.', 'Investigating', '2026-10-02T08:30:00+02:00'::timestamptz, '2026-10-03T13:20:00+02:00'::timestamptz),
      ('SAFE-026', 'Late pickup complaint', 'VY-1036', 'VY-1036 · Cape Town → Worcester', 'Medium', 'N. Adams', 'Pickup was delayed by approximately forty minutes.', 'Closed', '2026-10-01T13:40:00+02:00'::timestamptz, '2026-10-02T10:00:00+02:00'::timestamptz)
  ) AS seed(
    public_id,
    subject,
    trip_public_id,
    trip_label,
    priority,
    owner,
    note,
    status,
    created_at,
    updated_at
  )
  LEFT JOIN trips t ON t.public_id = seed.trip_public_id
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO activity_logs (
    event_type,
    title,
    detail,
    metadata,
    created_at
  )
  SELECT *
  FROM (
    VALUES
      ('driver_application', 'Driver application submitted', 'Thabo Mokoena · Polokwane', '{"driverEmail":"thabo.mokoena@vaya.demo"}'::jsonb, '2026-10-04T00:32:00+02:00'::timestamptz),
      ('driver_application', 'Driver application submitted', 'Sibusiso Khumalo · Durban', '{"driverEmail":"sibusiso.khumalo@vaya.demo"}'::jsonb, '2026-10-03T21:20:00+02:00'::timestamptz),
      ('driver_status', 'Driver requires more information', 'Lerato Ndlovu · vehicle disc missing', '{"driverEmail":"lerato.ndlovu@vaya.demo","status":"Needs info"}'::jsonb, '2026-10-04T00:05:00+02:00'::timestamptz),
      ('driver_status', 'Driver ready for approval', 'Rendani Mulaudzi · all checks complete', '{"driverEmail":"rendani.mulaudzi@vaya.demo","status":"Ready"}'::jsonb, '2026-10-04T00:15:00+02:00'::timestamptz),
      ('trip_created', 'Trip created', 'VY-1058 · Rustenburg → Johannesburg', '{"publicId":"VY-1058"}'::jsonb, '2026-10-02T11:00:00+02:00'::timestamptz),
      ('trip_created', 'Trip created', 'VY-1063 · Kimberley → Bloemfontein', '{"publicId":"VY-1063"}'::jsonb, '2026-10-02T13:15:00+02:00'::timestamptz),
      ('booking_created', 'Booking confirmed', 'BK-20492 · 2 seats · Cape Town → Gqeberha', '{"booking":"BK-20492"}'::jsonb, '2026-10-02T09:08:00+02:00'::timestamptz),
      ('booking_created', 'Booking awaiting payment', 'BK-20500 · Kimberley → Bloemfontein', '{"booking":"BK-20500"}'::jsonb, '2026-10-03T11:55:00+02:00'::timestamptz),
      ('payment_settled', 'Payment settled', 'PAY-88432 · R640.00', '{"payment":"PAY-88432"}'::jsonb, '2026-10-02T09:08:00+02:00'::timestamptz),
      ('payment_refunded', 'Payment refunded', 'PAY-88441 · R120.00', '{"payment":"PAY-88441"}'::jsonb, '2026-10-01T09:22:00+02:00'::timestamptz),
      ('safety_case_created', 'Safety case opened', 'SAFE-031 · High priority', '{"publicId":"SAFE-031"}'::jsonb, '2026-10-04T00:55:00+02:00'::timestamptz),
      ('safety_case_updated', 'Safety case assigned', 'SAFE-030 · P. Molefe', '{"publicId":"SAFE-030"}'::jsonb, '2026-10-04T00:10:00+02:00'::timestamptz)
  ) AS seed(event_type, title, detail, metadata, created_at)
  WHERE NOT EXISTS (
    SELECT 1
    FROM activity_logs existing
    WHERE existing.event_type = seed.event_type
      AND existing.title = seed.title
      AND existing.detail = seed.detail
  )
`;

await sql`
  UPDATE passengers p
  SET
    trips_count = summary.trip_count,
    updated_at = GREATEST(p.updated_at, now())
  FROM (
    SELECT passenger_id, COUNT(*)::int AS trip_count
    FROM bookings
    WHERE status <> 'Cancelled'
    GROUP BY passenger_id
  ) summary
  WHERE p.id = summary.passenger_id
`;

const counts = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM drivers WHERE status <> 'Removed') AS drivers,
    (SELECT COUNT(*)::int FROM passengers) AS passengers,
    (SELECT COUNT(*)::int FROM trips) AS trips,
    (SELECT COUNT(*)::int FROM bookings) AS bookings,
    (SELECT COUNT(*)::int FROM payments) AS payments,
    (SELECT COUNT(*)::int FROM safety_cases) AS safety_cases,
    (SELECT COUNT(*)::int FROM activity_logs) AS activity_logs
`;

console.log("Vaya CRM seed complete.", counts[0]);
