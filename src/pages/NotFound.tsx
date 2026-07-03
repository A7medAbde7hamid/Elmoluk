import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Layout } from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <SEO title="الصفحة غير موجودة" description="عذراً، الصفحة التي تبحث عنها غير موجودة." path="/404" />
      <div className="min-h-screen bg-black pt-24 pb-20 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <span className="text-5xl">🔍</span>
          </div>
          <h1 className="text-6xl font-black text-amber-400 mb-4">404</h1>
          <p className="text-2xl font-bold text-white mb-2">الصفحة غير موجودة</p>
          <p className="text-gray-400 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها</p>
          <Link to="/">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-6 text-lg font-bold rounded-xl">
              العودة إلى الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
