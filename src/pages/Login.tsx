import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم تسجيل الدخول");
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("تم إنشاء الحساب");
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
      <SEO title="تسجيل الدخول" description="تسجيل الدخول إلى حسابك في صالون الملوك." path="/login" />
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-amber-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">صالون الملوك</CardTitle>
          <CardDescription className="text-gray-400">تسجيل الدخول أو إنشاء حساب</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" dir="rtl">
            <TabsList className="w-full bg-zinc-800 mb-6">
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-black">تسجيل دخول</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-black">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Input placeholder="البريد الإلكتروني" type="email" value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="bg-zinc-800 border-amber-500/20 text-white placeholder:text-gray-500" />
              <Input placeholder="كلمة المرور" type="password" value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="bg-zinc-800 border-amber-500/20 text-white placeholder:text-gray-500" />
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                disabled={loginMutation.isPending}
                onClick={() => loginMutation.mutate(loginForm)}>
                {loginMutation.isPending ? "جاري..." : "تسجيل الدخول"}
              </Button>

            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Input placeholder="الاسم" value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                className="bg-zinc-800 border-amber-500/20 text-white placeholder:text-gray-500" />
              <Input placeholder="البريد الإلكتروني" type="email" value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="bg-zinc-800 border-amber-500/20 text-white placeholder:text-gray-500" />
              <Input placeholder="رقم الهاتف (اختياري)" value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                className="bg-zinc-800 border-amber-500/20 text-white placeholder:text-gray-500" />
              <Input placeholder="كلمة المرور" type="password" value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="bg-zinc-800 border-amber-500/20 text-white placeholder:text-gray-500" />
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                disabled={registerMutation.isPending}
                onClick={() => registerMutation.mutate(registerForm)}>
                {registerMutation.isPending ? "جاري..." : "إنشاء الحساب"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
