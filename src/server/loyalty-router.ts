import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, adminQuery, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { loyaltyPoints } from "@db/schema";

export const loyaltyRouter = createRouter({
  // Get user's points
  myPoints: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    const points = await db.query.loyaltyPoints.findMany({
      where: eq(loyaltyPoints.userId, ctx.user.id),
      orderBy: [desc(loyaltyPoints.createdAt)],
    });
    
    const earned = points
      .filter((p) => p.type === "earned")
      .reduce((sum, p) => sum + p.points, 0);
    const redeemed = points
      .filter((p) => p.type === "redeemed")
      .reduce((sum, p) => sum + p.points, 0);
    
    return {
      total: earned - redeemed,
      earned,
      redeemed,
      history: points,
    };
  }),

  // Add points (admin)
  addPoints: adminQuery
    .input(
      z.object({
        userId: z.number(),
        points: z.number().positive(),
        description: z.string().optional(),
        bookingId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      await db.insert(loyaltyPoints).values({
        ...input,
        type: "earned",
      });
      
      return { success: true };
    }),

  // Redeem points
  redeemPoints: authedQuery
    .input(
      z.object({
        points: z.number().positive(),
        description: z.string().optional(),
        bookingId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Check available points
      const points = await db.query.loyaltyPoints.findMany({
        where: eq(loyaltyPoints.userId, ctx.user.id),
      });
      
      const earned = points
        .filter((p) => p.type === "earned")
        .reduce((sum, p) => sum + p.points, 0);
      const redeemed = points
        .filter((p) => p.type === "redeemed")
        .reduce((sum, p) => sum + p.points, 0);
      
      const available = earned - redeemed;
      
      if (available < input.points) {
        throw new Error(`رصيد غير كاف. النقاط المتاحة: ${available}`);
      }
      
      await db.insert(loyaltyPoints).values({
        userId: ctx.user.id,
        points: input.points,
        type: "redeemed",
        description: input.description || "نقاط مستبدلة",
        bookingId: input.bookingId,
      });
      
      return { success: true, remaining: available - input.points };
    }),

  // Get loyalty stats (admin)
  stats: adminQuery.query(async () => {
    const db = getDb();
    
    const totalEarned = await db.select({
      total: sql<number>`COALESCE(SUM(CASE WHEN type = 'earned' THEN points ELSE 0 END), 0)`,
    }).from(loyaltyPoints);
    
    const totalRedeemed = await db.select({
      total: sql<number>`COALESCE(SUM(CASE WHEN type = 'redeemed' THEN points ELSE 0 END), 0)`,
    }).from(loyaltyPoints);
    
    return {
      totalEarned: totalEarned[0]?.total ?? 0,
      totalRedeemed: totalRedeemed[0]?.total ?? 0,
      active: (totalEarned[0]?.total ?? 0) - (totalRedeemed[0]?.total ?? 0),
    };
  }),
});
