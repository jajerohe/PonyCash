# PonyCash

Aplicación web hecha con **Next.js + TypeScript + Neon (PostgreSQL)**.

Por ahora tiene:
- **Inicio de sesión** con correo y contraseña.
- **Administración de usuarios** (solo para administradores): crear, editar nombre y correo, cambiar rol, cambiar contraseña, bloquear/desbloquear y eliminar.

## Herramientas

| Pieza | Herramienta |
|---|---|
| Pantallas y lógica | [Next.js](https://nextjs.org) (React) con TypeScript |
| Estilos | [Tailwind CSS](https://tailwindcss.com) |
| Base de datos | [Neon](https://neon.tech) (PostgreSQL) |
| Conexión a la base de datos | [Drizzle ORM](https://orm.drizzle.team) |
| Inicio de sesión y roles | [Better Auth](https://better-auth.com) con el plugin `admin` |

## Ponerla en marcha (Windows)

1. **Instala las dependencias** (en la terminal de VS Code, dentro de la carpeta del proyecto):
   ```powershell
   npm install
   ```
2. **Crea el archivo `.env`**: copia `.env.example`, renómbralo a `.env` y llena:
   - `DATABASE_URL`: la cadena de conexión del botón **Connect** de Neon.
   - `BETTER_AUTH_SECRET`: un texto aleatorio largo. Puedes generarlo con:
     ```powershell
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - `BETTER_AUTH_URL`: déjalo en `http://localhost:3000`.

   ⚠️ El `.env` tiene tus contraseñas: **nunca** lo subas a GitHub (ya está en `.gitignore`).
3. **Crea las tablas en Neon**:
   ```powershell
   npm run db:push
   ```
4. **Crea tu usuario administrador**:
   ```powershell
   npm run crear-admin -- "Tu Nombre" tu@correo.com "UnaContraseñaSegura"
   ```
5. **Arranca la app**:
   ```powershell
   npm run dev
   ```
   y abre http://localhost:3000

## Cómo está organizado

```
src/
├── proxy.ts                    Si no hay sesión, manda al login
├── db/
│   ├── index.ts                Conexión a la base de datos
│   └── schema.ts               Tablas (user, session, account, verification)
├── lib/
│   ├── auth.ts                 Configuración de Better Auth
│   ├── session.ts              requireSession() y requireAdmin()
│   └── errores.ts              Mensajes de error en español
├── components/
│   ├── ui.tsx                  Botón, campo, tarjeta, insignia
│   ├── formulario.tsx          Formulario con "Guardando…" y mensajes
│   └── menu.tsx                Menú lateral
└── app/
    ├── login/                  Pantalla de inicio de sesión
    ├── api/auth/[...all]/      Rutas internas de Better Auth
    └── (app)/                  Páginas que requieren sesión
        ├── layout.tsx          Menú lateral + contenido
        ├── page.tsx            Inicio
        └── usuarios/           Administración de usuarios
            ├── page.tsx        Lista
            ├── nuevo/          Crear usuario
            ├── [id]/           Editar usuario
            └── actions.ts      Acciones (crear, editar, bloquear, eliminar…)
scripts/
└── crear-admin.ts              Crea el primer administrador
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
| `npm run build` | Prepara la versión para publicar |
| `npm run lint` | Revisa el código en busca de errores |
| `npm run db:push` | Crea o actualiza las tablas en la base de datos |
| `npm run crear-admin` | Crea un usuario administrador |
