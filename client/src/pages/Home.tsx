import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2, Menu, X, Facebook, Home as HomeIcon, ShoppingBag, User, Search, Bell, Utensils, Package, ShoppingCart, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

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
      {/* Mobile-Style App Header - Enhanced */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-gradient-to-b from-white/50 to-transparent"}`}>
        <div className="container mx-auto px-4 flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg shadow-orange-200"
            >
              <Truck className="text-white h-6 w-6" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#1D2B53] leading-none">وصلي</span>
              <span className="text-[9px] font-bold text-orange-600">مدينة العبور</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:shadow-lg transition-all"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {unreadNotifications}
                </motion.span>
              )}
            </motion.button>
            <Link href="/auth">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-200 text-white hover:shadow-xl transition-all"
              >
                <User className="h-5 w-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Search Section - Enhanced */}
      <section className="pt-24 px-4 pb-8 bg-gradient-to-b from-orange-50 via-white to-[#F8F9FB]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-[#1D2B53] leading-tight">
              جعان ومش <br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">عايز تستنى؟</span>
            </h1>
            <p className="text-sm text-gray-600 font-medium">أسرع خدمة توصيل في مدينة العبور لحد باب بيتك</p>
          </div>

          {/* Search Bar Lookalike - Enhanced */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative group"
          >
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-orange-400" />
            </div>
            <input 
              type="text" 
              placeholder="عايز تاكل إيه النهاردة؟" 
              className="w-full bg-white border-2 border-transparent py-4 pr-12 pl-4 rounded-3xl shadow-xl shadow-orange-100 text-sm font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer"
              readOnly
              onClick={() => window.location.href = "/auth"}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Actions / Categories - Enhanced */}
      <section className="px-4 py-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max pb-2">
          {[
            { title: "مطاعم", icon: Utensils, color: "from-orange-400 to-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-600" },
            { title: "طرود", icon: Package, color: "from-blue-400 to-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
            { title: "سوبر ماركت", icon: ShoppingCart, color: "from-green-400 to-green-500", bgColor: "bg-green-100", textColor: "text-green-600" },
            { title: "صيدلية", icon: Pill, color: "from-red-400 to-red-500", bgColor: "bg-red-100", textColor: "text-red-600" },
          ].map((cat, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -8 }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
              onClick={() => window.location.href = "/auth"}
            >
              <motion.div 
                className={`${cat.bgColor} w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all`}
                whileHover={{ rotate: 5 }}
              >
                <cat.icon className={`${cat.textColor} h-8 w-8`} />
              </motion.div>
              <span className="text-xs font-black text-gray-700">{cat.title}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Promo Banner - Enhanced */}
      <section className="px-4 py-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-orange-300"
        >
          <div className="relative z-10 space-y-3 max-w-[65%]">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black"
            >
              خصم 50%
            </motion.h3>
            <p className="text-sm font-bold text-orange-50">على أول طلب ليك من خلال التطبيق</p>
            <Link href="/auth">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-orange-600 text-xs font-black px-6 py-3 rounded-xl mt-3 shadow-lg hover:shadow-xl transition-all"
              >
                اطلب الآن
              </motion.button>
            </Link>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -left-8 -bottom-8 w-40 h-40 opacity-15"
          >
            <Zap className="w-full h-full fill-white" />
          </motion.div>
          <motion.img 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663574548635/TFCiPaicWQMgbGKm.png" 
            className="absolute -left-2 top-0 h-full object-contain drop-shadow-2xl"
            alt="promo"
          />
        </motion.div>
      </section>

      {/* Features Grid - Enhanced */}
      <section className="px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#1D2B53]">ليه تختار وصلي؟</h2>
          <motion.button 
            whileHover={{ x: -5 }}
            className="text-xs font-bold text-orange-600 flex items-center gap-1"
          >
            مشاهدة الكل
            <ArrowRight className="h-3 w-3" />
          </motion.button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "تتبع مباشر", desc: "تابع طلبك لحظة بلحظة", icon: MapPin, bg: "bg-blue-50", iconColor: "text-blue-500", borderColor: "border-blue-100" },
            { title: "دعم 24/7", desc: "فريقنا معاك دايماً", icon: Clock, bg: "bg-purple-50", iconColor: "text-purple-500", borderColor: "border-purple-100" },
            { title: "تأمين شامل", desc: "طلبك في أمان تام", icon: Shield, bg: "bg-green-50", iconColor: "text-green-500", borderColor: "border-green-100" },
            { title: "أسرع توصيل", desc: "العبور في جيبك", icon: Zap, bg: "bg-yellow-50", iconColor: "text-yellow-500", borderColor: "border-yellow-100" },
          ].map((f, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -8, scale: 1.05 }}
              className={`${f.bg} p-5 rounded-3xl space-y-3 border-2 ${f.borderColor} shadow-lg hover:shadow-xl transition-all cursor-pointer`}
            >
              <motion.div whileHover={{ rotate: 10, scale: 1.1 }}>
                <f.icon className={`${f.iconColor} h-7 w-7`} />
              </motion.div>
              <div>
                <h4 className="text-sm font-black text-gray-900">{f.title}</h4>
                <p className="text-[11px] font-bold text-gray-600">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="px-4 py-8 space-y-4">
        <div className="flex items-center justify-center gap-8">
          {[
            { count: "5000+", label: "طلب يومي" },
            { count: "4.9⭐", label: "تقييم" },
            { count: "15 دقيقة", label: "متوسط التوصيل" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-lg font-black text-orange-600">{stat.count}</p>
              <p className="text-xs font-bold text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mobile Bottom Navigation - Enhanced */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t-2 border-gray-100 px-4 py-3 z-50 sm:hidden shadow-2xl">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {[
            { id: "home", label: "الرئيسية", icon: HomeIcon },
            { id: "search", label: "البحث", icon: Search },
            { id: "orders", label: "طلباتي", icon: ShoppingBag },
            { id: "profile", label: "حسابي", icon: User },
          ].map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== "home") window.location.href = "/auth";
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1.5 transition-all py-2 px-3 rounded-2xl ${activeTab === item.id ? "bg-orange-50" : ""}`}
            >
              <motion.div
                animate={{ scale: activeTab === item.id ? 1.2 : 1 }}
                className={`transition-all ${activeTab === item.id ? "text-orange-600" : "text-gray-400"}`}
              >
                <item.icon className="h-6 w-6" />
              </motion.div>
              <span className={`text-[10px] font-black transition-colors ${activeTab === item.id ? "text-orange-600" : "text-gray-500"}`}>
                {item.label}
              </span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="nav-dot" 
                  className="w-1.5 h-1.5 bg-orange-600 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Desktop Footer (Hidden on Mobile App View) */}
      <footer className="hidden sm:block bg-gradient-to-r from-gray-50 to-gray-100 pt-20 pb-10 border-t-2 border-gray-200 mt-20">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-gray-600 text-sm font-bold">© 2026 وصلي. تجربة تطبيق الهاتف على الويب.</p>
          <p className="text-gray-500 text-xs">جودة عالية • سرعة فائقة • أمان مضمون</p>
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
