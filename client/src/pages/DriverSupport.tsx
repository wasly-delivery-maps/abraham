import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, Phone, MapPin, Truck, LogOut, User, Settings, ShieldCheck, ChevronLeft, MessageCircle, HelpCircle, Loader2, Send, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DriverSupport() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "driver") {
    navigate("/auth");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const handleSendMessage = async () => {
    if (!subject.trim()) {
      toast.error("يرجى كتابة الموضوع أولاً");
      return;
    }
    if (!message.trim()) {
      toast.error("يرجى كتابة الرسالة أولاً");
      return;
    }

    setIsSubmitting(true);
    try {
      // إنشاء رسالة واتساب منسقة
      const whatsappMessage = `
*رسالة دعم من السائق*

*الاسم:* ${user?.name || 'بدون اسم'}
*رقم الهاتف:* ${user?.phone || 'بدون رقم'}
*معرف السائق:* #${user?.id || 'بدون معرف'}
*الموضوع:* ${subject}

*الرسالة:*
${message}
      `.trim();

      // ترميز الرسالة للـ URL
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // فتح واتساب مع الرسالة المعدة
      const whatsappUrl = `https://wa.me/201557564373?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success("تم فتح واتساب! يرجى إرسال الرسالة");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error("فشل في فتح واتساب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-12 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <Button 
              variant="ghost" 
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12 p-0"
              onClick={() => navigate("/driver/profile")}
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
            <h1 className="text-xl font-black tracking-widest uppercase">الدعم الفني</h1>
            <Button 
              variant="ghost" 
              className="text-white/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl h-12 w-12 p-0"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-2xl">
                <div className="h-full w-full rounded-[2.3rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="/support-logo.png" alt="Support Logo" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h2 className="text-4xl font-black">فريق الدعم</h2>
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-white/60 text-sm font-medium">نحن هنا لمساعدتك في أي وقت</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 -mt-20 pb-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Contact */}
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Phone className="h-5 w-5 text-orange-600" />
                  تواصل معنا مباشرة
                </h3>
                <div className="space-y-3">
                  <a href="tel:01557564373" className="flex items-center justify-between bg-slate-50 hover:bg-orange-50 p-4 rounded-2xl transition-all border border-slate-100 hover:border-orange-200">
                    <span className="font-black text-sm text-slate-700">اتصل بنا</span>
                    <Phone className="h-5 w-5 text-orange-600" />
                  </a>
                  <a href="https://wa.me/201557564373" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 hover:bg-green-50 p-4 rounded-2xl transition-all border border-slate-100 hover:border-green-200">
                    <span className="font-black text-sm text-slate-700">واتساب</span>
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </a>
                  <a href="mailto:support@wasly.com" className="flex items-center justify-between bg-slate-50 hover:bg-blue-50 p-4 rounded-2xl transition-all border border-slate-100 hover:border-blue-200">
                    <span className="font-black text-sm text-slate-700">البريد الإلكتروني</span>
                    <Mail className="h-5 w-5 text-blue-600" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card className="border-none shadow-xl bg-blue-50 rounded-[2.5rem] overflow-hidden border border-blue-100">
              <CardContent className="p-8">
                <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  ساعات العمل
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-bold text-blue-700">السبت - الخميس</span>
                    <span className="text-blue-600">9 صباحاً - 9 مساءً</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-blue-700">الجمعة</span>
                    <span className="text-blue-600">2 ظهراً - 9 مساءً</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="border-none shadow-xl bg-amber-50 rounded-[2.5rem] overflow-hidden border border-amber-100">
              <CardContent className="p-8">
                <h3 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  الأسئلة الشائعة
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-amber-700 font-medium">• كيف أزيد أرباحي؟</p>
                  <p className="text-amber-700 font-medium">• كيف أحل مشاكل التطبيق؟</p>
                  <p className="text-amber-700 font-medium">• كيف أتواصل مع العملاء؟</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Form */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden h-full">
              <CardContent className="p-10">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <Send className="h-6 w-6 text-orange-600" />
                  أرسل رسالة للدعم عبر واتساب
                </h3>

                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex gap-4">
                    <MessageCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-black text-green-900 mb-1">تواصل فوري عبر واتساب</p>
                      <p className="text-green-700 text-sm">ستتمكن من التواصل المباشر مع فريق الدعم فور فتح واتساب</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الموضوع</label>
                    <input 
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: مشكلة في التطبيق"
                      className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-bold text-slate-700 placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الرسالة</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اشرح المشكلة أو السؤال بالتفصيل..."
                      rows={8}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-bold text-slate-700 placeholder-slate-400 resize-none"
                    />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 pt-4"
                  >
                    <Button 
                      onClick={handleSendMessage}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-16 rounded-2xl font-black text-lg shadow-xl transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          جاري الفتح...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-5 w-5 ml-2" />
                          فتح واتساب والإرسال
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
