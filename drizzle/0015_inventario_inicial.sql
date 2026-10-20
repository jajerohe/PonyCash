-- Inventario inicial (tabla de inventario del parque). Cada producto con 1000 unidades.
-- La categoría se busca por nombre sin importar mayúsculas; si no existe, se crea.
INSERT INTO "categoria" ("nombre", "orden")
SELECT v.nombre, v.orden FROM (VALUES ('Manillas', 1), ('Reservas', 2), ('Pase anual', 4), ('Otros', 5)) AS v(nombre, orden)
WHERE NOT EXISTS (SELECT 1 FROM "categoria" c WHERE lower(c.nombre) = lower(v.nombre));
--> statement-breakpoint
INSERT INTO "producto" ("categoria_id", "nombre", "cantidad", "orden")
SELECT c.id, v.nombre, v.cantidad, v.orden FROM (VALUES
  ('Manillas', 'ADULTO', 1000, 1),
  ('Manillas', 'ADULTO MAYOR', 1000, 2),
  ('Manillas', 'NIÑO', 1000, 3),
  ('Manillas', 'COMBO BÁSICO', 1000, 4),
  ('Manillas', 'COMBO INFANTIL', 1000, 5),
  ('Manillas', 'COMBO JUNIOR', 1000, 6),
  ('Manillas', 'PASAPORTE FULL VAQUERO', 1000, 7),
  ('Manillas', 'NIÑO CABRIO', 1000, 8),
  ('Manillas', 'PASEO A CABALLO', 1000, 9),
  ('Manillas', 'FOTO CON ÑOÑO', 1000, 10),
  ('Manillas', 'TIRO AL BLANCO', 1000, 11),
  ('Manillas', 'PASEO EN TREN', 1000, 12),
  ('Manillas', 'PASEO EN TREN ACOMPAÑANTE', 1000, 13),
  ('Manillas', 'TIROLESA', 1000, 14),
  ('Manillas', 'CUATRIMOTO', 1000, 15),
  ('Manillas', 'PAJARERA', 1000, 16),
  ('Reservas', 'ADULTO', 1000, 1),
  ('Reservas', 'ADULTO MAYOR', 1000, 2),
  ('Reservas', 'NIÑO', 1000, 3),
  ('Reservas', 'COMBO BÁSICO', 1000, 4),
  ('Reservas', 'COMBO INFANTIL', 1000, 5),
  ('Reservas', 'COMBO JUNIOR', 1000, 6),
  ('Reservas', 'PASAPORTE FULL VAQUERO', 1000, 7),
  ('Pase anual', 'ADULTO', 1000, 1),
  ('Pase anual', 'ADULTO MAYOR', 1000, 2),
  ('Pase anual', 'NIÑO', 1000, 3),
  ('Otros', 'AUTOMOVIL', 1000, 1),
  ('Otros', 'MOTOCICLETA', 1000, 2)
) AS v(categoria, nombre, cantidad, orden)
JOIN "categoria" c ON lower(c.nombre) = lower(v.categoria)
ON CONFLICT ("categoria_id", "nombre") DO NOTHING;
