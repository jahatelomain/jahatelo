-- Barrio deja de formar parte del modelo de ubicación.
-- La ubicación canónica queda definida por ciudad, dirección y coordenadas.
ALTER TABLE "Motel" DROP COLUMN "neighborhood";
