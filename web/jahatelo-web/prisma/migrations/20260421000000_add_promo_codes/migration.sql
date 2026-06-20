CREATE TYPE "CodeRepeatRule" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER');
CREATE TYPE "CodeLimitPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'UNLIMITED');
CREATE TYPE "PromoCodeStatus" AS ENUM ('PENDING', 'USED');

ALTER TABLE "Promo"
  ADD COLUMN "hasPromoCode" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "codeRepeatRule" "CodeRepeatRule",
  ADD COLUMN "codeLimit" INTEGER,
  ADD COLUMN "codeLimitPeriod" "CodeLimitPeriod";

CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "promoId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "status" "PromoCodeStatus" NOT NULL DEFAULT 'PENDING',
  "redeemedAt" TIMESTAMP(3),
  "redeemedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_promoId_deviceId_idx" ON "PromoCode"("promoId", "deviceId");
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX "PromoCode_promoId_status_idx" ON "PromoCode"("promoId", "status");

ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_promoId_fkey"
  FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "_prisma_migrations" ("id","checksum","started_at","finished_at","migration_name","logs","rolled_back_at","applied_steps_count")
VALUES (gen_random_uuid()::text,'manual',NOW(),NOW(),'20260421000000_add_promo_codes',NULL,NULL,1);
