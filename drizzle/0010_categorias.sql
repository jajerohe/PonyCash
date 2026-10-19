CREATE TABLE "categoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categoria_nombre_unique" UNIQUE("nombre")
);
