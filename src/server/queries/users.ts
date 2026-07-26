import { eq } from "drizzle-orm";
import * as schema from "../../../db/schema.js";
import { getDb } from "./connection.js";

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select({ id: schema.users.id, unionId: schema.users.unionId, name: schema.users.name, phone: schema.users.phone, email: schema.users.email, avatar: schema.users.avatar, role: schema.users.role, createdAt: schema.users.createdAt, updatedAt: schema.users.updatedAt, lastSignInAt: schema.users.lastSignInAt })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}
