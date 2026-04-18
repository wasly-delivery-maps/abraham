import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Phone, Shield, LogOut, User, Settings, ShieldCheck, ChevronLeft, Edit3, Save, X, Loader2, TrendingUp, Users, Package, Camera } from "lucide-react";

import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProfile() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const uploadAvatarMutation = trpc.users.uploadAvatar.useMutation();

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const updateProfileMutation = trpc.users.updateProfile.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً، يرجى اختيار صورة أقل من 20 ميجابايت");
      return;
    }

    setIsUploading(true);
    
    try {
      const processImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 360;
              const MAX_HEIGHT = 360;
              let width = img.width;
              let height = img.height;

              let offsetX = 0;
              let offsetY = 0;
              if (width > height) {
                offsetX = (width - height) / 2;
                width = height;
              } else {
                offsetY = (height - width) / 2;
                height = width;
              }

              canvas.width = MAX_WIDTH;
              canvas.height = MAX_HEIGHT;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, offsetX, offsetY, width, height, 0, 0, MAX_WIDTH, MAX_HEIGHT);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl.split(',')[1]);
              } else {
                reject(new Error("Could not get canvas context"));
              }
            };
            img.onerror = () => reject(new Error("Failed to load image"));
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
        });
      };

      const base64 = await processImage(file);
      
      await uploadAvatarMutation.mutateAsync({
        base64,
        contentType: "image/jpeg",
      });

      await utils.users.getProfile.invalidate();
      toast.success("تم تحديث صورتك الشخصية بنجاح ✅");
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
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
      // تحديث بيانات المستخدم في السياق (Context) لضمان ظهور التغييرات فوراً
      await utils.auth.me.invalidate();
      toast.success("تم تحديث البيانات بنجاح ✨");
      setIsEditing(false);
    } catch (error) {
      toast.error("فشل في تحديث البيانات");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-12 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <Button 
              variant="ghost" 
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12 p-0"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
            <h1 className="text-xl font-black tracking-widest uppercase">ملف المسؤول</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="text-white/60 hover:text-orange-500 hover:bg-orange-500/10 rounded-2xl h-12 w-12 p-0"
                onClick={() => navigate("/admin/stats")}
                title="الإحصائيات"
              >
                <TrendingUp className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                className="text-white/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl h-12 w-12 p-0"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-2xl overflow-hidden">
                <div className="h-full w-full rounded-[2.3rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <Shield className="h-16 w-16 text-blue-500" />
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="text-center md:text-right">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h2 className="text-4xl font-black">{user.name}</h2>
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge className="bg-blue-600/20 text-blue-500 border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                  مسؤول النظام
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
          {/* Info Cards */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  صلاحيات الإدارة
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "إدارة المستخدمين", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "إدارة الطلبات", icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "التقارير المالية", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 ${item.bg} rounded-2xl border border-slate-50`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span className="text-sm font-black text-slate-700">{item.label}</span>
                    </div>
                  ))}
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
                    <Settings className="h-6 w-6 text-blue-600" />
                    إعدادات الحساب
                  </h3>
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 font-black px-6 rounded-2xl transition-all"
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
                          className="h-16 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-blue-500 font-bold text-slate-700"
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
                          className="h-16 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-blue-500 font-bold text-slate-700"
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
                        className="h-16 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-blue-500 font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex gap-4 pt-8">
                        <Button 
                          onClick={handleSaveProfile}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl font-black text-lg shadow-xl transition-all"
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
