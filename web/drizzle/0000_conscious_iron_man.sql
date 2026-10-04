CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"title" varchar(180) NOT NULL,
	"detail" varchar(320) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"trip_id" uuid NOT NULL,
	"passenger_id" uuid NOT NULL,
	"seats" integer DEFAULT 1 NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_status" varchar(40) DEFAULT 'Pending' NOT NULL,
	"status" varchar(40) DEFAULT 'Awaiting payment' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initials" varchar(4) NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(255),
	"phone" varchar(40),
	"location" varchar(180) NOT NULL,
	"vehicle_make" varchar(100) NOT NULL,
	"vehicle_model" varchar(100) NOT NULL,
	"vehicle_year" integer NOT NULL,
	"checks" varchar(180) DEFAULT 'Pending review' NOT NULL,
	"status" varchar(40) DEFAULT 'Review' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "passengers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(40),
	"city" varchar(120) NOT NULL,
	"trips_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(40) DEFAULT 'Active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passengers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"booking_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"method" varchar(60) NOT NULL,
	"status" varchar(40) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "safety_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"subject" varchar(220) NOT NULL,
	"trip_id" uuid,
	"trip_label" varchar(240) NOT NULL,
	"priority" varchar(20) DEFAULT 'Medium' NOT NULL,
	"owner" varchar(120) DEFAULT 'Unassigned' NOT NULL,
	"note" text,
	"status" varchar(40) DEFAULT 'Open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "safety_cases_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"from_city" varchar(120) NOT NULL,
	"to_city" varchar(120) NOT NULL,
	"driver_id" uuid,
	"driver_name" varchar(160) NOT NULL,
	"departure_at" timestamp with time zone NOT NULL,
	"seat_capacity" integer NOT NULL,
	"seats_booked" integer DEFAULT 0 NOT NULL,
	"fare_cents" integer NOT NULL,
	"status" varchar(40) DEFAULT 'Scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_id_passengers_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."passengers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_cases" ADD CONSTRAINT "safety_cases_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;