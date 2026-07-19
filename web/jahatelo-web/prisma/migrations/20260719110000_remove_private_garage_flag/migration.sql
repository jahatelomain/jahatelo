-- Eliminar tanto el flag legado como cualquier amenity equivalente y sus
-- asociaciones. RoomAmenity usa ON DELETE CASCADE desde Amenity.
ALTER TABLE "RoomType" DROP COLUMN IF EXISTS "hasPrivateGarage";

DELETE FROM "Amenity"
WHERE LOWER(TRIM("name")) LIKE '%garage%privad%'
   OR LOWER(TRIM("name")) LIKE '%garaje%privad%'
   OR LOWER(TRIM("name")) LIKE '%cochera%privad%'
   OR LOWER(TRIM("name")) LIKE '%estacionamiento%privad%';
