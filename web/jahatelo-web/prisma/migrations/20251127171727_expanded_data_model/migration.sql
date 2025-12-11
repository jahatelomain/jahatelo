-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "defaultPrice" INTEGER NOT NULL,
    "defaultPhotoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT,
    "roomTypeId" TEXT,
    "userId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "birthDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "motelId" TEXT,
    "roomTypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "is24Hours" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentMethod_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialLink_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Promo_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeBanner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "motelId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Amenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);
INSERT INTO "new_Amenity" ("id", "name", "type") SELECT "id", "name", "type" FROM "Amenity";
DROP TABLE "Amenity";
ALTER TABLE "new_Amenity" RENAME TO "Amenity";
CREATE UNIQUE INDEX "Amenity_name_key" ON "Amenity"("name");
CREATE TABLE "new_MenuCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "title" TEXT,
    "sortOrder" INTEGER,
    CONSTRAINT "MenuCategory_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MenuCategory" ("id", "motelId", "sortOrder", "title") SELECT "id", "motelId", "sortOrder", "title" FROM "MenuCategory";
DROP TABLE "MenuCategory";
ALTER TABLE "new_MenuCategory" RENAME TO "MenuCategory";
CREATE TABLE "new_MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MenuItem" ("categoryId", "description", "id", "name", "price") SELECT "categoryId", "description", "id", "name", "price" FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";
CREATE TABLE "new_Motel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mapUrl" TEXT,
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
    "plan" TEXT,
    "nextBillingAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Motel" ("address", "city", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "id", "instagram", "isActive", "latitude", "longitude", "name", "neighborhood", "phone", "slug", "status", "updatedAt", "website", "whatsapp") SELECT "address", "city", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "id", "instagram", "isActive", "latitude", "longitude", "name", "neighborhood", "phone", "slug", "status", "updatedAt", "website", "whatsapp" FROM "Motel";
DROP TABLE "Motel";
ALTER TABLE "new_Motel" RENAME TO "Motel";
CREATE UNIQUE INDEX "Motel_slug_key" ON "Motel"("slug");
CREATE TABLE "new_MotelAmenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    CONSTRAINT "MotelAmenity_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MotelAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MotelAmenity" ("amenityId", "id", "motelId") SELECT "amenityId", "id", "motelId" FROM "MotelAmenity";
DROP TABLE "MotelAmenity";
ALTER TABLE "new_MotelAmenity" RENAME TO "MotelAmenity";
CREATE UNIQUE INDEX "MotelAmenity_motelId_amenityId_key" ON "MotelAmenity"("motelId", "amenityId");
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "order" INTEGER NOT NULL DEFAULT 0,
    "motelId" TEXT,
    "roomTypeId" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Photo_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("id", "kind", "motelId", "roomTypeId", "url") SELECT "id", "kind", "motelId", "roomTypeId", "url" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE TABLE "new_RoomAmenity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomTypeId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    CONSTRAINT "RoomAmenity_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomAmenity" ("amenityId", "id", "roomTypeId") SELECT "amenityId", "id", "roomTypeId" FROM "RoomAmenity";
DROP TABLE "RoomAmenity";
ALTER TABLE "new_RoomAmenity" RENAME TO "RoomAmenity";
CREATE UNIQUE INDEX "RoomAmenity_roomTypeId_amenityId_key" ON "RoomAmenity"("roomTypeId", "amenityId");
CREATE TABLE "new_RoomType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "motelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "price1h" INTEGER,
    "price1_5h" INTEGER,
    "price2h" INTEGER,
    "price3h" INTEGER,
    "price12h" INTEGER,
    "price24h" INTEGER,
    "priceNight" INTEGER,
    "customPrices" TEXT,
    "maxPersons" INTEGER,
    "hasJacuzzi" BOOLEAN NOT NULL DEFAULT false,
    "hasPrivateGarage" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "basePrice" INTEGER,
    "priceLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "RoomType_motelId_fkey" FOREIGN KEY ("motelId") REFERENCES "Motel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomType" ("basePrice", "description", "id", "isActive", "motelId", "name", "priceLabel") SELECT "basePrice", "description", "id", "isActive", "motelId", "name", "priceLabel" FROM "RoomType";
DROP TABLE "RoomType";
ALTER TABLE "new_RoomType" RENAME TO "RoomType";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_motelId_key" ON "Favorite"("userId", "motelId");
