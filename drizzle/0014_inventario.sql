CREATE TABLE "producto" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoria_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"cantidad" integer DEFAULT 0 NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "producto_categoria_nombre_unique" UNIQUE("categoria_id","nombre")
);
--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE restrict ON UPDATE no action;