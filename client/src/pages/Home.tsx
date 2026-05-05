import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Truck, Zap, ArrowRight, CheckCircle2, Utensils, Package, ShoppingCart, Pill, Star, Quote, MapPin, Bell, ChevronLeft, ChevronRight, PlayCircle, ShieldCheck, Globe, Bike } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Truck className="text-orange-500 h-8 w-8" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const dashboardMap: Record<string, string> = {
      driver: "/driver/dashboard",
      admin: "/admin/dashboard",
      customer: "/customer/dashboard"
    };
    window.location.href = dashboardMap[user?.role || "customer"] || "/customer/dashboard";
    return null;
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-100 selection:text-orange-600 overflow-x-hidden" dir="rtl" ref={containerRef}>
      
      {/* Dynamic Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-3 shadow-sm" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 cursor-pointer">
              <img src="/logo.jpg" alt="Wasly Logo" className="h-10 sm:h-12 object-contain rounded-lg shadow-sm" />
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight leading-none">وصلي</span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em]">أسرع توصيل في العبور</span>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['الرئيسية', 'خدماتنا', 'كيف نعمل', 'الأسئلة الشائعة'].map((item, idx) => (
              <button 
                key={item} 
                onClick={() => idx === 1 ? scrollToSection('services') : idx === 2 ? scrollToSection('how-it-works') : idx === 3 ? scrollToSection('faq') : window.scrollTo({top: 0, behavior: 'smooth'})}
                className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                دخول / تسجيل
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[60%] h-full bg-gradient-to-bl from-orange-50 to-white rounded-bl-[200px]"></div>
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 text-center lg:text-right relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white shadow-xl shadow-slate-100 rounded-full border border-slate-50"
            >
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">أسرع تطبيق دليفري في مدينة العبور</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.05]"
            >
              وصلي.. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">مشاويرك خلصانة</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
            >
              ببساطة إحنا بنوصلك أي أكلة تحبها من مطاعم العبور لحد باب بيتك، وكمان بنعملك مشاويرك الخاصة؛ لو نسيت حاجة أو محتاج طلبات من الصيدلية والسوبر ماركت، طيارين وصلي في خدمتك.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
            >
              <Link href="/auth">
                <Button className="h-16 px-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-lg font-black shadow-2xl shadow-orange-200 group overflow-hidden relative">
                  <span className="relative z-10 flex items-center gap-3">
                    جرب تطلب دلوقتي
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-[-5px] transition-transform" />
                  </span>
                </Button>
              </Link>
              <button onClick={() => scrollToSection('how-it-works')} className="h-16 px-8 rounded-2xl bg-white border border-slate-100 text-slate-900 text-lg font-black shadow-xl shadow-slate-50 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                <PlayCircle className="h-6 w-6 text-orange-500" />
                شاهد كيف نعمل
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 p-4 bg-white/30 backdrop-blur-md rounded-[60px] border border-white/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
              <div className="rounded-[50px] overflow-hidden">
                <img 
                  src="/wasly-driver-hero.png" 
                  alt="Wasly Driver" 
                  className="w-full h-[450px] sm:h-[650px] object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -top-10 -right-10 z-20 bg-white p-5 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Zap className="text-white h-7 w-7" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">سرعة فائقة</div>
                <div className="text-xl font-black text-slate-900">توصيل فوري</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4 text-center lg:text-right">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">إحنا بنعمل <span className="text-orange-500 underline decoration-orange-200 underline-offset-8">حاجتين</span></h2>
              <p className="text-lg text-slate-500 font-medium max-w-xl">ببساطة، وصلي هو رفيقك في مدينة العبور لكل احتياجاتك اليومية.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -15 }}
              className="group relative bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100/50 border border-slate-50 overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Utensils className="text-orange-600 h-8 w-8" />
                </div>
                <div className="text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">الأولى</div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">توصيل الطعام</h3>
                <p className="text-slate-500 text-lg leading-relaxed mb-8">بنوصلك أي أكلة تحبها من مطاعم العبور لحد باب بيتك في أسرع وقت ممكن.</p>
                <Link href="/auth">
                  <button className="w-full py-4 bg-orange-500 rounded-2xl text-sm font-black text-white shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all">
                    اطلب أكل دلوقتي
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -15 }}
              className="group relative bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100/50 border border-slate-50 overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Bike className="text-blue-600 h-8 w-8" />
                </div>
                <div className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">الثانية</div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">مشاويرك الخاصة</h3>
                <p className="text-slate-500 text-lg leading-relaxed mb-8">لو نسيت حاجة، عايز تبعت طرد، أو محتاج طلبات من الصيدلية والسوبر ماركت، طيارين وصلي في خدمتك.</p>
                <Link href="/auth">
                  <button className="w-full py-4 bg-slate-900 rounded-2xl text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                    اطلب مشوار خاص
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-orange-500/5 rounded-[60px] rotate-3 scale-105"></div>
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1974&auto=format&fit=crop" 
                className="relative z-10 rounded-[60px] shadow-2xl h-[600px] w-full object-cover" 
                alt="App Experience" 
              />
            </div>

            <div className="space-y-12 order-1 lg:order-2">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900">إزاي تستخدم <span className="text-orange-500">وصلي؟</span></h2>
                <p className="text-lg text-slate-500 font-medium">خطوات بسيطة وسهلة عشان تريح نفسك.</p>
              </div>

              <div className="space-y-10">
                {[
                  { step: "01", title: "حمل التطبيق", desc: "تقدر تحمل التطبيق وتستمتع بأسرع توصيل في العبور." },
                  { step: "02", title: "حدد طلبك", desc: "سواء كان أكلة من مطعم أو مشوار خاص، حدد اللي محتاجه." },
                  { step: "03", title: "استلم في مكانك", desc: "طيارين وصلي هيوصلولك في أسرع وقت لحد باب البيت." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-50 flex items-center justify-center text-2xl font-black text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                      {step.step}
                    </div>
                    <div className="space-y-2 pt-2 text-right">
                      <h3 className="text-2xl font-black text-slate-900">{step.title}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">محتاج مساعدة؟ <span className="text-orange-500">إحنا معاك</span></h2>
            <p className="text-lg text-slate-500 font-medium">كل اللي محتاج تعرفه عن وصلي.</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-6">
            {[
              { q: "إيه اللي بيميز وصلي؟", a: "إحنا أسرع تطبيق دليفري متخصص في مدينة العبور، وبنقدم خدمة شاملة بتجمع بين توصيل الأكل والمشاوير الخاصة." },
              { q: "إزاي أعمل أول طلب؟", a: "ببساطة حمل التطبيق، سجل دخولك، واختار الخدمة اللي محتاجها. لو واجهت أي مشكلة فريق الدعم معاك لحظة بلحظة." },
              { q: "هل بتوصلوا لكل أحياء العبور؟", a: "نعم، وصلي بيغطي كل أحياء مدينة العبور بالكامل لضمان وصول الخدمة لكل بيت." },
              { q: "إيه هي طرق الدفع؟", a: "متاح الدفع نقداً عند الاستلام، ومتاح كمان خيارات دفع إلكترونية لتسهيل طلبك." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-slate-50 rounded-[32px] px-8 sm:px-10">
                <AccordionTrigger className="hover:no-underline font-black text-xl text-slate-900 py-8 text-right">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-lg text-slate-500 font-medium leading-relaxed pb-8 text-right border-t border-slate-100 pt-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-950 text-white pt-32 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8 text-center sm:text-right">
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <img src="/logo.jpg" alt="Wasly Logo" className="h-16 w-16 object-contain rounded-2xl bg-white p-1 shadow-lg" />
                <span className="text-3xl font-black tracking-tighter">وصلي</span>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                أسرع تطبيق دليفري في مدينة العبور. مشاويرك وطلباتك كلها في مكان واحد.
              </p>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="text-xl font-black mb-10 text-orange-500">الشركة</h4>
              <ul className="space-y-6 text-slate-400 text-base font-bold">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-all">عن وصلي</button></li>
                <li><button onClick={() => window.location.href = "/auth"} className="hover:text-white transition-all">انضم كطيار</button></li>
                <li><button onClick={() => window.location.href = "/auth"} className="hover:text-white transition-all">سياسة الخصوصية</button></li>
              </ul>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="text-xl font-black mb-10 text-orange-500">الخدمات</h4>
              <ul className="space-y-6 text-slate-400 text-base font-bold">
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-all">توصيل أكل</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-all">مشاوير خاصة</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-all">طلبات صيدلية</button></li>
              </ul>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="text-xl font-black mb-10 text-orange-500">تواصل معنا</h4>
              <ul className="space-y-6 text-slate-400 text-base font-bold">
                <li className="flex items-center gap-4 justify-center sm:justify-start">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  مدينة العبور، مصر
                </li>
                <li className="flex items-center gap-4 justify-center sm:justify-start">
                  <Bell className="h-5 w-5 text-orange-500" />
                  دعم فني متاح دائماً
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-bold italic">صنع بكل حب لخدمة أهل العبور ❤️</p>
            <p className="text-slate-500 text-sm font-black tracking-widest uppercase">© 2026 WASLY APP. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;900&display=swap');
        
        body {
          font-family: 'Cairo', sans-serif;
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #fb923c;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #ea580c;
        }
      `}</style>
    </div>
  );
}
