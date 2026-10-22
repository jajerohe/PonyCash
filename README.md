# PonyCash

Aplicación web hecha con **Next.js + TypeScript + Neon (PostgreSQL)**.

Por ahora tiene:
- **Inicio de sesión** con correo y contraseña.
- **Mi cuenta**: cada persona cambia su propia contraseña (pide la actual).
- **¿Olvidaste tu contraseña?**: en el login; envía por correo un enlace (vence en 1 hora) para crear una nueva. Necesita `CORREO_USUARIO` y `CORREO_CONTRASENA` (contraseña de aplicación de Gmail) en los secretos de la app.
- **Productos** (grupo Configuración): listado con buscador; los administradores crean, editan, activan/desactivan y eliminan.
- **Tipos de Tarifas** (grupo Configuración): igual que Productos. Trae la tarifa **Plena**, que no se puede repetir, modificar, desactivar ni eliminar.
- **Tarifas** (grupo Configuración): precio de cada producto por tipo de tarifa entre dos fechas, con su vigencia (Vigente, Vencida o Próxima). Cada producto nuevo recibe una tarifa **Plena** predeterminada de $0, desde el día en que se crea hasta el 31 de diciembre; a esa tarifa se le pueden cambiar el valor y las fechas, pero no se puede desactivar ni eliminar. No se permiten dos tarifas activas del mismo tipo y producto con fechas que se crucen.
  - **Cargar archivo** (botón morado): carga muchas tarifas a la vez desde Excel con la plantilla `public/plantilla-tarifas.xlsx`. Muestra cada fila revisada (nueva, actualiza o error) y solo guarda si no hay errores.
- **Puntos de Venta** (grupo Configuración): taquillas o lugares de venta, igual que Productos (nombre único, sin importar mayúsculas).
- **Productos por Punto de Venta** (grupo Configuración): se elige un punto de venta y se marcan los productos que puede vender (los inactivos no se pueden marcar).
- **Inventario** (grupo Inventario): todo se maneja como manillas físicas que se cuentan.
  - **Inventario general**: existencia de cada producto, cuántas tienen los puntos de venta, cuántas quedan en bodega y su estado frente al mínimo. Los administradores registran **entradas** (compras) y **ajustes** (con motivo).
  - **Jornada diaria**: cada punto de venta empieza con lo que le quedó en su jornada anterior, puede **recibir más manillas** durante el día (sale de la bodega, no cambia la existencia) y al final se registra el **cierre** contando lo que quedó. Vendidas = (le quedó antes + recibió) − quedaron, y se descuentan del inventario general. Lo que quedó sigue en el punto para la siguiente jornada. Un administrador puede **reabrir** el último cierre de un punto para corregirlo.
  - **Movimientos**: historia de un producto con su existencia después de cada movimiento.
  - **Reporte de ventas**: vendidas por producto y punto de venta entre dos fechas.
- **Administración de usuarios** (solo administradores): crear, editar nombre y correo, cambiar rol (Administrador o Usuario), cambiar contraseña, bloquear/desbloquear y eliminar.

## Herramientas

