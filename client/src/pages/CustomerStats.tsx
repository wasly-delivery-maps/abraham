import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Zap, CheckCircle2, TrendingUp, ShoppingBag, CreditCard, Clock, Package } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function CustomerStats() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const ordersQuery = trpc.orders.getCustomerOrders.useQuery(undefined, {
    enabled: !!user,
  });

  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const totalSpent = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  if (loading || ordersQuery.isLoading) {
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
              onClick={() => navigate("/customer/dashboard")}
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
            <h1 className="text-xl font-black tracking-widest uppercase">إحصائياتي</h1>
            <div className="w-12" /> {/* Spacer */}
          </div>

          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black mb-2"
            >
              نظرة عامة على نشاطك
            </motion.h2>
            <p className="text-white/60">تتبع جميع طلباتك ومدفوعاتك في مكان واحد</p>
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
          {/* Active Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-orange-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8 text-orange-600" />
                  </div>
                  <Badge className="bg-orange-600/20 text-orange-600 border-none px-4 py-1 rounded-full font-black text-xs">
                    نشط الآن
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">طلبات نشطة</h3>
                  <div className="text-4xl font-black text-slate-900">{activeOrders.length}</div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>يتم تحديثها لحظياً</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completed Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-emerald-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-600/20 text-emerald-600 border-none px-4 py-1 rounded-full font-black text-xs">
                    مكتمل
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">طلبات مكتملة</h3>
                  <div className="text-4xl font-black text-slate-900">{completedOrders.length}</div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-sm">
                  <Package className="h-4 w-4" />
                  <span>إجمالي الطلبات الناجحة</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Spent Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-blue-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-600/20 text-blue-600 border-none px-4 py-1 rounded-full font-black text-xs">
                    المدفوعات
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">إجمالي الإنفاق</h3>
                  <div className="text-4xl font-black text-slate-900">ج.م {totalSpent.toLocaleString()}</div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span>مدفوعاتي الإجمالية</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Tips or Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-8 bg-orange-500/5 rounded-[2.5rem] border border-orange-500/10 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="bg-orange-500 p-4 rounded-2xl text-white">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">هل تعلم؟</h4>
            <p className="text-slate-500 font-medium">كلما زادت طلباتك، زادت فرصك في الحصول على عروض حصرية وخصومات خاصة للعملاء المميزين.</p>
          </div>
          <Button 
            className="md:mr-auto bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-bold h-12"
            onClick={() => navigate("/customer/create-order")}
          >
            اطلب الآن
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
