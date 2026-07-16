import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, or, gte, lte, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { bookings, barbers, services, packages, users, barberSchedules, loyaltyPoints } from "@db/schema";
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
      const bookingId = Number(result[0].insertId);
      
      // Notify via WhatsApp
      if (input.customerPhone) {
        const msg = `مرحباً ${input.customerName || "عميلنا العزيز"} 👋\nتم استلام حجزك في صالون الملوك ✅\nالتاريخ: ${input.bookingDate}\nالوقت: ${input.bookingTime}\nكود التحقق: ${otpCode}\nسيتم تأكيد الحجز قريباً.`;
        sendWhatsAppMessage(input.customerPhone, msg);
      }
      
      return { 
        id: bookingId, 
        barberId,
        serviceId: input.serviceId,
        packageId: input.packageId,
        bookingDate: input.bookingDate,
        bookingTime: input.bookingTime,
        duration: input.duration,
        totalAmount: input.totalAmount,
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

  // Verify OTP (rate-limited: max 3 failed attempts)
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
      if (booking.otpVerified) throw new Error("OTP already verified");
      if ((booking.otpAttempts ?? 0) >= 3) throw new Error("تم تجاوز الحد الأقصى لمحاولات التحقق");
      
      if (booking.otpCode !== input.otpCode) {
        await db.update(bookings)
          .set({ otpAttempts: (booking.otpAttempts ?? 0) + 1 })
          .where(eq(bookings.id, input.id));
        throw new Error("رمز التحقق غير صحيح");
      }
      
      await db.update(bookings)
        .set({ otpVerified: true, otpAttempts: 0 })
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
      
      // Auto-seed barber schedules if any barber is missing them
      const allBarbers = await db.query.barbers.findMany({
        where: eq(barbers.isActive, true),
      });
      for (const barber of allBarbers) {
        const existing = await db.query.barberSchedules.findFirst({
          where: eq(barberSchedules.barberId, barber.id),
        });
        if (!existing) {
          for (let day = 0; day < 7; day++) {
            if (day === 5) continue;
            await db.insert(barberSchedules).values({
              barberId: barber.id,
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "21:00",
              isDayOff: false,
            });
          }
        }
      }
      
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
