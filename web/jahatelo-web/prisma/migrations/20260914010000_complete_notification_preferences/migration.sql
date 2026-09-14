ALTER TABLE "Review"
ADD COLUMN "ownerReply" TEXT,
ADD COLUMN "ownerReplyAt" TIMESTAMP(3);

ALTER TABLE "PushToken"
ADD COLUMN "advertisingEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ScheduledNotification"
ADD COLUMN "processingAt" TIMESTAMP(3),
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ScheduledNotification_sent_processingAt_idx"
ON "ScheduledNotification"("sent", "processingAt");

CREATE TABLE "ReviewLike" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewLike_reviewId_userId_key" ON "ReviewLike"("reviewId", "userId");
CREATE INDEX "ReviewLike_userId_idx" ON "ReviewLike"("userId");

ALTER TABLE "ReviewLike"
ADD CONSTRAINT "ReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewLike"
ADD CONSTRAINT "ReviewLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
