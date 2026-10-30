import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'staff');
  CREATE TYPE "public"."enum_artworks_medium" AS ENUM('oil', 'acrylic');
  CREATE TYPE "public"."enum_artworks_availability" AS ENUM('available', 'sold');
  CREATE TYPE "public"."enum_quote_rules_subject" AS ENUM('portrait', 'landscape', 'still-life');
  CREATE TYPE "public"."enum_quote_rules_medium" AS ENUM('oil', 'acrylic');
  CREATE TYPE "public"."enum_quote_rules_size" AS ENUM('30x40', '40x40', '50x70');
  CREATE TYPE "public"."enum_requests_kind" AS ENUM('purchase', 'commission', 'question');
  CREATE TYPE "public"."enum_requests_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_requests_channel" AS ENUM('email', 'telegram', 'instagram');
  CREATE TYPE "public"."enum_requests_status" AS ENUM('new', 'processing', 'discussing', 'accepted', 'shipped', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_studio_purchase_channel" AS ENUM('auto', 'telegram', 'instagram', 'email');
  CREATE TYPE "public"."enum_studio_seller_status" AS ENUM('individual', 'self-employed', 'entrepreneur', 'company', 'other');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role",
  	"permissions_artist_read" boolean DEFAULT false,
  	"permissions_artist_edit" boolean DEFAULT false,
  	"permissions_gallery_read" boolean DEFAULT false,
  	"permissions_gallery_edit" boolean DEFAULT false,
  	"permissions_users_read" boolean DEFAULT false,
  	"permissions_users_edit" boolean DEFAULT false,
  	"permissions_quotes_read" boolean DEFAULT false,
  	"permissions_quotes_edit" boolean DEFAULT false,
  	"permissions_requests_read" boolean DEFAULT false,
  	"permissions_requests_edit" boolean DEFAULT false,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "artworks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"display_size" numeric DEFAULT 4,
  	"medium" "enum_artworks_medium" DEFAULT 'oil' NOT NULL,
  	"width" numeric NOT NULL,
  	"height" numeric NOT NULL,
  	"year" numeric DEFAULT 2026 NOT NULL,
  	"price_minor" numeric NOT NULL,
  	"currency" varchar DEFAULT 'EUR' NOT NULL,
  	"availability" "enum_artworks_availability" DEFAULT 'available' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"published" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 25,
  	"demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artworks_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "artworks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "quote_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"subject" "enum_quote_rules_subject" NOT NULL,
  	"medium" "enum_quote_rules_medium" NOT NULL,
  	"size" "enum_quote_rules_size" NOT NULL,
  	"min_price" numeric NOT NULL,
  	"max_price" numeric NOT NULL,
  	"currency" varchar DEFAULT 'EUR' NOT NULL,
  	"min_days" numeric NOT NULL,
  	"max_days" numeric NOT NULL,
  	"active" boolean DEFAULT true,
  	"demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"kind" "enum_requests_kind" NOT NULL,
  	"locale" "enum_requests_locale" NOT NULL,
  	"name" varchar,
  	"channel" "enum_requests_channel" NOT NULL,
  	"contact" varchar NOT NULL,
  	"message" varchar,
  	"artwork_id" integer,
  	"details" jsonb,
  	"status" "enum_requests_status" DEFAULT 'new',
  	"notes" varchar,
  	"reference_count" numeric DEFAULT 0,
  	"consent_version" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"references_id" integer
  );
  
  CREATE TABLE "references" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"artworks_id" integer,
  	"quote_rules_id" integer,
  	"requests_id" integer,
  	"references_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "studio" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"purchase_channel" "enum_studio_purchase_channel" DEFAULT 'auto',
  	"seller_name" varchar,
  	"seller_country" varchar,
  	"seller_status" "enum_studio_seller_status",
  	"seller_tax_id" varchar,
  	"seller_registration" varchar,
  	"seller_address" varchar,
  	"seller_email" varchar,
  	"seller_phone" varchar,
  	"photo_id" integer,
  	"name" varchar,
  	"alias" varchar,
  	"instagram" varchar,
  	"telegram" varchar,
  	"email" varchar,
  	"commissions_open" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "studio_locales" (
  	"seller_terms" varchar,
  	"about" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks_locales" ADD CONSTRAINT "artworks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks_rels" ADD CONSTRAINT "artworks_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests" ADD CONSTRAINT "requests_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_references_fk" FOREIGN KEY ("references_id") REFERENCES "public"."references"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quote_rules_fk" FOREIGN KEY ("quote_rules_id") REFERENCES "public"."quote_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_requests_fk" FOREIGN KEY ("requests_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_references_fk" FOREIGN KEY ("references_id") REFERENCES "public"."references"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studio" ADD CONSTRAINT "studio_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "studio_locales" ADD CONSTRAINT "studio_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."studio"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "artworks_image_idx" ON "artworks" USING btree ("image_id");
  CREATE UNIQUE INDEX "artworks_slug_idx" ON "artworks" USING btree ("slug");
  CREATE INDEX "artworks_updated_at_idx" ON "artworks" USING btree ("updated_at");
  CREATE INDEX "artworks_created_at_idx" ON "artworks" USING btree ("created_at");
  CREATE UNIQUE INDEX "artworks_locales_locale_parent_id_unique" ON "artworks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "artworks_locales_parent_id_idx" ON "artworks_locales" USING btree ("_parent_id");
  CREATE INDEX "artworks_rels_order_idx" ON "artworks_rels" USING btree ("order");
  CREATE INDEX "artworks_rels_parent_idx" ON "artworks_rels" USING btree ("parent_id");
  CREATE INDEX "artworks_rels_path_idx" ON "artworks_rels" USING btree ("path");
  CREATE INDEX "artworks_rels_media_id_idx" ON "artworks_rels" USING btree ("media_id");
  CREATE INDEX "quote_rules_updated_at_idx" ON "quote_rules" USING btree ("updated_at");
  CREATE INDEX "quote_rules_created_at_idx" ON "quote_rules" USING btree ("created_at");
  CREATE UNIQUE INDEX "requests_reference_idx" ON "requests" USING btree ("reference");
  CREATE UNIQUE INDEX "requests_idempotency_key_idx" ON "requests" USING btree ("idempotency_key");
  CREATE INDEX "requests_artwork_idx" ON "requests" USING btree ("artwork_id");
  CREATE INDEX "requests_updated_at_idx" ON "requests" USING btree ("updated_at");
  CREATE INDEX "requests_created_at_idx" ON "requests" USING btree ("created_at");
  CREATE INDEX "requests_rels_order_idx" ON "requests_rels" USING btree ("order");
  CREATE INDEX "requests_rels_parent_idx" ON "requests_rels" USING btree ("parent_id");
  CREATE INDEX "requests_rels_path_idx" ON "requests_rels" USING btree ("path");
  CREATE INDEX "requests_rels_references_id_idx" ON "requests_rels" USING btree ("references_id");
  CREATE INDEX "references_updated_at_idx" ON "references" USING btree ("updated_at");
  CREATE INDEX "references_created_at_idx" ON "references" USING btree ("created_at");
  CREATE UNIQUE INDEX "references_filename_idx" ON "references" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_artworks_id_idx" ON "payload_locked_documents_rels" USING btree ("artworks_id");
  CREATE INDEX "payload_locked_documents_rels_quote_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("quote_rules_id");
  CREATE INDEX "payload_locked_documents_rels_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("requests_id");
  CREATE INDEX "payload_locked_documents_rels_references_id_idx" ON "payload_locked_documents_rels" USING btree ("references_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "studio_photo_idx" ON "studio" USING btree ("photo_id");
  CREATE UNIQUE INDEX "studio_locales_locale_parent_id_unique" ON "studio_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "studio_locales_parent_id_idx" ON "studio_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "artworks" CASCADE;
  DROP TABLE "artworks_locales" CASCADE;
  DROP TABLE "artworks_rels" CASCADE;
  DROP TABLE "quote_rules" CASCADE;
  DROP TABLE "requests" CASCADE;
  DROP TABLE "requests_rels" CASCADE;
  DROP TABLE "references" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "studio" CASCADE;
  DROP TABLE "studio_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_artworks_medium";
  DROP TYPE "public"."enum_artworks_availability";
  DROP TYPE "public"."enum_quote_rules_subject";
  DROP TYPE "public"."enum_quote_rules_medium";
  DROP TYPE "public"."enum_quote_rules_size";
  DROP TYPE "public"."enum_requests_kind";
  DROP TYPE "public"."enum_requests_locale";
  DROP TYPE "public"."enum_requests_channel";
  DROP TYPE "public"."enum_requests_status";
  DROP TYPE "public"."enum_studio_purchase_channel";
  DROP TYPE "public"."enum_studio_seller_status";`)
}
