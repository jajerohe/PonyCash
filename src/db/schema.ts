// Tablas que necesita Better Auth (inicio de sesión) más los campos
// del plugin "admin" (role, banned, banReason, banExpires, impersonatedBy).
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
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

// ---------- Productos ----------

// Productos que se venden en el parque (Adulto, Niño, Pasaporte…).
export const producto = pgTable("producto", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  activa: boolean("activa").notNull().default(true),
  // Existencia mínima en el inventario general; por debajo se marca "Bajo".
  minimo: integer("minimo").notNull().default(0),
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

// Precio de un producto para un tipo de tarifa entre dos fechas.
// Cada producto nace con una tarifa "predeterminada" (Plena, $0, hasta fin de
// año): se le puede cambiar el valor y las fechas, pero no desactivar ni eliminar.
export const tarifa = pgTable(
  "tarifa",
  {
    id: serial("id").primaryKey(),
    productoId: integer("producto_id")
      .notNull()
      .references(() => producto.id, { onDelete: "cascade" }),
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
    index("tarifa_producto_idx").on(table.productoId),
    // Solo una tarifa predeterminada por producto.
    uniqueIndex("tarifa_predeterminada_unica").on(table.productoId).where(sql`${table.predeterminada}`),
  ],
);

// ---------- Puntos de venta ----------

// Taquillas o lugares del parque donde se venden los productos.
export const puntoVenta = pgTable(
  "punto_venta",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    activa: boolean("activa").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  // El nombre no se repite aunque cambien mayúsculas.
  (table) => [uniqueIndex("punto_venta_nombre_unico").on(sql`lower(${table.nombre})`)],
);

// Qué productos puede vender cada punto de venta.
export const puntoVentaProducto = pgTable(
  "punto_venta_producto",
  {
    puntoVentaId: integer("punto_venta_id")
      .notNull()
      .references(() => puntoVenta.id, { onDelete: "cascade" }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => producto.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.puntoVentaId, table.productoId] }),
    index("punto_venta_producto_producto_idx").on(table.productoId),
  ],
);

// ---------- Inventario ----------

// Jornada de un punto de venta en un día. Empieza con lo que le quedó en su
// jornada anterior, recibe manillas durante el día y al cerrarse se cuenta lo
// que quedó: vendidas = (anterior + recibidas) − final.
export const jornada = pgTable(
  "jornada",
  {
    id: serial("id").primaryKey(),
    puntoVentaId: integer("punto_venta_id")
      .notNull()
      .references(() => puntoVenta.id, { onDelete: "restrict" }),
    fecha: date("fecha", { mode: "string" }).notNull(),
    cerrada: boolean("cerrada").notNull().default(false),
    cerradaEn: timestamp("cerrada_en"),
    cerradaPor: text("cerrada_por"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("jornada_punto_fecha_unica").on(table.puntoVentaId, table.fecha)],
);

// Manillas de cada producto en una jornada.
export const jornadaProducto = pgTable(
  "jornada_producto",
  {
    jornadaId: integer("jornada_id")
      .notNull()
      .references(() => jornada.id, { onDelete: "cascade" }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => producto.id, { onDelete: "restrict" }),
    anterior: integer("anterior").notNull().default(0), // Le quedó en la jornada anterior
    recibidas: integer("recibidas").notNull().default(0), // Se le entregaron en el día
    final: integer("final"), // Quedaron al cierre (null mientras no se cierra)
  },
  (table) => [primaryKey({ columns: [table.jornadaId, table.productoId] })],
);

// Historia del inventario general. "cambio" es lo que suma o resta a la
// existencia: las entradas suman, las ventas (al cerrar) restan, los ajustes
// pueden hacer ambas cosas y las entregas a un punto no la cambian (cambio 0).
export const movimiento = pgTable(
  "movimiento",
  {
    id: serial("id").primaryKey(),
    fecha: date("fecha", { mode: "string" }).notNull(),
    tipo: text("tipo", { enum: ["entrada", "ajuste", "entrega", "venta"] }).notNull(),
    productoId: integer("producto_id")
      .notNull()
      .references(() => producto.id, { onDelete: "restrict" }),
    puntoVentaId: integer("punto_venta_id").references(() => puntoVenta.id, { onDelete: "restrict" }),
    jornadaId: integer("jornada_id").references(() => jornada.id, { onDelete: "cascade" }),
    cantidad: integer("cantidad").notNull(), // Manillas entregadas, recibidas o vendidas
    cambio: integer("cambio").notNull(),
    inicial: integer("inicial"), // En las ventas: con cuántas empezó el punto
    quedaron: integer("quedaron"), // En las ventas: cuántas quedaron al cierre
    detalle: text("detalle"),
    usuario: text("usuario").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("movimiento_producto_idx").on(table.productoId, table.fecha),
    index("movimiento_fecha_idx").on(table.fecha),
  ],
);
