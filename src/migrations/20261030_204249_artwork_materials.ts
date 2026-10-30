import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_artworks_work_kind" AS ENUM('physical', 'digital');
  CREATE TYPE "public"."enum_artworks_surface" AS ENUM('canvas', 'paper', 'cardboard', 'wood', 'other');
  CREATE TYPE "public"."enum_artworks_paper_format" AS ENUM('A1', 'A2', 'A3', 'A4', 'A5');
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'watercolor';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'gouache';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'pastel';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'ink';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'pencil';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'mixed';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'other';
  ALTER TYPE "public"."enum_artworks_medium" ADD VALUE 'digital';
  ALTER TABLE "artworks" ALTER COLUMN "medium" DROP NOT NULL;
  ALTER TABLE "artworks" ADD COLUMN "work_kind" "enum_artworks_work_kind" DEFAULT 'physical' NOT NULL;
  ALTER TABLE "artworks" ADD COLUMN "surface" "enum_artworks_surface" DEFAULT 'canvas';
  ALTER TABLE "artworks" ADD COLUMN "paper_format" "enum_artworks_paper_format";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "artworks" ALTER COLUMN "medium" SET DATA TYPE text;
  ALTER TABLE "artworks" ALTER COLUMN "medium" SET DEFAULT 'oil'::text;
  DROP TYPE "public"."enum_artworks_medium";
  CREATE TYPE "public"."enum_artworks_medium" AS ENUM('oil', 'acrylic');
  ALTER TABLE "artworks" ALTER COLUMN "medium" SET DEFAULT 'oil'::"public"."enum_artworks_medium";
  ALTER TABLE "artworks" ALTER COLUMN "medium" SET DATA TYPE "public"."enum_artworks_medium" USING "medium"::"public"."enum_artworks_medium";
  ALTER TABLE "artworks" ALTER COLUMN "medium" SET NOT NULL;
  ALTER TABLE "artworks" DROP COLUMN "work_kind";
  ALTER TABLE "artworks" DROP COLUMN "surface";
  ALTER TABLE "artworks" DROP COLUMN "paper_format";
  DROP TYPE "public"."enum_artworks_work_kind";
  DROP TYPE "public"."enum_artworks_surface";
  DROP TYPE "public"."enum_artworks_paper_format";`)
}
