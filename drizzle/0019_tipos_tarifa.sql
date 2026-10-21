CREATE TABLE "tipo_tarifa" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"activa" boolean DEFAULT true NOT NULL,
	"protegido" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tipo_tarifa_nombre_unico" ON "tipo_tarifa" USING btree (lower("nombre"));--> statement-breakpoint
INSERT INTO "tipo_tarifa" ("nombre", "descripcion", "protegido") VALUES ('Plena', 'Tarifa con el precio completo', true) ON CONFLICT DO NOTHING;
