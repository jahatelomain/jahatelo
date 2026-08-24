-- Optimización segura: no modifica datos ni contratos de la API.
-- Centraliza la búsqueda relajada (sin acentos, espacios ni símbolos) para
-- que PostgreSQL pueda usar índices sobre la misma expresión.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.jahatelo_normalize_search(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT REGEXP_REPLACE(
    LOWER(TRANSLATE(COALESCE(input_text, ''),
      'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛ',
      'aeiounAEIOUNaeiouAEIOUaeiouAEIOUaeiouAEIOU')),
    '[^a-z0-9]+',
    '',
    'g'
  );
$$;

-- Filtros y órdenes frecuentes.
CREATE INDEX IF NOT EXISTS "Motel_status_isActive_createdAt_idx" ON "Motel"("status", "isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Motel_status_isActive_city_idx" ON "Motel"("status", "isActive", "city");
CREATE INDEX IF NOT EXISTS "Motel_financialStatus_status_isActive_idx" ON "Motel"("financialStatus", "status", "isActive");
CREATE INDEX IF NOT EXISTS "PaymentHistory_motelId_paidAt_idx" ON "PaymentHistory"("motelId", "paidAt");
CREATE INDEX IF NOT EXISTS "RoomType_motelId_isActive_order_idx" ON "RoomType"("motelId", "isActive", "order");
CREATE INDEX IF NOT EXISTS "RoomPhoto_roomTypeId_order_idx" ON "RoomPhoto"("roomTypeId", "order");
CREATE INDEX IF NOT EXISTS "Promo_motelId_isActive_validFrom_validUntil_idx" ON "Promo"("motelId", "isActive", "validFrom", "validUntil");
CREATE INDEX IF NOT EXISTS "MotelProspect_status_createdAt_idx" ON "MotelProspect"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MotelAnalytics_motelId_eventType_timestamp_idx" ON "MotelAnalytics"("motelId", "eventType", "timestamp");

-- Búsquedas del admin, financiero, catálogo y prospectos. Cada índice conserva
-- el comportamiento actual de coincidencia parcial sobre campos independientes.
CREATE INDEX IF NOT EXISTS "Motel_name_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("name") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_city_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("city") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_description_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("description") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_contactName_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("contactName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_contactEmail_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("contactEmail") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_contactPhone_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("contactPhone") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_phone_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("phone") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_whatsapp_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("whatsapp") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_adminContactName_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("adminContactName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_adminContactEmail_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("adminContactEmail") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Motel_adminContactPhone_relaxed_trgm_idx" ON "Motel" USING GIN (public.jahatelo_normalize_search("adminContactPhone") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "MotelProspect_motelName_relaxed_trgm_idx" ON "MotelProspect" USING GIN (public.jahatelo_normalize_search("motelName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "MotelProspect_contactName_relaxed_trgm_idx" ON "MotelProspect" USING GIN (public.jahatelo_normalize_search("contactName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "MotelProspect_phone_relaxed_trgm_idx" ON "MotelProspect" USING GIN (public.jahatelo_normalize_search("phone") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "MotelProspect_notes_relaxed_trgm_idx" ON "MotelProspect" USING GIN (public.jahatelo_normalize_search("notes") gin_trgm_ops);
