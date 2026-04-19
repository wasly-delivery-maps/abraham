import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-200">
              <Truck className="text-white h-7 w-7" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">وصلي</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
            <a href="#features" className="hover:text-orange-600 transition-colors">المميزات</a>
            <a href="#how-it-works" className="hover:text-orange-600 transition-colors">كيف نعمل</a>
            <Link href="/auth">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 rounded-full font-bold">ابدأ الآن</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden bg-[#fafafa]">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-orange-100/50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-3xl opacity-50"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-bold border border-orange-100 animate-bounce">
                <Zap className="h-4 w-4" />
                <span>الخدمة الأسرع في مدينة العبور</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1]">
                شحنتك في أمان <br />
                <span className="text-orange-600">توصيل ذكي</span> بضغطة زر
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                منصة وصلي تربطك بأفضل السائقين المحترفين لضمان وصول طرودك في أسرع وقت ممكن وبأعلى معايير الأمان والموثوقية.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-10 py-7 rounded-2xl font-bold shadow-xl shadow-orange-200 hover:scale-105 transition-all">
                    اطلب الآن <ArrowRight className="mr-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-2xl font-bold border-2 border-gray-200 hover:bg-gray-50 hover:border-orange-600 hover:text-orange-600 transition-all">
                    انضم ككابتن
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span className="text-sm font-medium">تتبع مباشر</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span className="text-sm font-medium">دعم 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                  <span className="text-sm font-medium">تأمين شامل</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 animate-float">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663574548635/TFCiPaicWQMgbGKm.png"
                  alt="وصلي - سائق توصيل"
                  className="w-full h-auto drop-shadow-[0_35px_35px_rgba(234,88_12,0.3)] rounded-[3rem]"
                />
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full -z-10 blur-2xl"></div>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "سرعة فائقة", desc: "نصل إليك في غضون دقائق من طلب الخدمة بفضل توزيعنا الذكي.", color: "orange" },
              { icon: Shield, title: "أمان مطلق", desc: "جميع السائقين معتمدون ويخضعون لفحوصات أمنية دورية.", color: "blue" },
              { icon: MapPin, title: "تتبع دقيق", desc: "شاهد طردك وهو يتحرك على الخريطة في الوقت الفعلي بدقة متناهية.", color: "green" },
              { icon: Clock, title: "متاح دائماً", desc: "لا نتوقف أبداً، خدمتنا متاحة 24 ساعة طوال أيام الأسبوع.", color: "purple" },
              { icon: Star, title: "جودة مضمونة", desc: "نظام تقييم دقيق يضمن لك الحصول على أفضل كابتن دائماً.", color: "yellow" },
              { icon: Truck, title: "أسعار عادلة", desc: "شفافية كاملة في الأسعار بدون أي رسوم خفية أو مفاجئة.", color: "red" }
            ].map((feature, idx) => (
              <Card key={idx} className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 p-4 rounded-[2rem] bg-[#fdfdfd] hover:-translate-y-2">
                <CardHeader>
                  <div className={`bg-${feature.color}-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 leading-relaxed text-lg">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
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
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-8 rounded-2xl font-black">
                    تحدث مع الدعم
                  </Button>
                </Link>
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
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-600 transition-all cursor-pointer">f</div>
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-600 transition-all cursor-pointer">t</div>
                <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-600 transition-all cursor-pointer">i</div>
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
