import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingCart, Search, Package, Plus, Minus, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem("salon_cart");
    return saved ? JSON.parse(saved) : {};
  });
  const saveCart = (c: Record<number, number>) => { setCart(c); localStorage.setItem("salon_cart", JSON.stringify(c)); };
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  const createOrder = trpc.order.create.useMutation({
    onSuccess: () => {
      saveCart({});
      setCheckoutOpen(false);
      setShippingAddress("");
      toast.success("تم تأكيد الطلب بنجاح");
    },
    onError: (err) => {
      toast.error(err.message || "فشل إنشاء الطلب");
    },
  });

  const { data: products, isLoading } = trpc.product.list.useQuery({
    search: search || undefined,
    isActive: true,
  });

  const addToCart = (productId: number) => {
    saveCart({ ...cart, [productId]: (cart[productId] || 0) + 1 });
    toast.success("تمت الإضافة للسلة");
  };

  const removeFromCart = (productId: number) => {
    const newCart = { ...cart };
    if (newCart[productId] > 1) newCart[productId]--;
    else delete newCart[productId];
    saveCart(newCart);
  };

  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const product = products?.find((p) => p.id === Number(id));
    return total + (product ? Number(product.price) * qty : 0);
  }, 0);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <Layout>
      <SEO title="منتجات العناية" description="تسوق منتجات العناية بالشعر والبشرة من صالون الملوك. شامبو، زيوت، كريمات ومشط خشبي." path="/shop" />
      <div className="min-h-screen bg-black pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">متجر المنتجات</h1>
            <p className="text-gray-400">منتجات العناية الشخصية بأفضل الأسعار</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 bg-zinc-900 border-amber-500/20 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                السلة
                {cartCount > 0 && (
                  <span className="mr-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
                    {cartCount}
                  </span>
                )}
              </Button>
              {cartCount > 0 && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-amber-500/20 rounded-xl p-4 shadow-xl z-50">
                  <h3 className="text-white font-bold mb-3">سلة التسوق</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(cart).map(([id, qty]) => {
                      const product = products?.find(
                        (p) => p.id === Number(id)
                      );
                      if (!product) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between py-2 border-b border-zinc-800"
                        >
                          <span className="text-gray-300 text-sm">
                            {product.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(Number(id))}
                              className="w-6 h-6 rounded-full bg-zinc-800 text-gray-400 hover:bg-amber-500 hover:text-black transition-colors flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-amber-400 font-bold w-6 text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => addToCart(Number(id))}
                              className="w-6 h-6 rounded-full bg-zinc-800 text-gray-400 hover:bg-amber-500 hover:text-black transition-colors flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-gray-400">الإجمالي</span>
                    <span className="text-amber-400 font-bold text-lg">
                      {cartTotal.toFixed(2)} ج.م
                    </span>
                  </div>
                  <Button
                    className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("يرجى تسجيل الدخول أولاً");
                        navigate("/login");
                        return;
                      }
                      setCheckoutOpen(true);
                    }}
                  >
                    إتمام الشراء
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-zinc-900 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products?.map((product) => (
                <div
                  key={product.id}
                  className="group bg-zinc-900/50 rounded-2xl border border-amber-500/10 hover:border-amber-500/30 transition-all overflow-hidden"
                >
                  <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-amber-400/20 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-bold mb-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {product.description || "منتج عالي الجودة"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold text-lg">
                        {product.price} ج.م
                      </span>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-zinc-900 border-amber-500/20 text-white">
          <DialogHeader>
            <DialogTitle>تأكيد الطلب</DialogTitle>
            <DialogDescription className="text-gray-400">
              مراجعة الطلب وإدخال عنوان التوصيل
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(cart).map(([id, qty]) => {
                const product = products?.find((p) => p.id === Number(id));
                if (!product) return null;
                return (
                  <div key={id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{product.name} × {qty}</span>
                    <span className="text-amber-400">{(Number(product.price) * qty).toFixed(2)} ج.م</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-800">
              <span className="text-white font-bold">الإجمالي</span>
              <span className="text-amber-400 font-bold text-lg">{cartTotal.toFixed(2)} ج.م</span>
            </div>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
              <textarea
                placeholder="عنوان التوصيل (اختياري)"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full bg-zinc-800 border border-amber-500/20 rounded-lg p-3 pr-10 text-white text-sm placeholder:text-gray-500 resize-none"
                rows={3}
              />
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
              disabled={createOrder.isPending}
              onClick={() => {
                const items = Object.entries(cart).map(([id, qty]) => {
                  const product = products?.find((p) => p.id === Number(id))!;
                  return {
                    productId: Number(id),
                    quantity: qty,
                    unitPrice: String(product.price),
                  };
                });
                createOrder.mutate({
                  items,
                  totalAmount: cartTotal.toFixed(2),
                  shippingAddress: shippingAddress || undefined,
                });
              }}
            >
              {createOrder.isPending ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
