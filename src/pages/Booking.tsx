import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { User, MapPin, Check, Gift, Hash, Clock } from "lucide-react";
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeAddress, setHomeAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "vodafone_cash" | "wallet">("cash");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState(["", "", "", ""]);
  const [otpSentCode, setOtpSentCode] = useState<string | null>(null);

  const { data: services } = trpc.service.list.useQuery({ isActive: true });
  const { data: barbers } = trpc.barber.list.useQuery({ isActive: true });
  const { data: loyalty } = trpc.loyalty.myPoints.useQuery(undefined, {
    enabled: !!user,
  });

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      setPendingBookingId(data.id);
      // @ts-expect-error otpCode may not be in the response type
      const returnedOtp: string | undefined = data.otpCode;
      if (returnedOtp) {
        setOtpSentCode(returnedOtp);
        setOtpCode(returnedOtp.split(""));
      } else {
        toast.info("تم إرسال كود التحقق عبر واتساب. إذا لم يصلك الكود، تواصل مع الدعم.");
      }
      setOtpDialogOpen(true);
      if (usePoints) {
        redeemPoints.mutate({ points: 2000, description: "استبدال 2000 نقطة للحصول على خدمة مجانية", bookingId: data.id });
      }
      createPayment.mutate({ bookingId: data.id, amount: String(finalAmount), paymentMethod, receiptImage: receiptImage || undefined });
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

  const verifyOtp = trpc.booking.verifyOtp.useMutation({
    onSuccess: () => {
      toast.success("تم التحقق من الحجز بنجاح!");
      setOtpDialogOpen(false);
      navigate("/profile");
    },
    onError: (error) => {
      toast.error(error.message || "كود التحقق غير صحيح");
      setOtpCode(["", "", "", ""]);
    },
  });

  const selectedServiceData = services?.find((s) => s.id === selectedService);
  const selectedBarberData = barbers?.find((b) => b.id === selectedBarber);
  const canUsePoints = !!user && !!loyalty && loyalty.total >= 2000;
  const finalAmount = usePoints ? 0 : Number(selectedServiceData?.price ?? 0);

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
    if (!selectedService || !selectedDate) return;
    
    createBooking.mutate(
      {
        userId: user?.id,
        barberId: selectedBarber ?? undefined,
        serviceId: selectedService,
        packageId: searchParams.get("packageId") ? Number(searchParams.get("packageId")) : undefined,
        bookingDate: format(selectedDate, "yyyy-MM-dd"),
        duration: selectedServiceData?.duration || 30,
        totalAmount: String(finalAmount),
        notes: usePoints ? `${notes ? notes + "\n" : ""}[تم استخدام نقاط الولاء]` : notes,
        isHomeService,
        homeAddress: isHomeService ? homeAddress : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
      }
    );
  };

  const steps = [
    { id: 1, label: "الخدمة" },
    { id: 2, label: "الحلاق" },
    { id: 3, label: "التأكيد" },
  ];

  return (
    <Layout>
      <SEO title="احجز موعدك" description="احجز موعدك في صالون الملوك بسهولة. اختر الخدمة والحلاق والتاريخ المناسب لك." path="/booking" />
      <BreadcrumbSchema items={[{ name: "الرئيسية", path: "/" }, { name: "حجز موعد", path: "/booking" }]} />
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

          {/* Step 3: Date + Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                اختر التاريخ والتأكيد
              </h2>

              {/* Date Selection */}
              <div className="bg-zinc-900 rounded-2xl border border-amber-500/10 p-6">
                <Label className="text-white mb-3 block">اختر اليوم</Label>
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-amber-500/10">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="text-white"
                  />
                </div>
                {selectedDate && (
                  <div className="mt-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                    <Hash className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-400 font-bold text-lg">حجز بالدور</p>
                    <p className="text-gray-400 text-sm mt-1">سيتم تحديد رقم دورك بعد تأكيد الحجز</p>
                  </div>
                )}
              </div>

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
                    {selectedDate?.toLocaleDateString("ar-SA") || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <span className="text-gray-400">نظام الحجز</span>
                  <span className="text-amber-400 font-bold">بالدور</span>
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
                  onClick={() => setStep(2)}
                  className="border-amber-500/30 text-amber-400"
                >
                  السابق
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createBooking.isPending || !selectedDate}
                  className="bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50"
                >
                  {createBooking.isPending ? "جاري الحجز..." : "تأكيد الحجز"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={(o) => { if (!o) { setOtpDialogOpen(false); setOtpCode(["", "", "", ""]); setOtpSentCode(null); } }}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد الحجز</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              {otpSentCode ? "كود التحقق الخاص بك" : "تم إرسال كود التحقق عبر واتساب"}
            </DialogDescription>
          </DialogHeader>
          {otpSentCode && (
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm mb-2">انسخ الكود التالي أو اضغط تأكيد:</p>
              <p className="text-3xl font-bold text-amber-400 tracking-widest ltr" dir="ltr">{otpSentCode}</p>
            </div>
          )}
          <div className="flex justify-center gap-3 my-6" dir="ltr">
            {otpCode.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                autoFocus={i === 0}
                value={digit}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const newCode = [...otpCode];
                  newCode[i] = val;
                  setOtpCode(newCode);
                  if (val && i < 3) {
                    const next = document.getElementById(`otp-${i + 1}`);
                    next?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digit && i > 0) {
                    const prev = document.getElementById(`otp-${i - 1}`);
                    prev?.focus();
                  }
                }}
                id={`otp-${i}`}
                className="w-14 h-14 text-center text-2xl font-bold bg-zinc-800 border border-amber-500/30 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              />
            ))}
          </div>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
            disabled={otpCode.some((d) => !d) || verifyOtp.isPending}
            onClick={() => {
              if (pendingBookingId) {
                verifyOtp.mutate({ id: pendingBookingId, otpCode: otpCode.join("") });
              }
            }}
          >
            {verifyOtp.isPending ? "جاري التحقق..." : "تأكيد"}
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
