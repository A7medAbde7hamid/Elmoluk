import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, or, gte, lte, sql, inArray } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery, rateLimitedPublicQuery } from "./middleware.js";
import { getDb, getPool } from "./queries/connection.js";
import { bookings, barbers, services, packages, users, barberSchedules, loyaltyPoints } from "../../db/schema.js";
import { sendWhatsAppMessage } from "./lib/notifications.js";

export const bookingRouter = createRouter({
  // List bookings with filters (admin)
  list: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        barberId: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
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
      
      // Batch-enrich with user, barber, service info (4 queries total, not 4N)
      const enriched = await enrichBookings(db, result, { includeUser: true });
      
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
      
      const enriched = await enrichBookings(db, result);
      return enriched;
    }),

  // Get single booking (owner or admin)
  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "الحجز غير موجود" });
      if (booking.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية" });
      }
      
      return enrichBooking(db, booking, { includeUser: true });
    }),

  // Create booking (public - can be guest, rate-limited)
  create: rateLimitedPublicQuery
    .input(
      z.object({
        userId: z.number().optional(), // Deprecated: kept for backward compat, ignored in favor of ctx.user
        barberId: z.number().optional(),
        serviceId: z.number().optional(),
        packageId: z.number().optional(),
        bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        bookingTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
        duration: z.number().min(5).max(480),
        totalAmount: z.string(), // Deprecated: server calculates from service
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
      
      // Server-side price calculation: fetch service price instead of trusting client
      let serverAmount = 0;
      if (input.serviceId) {
        const svc = await db.query.services.findFirst({ where: eq(services.id, input.serviceId) });
        if (svc) serverAmount = Number(svc.price);
      }
      
      // Auto-assign barber if not specified
      let barberId = input.barberId;
      if (!barberId) {
        const [y, m, d] = input.bookingDate.split("-").map(Number);
        const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
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
      
      // Calculate queue number for the day
      const [countRows] = await getPool().execute(
        "SELECT COUNT(*) as cnt FROM bookings WHERE booking_date = ?",
        [input.bookingDate]
      );
      const count = Number((countRows as any[])[0]?.cnt || 0);
      const queueNumber = count + 1;
      
      const notes = input.notes
        ? (input.customerName ? `العميل: ${input.customerName}${input.customerPhone ? ` - ${input.customerPhone}` : ""}\n${input.notes}` : input.notes)
        : input.customerName
          ? `العميل: ${input.customerName}${input.customerPhone ? ` - ${input.customerPhone}` : ""}`
          : null;
      
      const [insertResult] = await getPool().execute(
        "INSERT INTO bookings (barber_id, service_id, booking_date, booking_time, queue_number, duration, status, payment_status, total_amount, notes, is_home_service) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [barberId, input.serviceId || null, input.bookingDate, input.bookingTime || "00:00", queueNumber, input.duration, "pending", "pending", serverAmount, notes, input.isHomeService]
      );
      const bookingId = Number((insertResult as any).insertId);
      
      // Notify via WhatsApp
      if (input.customerPhone) {
        const msg = `مرحباً ${input.customerName || "عميلنا العزيز"} 👋\nتم حجزك في صالون الملوك ✅\nالتاريخ: ${input.bookingDate}\nدور رقم: ${queueNumber}\nفي انتظارك 🤝`;
        sendWhatsAppMessage(input.customerPhone, msg);
      }
      
      return { 
        id: bookingId, 
        barberId,
        serviceId: input.serviceId,
        packageId: input.packageId,
        bookingDate: input.bookingDate,
        queueNumber,
        duration: input.duration,
        totalAmount: String(serverAmount),
        notes: input.notes,
        isHomeService: input.isHomeService,
        homeAddress: input.homeAddress,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
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
      
      // Auto-accrue loyalty points when booking is completed
      if (input.status === "completed") {
        const booking = await db.query.bookings.findFirst({
          where: eq(bookings.id, input.id),
        });
        if (booking) {
          if (booking.userId && booking.totalAmount > 0) {
            await db.insert(loyaltyPoints).values({
              userId: booking.userId,
              points: Math.floor(booking.totalAmount),
              type: "earned",
              description: "نقاط مكتسبة من الحجز",
              bookingId: booking.id,
            });
          }
          const phone = await getBookingPhone(db, booking);
          if (phone) {
            sendWhatsAppMessage(phone, `شكراً لحجزك في صالون الملوك 🎉\nنتمنى أن تكون خدمتنا على مستوى توقعاتك.\nننتظرك في زيارتك القادمة 👑`);
          }
        }
      }
      
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
      
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      if (booking) {
        const phone = await getBookingPhone(db, booking);
        if (phone) {
          sendWhatsAppMessage(phone, `تم تأكيد حجزك في صالون الملوك ✅\nالتاريخ: ${booking.bookingDate}\nالوقت: ${booking.bookingTime}\nننتظرك 🤝`);
        }
      }
      
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
      
      // Auto-accrue loyalty points
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      if (booking?.userId && booking.totalAmount > 0) {
        await db.insert(loyaltyPoints).values({
          userId: booking.userId,
          points: Math.floor(booking.totalAmount),
          type: "earned",
          description: "نقاط مكتسبة من الحجز",
          bookingId: booking.id,
        });
      }
      
      if (booking) {
        const phone = await getBookingPhone(db, booking);
        if (phone) {
          sendWhatsAppMessage(phone, `شكراً لحجزك في صالون الملوك 🎉\nنتمنى أن تكون خدمتنا على مستوى توقعاتك.\nتم إضافة ${Math.floor(booking.totalAmount)} نقطة ولاء إلى رصيدك.\nننتظرك في زيارتك القادمة 👑`);
        }
      }
      
      return { success: true };
    }),

  // Cancel booking (owner or admin)
  cancel: authedQuery
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "الحجز غير موجود" });
      if (booking.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية لإلغاء هذا الحجز" });
      }
      await db.update(bookings)
        .set({ 
          status: "cancelled", 
          cancellationReason: input.reason || "إلغاء بواسطة المستخدم" 
        })
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
      const [y, m, d] = input.date.split("-").map(Number);
      const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      
      const allBarbers = await db.query.barbers.findMany({
        where: eq(barbers.isActive, true),
      });
      
      if (input.barberId) {
        return getSlotsForBarber(db, input.barberId, input.date, dayOfWeek);
      }
      
      const allSlots = new Set<string>();
      for (const b of allBarbers) {
        const slots = await getSlotsForBarber(db, b.id, input.date, dayOfWeek);
        slots.forEach((s) => allSlots.add(s));
      }
      return [...allSlots].sort();
    }),
});

