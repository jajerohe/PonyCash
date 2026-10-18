CREATE TABLE "categoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categoria_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "manilla" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoria_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "manilla_categoria_nombre_unique" UNIQUE("categoria_id","nombre")
);
--> statement-breakpoint
CREATE TABLE "tarifa" (
	"id" serial PRIMARY KEY NOT NULL,
	"manilla_id" integer NOT NULL,
	"tipo_tarifa_id" integer NOT NULL,
	"valor" integer NOT NULL,
	CONSTRAINT "tarifa_manilla_tipo_unique" UNIQUE("manilla_id","tipo_tarifa_id"),
	CONSTRAINT "tarifa_valor_no_negativo" CHECK ("tarifa"."valor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tipo_tarifa" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tipo_tarifa_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "manilla" ADD CONSTRAINT "manilla_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarifa" ADD CONSTRAINT "tarifa_manilla_id_manilla_id_fk" FOREIGN KEY ("manilla_id") REFERENCES "public"."manilla"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarifa" ADD CONSTRAINT "tarifa_tipo_tarifa_id_tipo_tarifa_id_fk" FOREIGN KEY ("tipo_tarifa_id") REFERENCES "public"."tipo_tarifa"("id") ON DELETE restrict ON UPDATE no action;