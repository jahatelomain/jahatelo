-- Update PlanType enum and remove isFinanciallyEnabled from Motel

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanType') THEN
    ALTER TYPE "PlanType" RENAME TO "PlanType_old";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanType') THEN
    CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'GOLD', 'DIAMOND');
  END IF;
END $$;

ALTER TABLE "Motel" ALTER COLUMN "plan" DROP DEFAULT;

ALTER TABLE "Motel"
  ALTER COLUMN "plan" TYPE "PlanType"
  USING (
    CASE
      WHEN "plan"::text = 'PREMIUM' THEN 'GOLD'
      WHEN "plan"::text = 'PLATINUM' THEN 'DIAMOND'
      WHEN "plan"::text = 'BASIC' THEN 'BASIC'
      WHEN "plan" IS NULL THEN 'BASIC'
      ELSE 'BASIC'
    END
  )::"PlanType";

ALTER TABLE "Motel" ALTER COLUMN "plan" SET DEFAULT 'BASIC';

ALTER TABLE "Motel" DROP COLUMN IF EXISTS "isFinanciallyEnabled";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanType_old') THEN
    DROP TYPE "PlanType_old";
  END IF;
END $$;
