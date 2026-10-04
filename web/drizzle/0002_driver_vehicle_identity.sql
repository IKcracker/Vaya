ALTER TABLE "drivers" ADD COLUMN "vehicle_registration" varchar(30);
--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "vehicle_color" varchar(60);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_make" varchar(100);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_model" varchar(100);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_year" integer;
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_registration" varchar(30);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_color" varchar(60);
--> statement-breakpoint
UPDATE "trips"
SET
  "vehicle_make" = "drivers"."vehicle_make",
  "vehicle_model" = "drivers"."vehicle_model",
  "vehicle_year" = "drivers"."vehicle_year",
  "vehicle_registration" = "drivers"."vehicle_registration",
  "vehicle_color" = "drivers"."vehicle_color"
FROM "drivers"
WHERE "trips"."driver_id" = "drivers"."id";
