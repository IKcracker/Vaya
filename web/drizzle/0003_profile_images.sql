ALTER TABLE "passengers" ADD COLUMN "profile_image_content_type" varchar(120);
--> statement-breakpoint
ALTER TABLE "passengers" ADD COLUMN "profile_image_data" text;
--> statement-breakpoint
ALTER TABLE "passengers" ADD COLUMN "profile_image_updated_at" timestamp with time zone;
