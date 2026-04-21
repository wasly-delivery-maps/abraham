import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Users, Truck, ShoppingBag, TrendingUp, LogOut, BarChart3, User, Home, Download, Settings, ShieldCheck, ChevronLeft, Package, Clock, Zap, Star, Loader2, Plus, Trash2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { CommissionsManagement } from "@/components/admin/CommissionsManagement";
import { ReportExporter } from "@/components/admin/ReportExporter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Offers State
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    imageUrl: "",
    link: "",
    expiresInHours: "24"
  });

  const statsQuery = trpc.admin.getStatistics.useQuery();
  const usersQuery = trpc.admin.getAllUsers.useQuery();
  const ordersQuery = trpc.admin.getAllOrders.useQuery();
  const offersQuery = trpc.offers.getActive.useQuery();
  
  const createOfferMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة العرض بنجاح");
      setNewOffer({ title: "", description: "", imageUrl: "", link: "", expiresInHours: "24" });
      offersQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteOfferMutation = trpc.offers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العرض");
      offersQuery.refetch();
    }
  });

  useEffect(() => {
    if (statsQuery.data) setStats(statsQuery.data);
  }, [statsQuery.data]);

  useEffect(() => {
    if (usersQuery.data) setUsers(usersQuery.data);
  }, [usersQuery.data]);

  useEffect(() => {
    if (ordersQuery.data) setOrders(ordersQuery.data);
  }, [ordersQuery.data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffer.title || !newOffer.imageUrl) {
      return toast.error("يرجى إدخال العنوان ورابط الصورة");
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(newOffer.expiresInHours));

    createOfferMutation.mutate({
      title: newOffer.title,
      description: newOffer.description,
      imageUrl: newOffer.imageUrl,
      link: newOffer.link,
      expiresAt: expiresAt.toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-12 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="flex items-center gap-4">
              <motion.div 
                className="bg-white p-1.5 rounded-2xl shadow-xl overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                onClick={() => navigate("/")}
              >
                <img src="/logo.jpg" alt="وصلي" className="h-12 w-12 object-contain" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  لوحة التحكم <Badge className="bg-orange-500 text-white border-none text-[10px] px-2 py-0">ADMIN</Badge>
                </h1>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">إدارة النظام والرقابة العامة</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0" onClick={() => navigate("/admin/stats")}>
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 px-6 font-bold flex items-center gap-2" onClick={() => navigate("/admin/profile")}>
                <User className="h-5 w-5" />
                <span>الملف الشخصي</span>
              </Button>
              <Button variant="ghost" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl h-12 w-12 p-0" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-3xl font-black mb-2">مرحباً بك، {user.name?.split(' ')[0]} 👋</h2>
              <p className="text-white/60 font-medium">إليك ملخص أداء النظام والعمليات الجارية اليوم</p>
            </div>
            <ReportExporter orders={orders} users={users} stats={stats} />
          </div>
        </div>
      </div>

      {/* Management Tabs Section */}
      <div className="container mx-auto px-6 pb-12 relative z-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="bg-white/50 backdrop-blur-sm p-1.5 rounded-[2rem] mb-8 w-full sm:w-auto shadow-sm border border-slate-200 overflow-x-auto flex-nowrap">
              <TabsTrigger value="orders" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">
                <Package className="h-4 w-4 ml-2" /> الطلبات
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all">
                <Users className="h-4 w-4 ml-2" /> المستخدمين
              </TabsTrigger>
              <TabsTrigger value="offers" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">
                <Zap className="h-4 w-4 ml-2" /> العروض
              </TabsTrigger>
              <TabsTrigger value="commissions" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">
                <TrendingUp className="h-4 w-4 ml-2" /> العمولات
              </TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              <TabsContent value="orders">
                <OrdersManagement orders={orders} />
              </TabsContent>
              <TabsContent value="users">
                <UsersManagement users={users} />
              </TabsContent>
              <TabsContent value="commissions">
                <CommissionsManagement drivers={users.filter(u => u.role === "driver")} />
              </TabsContent>
              
              <TabsContent value="offers">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Offer Form */}
                  <Card className="lg:col-span-1 border-none shadow-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-amber-500 text-white p-6">
                      <CardTitle className="flex items-center gap-2 font-black">
                        <Plus className="h-5 w-5" /> إضافة عرض جديد
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleCreateOffer} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase mr-1">عنوان العرض</label>
                          <Input 
                            placeholder="مثال: خصم 50% على الكريب" 
                            value={newOffer.title}
                            onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                            className="rounded-xl border-slate-100 h-12 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase mr-1">الوصف</label>
                          <Textarea 
                            placeholder="تفاصيل العرض..." 
                            value={newOffer.description}
                            onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                            className="rounded-xl border-slate-100 font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase mr-1">رابط الصورة</label>
                          <div className="relative">
                            <ImageIcon className="absolute right-3 top-3.5 h-5 w-5 text-slate-300" />
                            <Input 
                              placeholder="https://..." 
                              value={newOffer.imageUrl}
                              onChange={(e) => setNewOffer({...newOffer, imageUrl: e.target.value})}
                              className="rounded-xl border-slate-100 h-12 pr-10 font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase mr-1">مدة العرض (بالساعات)</label>
                          <Input 
                            type="number"
                            value={newOffer.expiresInHours}
                            onChange={(e) => setNewOffer({...newOffer, expiresInHours: e.target.value})}
                            className="rounded-xl border-slate-100 h-12 font-bold"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-lg shadow-amber-100 transition-all"
                          disabled={createOfferMutation.isLoading}
                        >
                          {createOfferMutation.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "نشر العرض الآن"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Active Offers List */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" /> العروض النشطة حالياً
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {offersQuery.data?.map((offer: any) => (
                        <Card key={offer.id} className="border-none shadow-md rounded-2xl overflow-hidden group">
                          <div className="relative h-40">
                            <img src={offer.imageUrl} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="rounded-full h-12 w-12"
                                onClick={() => deleteOfferMutation.mutate({ id: offer.id })}
                              >
                                <Trash2 className="h-6 w-6" />
                              </Button>
                            </div>
                            <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 border-none font-black">
                              <Clock className="h-3 w-3 ml-1" /> ينتهي: {new Date(offer.expiresAt).toLocaleTimeString('ar-EG')}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-black text-slate-900">{offer.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{offer.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {offersQuery.data?.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                          <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold">لا توجد عروض نشطة حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
