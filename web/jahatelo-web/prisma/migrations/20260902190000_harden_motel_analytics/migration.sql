-- Make motel analytics events attributable and idempotent without collecting
-- hardware identifiers. Existing rows remain valid with nullable columns.
ALTER TABLE "MotelAnalytics"
ADD COLUMN "eventId" TEXT,
ADD COLUMN "deviceId" TEXT,
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'production';

CREATE UNIQUE INDEX "MotelAnalytics_eventId_key" ON "MotelAnalytics"("eventId");
CREATE INDEX "MotelAnalytics_environment_timestamp_idx" ON "MotelAnalytics"("environment", "timestamp");
CREATE INDEX "MotelAnalytics_motelId_environment_timestamp_idx" ON "MotelAnalytics"("motelId", "environment", "timestamp");
CREATE INDEX "MotelAnalytics_deviceId_timestamp_idx" ON "MotelAnalytics"("deviceId", "timestamp");
