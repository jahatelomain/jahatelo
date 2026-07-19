-- Los amenities pertenecen exclusivamente a habitaciones. Los registros de
-- MotelAmenity ya no son una fuente válida y se eliminan deliberadamente.
DROP TABLE IF EXISTS "MotelAmenity";

ALTER TABLE "Amenity" DROP COLUMN IF EXISTS "type";
DROP TYPE IF EXISTS "AmenityType";
