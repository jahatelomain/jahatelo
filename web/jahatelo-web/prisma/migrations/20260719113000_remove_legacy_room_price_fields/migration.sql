-- Las tarifas por duración y por grupo de días son la única fuente de precios.
ALTER TABLE "RoomType" DROP COLUMN IF EXISTS "basePrice";
ALTER TABLE "RoomType" DROP COLUMN IF EXISTS "priceLabel";
