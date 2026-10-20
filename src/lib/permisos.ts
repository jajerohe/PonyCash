// Catálogo de módulos del sistema y sus opciones. Cada opción es un permiso
// ("modulo.opcion") que se puede dar o quitar a un perfil en Perfiles.
// Al crear un módulo nuevo, se agrega aquí con sus opciones.

export const MODULOS = [
  {
    clave: "usuarios",
    nombre: "Usuarios",
    descripcion: "Cuentas de las personas que usan el sistema",
    opciones: [
      { clave: "ver", nombre: "Ver la lista de usuarios" },
      { clave: "crear", nombre: "Crear usuarios" },
      { clave: "editar", nombre: "Editar nombre y correo" },
      { clave: "perfil", nombre: "Cambiar el perfil de un usuario" },
      { clave: "contrasena", nombre: "Cambiar contraseñas" },
      { clave: "bloquear", nombre: "Bloquear y desbloquear" },
      { clave: "eliminar", nombre: "Eliminar usuarios" },
    ],
  },
  {
    clave: "categorias",
    nombre: "Categorías",
    descripcion: "Categorías del parque: Manillas, Reservas, Cortesías…",
    opciones: [
      { clave: "ver", nombre: "Ver las categorías" },
      { clave: "crear", nombre: "Crear categorías" },
      { clave: "editar", nombre: "Editar, ordenar y activar o desactivar" },
      { clave: "eliminar", nombre: "Eliminar categorías" },
    ],
  },
  {
    clave: "subcategorias",
    nombre: "Subcategorías",
    descripcion: "Subcategorías del parque: Entradas, Combos, Atracciones…",
    opciones: [
      { clave: "ver", nombre: "Ver las subcategorías" },
      { clave: "crear", nombre: "Crear subcategorías" },
      { clave: "editar", nombre: "Editar, ordenar y activar o desactivar" },
      { clave: "eliminar", nombre: "Eliminar subcategorías" },
    ],
  },
  {
    clave: "inventario",
    nombre: "Inventario",
    descripcion: "Productos de cada categoría y sus cantidades",
    opciones: [
      { clave: "ver", nombre: "Ver el inventario" },
      { clave: "crear", nombre: "Crear productos" },
      { clave: "editar", nombre: "Editar productos y cantidades" },
      { clave: "eliminar", nombre: "Eliminar productos" },
    ],
  },
  {
    clave: "perfiles",
    nombre: "Perfiles y accesos",
    descripcion: "Qué puede hacer cada perfil en cada módulo",
    opciones: [
      { clave: "ver", nombre: "Ver los perfiles y sus permisos" },
      { clave: "gestionar", nombre: "Crear, editar y eliminar perfiles" },
    ],
  },
] as const;

type Modulo = (typeof MODULOS)[number];
export type Permiso = {
  [M in Modulo as M["clave"]]: `${M["clave"]}.${M["opciones"][number]["clave"]}`;
}[Modulo["clave"]];

export const TODOS_LOS_PERMISOS: Permiso[] = MODULOS.flatMap((m) =>
  m.opciones.map((o) => `${m.clave}.${o.clave}` as Permiso),
);

export function esPermiso(texto: string): texto is Permiso {
  return (TODOS_LOS_PERMISOS as string[]).includes(texto);
}