| Pieza | Herramienta |
|---|---|
| Pantallas y lógica | [Next.js](https://nextjs.org) (React) con TypeScript |
| Estilos | [Tailwind CSS](https://tailwindcss.com) |
| Base de datos | [Neon](https://neon.tech) (PostgreSQL) |
| Conexión a la base de datos | [Drizzle ORM](https://orm.drizzle.team) |
| Inicio de sesión y roles | [Better Auth](https://better-auth.com) con el plugin `admin` |
| Publicación | [Cloudflare Workers](https://workers.cloudflare.com) con [OpenNext](https://opennext.js.org/cloudflare) |

## Publicar en Cloudflare (todo desde el navegador)

Cada vez que se sube un cambio a `main` en GitHub, Cloudflare crea las tablas
que falten en Neon y publica la app de nuevo.

1. **Cadena de conexión de Neon**: en tu proyecto de Neon presiona **Connect**
   y copia la cadena (`postgresql://...`). Déjala a mano, sin pegarla en chats.
2. **Clave secreta**: en el navegador presiona **F12 → Console** y escribe
   `crypto.randomUUID() + crypto.randomUUID()`. Copia el resultado.
3. En [dash.cloudflare.com](https://dash.cloudflare.com) entra a
   **Workers & Pages → Create → Import a repository**, conecta tu GitHub y elige
   `ponycash`.
4. En la configuración:
   - **Project name**: `ponycash` (debe coincidir con `wrangler.jsonc`).
   - **Build command**: `npm run cf:build`
   - **Deploy command**: `npx opennextjs-cloudflare deploy`
   - En **Advanced settings → Build variables** agrega `DATABASE_URL` con la
     cadena de Neon (se usa para crear las tablas).
5. Presiona **Deploy**. Cuando termine, ve a **Settings → Variables and Secrets**
   del Worker y agrega, como tipo **Secret**:
   - `DATABASE_URL`: la cadena de Neon.
   - `BETTER_AUTH_SECRET`: la clave del paso 2.
6. Abre la dirección `https://ponycash.<tu-cuenta>.workers.dev`. La primera vez
   aparece **Bienvenido a PonyCash** para crear tu usuario administrador.

⚠️ Nunca escribas la cadena de conexión ni la clave secreta en el código: solo
en Cloudflare.

## Trabajar en un computador (opcional)

```powershell
npm install
copy .env.example .env      # y llena DATABASE_URL y BETTER_AUTH_SECRET
npm run db:migrate          # crea las tablas
npm run dev                 # http://localhost:3000
```

`npm run preview` ejecuta la app en el mismo motor de Cloudflare (lee las
variables de un archivo `.dev.vars`, con el mismo formato que `.env`).

## Cómo está organizado

```
src/
├── proxy.ts                    Si no hay sesión, manda al login
├── db/
│   ├── index.ts                Conexión a la base de datos (una por visita)
│   └── schema.ts               Tablas (user, session, account, verification)
├── lib/
│   ├── auth.ts                 Configuración de Better Auth
│   ├── session.ts              getSession(), requireSession() y requireAdmin()
│   ├── inventario.ts           Existencias, manillas en los puntos y jornadas
│   └── errores.ts              Mensajes de error en español
├── components/
│   ├── ui.tsx                  Botón, campo, tarjeta, insignia
│   ├── formulario.tsx          Formulario con "Guardando…" y mensajes
│   ├── listado.tsx             Piezas de los listados: buscador, botones redondos, ventana
│   ├── catalogo.tsx            Listado con buscador y botones crear/editar/activar/eliminar
│   └── menu.tsx                Menú lateral
└── app/
    ├── configurar/             Crear el primer administrador
    ├── login/                  Pantalla de inicio de sesión
    ├── api/auth/[...all]/      Rutas internas de Better Auth
    └── (app)/                  Páginas que requieren sesión
        ├── layout.tsx          Menú lateral + contenido
        ├── page.tsx            Inicio
        ├── productos/          Listado de productos (crear, editar, activar, eliminar)
        ├── tipos-tarifa/       Listado de tipos de tarifa (Plena viene protegida)
        ├── tarifas/            Listado de tarifas por producto, tipo y fechas
        │   └── carga.ts        Revisión y carga de tarifas desde Excel
        ├── puntos-venta/       Listado de puntos de venta
        ├── productos-punto-venta/ Qué productos vende cada punto de venta
        ├── inventario/         Inventario general, entradas y ajustes
        ├── jornada/            Jornada diaria: agregar manillas y cierre de cada punto
        ├── movimientos/        Historia de un producto
        ├── reporte-ventas/     Vendidas por producto y punto de venta
        └── usuarios/           Administración de usuarios
            ├── page.tsx        Lista
            ├── nuevo/          Crear usuario
            ├── [id]/           Editar usuario
            └── actions.ts      Acciones (crear, editar, bloquear, eliminar…)
drizzle/                        Migraciones SQL (cambios en las tablas)
wrangler.jsonc                  Configuración del Worker de Cloudflare
open-next.config.ts             Configuración del adaptador OpenNext
```

## Seguridad

- Nadie puede registrarse solo: los usuarios los crea un administrador.
- Cada página y cada acción vuelve a comprobar la sesión y el rol en el servidor.
- Un administrador no puede bloquearse, eliminarse ni quitarse el rol a sí mismo.
- Bloquear a un usuario cierra todas sus sesiones abiertas.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app en modo desarrollo |
| `npm run lint` | Revisa el código en busca de errores |
| `npm run db:generate` | Crea una migración SQL después de cambiar `src/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes en la base de datos |
| `npm run cf:build` | Aplica migraciones y prepara la app para Cloudflare |
| `npm run preview` | Prueba la app en el motor de Cloudflare |
| `npm run deploy` | Publica en Cloudflare desde la terminal |
