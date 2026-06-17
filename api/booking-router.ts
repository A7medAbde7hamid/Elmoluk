import { z } from "zod";
import { eq, desc, and, or, gte, lte, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, barbers, services, packages, users, barberSchedules } from "@db/schema";

export const bookingRouter = createRouter({
  // List bookings with filters (admin)
  list: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        barberId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.status) {
        conditions.push(eq(bookings.status, input.status));
      }
      if (input?.dateFrom) {
        conditions.push(gte(bookings.bookingDate, input.dateFrom));
      }
      if (input?.dateTo) {
        conditions.push(lte(bookings.bookingDate, input.dateTo));
      }
      if (input?.barberId) {
        conditions.push(eq(bookings.barberId, input.barberId));
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      const result = await db.query.bookings.findMany({
        where,
        orderBy: [desc(bookings.createdAt)],
        limit: input?.limit,
        offset: input?.offset,
      });
      
      // Enrich with user, barber, service info
      const enriched = await Promise.all(
        result.map(async (booking) => {
          const user = booking.userId ? await db.query.users.findFirst({
            where: eq(users.id, booking.userId),
          }) : null;
          const barber = booking.barberId ? await db.query.barbers.findFirst({
            where: eq(barbers.id, booking.barberId),
          }) : null;
          const service = booking.serviceId ? await db.query.services.findFirst({
            where: eq(services.id, booking.serviceId),
          }) : null;
          const pkg = booking.packageId ? await db.query.packages.findFirst({
            where: eq(packages.id, booking.packageId),
          }) : null;
          
          return { ...booking, user, barber, service, package: pkg };
        })
      );
      
      return enriched;
    }),

  // Get my bookings (authenticated)
  myBookings: authedQuery
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const conditions = [eq(bookings.userId, ctx.user.id)];
      if (input?.status) conditions.push(eq(bookings.status, input.status));
      
      const result = await db.query.bookings.findMany({
        where: and(...conditions),
        orderBy: [desc(bookings.createdAt)],
      });
      
      const enriched = await Promise.all(
        result.map(async (booking) => {
          const barber = booking.barberId ? await db.query.barbers.findFirst({ where: eq(barbers.id, booking.barberId) }) : null;
          const service = booking.serviceId ? await db.query.services.findFirst({ where: eq(services.id, booking.serviceId) }) : null;
          const pkg = booking.packageId ? await db.query.packages.findFirst({ where: eq(packages.id, booking.packageId) }) : null;
          return { ...booking, barber, service, package: pkg };
        })
      );
      return enriched;
    }),

  // Get single booking
  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      
      if (!booking) throw new Error("Booking not found");
      
      const user = booking.userId ? await db.query.users.findFirst({
        where: eq(users.id, booking.userId),
      }) : null;
      const barber = booking.barberId ? await db.query.barbers.findFirst({
        where: eq(barbers.id, booking.barberId),
      }) : null;
      const service = booking.serviceId ? await db.query.services.findFirst({
        where: eq(services.id, booking.serviceId),
      }) : null;
      const pkg = booking.packageId ? await db.query.packages.findFirst({
        where: eq(packages.id, booking.packageId),
      }) : null;
      
      return { ...booking, user, barber, service, package: pkg };
    }),

  // Create booking (public - can be guest)
  create: publicQuery
    .input(
      z.object({
        userId: z.number().optional(),
        barberId: z.number().optional(),
        serviceId: z.number().optional(),
        packageId: z.number().optional(),
        bookingDate: z.string(),
        bookingTime: z.string(),
        duration: z.number().min(5),
        totalAmount: z.string(),
        notes: z.string().optional(),
        isHomeService: z.boolean().default(false),
        homeAddress: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      // Auto-assign barber if not specified
      let barberId = input.barberId;
      if (!barberId) {
        const dayOfWeek = new Date(input.bookingDate).getDay();
        const availableBarbers = await db.query.barbers.findMany({
          where: and(eq(barbers.isActive, true)),
        });
        for (const b of availableBarbers) {
          const schedule = await db.query.barberSchedules.findFirst({
            where: and(eq(barberSchedules.barberId, b.id), eq(barberSchedules.dayOfWeek, dayOfWeek)),
          });
          if (schedule && !schedule.isDayOff) {
            barberId = b.id;
            break;
          }
        }
        if (!barberId) throw new Error("لا يوجد حلاق متاح في هذا اليوم");
      }
      
      // Generate OTP
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      const bookingData = {
        userId: input.userId,
        barberId,
        serviceId: input.serviceId,
        packageId: input.packageId,
        bookingDate: input.bookingDate,
        bookingTime: input.bookingTime,
        duration: input.duration,
        totalAmount: parseFloat(input.totalAmount),
        notes: input.notes ? (input.customerName ? `العميل: ${input.customerName}${input.customerPhone ? ` - ${input.customerPhone}` : ""}\n${input.notes}` : input.notes) : input.customerName ? `العميل: ${input.customerName}${input.customerPhone ? ` - ${input.customerPhone}` : ""}` : undefined,
        isHomeService: input.isHomeService,
        homeAddress: input.homeAddress,
        otpCode,
        otpVerified: false,
        status: "pending" as const,
        paymentStatus: "pending" as const,
      };
      
      const result = await db.insert(bookings).values(bookingData);
      
      return { 
        id: Number(result[0].insertId), 
        ...input, 
        barberId,
        otpCode,
        status: "pending" as const,
      };
    }),

  // Update booking status (admin)
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
        cancellationReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(bookings).set(data).where(eq(bookings.id, id));
      return { success: true };
    }),

  // Confirm booking (admin)
  confirm: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(bookings)
        .set({ status: "confirmed" })
        .where(eq(bookings.id, input.id));
      return { success: true };
    }),

  // Complete booking (admin or barber)
  complete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(bookings)
        .set({ status: "completed" })
        .where(eq(bookings.id, input.id));
      return { success: true };
    }),

  // Cancel booking (public)
  cancel: publicQuery
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(bookings)
        .set({ 
          status: "cancelled", 
          cancellationReason: input.reason || "Cancelled by user" 
        })
        .where(eq(bookings.id, input.id));
      return { success: true };
    }),

  // Verify OTP
  verifyOtp: publicQuery
    .input(
      z.object({
        id: z.number(),
        otpCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      
      if (!booking) throw new Error("Booking not found");
      if (booking.otpCode !== input.otpCode) throw new Error("Invalid OTP");
      
      await db.update(bookings)
        .set({ otpVerified: true })
        .where(eq(bookings.id, input.id));
      
      return { success: true };
    }),

  // Get dashboard stats
  stats: adminQuery.query(async () => {
    const db = getDb();
    
    const totalBookings = await db.select({ count: sql<number>`count(*)` }).from(bookings);
    const todayBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(sql`DATE(booking_date) = CURDATE()`);
    const pendingBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, "pending"));
    const completedBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, "completed"));
    
    return {
      total: totalBookings[0]?.count ?? 0,
      today: todayBookings[0]?.count ?? 0,
      pending: pendingBookings[0]?.count ?? 0,
      completed: completedBookings[0]?.count ?? 0,
    };
  }),

  // Get available time slots
  getTimeSlots: publicQuery
    .input(
      z.object({
        barberId: z.number().optional(),
        date: z.string(),
        duration: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const dayOfWeek = new Date(input.date).getDay();
      
      if (input.barberId) {
        return getSlotsForBarber(db, input.barberId, input.date, dayOfWeek);
      }
      
      // No barber specified: return slots for all barbers
      const allBarbers = await db.query.barbers.findMany({
        where: eq(barbers.isActive, true),
      });
      const allSlots = new Set<string>();
      for (const b of allBarbers) {
        const slots = await getSlotsForBarber(db, b.id, input.date, dayOfWeek);
        slots.forEach((s) => allSlots.add(s));
      }
      return [...allSlots].sort();
    }),
});

async function getSlotsForBarber(db: any, barberId: number, date: string, dayOfWeek: number) {
  const schedule = await db.query.barberSchedules.findFirst({
    where: and(eq(barberSchedules.barberId, barberId), eq(barberSchedules.dayOfWeek, dayOfWeek)),
  });
  if (!schedule || schedule.isDayOff) return [];

  const existingBookings = await db.query.bookings.findMany({
    where: and(eq(bookings.barberId, barberId), eq(bookings.bookingDate, date), or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending"))),
  });

  const slots: string[] = [];
  const start = new Date(`2000-01-01T${schedule.startTime}`);
  const end = new Date(`2000-01-01T${schedule.endTime}`);

  for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 30)) {
    const timeStr = t.toTimeString().slice(0, 5);
    const isBooked = existingBookings.some((b: any) => {
      const bookingStart = new Date(`2000-01-01T${b.bookingTime}`);
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setMinutes(bookingEnd.getMinutes() + (b.duration || 30));
      const slotTime = new Date(`2000-01-01T${timeStr}`);
      return slotTime >= bookingStart && slotTime < bookingEnd;
    });
    if (!isBooked) slots.push(timeStr);
  }
  return slots;
}
