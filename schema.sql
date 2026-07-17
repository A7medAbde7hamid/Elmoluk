DROP TABLE IF EXISTS __drizzle_migrations, activity_logs, affiliates, barber_schedules, barbers, bookings, branches, chat_messages, commissions, gift_vouchers, holidays, loyalty_points, notifications, offers, order_items, orders, package_services, packages, payments, products, reviews, salon_settings, services, site_visits, users, wallet_transactions, wallets;

CREATE TABLE users (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  union_id varchar(255),
  name text NOT NULL,
  phone varchar(20),
  password text,
  email text,
  avatar text,
  role varchar(20) NOT NULL DEFAULT 'user',
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastSignInAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(union_id),
  UNIQUE KEY(phone)
);

CREATE TABLE barbers (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int,
  name text NOT NULL,
  name_en text,
  image text,
  specialization text,
  bio text,
  phone text,
  email text,
  salary_type varchar(10) NOT NULL DEFAULT 'fixed',
  salary_amount double NOT NULL DEFAULT 0,
  rating double NOT NULL DEFAULT 5,
  total_reviews int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(user_id)
);

CREATE TABLE barber_schedules (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  barber_id int NOT NULL,
  day_of_week int NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  is_day_off boolean NOT NULL DEFAULT false,
  PRIMARY KEY(id)
);

CREATE TABLE services (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  name text NOT NULL,
  name_en text,
  description text,
  image text,
  price double NOT NULL,
  duration int NOT NULL,
  category varchar(20) NOT NULL DEFAULT 'haircut',
  is_active boolean NOT NULL DEFAULT true,
  is_home_service boolean NOT NULL DEFAULT false,
  home_service_fee double NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE packages (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  name text NOT NULL,
  name_en text,
  description text,
  image text,
  original_price double NOT NULL,
  discounted_price double NOT NULL,
  discount_percent int NOT NULL DEFAULT 0,
  duration int NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_vip boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE package_services (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  package_id int NOT NULL,
  service_id int NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE bookings (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int,
  barber_id int,
  service_id int,
  package_id int,
  booking_date text NOT NULL,
  booking_time text NOT NULL,
  duration int NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  payment_status varchar(20) NOT NULL DEFAULT 'pending',
  total_amount double NOT NULL,
  notes text,
  cancellation_reason text,
  is_home_service boolean NOT NULL DEFAULT false,
  home_address text,
  otp_code text,
  otp_verified boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE reviews (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  booking_id int NOT NULL,
  user_id int NOT NULL,
  barber_id int NOT NULL,
  rating int NOT NULL,
  comment text,
  image text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE products (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  name text NOT NULL,
  name_en text,
  description text,
  image text,
  price double NOT NULL,
  stock int NOT NULL DEFAULT 0,
  category text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE orders (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  total_amount double NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  shipping_address text,
  payment_status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE order_items (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  order_id int NOT NULL,
  product_id int NOT NULL,
  quantity int NOT NULL,
  unit_price double NOT NULL,
  total_price double NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE payments (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  booking_id int,
  order_id int,
  amount double NOT NULL,
  payment_method varchar(20) NOT NULL DEFAULT 'cash',
  status varchar(20) NOT NULL DEFAULT 'pending',
  transaction_id text,
  receipt_image text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE wallets (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  balance double NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(user_id)
);

CREATE TABLE wallet_transactions (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  wallet_id int NOT NULL,
  type varchar(10) NOT NULL,
  amount double NOT NULL,
  description text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE offers (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  code varchar(50) NOT NULL,
  name text NOT NULL,
  description text,
  discount_type varchar(20) NOT NULL DEFAULT 'percentage',
  discount_value double NOT NULL,
  max_discount double,
  min_order_amount double NOT NULL DEFAULT 0,
  usage_limit int,
  usage_count int NOT NULL DEFAULT 0,
  per_user_limit int NOT NULL DEFAULT 1,
  start_date text NOT NULL,
  end_date text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(code)
);

CREATE TABLE loyalty_points (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  points int NOT NULL,
  type varchar(10) NOT NULL,
  description text,
  booking_id int,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE notifications (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int,
  title text NOT NULL,
  message text NOT NULL,
  type varchar(20) NOT NULL DEFAULT 'system',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE gift_vouchers (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  code varchar(50) NOT NULL,
  amount double NOT NULL,
  sender_name text,
  sender_email text,
  recipient_name text,
  recipient_email text,
  message text,
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_by int,
  expiry_date text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(code)
);

CREATE TABLE salon_settings (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  value text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(`key`)
);

CREATE TABLE holidays (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  date text NOT NULL,
  name text,
  is_recurring boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE branches (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  name text NOT NULL,
  name_en text,
  address text,
  phone text,
  email text,
  map_url text,
  is_main boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE activity_logs (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id int,
  details text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE chat_messages (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int,
  message text NOT NULL,
  is_bot boolean NOT NULL DEFAULT false,
  session_id text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE site_visits (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  ip_address text,
  user_agent text,
  visited_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);

CREATE TABLE affiliates (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  code varchar(50) NOT NULL,
  commission_rate double NOT NULL DEFAULT 10,
  total_earnings double NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id),
  UNIQUE KEY(code)
);

CREATE TABLE commissions (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  affiliate_id int NOT NULL,
  booking_id int,
  amount double NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
);
