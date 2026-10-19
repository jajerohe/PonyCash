-- Perfiles iniciales. "Administrador" tiene siempre todos los permisos.
INSERT INTO "perfil" ("nombre", "descripcion", "es_administrador") VALUES
  ('Administrador', 'Acceso total al sistema', true),
  ('Usuario', 'Sin permisos por ahora: asígnalos desde Perfiles', false)
ON CONFLICT ("nombre") DO NOTHING;
--> statement-breakpoint
-- Los usuarios que ya existían conservan su nivel de acceso.
UPDATE "user" SET "perfil_id" = (SELECT "id" FROM "perfil" WHERE "nombre" = 'Administrador')
WHERE "role" = 'admin' AND "perfil_id" IS NULL;
--> statement-breakpoint
UPDATE "user" SET "perfil_id" = (SELECT "id" FROM "perfil" WHERE "nombre" = 'Usuario')
WHERE "perfil_id" IS NULL;
