import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Truck, Zap, ArrowRight, CheckCircle2, Utensils, Package, ShoppingCart, Pill, Star, Quote, MapPin, Bell, ChevronLeft, ChevronRight, PlayCircle, ShieldCheck, Globe } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

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

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-100 selection:text-orange-600 overflow-x-hidden" dir="rtl" ref={containerRef}>
      
      {/* Dynamic Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-3 shadow-sm" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 cursor-pointer">
              <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-200">
                <Truck className="text-white h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight leading-none">وصلي</span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em]">Premium Delivery</span>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['الرئيسية', 'خدماتنا', 'كيف نعمل', 'الأسئلة الشائعة'].map((item) => (
              <button key={item} className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors relative group">
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

      {/* Hero Section - Immersive Design */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Abstract Background Elements */}
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
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">نحن نغطي مدينة العبور بالكامل</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.05]"
            >
              التوصيل <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">بذكاء وسرعة</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
            >
              اختبر الجيل القادم من خدمات التوصيل في العبور. نجمع لك كل ما تحتاجه من مطاعم، طرود، وصيدليات في منصة واحدة فائقة السرعة.
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
                    ابدأ تجربتك الآن
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-[-5px] transition-transform" />
                  </span>
                  <motion.div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></motion.div>
                </Button>
              </Link>
              <button className="h-16 px-8 rounded-2xl bg-white border border-slate-100 text-slate-900 text-lg font-black shadow-xl shadow-slate-50 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                <PlayCircle className="h-6 w-6 text-orange-500" />
                شاهد كيف نعمل
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-10 flex flex-wrap items-center gap-8 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" alt="user" />
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">+15,000 عميل</div>
                  <div className="flex text-orange-400 gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="text-green-600 h-6 w-6" />
                </div>
                <div className="text-right text-sm font-black text-slate-900">خدمة آمنة 100%</div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            {/* Main Hero Image with Glass Effect Frame */}
            <div className="relative z-10 p-4 bg-white/30 backdrop-blur-md rounded-[60px] border border-white/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
              <div className="rounded-[50px] overflow-hidden">
                <img 
                  src="/wasly-driver-hero.png" 
                  alt="Wasly Driver" 
                  className="w-full h-[450px] sm:h-[650px] object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Floating UI Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -top-10 -right-10 z-20 bg-white p-5 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Zap className="text-white h-7 w-7" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">وقت التوصيل</div>
                <div className="text-xl font-black text-slate-900">12 دقيقة</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ x: [0, 20, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute bottom-10 -left-10 z-20 bg-slate-900 p-5 rounded-3xl shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <MapPin className="text-orange-500 h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400">موقع المندوب</div>
                <div className="text-sm font-black text-white">الحي الخامس، العبور</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services - Grid with Modern Cards */}
      <section className="py-32 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4 text-center lg:text-right">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">خدماتنا <span className="text-orange-500 underline decoration-orange-200 underline-offset-8">المتميزة</span></h2>
              <p className="text-lg text-slate-500 font-medium max-w-xl">حلول ذكية لكل احتياجاتك اليومية، نعتني بأدق التفاصيل لنصل إليك بأفضل حال.</p>
            </div>
            <Link href="/auth">
              <button className="flex items-center gap-3 text-lg font-black text-slate-900 hover:text-orange-600 transition-all group">
                استكشف جميع الخدمات
                <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-white transition-all">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "المطاعم", icon: Utensils, desc: "أشهى الأطباق من أرقى المطاعم المحلية والعالمية بلمسة زر.", color: "orange", count: "150+ مطعم" },
              { title: "الطرود", icon: Package, desc: "توصيل طرودك الشخصية والتجارية بأمان تام وسرعة فائقة.", color: "blue", count: "توصيل فوري" },
              { title: "سوبر ماركت", icon: ShoppingCart, desc: "تسوق مقاضي البيت وستصلك طازجة ومرتبة كما تحب.", color: "green", count: "24/7 متوفر" },
              { title: "الصيدلية", icon: Pill, desc: "احتياجاتك الدوائية والطبية نصلها لك بكل خصوصية وأمان.", color: "red", count: "دعم طبي" },
            ].map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -15 }}
                className="group relative bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100/50 border border-slate-50 overflow-hidden"
              >
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-${s.color}-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                    <s.icon className={`text-${s.color}-600 h-8 w-8`} />
                  </div>
                  <div className="text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">{s.count}</div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">{s.desc}</p>
                  <button className="w-full py-4 bg-slate-50 rounded-2xl text-sm font-black text-slate-900 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    اطلب الآن
                  </button>
                </div>
                {/* Abstract Background Decoration */}
                <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-${s.color}-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Modern Steps */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-orange-500/5 rounded-[60px] rotate-3 scale-105"></div>
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1974&auto=format&fit=crop" 
                className="relative z-10 rounded-[60px] shadow-2xl h-[600px] w-full object-cover" 
                alt="App Experience" 
              />
              <div className="absolute -bottom-10 -right-10 z-20 bg-white p-8 rounded-[40px] shadow-2xl border border-slate-50 max-w-xs">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Star className="text-orange-500 fill-current h-6 w-6" />
                  </div>
                  <div className="text-lg font-black">سهولة تامة</div>
                </div>
                <p className="text-sm text-slate-500 font-medium">صممنا التطبيق ليكون رفيقك اليومي الأكثر سهولة وسرعة.</p>
              </div>
            </div>

            <div className="space-y-12 order-1 lg:order-2">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900">كيف يعمل <span className="text-orange-500">وصلي؟</span></h2>
                <p className="text-lg text-slate-500 font-medium">ثلاث خطوات بسيطة تفصلك عن الحصول على ما تريد.</p>
              </div>

              <div className="space-y-10">
                {[
                  { step: "01", title: "اختر خدمتك", desc: "تصفح قائمة المطاعم أو المتاجر الواسعة واختر ما يناسبك." },
                  { step: "02", title: "حدد موقعك", desc: "أكد عنوان التوصيل في مدينة العبور بدقة عبر الخريطة." },
                  { step: "03", title: "تتبع واستلم", desc: "راقب مندوبنا لحظة بلحظة حتى يصل إلى باب منزلك." },
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

      {/* Testimonials - Immersive Slider Style */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[150px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl sm:text-6xl font-black text-white">ثقة عملائنا هي <span className="text-orange-500 underline decoration-orange-500/30">محركنا</span></h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">قصص نجاح نكتبها يومياً مع آلاف المستخدمين في مدينة العبور.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { name: "أحمد كمال", role: "رائد أعمال", text: "وصلي غير مفهوم التوصيل في العبور. الدقة في المواعيد مذهلة والخدمة راقية جداً." },
              { name: "ليلى حسن", role: "طبيبة", text: "أعتمد عليهم في مقاضي البيت والأدوية. الأمان والخصوصية أهم ما يميزهم." },
              { name: "ياسين علي", role: "طالب جامعي", text: "تطبيق سريع جداً والعروض دائماً مميزة. المندوبين قمة في الاحترام." },
            ].map((t, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 space-y-8"
              >
                <Quote className="text-orange-500 h-12 w-12 opacity-50" />
                <p className="text-xl text-white font-medium leading-relaxed italic text-right">"{t.text}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-white/10 justify-end">
                  <div className="text-right">
                    <div className="text-lg font-black text-white">{t.name}</div>
                    <div className="text-sm font-bold text-orange-500 uppercase tracking-wider">{t.role}</div>
                  </div>
                  <img src={`https://i.pravatar.cc/100?img=${i+30}`} className="w-14 h-14 rounded-full border-2 border-orange-500/30" alt={t.name} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Clean Modern Look */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">لديك استفسار؟ <span className="text-orange-500">نحن هنا</span></h2>
            <p className="text-lg text-slate-500 font-medium">كل ما تحتاج لمعرفته حول استخدام وصلي.</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-6">
            {[
              { q: "ما الذي يميز وصلي عن غيره؟", a: "نحن نركز حصرياً على مدينة العبور، مما يمنحنا سرعة فائقة ومعرفة دقيقة بكل شارع وحي، بالإضافة لخدمة عملاء محلية متميزة." },
              { q: "كيف يمكنني الانضمام كفرد في فريق التوصيل؟", a: "نحن نرحب دائماً بالمجتهدين. يمكنك التقديم عبر التطبيق في قسم 'انضم كمناديب' وسيتواصل معك فريقنا خلال 24 ساعة." },
              { q: "هل الخدمة متوفرة على مدار الساعة؟", a: "نعم، وصلي يعمل 24/7 لخدمتكم، سواء كان طلباً متأخراً من مطعم أو حاجة ملحة من الصيدلية." },
              { q: "ما هي طرق الدفع المتاحة؟", a: "نوفر جميع خيارات الدفع: نقداً عند الاستلام، البطاقات الائتمانية، والمحافظ الإلكترونية لتسهيل تجربتك." },
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

      {/* Footer - Premium Dark Design */}
      <footer className="bg-slate-950 text-white pt-32 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8 text-center sm:text-right">
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <img src="/logo.jpg" alt="Wasly Logo" className="h-16 w-16 object-contain rounded-2xl" />
                <span className="text-3xl font-black tracking-tighter">وصلي</span>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                نعيد تعريف مفهوم التوصيل في مصر، نبدأ من مدينة العبور لنصل إلى كل بيت بجودة عالمية.
              </p>
              <div className="flex gap-4 justify-center sm:justify-start">
                {['fb', 'tw', 'ig', 'li'].map(s => (
                  <div key={s} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-orange-500 transition-all cursor-pointer">
                    <Globe className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="text-xl font-black mb-10 text-orange-500">الشركة</h4>
              <ul className="space-y-6 text-slate-400 text-base font-bold">
                <li><button className="hover:text-white transition-all">من نحن</button></li>
                <li><button className="hover:text-white transition-all">وظائف شاغرة</button></li>
                <li><button className="hover:text-white transition-all">سياسة الخصوصية</button></li>
                <li><button className="hover:text-white transition-all">الشروط والأحكام</button></li>
              </ul>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="text-xl font-black mb-10 text-orange-500">الخدمات</h4>
              <ul className="space-y-6 text-slate-400 text-base font-bold">
                <li><button className="hover:text-white transition-all">توصيل مطاعم</button></li>
                <li><button className="hover:text-white transition-all">شحن طرود</button></li>
                <li><button className="hover:text-white transition-all">طلبات السوبر ماركت</button></li>
                <li><button className="hover:text-white transition-all">توصيل صيدليات</button></li>
              </ul>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="text-xl font-black mb-10 text-orange-500">تواصل معنا</h4>
              <ul className="space-y-6 text-slate-400 text-base font-bold">
                <li className="flex items-center gap-4 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-orange-500" />
                  </div>
                  مدينة العبور، الحي الخامس
                </li>
                <li className="flex items-center gap-4 justify-center sm:justify-start">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-orange-500" />
                  </div>
                  دعم فني: 19XXX
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-bold italic">صنع بكل حب لخدمة مدينة العبور ❤️</p>
            <p className="text-slate-500 text-sm font-black tracking-widest uppercase">© 2026 WASLY PREMIUM DELIVERY. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;900&display=swap');
        
        body {
          font-family: 'Cairo', sans-serif;
          scroll-behavior: smooth;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
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
