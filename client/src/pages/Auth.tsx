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
  const { user, isAuthenticated, loading: authLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    // If user is already authenticated, redirect them back to their dashboard
    // This prevents logging out when pressing the back button from the dashboard
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "driver") {
        navigate("/driver/dashboard");
      } else if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

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

  const utils = trpc.useUtils();
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

      // تحديث بيانات المستخدم في tRPC cache فوراً لضمان التعرف على الجلسة
      utils.auth.me.setData(undefined, result.user as any);
      await utils.auth.me.invalidate();

      // ربط هوية المستخدم بـ OneSignal للإشعارات المنبثقة (Push Notifications)
      if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
          await OneSignal.login(normalizedPhone);
          // إضافة وسم الدور للمستخدم عند تسجيل الدخول
          await OneSignal.User.addTags({
            role: result.user?.role || "customer",
            phone: normalizedPhone,
            external_id: normalizedPhone
          });
          console.log("[OneSignal] User logged in and tagged:", normalizedPhone, result.user?.role);
        });
      }

      toast.success("مرحباً بك! تم تسجيل الدخول بنجاح");

      setLoginData({ phone: "", password: "" });

      // تأخير بسيط لضمان تحديث الحالة قبل الانتقال
      setTimeout(() => {
        if (result.user?.role === "driver") {
          navigate("/driver/dashboard");
        } else if (result.user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/customer/dashboard");
        }
      }, 100);
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
        role: registerData.role as "customer" | "driver",
      });

      // تحديث بيانات المستخدم في tRPC cache فوراً لضمان التعرف على الجلسة
      utils.auth.me.setData(undefined, result.user as any);
      await utils.auth.me.invalidate();

      // ربط هوية المستخدم بـ OneSignal للإشعارات المنبثقة (Push Notifications)
      if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
          await OneSignal.login(normalizedPhone);
          // إضافة وسم الدور للمستخدم الجديد
          await OneSignal.User.addTags({
            role: result.user?.role || "customer",
            phone: normalizedPhone,
            external_id: normalizedPhone
          });
          console.log("[OneSignal] New user logged in and tagged:", normalizedPhone, result.user?.role);
        });
      }

      toast.success("مرحباً! تم إنشاء حسابك بنجاح");

      setRegisterData({
        name: "",
        phone: "",
        email: "",
        password: "",
        role: "customer",
      });

      // تأخير بسيط لضمان تحديث الحالة قبل الانتقال
      setTimeout(() => {
        if (result.user?.role === "driver") {
          navigate("/driver/dashboard");
        } else if (result.user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/customer/dashboard");
        }
      }, 100);
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
              <div className="flex items-center gap-6">
                <motion.div 
                  className="bg-white p-3 rounded-[2rem] shadow-2xl border-4 border-white/20 overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <img src="/wasly-logo-v2.png" alt="وصلي" className="h-24 w-24 object-contain" />
                </motion.div>
                <h1 className="text-8xl font-black tracking-tighter">وصلي</h1>
              </div>
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
            className="w-full"
          >
            <Card className="border-0 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-20 p-2 bg-gray-100/50">
                    <TabsTrigger 
                      value="login" 
                      className="rounded-2xl text-xl font-bold data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg transition-all"
                    >
                      دخول
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="rounded-2xl text-xl font-bold data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-lg transition-all"
                    >
                      تسجيل جديد
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                      <TabsContent value="login" className="mt-0 outline-none">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          <div className="space-y-2">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">أهلاً بك مجدداً</h2>
                            <p className="text-gray-500 font-medium text-lg">سجل دخولك لمتابعة طلباتك</p>
                          </div>

                          <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-5">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 mr-1">رقم الهاتف</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Phone className="h-5 w-5" />
                                  </div>
                                  <Input
                                    type="tel"
                                    placeholder="01xxxxxxxxx"
                                    className="h-14 pr-12 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all"
                                    value={loginData.phone}
                                    onChange={(e) => handleLoginChange("phone", e.target.value)}
                                    disabled={isLoginPending}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 mr-1">كلمة المرور</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Lock className="h-5 w-5" />
                                  </div>
                                  <Input
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-14 pr-12 pl-12 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all"
                                    value={loginData.password}
                                    onChange={(e) => handleLoginChange("password", e.target.value)}
                                    disabled={isLoginPending}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                                  >
                                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xl font-black shadow-xl shadow-orange-200 transition-all active:scale-[0.98]"
                              disabled={isLoginPending}
                            >
                              {isLoginPending ? (
                                <div className="flex items-center gap-3">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                  <span>جاري التحقق...</span>
                                </div>
                              ) : (
                                "دخول آمن"
                              )}
                            </Button>
                          </form>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="register" className="mt-0 outline-none">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          <div className="space-y-2">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">انضم إلينا اليوم</h2>
                            <p className="text-gray-500 font-medium text-lg">ابدأ رحلتك مع أسرع منصة توصيل</p>
                          </div>

                          <form onSubmit={handleRegister} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 mr-1">الاسم الكامل</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <User className="h-5 w-5" />
                                  </div>
                                  <Input
                                    placeholder="الاسم كما في البطاقة"
                                    className="h-14 pr-12 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all"
                                    value={registerData.name}
                                    onChange={(e) => handleRegisterChange("name", e.target.value)}
                                    disabled={isRegisterPending}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 mr-1">رقم الهاتف</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Phone className="h-5 w-5" />
                                  </div>
                                  <Input
                                    type="tel"
                                    placeholder="01xxxxxxxxx"
                                    className="h-14 pr-12 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all"
                                    value={registerData.phone}
                                    onChange={(e) => handleRegisterChange("phone", e.target.value)}
                                    disabled={isRegisterPending}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-700 mr-1">البريد الإلكتروني (اختياري)</label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                  <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                  type="email"
                                  placeholder="name@example.com"
                                  className="h-14 pr-12 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all"
                                  value={registerData.email}
                                  onChange={(e) => handleRegisterChange("email", e.target.value)}
                                  disabled={isRegisterPending}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 mr-1">نوع الحساب</label>
                                <Select 
                                  value={registerData.role} 
                                  onValueChange={(v) => handleRegisterChange("role", v)}
                                  disabled={isRegisterPending}
                                >
                                  <SelectTrigger className="h-14 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 text-lg font-medium">
                                    <SelectValue placeholder="اختر نوع الحساب" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                                    <SelectItem value="customer" className="h-12 text-lg font-medium focus:bg-orange-50 focus:text-orange-600">عميل</SelectItem>
                                    <SelectItem value="driver" className="h-12 text-lg font-medium focus:bg-orange-50 focus:text-orange-600">كابتن</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 mr-1">كلمة المرور</label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Lock className="h-5 w-5" />
                                  </div>
                                  <Input
                                    type={showRegisterPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-14 pr-12 pl-12 bg-gray-50 border-gray-200 rounded-2xl focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all"
                                    value={registerData.password}
                                    onChange={(e) => handleRegisterChange("password", e.target.value)}
                                    disabled={isRegisterPending}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                                  >
                                    {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <Button 
                              type="submit" 
                              className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xl font-black shadow-xl shadow-orange-200 transition-all active:scale-[0.98] mt-4"
                              disabled={isRegisterPending}
                            >
                              {isRegisterPending ? (
                                <div className="flex items-center gap-3">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                  <span>جاري إنشاء الحساب...</span>
                                </div>
                              ) : (
                                "إنشاء حساب جديد"
                              )}
                            </Button>
                          </form>
                        </motion.div>
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
