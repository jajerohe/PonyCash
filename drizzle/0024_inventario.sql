CREATE TABLE "jornada" (
	"id" serial PRIMARY KEY NOT NULL,
	"punto_venta_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"cerrada" boolean DEFAULT false NOT NULL,
	"cerrada_en" timestamp,
	"cerrada_por" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jornada_producto" (
	"jornada_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"anterior" integer DEFAULT 0 NOT NULL,
	"recibidas" integer DEFAULT 0 NOT NULL,
	"final" integer,
	CONSTRAINT "jornada_producto_jornada_id_producto_id_pk" PRIMARY KEY("jornada_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "movimiento" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"tipo" text NOT NULL,
	"producto_id" integer NOT NULL,
	"punto_venta_id" integer,
	"jornada_id" integer,
	"cantidad" integer NOT NULL,
	"cambio" integer NOT NULL,
	"inicial" integer,
	"quedaron" integer,
	"detalle" text,
	"usuario" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "producto" ADD COLUMN "minimo" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "jornada" ADD CONSTRAINT "jornada_punto_venta_id_punto_venta_id_fk" FOREIGN KEY ("punto_venta_id") REFERENCES "public"."punto_venta"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jornada_producto" ADD CONSTRAINT "jornada_producto_jornada_id_jornada_id_fk" FOREIGN KEY ("jornada_id") REFERENCES "public"."jornada"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jornada_producto" ADD CONSTRAINT "jornada_producto_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_punto_venta_id_punto_venta_id_fk" FOREIGN KEY ("punto_venta_id") REFERENCES "public"."punto_venta"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento" ADD CONSTRAINT "movimiento_jornada_id_jornada_id_fk" FOREIGN KEY ("jornada_id") REFERENCES "public"."jornada"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "jornada_punto_fecha_unica" ON "jornada" USING btree ("punto_venta_id","fecha");--> statement-breakpoint
CREATE INDEX "movimiento_producto_idx" ON "movimiento" USING btree ("producto_id","fecha");--> statement-breakpoint
CREATE INDEX "movimiento_fecha_idx" ON "movimiento" USING btree ("fecha");