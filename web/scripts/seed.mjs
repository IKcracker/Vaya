import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed Vaya");
}

const sql = neon(connectionString);

console.log("Seeding Vaya CRM data...");

await sql`
  INSERT INTO drivers (initials, name, email, location, vehicle_make, vehicle_model, vehicle_year, checks, status)
  VALUES
    ('TM', 'Thabo Mokoena', 'thabo.mokoena@vaya.demo', 'Polokwane, Limpopo', 'Toyota', 'Corolla', 2022, 'Licence + vehicle', 'Review'),
    ('LN', 'Lerato Ndlovu', 'lerato.ndlovu@vaya.demo', 'Midrand, Gauteng', 'VW', 'Polo', 2021, 'Vehicle disc missing', 'Needs info'),
    ('RM', 'Rendani Mulaudzi', 'rendani.mulaudzi@vaya.demo', 'Thohoyandou, Limpopo', 'Ford', 'Everest', 2023, 'All checks complete', 'Ready'),
    ('SK', 'Sibusiso Khumalo', 'sibusiso.khumalo@vaya.demo', 'Durban, KwaZulu-Natal', 'Toyota', 'Quest', 2020, 'Identity review', 'Review'),
    ('LM', 'Lebo Mokoena', 'lebo.mokoena@vaya.demo', 'Johannesburg, Gauteng', 'Toyota', 'Corolla', 2022, 'All checks complete', 'Approved'),
    ('AD', 'Anele Dlamini', 'anele.dlamini@vaya.demo', 'Cape Town, Western Cape', 'VW', 'Polo', 2022, 'All checks complete', 'Approved'),
    ('KM', 'Karabo Maseko', 'karabo.maseko@vaya.demo', 'Mbombela, Mpumalanga', 'Toyota', 'Starlet', 2023, 'All checks complete', 'Approved')
  ON CONFLICT (email) DO NOTHING
`;

await sql`
  INSERT INTO passengers (name, email, city, trips_count, status)
  VALUES
    ('Thato Maseko', 'thato.maseko@example.com', 'Johannesburg', 11, 'Active'),
    ('Nokuthula Dube', 'nokuthula@example.com', 'Cape Town', 7, 'Active'),
    ('Kagiso Seabi', 'kagiso@example.com', 'Polokwane', 4, 'Active'),
    ('Mpho Baloyi', 'mpho@example.com', 'Mbombela', 2, 'Review')
  ON CONFLICT (email) DO NOTHING
`;

await sql`
  INSERT INTO trips (public_id, from_city, to_city, driver_name, departure_at, seat_capacity, seats_booked, fare_cents, status)
  VALUES
    ('VY-1048', 'Johannesburg', 'Durban', 'Lebo Mokoena', '2026-10-09T06:30:00+02:00', 4, 3, 28000, 'On schedule'),
    ('VY-1051', 'Cape Town', 'Gqeberha', 'Anele Dlamini', '2026-10-09T07:00:00+02:00', 4, 4, 32000, 'Full'),
    ('VY-1053', 'Polokwane', 'Pretoria', 'Rendani Mulaudzi', '2026-10-09T08:30:00+02:00', 4, 2, 18000, 'On schedule'),
    ('VY-1055', 'Mbombela', 'Pretoria', 'Karabo Maseko', '2026-10-09T09:15:00+02:00', 3, 1, 19000, 'Boarding')
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO bookings (public_id, trip_id, passenger_id, seats, amount_cents, payment_status, status)
  SELECT 'BK-20491', t.id, p.id, 1, 28000, 'Paid', 'Confirmed'
  FROM trips t, passengers p
  WHERE t.public_id = 'VY-1048' AND p.email = 'thato.maseko@example.com'
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO bookings (public_id, trip_id, passenger_id, seats, amount_cents, payment_status, status)
  SELECT 'BK-20492', t.id, p.id, 2, 64000, 'Paid', 'Confirmed'
  FROM trips t, passengers p
  WHERE t.public_id = 'VY-1051' AND p.email = 'nokuthula@example.com'
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO bookings (public_id, trip_id, passenger_id, seats, amount_cents, payment_status, status)
  SELECT 'BK-20493', t.id, p.id, 1, 18000, 'Pending', 'Awaiting payment'
  FROM trips t, passengers p
  WHERE t.public_id = 'VY-1053' AND p.email = 'kagiso@example.com'
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO bookings (public_id, trip_id, passenger_id, seats, amount_cents, payment_status, status)
  SELECT 'BK-20494', t.id, p.id, 1, 19000, 'Paid', 'Confirmed'
  FROM trips t, passengers p
  WHERE t.public_id = 'VY-1055' AND p.email = 'mpho@example.com'
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO payments (public_id, booking_id, amount_cents, method, status)
  SELECT 'PAY-88431', id, 28000, 'Card', 'Settled' FROM bookings WHERE public_id = 'BK-20491'
  ON CONFLICT (public_id) DO NOTHING
`;
await sql`
  INSERT INTO payments (public_id, booking_id, amount_cents, method, status)
  SELECT 'PAY-88432', id, 64000, 'Instant EFT', 'Settled' FROM bookings WHERE public_id = 'BK-20492'
  ON CONFLICT (public_id) DO NOTHING
`;
await sql`
  INSERT INTO payments (public_id, booking_id, amount_cents, method, status)
  SELECT 'PAY-88433', id, 18000, 'Card', 'Pending' FROM bookings WHERE public_id = 'BK-20493'
  ON CONFLICT (public_id) DO NOTHING
`;
await sql`
  INSERT INTO payments (public_id, booking_id, amount_cents, method, status)
  SELECT 'PAY-88434', id, 19000, 'Card', 'Settled' FROM bookings WHERE public_id = 'BK-20494'
  ON CONFLICT (public_id) DO NOTHING
`;

await sql`
  INSERT INTO safety_cases (public_id, subject, trip_label, priority, owner, status)
  VALUES
    ('SAFE-031', 'Passenger reported unsafe driving', 'VY-1041 · Pretoria → Polokwane', 'High', 'Unassigned', 'Open'),
    ('SAFE-030', 'Dispute about pickup location', 'VY-1039 · Johannesburg → Durban', 'Medium', 'P. Molefe', 'Investigating'),
    ('SAFE-029', 'Refund requested after cancellation', 'VY-1036 · Cape Town → Worcester', 'Low', 'T. Jacobs', 'Waiting')
  ON CONFLICT (public_id) DO NOTHING
`;

const activityCount = await sql`SELECT COUNT(*)::int AS count FROM activity_logs`;
if ((activityCount[0]?.count ?? 0) === 0) {
  await sql`
    INSERT INTO activity_logs (event_type, title, detail)
    VALUES
      ('driver_application', 'Driver application submitted', 'Sibusiso Khumalo · Durban'),
      ('payment_settled', 'Payment settled', 'PAY-88432 · R640.00'),
      ('safety_case_created', 'Safety case opened', 'SAFE-031 · High priority')
  `;
}

console.log("Vaya CRM seed complete.");
