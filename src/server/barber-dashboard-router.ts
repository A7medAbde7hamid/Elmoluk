import { format } from "date-fns";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, barberQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { bookings, barbers, services, users } from "@db/schema";

export const barberDashboardRouter = createRouter({
  // Get the authenticated barber's info
  myProfile: barberQuery.query(async ({ ctx }) => {
    const db = getDb();
    const barber = await db.query.barbers.findFirst({
      where: eq(barbers.userId, ctx.user.id),
    });
    return barber;
  }),

  // Get barber's bookings for today
  todayBookings: barberQuery.query(async ({ ctx }) => {
    const db = getDb();
    const barber = await db.query.barbers.findFirst({
      where: eq(barbers.userId, ctx.user.id),
    });
    if (!barber) throw new Error("Barber not linked to user account");
    const today = format(new Date(), "yyyy-MM-dd");
    const list = await db.query.bookings.findMany({
      where: and(eq(bookings.barberId, barber.id), eq(bookings.bookingDate, today)),
      orderBy: [desc(bookings.bookingTime)],
    });
    const enriched = await Promise.all(list.map(async (b) => {
      const service = b.serviceId ? await db.query.services.findFirst({ where: eq(services.id, b.serviceId) }) : null;
      const user = b.userId ? await db.query.users.findFirst({ where: eq(users.id, b.userId) }) : null;
      return { ...b, service, user };
    }));
    return enriched;
  }),

  // Mark booking status (own bookings only)
  markStatus: barberQuery
    .input(z.object({ id: z.number(), status: z.enum(["confirmed", "completed", "no_show"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const barber = await db.query.barbers.findFirst({ where: eq(barbers.userId, ctx.user.id) });
      if (!barber) throw new Error("Barber not linked to user account");
      await db.update(bookings)
        .set({ status: input.status })
        .where(and(eq(bookings.id, input.id), eq(bookings.barberId, barber.id)));
      return { success: true };
    }),

  // Walk-in booking (cashier)
  walkIn: barberQuery
    .input(z.object({
      serviceId: z.number(),
      barberId: z.number(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      bookingDate: z.string(),
      bookingTime: z.string(),
      duration: z.number().default(30),
      totalAmount: z.number(),
      paymentMethod: z.enum(["cash", "card", "vodafone_cash", "wallet"]).default("cash"),
      paymentStatus: z.enum(["pending", "paid"]).default("paid"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(bookings).values({
        barberId: input.barberId,
        serviceId: input.serviceId,
        bookingDate: input.bookingDate,
        bookingTime: input.bookingTime,
        duration: input.duration,
        totalAmount: input.totalAmount,
        status: "completed",
        paymentStatus: input.paymentStatus,
        notes: `عميل ووك إن - ${input.customerName}${input.customerPhone ? ` (${input.customerPhone})` : ""}`,
        otpVerified: true,
      });
      return { id: Number(result[0].insertId) };
    }),

  // List all barbers (for linking)
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.query.barbers.findMany({ orderBy: [desc(barbers.createdAt)] });
  }),
});
