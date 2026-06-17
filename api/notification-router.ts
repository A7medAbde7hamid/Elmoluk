import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, adminQuery, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { notifications } from "@db/schema";

export const notificationRouter = createRouter({
  // Get user's notifications
  myNotifications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.user.id),
      orderBy: [desc(notifications.createdAt)],
    });
  }),

  // Mark as read
  markAsRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  // Mark all as read
  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),

  // Send notification (admin)
  send: adminQuery
    .input(
      z.object({
        userId: z.number().optional(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(["booking", "offer", "system", "reminder"]).default("system"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(notifications).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  // Delete notification
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(notifications).where(eq(notifications.id, input.id));
      return { success: true };
    }),
});
