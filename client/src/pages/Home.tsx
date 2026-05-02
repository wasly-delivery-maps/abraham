import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Truck, Zap, Shield, ArrowRight, Star, Menu, X, Facebook, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin"></div>
          <p className="text-orange-600 font-black tracking-widest animate-pulse">WASLY</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === "driver") window.location.href = "/driver/dashboard";
    else if (user?.role === "admin") window.location.href = "/admin/dashboard";
    else window.location.href = "/customer/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-orange-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src="/assets/logo.jpg" alt="وصلي" className="relative h-12 w-12 rounded-xl shadow-sm border border-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black bg-gradient-to-l from-slate-900 to-orange-600 bg-clip-text text-transparent">وصلي</span>
              <span className="text-[10px] font-bold text-orange-600/60 tracking-widest uppercase">Premium Delivery</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-8 text-sm font-bold text-slate-500">
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">المميزات</button>
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">كيف نعمل</button>
            </div>
            <Link href="/auth">
              <Button className="bg-slate-900 hover:bg-orange-600 text-white px-8 h-11 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all">
                دخول / تسجيل
              </Button>
            </Link>
          </div>

          <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-orange-50 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px] -z-10"></div>

        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-10 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-orange-50 px-5 py-2 rounded-full border border-orange-100 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
                <span className="text-xs font-black text-orange-700 tracking-wide uppercase">الخدمة الأسرع في مدينة العبور ⚡</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  توصيل <br />
                  <span className="text-orange-600">بكل سهولة</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  وداعاً للانتظار! وصلي بيقدملك أسرع خدمة توصيل في مدينة العبور. اطلب أكلك المفضل أو ابعت طرودك في دقايق وبأمان تام.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-10 h-16 rounded-2xl font-black shadow-xl shadow-orange-200 transition-all group">
                    اطلب الآن <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-[-4px] transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="bg-white text-lg px-10 h-16 rounded-2xl font-black border-2 border-slate-100 text-slate-900 hover:bg-slate-50 transition-all">
                    انضم ككابتن 🏍️
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative">
              <div className="relative z-10 animate-float">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663574548635/TFCiPaicWQMgbGKm.png" alt="وصلي" className="w-full h-auto drop-shadow-2xl rounded-[3rem]" />
                <div className="absolute -top-6 -right-6 bg-white p-5 rounded-3xl shadow-xl border border-slate-50 hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-xl"><Star className="text-orange-600 h-6 w-6 fill-orange-600" /></div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">التقييم</p>
                      <p className="text-lg font-black text-slate-900">4.9 الممتاز</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#F8FAFC]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-orange-600 font-black tracking-widest uppercase text-xs">مميزات وصلي</h2>
            <h3 className="text-4xl font-black text-slate-900">لماذا تختار وصلي؟</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "سرعة فائقة", desc: "نصل إليك في أسرع وقت ممكن بفضل نظامنا الذكي.", color: "bg-orange-50 text-orange-600" },
              { icon: Shield, title: "أمان تام", desc: "طرودك في أيدٍ أمينة مع نظام تتبع حي ومباشر.", color: "bg-blue-50 text-blue-600" },
              { icon: Clock, title: "دقة في المواعيد", desc: "نحترم وقتك ونلتزم بالمواعيد المحددة بدقة.", color: "bg-green-50 text-green-600" }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className={`${f.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{f.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.jpg" alt="وصلي" className="h-10 w-10 rounded-xl" />
              <span className="text-xl font-black text-slate-900">وصلي</span>
            </div>
            <p className="text-slate-400 max-w-xs text-sm font-medium">نحن هنا لخدمتك وتسهيل حياتك اليومية في مدينة العبور.</p>
            <div className="text-[10px] text-slate-300 font-bold tracking-widest pt-6 uppercase">
              © 2026 WASLY DELIVERY. ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
