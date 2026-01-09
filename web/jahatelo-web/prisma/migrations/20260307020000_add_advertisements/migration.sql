-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('POPUP_HOME', 'CAROUSEL', 'SECTION_BANNER', 'LIST_INLINE');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('ACTIVE', 'PAUSED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('VIEW', 'CLICK');

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "advertiser" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "largeImageUrl" TEXT,
    "description" TEXT,
    "linkUrl" TEXT,
    "placement" "AdPlacement" NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "maxViews" INTEGER,
    "maxClicks" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdAnalytics" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "eventType" "AdEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" TEXT,
    "userCity" TEXT,
    "userCountry" TEXT,
    "source" TEXT,

    CONSTRAINT "AdAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdAnalytics_advertisementId_timestamp_idx" ON "AdAnalytics"("advertisementId", "timestamp");

-- CreateIndex
CREATE INDEX "AdAnalytics_eventType_timestamp_idx" ON "AdAnalytics"("eventType", "timestamp");

-- AddForeignKey
ALTER TABLE "AdAnalytics" ADD CONSTRAINT "AdAnalytics_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
