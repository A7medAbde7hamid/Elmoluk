import { relations } from "drizzle-orm";
import * as schema from "./schema.js";

export const usersRelations = relations(schema.users, ({ many, one }) => ({
  bookings: many(schema.bookings),
  reviews: many(schema.reviews),
  orders: many(schema.orders),
  wallet: one(schema.wallets),
  loyaltyPoints: many(schema.loyaltyPoints),
  notifications: many(schema.notifications),
  chatMessages: many(schema.chatMessages),
  affiliates: many(schema.affiliates),
}));

export const barbersRelations = relations(schema.barbers, ({ many }) => ({
  schedules: many(schema.barberSchedules),
  bookings: many(schema.bookings),
  reviews: many(schema.reviews),
}));

export const barberSchedulesRelations = relations(schema.barberSchedules, ({ one }) => ({
  barber: one(schema.barbers, {
    fields: [schema.barberSchedules.barberId],
    references: [schema.barbers.id],
  }),
}));

export const servicesRelations = relations(schema.services, ({ many }) => ({
  packageServices: many(schema.packageServices),
  bookings: many(schema.bookings),
}));

export const packagesRelations = relations(schema.packages, ({ many }) => ({
  packageServices: many(schema.packageServices),
  bookings: many(schema.bookings),
}));

export const packageServicesRelations = relations(schema.packageServices, ({ one }) => ({
  package: one(schema.packages, {
    fields: [schema.packageServices.packageId],
    references: [schema.packages.id],
  }),
  service: one(schema.services, {
    fields: [schema.packageServices.serviceId],
    references: [schema.services.id],
  }),
}));

export const bookingsRelations = relations(schema.bookings, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.bookings.userId],
    references: [schema.users.id],
  }),
  barber: one(schema.barbers, {
    fields: [schema.bookings.barberId],
    references: [schema.barbers.id],
  }),
  service: one(schema.services, {
    fields: [schema.bookings.serviceId],
    references: [schema.services.id],
  }),
  package: one(schema.packages, {
    fields: [schema.bookings.packageId],
    references: [schema.packages.id],
  }),
  payments: many(schema.payments),
  reviews: many(schema.reviews),
}));

export const reviewsRelations = relations(schema.reviews, ({ one }) => ({
  booking: one(schema.bookings, {
    fields: [schema.reviews.bookingId],
    references: [schema.bookings.id],
  }),
  user: one(schema.users, {
    fields: [schema.reviews.userId],
    references: [schema.users.id],
  }),
  barber: one(schema.barbers, {
    fields: [schema.reviews.barberId],
    references: [schema.barbers.id],
  }),
}));

export const productsRelations = relations(schema.products, ({ many }) => ({
  orderItems: many(schema.orderItems),
}));

export const ordersRelations = relations(schema.orders, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.orders.userId],
    references: [schema.users.id],
  }),
  items: many(schema.orderItems),
  payments: many(schema.payments),
}));

export const orderItemsRelations = relations(schema.orderItems, ({ one }) => ({
  order: one(schema.orders, {
    fields: [schema.orderItems.orderId],
    references: [schema.orders.id],
  }),
  product: one(schema.products, {
    fields: [schema.orderItems.productId],
    references: [schema.products.id],
  }),
}));

export const paymentsRelations = relations(schema.payments, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.payments.userId],
    references: [schema.users.id],
  }),
  booking: one(schema.bookings, {
    fields: [schema.payments.bookingId],
    references: [schema.bookings.id],
  }),
  order: one(schema.orders, {
    fields: [schema.payments.orderId],
    references: [schema.orders.id],
  }),
}));

export const walletsRelations = relations(schema.wallets, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.wallets.userId],
    references: [schema.users.id],
  }),
  transactions: many(schema.walletTransactions),
}));

export const walletTransactionsRelations = relations(schema.walletTransactions, ({ one }) => ({
  wallet: one(schema.wallets, {
    fields: [schema.walletTransactions.walletId],
    references: [schema.wallets.id],
  }),
}));

export const loyaltyPointsRelations = relations(schema.loyaltyPoints, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.loyaltyPoints.userId],
    references: [schema.users.id],
  }),
  booking: one(schema.bookings, {
    fields: [schema.loyaltyPoints.bookingId],
    references: [schema.bookings.id],
  }),
}));

export const notificationsRelations = relations(schema.notifications, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.notifications.userId],
    references: [schema.users.id],
  }),
}));

export const chatMessagesRelations = relations(schema.chatMessages, ({ one }) => ({
  user: one(schema.users, {
    fields: [schema.chatMessages.userId],
    references: [schema.users.id],
  }),
}));

export const affiliatesRelations = relations(schema.affiliates, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.affiliates.userId],
    references: [schema.users.id],
  }),
  commissions: many(schema.commissions),
}));

export const commissionsRelations = relations(schema.commissions, ({ one }) => ({
  affiliate: one(schema.affiliates, {
    fields: [schema.commissions.affiliateId],
    references: [schema.affiliates.id],
  }),
  booking: one(schema.bookings, {
    fields: [schema.commissions.bookingId],
    references: [schema.bookings.id],
  }),
}));

export const giftVouchersRelations = relations(schema.giftVouchers, ({ one }) => ({
  redeemedByUser: one(schema.users, {
    fields: [schema.giftVouchers.redeemedBy],
    references: [schema.users.id],
  }),
}));
