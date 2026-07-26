import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { reviews, barbers, bookings } from "../../db/schema.js";

export const reviewRouter = createRouter({
  // List reviews for a barber
  listByBarber: publicQuery
    .input(
      z.object({
        barberId: z.number(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.reviews.findMany({
        where: and(
          eq(reviews.barberId, input.barberId),
          eq(reviews.isVisible, true)
        ),
        orderBy: [desc(reviews.createdAt)],
        limit: input.limit,
      });
    }),

  // Create review (authenticated user)
  create: authedQuery
    .input(
      z.object({
        bookingId: z.number(),
        barberId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Verify booking exists and belongs to user
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
      });
      
      if (!booking) throw new Error("Booking not found");
      if (booking.userId !== ctx.user.id) throw new Error("Unauthorized");

      // Prevent duplicate reviews for the same booking
      const existingReview = await db.query.reviews.findFirst({
        where: and(eq(reviews.bookingId, input.bookingId), eq(reviews.userId, ctx.user.id)),
      });
      if (existingReview) throw new Error("You have already reviewed this booking");
      
      // Use the barberId from the booking, not client-supplied
      const barberId = booking.barberId;
      
      const result = await db.insert(reviews).values({
        bookingId: input.bookingId,
        barberId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment,
        image: input.image,
      });
      
      // Update barber rating
      const barberReviews = await db.query.reviews.findMany({
        where: eq(reviews.barberId, barberId),
      });
      
      const avgRating = barberReviews.reduce((sum, r) => sum + r.rating, 0) / barberReviews.length;
      
      await db.update(barbers)
        .set({ 
          rating: parseFloat(avgRating.toFixed(2)),
          totalReviews: barberReviews.length 
        })
        .where(eq(barbers.id, barberId));
      
      return { id: Number(result[0].insertId), ...input };
    }),

  // Toggle review visibility (admin)
  toggleVisibility: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, input.id),
      });
      
      if (!review) throw new Error("Review not found");
      
      await db.update(reviews)
        .set({ isVisible: !review.isVisible })
        .where(eq(reviews.id, input.id));
      
      return { success: true };
    }),

  // List all reviews (admin)
  list: adminQuery
    .input(
      z.object({
        isVisible: z.boolean().optional(),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.isVisible !== undefined 
        ? eq(reviews.isVisible, input.isVisible) 
        : undefined;
      
      return db.query.reviews.findMany({
        where,
        orderBy: [desc(reviews.createdAt)],
        limit: input?.limit,
      });
    }),
});
