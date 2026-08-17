-- Persist the canonical Google Maps place identifier separately from mapUrl.
ALTER TABLE "Motel" ADD COLUMN "googlePlaceId" TEXT;

CREATE UNIQUE INDEX "Motel_googlePlaceId_key" ON "Motel"("googlePlaceId");
