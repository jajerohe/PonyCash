DROP TABLE "categoria" CASCADE;--> statement-breakpoint
DROP TABLE "producto" CASCADE;--> statement-breakpoint
DROP TABLE "subcategoria" CASCADE;--> statement-breakpoint
-- Permisos de los módulos quitados que hayan quedado en los perfiles.
DELETE FROM "perfil_permiso" WHERE "permiso" LIKE 'categorias.%' OR "permiso" LIKE 'subcategorias.%' OR "permiso" LIKE 'inventario.%';
