ALTER TABLE "VisitorEvent"
  ADD COLUMN "sessionId" TEXT,
  ADD COLUMN "eventId" TEXT,
  ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "VisitorEvent_eventId_key" ON "VisitorEvent"("eventId");
CREATE INDEX "VisitorEvent_sessionId_createdAt_idx" ON "VisitorEvent"("sessionId", "createdAt");
CREATE INDEX "VisitorEvent_userId_createdAt_idx" ON "VisitorEvent"("userId", "createdAt");

ALTER TABLE "VisitorEvent"
  ADD CONSTRAINT "VisitorEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
