CREATE TABLE "CountryCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CountryCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CityCatalog" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CityCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CountryCatalog_normalizedName_key" ON "CountryCatalog"("normalizedName");
CREATE UNIQUE INDEX "CityCatalog_countryId_normalizedName_key" ON "CityCatalog"("countryId", "normalizedName");
CREATE INDEX "CityCatalog_countryId_isActive_idx" ON "CityCatalog"("countryId", "isActive");

ALTER TABLE "CityCatalog" ADD CONSTRAINT "CityCatalog_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
