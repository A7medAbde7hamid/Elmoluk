import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Clock, User, MapPin, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { useAuth } from "@/hooks/useAuth";

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(searchParams.get("packageId") ? 2 : 1);
  const [selectedService, setSelectedService] = useState<number | null>(() => {
    const sid = searchParams.get("serviceId");
    return sid ? Number(sid) : null;
  });
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeAddress, setHomeAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "vodafone_cash" | "wallet">("cash");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  const { data: services } = trpc.service.list.useQuery({ isActive: true });
  const { data: barbers } = trpc.barber.list.useQuery({ isActive: true });
  const { data: timeSlots } = trpc.booking.getTimeSlots.useQuery(
    {
      barberId: selectedBarber ?? undefined,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
    },
    { enabled: !!selectedDate }
  );
  const { data: loyalty } = trpc.loyalty.myPoints.useQuery(undefined, {
    enabled: !!user,
  });

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast.success("تم الحجز بنجاح! تم إرسال كود التحقق");
      navigate("/profile");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadMutation = trpc.upload.receipt.useMutation({
    onSuccess: (data) => {
      setReceiptImage(data.url);
      toast.success("تم رفع الإيصال بنجاح");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createPayment = trpc.payment.create.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const redeemPoints = trpc.loyalty.redeemPoints.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const selectedServiceData = services?.find((s) => s.id === selectedService);
  const selectedBarberData = barbers?.find((b) => b.id === selectedBarber);
  const canUsePoints = !!user && !!loyalty && loyalty.total >= 2000;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadMutation.mutate({ fileName: file.name, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    const finalAmount = usePoints ? 0 : Number(selectedServiceData?.price ?? 0);
    
    createBooking.mutate(
      {
        barberId: selectedBarber ?? undefined,
        serviceId: selectedService,
        bookingDate: format(selectedDate, "yyyy-MM-dd"),
        bookingTime: selectedTime,
        duration: selectedServiceData?.duration || 30,
        totalAmount: String(finalAmount),
        notes: usePoints ? `${notes ? notes + "\n" : ""}[تم استخدام نقاط الولاء]` : notes,
        isHomeService,
        homeAddress: isHomeService ? homeAddress : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
      },
      {
        onSuccess: (bookingResult) => {
          if (usePoints) {
            redeemPoints.mutate({
              points: 2000,
              description: "استبدال 2000 نقطة للحصول على خدمة مجانية",
              bookingId: bookingResult.id,
            });
          }
          createPayment.mutate({
            bookingId: bookingResult.id,
            amount: String(finalAmount),
            paymentMethod,
          });
          toast.success("تم الحجز بنجاح!");
          navigate("/profile");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const steps = [
    { id: 1, label: "الخدمة" },
    { id: 2, label: "الحلاق" },
    { id: 3, label: "الموعد" },
    { id: 4, label: "التأكيد" },
  ];

  return (
    <Layout>
      <SEO title="احجز موعدك" description="احجز موعدك في صالون الملوك بسهولة. اختر الخدمة والحلاق والوقت المناسب لك." path="/booking" />
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
              <h2 className="text-2xl font-bold text-white mb-6">اختر الخدمة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map((service) => (
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
                  <p className="text-gray-400 text-sm">سيتم تحديد حلاق متاح تلقائياً</p>
                  {selectedBarber === null && (
                    <span className="inline-block mt-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                      تم الاختيار
                    </span>
                  )}
                </button>
                {barbers?.map((barber) => (
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

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                اختر التاريخ والوقت
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label className="text-white mb-3 block">التاريخ</Label>
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-amber-500/10">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">الوقت</Label>
                  {selectedDate ? (
                    timeSlots && timeSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                              selectedTime === slot
                                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105"
                                : "bg-zinc-800/50 text-gray-300 border border-zinc-700 hover:border-amber-500/40 hover:bg-zinc-700/50"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">لا توجد أوقات متاحة لهذا اليوم</p>
                        <p className="text-gray-600 text-sm mt-1">يرجى اختيار يوم آخر</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                      <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">اختر تاريخاً لعرض الأوقات المتاحة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Home Service */}
              {selectedServiceData?.isHomeService && (
                <div className="bg-zinc-900 p-6 rounded-2xl border border-amber-500/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHomeService}
                      onChange={(e) => setIsHomeService(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-500 text-amber-500"
                    />
                    <span className="text-white">خدمة منزلية</span>
                    <span className="text-amber-400 text-sm">
                      (+{selectedServiceData.homeServiceFee} ج.م)
                    </span>
                  </label>
                  {isHomeService && (
                    <div className="mt-4">
                      <Label className="text-gray-300">عنوان المنزل</Label>
                      <Input
                        placeholder="أدخل عنوانك الكامل"
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        className="mt-2 bg-black border-amber-500/20 text-white"
                      />
                    </div>
                  )}
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
                  onClick={() => {
                    if (!selectedTime && timeSlots && timeSlots.length > 0) {
                      setSelectedTime(timeSlots[0]);
                    }
                    setStep(4);
                  }}
                  disabled={!selectedDate || !timeSlots || timeSlots.length === 0}
                  className="bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
                >
                  {!selectedTime && timeSlots && timeSlots.length > 0
                    ? "تخطي (اختيار أول وقت)"
                    : "التالي"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                تأكيد الحجز
              </h2>

              <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6 space-y-4">
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
                    {selectedDate?.toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="text-gray-400">الوقت</span>
                  <span className="text-white font-bold">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">السعر</span>
                  <span className={`font-bold text-xl ${usePoints ? 'text-green-400' : 'text-amber-400'}`}>
                    {usePoints ? 0 : selectedServiceData?.price} ج.م
                  </span>
                </div>
                {usePoints && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-gray-400">خصم نقاط الولاء</span>
                    <span className="text-green-400 font-bold">-{selectedServiceData?.price} ج.م</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">
                  بيانات العميل
                </h3>
                <div>
                  <Label className="text-gray-300 mb-2 block">الاسم</Label>
                  <Input
                    placeholder="اسمك الكامل"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    رقم الجوال
                  </Label>
                  <Input
                    placeholder="05XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-black border-amber-500/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">ملاحظات</Label>
                  <Input
                    placeholder="أي ملاحظات خاصة..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-500 text-amber-500"
                    />
                    <Gift className="w-5 h-5 text-amber-400" />
                    <span className="text-white">استخدم 2000 نقطة للحصول على هذه الخدمة مجاناً</span>
                  </label>
                  <div className="mt-3 text-sm text-gray-500">
                    رصيدك الحالي: <span className="text-amber-400 font-bold">{loyalty?.total || 0} نقطة</span>
                    {usePoints && (
                      <span className="block mt-1 text-amber-400">
                        سيتم خصم 2000 نقطة وسيصبح رصيدك {((loyalty?.total || 0) - 2000)} نقطة
                      </span>
                    )}
                  </div>
                </div>
              )}

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                totalAmount={Number(usePoints ? 0 : selectedServiceData?.price ?? 0)}
                receiptImage={receiptImage}
                onReceiptUpload={handleReceiptUpload}
              />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="border-amber-500/30 text-amber-400"
                >
                  السابق
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createBooking.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
                >
                  {createBooking.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
