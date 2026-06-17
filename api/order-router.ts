import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, adminQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems, products } from "@db/schema";

export const orderRouter = createRouter({
  // List orders (admin)
  list: adminQuery
    .input(
      z.object({
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
        limit: z.number().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.status ? eq(orders.status, input.status) : undefined;
      
      return db.query.orders.findMany({
        where,
        orderBy: [desc(orders.createdAt)],
        limit: input?.limit,
      });
    }),

  // Get user's orders
  myOrders: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.orders.findMany({
      where: eq(orders.userId, ctx.user.id),
      orderBy: [desc(orders.createdAt)],
    });
  }),

  // Get order by ID with items
  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, input.id),
      });
      
      if (!order) throw new Error("Order not found");
      
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, input.id),
      });
      
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const product = await db.query.products.findFirst({
            where: eq(products.id, item.productId),
          });
          return { ...item, product };
        })
      );
      
      return { ...order, items: enrichedItems };
    }),

  // Create order
  create: authedQuery
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().min(1),
            unitPrice: z.string(),
          })
        ).min(1),
        shippingAddress: z.string().optional(),
        totalAmount: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Check stock for all items first
      for (const item of input.items) {
        const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
        if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`);
        if (product.stock < item.quantity) throw new Error(`المنتج "${product.name}" غير متوفر بالكمية المطلوبة (المتوفر: ${product.stock})`);
      }
      
      const result = await db.insert(orders).values({
        userId: ctx.user.id,
        totalAmount: parseFloat(input.totalAmount),
        shippingAddress: input.shippingAddress,
        status: "pending",
        paymentStatus: "pending",
      });
      
      const orderId = Number(result[0].insertId);
      
      for (const item of input.items) {
        const unitPrice = parseFloat(item.unitPrice);
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
        // Decrement stock
        await db.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(eq(products.id, item.productId));
      }
      
      return { id: orderId, ...input };
    }),

  // Update order status (admin)
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true };
    }),
});
