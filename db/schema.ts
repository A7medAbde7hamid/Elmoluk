import {
  mysqlTable,
  serial,
  text,
  timestamp,
  int,
  double,
  boolean,
  varchar,
} from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("union_id", { length: 255 }).unique(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  password: text("password"),
  email: text("email"),
  avatar: text("avatar"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== BARBERS ====================
export const barbers = mysqlTable("barbers", {
  id: serial("id").primaryKey(),
  userId: int("user_id").unique(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  image: text("image"),
  specialization: text("specialization"),
  bio: text("bio"),
  phone: text("phone"),
  email: text("email"),
  salaryType: varchar("salary_type", { length: 10 }).default("fixed").notNull(),
  salaryAmount: double("salary_amount").default(0).notNull(),
  rating: double("rating").default(5).notNull(),
  totalReviews: int("total_reviews").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = typeof barbers.$inferInsert;

// ==================== BARBER WORK SCHEDULE ====================
export const barberSchedules = mysqlTable("barber_schedules", {
  id: serial("id").primaryKey(),
  barberId: int("barber_id").notNull(),
  dayOfWeek: int("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isDayOff: boolean("is_day_off").default(false).notNull(),
});

export type BarberSchedule = typeof barberSchedules.$inferSelect;

// ==================== SERVICES ====================
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description"),
  image: text("image"),
  price: double("price").notNull(),
  duration: int("duration").notNull(), // in minutes
  category: text("category", { enum: ["haircut", "beard", "skincare", "bath", "other"] }).default("haircut").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isHomeService: boolean("is_home_service").default(false).notNull(),
  homeServiceFee: double("home_service_fee").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ==================== PACKAGES ====================
export const packages = mysqlTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description"),
  image: text("image"),
  originalPrice: double("original_price").notNull(),
  discountedPrice: double("discounted_price").notNull(),
  discountPercent: int("discount_percent").default(0).notNull(),
  duration: int("duration").notNull(), // in minutes
  isActive: boolean("is_active").default(true).notNull(),
  isVip: boolean("is_vip").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// ==================== PACKAGE SERVICES ====================
export const packageServices = mysqlTable("package_services", {
  id: serial("id").primaryKey(),
  packageId: int("package_id").notNull(),
  serviceId: int("service_id").notNull(),
});

export type PackageService = typeof packageServices.$inferSelect;

// ==================== BOOKINGS ====================
export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  barberId: int("barber_id"),
  serviceId: int("service_id"),
  packageId: int("package_id"),
  bookingDate: text("booking_date").notNull(),
  bookingTime: text("booking_time").default("00:00").notNull(),
  queueNumber: int("queue_number").default(0).notNull(),
  duration: int("duration").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled", "no_show"] }).default("pending").notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "refunded", "failed"] }).default("pending").notNull(),
  totalAmount: double("total_amount").notNull(),
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  isHomeService: boolean("is_home_service").default(false).notNull(),
  homeAddress: text("home_address"),
  otpCode: text("otp_code"),
  otpVerified: boolean("otp_verified").default(false).notNull(),
  otpAttempts: int("otp_attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ==================== REVIEWS ====================
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: int("booking_id").notNull(),
  userId: int("user_id").notNull(),
  barberId: int("barber_id").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  image: text("image"),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ==================== PRODUCTS ====================
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description"),
  image: text("image"),
  price: double("price").notNull(),
  stock: int("stock").default(0).notNull(),
  category: text("category").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==================== ORDERS ====================
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  totalAmount: double("total_amount").notNull(),
  status: text("status", { enum: ["pending", "processing", "shipped", "delivered", "cancelled"] }).default("pending").notNull(),
  shippingAddress: text("shipping_address"),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "refunded"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ==================== ORDER ITEMS ====================
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: int("order_id").notNull(),
  productId: int("product_id").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: double("unit_price").notNull(),
  totalPrice: double("total_price").notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ==================== PAYMENTS ====================
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  bookingId: int("booking_id"),
  orderId: int("order_id"),
  amount: double("amount").notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "card", "paypal", "vodafone_cash", "apple_pay", "wallet"] }).default("cash").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed", "refunded"] }).default("pending").notNull(),
  transactionId: text("transaction_id"),
  receiptImage: text("receipt_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==================== WALLET ====================
export const wallets = mysqlTable("wallets", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull().unique(),
  balance: double("balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;

// ==================== WALLET TRANSACTIONS ====================
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: int("wallet_id").notNull(),
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  amount: double("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;

// ==================== OFFERS & COUPONS ====================
export const offers = mysqlTable("offers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type", { enum: ["percentage", "fixed"] }).default("percentage").notNull(),
  discountValue: double("discount_value").notNull(),
  maxDiscount: double("max_discount"),
  minOrderAmount: double("min_order_amount").default(0).notNull(),
  usageLimit: int("usage_limit"),
  usageCount: int("usage_count").default(0).notNull(),
  perUserLimit: int("per_user_limit").default(1).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

// ==================== LOYALTY POINTS ====================
export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  points: int("points").notNull(),
  type: text("type", { enum: ["earned", "redeemed"] }).notNull(),
  description: text("description"),
  bookingId: int("booking_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;

// ==================== NOTIFICATIONS ====================
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["booking", "offer", "system", "reminder"] }).default("system").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ==================== GIFT VOUCHERS ====================
export const giftVouchers = mysqlTable("gift_vouchers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  amount: double("amount").notNull(),
  senderName: text("sender_name"),
  senderEmail: text("sender_email"),
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  message: text("message"),
  isRedeemed: boolean("is_redeemed").default(false).notNull(),
  redeemedBy: int("redeemed_by"),
  expiryDate: text("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GiftVoucher = typeof giftVouchers.$inferSelect;

// ==================== SALON SETTINGS ====================
export const salonSettings = mysqlTable("salon_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SalonSetting = typeof salonSettings.$inferSelect;

// ==================== HOLIDAYS ====================
export const holidays = mysqlTable("holidays", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  name: text("name"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Holiday = typeof holidays.$inferSelect;

// ==================== BRANCHES ====================
export const branches = mysqlTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  mapUrl: text("map_url"),
  isMain: boolean("is_main").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

// ==================== ACTIVITY LOGS ====================
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: int("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;

// ==================== CHAT MESSAGES ====================
export const chatMessages = mysqlTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  message: text("message").notNull(),
  isBot: boolean("is_bot").default(false).notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// ==================== SITE VISITS ====================
export const siteVisits = mysqlTable("site_visits", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});
export type SiteVisit = typeof siteVisits.$inferSelect;

// ==================== AFFILIATES ====================
export const affiliates = mysqlTable("affiliates", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g. promo code
  commissionRate: double("commission_rate").default(10).notNull(), // Percentage
  totalEarnings: double("total_earnings").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Affiliate = typeof affiliates.$inferSelect;

// ==================== COMMISSIONS ====================
export const commissions = mysqlTable("commissions", {
  id: serial("id").primaryKey(),
  affiliateId: int("affiliate_id").notNull(),
  bookingId: int("booking_id"), // Optional: if tied to a specific booking
  amount: double("amount").notNull(),
  status: text("status", { enum: ["pending", "paid", "cancelled"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Commission = typeof commissions.$inferSelect;
