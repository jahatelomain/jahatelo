-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Motel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Motel" ("address", "city", "createdAt", "description", "id", "instagram", "isActive", "latitude", "longitude", "name", "neighborhood", "phone", "slug", "updatedAt", "website", "whatsapp") SELECT "address", "city", "createdAt", "description", "id", "instagram", "isActive", "latitude", "longitude", "name", "neighborhood", "phone", "slug", "updatedAt", "website", "whatsapp" FROM "Motel";
DROP TABLE "Motel";
ALTER TABLE "new_Motel" RENAME TO "Motel";
CREATE UNIQUE INDEX "Motel_slug_key" ON "Motel"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
