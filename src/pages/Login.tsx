import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

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
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-700" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-zinc-900 px-2 text-gray-500">أو</span></div>
              </div>
              <Button variant="outline" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => window.location.href = getOAuthUrl()}>
                تسجيل عبر Kimi
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
  );
}
