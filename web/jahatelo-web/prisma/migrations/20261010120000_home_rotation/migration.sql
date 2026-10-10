-- Cross-device, cross-instance ordering. Claim rows make a retried visit idempotent.
CREATE TABLE "HomeRotationCounter" (
    "scope" TEXT NOT NULL,
    "nextTicket" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "HomeRotationCounter_pkey" PRIMARY KEY ("scope")
);

CREATE TABLE "HomeRotationClaim" (
    "scope" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "ticket" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeRotationClaim_pkey" PRIMARY KEY ("scope", "visitId")
);

CREATE INDEX "HomeRotationClaim_createdAt_idx" ON "HomeRotationClaim"("createdAt");
