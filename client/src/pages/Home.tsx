import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2, Menu, X, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-white overflow-x-hidden" dir="rtl">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-orange-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative group">
              <img 
                src="/assets/logo.jpg" 
                alt="وصلي" 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute -inset-1 bg-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-600 to-[#1D2B53] bg-clip-text text-transparent tracking-tight">وصلي</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-gray-600 font-bold">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-orange-600 transition-colors relative group cursor-pointer"
            >
              المميزات
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-orange-600 transition-colors relative group cursor-pointer"
            >
              كيف نعمل
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all group-hover:w-full"></span>
            </button>
            <Link href="/auth">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:scale-105 transition-all active:scale-95">ابدأ الآن</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-orange-50 shadow-2xl p-6 space-y-4 z-40"
            >
              <button 
                className="block w-full text-right text-lg font-bold text-gray-700 hover:text-orange-600 p-2 cursor-pointer"
                onClick={() => {
                  setIsMenuOpen(false);
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                المميزات
              </button>
              <button 
                className="block w-full text-right text-lg font-bold text-gray-700 hover:text-orange-600 p-2 cursor-pointer"
                onClick={() => {
                  setIsMenuOpen(false);
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                كيف نعمل
              </button>
              <Link href="/auth">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200">
                  ابدأ الآن
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 sm:pt-32 pb-12 sm:pb-20 flex items-center overflow-hidden bg-gradient-to-b from-orange-50/30 to-white">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-orange-200/30 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-orange-100/20 rounded-full blur-3xl opacity-40"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 sm:space-y-8 text-center lg:text-right"
            >
              <div className="inline-flex items-center gap-2 bg-orange-100/80 text-orange-700 px-4 py-2 rounded-full text-xs sm:text-sm font-black border border-orange-200 shadow-sm animate-pulse">
                <Zap className="h-4 w-4 fill-orange-500" />
                <span>الخدمة الأسرع في مدينة العبور ⚡</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#1D2B53] leading-[1.2] sm:leading-[1.1]">
                جعان ومش عايز <br className="hidden sm:block" />
                <span className="text-orange-600 relative inline-block">
                  تستنى؟
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span> وصلي يوصلك
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                سواء كنت عايز تطلب أكل من مطعمك المفضل أو تبعت طرد مهم، وصلي بيجيبلك كل طلباتك لحد باب البيت في أسرع وقت وبأمان تام.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 sm:px-10 py-6 sm:py-8 rounded-2xl font-black shadow-2xl shadow-orange-200 hover:scale-105 transition-all active:scale-95 group">
                    اطلب الآن <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-[-4px] transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="text-lg px-8 sm:px-10 py-6 sm:py-8 rounded-2xl font-black border-2 border-[#1D2B53]/10 text-[#1D2B53] hover:bg-[#1D2B53]/5 hover:border-[#1D2B53] transition-all active:scale-95">
                    انضم ككابتن 🏍️
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-4 text-gray-600">
                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span className="text-xs sm:text-sm font-bold">تتبع مباشر</span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span className="text-xs sm:text-sm font-bold">دعم 24/7</span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span className="text-xs sm:text-sm font-bold">تأمين شامل</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative px-4 sm:px-0"
            >
              <div className="relative z-10 animate-float">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663574548635/TFCiPaicWQMgbGKm.png"
                  alt="وصلي - سائق توصيل"
                  className="w-full h-auto drop-shadow-[0_35px_35px_rgba(234,88_12,0.4)] rounded-[2rem] sm:rounded-[3rem]"
                />
                {/* Floating Badge */}
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl border border-orange-50 hidden sm:block animate-bounce">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Truck className="text-green-600 h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">طلب جديد</p>
                      <p className="text-sm font-black text-gray-900">جاري التوصيل...</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-orange-300/20 to-transparent rounded-full -z-10 blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-orange-600 font-bold tracking-widest uppercase text-sm">لماذا وصلي؟</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-gray-900">نحن نغير مفهوم التوصيل</h3>
            <p className="text-lg text-gray-500">نجمع بين التكنولوجيا المتطورة والخدمة الإنسانية المتميزة لنقدم لك تجربة لا تُنسى.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                { icon: Zap, title: "توصيل وجبات", desc: "اطلب أكلك من المطاعم المتعاقدة معانا ويوصلك سخن وفريش.", color: "orange", bg: "bg-orange-100", text: "text-orange-600" },
                { icon: Truck, title: "توصيل طرود", desc: "ابعت واستلم أي حاجة في مدينة العبور بضغطة زر واحدة.", color: "blue", bg: "bg-blue-100", text: "text-blue-600" },
                { icon: MapPin, title: "تتبع لايف", desc: "تابع طلبك وهو جاي لك على الخريطة لحظة بلحظة لحد ما يوصل.", color: "green", bg: "bg-green-100", text: "text-green-600" },
                { icon: Clock, title: "متاح دائماً", desc: "جعان في نص الليل؟ وصلي شغال معاك 24 ساعة طوال أيام الأسبوع.", color: "purple", bg: "bg-purple-100", text: "text-purple-600" },
                { icon: Star, title: "أفضل المطاعم", desc: "متعاقدين مع أكبر مطاعم العبور لضمان تنوع الوجبات وجودتها.", color: "yellow", bg: "bg-yellow-100", text: "text-yellow-600" },
                { icon: Shield, title: "أمان وموثوقية", desc: "سائقين محترفين وأسعار عادلة وشفافة بدون أي رسوم مخفية.", color: "red", bg: "bg-red-100", text: "text-red-600" }
              ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 p-4 sm:p-6 rounded-[2rem] bg-white border border-gray-50 h-full">
                  <CardHeader className="p-0 mb-6">
                    <div className={`${feature.bg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                      <feature.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${feature.text}`} />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-black text-gray-900 mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-gray-500 leading-relaxed text-base sm:text-lg font-medium">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-orange-200">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-6xl font-black">جاهز لتجربة الجيل القادم من التوصيل؟</h2>
              <p className="text-xl text-orange-50/90 leading-relaxed">انضم إلى آلاف المستخدمين في مدينة العبور واستمتع بخدمة تفوق توقعاتك.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-12 py-8 rounded-2xl font-black shadow-xl">
                    سجل حسابك الآن
                  </Button>
                </Link>
                <a href="https://wa.me/201557564373" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-8 rounded-2xl font-black">
                    تحدث مع الدعم
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 pt-20 pb-10 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-orange-600 p-1.5 rounded-lg">
                  <Truck className="text-white h-5 w-5" />
                </div>
                <span className="text-2xl font-black text-gray-900">وصلي</span>
              </div>
              <p className="text-gray-500 leading-relaxed">نحن نسعى لجعل التوصيل في مصر أكثر ذكاءً، سرعةً، وأماناً للجميع.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">الروابط</h4>
              <ul className="space-y-4 text-gray-500">
                <li><a href="#" className="hover:text-orange-600 transition">عن وصلي</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">المميزات</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">الأسعار</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">الدعم</h4>
              <ul className="space-y-4 text-gray-500">
                <li><a href="#" className="hover:text-orange-600 transition">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-orange-600 transition">الشروط والأحكام</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6">تابعنا</h4>
              <div className="flex gap-4">
                <a 
                  href="https://www.facebook.com/share/1CcUsu4dwU/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                  <Facebook className="h-6 w-6 fill-current" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-10 text-center">
            <p className="text-gray-400 text-sm">© 2026 وصلي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
