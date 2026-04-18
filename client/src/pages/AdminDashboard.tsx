import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Users, Truck, ShoppingBag, TrendingUp, LogOut, BarChart3, User, Home, Download, Settings, ShieldCheck, ChevronLeft, Package, Clock, Zap, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { CommissionsManagement } from "@/components/admin/CommissionsManagement";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const statsQuery = trpc.admin.getStatistics.useQuery();
  const usersQuery = trpc.admin.getAllUsers.useQuery();
  const ordersQuery = trpc.admin.getAllOrders.useQuery();
  const reportQuery = trpc.admin.getReportData.useQuery(
    {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
    { enabled: false }
  );

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
    }
  }, [statsQuery.data]);

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data);
    }
  }, [usersQuery.data]);

  useEffect(() => {
    if (ordersQuery.data) {
      setOrders(ordersQuery.data);
    }
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

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await reportQuery.refetch();
      if (result.data) {
        const { drivers, orders: reportOrders, statistics } = result.data;
        
        const csvContent = [
          ['الإحصائيات'],
          ['إجمالي الطلبات', statistics.totalOrders],
          ['الطلبات المكتملة', statistics.completedOrders],
          [],
          ['السائقون'],
          ['الاسم', 'الهاتف', 'الحالة', 'عدد الطلبات'],
          ...drivers.map(d => [d.name, d.phone, d.accountStatus, d.totalOrders]),
        ];
        
        const csvString = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_wasly_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("تم تصدير التقرير بنجاح");
      }
    } catch (error) {
      toast.error("فشل في تصدير التقرير");
    } finally {
      setIsExporting(false);
    }
  };

  const totalOrders = stats?.totalOrders || orders.length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const totalDrivers = stats?.totalDrivers || users.filter((u) => u.role === "driver").length;
  const totalCustomers = stats?.totalCustomers || users.filter((u) => u.role === "customer").length;
  const totalUsers = stats?.totalUsers || users.length;

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
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  className="bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 w-12 p-0"
                  onClick={() => navigate("/admin/stats")}
                  title="الإحصائيات"
                >
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  className="bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 px-6 font-bold flex items-center gap-2"
                  onClick={() => navigate("/admin/profile")}
                >
                  <User className="h-5 w-5" />
                  <span>الملف الشخصي</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl h-12 w-12 p-0"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-3xl font-black mb-2">مرحباً بك، {user.name?.split(' ')[0]} 👋</h2>
              <p className="text-white/60 font-medium">إليك ملخص أداء النظام والعمليات الجارية اليوم</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="flex-1 min-w-[150px]">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 mr-2">من تاريخ</p>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white rounded-xl focus:ring-orange-500 h-11"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 mr-2">إلى تاريخ</p>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white rounded-xl focus:ring-orange-500 h-11"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-end">
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-8 rounded-xl font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 w-full"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {isExporting ? "جاري..." : "تصدير التقرير"}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="container mx-auto px-6 -mt-12 pb-12 relative z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { label: "المستخدمين", value: totalUsers, sub: `${totalDrivers} سائق | ${totalCustomers} عميل`, icon: Users, color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
            { label: "إجمالي الطلبات", value: totalOrders, sub: "منذ انطلاق النظام", icon: ShoppingBag, color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
            { label: "طلبات نشطة", value: activeOrders, sub: "جاري توصيلها الآن", icon: Zap, color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
            { label: "إجمالي الأرباح", value: `ج.م ${stats?.totalRevenue || orders.reduce((sum, o) => sum + (o.price || 0), 0)}`, sub: "إجمالي المبيعات", icon: BarChart3, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" }
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group h-full">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full font-black text-[10px]">
                      إحصائيات
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">{stat.label}</h3>
                    <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Management Tabs Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="bg-white/50 backdrop-blur-sm p-1.5 rounded-[2rem] mb-8 w-full sm:w-auto shadow-sm border border-slate-200">
              <TabsTrigger value="orders" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Package className="h-4 w-4 ml-2" /> إدارة الطلبات
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Users className="h-4 w-4 ml-2" /> المستخدمين
              </TabsTrigger>
              <TabsTrigger value="commissions" className="rounded-2xl px-8 py-3 font-black data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <TrendingUp className="h-4 w-4 ml-2" /> العمولات
              </TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              <TabsContent value="orders">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <OrdersManagement orders={orders} />
                </motion.div>
              </TabsContent>
              <TabsContent value="users">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <UsersManagement users={users} />
                </motion.div>
              </TabsContent>
              <TabsContent value="commissions">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <CommissionsManagement drivers={users.filter(u => u.role === "driver")} />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
