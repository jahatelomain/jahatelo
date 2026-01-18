-- Update PlanType enum and remove isFinanciallyEnabled from Motel

ALTER TYPE "PlanType" RENAME TO "PlanType_old";

CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'GOLD', 'DIAMOND');

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

ALTER TABLE "Motel" DROP COLUMN "isFinanciallyEnabled";

DROP TYPE "PlanType_old";
