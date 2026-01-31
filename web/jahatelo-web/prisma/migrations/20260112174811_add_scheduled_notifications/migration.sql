-- Ensure base table exists for legacy environments/shadow DB
CREATE TABLE IF NOT EXISTS "UserNotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableAdvertisingPush" BOOLEAN NOT NULL DEFAULT true,
    "enableSecurityPush" BOOLEAN NOT NULL DEFAULT true,
    "enableMaintenancePush" BOOLEAN NOT NULL DEFAULT true,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableEmail" BOOLEAN NOT NULL DEFAULT true,
    "enablePush" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewPromos" BOOLEAN NOT NULL DEFAULT true,
    "notifyPriceDrops" BOOLEAN NOT NULL DEFAULT true,
    "notifyUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifyReviewReplies" BOOLEAN NOT NULL DEFAULT true,
    "notifyReviewLikes" BOOLEAN NOT NULL DEFAULT false,
    "notifyPromotions" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewMotels" BOOLEAN NOT NULL DEFAULT false,
    "notifyContactMessages" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewProspects" BOOLEAN NOT NULL DEFAULT true,
    "notifyPaymentReminders" BOOLEAN NOT NULL DEFAULT true,
    "notifyMotelApprovals" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotificationPreferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserNotificationPreferences_userId_key" UNIQUE ("userId"),
    CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable (ensure new columns exist on older DBs)
ALTER TABLE "UserNotificationPreferences"
  ADD COLUMN IF NOT EXISTS "enableAdvertisingPush" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "enableMaintenancePush" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "enableSecurityPush" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifyContactMessages" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifyMotelApprovals" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifyNewProspects" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifyPaymentReminders" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceType" TEXT,
    "deviceName" TEXT,
    "appVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "targetUserIds" TEXT[],
    "targetRole" TEXT,
    "targetMotelId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'advertising',
    "type" TEXT NOT NULL,
    "relatedEntityId" TEXT,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE INDEX "PushToken_token_idx" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_isActive_idx" ON "PushToken"("isActive");

-- CreateIndex
CREATE INDEX "ScheduledNotification_scheduledFor_sent_idx" ON "ScheduledNotification"("scheduledFor", "sent");

-- CreateIndex
CREATE INDEX "ScheduledNotification_targetMotelId_idx" ON "ScheduledNotification"("targetMotelId");

-- CreateIndex
CREATE INDEX "ScheduledNotification_type_idx" ON "ScheduledNotification"("type");

-- CreateIndex
CREATE INDEX "ScheduledNotification_category_idx" ON "ScheduledNotification"("category");

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
