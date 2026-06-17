import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { chatMessages } from "@db/schema";

// Simple bot responses
const botResponses: Record<string, string> = {
  "مرحبا": "مرحباً بك في صالون الملوك! كيف يمكنني مساعدتك اليوم؟",
  "hello": "Welcome to Salon El Molok! How can I help you today?",
  "حجز": "لحجز موعد، يرجى الذهاب إلى صفحة الحجوزات واختيار الخدمة والحلاق والوقت المناسب لك.",
  "booking": "To book an appointment, please go to the booking page and select your service, barber, and preferred time.",
  "سعر": "لمعرفة الأسعار، يرجى زيارة صفحة الخدمات حيث ستجد جميع الخدمات مع أسعارها.",
  "price": "For pricing, please visit our services page where you'll find all services with their prices.",
  "وقت": "ساعات العمل من 10 صباحاً إلى 10 مساءً يومياً، ما عدا يوم الجمعة من 2 ظهراً إلى 10 مساءً.",
  "hours": "Our working hours are from 10 AM to 10 PM daily, except Friday from 2 PM to 10 PM.",
  "موقع": "صالون الملوك يقع في قلب المدينة. يمكنك العثور على العنوان الكامل في صفحة اتصل بنا.",
  "location": "Salon El Molok is located in the city center. You can find the full address on our Contact Us page.",
  "حلاق": "لدينا نخبة من أفضل الحلاقين المتخصصين. يمكنك مشاهدة ملفاتهم والتقييمات في صفقة فريقنا.",
  "barber": "We have a team of expert barbers. You can view their profiles and ratings on our team page.",
  "شكرا": "العفو! نتمنى لك يوماً سعيداً. إذا كنت بحاجة لأي مساعدة أخرى، نحن هنا!",
  "thanks": "You're welcome! Have a great day. If you need any further assistance, we're here!",
};

function getBotResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  for (const [key, response] of Object.entries(botResponses)) {
    if (lowerMsg.includes(key)) {
      return response;
    }
  }
  
  // Default responses
  const defaults = [
    "شكراً لتواصلك معنا. يمكنك حجز موعد مباشرة من الموقع أو الاتصال بنا على الرقم الموجود في صفحة الاتصال.",
    "Thank you for reaching out. You can book an appointment directly from the website or call us at the number on our contact page.",
  ];
  
  return lowerMsg.match(/[\u0600-\u06FF]/) ? defaults[0] : defaults[1];
}

export const chatRouter = createRouter({
  // Get chat history by session
  history: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.chatMessages.findMany({
        where: eq(chatMessages.sessionId, input.sessionId),
        orderBy: [desc(chatMessages.createdAt)],
      });
    }),

  // Send message and get bot response
  sendMessage: publicQuery
    .input(
      z.object({
        message: z.string().min(1),
        sessionId: z.string(),
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      // Save user message
      await db.insert(chatMessages).values({
        userId: input.userId,
        message: input.message,
        isBot: false,
        sessionId: input.sessionId,
      });
      
      // Get bot response
      const botMessage = getBotResponse(input.message);
      
      // Save bot response
      await db.insert(chatMessages).values({
        message: botMessage,
        isBot: true,
        sessionId: input.sessionId,
      });
      
      return { response: botMessage };
    }),
});
