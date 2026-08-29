ALTER TABLE "MotelReport"
ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "resolutionSummary" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE TABLE "MotelReportNote" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MotelReportNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MotelReport_assignedToId_status_idx" ON "MotelReport"("assignedToId", "status");
CREATE INDEX "MotelReportNote_reportId_createdAt_idx" ON "MotelReportNote"("reportId", "createdAt");
CREATE INDEX "MotelReportNote_authorId_createdAt_idx" ON "MotelReportNote"("authorId", "createdAt");

ALTER TABLE "MotelReport" ADD CONSTRAINT "MotelReport_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MotelReportNote" ADD CONSTRAINT "MotelReportNote_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "MotelReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MotelReportNote" ADD CONSTRAINT "MotelReportNote_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
