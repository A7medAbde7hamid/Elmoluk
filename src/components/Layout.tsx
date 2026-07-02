import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Scissors,
  Menu,
  X,
  User,
  LogOut,
  ShoppingBag,
  Crown,
  Home,
  Calendar,
  ChevronDown,
  Shield,
  Tag,
  MessageCircle,
} from "lucide-react";
import { WhatsAppButton } from "./WhatsAppButton";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "manager";
  const isBarber = user?.role === "barber";

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/services", label: "الخدمات", icon: Scissors },
    { href: "/packages", label: "الباقات", icon: Crown },
    { href: "/booking", label: "احجز موعد", icon: Calendar },
    { href: "/shop", label: "المتجر", icon: ShoppingBag },
    { href: "/offers", label: "العروض", icon: Tag },
    { href: "/barbers", label: "الحلاقين", icon: Scissors },
    { href: "/contact", label: "اتصل بنا", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || !isHome
            ? "bg-black/95 backdrop-blur-md shadow-lg shadow-amber-900/10 border-b border-amber-500/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Crown className="w-8 h-8 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                صالون الملوك
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === link.href
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-white/80 hover:text-amber-300 hover:bg-amber-500/5"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === "/admin"
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-white/80 hover:text-amber-300 hover:bg-amber-500/5"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  لوحة التحكم
                </Link>
              )}
              {isBarber && (
                <Link
                  to="/barber"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === "/barber"
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-white/80 hover:text-amber-300 hover:bg-amber-500/5"
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  لوحة الحلاق
                </Link>
              )}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <User className="w-4 h-4" />
                      <span className="max-w-[100px] truncate">
                        {user?.name || "حسابي"}
                      </span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-zinc-900 border-amber-500/20"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 text-white/80 hover:text-amber-400 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        الملف الشخصي
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 text-white/80 hover:text-amber-400 cursor-pointer"
                        >
                          <Shield className="w-4 h-4" />
                          لوحة التحكم
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isBarber && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/barber"
                          className="flex items-center gap-2 text-white/80 hover:text-amber-400 cursor-pointer"
                        >
                          <Scissors className="w-4 h-4" />
                          لوحة الحلاق
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              ) : (
                <Link to="/login">
                  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold px-6">
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-amber-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-black/98 border-t border-amber-500/20 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-5 h-5" />
                  لوحة التحكم
                </Link>
              )}
              {isBarber && (
                <Link
                  to="/barber"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Scissors className="w-5 h-5" />
                  لوحة الحلاق
                </Link>
              )}
              <div className="border-t border-amber-500/20 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      الملف الشخصي
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500 text-black font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={isHome ? "" : "pt-20"}>{children}</main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-amber-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-8 h-8 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  صالون الملوك
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                وجهتك الأولى للعناية بالرجل. نقدم تجربة حلاقة فاخرة تجمع بين
                الأصالة والحداثة.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-400">روابط سريعة</h3>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block text-gray-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-400">تواصل معنا</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>العنوان: العاشر من رمضان - الحي العاشر 110 بجوار مستشفي العزل - خلف صيدليه احمد عبدالعال</p>
                <p>الهاتف: +20 1097314558</p>
                <p>وتساب: +20 1097314558</p>
                <p>ساعات العمل: السبت - الخميس 10 ص - 10 م</p>
                <p>الجمعة: 4 م - 8 م</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-amber-500/10 text-center text-gray-500 text-sm">
            © 2025 صالون الملوك. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
