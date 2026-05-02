import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Phone, Lock, Mail, User, Truck, ShieldCheck, Star } from "lucide-react";
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
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "customer",
  });

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

  const handleLoginChange = (field: string, value: string) => setLoginData(prev => ({ ...prev, [field]: value }));
  const handleRegisterChange = (field: string, value: string) => setRegisterData(prev => ({ ...prev, [field]: value }));

  const utils = trpc.useUtils();
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
      utils.auth.me.setData(undefined, result.user as any);
      await utils.auth.me.invalidate();
      toast.success("مرحباً بك في عالم وصلي الفاخر");
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
      toast.error("يرجى التحقق من البيانات (كلمة المرور 8 أحرف على الأقل)");
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
      utils.auth.me.setData(undefined, result.user as any);
      await utils.auth.me.invalidate();
      toast.success("تم إنشاء حسابك الملكي بنجاح");
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
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 font-sans overflow-hidden relative" dir="rtl">
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#FF6B00]/10 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FFD700]/5 rounded-full blur-[130px]"></div>
      
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Branding */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="hidden lg:flex flex-col space-y-12 text-white"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase text-[#FF6B00]">
                <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                Premium Member Access
              </div>
              <div className="flex items-center gap-6">
                <div className="bg-[#121214] p-4 rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <img src="/assets/logo.jpg" alt="وصلي" className="h-20 w-20 rounded-2xl" />
                </div>
                <h1 className="text-9xl font-[1000] tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">وصلي</h1>
              </div>
              <p className="text-4xl font-black leading-tight text-gray-300">
                انضم إلى <span className="text-[#FF6B00]">النخبة</span> <br />
                في عالم التوصيل.
              </p>
            </div>
            
            <div className="space-y-6 opacity-60">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <ShieldCheck className="text-[#FFD700]" />
                </div>
                <p className="font-bold text-lg">أمان وحماية بضمان وصلي</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Clock className="text-[#FF6B00]" />
                </div>
                <p className="font-bold text-lg">دقة متناهية في المواعيد</p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-0 shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden bg-[#121214] rounded-[3rem] border-white/5 border">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-24 p-2 bg-[#0A0A0B] border-b border-white/5">
                    <TabsTrigger 
                      value="login" 
                      className="text-xl font-black rounded-[2rem] data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white transition-all duration-500"
                    >
                      دخول
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="text-xl font-black rounded-[2rem] data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white transition-all duration-500"
                    >
                      تسجيل
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-10 md:p-14">
                    <AnimatePresence mode="wait">
                      <TabsContent value="login" className="mt-0 outline-none">
                        <form onSubmit={handleLogin} className="space-y-8">
                          <div className="space-y-6">
                            <div className="relative group">
                              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                              <Input 
                                type="tel" 
                                placeholder="رقم الهاتف" 
                                className="h-16 pr-12 bg-[#0A0A0B] border-white/10 rounded-2xl text-white text-lg focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 transition-all"
                                value={loginData.phone}
                                onChange={(e) => handleLoginChange("phone", e.target.value)}
                              />
                            </div>
                            <div className="relative group">
                              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                              <Input 
                                type={showLoginPassword ? "text" : "password"} 
                                placeholder="كلمة المرور" 
                                className="h-16 pr-12 pl-12 bg-[#0A0A0B] border-white/10 rounded-2xl text-white text-lg focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 transition-all"
                                value={loginData.password}
                                onChange={(e) => handleLoginChange("password", e.target.value)}
                              />
                              <button 
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                              >
                                {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>
                          <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-20 bg-[#FF6B00] hover:bg-[#FF8533] text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-[#FF6B00]/20 transition-all duration-500 active:scale-95"
                          >
                            {isLoading ? <Loader2 className="animate-spin" /> : "تسجيل الدخول الملكي"}
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="register" className="mt-0 outline-none">
                        <form onSubmit={handleRegister} className="space-y-6">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="relative group">
                              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                              <Input 
                                placeholder="الاسم الكامل" 
                                className="h-14 pr-12 bg-[#0A0A0B] border-white/10 rounded-2xl text-white focus:border-[#FF6B00] transition-all"
                                value={registerData.name}
                                onChange={(e) => handleRegisterChange("name", e.target.value)}
                              />
                            </div>
                            <div className="relative group">
                              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                              <Input 
                                type="tel" 
                                placeholder="رقم الهاتف" 
                                className="h-14 pr-12 bg-[#0A0A0B] border-white/10 rounded-2xl text-white focus:border-[#FF6B00] transition-all"
                                value={registerData.phone}
                                onChange={(e) => handleRegisterChange("phone", e.target.value)}
                              />
                            </div>
                            <div className="relative group">
                              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                              <Input 
                                type={showRegisterPassword ? "text" : "password"} 
                                placeholder="كلمة المرور" 
                                className="h-14 pr-12 bg-[#0A0A0B] border-white/10 rounded-2xl text-white focus:border-[#FF6B00] transition-all"
                                value={registerData.password}
                                onChange={(e) => handleRegisterChange("password", e.target.value)}
                              />
                            </div>
                            <Select value={registerData.role} onValueChange={(v) => handleRegisterChange("role", v)}>
                              <SelectTrigger className="h-14 bg-[#0A0A0B] border-white/10 rounded-2xl text-white focus:border-[#FF6B00]">
                                <SelectValue placeholder="نوع الحساب" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#121214] border-white/10 text-white">
                                <SelectItem value="customer">عميل (طلب خدمات)</SelectItem>
                                <SelectItem value="driver">كابتن (تقديم خدمات)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-20 bg-[#FF6B00] hover:bg-[#FF8533] text-white text-xl font-black rounded-[2rem] shadow-2xl transition-all duration-500"
                          >
                            {isLoading ? <Loader2 className="animate-spin" /> : "إنشاء حساب فاخر"}
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
