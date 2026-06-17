import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { salonSettings, holidays, branches, activityLogs, bookings, barbers, users, products } from "@db/schema";

export const salonRouter = createRouter({
  // Get all settings (public)
  getSettings: publicQuery.query(async () => {
    const db = getDb();
    return db.query.salonSettings.findMany();
  }),

  // Get setting by key
  getSetting: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.salonSettings.findFirst({
        where: eq(salonSettings.key, input.key),
      });
    }),

  // Update/create setting (admin)
  setSetting: adminQuery
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.query.salonSettings.findFirst({
        where: eq(salonSettings.key, input.key),
      });
      
      if (existing) {
        await db.update(salonSettings)
          .set({ value: input.value })
          .where(eq(salonSettings.id, existing.id));
      } else {
        await db.insert(salonSettings).values(input);
      }
      
      return { success: true };
    }),

  // Holidays management
  listHolidays: publicQuery.query(async () => {
    const db = getDb();
    return db.query.holidays.findMany({
      orderBy: [desc(holidays.date)],
    });
  }),

  addHoliday: adminQuery
    .input(
      z.object({
        date: z.string(),
        name: z.string(),
        isRecurring: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(holidays).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  removeHoliday: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(holidays).where(eq(holidays.id, input.id));
      return { success: true };
    }),

  // Branches management
  listBranches: publicQuery.query(async () => {
    const db = getDb();
    return db.query.branches.findMany({
      orderBy: [desc(branches.isMain)],
    });
  }),

  createBranch: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        mapUrl: z.string().optional(),
        isMain: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(branches).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  updateBranch: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        mapUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(branches).set(data).where(eq(branches.id, id));
      return { success: true };
    }),

  deleteBranch: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(branches).where(eq(branches.id, input.id));
      return { success: true };
    }),

  // Activity Logs
  getLogs: adminQuery
    .input(
      z.object({
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.activityLogs.findMany({
        orderBy: [desc(activityLogs.createdAt)],
        limit: input?.limit,
      });
    }),

  addLog: adminQuery
    .input(
      z.object({
        action: z.string(),
        entity: z.string(),
        entityId: z.number().optional(),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(activityLogs).values({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true };
    }),

  // Dashboard overview
  dashboard: adminQuery.query(async () => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    
    const [countResult, recent] = await Promise.all([
      db.select({
        total: sql`COUNT(*)`.mapWith(Number),
        today: sql`SUM(CASE WHEN booking_date = ${today} THEN 1 ELSE 0 END)`.mapWith(Number),
        pending: sql`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`.mapWith(Number),
        completed: sql`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`.mapWith(Number),
      }).from(bookings).then((r) => r[0]),
      db.query.bookings.findMany({ orderBy: [desc(bookings.createdAt)], limit: 10 }),
    ]);
    const [barbersCount, usersCount, productsCount] = await Promise.all([
      db.select({ c: sql`COUNT(*)`.mapWith(Number) }).from(barbers).then((r) => r[0].c),
      db.select({ c: sql`COUNT(*)`.mapWith(Number) }).from(users).then((r) => r[0].c),
      db.select({ c: sql`COUNT(*)`.mapWith(Number) }).from(products).then((r) => r[0].c),
    ]);
    
    return {
      stats: {
        totalBookings: countResult.total,
        todayBookings: countResult.today,
        pendingBookings: countResult.pending,
        completedBookings: countResult.completed,
        totalBarbers: barbersCount,
        totalUsers: usersCount,
        totalProducts: productsCount,
      },
      recentBookings: recent,
    };
  }),
});
