import { authRouter } from "./auth-router";
import { barberRouter } from "./barber-router";
import { serviceRouter } from "./service-router";
import { packageRouter } from "./package-router";
import { bookingRouter } from "./booking-router";
import { reviewRouter } from "./review-router";
import { productRouter } from "./product-router";
import { orderRouter } from "./order-router";
import { paymentRouter } from "./payment-router";
import { offerRouter } from "./offer-router";
import { loyaltyRouter } from "./loyalty-router";
import { notificationRouter } from "./notification-router";
import { chatRouter } from "./chat-router";
import { salonRouter } from "./salon-router";
import { adminRouter } from "./admin-router";
import { barberDashboardRouter } from "./barber-dashboard-router";
import { uploadRouter } from "./upload-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  barber: barberRouter,
  barberDashboard: barberDashboardRouter,
  upload: uploadRouter,
  service: serviceRouter,
  package: packageRouter,
  booking: bookingRouter,
  review: reviewRouter,
  product: productRouter,
  order: orderRouter,
  payment: paymentRouter,
  offer: offerRouter,
  loyalty: loyaltyRouter,
  notification: notificationRouter,
  chat: chatRouter,
  salon: salonRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
