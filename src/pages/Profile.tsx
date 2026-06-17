import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Calendar,
  Star,
  Crown,
  Gift,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  HourglassIcon,
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const userId = user?.id;

  const { data: bookings } = trpc.booking.myBookings.useQuery(undefined, {
    enabled: !!userId,
  });
  const { data: loyalty } = trpc.loyalty.myPoints.useQuery(undefined, {
    enabled: !!userId,
  });
  const { data: notifications } = trpc.notification.myNotifications.useQuery(
    undefined,
    { enabled: !!userId }
  );

  const markRead = trpc.notification.markAsRead.useMutation();
  const markAllRead = trpc.notification.markAllRead.useMutation();

  const statusIcons = {
    pending: <HourglassIcon className="w-4 h-4 text-yellow-400" />,
    confirmed: <CheckCircle className="w-4 h-4 text-green-400" />,
    completed: <CheckCircle className="w-4 h-4 text-blue-400" />,
    cancelled: <XCircle className="w-4 h-4 text-red-400" />,
    no_show: <XCircle className="w-4 h-4 text-gray-400" />,
  };

  const statusLabels = {
    pending: "معلق",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغي",
    no_show: "لم يحضر",
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile Header */}
          <div className="bg-zinc-900/50 rounded-3xl border border-amber-500/10 p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || ""}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-black" />
                )}
              </div>
              <div className="text-center md:text-right flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user?.name || "مستخدم"}
                </h1>
                <p className="text-gray-400">{user?.email}</p>
                <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
                  <span className="flex items-center gap-1 text-amber-400 text-sm">
                    <Crown className="w-4 h-4" />
                    {loyalty?.total || 0} نقطة ولاء
                  </span>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="bookings" dir="rtl">
            <TabsList className="bg-zinc-900 border border-amber-500/10 mb-6">
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
              >
                <Calendar className="w-4 h-4 ml-2" />
                حجوزاتي
              </TabsTrigger>
              <TabsTrigger
                value="loyalty"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
              >
                <Star className="w-4 h-4 ml-2" />
                نقاط الولاء
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
              >
                <Gift className="w-4 h-4 ml-2" />
                الإشعارات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <div className="space-y-4">
                {bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className="bg-zinc-900/50 border-amber-500/10"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold">
                                {booking.service?.name || "خدمة"}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {booking.barber?.name || "أي حلاق"}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(booking.bookingDate).toLocaleDateString(
                                  "ar-SA"
                                )}{" "}
                                - {booking.bookingTime}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-amber-400 font-bold">
                              {booking.totalAmount} ج.م
                            </span>
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 text-sm">
                              {statusIcons[booking.status]}
                              <span className="text-gray-300">
                                {statusLabels[booking.status]}
                              </span>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">لا توجد حجوزات</p>
                    <Link to="/booking">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                        احجز موعداً الآن
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="loyalty">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900/50 border-amber-500/10">
                  <CardHeader>
                    <CardTitle className="text-amber-400 flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      النقاط المتاحة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white">
                      {loyalty?.total || 0}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">نقطة</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-amber-500/10">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      النقاط المكتسبة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white">
                      {loyalty?.earned || 0}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">نقطة</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-amber-500/10">
                  <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      النقاط المستبدلة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white">
                      {loyalty?.redeemed || 0}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">نقطة</p>
                  </CardContent>
                </Card>
              </div>

              {loyalty?.history && loyalty.history.length > 0 && (
                <Card className="bg-zinc-900/50 border-amber-500/10 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white">سجل النقاط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loyalty.history.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between py-3 border-b border-zinc-800"
                        >
                          <div>
                            <p className="text-white text-sm">
                              {entry.description}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(
                                entry.createdAt
                              ).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                          <span
                            className={`font-bold ${
                              entry.type === "earned"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {entry.type === "earned" ? "+" : "-"}
                            {entry.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-4">
                {notifications && notifications.length > 0 ? (
                  <>
                    <div className="flex justify-end mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAllRead.mutate()}
                        className="border-amber-500/30 text-amber-400"
                      >
                        تحديد الكل كمقروء
                      </Button>
                    </div>
                    {notifications.map((notif) => (
                      <Card
                        key={notif.id}
                        className={`bg-zinc-900/50 border-amber-500/10 ${
                          !notif.isRead ? "border-amber-500/30" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4
                                className={`font-bold ${
                                  !notif.isRead
                                    ? "text-white"
                                    : "text-gray-400"
                                }`}
                              >
                                {notif.title}
                              </h4>
                              <p className="text-gray-400 text-sm mt-1">
                                {notif.message}
                              </p>
                              <p className="text-gray-500 text-xs mt-2">
                                {new Date(
                                  notif.createdAt
                                ).toLocaleDateString("ar-SA")}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  markRead.mutate({ id: notif.id })
                                }
                                className="text-amber-400 hover:text-amber-300"
                              >
                                تحديد كمقروء
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-20">
                    <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">لا توجد إشعارات</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
