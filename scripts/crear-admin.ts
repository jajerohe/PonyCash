// Crea el primer administrador. Uso:
//   npm run crear-admin -- "Tu Nombre" tu@correo.com "TuContraseña"
import "dotenv/config";
import { auth } from "../src/lib/auth";

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Uso: npm run crear-admin -- "Nombre" correo@ejemplo.com "Contraseña"');
  process.exit(1);
}

async function main() {
  await auth.api.createUser({ body: { name, email, password, role: "admin" } });
  console.log(`Administrador creado: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("No se pudo crear el administrador:", error.message ?? error);
    process.exit(1);
  });
