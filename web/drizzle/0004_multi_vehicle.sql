CREATE TABLE "driver_vehicles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "driver_id" uuid NOT NULL,
  "make" varchar(100) NOT NULL,
  "model" varchar(100) NOT NULL,
  "year" integer NOT NULL,
  "registration" varchar(30) NOT NULL,
  "color" varchar(60) NOT NULL,
  "status" varchar(40) DEFAULT 'Needs info' NOT NULL,
  "checks" varchar(180) DEFAULT '0/2 required documents uploaded' NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "driver_vehicles" ADD CONSTRAINT "driver_vehicles_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "driver_documents" ADD COLUMN "vehicle_id" uuid;
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_id" uuid;
--> statement-breakpoint
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_vehicle_id_driver_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."driver_vehicles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_driver_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."driver_vehicles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "driver_vehicles" (
  "driver_id", "make", "model", "year", "registration", "color",
  "status", "checks", "is_primary", "created_at", "updated_at"
)
SELECT
  d."id",
  d."vehicle_make",
  d."vehicle_model",
  d."vehicle_year",
  COALESCE(NULLIF(d."vehicle_registration", ''), 'LEGACY-' || upper(substr(d."id"::text, 1, 8))),
  COALESCE(NULLIF(d."vehicle_color", ''), 'Unknown'),
  CASE WHEN d."status" = 'Approved' THEN 'Approved' ELSE 'Needs info' END,
  CASE WHEN d."status" = 'Approved' THEN 'All required documents approved' ELSE 'Vehicle documents require verification' END,
  true,
  d."submitted_at",
  d."updated_at"
FROM "drivers" d;
--> statement-breakpoint
UPDATE "driver_documents" dd
SET "vehicle_id" = dv."id"
FROM "driver_vehicles" dv
WHERE dd."driver_id" = dv."driver_id"
  AND dv."is_primary" = true
  AND dd."kind" IN ('vehicle_registration', 'roadworthy', 'insurance');
--> statement-breakpoint
UPDATE "trips" t
SET "vehicle_id" = dv."id"
FROM "driver_vehicles" dv
WHERE t."driver_id" = dv."driver_id"
  AND dv."is_primary" = true;
