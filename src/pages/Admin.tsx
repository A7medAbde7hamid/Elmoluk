import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Scissors,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Star,
  Plus,
  Edit,
  Trash2,
  Upload,
  XCircle,
  Crown,
  BarChart3,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const utils = trpc.useUtils();

  // Booking filters
  const [bkgStatus, setBkgStatus] = useState<string>("");
  const [bkgDateFrom, setBkgDateFrom] = useState("");
  const [bkgDateTo, setBkgDateTo] = useState("");
  const [bkgBarberId, setBkgBarberId] = useState<number | undefined>(undefined);

  const { data: adminStats, isLoading: dashLoading, error: dashError } = trpc.admin.stats.useQuery(undefined, {
    enabled: activeTab === "dashboard",
    retry: false,
  });
  const { data: packagesData, isLoading: pkgLoading, error: pkgError } = trpc.package.list.useQuery(
    {},
    { enabled: activeTab === "packages", retry: false }
  );
  const { data: affiliatesData, isLoading: affLoading, error: affError } = trpc.admin.listAffiliates.useQuery(undefined, {
    enabled: activeTab === "affiliates",
    retry: false,
  });
  const { data: bookings, isLoading: bkgLoading, error: bkgError } = trpc.booking.list.useQuery(
    { 
      limit: 50,
      ...(bkgStatus ? { status: bkgStatus as any } : {}),
      ...(bkgDateFrom ? { dateFrom: bkgDateFrom } : {}),
      ...(bkgDateTo ? { dateTo: bkgDateTo } : {}),
      ...(bkgBarberId ? { barberId: bkgBarberId } : {}),
    },
    { enabled: activeTab === "bookings", retry: false }
  );
  const { data: servicesData, isLoading: svcLoading, error: svcError } = trpc.service.list.useQuery(
    {},
    { enabled: activeTab === "services", retry: false }
  );
  const { data: barbersData, isLoading: brbLoading, error: brbError } = trpc.barber.list.useQuery(
    {},
    { enabled: activeTab === "barbers", retry: false }
  );
  const { data: productsData, isLoading: prdLoading, error: prdError } = trpc.product.list.useQuery(
    {},
    { enabled: activeTab === "shop", retry: false }
  );
  const { data: offersData, isLoading: ofrLoading, error: ofrError } = trpc.offer.list.useQuery(
    { isActive: undefined },
    { enabled: activeTab === "offers", retry: false }
  );
  const { data: usersData, isLoading: usrLoading, error: usrError } = trpc.user.list.useQuery(
    {},
    { enabled: activeTab === "users", retry: false }
  );
  const { data: ordersData, isLoading: ordLoading, error: ordError } = trpc.order.list.useQuery(
    {},
    { enabled: activeTab === "orders", retry: false }
  );
  const { data: paymentsData, isLoading: payLoading, error: payError } = trpc.payment.list.useQuery(
    {},
    { enabled: activeTab === "payments", retry: false }
  );
  const { data: reviewsData, isLoading: revLoading, error: revError } = trpc.review.list.useQuery(
    {},
    { enabled: activeTab === "reviews", retry: false }
  );
  const { data: logsData, isLoading: logLoading, error: logError } = trpc.salon.getLogs.useQuery(
    {},
    { enabled: activeTab === "activities", retry: false }
  );

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-black pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">غير مصرح</h1>
            <p className="text-gray-400 mb-4">ليس لديك صلاحية للوصول لهذه الصفحة</p>
            <Link to="/">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">العودة للرئيسية</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { title: "الإيرادات الكلية", value: `${adminStats?.totalRevenue || 0} ج.م`, icon: DollarSign, color: "text-amber-400" },
    { title: "إيرادات اليوم", value: `${adminStats?.todayRevenue || 0} ج.م`, icon: DollarSign, color: "text-green-400" },
    { title: "عدد العملاء", value: adminStats?.totalClients || 0, icon: Users, color: "text-blue-400" },
    { title: "الزيارات الفعلية", value: adminStats?.totalVisits || 0, icon: TrendingUp, color: "text-green-400" },
    { title: "إجمالي الحجوزات", value: adminStats?.totalBookings || 0, icon: Calendar, color: "text-purple-400" },
    { title: "حجوزات اليوم", value: adminStats?.todayBookings || 0, icon: Calendar, color: "text-amber-400" },
    { title: "حجوزات معلقة", value: adminStats?.pendingBookings || 0, icon: Calendar, color: "text-yellow-400" },
  ];

  const PIE_COLORS: Record<string, string> = {
    pending: "#eab308",
    confirmed: "#3b82f6",
    completed: "#22c55e",
    cancelled: "#ef4444",
    no_show: "#6b7280",
  };
  const PIE_LABELS: Record<string, string> = {
    pending: "معلق",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغي",
    no_show: "لم يحضر",
  };

  const revenueChartConfig = {
    revenue: { label: "الإيرادات", color: "#f59e0b" },
  };

  const bookingChartConfig = {
    pending: { label: "معلق", color: "#eab308" },
    confirmed: { label: "مؤكد", color: "#3b82f6" },
    completed: { label: "مكتمل", color: "#22c55e" },
    cancelled: { label: "ملغي", color: "#ef4444" },
    no_show: { label: "لم يحضر", color: "#6b7280" },
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">لوحة التحكم</h1>
              <p className="text-gray-400">إدارة صالون الملوك</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm">{user?.role}</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="bg-zinc-900 border border-amber-500/10 mb-6 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <BarChart3 className="w-4 h-4 ml-1" /><span className="hidden sm:inline">الرئيسية</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Calendar className="w-4 h-4 ml-1" /><span className="hidden sm:inline">الحجوزات</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Scissors className="w-4 h-4 ml-1" /><span className="hidden sm:inline">الخدمات</span>
              </TabsTrigger>
              <TabsTrigger value="barbers" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Users className="w-4 h-4 ml-1" /><span className="hidden sm:inline">الحلاقين</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <ShoppingBag className="w-4 h-4 ml-1" /><span className="hidden sm:inline">المتجر</span>
              </TabsTrigger>
              <TabsTrigger value="packages" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Crown className="w-4 h-4 ml-1" /><span className="hidden sm:inline">الباقات</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Tag className="w-4 h-4 ml-1" /><span className="hidden sm:inline">العروض</span>
              </TabsTrigger>
              <TabsTrigger value="affiliates" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <DollarSign className="w-4 h-4 ml-1" /><span className="hidden sm:inline">العمولات</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Users className="w-4 h-4 ml-1" /><span className="hidden sm:inline">المستخدمين</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <ShoppingBag className="w-4 h-4 ml-1" /><span className="hidden sm:inline">الطلبات</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <DollarSign className="w-4 h-4 ml-1" /><span className="hidden sm:inline">المدفوعات</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <Star className="w-4 h-4 ml-1" /><span className="hidden sm:inline">التقييمات</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-amber-500 text-white data-[state=active]:text-black">
                <BarChart3 className="w-4 h-4 ml-1" /><span className="hidden sm:inline">النشاطات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              {dashLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[1,2,3,4,5,6,7].map((i) => (
                    <div key={i} className="bg-zinc-900/50 border border-amber-500/10 rounded-2xl p-6 animate-pulse">
                      <div className="h-4 bg-zinc-800 rounded w-2/3 mb-3" />
                      <div className="h-8 bg-zinc-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : dashError ? (
                <div className="bg-zinc-900/50 border border-red-500/20 rounded-2xl p-6 text-center mb-8">
                  <p className="text-red-400">فشل تحميل الإحصائيات</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statCards.map((card, i) => (
                    <Card key={i} className="bg-zinc-900/50 border-amber-500/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                            <p className="text-3xl font-black text-white">{card.value}</p>
                          </div>
                          <card.icon className={`w-10 h-10 ${card.color} opacity-50`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue chart */}
                <Card className="bg-zinc-900/50 border-amber-500/10">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold mb-4">الإيرادات (آخر 30 يوم)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={adminStats?.revenueByDay || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || ""} />
                          <YAxis stroke="#a1a1aa" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#f59e0b20", borderRadius: "12px" }} labelFormatter={(v) => `التاريخ: ${v}`} formatter={(v: any) => [`${v} ج.م`, "الإيرادات"]} />
                          <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Booking status pie chart */}
                <Card className="bg-zinc-900/50 border-amber-500/10">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold mb-4">توزيع الحجوزات</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={(adminStats?.bookingByStatus || []).filter((b: any) => b.count > 0)} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }: any) => `${PIE_LABELS[status] || status}: ${count}`}>
                            {(adminStats?.bookingByStatus || []).filter((b: any) => b.count > 0).map((entry: any) => (
                              <Cell key={entry.status} fill={PIE_COLORS[entry.status] || "#6b7280"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6 items-end">
                <div>
                  <label className="text-gray-400 text-xs block mb-1">الحالة</label>
                  <Select value={bkgStatus} onValueChange={(v) => { setBkgStatus(v); utils.booking.list.invalidate(); }}>
                    <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white w-32"><SelectValue placeholder="الكل" /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                      <SelectItem value="">الكل</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="confirmed">مؤكد</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                      <SelectItem value="no_show">لم يحضر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">من تاريخ</label>
                  <input type="date" value={bkgDateFrom} onChange={(e) => { setBkgDateFrom(e.target.value); utils.booking.list.invalidate(); }} className="bg-zinc-800 border border-amber-500/20 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1">إلى تاريخ</label>
                  <input type="date" value={bkgDateTo} onChange={(e) => { setBkgDateTo(e.target.value); utils.booking.list.invalidate(); }} className="bg-zinc-800 border border-amber-500/20 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              {bkgLoading ? <LoadingSkeleton /> : bkgError ? <ErrorBox message="فشل تحميل الحجوزات" /> : <AdminBookingsTable bookings={bookings} />}
            </TabsContent>

            <TabsContent value="services">
              {svcLoading ? <LoadingSkeleton /> : svcError ? <ErrorBox message="فشل تحميل الخدمات" /> : <AdminServices services={servicesData} utils={utils} />}
            </TabsContent>

            <TabsContent value="barbers">
              {brbLoading ? <LoadingSkeleton /> : brbError ? <ErrorBox message="فشل تحميل الحلاقين" /> : <AdminBarbers barbers={barbersData} utils={utils} />}
            </TabsContent>

            <TabsContent value="shop">
              {prdLoading ? <LoadingSkeleton /> : prdError ? <ErrorBox message="فشل تحميل المنتجات" /> : <AdminProducts products={productsData} utils={utils} />}
            </TabsContent>

            <TabsContent value="packages">
              {pkgLoading ? <LoadingSkeleton /> : pkgError ? <ErrorBox message="فشل تحميل الباقات" /> : <AdminPackages packages={packagesData} utils={utils} />}
            </TabsContent>

            <TabsContent value="offers">
              {ofrLoading ? <LoadingSkeleton /> : ofrError ? <ErrorBox message="فشل تحميل العروض" /> : <AdminOffers offers={offersData} utils={utils} />}
            </TabsContent>

            <TabsContent value="affiliates">
              {affLoading ? <LoadingSkeleton /> : affError ? <ErrorBox message="فشل تحميل المسوقين" /> : <AdminAffiliates affiliates={affiliatesData} utils={utils} />}
            </TabsContent>

            <TabsContent value="users">
              {usrLoading ? <LoadingSkeleton /> : usrError ? <ErrorBox message="فشل تحميل المستخدمين" /> : <AdminUsers users={usersData} utils={utils} />}
            </TabsContent>

            <TabsContent value="orders">
              {ordLoading ? <LoadingSkeleton /> : ordError ? <ErrorBox message="فشل تحميل الطلبات" /> : <AdminOrders orders={ordersData} utils={utils} />}
            </TabsContent>

            <TabsContent value="payments">
              {payLoading ? <LoadingSkeleton /> : payError ? <ErrorBox message="فشل تحميل المدفوعات" /> : <AdminPayments payments={paymentsData} utils={utils} />}
            </TabsContent>

            <TabsContent value="reviews">
              {revLoading ? <LoadingSkeleton /> : revError ? <ErrorBox message="فشل تحميل التقييمات" /> : <AdminReviews reviews={reviewsData} utils={utils} />}
            </TabsContent>

            <TabsContent value="activities">
              {logLoading ? <LoadingSkeleton /> : logError ? <ErrorBox message="فشل تحميل النشاطات" /> : <AdminActivityLogs logs={logsData} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map((i) => (
        <div key={i} className="bg-zinc-900/50 border border-amber-500/10 rounded-2xl p-6 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-2/3 mb-3" />
          <div className="h-8 bg-zinc-800 rounded w-1/2 mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-full" />
        </div>
      ))}
    </div>
  );
}
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-zinc-900/50 border border-red-500/20 rounded-2xl p-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}

// ──────────── Bookings ────────────
function AdminBookingsTable({ bookings }: { bookings?: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">إدارة الحجوزات</h2>
      {bookings?.map((booking) => (
        <Card key={booking.id} className="bg-zinc-900/50 border-amber-500/10">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold">{booking.service?.name || "خدمة"}</h3>
                <p className="text-gray-400 text-sm">{booking.barber?.name || "أي حلاق"} - {booking.user?.name || "ضيف"}</p>
                <p className="text-gray-500 text-xs mt-1">{new Date(booking.bookingDate).toLocaleDateString("ar-SA")} - {booking.bookingTime}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">{booking.totalAmount} ج.م</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  booking.status === "completed" ? "bg-green-500/20 text-green-400" :
                  booking.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                  booking.status === "confirmed" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
                }`}>{booking.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────── Services CRUD ────────────
function AdminServices({ services, utils }: { services?: any[]; utils: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", description: "", price: "", duration: 30, category: "haircut", isHomeService: false, homeServiceFee: "" });

  const createMutation = trpc.service.create.useMutation({
    onSuccess: () => { utils.service.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تمت إضافة الخدمة"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.service.update.useMutation({
    onSuccess: () => { utils.service.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تم تحديث الخدمة"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.service.delete.useMutation({
    onSuccess: () => { utils.service.list.invalidate(); setDeleteId(null); toast.success("تم حذف الخدمة"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() { setForm({ name: "", nameEn: "", description: "", price: "", duration: 30, category: "haircut", isHomeService: false, homeServiceFee: "" }); setEditItem(null); }

  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(item: any) {
    setEditItem(item);
    setForm({ name: item.name, nameEn: item.nameEn || "", description: item.description || "", price: item.price, duration: item.duration, category: item.category, isHomeService: item.isHomeService || false, homeServiceFee: item.homeServiceFee || "" });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">إدارة الخدمات</h2>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />إضافة خدمة
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services?.map((service) => (
          <Card key={service.id} className="bg-zinc-900/50 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">{service.name}</h3>
                  <p className="text-gray-400 text-sm">{service.category} - {service.duration} دقيقة</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{service.price} ج.م</span>
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(service)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(service.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle>
            <DialogDescription className="text-gray-400">أدخل بيانات الخدمة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم الخدمة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="الاسم بالإنجليزية" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Textarea placeholder="وصف الخدمة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="السعر" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="المدة (بالدقائق)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white"><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                <SelectItem value="haircut">حلاقة</SelectItem>
                <SelectItem value="beard">لحية</SelectItem>
                <SelectItem value="skincare">عناية بالبشرة</SelectItem>
                <SelectItem value="bath">حمام</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input type="checkbox" checked={form.isHomeService} onChange={(e) => setForm({ ...form, isHomeService: e.target.checked })} className="accent-amber-500 w-4 h-4" />
              <span>خدمة منزلية</span>
            </label>
            {form.isHomeService && (
              <Input placeholder="رسوم الخدمة المنزلية" type="number" value={form.homeServiceFee} onChange={(e) => setForm({ ...form, homeServiceFee: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                if (editItem) updateMutation.mutate({ id: editItem.id, name: form.name, nameEn: form.nameEn || undefined, description: form.description || undefined, price: form.price, duration: form.duration, category: form.category as any, isHomeService: form.isHomeService, homeServiceFee: form.isHomeService ? form.homeServiceFee : undefined });
                else createMutation.mutate({ name: form.name, nameEn: form.nameEn || undefined, description: form.description || undefined, price: form.price, duration: form.duration, category: form.category as any, isHomeService: form.isHomeService, homeServiceFee: form.isHomeService ? form.homeServiceFee : undefined });
              }}>
              {editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">هل أنت متأكد من حذف هذه الخدمة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-400">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate({ id: deleteId! })}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────── Barbers CRUD ────────────
function AdminBarbers({ barbers, utils }: { barbers?: any[]; utils: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", specialization: "", bio: "", phone: "", email: "", password: "", salaryType: "fixed", salaryAmount: "0" });

  const createMutation = trpc.barber.create.useMutation({ onSuccess: () => { utils.barber.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تمت إضافة الحلاق"); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.barber.update.useMutation({ onSuccess: () => { utils.barber.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تم تحديث بيانات الحلاق"); }, onError: (e) => toast.error(e.message) });
  const deleteMutation = trpc.barber.delete.useMutation({ onSuccess: () => { utils.barber.list.invalidate(); setDeleteId(null); toast.success("تم حذف الحلاق"); }, onError: (e) => toast.error(e.message) });

  function resetForm() { setForm({ name: "", nameEn: "", specialization: "", bio: "", phone: "", email: "", password: "", salaryType: "fixed", salaryAmount: "0" }); setEditItem(null); }
  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(item: any) { setEditItem(item); setForm({ name: item.name, nameEn: item.nameEn || "", specialization: item.specialization || "", bio: item.bio || "", phone: item.phone || "", email: item.email || "", password: "", salaryType: item.salaryType || "fixed", salaryAmount: item.salaryAmount || "0" }); setDialogOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">إدارة الحلاقين</h2>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />إضافة حلاق
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barbers?.map((barber) => (
          <Card key={barber.id} className="bg-zinc-900/50 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  {barber.image ? <img src={barber.image} alt={barber.name} className="w-full h-full rounded-full object-cover" /> : <Users className="w-6 h-6 text-black" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">{barber.name}</h3>
                  <p className="text-amber-400 text-sm">{barber.specialization}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-gray-400 text-xs">{barber.rating} ({barber.totalReviews})</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(barber)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(barber.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل بيانات الحلاق" : "إضافة حلاق جديد"}</DialogTitle>
            <DialogDescription className="text-gray-400">أدخل بيانات الحلاق</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="الاسم بالإنجليزية" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="التخصص" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Textarea placeholder="نبذة تعريفية" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="البريد الإلكتروني (لإنشاء حساب)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            {!editItem && <Input placeholder="كلمة المرور (اختياري)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />}
            <Select value={form.salaryType} onValueChange={(v) => setForm({ ...form, salaryType: v })}>
              <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white"><SelectValue placeholder="نوع الراتب" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                <SelectItem value="fixed">ثابت</SelectItem>
                <SelectItem value="hourly">ساعي</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="قيمة الراتب" type="number" value={form.salaryAmount} onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                try {
                  if (!form.name?.trim()) { toast.error("يرجى إدخال اسم الحلاق"); return }
                  if (editItem) updateMutation.mutate({ id: editItem.id, name: form.name, nameEn: form.nameEn || undefined, specialization: form.specialization || undefined, bio: form.bio || undefined, phone: form.phone || undefined, salaryType: form.salaryType as any, salaryAmount: form.salaryAmount });
                  else createMutation.mutate({ name: form.name, nameEn: form.nameEn || undefined, specialization: form.specialization || undefined, bio: form.bio || undefined, phone: form.phone || undefined, email: form.email || undefined, password: form.password || undefined, salaryType: form.salaryType as any, salaryAmount: form.salaryAmount });
                } catch (err) { toast.error(err instanceof Error ? err.message : "حدث خطأ غير متوقع"); }
              }}>
              {editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">هل أنت متأكد من حذف هذا الحلاق؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-400">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate({ id: deleteId! })}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────── Products CRUD ────────────
function AdminProducts({ products, utils }: { products?: any[]; utils: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", description: "", price: "", stock: 0, category: "", image: "" });
  const [imageFile, setImageFile] = useState<{ fileName: string; base64: string } | null>(null);

  const createMutation = trpc.product.create.useMutation({ onSuccess: () => { utils.product.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تمت إضافة المنتج"); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.product.update.useMutation({ onSuccess: () => { utils.product.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تم تحديث المنتج"); }, onError: (e) => toast.error(e.message) });
  const deleteMutation = trpc.product.delete.useMutation({ onSuccess: () => { utils.product.list.invalidate(); setDeleteId(null); toast.success("تم حذف المنتج"); }, onError: (e) => toast.error(e.message) });
  const uploadMutation = trpc.upload.productImage.useMutation({ onError: (e) => toast.error("فشل رفع الصورة: " + e.message) });

  function resetForm() { setForm({ name: "", nameEn: "", description: "", price: "", stock: 0, category: "", image: "" }); setEditItem(null); setImageFile(null); }
  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(item: any) { setEditItem(item); setForm({ name: item.name, nameEn: item.nameEn || "", description: item.description || "", price: item.price, stock: item.stock || 0, category: item.category, image: item.image || "" }); setDialogOpen(true); }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile({ fileName: file.name, base64: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    try {
      let imageUrl = form.image;
      if (imageFile) {
        const res = await uploadMutation.mutateAsync(imageFile);
        imageUrl = res.url;
      }
      if (editItem) {
        updateMutation.mutate({ id: editItem.id, name: form.name, nameEn: form.nameEn || undefined, description: form.description || undefined, price: form.price, stock: form.stock, category: form.category, image: imageUrl || undefined });
      } else {
        createMutation.mutate({ name: form.name, nameEn: form.nameEn || undefined, description: form.description || undefined, price: form.price, stock: form.stock, category: form.category, image: imageUrl || undefined });
      }
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء الحفظ");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">إدارة المنتجات</h2>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />إضافة منتج
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="bg-zinc-900/50 border-amber-500/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 h-24 bg-zinc-800 flex-shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold">{product.name}</h3>
                    <p className="text-gray-400 text-sm">{product.category} - المخزون: {product.stock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">{product.price} ج.م</span>
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(product)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(product.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
            <DialogDescription className="text-gray-400">أدخل بيانات المنتج</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Image upload */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 border border-amber-500/20">
                {imageFile ? (
                  <img src={imageFile.base64} alt="preview" className="w-full h-full object-cover" />
                ) : form.image ? (
                  <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-amber-500/20 rounded-lg text-amber-400 hover:bg-zinc-700 text-sm">
                  <Upload className="w-4 h-4" />اختر صورة
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
              {(imageFile || form.image) && (
                <button className="text-xs text-red-400 hover:text-red-300" onClick={() => { setImageFile(null); setForm({ ...form, image: "" }); }}>
                  إزالة
                </button>
              )}
            </div>
            <Input placeholder="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="الاسم بالإنجليزية" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Textarea placeholder="وصف المنتج" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="السعر" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="المخزون" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="التصنيف" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
              onClick={handleSave}>
              {uploadMutation.isPending ? "جاري رفع الصورة..." : createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">هل أنت متأكد من حذف هذا المنتج؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-400">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate({ id: deleteId! })}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────── Offers CRUD ────────────
function AdminOffers({ offers, utils }: { offers?: any[]; utils: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", discountType: "percentage", discountValue: "", maxDiscount: "", minOrderAmount: "0", usageLimit: 100, perUserLimit: 1, startDate: "", endDate: "" });

  const createMutation = trpc.offer.create.useMutation({ onSuccess: () => { utils.offer.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تمت إضافة العرض"); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.offer.update.useMutation({ onSuccess: () => { utils.offer.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تم تحديث العرض"); }, onError: (e) => toast.error(e.message) });
  const deleteMutation = trpc.offer.delete.useMutation({ onSuccess: () => { utils.offer.list.invalidate(); setDeleteId(null); toast.success("تم حذف العرض"); }, onError: (e) => toast.error(e.message) });

  function resetForm() { setForm({ code: "", name: "", description: "", discountType: "percentage", discountValue: "", maxDiscount: "", minOrderAmount: "0", usageLimit: 100, perUserLimit: 1, startDate: "", endDate: "" }); setEditItem(null); }
  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(item: any) {
    setEditItem(item);
    setForm({
      code: item.code, name: item.name, description: item.description || "", discountType: item.discountType, discountValue: item.discountValue,
      maxDiscount: item.maxDiscount || "", minOrderAmount: item.minOrderAmount || "0", usageLimit: item.usageLimit || 100, perUserLimit: item.perUserLimit || 1,
      startDate: item.startDate, endDate: item.endDate,
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">إدارة العروض</h2>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />إضافة عرض
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers?.map((offer) => (
          <Card key={offer.id} className="bg-zinc-900/50 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">{offer.name}</h3>
                  <p className="text-amber-400 text-sm font-mono">كود: {offer.code}</p>
                  <p className="text-gray-400 text-xs">{offer.discountType === "percentage" ? `${offer.discountValue}%` : `${offer.discountValue} ج.م`} خصم</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(offer)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(offer.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل العرض" : "إضافة عرض جديد"}</DialogTitle>
            <DialogDescription className="text-gray-400">أدخل بيانات العرض</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="كود العرض" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="اسم العرض" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Textarea placeholder="وصف العرض" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
              <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white"><SelectValue placeholder="نوع الخصم" /></SelectTrigger>
              <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                <SelectItem value="percentage">نسبة مئوية</SelectItem>
                <SelectItem value="fixed">قيمة ثابتة</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="قيمة الخصم" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="أقصى خصم" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="أقل قيمة للطلب" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="حد الاستخدام" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="تاريخ البداية" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="تاريخ النهاية" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                if (editItem) updateMutation.mutate({ id: editItem.id, code: form.code, name: form.name, description: form.description || undefined, discountType: form.discountType as any, discountValue: form.discountValue, maxDiscount: form.maxDiscount || undefined, minOrderAmount: form.minOrderAmount, usageLimit: form.usageLimit, perUserLimit: form.perUserLimit, startDate: form.startDate, endDate: form.endDate });
                else createMutation.mutate({ code: form.code, name: form.name, description: form.description || undefined, discountType: form.discountType as any, discountValue: form.discountValue, maxDiscount: form.maxDiscount || undefined, minOrderAmount: form.minOrderAmount, usageLimit: form.usageLimit, perUserLimit: form.perUserLimit, startDate: form.startDate, endDate: form.endDate });
              }}>
              {editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">هل أنت متأكد من حذف هذا العرض؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-400">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate({ id: deleteId! })}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────── Packages CRUD ────────────
function AdminPackages({ packages: packagesData, utils }: { packages?: any[]; utils: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", nameEn: "", description: "", originalPrice: "", discountedPrice: "", discountPercent: 0, duration: 60, isVip: false });

  const createMutation = trpc.package.create.useMutation({ onSuccess: () => { utils.package.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تمت إضافة الباقة"); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.package.update.useMutation({ onSuccess: () => { utils.package.list.invalidate(); setDialogOpen(false); resetForm(); toast.success("تم تحديث الباقة"); }, onError: (e) => toast.error(e.message) });
  const deleteMutation = trpc.package.delete.useMutation({ onSuccess: () => { utils.package.list.invalidate(); setDeleteId(null); toast.success("تم حذف الباقة"); }, onError: (e) => toast.error(e.message) });

  function resetForm() { setForm({ name: "", nameEn: "", description: "", originalPrice: "", discountedPrice: "", discountPercent: 0, duration: 60, isVip: false }); setEditItem(null); }
  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(item: any) { setEditItem(item); setForm({ name: item.name, nameEn: item.nameEn || "", description: item.description || "", originalPrice: item.originalPrice, discountedPrice: item.discountedPrice, discountPercent: item.discountPercent || 0, duration: item.duration, isVip: item.isVip || false }); setDialogOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">إدارة الباقات</h2>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />إضافة باقة
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packagesData?.map((pkg) => (
          <Card key={pkg.id} className="bg-zinc-900/50 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">{pkg.name}</h3>
                  <p className="text-gray-400 text-sm">السعر: {pkg.discountedPrice} ج.م بدل {pkg.originalPrice} ج.م</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(pkg)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(pkg.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل الباقة" : "إضافة باقة جديدة"}</DialogTitle>
            <DialogDescription className="text-gray-400">أدخل بيانات الباقة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم الباقة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="الاسم بالإنجليزية" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Textarea placeholder="وصف الباقة" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="السعر الأصلي" type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="السعر بعد الخصم" type="number" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="نسبة الخصم (%)" type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="المدة (بالدقائق)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} className="accent-amber-500 w-4 h-4" />
              <span>باقة VIP</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                if (editItem) updateMutation.mutate({ id: editItem.id, name: form.name, nameEn: form.nameEn || undefined, description: form.description || undefined, originalPrice: form.originalPrice, discountedPrice: form.discountedPrice, discountPercent: form.discountPercent, duration: form.duration, isVip: form.isVip, serviceIds: editItem.serviceIds || [] });
                else createMutation.mutate({ name: form.name, nameEn: form.nameEn || undefined, description: form.description || undefined, originalPrice: form.originalPrice, discountedPrice: form.discountedPrice, discountPercent: form.discountPercent, duration: form.duration, isVip: form.isVip, serviceIds: [] });
              }}>
              {editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">هل أنت متأكد من حذف هذه الباقة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-400">إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate({ id: deleteId! })}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ──────────── Users ────────────
function AdminUsers({ users, utils }: { users?: any[]; utils: any }) {
  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => { utils.user.list.invalidate(); toast.success("تم تحديث الصلاحية"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">إدارة المستخدمين</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-amber-500/10 text-gray-400 text-sm">
              <th className="p-3">#</th>
              <th className="p-3">الاسم</th>
              <th className="p-3">البريد</th>
              <th className="p-3">الهاتف</th>
              <th className="p-3">الصلاحية</th>
              <th className="p-3">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="p-3 text-white">{u.id}</td>
                <td className="p-3 text-white">{u.name}</td>
                <td className="p-3 text-gray-400">{u.email || "-"}</td>
                <td className="p-3 text-gray-400">{u.phone || "-"}</td>
                <td className="p-3">
                  <Select value={u.role} onValueChange={(v) => updateRole.mutate({ id: u.id, role: v as any })}>
                    <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                      <SelectItem value="user">مستخدم</SelectItem>
                      <SelectItem value="barber">حلاق</SelectItem>
                      <SelectItem value="manager">مدير</SelectItem>
                      <SelectItem value="admin">إدمن</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────── Orders ────────────
function AdminOrders({ orders, utils }: { orders?: any[]; utils: any }) {
  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => { utils.order.list.invalidate(); toast.success("تم تحديث حالة الطلب"); },
    onError: (e) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    shipped: "bg-purple-500/20 text-purple-400",
    delivered: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">إدارة الطلبات</h2>
      {orders?.map((order) => (
        <Card key={order.id} className="bg-zinc-900/50 border-amber-500/10">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-white font-bold">طلب #{order.id}</p>
                <p className="text-amber-400">{order.totalAmount} ج.م</p>
                <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v as any })}>
                  <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="processing">قيد التجهيز</SelectItem>
                    <SelectItem value="shipped">تم الشحن</SelectItem>
                    <SelectItem value="delivered">تم التوصيل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || ""}`}>
                  {order.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────── Payments ────────────
function AdminPayments({ payments, utils }: { payments?: any[]; utils: any }) {
  const updateStatus = trpc.payment.updateStatus.useMutation({
    onSuccess: () => { utils.payment.list.invalidate(); toast.success("تم تحديث حالة الدفع"); },
    onError: (e) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    refunded: "bg-purple-500/20 text-purple-400",
  };

  const methodLabels: Record<string, string> = {
    cash: "نقدي",
    card: "بطاقة",
    vodafone_cash: "فودافون كاش",
    wallet: "محفظة",
    apple_pay: "Apple Pay",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">إدارة المدفوعات</h2>
      {payments?.map((p) => (
        <Card key={p.id} className="bg-zinc-900/50 border-amber-500/10">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-white font-bold">دفع #{p.id}</p>
                <p className="text-amber-400">{p.amount} ج.م</p>
                <p className="text-gray-400 text-xs">{methodLabels[p.paymentMethod] || p.paymentMethod}</p>
                <p className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={p.status} onValueChange={(v) => updateStatus.mutate({ id: p.id, status: v as any })}>
                  <SelectTrigger className="bg-zinc-800 border-amber-500/20 text-white h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-amber-500/20 text-white">
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="failed">فشل</SelectItem>
                    <SelectItem value="refunded">مسترجع</SelectItem>
                  </SelectContent>
                </Select>
                {p.receiptImage && (
                  <a href={p.receiptImage} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 text-xs underline">إيصال</a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────── Reviews ────────────
function AdminReviews({ reviews, utils }: { reviews?: any[]; utils: any }) {
  const toggleVis = trpc.review.toggleVisibility.useMutation({
    onSuccess: () => { utils.review.list.invalidate(); toast.success("تم تغيير حالة التقييم"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">إدارة التقييمات</h2>
      {reviews?.map((r) => (
        <Card key={r.id} className={`bg-zinc-900/50 border-amber-500/10 ${!r.isVisible ? "opacity-50" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400">{Array.from({ length: 5 }, (_, i) => (i < r.rating ? "★" : "☆")).join("")}</span>
                  <span className="text-white text-sm">({r.rating}/5)</span>
                </div>
                <p className="text-gray-300 text-sm">{r.comment || "لا يوجد تعليق"}</p>
                <p className="text-gray-500 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${r.isVisible ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {r.isVisible ? "ظاهر" : "مخفي"}
                </span>
                <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300" onClick={() => toggleVis.mutate({ id: r.id })}>
                  {r.isVisible ? "إخفاء" : "إظهار"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────── Activity Logs ────────────
function AdminActivityLogs({ logs }: { logs?: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">سجل النشاطات</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-amber-500/10 text-gray-400 text-sm">
              <th className="p-3">التاريخ</th>
              <th className="p-3">الإجراء</th>
              <th className="p-3">الكيان</th>
              <th className="p-3">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="p-3 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleDateString("ar-SA")} {new Date(log.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</td>
                <td className="p-3 text-white">{log.action}</td>
                <td className="p-3 text-amber-400">{log.entity}{log.entityId ? ` #${log.entityId}` : ""}</td>
                <td className="p-3 text-gray-400 text-xs max-w-xs truncate">{log.details || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────── Affiliates CRUD ────────────
function AdminAffiliates({ affiliates, utils }: { affiliates?: any[]; utils: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ userId: 0, code: "", commissionRate: 10 });

  const createMutation = trpc.admin.createAffiliate.useMutation({ onSuccess: () => { utils.admin.listAffiliates.invalidate(); setDialogOpen(false); resetForm(); toast.success("تمت إضافة المسوق"); }, onError: (e) => toast.error(e.message) });
  const updateMutation = trpc.admin.updateAffiliate.useMutation({ onSuccess: () => { utils.admin.listAffiliates.invalidate(); setDialogOpen(false); resetForm(); toast.success("تم تحديث بيانات المسوق"); }, onError: (e) => toast.error(e.message) });

  function resetForm() { setForm({ userId: 0, code: "", commissionRate: 10 }); setEditItem(null); }
  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(item: any) { setEditItem(item); setForm({ userId: item.userId, code: item.code, commissionRate: item.commissionRate }); setDialogOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">نظام العمولات والإحالة</h2>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={openCreate}>
          <Plus className="w-4 h-4 ml-1" />إضافة مسوق
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {affiliates?.map((aff) => (
          <Card key={aff.id} className="bg-zinc-900/50 border-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">كود: {aff.code}</h3>
                  <p className="text-amber-400 text-sm font-mono">النسبة: {aff.commissionRate}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">{aff.totalEarnings} ج.م مكتسبة</span>
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(aff)}><Edit className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle>{editItem ? "تعديل المسوق" : "إضافة مسوق جديد"}</DialogTitle>
            <DialogDescription className="text-gray-400">أدخل بيانات المسوق</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="معرف المستخدم" type="number" value={form.userId} onChange={(e) => setForm({ ...form, userId: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="كود الإحالة" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="bg-zinc-800 border-amber-500/20 text-white" />
            <Input placeholder="نسبة العمولة (%)" type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} className="bg-zinc-800 border-amber-500/20 text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 border-amber-500/30 text-amber-400" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                if (editItem) updateMutation.mutate({ id: editItem.id, code: form.code, commissionRate: form.commissionRate });
                else createMutation.mutate({ userId: form.userId, code: form.code, commissionRate: form.commissionRate });
              }}>
              {editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}