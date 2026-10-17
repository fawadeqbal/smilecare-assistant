ALTER TABLE "businesses" ALTER COLUMN "brand_color" SET DEFAULT '#0A66F0';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "handoff_reason" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "handed_off_at" timestamp with time zone;