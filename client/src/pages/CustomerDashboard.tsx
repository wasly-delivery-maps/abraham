import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, LogOut, User, Truck, Clock, DollarSign, X, Phone, Calendar, ChevronRight, Package, Search, CheckCircle2, Loader2, TrendingUp, Award, Zap, Navigation, Info, MessageCircle, BarChart3, Map as MapIcon, ChevronLeft, ArrowLeft, Timer } from "lucide-react";
import { CountdownTimer } from "@/components/customer/CountdownTimer";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { ChatBox } from "@/components/ChatBox";
import { useChatContext } from "@/contexts/ChatContext";
import { RestaurantMenu } from "@/components/customer/RestaurantMenu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const iconDriver = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#10b981; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 0 10px rgba(16,185,129,0.5);'><div style='width:8px; height:8px; background:white; border-radius:50%;'></div></div>",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const iconDestination = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3b82f6; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 0 10px rgba(59,130,246,0.5);'><div style='width:8px; height:8px; background:white; border-radius:50%;'></div></div>",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Cancel Order Button Component
function CancelOrderButton({ orderId, onSuccess }: { orderId: number; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const cancelMutation = trpc.orders.cancelOrder.useMutation();

  const handleCancel = async () => {
    if (!window.confirm("هل أنت متأكد من إلغاء هذا الطلب؟")) return;
    try {
      setIsLoading(true);
      await cancelMutation.mutateAsync({ orderId });
      toast.success("تم إلغاء الطلب بنجاح");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "فشل إلغاء الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isLoading}
        className="text-rose-500 hover:bg-rose-50 font-bold text-xs rounded-lg transition-all"
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5 ml-1" />}
        إلغاء الطلب
      </Button>
    </motion.div>
  );
}

export default function CustomerDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatOrderId, setChatOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const { unreadCounts } = useChatContext();

  const ordersQuery = trpc.orders.getCustomerOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const offersQuery = trpc.offers.getActive.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute to check for expired offers
  });

  const orderDetailsQuery = trpc.orders.getOrderDetails.useQuery(
    { orderId: selectedOrderId as number },
    { enabled: !!selectedOrderId && isDetailsOpen }
  );

  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);
  const activeOffers = useMemo(() => offersQuery.data || [], [offersQuery.data]);

  const handleShowDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "customer") {
    navigate("/auth");
    return null;
  }

  const handleLogout = async () => {
    window.removeEventListener("popstate", () => {});
    setIsDetailsOpen(false);
    setIsChatOpen(false);
    await logout();
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      if (isDetailsOpen || isChatOpen) {
        e.preventDefault();
        setIsDetailsOpen(false);
        setIsChatOpen(false);
        window.history.pushState(null, "", window.location.pathname);
      }
    };

    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isDetailsOpen, isChatOpen]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
      pending: { label: "قيد الانتظار", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
      assigned: { label: "تم الإسناد", color: "bg-blue-50 text-blue-600 border-blue-100", icon: User },
      accepted: { label: "تم القبول", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: CheckCircle2 },
      in_transit: { label: "في الطريق", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Truck },
      arrived: { label: "وصل السائق", color: "bg-orange-50 text-orange-600 border-orange-100", icon: MapPin },
      delivered: { label: "تم التسليم", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Package },
      cancelled: { label: "ملغى", color: "bg-rose-50 text-rose-600 border-rose-100", icon: X },
    };
    return statusMap[status] || { label: status, color: "bg-slate-50 text-slate-600", icon: Package };
  };

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div className="flex items-center gap-4" whileHover={{ scale: 1.05 }}>
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <motion.div className="bg-white p-1 rounded-full shadow-md border border-orange-100 overflow-hidden" whileHover={{ scale: 1.1, rotate: 5 }}>
                  <img src="/logo.jpg" alt="وصلي" className="h-8 w-8 object-contain" />
                </motion.div>
                <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">وصلي</span>
              </div>
            </Link>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
              <motion.span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                ⭐ عميل مميز
              </motion.span>
            </div>
            <Link href="/customer/stats">
              <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-br from-slate-100 to-slate-50 h-10 w-10 hover:from-orange-100 hover:to-orange-50 transition-all">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <Link href="/customer/profile">
              <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-br from-slate-100 to-slate-50 h-10 w-10 hover:from-orange-100 hover:to-orange-50 transition-all">
                <User className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Welcome & Action */}
          <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6" variants={itemVariants}>
            <div className="space-y-3">
              <motion.h2 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-orange-600 to-slate-700 bg-clip-text text-transparent" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                أهلاً بك، {user.name.split(' ')[0]} 👋
              </motion.h2>
              <p className="text-slate-600 font-semibold text-lg">تتبع طلباتك وتحركاتك بكل سهولة وسرعة</p>
            </div>
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Link href="/customer/create-order">
                <Button className="bg-gradient-to-r from-orange-500 via-orange-550 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-black px-8 py-6 rounded-2xl shadow-2xl shadow-orange-300/50 transition-all flex items-center gap-2 text-lg">
                  <Plus className="h-6 w-6" />
                  طلب مندوب توصيل
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Offers Section (Flash Sales) - Modern Redesign */}
          {activeOffers.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                      <Zap className="h-7 w-7 text-orange-500 fill-orange-500" />
                    </motion.div>
                    عروض حصرية 🔥
                  </h3>
                  <p className="text-slate-600 text-sm font-semibold mr-8">أفضل العروض المختارة لك اليوم</p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-orange-50 text-orange-600 border-2 border-orange-200 font-black px-4 py-2 rounded-full flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    لفترة محدودة
                  </Badge>
                </motion.div>
              </div>
              
              <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
                {activeOffers.map((offer) => (
                  <motion.div 
                    key={offer.id} 
                    className="min-w-[280px] md:min-w-[340px] snap-center"
                    whileHover={{ y: -12, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="overflow-hidden border-2 border-orange-100 shadow-2xl rounded-[2rem] bg-white group flex flex-col h-full hover:border-orange-300 transition-all">
                      {/* Image Container - Balanced Aspect Ratio */}
                      <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 aspect-[4/3]">
                        <img 
                          src={offer.imageUrl} 
                          alt={offer.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          style={{ display: 'block' }}
                        />
                        {/* Floating Timer Badge */}
                        <div className="absolute top-4 right-4 z-10">
                          <motion.div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-orange-400 backdrop-blur-sm" whileHover={{ scale: 1.05 }}>
                            <CountdownTimer expiresAt={offer.expiresAt} />
                          </motion.div>
                        </div>
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Content Section - Clear & Readable */}
                      <div className="px-6 pt-4 pb-6 flex flex-col flex-grow space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-lg font-black text-slate-900 leading-tight flex-1">{offer.title}</h4>
                            <motion.div className="bg-orange-100 p-2 rounded-lg" whileHover={{ scale: 1.1, rotate: 10 }}>
                              <Zap className="h-5 w-5 text-orange-600 fill-orange-600" />
                            </motion.div>
                          </div>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
                            {offer.description}
                          </p>
                        </div>
                        
                        <motion.div className="pt-2 mt-auto" whileHover={{ scale: 1.02 }}>
                          <Button 
                            className="w-full bg-gradient-to-r from-orange-500 via-orange-550 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white rounded-xl px-4 py-6 h-auto text-base font-black shadow-xl shadow-orange-300/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            onClick={() => setActiveTab("restaurants")}
                          >
                            <Plus className="h-5 w-5" />
                            اطلب الآن من المطعم
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Orders Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gradient-to-r from-slate-100 to-slate-50 p-1.5 rounded-2xl mb-8 w-full sm:w-auto border border-slate-200 shadow-sm">
                <TabsTrigger value="active" className="rounded-xl px-8 py-3 font-black data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-600 data-[state=active]:border-2 data-[state=active]:border-orange-200 transition-all">
                  الطلبات النشطة
                  <Badge className="mr-2 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-600 border-2 border-orange-200 font-black">{activeOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-xl px-8 py-3 font-black data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 data-[state=active]:border-2 data-[state=active]:border-emerald-200 transition-all">
                  السجل
                </TabsTrigger>
                <TabsTrigger value="restaurants" className="rounded-xl px-8 py-3 font-black data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-red-600 data-[state=active]:border-2 data-[state=active]:border-red-200 transition-all">
                  المطاعم
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <AnimatePresence mode="popLayout">
                  <motion.div className="grid grid-cols-1 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                    {activeOrders.length > 0 ? (
                      activeOrders.map((order, idx) => {
                        const status = getStatusInfo(order.status);
                        return (
                          <motion.div key={order.id} variants={itemVariants} whileHover={{ scale: 1.03, y: -8 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className={`hover:shadow-2xl transition-all border-2 rounded-2xl overflow-hidden ${
                              order.status === 'pending' ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50' :
                              order.status === 'assigned' ? 'border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50' :
                              order.status === 'accepted' ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-50' :
                              order.status === 'in_transit' ? 'border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50' :
                              order.status === 'arrived' ? 'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50' :
                              'border-slate-200 bg-white'
                            }`}>
                              <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between md:justify-start gap-3">
                                      <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">طلب #{order.id}</span>
                                      <Badge className={`${status.color} border-2 font-bold px-3 py-1 rounded-full text-xs shadow-md`}>{status.label}</Badge>
                                    </div>
                                    <div className="space-y-2.5">
                                      <div className="flex items-start gap-3 bg-white/50 p-2.5 rounded-lg">
                                        <div className="h-2 w-2 rounded-full bg-orange-600 mt-1.5 flex-shrink-0" />
                                        <p className="text-sm font-medium text-slate-700 line-clamp-2">{order.pickupLocation?.address}</p>
                                      </div>
                                      <div className="flex items-start gap-3 bg-white/50 p-2.5 rounded-lg">
                                        <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-slate-700 line-clamp-2">{order.deliveryLocation?.address}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 md:border-r md:pr-4">
                                    <div className="text-2xl font-black text-slate-900 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">ج.م {order.price}</div>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                      {!["in_transit", "arrived", "delivered", "cancelled"].includes(order.status) && (
                                        <CancelOrderButton orderId={order.id} onSuccess={() => ordersQuery.refetch()} />
                                      )}
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button variant="outline" size="sm" onClick={() => handleShowDetails(order.id)} className="h-9 rounded-lg font-bold text-xs border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all">التفاصيل</Button>
                                      </motion.div>
                                    </div>
                                  </div>
                                </div>
                                {(order.driver || order.driverId) && (
                                  <motion.div className="mt-5 pt-5 border-t-2 border-slate-200 flex items-center justify-between bg-gradient-to-r from-orange-50 via-white to-transparent p-4 rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <div className="flex items-center gap-3">
                                      <motion.div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-md" whileHover={{ scale: 1.15, rotate: 5 }}>{order.driver?.name?.charAt(0) || 'S'}</motion.div>
                                      <div>
                                        <span className="text-sm font-black text-slate-900 block">{order.driver?.name || "السائق"}</span>
                                        <span className="text-xs font-medium text-slate-500">سائق التوصيل</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <motion.button onClick={() => { setChatOrderId(order.id); setIsChatOpen(true); }} className="relative text-blue-600 bg-white border-2 border-blue-200 p-2.5 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                        <MessageCircle className="h-5 w-5" />
                                        {unreadCounts[order.id] > 0 && <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse text-white text-[10px] flex items-center justify-center font-bold">{unreadCounts[order.id]}</span>}
                                      </motion.button>
                                      {(order.driver?.phone || order.driverPhone) && (
                                        <motion.a href={`tel:${order.driver?.phone || order.driverPhone}`} className="text-orange-600 bg-white border-2 border-orange-200 p-2.5 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                          <Phone className="h-5 w-5" />
                                        </motion.a>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200" variants={itemVariants}>
                        <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">لا توجد طلبات نشطة</h3>
                        <p className="text-slate-500 text-sm mt-1">ابدأ بطلب جديد الآن!</p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="completed">
                <div className="grid grid-cols-1 gap-4">
                  {completedOrders.length > 0 ? (
                    completedOrders.map((order) => {
                      const status = getStatusInfo(order.status);
                      return (
                        <Card key={order.id} className="hover:shadow-md transition-all border-none bg-white rounded-xl overflow-hidden">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {order.status === 'delivered' ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">طلب #{order.id}</p>
                                <p className="text-[10px] font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black text-slate-900">ج.م {order.price}</p>
                              <Badge className={`${status.color} border-none text-[9px] mt-1`}>{status.label}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-500 font-bold">لا يوجد سجل طلبات حتى الآن</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="restaurants">
                <RestaurantMenu />
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white" dir="rtl">
          {orderDetailsQuery.isLoading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
              <p className="text-slate-500 font-bold">جاري تحميل التفاصيل...</p>
            </div>
          ) : orderDetailsQuery.data ? (
            <div className="flex flex-col h-full max-h-[90vh]">
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge className="bg-orange-500 text-white border-none mb-2 font-black">طلب #{orderDetailsQuery.data.id}</Badge>
                    <h2 className="text-2xl font-black">تفاصيل الرحلة</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)} className="text-white/50 hover:text-white hover:bg-white/10 rounded-full">
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">التكلفة الإجمالية</p>
                    <p className="text-2xl font-black">ج.م {orderDetailsQuery.data.price}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Navigation className="h-5 w-5 text-orange-600" />
                    <h3 className="font-black">مسار التوصيل</h3>
                  </div>
                  <div className="relative pr-4 border-r-2 border-dashed border-slate-200 space-y-8 mr-2">
                    <div className="relative">
                      <div className="absolute -right-[25px] top-0 h-4 w-4 rounded-full bg-orange-600 border-4 border-white shadow-sm" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">نقطة الاستلام</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{orderDetailsQuery.data.pickupLocation?.address}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -right-[25px] top-0 h-4 w-4 rounded-full bg-blue-600 border-4 border-white shadow-sm" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">وجهة التسليم</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{orderDetailsQuery.data.deliveryLocation?.address}</p>
                    </div>
                  </div>
                </div>

                {orderDetailsQuery.data.notes && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-900">
                      <Info className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-black">ملاحظات إضافية</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{orderDetailsQuery.data.notes}</p>
                  </div>
                )}

                {orderDetailsQuery.data.status !== 'pending' && (
                  <div className="h-[250px] w-full rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner relative">
                    <MapContainer 
                      center={[
                        parseFloat(orderDetailsQuery.data.pickupLocation?.latitude?.toString() || "30.2350"),
                        parseFloat(orderDetailsQuery.data.pickupLocation?.longitude?.toString() || "31.4650")
                      ]} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker 
                        position={[
                          parseFloat(orderDetailsQuery.data.pickupLocation?.latitude?.toString() || "30.2350"),
                          parseFloat(orderDetailsQuery.data.pickupLocation?.longitude?.toString() || "31.4650")
                        ]}
                      >
                        <Popup>موقع الاستلام</Popup>
                      </Marker>
                      <Marker 
                        position={[
                          parseFloat(orderDetailsQuery.data.deliveryLocation?.latitude?.toString() || "30.2350"),
                          parseFloat(orderDetailsQuery.data.deliveryLocation?.longitude?.toString() || "31.4650")
                        ]}
                        icon={iconDestination}
                      >
                        <Popup>وجهة التسليم</Popup>
                      </Marker>
                      {orderDetailsQuery.data.driver?.latitude && orderDetailsQuery.data.driver?.longitude && (
                        <Marker 
                          position={[
                            parseFloat(orderDetailsQuery.data.driver.latitude.toString()),
                            parseFloat(orderDetailsQuery.data.driver.longitude.toString())
                          ]}
                          icon={iconDriver}
                        >
                          <Popup>موقع السائق الحالي</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                    <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-white/50 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-900">تتبع مباشر</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <Button onClick={() => setIsDetailsOpen(false)} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg shadow-slate-200 transition-all">إغلاق التفاصيل</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white h-[80vh]" dir="rtl">
          {chatOrderId && <ChatBox orderId={chatOrderId} onClose={() => setIsChatOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
