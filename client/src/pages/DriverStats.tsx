import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Package, Truck, DollarSign, TrendingUp, Clock, CheckCircle2, Award } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function DriverStats() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const ordersQuery = trpc.orders.getDriverOrders.useQuery(undefined, {
    enabled: !!user && user.role === "driver",
  });

  const availableQuery = trpc.orders.getAvailableOrders.useQuery(undefined, {
    enabled: !!user && user.role === "driver",
  });

  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);
  const availableOrders = useMemo(() => availableQuery.data || [], [availableQuery.data]);
  
  const activeOrders = orders.filter((o) => ["assigned", "accepted", "picked_up", "in_transit", "arrived"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const todayEarnings = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  if (loading || ordersQuery.isLoading || availableQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "driver") {
    navigate("/auth");
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 pt-12 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 transition-all"
              onClick={() => navigate("/driver/dashboard")}
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
              <span className="font-bold">رجوع</span>
            </Button>
            <h1 className="text-xl font-black tracking-widest uppercase text-orange-500">لوحة إحصائيات الكابتن</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>

          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black mb-2"
            >
              أداء اليوم المتميز 🚀
            </motion.h2>
            <p className="text-white/40">تابع تقدمك وأرباحك لحظة بلحظة</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 -mt-20 pb-20 relative z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Available Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden hover:bg-slate-800/50 transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-orange-500/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Package className="h-8 w-8 text-orange-500" />
                  </div>
                  <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-1 rounded-full font-black text-xs">
                    متاح
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">طلبات متاحة</h3>
                  <div className="text-4xl font-black text-white">{availableOrders.length}</div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>تحديث تلقائي</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden hover:bg-slate-800/50 transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-blue-500/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Truck className="h-8 w-8 text-blue-500" />
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-1 rounded-full font-black text-xs">
                    جاري
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">طلبات جارية</h3>
                  <div className="text-4xl font-black text-white">{activeOrders.length}</div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>في طريقك للتسليم</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Earnings Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden hover:bg-slate-800/50 transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-emerald-500/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <DollarSign className="h-8 w-8 text-emerald-500" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1 rounded-full font-black text-xs">
                    الأرباح
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">أرباح اليوم</h3>
                  <div className="text-4xl font-black text-white">ج.م {todayEarnings.toLocaleString()}</div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تم تسليم {completedOrders.length} طلب</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Motivation Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-8 bg-gradient-to-r from-orange-500/10 to-orange-600/5 rounded-[2.5rem] border border-orange-500/10 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-black text-white">نصيحة اليوم للكابتن</h4>
            <p className="text-slate-400 font-medium">السرعة في الاستلام والتسليم تزيد من تقييمك وتجعلك الأولوية في استقبال الطلبات الجديدة!</p>
          </div>
          <Button 
            className="md:mr-auto bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-xl font-bold h-12 shadow-lg shadow-orange-600/20"
            onClick={() => navigate("/driver/dashboard")}
          >
            العودة للطلبات
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
