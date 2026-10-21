CREATE TABLE "punto_venta_manilla" (
	"punto_venta_id" integer NOT NULL,
	"manilla_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "punto_venta_manilla_punto_venta_id_manilla_id_pk" PRIMARY KEY("punto_venta_id","manilla_id")
);
--> statement-breakpoint
ALTER TABLE "punto_venta_manilla" ADD CONSTRAINT "punto_venta_manilla_punto_venta_id_punto_venta_id_fk" FOREIGN KEY ("punto_venta_id") REFERENCES "public"."punto_venta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punto_venta_manilla" ADD CONSTRAINT "punto_venta_manilla_manilla_id_manilla_id_fk" FOREIGN KEY ("manilla_id") REFERENCES "public"."manilla"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "punto_venta_manilla_manilla_idx" ON "punto_venta_manilla" USING btree ("manilla_id");