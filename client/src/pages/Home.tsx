import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2, Menu, X, Facebook, Home as HomeIcon, ShoppingBag, User, Search, Bell, Utensils, Package, ShoppingCart, Pill, ChefHat, Leaf, Heart } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 pb-24 sm:pb-0" dir="rtl">
      {/* Header - Minimalist Design */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-200"
            >
              <Truck className="text-white h-6 w-6" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[#1D2B53] leading-none">وصلي</span>
              <span className="text-[8px] font-bold text-orange-600">مدينة العبور</span>
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

      {/* Hero Section - Minimalist */}
      <section className="pt-28 px-4 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          {/* Main Title */}
          <div className="space-y-4 text-center">
            <h1 className="text-5xl font-black text-[#1D2B53] leading-tight">
              أسرع توصيل <br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">في العبور</span>
            </h1>
            <p className="text-base text-gray-600 font-medium max-w-md mx-auto">
              وجبات شهية وطرود آمنة توصل لباب بيتك في دقائق معدودة
            </p>
          </div>

          {/* Search Bar */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative group"
          >
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-orange-400" />
            </div>
            <input 
              type="text" 
              placeholder="ابحث عن مطاعم أو خدمات..." 
              className="w-full bg-white border-2 border-transparent py-4 pr-12 pl-4 rounded-2xl shadow-xl shadow-orange-100 text-sm font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer"
              readOnly
              onClick={() => window.location.href = "/auth"}
            />
          </motion.div>

          {/* CTA Button */}
          <Link href="/auth">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:shadow-xl transition-all"
            >
              ابدأ الآن
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Service Categories - Clean Grid */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[#1D2B53] mb-8 text-center">خدماتنا</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "مطاعم", icon: Utensils, color: "from-orange-400 to-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-600" },
              { title: "طرود", icon: Package, color: "from-blue-400 to-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
              { title: "سوبر ماركت", icon: ShoppingCart, color: "from-green-400 to-green-500", bgColor: "bg-green-100", textColor: "text-green-600" },
              { title: "صيدلية", icon: Pill, color: "from-red-400 to-red-500", bgColor: "bg-red-100", textColor: "text-red-600" },
            ].map((cat, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                whileHover={{ y: -4 }}
                onClick={() => window.location.href = "/auth"}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100"
              >
                <motion.div 
                  className={`${cat.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center`}
                  whileHover={{ rotate: 5 }}
                >
                  <cat.icon className={`${cat.textColor} h-7 w-7`} />
                </motion.div>
                <span className="text-sm font-bold text-gray-800">{cat.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner - Clean Design */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-3 max-w-[60%]">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-black"
                >
                  خصم 50%
                </motion.h3>
                <p className="text-sm font-medium text-orange-50">على أول طلب لك</p>
                <Link href="/auth">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-orange-600 text-sm font-bold px-6 py-2 rounded-xl mt-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    اطلب الآن
                  </motion.button>
                </Link>
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl opacity-20"
              >
                🚚
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Wasly - Features */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl font-black text-[#1D2B53] text-center">لماذا وصلي؟</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                title: "توصيل سريع", 
                desc: "متوسط التوصيل 15 دقيقة", 
                icon: Zap, 
                bg: "bg-yellow-50", 
                iconColor: "text-yellow-500", 
                borderColor: "border-yellow-100" 
              },
              { 
                title: "تتبع مباشر", 
                desc: "تابع طلبك لحظة بلحظة على الخريطة", 
                icon: MapPin, 
                bg: "bg-blue-50", 
                iconColor: "text-blue-500", 
                borderColor: "border-blue-100" 
              },
              { 
                title: "دعم 24/7", 
                desc: "فريقنا معاك في أي وقت", 
                icon: Clock, 
                bg: "bg-purple-50", 
                iconColor: "text-purple-500", 
                borderColor: "border-purple-100" 
              },
              { 
                title: "أمان مضمون", 
                desc: "طلبك في أمان تام مع تأمين شامل", 
                icon: Shield, 
                bg: "bg-green-50", 
                iconColor: "text-green-500", 
                borderColor: "border-green-100" 
              },
            ].map((f, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -8 }}
                className={`${f.bg} p-6 rounded-2xl space-y-3 border-2 ${f.borderColor} shadow-md hover:shadow-lg transition-all`}
              >
                <motion.div whileHover={{ rotate: 10, scale: 1.1 }}>
                  <f.icon className={`${f.iconColor} h-8 w-8`} />
                </motion.div>
                <div>
                  <h4 className="text-base font-black text-gray-900">{f.title}</h4>
                  <p className="text-sm font-medium text-gray-600 mt-1">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - Statistics */}
      <section className="px-4 py-12 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
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
              >
                <p className="text-2xl font-black text-orange-600">{stat.count}</p>
                <p className="text-xs font-bold text-gray-600 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Final */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-black text-[#1D2B53]">
            جاهز لتجربة الخدمة؟
          </h2>
          <p className="text-gray-600 font-medium">
            انضم لآلاف المستخدمين الذين يستمتعون بخدمة وصلي
          </p>
          <Link href="/auth">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:shadow-xl transition-all"
            >
              ابدأ الآن
            </motion.button>
          </Link>
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
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

      {/* Desktop Footer */}
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
