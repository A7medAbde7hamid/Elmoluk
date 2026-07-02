import { authRouter } from "./auth-router.js";
import { barberRouter } from "./barber-router.js";
import { serviceRouter } from "./service-router.js";
import { packageRouter } from "./package-router.js";
import { bookingRouter } from "./booking-router.js";
import { reviewRouter } from "./review-router.js";
import { productRouter } from "./product-router.js";
import { orderRouter } from "./order-router.js";
import { paymentRouter } from "./payment-router.js";
import { offerRouter } from "./offer-router.js";
import { loyaltyRouter } from "./loyalty-router.js";
import { notificationRouter } from "./notification-router.js";
import { salonRouter } from "./salon-router.js";
import { adminRouter } from "./admin-router.js";
import { barberDashboardRouter } from "./barber-dashboard-router.js";
import { uploadRouter } from "./upload-router.js";
import { createRouter, publicQuery } from "./middleware.js";

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
  salon: salonRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
