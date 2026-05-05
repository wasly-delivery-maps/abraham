import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2, Menu, X, Facebook, Home as HomeIcon, ShoppingBag, User, Search, Bell, Utensils, Package, ShoppingCart, Pill, ChefHat, Leaf, Heart, ChevronDown, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 sm:pb-0 overflow-x-hidden" dir="rtl">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm py-2" : "bg-transparent py-4"}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="bg-orange-500 p-2 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-200"
            >
              <Truck className="text-white h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none tracking-tight">وصلي</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-orange-600 uppercase tracking-widest">Obour City</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 bg-white/50 backdrop-blur-md rounded-full border border-slate-100 text-slate-600"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute top-0.5 right-0.5 bg-orange-500 w-1.5 h-1.5 rounded-full border border-white"></span>
            </motion.button>
            <Link href="/auth">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-slate-200"
              >
                دخول
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-full sm:w-1/2 h-full bg-orange-50/50 rounded-bl-[50px] sm:rounded-bl-[100px]"></div>
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 sm:space-y-8 text-center lg:text-right"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-[10px] sm:text-xs font-bold">
              <Zap className="h-3 w-3 fill-orange-700" />
              أسرع خدمة توصيل في مدينة العبور
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.2] sm:leading-[1.1]">
              طلبك يوصل <br />
              <span className="text-orange-500">قبل ما تجوع!</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-sm sm:text-lg text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0">
              نحن نجمع بين التكنولوجيا والسرعة لنقدم لك أفضل تجربة توصيل في المدينة. اطلب الآن واستمتع بخصومات حصرية.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/auth">
                <Button className="h-12 sm:h-14 px-8 sm:px-10 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-base sm:text-lg font-bold shadow-xl shadow-orange-200 w-full sm:w-auto">
                  اطلب الآن
                </Button>
              </Link>
              <div className="flex items-center gap-3 px-4 justify-center">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                    </div>
                  ))}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 text-right">
                  <span className="text-slate-900 block">+5,000 مستخدم</span>
                  يثقون بنا يومياً
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative z-10 rounded-[30px] sm:rounded-[40px] overflow-hidden shadow-2xl border-4 sm:border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1526367790999-0150786486a9?q=80&w=2070&auto=format&fit=crop" 
                alt="Delivery" 
                className="w-full h-[300px] sm:h-[500px] object-cover"
              />
            </div>
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 z-20 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-50"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="text-green-600 h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400">حالة الطلب</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">تم التوصيل بنجاح!</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">خدماتنا المتكاملة</h2>
            <p className="text-sm sm:text-slate-500 font-medium px-4">كل ما تحتاجه في مكان واحد، نصل إليك أينما كنت في العبور.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: "المطاعم", icon: Utensils, desc: "أشهى الوجبات من مطاعمك المفضلة", color: "orange", bg: "bg-orange-50", text: "text-orange-600" },
              { title: "الطرود", icon: Package, desc: "توصيل آمن وسريع لجميع طرودك", color: "blue", bg: "bg-blue-50", text: "text-blue-600" },
              { title: "سوبر ماركت", icon: ShoppingCart, desc: "مقاضي البيت توصلك لحد الباب", color: "green", bg: "bg-green-50", text: "text-green-600" },
              { title: "الصيدلية", icon: Pill, desc: "أدويتك واحتياجاتك الطبية بسرعة", color: "red", bg: "bg-red-50", text: "text-red-600" },
            ].map((service, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="group p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-[#F8F9FB] hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-slate-50"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${service.bg} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`${service.text} h-6 w-6 sm:h-8 sm:w-8`} />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 sm:mb-3">{service.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">{service.desc}</p>
                <Link href="/auth">
                  <button className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
                    اطلب الآن
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-20 bg-[#F8F9FB]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 items-center">
            <div className="lg:w-1/3 space-y-4 sm:space-y-6 text-center lg:text-right">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">ماذا يقول <br /><span className="text-orange-500">عملاؤنا؟</span></h2>
              <p className="text-sm sm:text-slate-500 font-medium leading-relaxed">ثقة عملائنا هي سر نجاحنا، نسعى دائماً لتقديم الأفضل.</p>
              <div className="flex justify-center lg:justify-start gap-4 pt-2">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-black text-slate-900">4.9/5</div>
                  <div className="flex text-orange-400 gap-0.5 justify-center">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-black text-slate-900">+10k</div>
                  <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">تقييم إيجابي</div>
                </div>
              </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
              {[
                { name: "أحمد محمود", text: "أسرع خدمة توصيل جربتها في العبور، الأكل بيوصل سخن وكأنك في المطعم.", role: "عميل دائم" },
                { name: "سارة حسن", text: "تطبيق سهل جداً والمناديب محترمين جداً، شكراً وصلي على الخدمة الممتازة.", role: "مستخدم جديد" },
              ].map((t, i) => (
                <motion.div key={i} className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-50 space-y-3 sm:space-y-4">
                  <Quote className="text-orange-100 h-8 w-8 sm:h-10 sm:w-10 fill-current" />
                  <p className="text-sm sm:text-slate-600 font-medium leading-relaxed italic text-right">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 justify-end">
                    <div className="text-right">
                      <div className="font-black text-xs sm:text-sm text-slate-900">{t.name}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-orange-500">{t.role}</div>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt={t.name} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">الأسئلة الشائعة</h2>
            <p className="text-sm sm:text-slate-500 font-medium">كل ما تريد معرفته عن خدمات وصلي</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {[
              { q: "ما هي مناطق التغطية الحالية؟", a: "حالياً نغطي جميع أحياء مدينة العبور بالكامل، ونسعى للتوسع في المدن المجاورة قريباً." },
              { q: "كم يستغرق وقت التوصيل؟", a: "متوسط وقت التوصيل لدينا هو 15-25 دقيقة، ويعتمد ذلك على المسافة وتجهيز الطلب." },
              { q: "هل يوجد حد أدنى للطلب؟", a: "لا يوجد حد أدنى للطلب في وصلي، يمكنك طلب أي شيء مهما كان حجمه." },
              { q: "كيف يمكنني تتبع طلبي؟", a: "بمجرد قبول الطلب، يمكنك تتبعه مباشرة على الخريطة من خلال التطبيق لحظة بلحظة." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-[#F8F9FB] rounded-xl sm:rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="hover:no-underline font-bold text-sm sm:text-base text-slate-900 py-4 sm:py-6 text-right">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed pb-4 sm:pb-6 text-right">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-12 sm:pt-20 pb-24 sm:pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-12 sm:mb-16">
            <div className="space-y-4 sm:space-y-6 text-center sm:text-right">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="bg-orange-500 p-2 rounded-lg sm:rounded-xl">
                  <Truck className="text-white h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-xl sm:text-2xl font-black">وصلي</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                المنصة الرائدة للتوصيل الذكي في مدينة العبور. نجمع بين السرعة والأمان لخدمتك.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <h4 className="font-black mb-4 sm:mb-6 text-sm sm:text-base">روابط سريعة</h4>
              <ul className="space-y-3 sm:space-y-4 text-slate-400 text-xs sm:text-sm font-bold">
                <li><Link href="/auth">عن وصلي</Link></li>
                <li><Link href="/auth">انضم كشريك</Link></li>
                <li><Link href="/auth">كن سائقاً معنا</Link></li>
                <li><Link href="/auth">تواصل معنا</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-right">
              <h4 className="font-black mb-4 sm:mb-6 text-sm sm:text-base">خدماتنا</h4>
              <ul className="space-y-3 sm:space-y-4 text-slate-400 text-xs sm:text-sm font-bold">
                <li>توصيل الطعام</li>
                <li>توصيل الطرود</li>
                <li>سوبر ماركت</li>
                <li>صيدلية</li>
              </ul>
            </div>
            <div className="text-center sm:text-right">
              <h4 className="font-black mb-4 sm:mb-6 text-sm sm:text-base">تواصل معنا</h4>
              <ul className="space-y-3 sm:space-y-4 text-slate-400 text-xs sm:text-sm font-bold">
                <li className="flex items-center gap-3 justify-center sm:justify-start">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  مدينة العبور، مصر
                </li>
                <li className="flex items-center gap-3 justify-center sm:justify-start">
                  <Bell className="h-4 w-4 text-orange-500" />
                  دعم فني 24/7
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 sm:pt-10 border-t border-slate-800 text-center text-slate-500 text-[10px] sm:text-xs font-bold">
            © 2026 وصلي. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 z-50 sm:hidden flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
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
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? "text-orange-500" : "text-slate-400"}`}
          >
            <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === item.id ? "fill-orange-500/10" : ""}`} />
            <span className="text-[9px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      <style jsx global>{`
        @font-face {
          font-family: 'Cairo';
          src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        }
        body {
          font-family: 'Cairo', sans-serif;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
