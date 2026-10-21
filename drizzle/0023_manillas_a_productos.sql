-- Las manillas pasan a llamarse productos. Se renombran tablas, columnas,
-- índices y llaves sin tocar los datos.
ALTER TABLE "manilla" RENAME TO "producto";--> statement-breakpoint
ALTER SEQUENCE "manilla_id_seq" RENAME TO "producto_id_seq";--> statement-breakpoint
ALTER INDEX "manilla_pkey" RENAME TO "producto_pkey";--> statement-breakpoint
ALTER TABLE "producto" RENAME CONSTRAINT "manilla_nombre_unique" TO "producto_nombre_unique";--> statement-breakpoint
ALTER TABLE "tarifa" RENAME COLUMN "manilla_id" TO "producto_id";--> statement-breakpoint
ALTER TABLE "tarifa" RENAME CONSTRAINT "tarifa_manilla_id_manilla_id_fk" TO "tarifa_producto_id_producto_id_fk";--> statement-breakpoint
ALTER INDEX "tarifa_manilla_idx" RENAME TO "tarifa_producto_idx";--> statement-breakpoint
ALTER TABLE "punto_venta_manilla" RENAME TO "punto_venta_producto";--> statement-breakpoint
ALTER TABLE "punto_venta_producto" RENAME COLUMN "manilla_id" TO "producto_id";--> statement-breakpoint
ALTER TABLE "punto_venta_producto" RENAME CONSTRAINT "punto_venta_manilla_punto_venta_id_manilla_id_pk" TO "punto_venta_producto_punto_venta_id_producto_id_pk";--> statement-breakpoint
ALTER TABLE "punto_venta_producto" RENAME CONSTRAINT "punto_venta_manilla_punto_venta_id_punto_venta_id_fk" TO "punto_venta_producto_punto_venta_id_punto_venta_id_fk";--> statement-breakpoint
ALTER TABLE "punto_venta_producto" RENAME CONSTRAINT "punto_venta_manilla_manilla_id_manilla_id_fk" TO "punto_venta_producto_producto_id_producto_id_fk";--> statement-breakpoint
ALTER INDEX "punto_venta_manilla_manilla_idx" RENAME TO "punto_venta_producto_producto_idx";
