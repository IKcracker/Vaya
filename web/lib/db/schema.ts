import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const drivers = pgTable("drivers", {
  id: uuid("id").defaultRandom().primaryKey(),
  initials: varchar("initials", { length: 4 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 40 }),
  location: varchar("location", { length: 180 }).notNull(),
  vehicleMake: varchar("vehicle_make", { length: 100 }).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 100 }).notNull(),
  vehicleYear: integer("vehicle_year").notNull(),
  checks: varchar("checks", { length: 180 }).notNull().default("Pending review"),
  status: varchar("status", { length: 40 }).notNull().default("Review"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const driverDocuments = pgTable("driver_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  driverId: uuid("driver_id")
    .references(() => drivers.id, { onDelete: "cascade" })
    .notNull(),
  kind: varchar("kind", { length: 60 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  fileData: text("file_data").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("Review"),
  reviewNote: text("review_note"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passengers = pgTable("passengers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 40 }),
  city: varchar("city", { length: 120 }).notNull(),
  tripsCount: integer("trips_count").notNull().default(0),
  status: varchar("status", { length: 40 }).notNull().default("Active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 32 }).notNull().unique(),
  fromCity: varchar("from_city", { length: 120 }).notNull(),
  toCity: varchar("to_city", { length: 120 }).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  driverName: varchar("driver_name", { length: 160 }).notNull(),
  departureAt: timestamp("departure_at", { withTimezone: true }).notNull(),
  seatCapacity: integer("seat_capacity").notNull(),
  seatsBooked: integer("seats_booked").notNull().default(0),
  fareCents: integer("fare_cents").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("Scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 32 }).notNull().unique(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }).notNull(),
  passengerId: uuid("passenger_id").references(() => passengers.id, { onDelete: "restrict" }).notNull(),
  seats: integer("seats").notNull().default(1),
  amountCents: integer("amount_cents").notNull(),
  paymentStatus: varchar("payment_status", { length: 40 }).notNull().default("Pending"),
  status: varchar("status", { length: 40 }).notNull().default("Awaiting payment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 32 }).notNull().unique(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "restrict" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  method: varchar("method", { length: 60 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const safetyCases = pgTable("safety_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 32 }).notNull().unique(),
  subject: varchar("subject", { length: 220 }).notNull(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }),
  tripLabel: varchar("trip_label", { length: 240 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("Medium"),
  owner: varchar("owner", { length: 120 }).notNull().default("Unassigned"),
  note: text("note"),
  status: varchar("status", { length: 40 }).notNull().default("Open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: varchar("detail", { length: 320 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