function getMinutes(time: string): number {
  const [h, mn] = time.split(":").map(Number);
  return h * 60 + mn;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const mn = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

async function getSlotsForBarber(db: ReturnType<typeof getDb>, barberId: number, date: string, dayOfWeek: number) {
  const schedule = await db.query.barberSchedules.findFirst({
    where: and(eq(barberSchedules.barberId, barberId), eq(barberSchedules.dayOfWeek, dayOfWeek)),
  });
  if (!schedule || schedule.isDayOff) return [];

  const existingBookings = await db.query.bookings.findMany({
    where: and(eq(bookings.barberId, barberId), eq(bookings.bookingDate, date), or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending"))),
  });

  const slots: string[] = [];
  const start = getMinutes(schedule.startTime);
  const end = getMinutes(schedule.endTime);

  for (let m = start; m < end; m += 30) {
    const timeStr = formatTime(m);
    const isBooked = existingBookings.some((b) => {
      const bStart = getMinutes(b.bookingTime);
      const bEnd = bStart + (b.duration || 30);
      return m >= bStart && m < bEnd;
    });
    if (!isBooked) slots.push(timeStr);
  }
  return slots;
}

async function getBookingPhone(db: ReturnType<typeof getDb>, booking: typeof bookings.$inferSelect): Promise<string | null> {
  if (booking.notes) {
    const match = booking.notes.match(/01\d{9}/);
    if (match) return match[0];
  }
  if (booking.userId) {
    const user = await db.query.users.findFirst({ where: eq(users.id, booking.userId) });
    if (user?.phone) return user.phone;
  }
  return null;
}

async function enrichBooking(
  db: ReturnType<typeof getDb>,
  booking: typeof bookings.$inferSelect,
  opts?: { includeUser?: boolean }
) {
  const [barber, service, pkg] = await Promise.all([
    booking.barberId ? db.query.barbers.findFirst({ where: eq(barbers.id, booking.barberId) }) : Promise.resolve(null),
    booking.serviceId ? db.query.services.findFirst({ where: eq(services.id, booking.serviceId) }) : Promise.resolve(null),
    booking.packageId ? db.query.packages.findFirst({ where: eq(packages.id, booking.packageId) }) : Promise.resolve(null),
  ]);
  const user = opts?.includeUser && booking.userId
    ? await db.query.users.findFirst({ where: eq(users.id, booking.userId) })
    : null;
  return { ...booking, user, barber, service, package: pkg };
}

async function enrichBookings(
  db: ReturnType<typeof getDb>,
  bookingList: typeof bookings.$inferSelect[],
  opts?: { includeUser?: boolean }
) {
  const barberIds = [...new Set(bookingList.map((b) => b.barberId).filter(Boolean) as number[])];
  const serviceIds = [...new Set(bookingList.map((b) => b.serviceId).filter(Boolean) as number[])];
  const packageIds = [...new Set(bookingList.map((b) => b.packageId).filter(Boolean) as number[])];
  const userIds = opts?.includeUser ? [...new Set(bookingList.map((b) => b.userId).filter(Boolean) as number[])] : [];

  const [barberList, serviceList, packageList, userList] = await Promise.all([
    barberIds.length ? db.query.barbers.findMany({ where: inArray(barbers.id, barberIds) }) : Promise.resolve([]),
    serviceIds.length ? db.query.services.findMany({ where: inArray(services.id, serviceIds) }) : Promise.resolve([]),
    packageIds.length ? db.query.packages.findMany({ where: inArray(packages.id, packageIds) }) : Promise.resolve([]),
    userIds.length ? db.query.users.findMany({ where: inArray(users.id, userIds) }) : Promise.resolve([]),
  ]);

  const barberMap = new Map(barberList.map((b) => [b.id, b]));
  const serviceMap = new Map(serviceList.map((s) => [s.id, s]));
  const packageMap = new Map(packageList.map((p) => [p.id, p]));
  const userMap = new Map(userList.map((u) => [u.id, u]));

  return bookingList.map((booking) => ({
    ...booking,
    barber: booking.barberId ? barberMap.get(booking.barberId) ?? null : null,
    service: booking.serviceId ? serviceMap.get(booking.serviceId) ?? null : null,
    package: booking.packageId ? packageMap.get(booking.packageId) ?? null : null,
    user: opts?.includeUser && booking.userId ? userMap.get(booking.userId) ?? null : null,
  }));
}
