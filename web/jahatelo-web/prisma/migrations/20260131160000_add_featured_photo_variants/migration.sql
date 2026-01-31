-- Add featured photo variants for web/app
ALTER TABLE "Motel" ADD COLUMN IF NOT EXISTS "featuredPhotoWeb" TEXT;
ALTER TABLE "Motel" ADD COLUMN IF NOT EXISTS "featuredPhotoApp" TEXT;
