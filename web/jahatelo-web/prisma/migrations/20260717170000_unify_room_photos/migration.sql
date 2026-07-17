-- Unifica las fotos de habitaciones en RoomPhoto.
-- Si una habitación ya tiene fotos nuevas, sus fotos legacy se descartan.
-- Si todavía no tiene fotos nuevas, se preservan migrándolas en el mismo orden.

CREATE TABLE IF NOT EXISTS "RoomPhoto" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoomPhoto_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RoomPhoto_roomTypeId_fkey'
  ) THEN
    ALTER TABLE "RoomPhoto"
      ADD CONSTRAINT "RoomPhoto_roomTypeId_fkey"
      FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "RoomPhoto" ("id", "roomTypeId", "url", "order", "createdAt", "updatedAt")
SELECT
  p."id",
  p."roomTypeId",
  p."url",
  p."order",
  COALESCE(p."createdAt", CURRENT_TIMESTAMP),
  COALESCE(p."updatedAt", p."createdAt", CURRENT_TIMESTAMP)
FROM "Photo" p
WHERE p."roomTypeId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "RoomPhoto" rp
    WHERE rp."roomTypeId" = p."roomTypeId"
  )
ON CONFLICT ("id") DO NOTHING;

DELETE FROM "Photo" WHERE "roomTypeId" IS NOT NULL;

ALTER TABLE "Photo" DROP CONSTRAINT IF EXISTS "Photo_roomTypeId_fkey";
ALTER TABLE "Photo" DROP COLUMN IF EXISTS "roomTypeId";
