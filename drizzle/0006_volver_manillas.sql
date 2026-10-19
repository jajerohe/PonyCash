CREATE TABLE "categoria_manilla" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"color" text DEFAULT '#7c3aed' NOT NULL,
	"descripcion" text,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categoria_manilla_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "venta_manilla" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoria_id" integer NOT NULL,
	"cantidad" integer NOT NULL,
	"fecha" date NOT NULL,
	"usuario_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "venta_manilla_cantidad_positiva" CHECK ("venta_manilla"."cantidad" > 0)
);
--> statement-breakpoint
ALTER TABLE "venta_manilla" ADD CONSTRAINT "venta_manilla_categoria_id_categoria_manilla_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria_manilla"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_manilla" ADD CONSTRAINT "venta_manilla_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venta_manilla_fecha_idx" ON "venta_manilla" USING btree ("fecha");