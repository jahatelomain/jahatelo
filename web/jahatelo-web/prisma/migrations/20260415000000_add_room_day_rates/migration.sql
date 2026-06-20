-- CreateEnum
CREATE TYPE "DayGroup" AS ENUM ('WEEKDAY', 'WEEKEND');

-- CreateTable
CREATE TABLE "RoomDayRate" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "dayGroup" "DayGroup" NOT NULL,
    "price1h" INTEGER,
    "price1_5h" INTEGER,
    "price2h" INTEGER,
    "price3h" INTEGER,
    "price12h" INTEGER,
    "price24h" INTEGER,
    "priceNight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomDayRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomDayRate_roomTypeId_dayGroup_key" ON "RoomDayRate"("roomTypeId", "dayGroup");

-- AddForeignKey
ALTER TABLE "RoomDayRate" ADD CONSTRAINT "RoomDayRate_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
