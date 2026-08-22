-- Conserva la variante protegida existente en "url" y permite almacenar una
-- variante limpia exclusiva para las apps móviles.
ALTER TABLE "RoomPhoto" ADD COLUMN IF NOT EXISTS "appUrl" TEXT;
