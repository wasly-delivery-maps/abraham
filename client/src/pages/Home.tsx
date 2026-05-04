import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2, Menu, X, Facebook, Home as HomeIcon, ShoppingBag, User, Search, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600 border-r-4 border-transparent"></div>
          <p className="text-orange-600 font-bold animate-pulse">جاري تحميل وصلي...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === "driver") {
      window.location.href = "/driver/dashboard";
    } else if (user?.role === "admin") {
      window.location.href = "/admin/dashboard";
    } else {
      window.location.href = "/customer/dashboard";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 sm:pb-0" dir="rtl">
      {/* Mobile-Style App Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-xl shadow-lg shadow-orange-200">
              <Truck className="text-white h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-[#1D2B53] leading-none">وصلي</span>
              <span className="text-[10px] font-bold text-orange-600">مدينة العبور</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-600">
              <Bell className="h-5 w-5" />
            </button>
            <Link href="/auth">
              <button className="p-2 bg-orange-600 rounded-full shadow-lg shadow-orange-200 text-white">
                <User className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Search Section */}
      <section className="pt-24 px-4 pb-6 bg-gradient-to-b from-orange-50 to-[#F8F9FB]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-[#1D2B53] leading-tight">
              جعان ومش عايز <br />
              <span className="text-orange-600">تستنى؟</span> وصلي يوصلك
            </h1>
            <p className="text-sm text-gray-500 font-medium">أسرع خدمة توصيل في مدينة العبور لحد باب بيتك</p>
          </div>

          {/* Search Bar Lookalike */}
          <div className="relative group">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="عايز تاكل إيه النهاردة؟" 
              className="w-full bg-white border-none py-4 pr-12 pl-4 rounded-2xl shadow-xl shadow-gray-100 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
              readOnly
              onClick={() => window.location.href = "/auth"}
            />
          </div>
        </motion.div>
      </section>

      {/* Quick Actions / Categories */}
      <section className="px-4 py-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max pb-2">
          {[
            { title: "مطاعم", icon: "🍔", color: "bg-orange-100 text-orange-600" },
            { title: "طرود", icon: "📦", color: "bg-blue-100 text-blue-600" },
            { title: "سوبر ماركت", icon: "🛒", color: "bg-green-100 text-green-600" },
            { title: "صيدلية", icon: "💊", color: "bg-red-100 text-red-600" },
          ].map((cat, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
              onClick={() => window.location.href = "/auth"}
            >
              <div className={`${cat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
                {cat.icon}
              </div>
              <span className="text-xs font-black text-gray-700">{cat.title}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-4 py-4">
        <div className="bg-orange-600 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-orange-100">
          <div className="relative z-10 space-y-2 max-w-[60%]">
            <h3 className="text-xl font-black">خصم 50%</h3>
            <p className="text-xs font-bold text-orange-50">على أول طلب ليك من خلال التطبيق</p>
            <Link href="/auth">
              <button className="bg-white text-orange-600 text-[10px] font-black px-4 py-2 rounded-lg mt-2 shadow-lg">
                اطلب الآن
              </button>
            </Link>
          </div>
          <div className="absolute -left-4 -bottom-4 w-32 h-32 opacity-20">
            <Zap className="w-full h-full fill-white" />
          </div>
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663574548635/TFCiPaicWQMgbGKm.png" 
            className="absolute -left-2 top-0 h-full object-contain drop-shadow-lg"
            alt="promo"
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-8 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-[#1D2B53]">ليه تختار وصلي؟</h2>
          <button className="text-xs font-bold text-orange-600">مشاهدة الكل</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "تتبع مباشر", desc: "تابع طلبك لحظة بلحظة", icon: MapPin, bg: "bg-blue-50", iconColor: "text-blue-500" },
            { title: "دعم 24/7", desc: "فريقنا معاك دايماً", icon: Clock, bg: "bg-purple-50", iconColor: "text-purple-500" },
            { title: "تأمين شامل", desc: "طلبك في أمان تام", icon: Shield, bg: "bg-green-50", iconColor: "text-green-500" },
            { title: "أسرع توصيل", desc: "العبور في جيبك", icon: Zap, bg: "bg-yellow-50", iconColor: "text-yellow-500" },
          ].map((f, i) => (
            <div key={i} className={`${f.bg} p-4 rounded-3xl space-y-2 border border-white shadow-sm`}>
              <f.icon className={`${f.iconColor} h-6 w-6`} />
              <div>
                <h4 className="text-sm font-black text-gray-900">{f.title}</h4>
                <p className="text-[10px] font-bold text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-3 z-50 sm:hidden">
        <div className="flex justify-between items-center">
          {[
            { id: "home", label: "الرئيسية", icon: HomeIcon },
            { id: "search", label: "البحث", icon: Search },
            { id: "orders", label: "طلباتي", icon: ShoppingBag },
            { id: "profile", label: "حسابي", icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== "home") window.location.href = "/auth";
              }}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? "text-orange-600" : "text-gray-400"}`}
            >
              <item.icon className={`h-6 w-6 ${activeTab === item.id ? "scale-110" : ""}`} />
              <span className="text-[10px] font-black">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="nav-dot" className="w-1 h-1 bg-orange-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Footer (Hidden on Mobile App View) */}
      <footer className="hidden sm:block bg-gray-50 pt-20 pb-10 border-t border-gray-100 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm font-bold">© 2026 وصلي. تجربة تطبيق الهاتف على الويب.</p>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @font-face {
          font-family: 'Cairo';
          src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        }
        body {
          font-family: 'Cairo', sans-serif;
          background-color: #F8F9FB;
        }
      `}</style>
    </div>
  );
}
