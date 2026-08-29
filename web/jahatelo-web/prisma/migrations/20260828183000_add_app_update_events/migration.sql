CREATE TYPE "AppUpdateAction" AS ENUM ('SHOWN', 'UPDATE_TAPPED', 'DISMISSED');

CREATE TABLE "AppUpdateEvent" (
    "id" TEXT NOT NULL,
    "action" "AppUpdateAction" NOT NULL,
    "platform" TEXT NOT NULL,
    "currentVersion" TEXT NOT NULL,
    "targetVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppUpdateEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppUpdateEvent_action_createdAt_idx" ON "AppUpdateEvent"("action", "createdAt");
CREATE INDEX "AppUpdateEvent_platform_currentVersion_createdAt_idx" ON "AppUpdateEvent"("platform", "currentVersion", "createdAt");
