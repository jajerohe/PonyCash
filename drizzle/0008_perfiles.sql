CREATE TABLE "perfil" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"es_administrador" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "perfil_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "perfil_permiso" (
	"perfil_id" integer NOT NULL,
	"permiso" text NOT NULL,
	CONSTRAINT "perfil_permiso_perfil_id_permiso_pk" PRIMARY KEY("perfil_id","permiso")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "perfil_id" integer;--> statement-breakpoint
ALTER TABLE "perfil_permiso" ADD CONSTRAINT "perfil_permiso_perfil_id_perfil_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfil"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_perfil_id_perfil_id_fk" FOREIGN KEY ("perfil_id") REFERENCES "public"."perfil"("id") ON DELETE restrict ON UPDATE no action;