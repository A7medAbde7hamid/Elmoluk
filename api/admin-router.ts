import { z } from "zod";
import { eq, desc, sum, count } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { bookings, users, siteVisits, payments, affiliates } from "@db/schema";

export const adminRouter = createRouter({
  // Get live statistics
  stats: adminQuery.query(async () => {
    const db = getDb();
    
    // Revenue
    const revenueResult = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "completed"));
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // Clients
    const clientsResult = await db.select({ total: count() }).from(users).where(eq(users.role, "user"));
    const totalClients = clientsResult[0]?.total || 0;
    
    // Visits
    const visitsResult = await db.select({ total: count() }).from(siteVisits);
    const totalVisits = visitsResult[0]?.total || 0;
    
    // Bookings
    const bookingsResult = await db.select({ total: count() }).from(bookings);
    const totalBookings = bookingsResult[0]?.total || 0;

    return {
      totalRevenue,
      totalClients,
      totalVisits,
      totalBookings
    };
  }),

  // Manage Affiliates
  listAffiliates: adminQuery.query(async () => {
    const db = getDb();
    return db.query.affiliates.findMany({
      orderBy: [desc(affiliates.createdAt)]
    });
  }),

  createAffiliate: adminQuery
    .input(z.object({
      userId: z.number(),
      code: z.string().min(1),
      commissionRate: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(affiliates).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  updateAffiliate: adminQuery
    .input(z.object({
      id: z.number(),
      code: z.string().optional(),
      commissionRate: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(affiliates).set(data).where(eq(affiliates.id, id));
      return { success: true };
    }),
});
