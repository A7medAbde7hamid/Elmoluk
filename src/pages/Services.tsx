import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scissors, Clock, Search, ShoppingCart } from "lucide-react";

type Category = "all" | "haircut" | "beard" | "skincare" | "bath" | "other";

const categoryLabels: Record<Category, string> = {
  all: "الكل",
  haircut: "حلاقة",
  beard: "دقن",
  skincare: "بشرة",
  bath: "حمام",
  other: "أخرى",
};

export default function Services() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const { data: services, isLoading, isError } = trpc.service.list.useQuery({
    search: search || undefined,
    category: category === "all" ? undefined : category,
    isActive: true,
  });

  return (
    <Layout>
      <SEO title="خدمات الحلاقة والعناية" description="تعرف على خدمات صالون الملوك: حلاقة كاملة، تهذيب لحية، عناية بالبشرة، بخار، صبغ شعر، خدمة منزلية. احجز موعدك الآن." path="/services" />
      <BreadcrumbSchema items={[{ name: "الرئيسية", path: "/" }, { name: "الخدمات", path: "/services" }]} />
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              خدماتنا
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              مجموعة متكاملة من خدمات العناية بالرجل بأعلى معايير الجودة
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="ابحث عن خدمة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 bg-zinc-900 border-amber-500/20 text-white placeholder:text-gray-500 focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(Object.keys(categoryLabels) as Category[]).map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={
                    category === cat
                      ? "bg-amber-500 text-black hover:bg-amber-600"
                      : "border-amber-500/30 text-gray-300 hover:bg-amber-500/10 hover:text-amber-400"
                  }
                >
                  {categoryLabels[cat]}
                </Button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-zinc-900 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <p className="text-red-400">فشل تحميل الخدمات</p>
            </div>
          ) : services?.length === 0 ? (
            <div className="text-center py-20">
              <Scissors className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">لا توجد خدمات متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service) => (
                <div
                  key={service.id}
                  className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="h-52 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Scissors className="w-20 h-20 text-amber-400/20 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    {service.isHomeService && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/80 text-black text-xs font-bold rounded-full">
                        خدمة منزلية
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {service.name}
                      </h3>
                      <span className="text-amber-400 font-bold text-lg">
                        {service.price} ج.م
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {service.description || "خدمة مميزة بأعلى معايير الجودة"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration} دقيقة
                      </span>
                      <Link to={`/booking?serviceId=${service.id}`}>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-black"
                        >
                          احجز
                          <ShoppingCart className="w-4 h-4 mr-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
