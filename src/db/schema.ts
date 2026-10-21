// Tablas que necesita Better Auth (inicio de sesión) más los campos
// del plugin "admin" (role, banned, banReason, banExpires, impersonatedBy).
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ---------- Manillas ----------

// Manillas que se venden en el parque (Adulto, Niño, Pasaporte…).
export const manilla = pgTable("manilla", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ---------- Tipos de tarifa ----------

// Tipos de tarifa (Plena, Promoción…). Los marcados como "protegido" vienen
// con el sistema (la tarifa Plena) y no se pueden cambiar ni eliminar.
export const tipoTarifa = pgTable(
  "tipo_tarifa",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    activa: boolean("activa").notNull().default(true),
    protegido: boolean("protegido").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  // El nombre no se repite aunque cambien mayúsculas ("plena" = "Plena").
  (table) => [uniqueIndex("tipo_tarifa_nombre_unico").on(sql`lower(${table.nombre})`)],
);

// ---------- Tarifas ----------

// Precio de una manilla para un tipo de tarifa entre dos fechas.
// Cada manilla nace con una tarifa "predeterminada" (Plena, $0, hasta fin de
// año): se le puede cambiar el valor y las fechas, pero no desactivar ni eliminar.
export const tarifa = pgTable(
  "tarifa",
  {
    id: serial("id").primaryKey(),
    manillaId: integer("manilla_id")
      .notNull()
      .references(() => manilla.id, { onDelete: "cascade" }),
    tipoTarifaId: integer("tipo_tarifa_id")
      .notNull()
      .references(() => tipoTarifa.id, { onDelete: "restrict" }),
    valor: integer("valor").notNull().default(0), // En pesos, sin centavos
    desde: date("desde", { mode: "string" }).notNull(),
    hasta: date("hasta", { mode: "string" }).notNull(),
    activa: boolean("activa").notNull().default(true),
    predeterminada: boolean("predeterminada").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tarifa_manilla_idx").on(table.manillaId),
    // Solo una tarifa predeterminada por manilla.
    uniqueIndex("tarifa_predeterminada_unica").on(table.manillaId).where(sql`${table.predeterminada}`),
  ],
);
