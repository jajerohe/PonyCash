import { count } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

// true cuando ya existe al menos un usuario (la app ya fue configurada).
export async function hayUsuarios() {
  const [{ total }] = await db.select({ total: count() }).from(user);
  return total > 0;
}
