# PonyCash

Aplicación web hecha con **Next.js + TypeScript + Neon (PostgreSQL)**.

Por ahora tiene:
- **Inicio de sesión** con correo y contraseña.
- **Tarifas** del parque: categorías, manillas, tipos de tarifa y el valor de cada manilla por tipo de tarifa. Todos los usuarios las ven; solo los administradores las cambian.
- **Administración de usuarios** (solo para administradores): crear, editar nombre y correo, cambiar rol, cambiar contraseña, bloquear/desbloquear y eliminar.

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
5. En **Settings → Build → Variables and secrets** agrega, como tipo **Secret**:
   - `DATABASE_URL`: la cadena de Neon.
   - `BETTER_AUTH_SECRET`: la clave del paso 2.

   Al publicar, la app crea las tablas y copia estos dos valores a sus propios
   secretos (`scripts/subir-secretos.mjs`). Compruébalo en `/api/estado`.
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
│   ├── session.ts              requireSession() y requireAdmin()
│   ├── pesos.ts                Formato y lectura de valores en pesos
│   └── errores.ts              Mensajes de error en español
├── components/
│   ├── ui.tsx                  Botón, campo, tarjeta, insignia
│   ├── formulario.tsx          Formulario con "Guardando…" y mensajes
│   └── menu.tsx                Menú lateral
└── app/
    ├── configurar/             Crear el primer administrador
    ├── login/                  Pantalla de inicio de sesión
    ├── api/auth/[...all]/      Rutas internas de Better Auth
    └── (app)/                  Páginas que requieren sesión
        ├── layout.tsx          Menú lateral + contenido
        ├── page.tsx            Inicio
        ├── tarifas/            Tabla de tarifas por categoría
        │   ├── manillas/       Crear y editar una manilla con sus valores
        │   ├── configuracion/  Categorías y tipos de tarifa
        │   └── actions.ts      Guardar, crear y eliminar
        └── usuarios/           Administración de usuarios
            ├── page.tsx        Lista
            ├── nuevo/          Crear usuario
            ├── [id]/           Editar usuario
            └── actions.ts      Acciones (crear, editar, bloquear, eliminar…)
drizzle/                        Migraciones SQL (cambios en las tablas y tarifas iniciales)
scripts/subir-secretos.mjs      Copia los secretos de Build a la app al publicar
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
