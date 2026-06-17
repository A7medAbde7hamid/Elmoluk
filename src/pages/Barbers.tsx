import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Scissors, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Barbers() {
  const navigate = useNavigate();
  const { data: barbers, isLoading } = trpc.barber.list.useQuery({ isActive: true });
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-zinc-900/50 rounded-xl p-6 animate-pulse">
                  <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-4" />
                  <div className="h-6 bg-zinc-800 rounded w-2/3 mx-auto mb-2" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto mb-4" />
                  <div className="h-20 bg-zinc-800 rounded mb-4" />
                  <div className="h-10 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentBarber = selectedBarber 
    ? barbers?.find(b => b.id === selectedBarber) 
    : null;

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                فريق الحلاقين
              </span>
            </h1>
            <p className="text-gray-400 text-lg">نخبة من أمهر الحلاقين المحترفين لخدمتك</p>
          </div>

          {currentBarber ? (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setSelectedBarber(null)}
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300 mb-6 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                <span>العودة إلى القائمة</span>
              </button>

              <Card className="bg-zinc-900/50 border-amber-500/20 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-4xl font-bold text-black mx-auto">
                        {currentBarber.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{currentBarber.name}</h2>
                      {currentBarber.specialization && (
                        <p className="text-amber-400 font-medium mb-1">{currentBarber.specialization}</p>
                      )}
                      {currentBarber.bio && (
                        <p className="text-gray-400 mb-4">{currentBarber.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{currentBarber.rating?.toFixed(1) || "جديد"}</span>
                          <span className="text-gray-500 text-sm">({currentBarber.totalReviews || 0} تقييم)</span>
                        </div>
                        {currentBarber.phone && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Phone className="w-4 h-4" />
                            <span>{currentBarber.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => navigate(`/booking?barberId=${currentBarber.id}`)}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:from-amber-600 hover:to-amber-700"
                        >
                          احجز مع {currentBarber.name}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("/reviews")}
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                          عرض التقييمات
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbers?.map((barber) => (
                <Card
                  key={barber.id}
                  className="bg-zinc-900/50 border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedBarber(barber.id)}
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-3xl font-bold text-black mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        {barber.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold mb-1">{barber.name}</h3>
                      {barber.specialization && (
                        <p className="text-amber-400 text-sm">{barber.specialization}</p>
                      )}
                    </div>

                    {barber.bio && (
                      <p className="text-gray-400 text-sm text-center mb-4 line-clamp-2">{barber.bio}</p>
                    )}

                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm">{barber.rating?.toFixed(1) || "جديد"}</span>
                      </div>
                      <span className="text-gray-600">|</span>
                      <span className="text-sm text-gray-400">{barber.totalReviews || 0} تقييم</span>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:from-amber-600 hover:to-amber-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/booking?barberId=${barber.id}`);
                      }}
                    >
                      احجز موعد
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
