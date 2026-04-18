import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Users, ShoppingBag, TrendingUp, BarChart3, Zap, Package, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useMemo } from "react";

export default function AdminStats() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const statsQuery = trpc.admin.getStatistics.useQuery();
  const usersQuery = trpc.admin.getAllUsers.useQuery();
  const ordersQuery = trpc.admin.getAllOrders.useQuery();

  const stats = useMemo(() => statsQuery.data || null, [statsQuery.data]);
  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);
  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);

  const totalOrders = stats?.totalOrders || orders.length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const totalDrivers = stats?.totalDrivers || users.filter((u) => u.role === "driver").length;
  const totalCustomers = stats?.totalCustomers || users.filter((u) => u.role === "customer").length;
  const totalUsers = stats?.totalUsers || users.length;
  const totalRevenue = stats?.totalRevenue || orders.reduce((sum, o) => sum + (o.price || 0), 0);
  
  // حساب إجمالي العمولات المستحقة من السائقين
  const drivers = users.filter((u) => u.role === "driver");
  const totalPendingCommissions = drivers.reduce((sum, driver: any) => {
    return sum + (typeof driver.pendingCommission === "number" ? driver.pendingCommission : 0);
  }, 0);

  if (loading || statsQuery.isLoading || usersQuery.isLoading || ordersQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-12 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <Button 
              variant="ghost" 
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12 p-0"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
            <h1 className="text-xl font-black tracking-widest uppercase text-orange-500">إحصائيات النظام</h1>
            <div className="w-12" /> {/* Spacer */}
          </div>

          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black mb-2"
            >
              نظرة شاملة على الأداء 📊
            </motion.h2>
            <p className="text-white/40">تابع جميع مؤشرات الأداء الرئيسية للنظام والعمليات</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 -mt-20 pb-20 relative z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Total Users Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-3xl transition-all group h-full">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-600 border-none px-3 py-1 rounded-full font-black text-[10px]">
                    المستخدمين
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">إجمالي المستخدمين</h3>
                  <div className="text-4xl font-black text-slate-900">{totalUsers}</div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">{totalDrivers} سائق | {totalCustomers} عميل</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-3xl transition-all group h-full">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <Badge className="bg-orange-100 text-orange-600 border-none px-3 py-1 rounded-full font-black text-[10px]">
                    الطلبات
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">إجمالي الطلبات</h3>
                  <div className="text-4xl font-black text-slate-900">{totalOrders}</div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">منذ انطلاق النظام</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-3xl transition-all group h-full">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-600 border-none px-3 py-1 rounded-full font-black text-[10px]">
                    نشطة
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">طلبات نشطة</h3>
                  <div className="text-4xl font-black text-slate-900">{activeOrders}</div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">جاري توصيلها الآن</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completed Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-3xl transition-all group h-full">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 py-1 rounded-full font-black text-[10px]">
                    مكتملة
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">طلبات مكتملة</h3>
                  <div className="text-4xl font-black text-slate-900">{completedOrders}</div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">
                    {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% نسبة الإنجاز
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Pending Commissions Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-3xl transition-all group h-full">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <Badge className="bg-green-100 text-green-600 border-none px-3 py-1 rounded-full font-black text-[10px]">
                    العمولات
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">إجمالي العمولات المستحقة</h3>
                  <div className="text-4xl font-black text-slate-900">ج.م {totalPendingCommissions.toLocaleString()}</div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">مستحقة من {drivers.length} سائق</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Ratio Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-3xl transition-all group h-full">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-600 border-none px-3 py-1 rounded-full font-black text-[10px]">
                    الأداء
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">متوسط تقييم الأداء</h3>
                  <div className="text-4xl font-black text-slate-900">
                    {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-3">كفاءة النظام العامة</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Insight Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-8 bg-gradient-to-r from-orange-500/10 to-orange-600/5 rounded-[2.5rem] border border-orange-500/10 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-slate-900">رؤية المسؤول</h4>
            <p className="text-slate-600 font-medium">
              يوجد {totalPendingCommissions.toLocaleString()} ج.م عمولات مستحقة من {drivers.length} سائق. تابع قائمة العمولات لضمان سداد السائقين في الوقت المناسب وتحسين أداء النظام.
            </p>
          </div>
          <Button 
            className="md:mr-auto bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-xl font-bold h-12 shadow-lg shadow-orange-600/20"
            onClick={() => navigate("/admin/dashboard")}
          >
            العودة للإدارة
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
