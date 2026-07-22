import { useEffect } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import JSONLD from "@/components/JSONLD";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import {
  Scissors,
  Crown,
  Star,
  Calendar,
  Sparkles,
  Clock,
  ChevronLeft,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const { data: servicesData } = trpc.service.list.useQuery({ isActive: true });
  const { data: barbersData } = trpc.barber.list.useQuery({ isActive: true });
  const { data: packagesData } = trpc.package.list.useQuery({});

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-content",
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
      );

      gsap.utils.toArray(".animate-on-scroll").forEach((el) => {
        gsap.fromTo(
          el as HTMLElement,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: el as HTMLElement, start: "top 85%", toggleActions: "play none none none" },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  const stats = [
    { icon: Crown, value: "5000+", label: "عميل سعيد" },
    { icon: Scissors, value: "15000+", label: "حلاقة ناجحة" },
    { icon: Star, value: "4.9", label: "تقييم المتجر" },
    { icon: Clock, value: "10+", label: "سنوات خبرة" },
  ];

  return (
    <Layout>
      <SEO
        title="أفضل صالون حلاقة رجالي في العاشر من رمضان"
        description="صالون الملوك - وجهتك الأولى للعناية بالرجل في العاشر من رمضان. حجز موعد، خدمات حلاقة، عناية بالبشرة، منتجات، وباقات ملكية."
        path="/"
      />
      <JSONLD />
      <BreadcrumbSchema items={[{ name: "الرئيسية", path: "/" }]} />
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.08),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="hero-content relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">تجربة حلاقة ملكية</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">صالون</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">الملوك</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            حيث تجتمع الفخامة مع الاحترافية. اكتشف تجربة حلاقة فريدة مع نخبة من أفضل الحلاقين.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/booking">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold px-10 py-6 text-lg rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
                <Calendar className="w-5 h-5 ml-2" />
                احجز موعدك الآن
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-10 py-6 text-lg rounded-xl hover:scale-105 transition-all">
                <Scissors className="w-5 h-5 ml-2" />
                استكشف خدماتنا
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="animate-on-scroll text-center p-6 rounded-2xl bg-zinc-900/50 border border-amber-500/10 hover:border-amber-500/30 transition-all group">
                <stat.icon className="w-8 h-8 text-amber-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-black text-amber-400 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm">خدماتنا المميزة</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">اختبر الفخامة</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">مجموعة متكاملة من خدمات العناية بالرجل بأعلى معايير الجودة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesData?.slice(0, 6).map((service) => (
              <div key={service.id} className="animate-on-scroll group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                  {service.image ? (
                    <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  ) : (
                    <Scissors className="w-16 h-16 text-amber-400/30 group-hover:scale-110 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{service.description || "خدمة مميزة بأعلى معايير الجودة"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-lg">{service.price} ج.م</span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service.duration} دقيقة
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/services">
              <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-8">
                عرض جميع الخدمات
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Barbers */}
      <section className="py-20 relative bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm">فريقنا الملكي</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">نخبة الحلاقين</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">محترفون بأعلى مستويات المهارة والخبرة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {barbersData?.slice(0, 4).map((barber) => (
              <div key={barber.id} className="animate-on-scroll group text-center">
                <div className="relative mb-4 mx-auto w-48 h-48 rounded-full overflow-hidden border-2 border-amber-500/20 group-hover:border-amber-400 transition-colors">
                  {barber.image ? (
                    <img src={barber.image} alt={barber.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <Crown className="w-16 h-16 text-amber-400/30" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{barber.name}</h3>
                <p className="text-amber-400 text-sm mb-2">{barber.specialization}</p>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-gray-300 text-sm">{barber.rating}</span>
                  <span className="text-gray-500 text-xs">({barber.totalReviews} تقييم)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm">باقاتنا المميزة</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">اختر باقتك المثالية</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">باقات مصممة لتلبية جميع احتياجاتك بأفضل الأسعار</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packagesData?.slice(0, 3).map((pkg) => (
              <div key={pkg.id} className={`animate-on-scroll relative overflow-hidden rounded-2xl p-8 transition-all duration-300 ${
                pkg.isVip
                  ? "bg-gradient-to-b from-amber-500/20 to-zinc-900 border-2 border-amber-400"
                  : "bg-zinc-900/50 border border-amber-500/10 hover:border-amber-500/30"
              }`}>
                {pkg.isVip && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    VIP
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{pkg.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-black text-amber-400">{pkg.discountedPrice} ج.م</span>
                  {pkg.discountPercent > 0 && (
                    <span className="text-gray-500 line-through">{pkg.originalPrice} ج.م</span>
                  )}
                </div>
                <div className="space-y-2 mb-8">
                  {pkg.services?.map((svc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {svc?.name}
                    </div>
                  ))}
                </div>
                <Link to="/booking" className="block">
                  <Button className={`w-full ${pkg.isVip ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                    احجز الآن
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-on-scroll relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/20 p-12 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">جاهز لتجربة ملكية؟</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">احجز موعدك الآن واستمتع بتجربة حلاقة فاخرة لا مثيل لها</p>
              <Link to="/booking">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-10 py-6 text-lg rounded-xl shadow-lg shadow-amber-500/20">
                  <Calendar className="w-5 h-5 ml-2" />
                  احجز موعدك
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
