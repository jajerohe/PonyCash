CREATE TABLE "tarifa" (
	"id" serial PRIMARY KEY NOT NULL,
	"manilla_id" integer NOT NULL,
	"tipo_tarifa_id" integer NOT NULL,
	"valor" integer DEFAULT 0 NOT NULL,
	"desde" date NOT NULL,
	"hasta" date NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"predeterminada" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tarifa" ADD CONSTRAINT "tarifa_manilla_id_manilla_id_fk" FOREIGN KEY ("manilla_id") REFERENCES "public"."manilla"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarifa" ADD CONSTRAINT "tarifa_tipo_tarifa_id_tipo_tarifa_id_fk" FOREIGN KEY ("tipo_tarifa_id") REFERENCES "public"."tipo_tarifa"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tarifa_manilla_idx" ON "tarifa" USING btree ("manilla_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tarifa_predeterminada_unica" ON "tarifa" USING btree ("manilla_id") WHERE "tarifa"."predeterminada";--> statement-breakpoint
-- Las manillas que ya existen reciben su tarifa Plena predeterminada.
INSERT INTO "tarifa" ("manilla_id", "tipo_tarifa_id", "valor", "desde", "hasta", "predeterminada")
SELECT m."id", t."id", 0, (now() AT TIME ZONE 'America/Bogota')::date,
       make_date(extract(year FROM now() AT TIME ZONE 'America/Bogota')::int, 12, 31), true
FROM "manilla" m
CROSS JOIN (SELECT "id" FROM "tipo_tarifa" WHERE "protegido" ORDER BY "id" LIMIT 1) t
ON CONFLICT DO NOTHING;
