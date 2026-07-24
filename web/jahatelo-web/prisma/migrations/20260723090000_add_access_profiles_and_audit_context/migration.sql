CREATE TYPE "PermissionAction" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'MANAGE');

CREATE TABLE "AccessProfile" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "baseRole" "UserRole" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessProfilePermission" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "actions" "PermissionAction"[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessProfilePermission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "accessProfileId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "module" TEXT, ADD COLUMN "method" TEXT, ADD COLUMN "path" TEXT, ADD COLUMN "statusCode" INTEGER, ADD COLUMN "ipAddress" TEXT, ADD COLUMN "userAgent" TEXT, ADD COLUMN "requestId" TEXT, ADD COLUMN "before" JSONB, ADD COLUMN "after" JSONB;

CREATE UNIQUE INDEX "AccessProfile_key_key" ON "AccessProfile"("key");
CREATE INDEX "AccessProfile_baseRole_isActive_idx" ON "AccessProfile"("baseRole", "isActive");
CREATE UNIQUE INDEX "AccessProfilePermission_profileId_module_key" ON "AccessProfilePermission"("profileId", "module");
CREATE INDEX "AccessProfilePermission_module_idx" ON "AccessProfilePermission"("module");
CREATE INDEX "User_accessProfileId_idx" ON "User"("accessProfileId");

ALTER TABLE "AccessProfilePermission" ADD CONSTRAINT "AccessProfilePermission_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AccessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_accessProfileId_fkey" FOREIGN KEY ("accessProfileId") REFERENCES "AccessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Perfiles de sistema: conservan el comportamiento actual al migrar las
-- cuentas existentes y dan una base editable para los perfiles futuros.
INSERT INTO "AccessProfile" ("id", "key", "name", "description", "isSystem", "baseRole", "isActive", "createdAt", "updatedAt")
VALUES
  ('system-profile-superadmin', 'superadmin', 'Superadministrador', 'Acceso completo al panel administrativo.', true, 'SUPERADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-profile-motel-admin', 'motel_admin', 'Administrador de motel', 'Gestiona únicamente el motel asignado.', true, 'MOTEL_ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-profile-user', 'user', 'Usuario', 'Cuenta de cliente sin acceso administrativo.', true, 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "AccessProfilePermission" ("id", "profileId", "module", "actions", "createdAt", "updatedAt")
SELECT
  'system-permission-superadmin-' || modules."module",
  profile."id",
  modules."module",
  ARRAY['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'MANAGE']::"PermissionAction"[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AccessProfile" profile
CROSS JOIN unnest(ARRAY['dashboard', 'motels', 'promos', 'amenities', 'users', 'roles', 'prospects', 'financiero', 'analytics', 'notifications', 'banners', 'audit', 'inbox', 'configuracion', 'export']) AS modules("module")
WHERE profile."key" = 'superadmin'
ON CONFLICT ("profileId", "module") DO NOTHING;

INSERT INTO "AccessProfilePermission" ("id", "profileId", "module", "actions", "createdAt", "updatedAt")
SELECT
  'system-permission-motel-admin-' || modules."module",
  profile."id",
  modules."module",
  ARRAY['VIEW', 'CREATE', 'UPDATE', 'DELETE']::"PermissionAction"[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AccessProfile" profile
CROSS JOIN unnest(ARRAY['dashboard', 'motels', 'financiero']) AS modules("module")
WHERE profile."key" = 'motel_admin'
ON CONFLICT ("profileId", "module") DO NOTHING;

UPDATE "User" AS user_record
SET "accessProfileId" = profile."id"
FROM "AccessProfile" AS profile
WHERE user_record."accessProfileId" IS NULL
  AND profile."key" = CASE user_record."role"
    WHEN 'SUPERADMIN' THEN 'superadmin'
    WHEN 'MOTEL_ADMIN' THEN 'motel_admin'
    ELSE 'user'
  END;
