import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Phone, Lock, User, ShieldCheck, Star, ArrowLeft } from "lucide-react";
import { normalizePhoneNumber } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", phone: "", email: "", password: "", role: "customer" });

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const { user, isAuthenticated, loading: authLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "driver") navigate("/driver/dashboard");
      else if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/customer/dashboard?tab=restaurants");
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.phone.trim() || !loginData.password.trim()) {
      toast.error("يرجى إدخال كافة البيانات");
      return;
    }
    setIsLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(loginData.phone);
      const result = await loginMutation.mutateAsync({ phone: normalizedPhone, password: loginData.password });
      toast.success("مرحباً بك في وصلي");
      setTimeout(() => {
        if (result.user?.role === "driver") navigate("/driver/dashboard");
        else if (result.user?.role === "admin") navigate("/admin/dashboard");
        else navigate("/customer/dashboard?tab=restaurants");
      }, 100);
    } catch (error: any) {
      toast.error(error?.message || "فشل تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.name.trim() || !registerData.phone.trim() || registerData.password.length < 8) {
      toast.error("يرجى التحقق من البيانات");
      return;
    }
    setIsLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(registerData.phone);
      const result = await registerMutation.mutateAsync({
        phone: normalizedPhone,
        password: registerData.password,
        name: registerData.name,
        email: registerData.email || undefined,
        role: registerData.role as "customer" | "driver",
      });
      toast.success("تم إنشاء حسابك بنجاح");
      setTimeout(() => {
        if (result.user?.role === "driver") navigate("/driver/dashboard");
        else if (result.user?.role === "admin") navigate("/admin/dashboard");
        else navigate("/customer/dashboard?tab=restaurants");
      }, 100);
    } catch (error: any) {
      toast.error(error?.message || "فشل التسجيل");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[80px]"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Branding */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="hidden lg:flex flex-col space-y-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors font-bold text-sm mb-4">
              <ArrowLeft size={18} /> العودة للرئيسية
            </button>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase text-orange-600 border border-orange-100">
                <Star size={12} className="fill-orange-600" /> Premium Member Access
              </div>
              <h1 className="text-7xl font-black text-slate-900 tracking-tight">مرحباً بك <br /><span className="text-orange-600">مرة أخرى</span></h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-sm">سجل دخولك الآن لتستمتع بأسرع خدمة توصيل في مدينة العبور.</p>
            </div>
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3 text-slate-600 font-bold">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600 border border-slate-100"><ShieldCheck size={20} /></div>
                <span>حماية تامة لبياناتك وطلباتك</span>
              </div>
            </div>
          </motion.div>

          {/* Right Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2.5rem]">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-20 p-2 bg-slate-50/50 border-b border-slate-100">
                    <TabsTrigger value="login" className="text-lg font-black rounded-2xl data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all">دخول</TabsTrigger>
                    <TabsTrigger value="register" className="text-lg font-black rounded-2xl data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all">تسجيل</TabsTrigger>
                  </TabsList>

                  <div className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                      <TabsContent value="login" className="mt-0 outline-none">
                        <form onSubmit={handleLogin} className="space-y-6">
                          <div className="space-y-4">
                            <div className="relative group">
                              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                              <Input type="tel" placeholder="رقم الهاتف" className="h-14 pr-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all" value={loginData.phone} onChange={(e) => setLoginData(p => ({ ...p, phone: e.target.value }))} />
                            </div>
                            <div className="relative group">
                              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                              <Input type={showLoginPassword ? "text" : "password"} placeholder="كلمة المرور" className="h-14 pr-12 pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all" value={loginData.password} onChange={(e) => setLoginData(p => ({ ...p, password: e.target.value }))} />
                              <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                                {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          <Button type="submit" disabled={isLoading} className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black rounded-2xl shadow-lg shadow-orange-100 transition-all">
                            {isLoading ? <Loader2 className="animate-spin" /> : "تسجيل الدخول"}
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="register" className="mt-0 outline-none">
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div className="relative group">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                            <Input placeholder="الاسم الكامل" className="h-14 pr-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all" value={registerData.name} onChange={(e) => setRegisterData(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div className="relative group">
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                            <Input type="tel" placeholder="رقم الهاتف" className="h-14 pr-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all" value={registerData.phone} onChange={(e) => setRegisterData(p => ({ ...p, phone: e.target.value }))} />
                          </div>
                          <div className="relative group">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
                            <Input type={showRegisterPassword ? "text" : "password"} placeholder="كلمة المرور (8 أحرف)" className="h-14 pr-12 pl-12 bg-slate-50 border-slate-100 rounded-xl focus:bg-white transition-all" value={registerData.password} onChange={(e) => setRegisterData(p => ({ ...p, password: e.target.value }))} />
                          </div>
                          <Select value={registerData.role} onValueChange={(v) => setRegisterData(p => ({ ...p, role: v }))}>
                            <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-xl">
                              <SelectValue placeholder="نوع الحساب" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100">
                              <SelectItem value="customer">عميل (طلب خدمات)</SelectItem>
                              <SelectItem value="driver">كابتن (تقديم خدمات)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" disabled={isLoading} className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white text-lg font-black rounded-2xl shadow-lg shadow-orange-100 transition-all mt-4">
                            {isLoading ? <Loader2 className="animate-spin" /> : "إنشاء الحساب"}
                          </Button>
                        </form>
                      </TabsContent>
                    </AnimatePresence>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
