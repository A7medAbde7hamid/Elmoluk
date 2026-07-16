import { eq } from "drizzle-orm";
import { getDb } from "../src/server/queries/connection";
import * as schema from "./schema.js";
import bcrypt from "bcryptjs";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  const adminPw = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || "admin123", 10);
  const barberPw = await bcrypt.hash(process.env.BARBER_DEFAULT_PASSWORD || "barber123", 10);

  await db.insert(schema.users).values({
    name: "مدير الصالون",
    phone: "0500000000",
    password: adminPw,
    role: "admin",
    email: "admin@salon.com",
  });

  const barbersList = [
    { name: "أحمد", nameEn: "Ahmed", specialization: "حلاقة رجالي", bio: "خبرة 10 سنوات في الحلاقة الرجالية", rating: 4.9, totalReviews: 120, email: "ahmed@salon.com" },
    { name: "محمد", nameEn: "Mohammed", specialization: "عناية بالبشرة", bio: "متخصص في العناية بالبشرة والحلاقة", rating: 4.8, totalReviews: 95, email: "mohammed@salon.com" },
    { name: "خالد", nameEn: "Khaled", specialization: "تصفيف شعر", bio: "مصفف شعر محترف", rating: 4.7, totalReviews: 78, email: "khaled@salon.com" },
    { name: "سامر", nameEn: "Samer", specialization: "لحية وشارب", bio: "متخصص في تشذيب اللحى", rating: 4.9, totalReviews: 150, email: "samer@salon.com" },
  ];
  for (const barber of barbersList) {
    await db.insert(schema.barbers).values(barber);
  }

  const barberUsers = [
    { name: "أحمد", email: "ahmed@salon.com", phone: "0500000001" },
    { name: "محمد", email: "mohammed@salon.com", phone: "0500000002" },
    { name: "خالد", email: "khaled@salon.com", phone: "0500000003" },
    { name: "سامر", email: "samer@salon.com", phone: "0500000004" },
  ];
  for (let i = 0; i < barberUsers.length; i++) {
    const result = await db.insert(schema.users).values({
      name: barberUsers[i].name,
      email: barberUsers[i].email,
      phone: barberUsers[i].phone,
      password: barberPw,
      role: "barber",
    });
    const userId = Number(result[0].insertId);
    await db.update(schema.barbers).set({ userId }).where(eq(schema.barbers.id, i + 1));
  }

  for (let day = 0; day < 7; day++) {
    if (day === 5) continue;
    for (let barberId = 1; barberId <= 4; barberId++) {
      await db.insert(schema.barberSchedules).values({ barberId, dayOfWeek: day, startTime: "09:00", endTime: "21:00", isDayOff: false });
    }
  }

  const servicesData = [
    { name: "حلاقة كاملة", nameEn: "Full Haircut", description: "حلاقة كاملة بأحدث التقنيات", price: 50, duration: 30, category: "haircut" as const, image: "/images/services/haircut.jpg" },
    { name: "تشذيب لحية", nameEn: "Beard Trim", description: "تشذيب اللحية وتحديد الخطوط", price: 30, duration: 20, category: "beard" as const, image: "/images/services/beard.jpg" },
    { name: "تنظيف بشرة", nameEn: "Facial", description: "جلسة تنظيف عميق للبشرة", price: 80, duration: 45, category: "skincare" as const, image: "/images/services/facial.jpg" },
    { name: "حمام بخار", nameEn: "Steam Bath", description: "حمام بخار ملكي", price: 100, duration: 60, category: "bath" as const, image: "/images/services/bath.jpg" },
    { name: "حلاقة + لحية", nameEn: "Haircut & Beard", description: "عرض الحلاقة الكاملة مع تشذيب اللحية", price: 70, duration: 45, category: "haircut" as const, image: "/images/services/combo.jpg" },
    { name: "صبغ شعر", nameEn: "Hair Dye", description: "صبغ شعر بمواد طبيعية", price: 120, duration: 60, category: "other" as const, image: "/images/services/dye.jpg" },
    { name: "خدمة منزلية - حلاقة", nameEn: "Home Service Haircut", description: "حلاقة في منزلك", price: 150, duration: 30, category: "haircut" as const, isHomeService: true, homeServiceFee: 100 },
  ];
  for (const service of servicesData) {
    await db.insert(schema.services).values(service);
  }

  const packagesData = [
    { name: "الباقة الملكية", nameEn: "Royal Package", description: "حلاقة + عناية بالبشرة + حمام بخار", originalPrice: 230, discountedPrice: 180, discountPercent: 22, duration: 120, isVip: true },
    { name: "الباقة الذهبية", nameEn: "Golden Package", description: "حلاقة + تشذيب لحية", originalPrice: 80, discountedPrice: 65, discountPercent: 19, duration: 50 },
    { name: "باقة العناية", nameEn: "Care Package", description: "عناية بالبشرة + حمام بخار", originalPrice: 180, discountedPrice: 140, discountPercent: 22, duration: 90 },
  ];
  for (const pkg of packagesData) {
    await db.insert(schema.packages).values(pkg);
  }

  const productsData = [
    { name: "شامبو ملكي", nameEn: "Royal Shampoo", description: "شامبو للعناية بالشعر", price: 45, stock: 50, category: "شعر", image: "/images/products/shampoo.jpg" },
    { name: "زيت لحية", nameEn: "Beard Oil", description: "زيت طبيعي للحية", price: 35, stock: 30, category: "لحية", image: "/images/products/beard-oil.jpg" },
    { name: "مشط خشب", nameEn: "Wooden Comb", description: "مشط خشب طبيعي", price: 20, stock: 100, category: "اكسسوارات", image: "/images/products/comb.jpg" },
    { name: "كريم شعر", nameEn: "Hair Cream", description: "كريم تصفيف شعر", price: 40, stock: 40, category: "شعر", image: "/images/products/cream.jpg" },
  ];
  for (const product of productsData) {
    await db.insert(schema.products).values(product);
  }

  const settingsData = [
    { key: "salon_name", value: "صالون الملوك" },
    { key: "salon_name_en", value: "Kings Salon" },
    { key: "salon_phone", value: "+20 1097314558" },
    { key: "salon_address", value: "العاشر من رمضان - الحي العاشر 110 بجوار مستشفي العزل - خلف صيدليه احمد عبدالعال" },
    { key: "working_hours", value: "9:00 صباحاً - 9:00 مساءً" },
    { key: "friday_off", value: "true" },
  ];
  for (const setting of settingsData) {
    await db.insert(schema.salonSettings).values(setting);
  }

  const offersData = [
    { code: "WELCOME10", name: "خصم الترحيب", description: "خصم 10% على أول زيارة", discountType: "percentage" as const, discountValue: 10, maxDiscount: 30, minOrderAmount: 50, usageLimit: 100, usageCount: 0, perUserLimit: 1, startDate: "2025-01-01", endDate: "2026-12-31", isActive: true },
    { code: "SUMMER25", name: "خصم الصيف", description: "خصم 25% على خدمات العناية", discountType: "percentage" as const, discountValue: 25, maxDiscount: 50, minOrderAmount: 80, usageLimit: 50, usageCount: 0, perUserLimit: 1, startDate: "2025-06-01", endDate: "2025-09-30", isActive: true },
  ];
  for (const offer of offersData) {
    await db.insert(schema.offers).values(offer);
  }

  await db.insert(schema.branches).values({ name: "الفرع الرئيسي - العاشر من رمضان", nameEn: "Main Branch - 10th of Ramadan", address: "العاشر من رمضان - الحي العاشر 110 بجوار مستشفي العزل - خلف صيدليه احمد عبدالعال", phone: "+20 1097314558", isMain: true, isActive: true });

  console.log("Seed completed.");
  process.exit(0);
}

seed();
