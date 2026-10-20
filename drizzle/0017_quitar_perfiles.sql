-- Quita los perfiles. El acceso vuelve a depender solo del rol ("admin" o "user"),
-- que ya estaba sincronizado con el perfil Administrador.
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_perfil_id_perfil_id_fk";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "perfil_id";--> statement-breakpoint
DROP TABLE IF EXISTS "perfil_permiso" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "perfil" CASCADE;
