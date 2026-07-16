import { z } from "zod";
import { eq, desc, sum, count, and, sql } from "drizzle-orm";
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
    
    // Today revenue
    const todayRevenueResult = await db.select({ total: sum(payments.amount) }).from(payments)
      .where(and(eq(payments.status, "completed"), sql`DATE(${payments.createdAt}) = CURDATE()`));
    const todayRevenue = todayRevenueResult[0]?.total || 0;
    
    // Clients
    const clientsResult = await db.select({ total: count() }).from(users).where(eq(users.role, "user"));
    const totalClients = clientsResult[0]?.total || 0;
    
    // Visits
    const visitsResult = await db.select({ total: count() }).from(siteVisits);
    const totalVisits = visitsResult[0]?.total || 0;
    
    // Bookings
    const bookingsResult = await db.select({ total: count() }).from(bookings);
    const totalBookings = bookingsResult[0]?.total || 0;
    
    // Today's bookings
    const todayBookingsResult = await db.select({ total: count() }).from(bookings)
      .where(eq(bookings.bookingDate, sql`CURDATE()`));
    const todayBookings = todayBookingsResult[0]?.total || 0;
    
    // Pending bookings
    const pendingBookingsResult = await db.select({ total: count() }).from(bookings).where(eq(bookings.status, "pending"));
    const pendingBookings = pendingBookingsResult[0]?.total || 0;

    // Revenue by day (last 30 days)
    type RevenueRow = { date: string; revenue: number | string };
    const revenueByDayResult = (await db.execute(
      sql`SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as revenue FROM payments WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC`
    )) as unknown as RevenueRow[];
    
    // Booking counts by status
    type BookingStatusRow = { status: string; count: number };
    const bookingByStatusResult = await db.execute(
      sql`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`
    );

    return {
      totalRevenue,
      todayRevenue,
      totalClients,
      totalVisits,
      totalBookings,
      todayBookings,
      pendingBookings,
      revenueByDay: Array.isArray(revenueByDayResult) ? revenueByDayResult.map((r) => ({ date: r.date, revenue: Number(r.revenue) })) : [],
      bookingByStatus: Array.isArray(bookingByStatusResult) ? (bookingByStatusResult as unknown as BookingStatusRow[]).map((r) => ({ status: r.status, count: Number(r.count) })) : [],
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
