-- Subcategorías iniciales del parque.
INSERT INTO "subcategoria" ("nombre", "orden") VALUES
  ('Entradas', 1),
  ('Pase anual', 2),
  ('Combos', 3),
  ('Atracciones', 4),
  ('Reservas', 5),
  ('Zona Parqueo', 6)
ON CONFLICT ("nombre") DO NOTHING;
