-- Los prospectos de relevamiento pueden comenzar únicamente con el nombre del motel.
ALTER TABLE "MotelProspect"
  ALTER COLUMN "contactName" DROP NOT NULL,
  ALTER COLUMN "phone" DROP NOT NULL;
