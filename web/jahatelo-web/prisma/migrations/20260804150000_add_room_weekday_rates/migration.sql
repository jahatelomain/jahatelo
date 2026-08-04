CREATE TYPE "Weekday" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');
CREATE TYPE "RoomPriceDuration" AS ENUM ('H1', 'H1_5', 'H2', 'H3', 'H12', 'H24', 'NIGHT');

CREATE TABLE "RoomWeekdayRate" (
  "id" TEXT NOT NULL,
  "roomTypeId" TEXT NOT NULL,
  "weekday" "Weekday" NOT NULL,
  "duration" "RoomPriceDuration" NOT NULL,
  "price" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomWeekdayRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomWeekdayRate_roomTypeId_weekday_duration_key" ON "RoomWeekdayRate"("roomTypeId", "weekday", "duration");
CREATE INDEX "RoomWeekdayRate_roomTypeId_weekday_idx" ON "RoomWeekdayRate"("roomTypeId", "weekday");
ALTER TABLE "RoomWeekdayRate" ADD CONSTRAINT "RoomWeekdayRate_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migración de compatibilidad: los grupos heredados se expanden a días reales.
-- Solo se copian precios positivos; los valores null/0 continúan usando el fallback base.
INSERT INTO "RoomWeekdayRate" ("id", "roomTypeId", "weekday", "duration", "price", "createdAt", "updatedAt")
SELECT
  concat('rwr_', md5(dr."id" || ':' || days."weekday"::text || ':' || durations."duration"::text)),
  dr."roomTypeId",
  days."weekday",
  durations."duration",
  durations."price",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "RoomDayRate" dr
CROSS JOIN LATERAL (
  SELECT unnest(CASE WHEN dr."dayGroup" = 'WEEKDAY' THEN ARRAY['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY']::"Weekday"[] ELSE ARRAY['FRIDAY', 'SATURDAY']::"Weekday"[] END) AS "weekday"
) days
CROSS JOIN LATERAL (
  VALUES
    ('H1'::"RoomPriceDuration", dr."price1h"),
    ('H1_5'::"RoomPriceDuration", dr."price1_5h"),
    ('H2'::"RoomPriceDuration", dr."price2h"),
    ('H3'::"RoomPriceDuration", dr."price3h"),
    ('H12'::"RoomPriceDuration", dr."price12h"),
    ('H24'::"RoomPriceDuration", dr."price24h"),
    ('NIGHT'::"RoomPriceDuration", dr."priceNight")
) durations("duration", "price")
WHERE durations."price" IS NOT NULL AND durations."price" > 0;
