import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { users } from "../../db/schema.js";

export const userRouter = createRouter({
  list: adminQuery
    .input(z.object({
      role: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
        limit: input?.limit,
      });
    }),

  updateRole: adminQuery
    .input(z.object({
      id: z.number(),
      role: z.enum(["user", "admin", "manager", "barber"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
      return { success: true };
    }),
});
