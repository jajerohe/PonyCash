import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { ListadoUsuarios } from "./listado";

export default async function UsuariosPage() {
  const { user: yo } = await requireAdmin();

  const usuarios = await getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      banned: user.banned,
      createdAt: user.createdAt,
      role: user.role,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(200);

  return <ListadoUsuarios usuarios={usuarios} yoId={yo.id} />;
}
