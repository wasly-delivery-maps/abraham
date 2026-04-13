import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Phone, Lock, Mail, User, Truck, ShieldCheck } from "lucide-react";
import { normalizePhoneNumber } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({
    phone: "",
    password: "",
  });

  // Register state
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "customer",
  });

  // tRPC mutations
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  useEffect(() => {
    try {
      sessionStorage.removeItem("auth_form_data");
      sessionStorage.removeItem("register_form_data");
    } catch (e) {
      console.warn("SessionStorage access warning:", e);
    }
  }, []);

  const handleLoginChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegisterChange = (field: string, value: string) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.phone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    if (!loginData.password.trim()) {
      toast.error("يرجى إدخال كلمة المرور");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(loginData.phone);
      
      const result = await loginMutation.mutateAsync({
        phone: normalizedPhone,
        password: loginData.password,
      });

      toast.success("مرحباً بك! تم تسجيل الدخول بنجاح");

      setLoginData({ phone: "", password: "" });

      if (result.user?.role === "driver") {
        navigate("/driver/dashboard");
      } else if (result.user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error?.message || "فشل تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.name.trim()) {
      toast.error("يرجى إدخال الاسم الكامل");
      return;
    }

    if (registerData.name.trim().length < 2) {
      toast.error("الاسم يجب أن يكون حرفين على الأقل");
      return;
    }

    if (!registerData.phone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    if (!registerData.password.trim()) {
      toast.error("يرجى إدخال كلمة المرور");
      return;
    }

    if (registerData.password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
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
        role: registerData.role as "customer" | "driver" | "admin",
      });

      toast.success("مرحباً! تم إنشاء حسابك بنجاح");

      setRegisterData({
        name: "",
        phone: "",
        email: "",
        password: "",
        role: "customer",
      });

      if (result.user?.role === "driver") {
        navigate("/driver/dashboard");
      } else if (result.user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      const errorMessage = error?.message || "فشل التسجيل. يرجى التحقق من البيانات والمحاولة مرة أخرى.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginPending = loginMutation.isPending || isLoading;
  const isRegisterPending = registerMutation.isPending || isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center p-4 font-sans" dir="rtl">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex flex-col justify-center space-y-8 text-white"
          >
            <div className="space-y-4">
              <motion.div 
                className="inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm font-bold tracking-widest uppercase"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                منصة التوصيل رقم #1
              </motion.div>
              <h1 className="text-7xl font-black tracking-tighter">وصلي</h1>
              <p className="text-2xl font-medium opacity-90 leading-relaxed">
                الجيل القادم من خدمات التوصيل الذكية والموثوقة في مصر.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4">
              {[
                { icon: Truck, title: "توصيل فائق السرعة", desc: "نصل إليك في أسرع وقت ممكن وبأمان تام." },
                { icon: ShieldCheck, title: "أمان وموثوقية", desc: "طرودك في أيدٍ أمينة مع نظام تتبع حي." },
                { icon: User, title: "دعم فني متواصل", desc: "فريقنا متاح لخدمتك على مدار الساعة." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-start gap-5 group"
                >
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:bg-white group-hover:text-orange-600 transition-all duration-300 shadow-xl">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl">{item.title}</h3>
                    <p className="text-white/70 font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Auth Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-0 overflow-hidden rounded-[2.5rem] bg-white/95 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  {/* Tab Headers */}
                  <div className="bg-slate-50/50 border-b border-slate-100">
                    <TabsList className="w-full h-auto p-2 bg-transparent rounded-none grid grid-cols-2 gap-2">
                      <TabsTrigger 
                        value="login" 
                        disabled={isLoading}
                        className="rounded-2xl py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-black text-lg transition-all"
                      >
                        تسجيل الدخول
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register" 
                        disabled={isLoading}
                        className="rounded-2xl py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 font-black text-lg transition-all"
                      >
                        إنشاء حساب
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-8 lg:p-10">
                    <AnimatePresence mode="wait">
                      {activeTab === "login" ? (
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900">أهلاً بك مجدداً!</h2>
                            <p className="text-slate-500 font-medium">سجل دخولك لمتابعة طلباتك</p>
                          </div>

                          <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-sm font-black text-slate-700 mr-1">رقم الهاتف</label>
                              <div className="relative group">
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <Input
                                  type="tel"
                                  placeholder="01xxxxxxxxx"
                                  value={loginData.phone}
                                  onChange={(e) => handleLoginChange("phone", e.target.value)}
                                  disabled={isLoginPending}
                                  required
                                  className="pr-12 py-7 text-lg border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-orange-500/20 bg-slate-50/50 font-bold"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center mr-1">
                                <label className="text-sm font-black text-slate-700">كلمة المرور</label>
                                <button type="button" className="text-xs font-bold text-orange-600 hover:underline">نسيت كلمة المرور؟</button>
                              </div>
                              <div className="relative group">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <Input
                                  type={showLoginPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={loginData.password}
                                  onChange={(e) => handleLoginChange("password", e.target.value)}
                                  disabled={isLoginPending}
                                  required
                                  className="pr-12 py-7 text-lg border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-orange-500/20 bg-slate-50/50 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              disabled={isLoginPending}
                              className="w-full py-8 text-xl font-black bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
                            >
                              {isLoginPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "دخول آمن"}
                            </Button>
                          </form>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="register"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="space-y-6"
                        >
                          <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900">انضم إلينا اليوم</h2>
                            <p className="text-slate-500 font-medium">اختر نوع الحساب وابدأ رحلتك</p>
                          </div>

                          <form onSubmit={handleRegister} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">الاسم الكامل</label>
                                <div className="relative group">
                                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                  <Input
                                    placeholder="أحمد محمد"
                                    value={registerData.name}
                                    onChange={(e) => handleRegisterChange("name", e.target.value)}
                                    disabled={isRegisterPending}
                                    required
                                    className="pr-12 py-6 border-slate-200 rounded-2xl focus:border-orange-500 bg-slate-50/50 font-bold"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">رقم الهاتف</label>
                                <div className="relative group">
                                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                  <Input
                                    type="tel"
                                    placeholder="01xxxxxxxxx"
                                    value={registerData.phone}
                                    onChange={(e) => handleRegisterChange("phone", e.target.value)}
                                    disabled={isRegisterPending}
                                    required
                                    className="pr-12 py-6 border-slate-200 rounded-2xl focus:border-orange-500 bg-slate-50/50 font-bold"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-black text-slate-700 mr-1">نوع الحساب</label>
                              <Select 
                                value={registerData.role} 
                                onValueChange={(v) => handleRegisterChange("role", v)}
                                disabled={isRegisterPending}
                              >
                                <SelectTrigger className="py-6 border-slate-200 rounded-2xl bg-slate-50/50 font-bold">
                                  <SelectValue placeholder="اختر نوع الحساب" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                  <SelectItem value="customer" className="py-3 font-bold cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-orange-500" />
                                      <span>عميل (أريد طلب توصيل)</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="driver" className="py-3 font-bold cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <Truck className="w-4 h-4 text-orange-500" />
                                      <span>سائق (أريد العمل كمندوب)</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="admin" className="py-3 font-bold cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-orange-500" />
                                      <span>مسؤول (إدارة النظام)</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-black text-slate-700 mr-1">كلمة المرور</label>
                              <div className="relative group">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <Input
                                  type={showRegisterPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  value={registerData.password}
                                  onChange={(e) => handleRegisterChange("password", e.target.value)}
                                  disabled={isRegisterPending}
                                  required
                                  className="pr-12 py-6 border-slate-200 rounded-2xl focus:border-orange-500 bg-slate-50/50 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                  {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              disabled={isRegisterPending}
                              className="w-full py-8 text-xl font-black bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
                            >
                              {isRegisterPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "إنشاء الحساب الآن"}
                            </Button>
                          </form>
                        </motion.div>
                      )}
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
