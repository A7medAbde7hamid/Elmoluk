import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Scissors, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function BarberDashboard() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("today");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkIn, setWalkIn] = useState({
    serviceId: 0, barberId: 0, customerName: "", customerPhone: "",
    bookingDate: new Date().toISOString().split("T")[0],
    bookingTime: "", duration: 30, totalAmount: 0,
    paymentMethod: "cash" as const, paymentStatus: "paid" as const,
  });

  const { data: profile, isLoading: profileLoading } = trpc.barberDashboard.myProfile.useQuery(undefined, { retry: false });
  const { data: todayBookings, isLoading: bookingsLoading, isError: bookingsError } = trpc.barberDashboard.todayBookings.useQuery(undefined, { enabled: activeTab === "today" });
  const { data: services, isLoading: servicesLoading, isError: servicesError } = trpc.service.list.useQuery({}, { retry: false });

  const markMutation = trpc.barberDashboard.markStatus.useMutation({
    onSuccess: () => { utils.barberDashboard.todayBookings.invalidate(); toast.success("تم تحديث الحالة"); },
    onError: (err) => toast.error(err.message),
  });
  const walkInMutation = trpc.barberDashboard.walkIn.useMutation({
    onSuccess: () => { utils.barberDashboard.todayBookings.invalidate(); setWalkInOpen(false); toast.success("تمت إضافة الحجز"); },
    onError: (err) => toast.error(err.message),
  });

  if (profileLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black pt-24 pb-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="min-h-screen bg-black pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">وصول محدود</h1>
            <p className="text-gray-400 mb-4">هذه الصفحة مخصصة للحلاقين فقط</p>
            <Link to="/"><Button className="bg-amber-500 hover:bg-amber-600 text-black">العودة للرئيسية</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">لوحة الحلاق</h1>
              <p className="text-gray-400">مرحباً {profile.name}</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => {
              setWalkIn({ ...walkIn, barberId: profile.id, bookingTime: new Date().toTimeString().slice(0, 5) });
              setWalkInOpen(true);
            }}>
              <UserPlus className="w-4 h-4 ml-1" />إضافة عميل ووك إن
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="bg-zinc-900 border border-amber-500/10 mb-6">
              <TabsTrigger value="today" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                <Clock className="w-4 h-4 ml-1" />حجوزات اليوم
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              <div className="space-y-4">
                {bookingsLoading && (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {bookingsError && (
                  <Card className="bg-zinc-900/50 border-red-500/20">
                    <CardContent className="p-8 text-center">
                      <p className="text-red-400">فشل تحميل الحجوزات</p>
                      <Button variant="outline" className="mt-2 border-amber-500/30 text-amber-400" onClick={() => utils.barberDashboard.todayBookings.invalidate()}>إعادة المحاولة</Button>
                    </CardContent>
                  </Card>
                )}
                {!bookingsLoading && !bookingsError && todayBookings?.length === 0 && (
                  <Card className="bg-zinc-900/50 border-amber-500/10">
                    <CardContent className="p-8 text-center">
                      <Scissors className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">لا توجد حجوزات اليوم</p>
                    </CardContent>
                  </Card>
                )}
                {!bookingsLoading && !bookingsError && todayBookings?.map((b) => (
                  <Card key={b.id} className="bg-zinc-900/50 border-amber-500/10">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold text-lg">دور #{b.queueNumber || "—"}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                              b.status === "completed" ? "bg-green-500/20 text-green-400" :
                              b.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                              b.status === "no_show" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>{b.status}</span>
                          </div>
                          <p className="text-white font-bold mt-1">{b.service?.name || "خدمة"}</p>
                          {b.notes && <p className="text-gray-400 text-sm">{b.notes}</p>}
                          <p className="text-amber-400 text-sm font-bold mt-1">{b.totalAmount} ج.م</p>
                        </div>
                        <div className="flex gap-2">
                          {b.status === "pending" && (
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => markMutation.mutate({ id: b.id, status: "confirmed" })}>
                              <CheckCircle className="w-4 h-4 ml-1" />تأكيد
                            </Button>
                          )}
                          {b.status !== "completed" && b.status !== "no_show" && (
                            <>
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => markMutation.mutate({ id: b.id, status: "completed" })}>
                                <CheckCircle className="w-4 h-4 ml-1" />تم
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => markMutation.mutate({ id: b.id, status: "no_show" })}>
                                <XCircle className="w-4 h-4 ml-1" />لم يحضر
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة عميل ووك إن</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم العميل" value={walkIn.customerName}
              onChange={(e) => setWalkIn({ ...walkIn, customerName: e.target.value })}
              className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="رقم الهاتف (اختياري)" value={walkIn.customerPhone}
              onChange={(e) => setWalkIn({ ...walkIn, customerPhone: e.target.value })}
              className="bg-zinc-800 border-amber-500/20 text-white" />
            <Select value={String(walkIn.serviceId)} onValueChange={(v) => {
              const svc = services?.find((s) => s.id === Number(v));
              setWalkIn({ ...walkIn, serviceId: Number(v), totalAmount: svc ? Number(svc.price) : 0, duration: svc?.duration || 30 });
            }}>
              <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white"><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                {services?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name} - {s.price} ج.م</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="المبلغ" type="number" value={walkIn.totalAmount}
              onChange={(e) => setWalkIn({ ...walkIn, totalAmount: Number(e.target.value) })}
              className="bg-zinc-800 border-amber-500/20 text-white" />
            <Select value={walkIn.paymentMethod} onValueChange={(v) => setWalkIn({ ...walkIn, paymentMethod: v as "cash" | "card" | "vodafone_cash" })}>
              <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white"><SelectValue placeholder="طريقة الدفع" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                <SelectItem value="cash">نقداً</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="الوقت" type="time" value={walkIn.bookingTime || new Date().toTimeString().slice(0, 5)}
              onChange={(e) => setWalkIn({ ...walkIn, bookingTime: e.target.value })}
              className="bg-zinc-800 border-amber-500/20 text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setWalkInOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={walkInMutation.isPending || !walkIn.customerName || !walkIn.serviceId}
              onClick={() => walkInMutation.mutate(walkIn)}>
              {walkInMutation.isPending ? "جاري..." : "إضافة الحجز"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
