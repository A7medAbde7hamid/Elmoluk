import { trpc } from "@/providers/trpc";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, Percent, Calendar } from "lucide-react";

export default function OffersPage() {
  const { data: offers } = trpc.offer.list.useQuery({});

  return (
    <Layout>
      <SEO title="العروض والكوبونات" description="عروض وخصومات صالون الملوك - كوبونات خصم وعروض حصرية على خدمات ومنتجات الحلاقة." path="/offers" />
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Tag className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">العروض والكوبونات</h1>
            <p className="text-gray-400">استفد من العروض الحصرية ووفر في زيارتك القادمة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers?.map((offer) => (
              <Card key={offer.id} className="bg-zinc-900/50 border border-amber-500/10 hover:border-amber-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{offer.name}</h3>
                      <p className="text-gray-400 text-sm">{offer.description}</p>
                    </div>
                    <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-bold">
                      {offer.discountType === "percentage" ? `${offer.discountValue}%` : `${offer.discountValue} ج.م`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{offer.startDate} - {offer.endDate}</span>
                  </div>
                  <div className="mt-3 bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="text-amber-400 font-mono text-lg font-bold">{offer.code}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!offers || offers.length === 0) && (
              <div className="col-span-2 text-center py-12">
                <Percent className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">لا توجد عروض حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
