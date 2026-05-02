import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Truck, MapPin, Clock, Star, Zap, Shield, ArrowRight, CheckCircle2, Menu, X, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl border-t-4 border-[#FF6B00] animate-spin"></div>
            <div className="absolute inset-0 h-16 w-16 rounded-2xl border-4 border-[#FF6B00]/10"></div>
          </div>
          <p className="text-[#FF6B00] font-black tracking-widest animate-pulse">WASLY PREMIUM</p>
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
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-x-hidden selection:bg-[#FF6B00]/30 selection:text-white" dir="rtl">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#FF6B00] to-[#FFD700] rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <img 
                src="/assets/logo.jpg" 
                alt="وصلي" 
                className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl shadow-2xl border border-white/10 transform group-hover:rotate-3 transition-transform duration-500"
              />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-[#FFD700] via-[#FF6B00] to-[#FF6B00] bg-clip-text text-transparent tracking-tighter">وصلي</span>
              <span className="text-[10px] font-bold text-[#FF6B00]/60 tracking-[0.2em] uppercase mr-1">Premium Delivery</span>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[15px] font-bold text-gray-400">
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-all duration-300 relative group py-2"
              >
                المميزات
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#FF6B00] transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-all duration-300 relative group py-2"
              >
                كيف نعمل
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#FF6B00] transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
            <Link href="/auth">
              <Button className="bg-white/5 hover:bg-[#FF6B00] text-white px-8 h-12 rounded-xl font-bold border border-white/10 transition-all duration-500 hover:-translate-y-1 active:scale-95">
                دخول / تسجيل
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-[#FF6B00] hover:bg-white/5 rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#FF6B00]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FFD700]/5 rounded-full blur-[100px]"></div>

        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-10 text-center lg:text-right"
            >
              <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-2xl">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6B00]"></span>
                </span>
                <span className="text-sm font-black text-gray-300 tracking-wide">الخدمة الأفخم في مدينة العبور 🏆</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-6xl sm:text-7xl lg:text-9xl font-[1000] leading-[1] tracking-tighter">
                  توصيل <br />
                  <span className="bg-gradient-to-tr from-[#FFD700] via-[#FF6B00] to-[#FF6B00] bg-clip-text text-transparent relative inline-block">
                    ملكي
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                  استمتع بتجربة توصيل فريدة تمزج بين الفخامة والسرعة الفائقة. نحن لا نوصل الطلبات فحسب، بل نقدم لك الرفاهية التي تستحقها.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-[#FF6B00] hover:bg-[#FF8533] text-white text-xl px-12 h-20 rounded-2xl font-black shadow-[0_20px_50px_rgba(255,107,0,0.3)] transition-all duration-500 hover:-translate-y-2 active:scale-95 group">
                    اطلب الآن <ArrowRight className="mr-3 h-6 w-6 group-hover:translate-x-[-6px] transition-transform duration-300" />
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="bg-white/5 backdrop-blur-sm text-xl px-10 h-20 rounded-2xl font-black border-2 border-white/10 text-white hover:bg-white/10 transition-all duration-500 active:scale-95">
                    انضم ككابتن 🏍️
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-8 opacity-50">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#FFD700]" />
                  <span className="text-sm font-bold">تأمين ذهبي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#FF6B00]" />
                  <span className="text-sm font-bold">سرعة البرق</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FFD700]" />
                  <span className="text-sm font-bold">خدمة VIP</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative z-10 animate-float">
                <div className="absolute -inset-4 bg-[#FF6B00]/20 blur-[100px] rounded-full"></div>
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663574548635/TFCiPaicWQMgbGKm.png"
                  alt="وصلي بريميوم"
                  className="w-full h-auto drop-shadow-[0_50px_50px_rgba(0,0,0,0.5)] rounded-[3rem] border border-white/5"
                />
                {/* Floating Badge */}
                <div className="absolute -top-10 -right-10 bg-[#121214] p-6 rounded-[2rem] shadow-2xl border border-white/10 hidden sm:block">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#FF6B00]/10 p-3 rounded-2xl">
                      <Star className="text-[#FFD700] h-8 w-8 fill-[#FFD700]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Status</p>
                      <p className="text-lg font-black text-white">Premium Only</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-[#0A0A0B] relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-[#FF6B00] font-black tracking-[0.3em] uppercase text-sm">Wasly Experience</h2>
            <h3 className="text-5xl lg:text-6xl font-black text-white">لماذا يختارنا النخبة؟</h3>
            <p className="text-lg text-gray-500 font-medium">نحن لا نقدم خدمة توصيل عادية، نحن نقدم معياراً جديداً من الرقي والدقة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "سرعة نيون", 
                desc: "نظام لوجستي ذكي يضمن وصول طلبك في زمن قياسي.",
                color: "#FF6B00"
              },
              { 
                icon: Shield, 
                title: "أمان ملكي", 
                desc: "تغليف فاخر وحماية قصوى لكل طرد يصل إليك.",
                color: "#FFD700"
              },
              { 
                icon: Star, 
                title: "دعم VIP", 
                desc: "فريق مخصص لخدمتك على مدار الساعة وبأعلى معايير اللباقة.",
                color: "#FF6B00"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-[#121214] p-10 rounded-[2.5rem] border border-white/5 hover:border-[#FF6B00]/30 transition-all duration-500 group"
              >
                <div className="bg-[#0A0A0B] w-20 h-20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                  <feature.icon className="h-10 w-10" style={{ color: feature.color }} />
                </div>
                <h4 className="text-2xl font-black text-white mb-4">{feature.title}</h4>
                <p className="text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#0A0A0B]">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4">
              <img src="/assets/logo.jpg" alt="وصلي" className="h-12 w-12 rounded-xl" />
              <span className="text-2xl font-black tracking-tighter">وصلي بريميوم</span>
            </div>
            <p className="text-gray-500 max-w-md font-medium">
              نحن هنا لنرتقي بتوقعاتك. كل طلب هو مهمة خاصة نقوم بها بأعلى قدر من الاحترافية.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-[#FF6B00] transition-colors"><Facebook className="h-6 w-6" /></a>
            </div>
            <div className="text-sm text-gray-600 font-bold tracking-widest pt-8">
              © 2026 WASLY PREMIUM DELIVERY. ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
