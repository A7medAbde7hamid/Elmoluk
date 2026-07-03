import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Clock } from "lucide-react";

export default function Packages() {
  const { data: packages } = trpc.package.list.useQuery({});

  return (
    <Layout>
      <SEO title="الباقات والعروض" description="باقات صالون الملوك الملكية - وفر مع باقاتنا المميزة للحلاقة والعناية الكاملة." path="/packages" />
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">الباقات</h1>
            <p className="text-gray-400">اختر الباقة المناسبة لك واستمتع بأفضل الخدمات</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages?.map((pkg) => (
              <Card key={pkg.id} className={`bg-zinc-900/50 border ${pkg.isVip ? "border-amber-400" : "border-amber-500/10"} hover:border-amber-500/30 transition-all`}>
                <CardContent className="p-6 text-center">
                  {pkg.isVip && <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">VIP</span>}
                  <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{pkg.description}</p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-gray-500 line-through">{pkg.originalPrice} ج.م</span>
                    <span className="text-3xl font-bold text-amber-400">{pkg.discountedPrice} ج.م</span>
                  </div>
                  {pkg.discountPercent > 0 && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm">وفر {pkg.discountPercent}%</span>
                  )}
                  <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mt-3 mb-4">
                    <Clock className="w-4 h-4" /><span>{pkg.duration} دقيقة</span>
                  </div>
                  <Link to={`/booking?packageId=${pkg.id}`}>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black">احجز الآن</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
