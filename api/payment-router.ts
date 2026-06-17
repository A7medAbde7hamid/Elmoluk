import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, adminQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, wallets, walletTransactions, bookings, orders } from "@db/schema";

export const paymentRouter = createRouter({
  // List payments (admin)
  list: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.status ? eq(payments.status, input.status) : undefined;
      
      return db.query.payments.findMany({
        where,
        orderBy: [desc(payments.createdAt)],
        limit: input?.limit,
      });
    }),

  // Get user's payments
  myPayments: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.payments.findMany({
      where: eq(payments.userId, ctx.user.id),
      orderBy: [desc(payments.createdAt)],
    });
  }),

  // Create payment
  create: authedQuery
    .input(
      z.object({
        bookingId: z.number().optional(),
        orderId: z.number().optional(),
        amount: z.string(),
        paymentMethod: z.enum(["cash", "card", "paypal", "vodafone_cash", "apple_pay", "wallet"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      const result = await db.insert(payments).values({
        ...input,
        userId: ctx.user.id,
        status: "pending",
        amount: parseFloat(input.amount),
      });
      
      return { id: Number(result[0].insertId), ...input };
    }),

  // Update payment status (admin)
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "failed", "refunded"]),
        transactionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      
      await db.update(payments).set(data).where(eq(payments.id, id));
      
      // Update related booking/order payment status
      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, id),
      });
      
      if (payment?.bookingId) {
        const paymentStatus = input.status === "completed" ? "paid" : input.status === "refunded" ? "refunded" : "pending";
        await db.update(bookings)
          .set({ paymentStatus })
          .where(eq(bookings.id, payment.bookingId));
      }
      
      if (payment?.orderId) {
        const paymentStatus = input.status === "completed" ? "paid" : input.status === "refunded" ? "refunded" : "pending";
        await db.update(orders)
          .set({ paymentStatus })
          .where(eq(orders.id, payment.orderId));
      }
      
      return { success: true };
    }),

  // Wallet operations
  getWallet: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.wallets.findFirst({
      where: eq(wallets.userId, ctx.user.id),
    });
  }),

  // Add to wallet (admin only)
  addToWallet: adminQuery
    .input(
      z.object({
        userId: z.number(),
        amount: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      let wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, input.userId),
      });
      
      const parsedAmount = parseFloat(input.amount);
      
      if (!wallet) {
        const result = await db.insert(wallets).values({
          userId: input.userId,
          balance: parsedAmount,
        });
        wallet = await db.query.wallets.findFirst({
          where: eq(wallets.id, Number(result[0].insertId)),
        });
      } else {
        const newBalance = Number(wallet.balance) + parsedAmount;
        await db.update(wallets)
          .set({ balance: newBalance })
          .where(eq(wallets.id, wallet.id));
      }
      
      if (wallet) {
        await db.insert(walletTransactions).values({
          walletId: wallet.id,
          type: "credit",
          amount: parsedAmount,
          description: input.description || "Wallet credit",
        });
      }
      
      return { success: true, balance: wallet?.balance ?? "0" };
    }),

  // Get payment stats
  stats: adminQuery.query(async () => {
    const db = getDb();
    
    const totalRevenue = await db.select({ 
      total: sql<string>`COALESCE(SUM(amount), 0)` 
    })
    .from(payments)
    .where(eq(payments.status, "completed"));
    
    const todayRevenue = await db.select({ 
      total: sql<string>`COALESCE(SUM(amount), 0)` 
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        sql`DATE(created_at) = CURDATE()`
      )
    );
    
    const pendingPayments = await db.select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, "pending"));
    
    return {
      totalRevenue: totalRevenue[0]?.total ?? "0",
      todayRevenue: todayRevenue[0]?.total ?? "0",
      pendingPayments: pendingPayments[0]?.count ?? 0,
    };
  }),
});
