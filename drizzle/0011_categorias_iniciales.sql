-- Categorías iniciales del parque.
INSERT INTO "categoria" ("nombre", "orden") VALUES
  ('Manillas', 1),
  ('Reservas', 2),
  ('Cortesias', 3),
  ('Pase anual', 4),
  ('Otros', 5)
ON CONFLICT ("nombre") DO NOTHING;
