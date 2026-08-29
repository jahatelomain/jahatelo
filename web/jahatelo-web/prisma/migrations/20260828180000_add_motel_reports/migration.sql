CREATE TYPE "MotelReportReason" AS ENUM ('PRICE', 'PHOTO', 'LOCATION_OR_CONTACT', 'CLOSED', 'INFORMATION', 'OTHER');
CREATE TYPE "MotelReportStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

CREATE TABLE "MotelReport" (
    "id" TEXT NOT NULL,
    "motelId" TEXT NOT NULL,
    "userId" TEXT,
    "reason" "MotelReportReason" NOT NULL,
    "comment" TEXT,
    "status" "MotelReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MotelReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MotelReport_status_createdAt_idx" ON "MotelReport"("status", "createdAt");
CREATE INDEX "MotelReport_motelId_createdAt_idx" ON "MotelReport"("motelId", "createdAt");
CREATE INDEX "MotelReport_userId_createdAt_idx" ON "MotelReport"("userId", "createdAt");

ALTER TABLE "MotelReport" ADD CONSTRAINT "MotelReport_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MotelReport" ADD CONSTRAINT "MotelReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
