import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const contactMutation = trpc.salon.setSetting.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال رسالتك بنجاح! سنرد عليك قريباً.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (e) => toast.error(e.message || "فشل إرسال الرسالة"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate({ key: `contact_${Date.now()}`, value: JSON.stringify({ ...form, submittedAt: new Date().toISOString() }) });
  };

  return (
    <Layout>
      <SEO title="اتصل بنا" description="تواصل مع صالون الملوك في العاشر من رمضان. عنوان: الحي العاشر 110. تليفون: +20 1097314558." path="/contact" />
      <div className="min-h-screen bg-black text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                تواصل معنا
              </span>
            </h1>
            <p className="text-gray-400 text-lg">نحن هنا لمساعدتك. تواصل معنا عبر الهاتف، البريد الإلكتروني، أو راسلنا على واتساب.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-zinc-900/50 border-amber-500/20">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6 text-amber-400">معلومات الاتصال</h2>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-gray-300 font-medium">العنوان</p>
                        <p className="text-gray-400 text-sm">العاشر من رمضان - الحي العاشر 110 بجوار مستشفي العزل - خلف صيدليه احمد عبدالعال</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-gray-300 font-medium">الهاتف</p>
                        <p className="text-gray-400 text-sm">+20 1097314558</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-gray-300 font-medium">ساعات العمل</p>
                        <p className="text-gray-400 text-sm">السبت - الخميس: 10 ص - 10 م</p>
                        <p className="text-gray-400 text-sm">الجمعة: 4 م - 8 م</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-amber-500/20">
                    <h3 className="text-lg font-bold mb-4 text-amber-400">تواصل عبر واتساب</h3>
                    <a
                      href="https://wa.me/201097314558"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>راسلنا على واتساب</span>
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card className="bg-zinc-900/50 border-amber-500/20">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-amber-400">مواعيد العمل</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                      <span className="text-gray-300">السبت</span>
                      <span className="text-amber-400 font-medium">10:00 ص - 10:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                      <span className="text-gray-300">الأحد</span>
                      <span className="text-amber-400 font-medium">10:00 ص - 10:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                      <span className="text-gray-300">الاثنين</span>
                      <span className="text-amber-400 font-medium">10:00 ص - 10:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                      <span className="text-gray-300">الثلاثاء</span>
                      <span className="text-amber-400 font-medium">10:00 ص - 10:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                      <span className="text-gray-300">الأربعاء</span>
                      <span className="text-amber-400 font-medium">10:00 ص - 10:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-500/10">
                      <span className="text-gray-300">الخميس</span>
                      <span className="text-amber-400 font-medium">10:00 ص - 10:00 م</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-amber-500/10">
                      <span className="text-gray-300">الجمعة</span>
                      <span className="text-amber-400 font-medium">4:00 م - 8:00 م</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-zinc-900/50 border-amber-500/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-amber-400">أرسل لنا رسالة</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">الاسم الكامل *</label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="أحمد محمد"
                          className="bg-zinc-800 border-amber-500/20 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف *</label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+20 1097314558"
                          className="bg-zinc-800 border-amber-500/20 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني *</label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="ahmed@example.com"
                        className="bg-zinc-800 border-amber-500/20 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">الموضوع *</label>
                      <Input
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="حجز موعد، استفسار، إلخ..."
                        className="bg-zinc-800 border-amber-500/20 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">الرسالة *</label>
                      <Textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="اكتب رسالتك هنا..."
                        className="bg-zinc-800 border-amber-500/20 text-white min-h-[120px]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactMutation.isPending}
                      className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      {contactMutation.isPending ? "جاري الإرسال..." : "إرسال الرسالة"}
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
