import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
import {
  User,
  MapPin,
  Check,
  Gift,
  Clock,
  Sunrise,
  Sun,
  Sunset,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("booking_step");
    return saved ? Number(saved) : searchParams.get("packageId") ? 2 : 1;
  });
  const [selectedService, setSelectedService] = useState<number | null>(() => {
    const saved = localStorage.getItem("booking_serviceId");
    const sid = searchParams.get("serviceId");
    return sid ? Number(sid) : saved ? Number(saved) : null;
  });
  const [selectedBarber, setSelectedBarber] = useState<number | null>(() => {
    const saved = localStorage.getItem("booking_barberId");
    return saved ? Number(saved) : null;
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const saved = localStorage.getItem("booking_date");
    return saved ? new Date(saved) : new Date();
  });
  const [customerName, setCustomerName] = useState(
    () => sessionStorage.getItem("booking_name") || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    () => sessionStorage.getItem("booking_phone") || ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    () => sessionStorage.getItem("booking_email") || ""
  );
  const [notes, setNotes] = useState(
    () => sessionStorage.getItem("booking_notes") || ""
  );
  const isHomeService = false;
  const homeAddress = "";
  const [selectedTime, setSelectedTime] = useState<string | null>(
    () => sessionStorage.getItem("booking_time") || null
  );
  const [usePoints, setUsePoints] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Anti-bot honeypot field

  // Save booking form to localStorage on change
  useEffect(() => {
    localStorage.setItem("booking_step", String(step));
    localStorage.setItem(
      "booking_serviceId",
      selectedService?.toString() ?? ""
    );
    localStorage.setItem("booking_barberId", selectedBarber?.toString() ?? "");
    localStorage.setItem("booking_date", selectedDate?.toISOString() ?? "");
    sessionStorage.setItem("booking_name", customerName);
    sessionStorage.setItem("booking_phone", customerPhone);
    sessionStorage.setItem("booking_email", customerEmail);
    sessionStorage.setItem("booking_notes", notes);
  }, [
    step,
    selectedService,
    selectedBarber,
    selectedDate,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    selectedTime,
  ]);

  const { data: services } = trpc.service.list.useQuery({ isActive: true });
  const { data: barbers } = trpc.barber.list.useQuery({ isActive: true });
  const { data: loyalty } = trpc.loyalty.myPoints.useQuery(undefined, {
    enabled: !!user,
  });

  const selectedServiceData = services?.find(s => s.id === selectedService);
  const selectedBarberData = barbers?.find(b => b.id === selectedBarber);

  const { data: timeSlots, isLoading: slotsLoading } =
    trpc.booking.getTimeSlots.useQuery(
      {
        barberId: selectedBarber ?? undefined,
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        duration: selectedServiceData?.duration || 30,
      },
      { enabled: !!selectedDate }
    );

  const today = useMemo(() => new Date(), []);
  const availableDates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today, i)),
    [today]
  );

  const timeSlotGroups = useMemo(() => {
    if (!timeSlots?.length) return { morning: [], afternoon: [], evening: [] };
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    for (const slot of timeSlots) {
      const hour = Number(slot.split(":")[0]);
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    }
    return { morning, afternoon, evening };
  }, [timeSlots]);

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: data => {
      toast.success(`تم حجز موعدك بنجاح! رقم دورك: ${data.queueNumber}`);
      ["step", "serviceId", "barberId", "date"].forEach(k =>
        localStorage.removeItem(`booking_${k}`)
      );
      ["name", "phone", "email", "notes", "home", "address", "time"].forEach(
        k => sessionStorage.removeItem(`booking_${k}`)
      );
      if (usePoints) {
        redeemPoints.mutate({
          points: 2000,
          description: "استبدال 2000 نقطة للحصول على خدمة مجانية",
          bookingId: data.id,
        });
      }
      navigate("/profile");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const redeemPoints = trpc.loyalty.redeemPoints.useMutation({
    onError: error => {
      toast.error(error.message);
    },
  });

  const canUsePoints = !!user && !!loyalty && loyalty.total >= 2000;
  const finalAmount = usePoints ? 0 : Number(selectedServiceData?.price ?? 0);

  const handleSubmit = () => {
    if (!selectedService || !selectedDate) return;
    if (honeypot) return; // Bot detected

    createBooking.mutate({
      userId: user?.id,
      barberId: selectedBarber ?? undefined,
      serviceId: selectedService,
      packageId: searchParams.get("packageId")
        ? Number(searchParams.get("packageId"))
        : undefined,
      bookingDate: format(selectedDate, "yyyy-MM-dd"),
      bookingTime: selectedTime ?? undefined,
      duration: selectedServiceData?.duration || 30,
      totalAmount: String(finalAmount),
      notes: usePoints
        ? `${notes ? notes + "\n" : ""}[تم استخدام نقاط الولاء]`
        : notes,
      isHomeService,
      homeAddress: isHomeService ? homeAddress : undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
    });
  };

  const steps = [
    { id: 1, label: "الخدمة" },
    { id: 2, label: "الحلاق" },
    { id: 3, label: "التأكيد" },
  ];

  return (
    <Layout>
      <SEO
        title="احجز موعد حلاقة في صالون الملوك"
        description="احجز موعدك في صالون الملوك بسهولة. اختر الخدمة والحلاق والوقت المناسب. حجز أونلاين في العاشر من رمضان."
        path="/booking"
        keywords="حجز صالون حلاقة, حجز موعد حلاق, صالون الملوك حجز, حجز أونلاين حلاقة"
      />
      <BreadcrumbSchema
        items={[
          { name: "الرئيسية", path: "/" },
          { name: "حجز موعد", path: "/booking" },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "كيف تحجز موعد في صالون الملوك",
        "description": "خطوات بسيطة لحجز موعدك في صالون الملوك",
        "step": [
          { "@type": "HowToStep", "name": "اختر الخدمة", "text": "اختر الخدمة التي تناسبك من قائمة خدمات الحلاقة والعناية." },
          { "@type": "HowToStep", "name": "اختر الحلاق", "text": "اختر الحلاق المفضل أو دع النظام يختار لك حلاق متاح." },
          { "@type": "HowToStep", "name": "اختر التاريخ والوقت", "text": "اختر اليوم والوقت المناسب من الأوقات المتاحة." },
          { "@type": "HowToStep", "name": "أكّد الحجز", "text": "أدخل بياناتك وأكّد الحجز لتصلك رسالة واتساب تأكيد." }
        ]
      }) }} />
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">احجز موعدك</h1>
            <p className="text-gray-400">خطوات بسيطة لحجز تجربتك الملكية</p>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s.id
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-gray-500"
                  }`}
                >
                  {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                </div>
                <span
                  className={`text-sm hidden sm:block ${
                    step >= s.id ? "text-amber-400" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      step > s.id ? "bg-amber-500" : "bg-zinc-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6">
                اختر الخدمة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-6 rounded-2xl border-2 text-right transition-all ${
                      selectedService === service.id
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {service.name}
                      </h3>
                      <span className="text-amber-400 font-bold">
                        {service.price} ج.م
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration} دقيقة
                      </span>
                      {service.isHomeService && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <MapPin className="w-4 h-4" />
                          منزلي
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setSelectedBarber(null);
                    setStep(2);
                  }}
                  disabled={!selectedService}
                  className="bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Barber */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6">
                اختر الحلاق
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedBarber(null)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${
                    selectedBarber === null
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/30"
                  }`}
                >
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">أي حلاق</h3>
                  <p className="text-gray-400 text-sm">
                    سيتم تحديد حلاق متاح تلقائياً
                  </p>
                  {selectedBarber === null && (
                    <span className="inline-block mt-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                      تم الاختيار
                    </span>
                  )}
                </button>
                {barbers?.map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber.id)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      selectedBarber === barber.id
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/30"
                    }`}
                  >
                    {barber.image ? (
                      <img
                        src={barber.image}
                        alt={barber.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    )}
                    <h3 className="text-lg font-bold text-white">
                      {barber.name}
                    </h3>
                    <p className="text-amber-400 text-sm">
                      {barber.specialization}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="text-yellow-400">
                        {"★".repeat(Math.round(Number(barber.rating)))}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({barber.totalReviews})
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-amber-500/30 text-amber-400"
                >
                  السابق
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {selectedBarber === null ? "تخطي (أي حلاق)" : "التالي"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Date + Time + Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                اختر التاريخ والوقت
              </h2>

              {/* Date Selection */}
              <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6">
                <Label className="text-white mb-4 block">اختر اليوم</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {availableDates.map(date => {
                    const isSelected =
                      selectedDate &&
                      format(selectedDate, "yyyy-MM-dd") ===
                        format(date, "yyyy-MM-dd");
                    const isToday =
                      format(date, "yyyy-MM-dd") ===
                      format(today, "yyyy-MM-dd");
                    const dayName = format(date, "EEEE", { locale: ar });
                    const dayNum = format(date, "d", { locale: ar });
                    const monthName = format(date, "MMM", { locale: ar });
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        className={`flex-shrink-0 w-20 py-3 rounded-xl text-center transition-all border-2 ${
                          isSelected
                            ? "border-amber-500 bg-amber-500 text-black"
                            : "border-zinc-700 bg-zinc-800/80 text-gray-300 hover:border-amber-500/50"
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${isSelected ? "text-black/60" : "text-gray-500"}`}
                        >
                          {isToday ? "اليوم" : dayName}
                        </p>
                        <p
                          className={`text-xl font-bold ${isSelected ? "text-black" : "text-white"}`}
                        >
                          {dayNum}
                        </p>
                        <p
                          className={`text-xs ${isSelected ? "text-black/60" : "text-gray-500"}`}
                        >
                          {monthName}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6">
                  <Label className="text-white mb-4 block">اختر الوقت</Label>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400 mr-3">
                        جاري تحميل الأوقات المتاحة...
                      </span>
                    </div>
                  ) : !timeSlots?.length ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        لا توجد أوقات متاحة في هذا اليوم
                      </p>
                      <p className="text-gray-500 text-sm mt-1">جرّب يوم آخر</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {timeSlotGroups.morning.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sunrise className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-400">
                              صباحاً
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {timeSlotGroups.morning.map(slot => (
                              <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`py-2.5 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                                  selectedTime === slot
                                    ? "border-amber-500 bg-amber-500 text-black"
                                    : "border-zinc-700 bg-zinc-800/80 text-gray-300 hover:border-amber-500/50 hover:bg-zinc-700/80"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {timeSlotGroups.afternoon.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sun className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-400">
                              ظهراً
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {timeSlotGroups.afternoon.map(slot => (
                              <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`py-2.5 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                                  selectedTime === slot
                                    ? "border-amber-500 bg-amber-500 text-black"
                                    : "border-zinc-700 bg-zinc-800/80 text-gray-300 hover:border-amber-500/50 hover:bg-zinc-700/80"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {timeSlotGroups.evening.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sunset className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-400">
                              مساءً
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {timeSlotGroups.evening.map(slot => (
                              <button
                                key={slot}
                                onClick={() => setSelectedTime(slot)}
                                className={`py-2.5 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                                  selectedTime === slot
                                    ? "border-amber-500 bg-amber-500 text-black"
                                    : "border-zinc-700 bg-zinc-800/80 text-gray-300 hover:border-amber-500/50 hover:bg-zinc-700/80"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedTime && (
                    <div className="mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                      <p className="text-amber-400 font-bold">
                        الوقت المختار: {selectedTime}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">
                  ملخص الحجز
                </h3>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="text-gray-400">الخدمة</span>
                  <span className="text-white font-bold">
                    {selectedServiceData?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="text-gray-400">الحلاق</span>
                  <span className="text-white font-bold">
                    {selectedBarber === null
                      ? "أي حلاق"
                      : selectedBarberData?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="text-gray-400">التاريخ</span>
                  <span className="text-white font-bold">
                    {selectedDate?.toLocaleDateString("ar-SA") || "—"}
                  </span>
                </div>
                {selectedTime && (
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <span className="text-gray-400">الوقت</span>
                    <span className="text-amber-400 font-bold">
                      {selectedTime}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">السعر</span>
                  <span
                    className={`font-bold text-xl ${usePoints ? "text-green-400" : "text-amber-400"}`}
                  >
                    {usePoints ? 0 : selectedServiceData?.price} ج.م
                  </span>
                </div>
                {usePoints && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-gray-400">خصم نقاط الولاء</span>
                    <span className="text-green-400 font-bold">
                      -{selectedServiceData?.price} ج.م
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">
                  بيانات العميل
                </h3>
                <div>
                  <Label
                    htmlFor="booking-name"
                    className="text-gray-300 mb-2 block"
                  >
                    الاسم
                  </Label>
                  <Input
                    id="booking-name"
                    placeholder="اسمك الكامل"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="booking-phone"
                    className="text-gray-300 mb-2 block"
                  >
                    رقم الجوال
                  </Label>
                  <Input
                    id="booking-phone"
                    placeholder="05XXXXXXXX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="booking-email"
                    className="text-gray-300 mb-2 block"
                  >
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="booking-email"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="booking-notes"
                    className="text-gray-300 mb-2 block"
                  >
                    ملاحظات
                  </Label>
                  <Input
                    id="booking-notes"
                    placeholder="أي ملاحظات خاصة..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
              </div>

              {/* Points Redemption */}
              {canUsePoints && (
                <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={e => setUsePoints(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-500 text-amber-500"
                    />
                    <Gift className="w-5 h-5 text-amber-400" />
                    <span className="text-white">
                      استخدم 2000 نقطة للحصول على هذه الخدمة مجاناً
                    </span>
                  </label>
                  <div className="mt-3 text-sm text-gray-500">
                    رصيدك الحالي:{" "}
                    <span className="text-amber-400 font-bold">
                      {loyalty?.total || 0} نقطة
                    </span>
                    {usePoints && (
                      <span className="block mt-1 text-amber-400">
                        سيتم خصم 2000 نقطة وسيصبح رصيدك{" "}
                        {(loyalty?.total || 0) - 2000} نقطة
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-amber-500/30 text-amber-400"
                >
                  السابق
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createBooking.isPending || !selectedDate || !selectedTime
                  }
                  className="bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
                >
                  {createBooking.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Honeypot field (invisible to users, catches bots) */}
      <div
        className="absolute opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    </Layout>
  );
}
