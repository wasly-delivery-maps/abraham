import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Phone, MapPin, Truck, LogOut, User, Settings, ShieldCheck, ChevronLeft, Camera, Edit3, Save, X, MessageCircle, ShoppingBag, HelpCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerProfile() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const ordersQuery = trpc.orders.getCustomerOrders.useQuery(undefined, { enabled: !!user });
  const updateProfileMutation = trpc.users.updateProfile.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "customer") {
    navigate("/auth");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync(editData);
      toast.success("تم تحديث البيانات بنجاح ✨");
      setIsEditing(false);
    } catch (error) {
      toast.error("فشل في تحديث البيانات");
    }
  };

  const orders = ordersQuery.data || [];
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.price || 0), 0);

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
              onClick={() => navigate("/customer/dashboard")}
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
            <h1 className="text-xl font-black tracking-widest uppercase">الملف الشخصي</h1>
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
              <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-orange-500 to-orange-700 p-1 shadow-2xl">
                <div className="h-full w-full rounded-[2.3rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <User className="h-16 w-16 text-orange-500" />
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h2 className="text-4xl font-black">{user.name}</h2>
                <ShieldCheck className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge className="bg-orange-600/20 text-orange-500 border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                  عميل مميز
                </Badge>
                <Badge className="bg-white/10 text-white/60 border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                  ID: #{user.id}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 -mt-20 pb-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Stats */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-orange-600" />
                  ملخص النشاط
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "طلبات نشطة", value: activeOrders, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "طلبات مكتملة", value: completedOrders, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "إجمالي الإنفاق", value: `ج.م ${totalSpent.toLocaleString()}`, color: "text-blue-600", bg: "bg-blue-50" }
                  ].map((stat, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 ${stat.bg} rounded-2xl border border-slate-50`}>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                      <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-orange-600 text-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-lg font-black mb-4 flex items-center gap-3">
                  <HelpCircle className="h-5 w-5" />
                  تحتاج مساعدة؟
                </h3>
                <p className="text-white/70 text-sm font-medium mb-8">فريق الدعم متاح دائماً لخدمتك في مدينة العبور.</p>
                <div className="space-y-3">
                  <a href="tel:01557564373" className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all">
                    <span className="font-black text-sm">اتصل بنا</span>
                    <Phone className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden h-full">
              <CardContent className="p-10">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    <Settings className="h-6 w-6 text-orange-600" />
                    إعدادات الحساب
                  </h3>
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-600 font-black px-6 rounded-2xl transition-all"
                    >
                      <Edit3 className="h-4 w-4 ml-2" /> تعديل
                    </Button>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <Input 
                          disabled={!isEditing}
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="h-16 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-orange-500 font-bold text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <Input 
                          disabled={!isEditing}
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="h-16 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-orange-500 font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input 
                        disabled={!isEditing}
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="h-16 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-orange-500 font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex gap-4 pt-8">
                        <Button 
                          onClick={handleSaveProfile}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-16 rounded-2xl font-black text-lg shadow-xl transition-all"
                        >
                          حفظ التغييرات
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 h-16 rounded-2xl font-black text-lg border-slate-200 text-slate-500"
                        >
                          إلغاء
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
