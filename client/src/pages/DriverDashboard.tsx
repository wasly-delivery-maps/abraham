import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Phone, Package, CheckCircle2, Clock, DollarSign, TrendingUp, User, LogOut, Loader2, ChevronRight, Truck, Map as MapIcon, ShieldCheck, Info, Zap, Route } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

export default function DriverDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("available");

  const ordersQuery = trpc.orders.getDriverOrders.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
  });

  const availableQuery = trpc.orders.getAvailableOrders.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
  });

  const updateStatusMutation = trpc.orders.updateOrderStatus.useMutation();
  const acceptOrderMutation = trpc.orders.acceptOrder.useMutation();

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

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status: status as any });
      toast.success("تم تحديث حالة الطلب بنجاح 🚀");
      ordersQuery.refetch();
    } catch (error) {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await acceptOrderMutation.mutateAsync({ orderId });
      toast.success("تم قبول الطلب بنجاح! 🚀");
      ordersQuery.refetch();
      availableQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل قبول الطلب");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      toast.error("فشل تسجيل الخروج");
    }
  };

  const orders = ordersQuery.data || [];
  const availableOrders = availableQuery.data || [];
  const activeOrders = orders.filter((o) => ["accepted", "picked_up", "in_transit", "arrived"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "delivered");

  const stats = [
    { label: "طلبات متاحة", value: availableOrders.length, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "طلبات جارية", value: activeOrders.length, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "أرباح اليوم", value: `ج.م ${completedOrders.reduce((sum, o) => sum + (o.price || 0), 0)}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-orange-100 text-orange-600 border-none px-3 py-1 rounded-full font-black text-[10px]">متاح الآن</Badge>;
      case "accepted": return <Badge className="bg-blue-100 text-blue-600 border-none px-3 py-1 rounded-full font-black text-[10px]">تم القبول</Badge>;
      case "picked_up": return <Badge className="bg-purple-100 text-purple-600 border-none px-3 py-1 rounded-full font-black text-[10px]">تم الاستلام</Badge>;
      case "in_transit": return <Badge className="bg-indigo-100 text-indigo-600 border-none px-3 py-1 rounded-full font-black text-[10px]">في الطريق</Badge>;
      case "arrived": return <Badge className="bg-amber-100 text-amber-600 border-none px-3 py-1 rounded-full font-black text-[10px]">وصلت</Badge>;
      case "delivered": return <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 py-1 rounded-full font-black text-[10px]">تم التسليم</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-600 border-none px-3 py-1 rounded-full font-black text-[10px]">{status}</Badge>;
    }
  };

  const OrderCard = ({ order, isAvailable = false }: { order: any, isAvailable?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden mb-6 group hover:shadow-2xl transition-all duration-500">
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الطلب</p>
                <p className="text-sm font-black text-slate-900">#{order.id}</p>
              </div>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <div className="p-8 space-y-8">
            <div className="relative space-y-8">
              <div className="absolute right-[11px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-orange-500 via-slate-200 to-blue-500 rounded-full" />
              
              <div className="relative flex gap-6">
                <div className="h-6 w-6 rounded-full bg-orange-500 border-4 border-white shadow-lg z-10 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نقطة الاستلام</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.pickupLocation.address}</p>
                </div>
              </div>

              <div className="relative flex gap-6">
                <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow-lg z-10 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وجهة التسليم</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.deliveryLocation.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">أرباحك</p>
                <p className="text-xl font-black text-orange-600">ج.م {order.price}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العميل</p>
                <p className="text-sm font-black text-slate-900 truncate">{order.customer?.name || "عميل وصلي"}</p>
              </div>
            </div>

            {order.notes && (
              <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 flex gap-3">
                <Info className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <p className="text-xs font-bold text-orange-800 leading-relaxed">{order.notes}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {isAvailable && (
                <Button 
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full py-7 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg shadow-xl shadow-orange-100 transition-all"
                >
                  قبول الطلب الآن 🚀
                </Button>
              )}
              {!isAvailable && order.status === "accepted" && (
                <Button 
                  onClick={() => handleStatusUpdate(order.id, "picked_up")}
                  className="w-full py-7 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg shadow-xl transition-all"
                >
                  تم استلام الطرد 📦
                </Button>
              )}
              {!isAvailable && order.status === "picked_up" && (
                <Button 
                  onClick={() => handleStatusUpdate(order.id, "in_transit")}
                  className="w-full py-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl transition-all"
                >
                  أنا في الطريق 🏁
                </Button>
              )}
              {!isAvailable && order.status === "in_transit" && (
                <Button 
                  onClick={() => handleStatusUpdate(order.id, "arrived")}
                  className="w-full py-7 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg shadow-xl transition-all"
                >
                  لقد وصلت للموقع 📍
                </Button>
              )}
              {!isAvailable && order.status === "arrived" && (
                <Button 
                  onClick={() => handleStatusUpdate(order.id, "delivered")}
                  className="w-full py-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl transition-all"
                >
                  تم التسليم بنجاح ✅
                </Button>
              )}
              
              {order.customer?.phone && (
                <a href={`tel:${order.customer.phone}`} className="w-full">
                  <Button variant="outline" className="w-full py-7 rounded-2xl border-slate-200 text-slate-600 font-black text-lg hover:bg-slate-50">
                    <Phone className="ml-2 h-5 w-5" /> اتصل بالعميل
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-12 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-0.5 shadow-2xl">
                <div className="h-full w-full rounded-[0.9rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <Truck className="h-7 w-7 text-orange-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">لوحة الكابتن</h1>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">مدينة العبور • متصل الآن</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 p-0"
                onClick={() => navigate("/driver/profile")}
              >
                <User className="h-5 w-5 text-white" />
              </Button>
              <Button 
                variant="ghost" 
                className="h-12 w-12 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 p-0"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 text-rose-500" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-none bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10">
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-7 w-7 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 -mt-16 relative z-20">
        <Tabs defaultValue="available" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white/80 backdrop-blur-md p-2 rounded-[2rem] h-20 shadow-xl border border-slate-100 mb-10">
            <TabsTrigger value="available" className="flex-1 rounded-[1.5rem] h-full font-black text-sm data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all duration-500">
              طلبات متاحة ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1 rounded-[1.5rem] h-full font-black text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-500">
              طلباتي الجارية ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 rounded-[1.5rem] h-full font-black text-sm data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-500">
              المكتملة ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="available" className="mt-0 outline-none">
              {availableOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">لا توجد طلبات متاحة حالياً</h3>
                  <p className="text-slate-400 font-bold">سنقوم بإشعارك فور ظهور طلبات جديدة في منطقتك</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableOrders.map((order) => <OrderCard key={order.id} order={order} isAvailable={true} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-0 outline-none">
              {activeOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Truck className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">لا توجد طلبات جارية</h3>
                  <p className="text-slate-400 font-bold">اقبل طلباً من القائمة المتاحة للبدء في العمل</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeOrders.map((order) => <OrderCard key={order.id} order={order} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0 outline-none">
              {completedOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">لم تكتمل أي طلبات اليوم</h3>
                  <p className="text-slate-400 font-bold">أكمل طلباتك لتظهر هنا في سجل الإنجازات</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedOrders.map((order) => <OrderCard key={order.id} order={order} />)}
                </div>
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
