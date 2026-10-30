import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "artworks" ALTER COLUMN "price_minor" DROP NOT NULL;
  ALTER TABLE "artworks" ALTER COLUMN "currency" DROP DEFAULT;
  ALTER TABLE "artworks" ALTER COLUMN "currency" DROP NOT NULL;
  ALTER TABLE "artworks" ADD COLUMN "price_rub_minor" numeric;
  ALTER TABLE "artworks" ADD COLUMN "price_usd_minor" numeric;
  UPDATE "artworks" SET "price_rub_minor" = "price_minor" WHERE "currency" = 'RUB';
  UPDATE "artworks" SET "price_usd_minor" = "price_minor" WHERE "currency" = 'USD';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "artworks" ALTER COLUMN "price_minor" SET NOT NULL;
  ALTER TABLE "artworks" ALTER COLUMN "currency" SET DEFAULT 'EUR';
  ALTER TABLE "artworks" ALTER COLUMN "currency" SET NOT NULL;
  ALTER TABLE "artworks" DROP COLUMN "price_rub_minor";
  ALTER TABLE "artworks" DROP COLUMN "price_usd_minor";`)
}
