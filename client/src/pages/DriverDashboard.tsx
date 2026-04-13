import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, LogOut, User, Truck, Clock, DollarSign, Phone, Navigation, CheckCircle2, Loader2, TrendingUp, Zap, Info, X, ChevronRight, Package, Map as MapIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Map Component to handle view updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function DriverDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [driverLocation, setDriverLocation] = useState<[number, number]>([30.1200, 31.4500]);

  const ordersQuery = trpc.orders.getDriverOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const availableQuery = trpc.orders.getAvailableOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const updateStatusMutation = trpc.orders.updateOrderStatus.useMutation();
  const completeOrderMutation = trpc.orders.completeOrder.useMutation();
  const acceptOrderMutation = trpc.orders.acceptOrder.useMutation();
  const updateLocationMutation = trpc.location.updateDriverLocation.useMutation();

  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);
  const availableOrders = useMemo(() => availableQuery.data || [], [availableQuery.data]);

  // Track driver location
  useEffect(() => {
    if (!user || user.role !== "driver") return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDriverLocation([latitude, longitude]);
          updateLocationMutation.mutate({ latitude, longitude });
        },
        (error) => console.warn("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "driver") {
    navigate("/auth");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await acceptOrderMutation.mutateAsync({ orderId });
      toast.success("تم قبول الطلب بنجاح!");
      ordersQuery.refetch();
      availableQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل قبول الطلب");
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      if (status === "delivered") {
        await completeOrderMutation.mutateAsync({ orderId });
        toast.success("تم تسليم الطلب بنجاح!");
      } else {
        await updateStatusMutation.mutateAsync({ orderId, status: status as any });
        toast.success("تم تحديث حالة الطلب");
      }
      ordersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث الحالة");
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
      pending: { label: "متاح", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
      assigned: { label: "بانتظارك", color: "bg-blue-50 text-blue-600 border-blue-100", icon: User },
      accepted: { label: "مقبول", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: CheckCircle2 },
      in_transit: { label: "في الطريق", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Truck },
      arrived: { label: "وصلت", color: "bg-orange-50 text-orange-600 border-orange-100", icon: MapPin },
      delivered: { label: "تم التسليم", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Package },
    };
    return statusMap[status] || { label: status, color: "bg-slate-50 text-slate-600", icon: Package };
  };

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const selectedOrder = [...orders, ...availableOrders].find(o => o.id === selectedOrderId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div className="flex items-center gap-4" whileHover={{ scale: 1.05 }}>
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <motion.div className="bg-white p-1 rounded-full shadow-md border border-orange-100 overflow-hidden" whileHover={{ scale: 1.1, rotate: 5 }}>
                  <img src="/logo.jpg" alt="وصلي" className="h-5 w-5 object-contain" />
                </motion.div>
                <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">وصلي كابتن</span>
              </div>
            </Link>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
              <motion.span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                🟢 متصل الآن
              </motion.span>
            </div>
            <Link href="/driver/profile">
              <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-10 w-10 hover:bg-orange-100 transition-all">
                <User className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-rose-500 hover:bg-rose-50 rounded-full h-10 w-10 transition-all">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Welcome & Stats */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900">أهلاً يا بطل، {user.name.split(' ')[0]} 🚀</h2>
              <p className="text-slate-500 font-medium text-lg">لديك {availableOrders.length} طلبات جديدة متاحة حولك</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "طلبات جارية", value: activeOrders.length, icon: Zap, color: "from-orange-500 to-orange-600" },
              { label: "طلبات مكتملة", value: completedOrders.length, icon: CheckCircle2, color: "from-emerald-500 to-emerald-600" },
              { label: "أرباح اليوم", value: `ج.م ${totalEarnings.toLocaleString()}`, icon: TrendingUp, color: "from-blue-500 to-blue-600" }
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} whileHover={{ scale: 1.02 }}>
                <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl mb-8 w-full sm:w-auto">
              <TabsTrigger value="available" className="rounded-xl px-8 py-3 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                طلبات متاحة ({availableOrders.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl px-8 py-3 font-black data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                طلباتي الجارية ({activeOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableOrders.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black text-xl">لا توجد طلبات متاحة حالياً</p>
                  </div>
                ) : (
                  availableOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onShowDetails={() => { setSelectedOrderId(order.id); setIsDetailsOpen(true); }} isAvailable onAccept={() => handleAcceptOrder(order.id)} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOrders.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <Truck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black text-xl">ليس لديك طلبات جارية حالياً</p>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onShowDetails={() => { setSelectedOrderId(order.id); setIsDetailsOpen(true); }} onUpdateStatus={(s) => handleUpdateStatus(order.id, s)} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Order Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              تفاصيل الطلب #{selectedOrderId}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${getStatusInfo(selectedOrder.status).color.split(' ')[0]}`}>
                      {(() => { const Icon = getStatusInfo(selectedOrder.status).icon; return <Icon className="h-5 w-5" />; })()}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</p>
                      <p className="text-sm font-black text-slate-900">{getStatusInfo(selectedOrder.status).label}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأرباح</p>
                    <p className="text-lg font-black text-orange-600">ج.م {selectedOrder.price}</p>
                  </div>
                </div>

                <div className="space-y-4 relative">
                  <div className="absolute right-[19px] top-8 bottom-8 w-0.5 border-r-2 border-slate-100 border-dashed" />
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm">
                      <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">من (الاستلام)</p>
                      <p className="text-sm font-bold text-slate-700">{selectedOrder.pickupLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إلى (التسليم)</p>
                      <p className="text-sm font-bold text-slate-700">{selectedOrder.deliveryLocation?.address}</p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setIsMapOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl">
                  <MapIcon className="h-5 w-5 ml-2" />
                  عرض المسار على الخريطة
                </Button>

                {selectedOrder.notes && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ملاحظات</p>
                    <p className="text-sm font-medium text-slate-600 italic">"{selectedOrder.notes}"</p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button onClick={() => setIsDetailsOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-12 rounded-xl">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-[90vw] h-[80vh] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="relative w-full h-full">
            <Button onClick={() => setIsMapOpen(false)} className="absolute top-4 right-4 z-[1000] bg-white/80 backdrop-blur-md text-slate-900 hover:bg-white rounded-full h-10 w-10 p-0 shadow-lg">
              <X className="h-5 w-5" />
            </Button>
            {selectedOrder && (
              <MapContainer center={[selectedOrder.pickupLocation.latitude, selectedOrder.pickupLocation.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <MapUpdater center={[selectedOrder.pickupLocation.latitude, selectedOrder.pickupLocation.longitude]} />
                <Marker position={[selectedOrder.pickupLocation.latitude, selectedOrder.pickupLocation.longitude]}>
                  <Popup>موقع الاستلام</Popup>
                </Marker>
                <Marker position={[selectedOrder.deliveryLocation.latitude, selectedOrder.deliveryLocation.longitude]}>
                  <Popup>موقع التسليم</Popup>
                </Marker>
                <Marker position={driverLocation} icon={L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854866.png', iconSize: [32, 32] })}>
                  <Popup>موقعك الحالي</Popup>
                </Marker>
                <Polyline positions={[
                  [selectedOrder.pickupLocation.latitude, selectedOrder.pickupLocation.longitude],
                  [selectedOrder.deliveryLocation.latitude, selectedOrder.deliveryLocation.longitude]
                ]} color="orange" weight={4} opacity={0.7} dashArray="10, 10" />
              </MapContainer>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({ order, onShowDetails, isAvailable, onAccept, onUpdateStatus }: any) {
  const statusInfo = {
    pending: { label: "متاح", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
    assigned: { label: "بانتظارك", color: "bg-blue-50 text-blue-600 border-blue-100", icon: User },
    accepted: { label: "مقبول", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: CheckCircle2 },
    in_transit: { label: "في الطريق", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Truck },
    arrived: { label: "وصلت", color: "bg-orange-50 text-orange-600 border-orange-100", icon: MapPin },
    delivered: { label: "تم التسليم", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Package },
  }[order.status as string] || { label: order.status, color: "bg-slate-50 text-slate-600", icon: Package };

  return (
    <motion.div whileHover={{ y: -5 }} className="group">
      <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <Badge className={`${statusInfo.color} border px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-tighter`}>
                <statusInfo.icon className="h-3 w-3 ml-1" />
                {statusInfo.label}
              </Badge>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأرباح</p>
                <p className="text-lg font-black text-orange-600">ج.م {order.price}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                </div>
                <p className="text-sm font-bold text-slate-600 truncate">{order.pickupLocation.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-slate-600 truncate">{order.deliveryLocation.address}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex gap-2">
              <Button onClick={onShowDetails} variant="outline" className="flex-1 rounded-xl font-black text-xs h-10 border-slate-200 hover:bg-slate-50">التفاصيل</Button>
              {isAvailable ? (
                <Button onClick={onAccept} className="flex-1 rounded-xl font-black text-xs h-10 bg-orange-500 hover:bg-orange-600 text-white">قبول الطلب</Button>
              ) : (
                <div className="flex-1 flex gap-2">
                  {order.status === "accepted" && <Button onClick={() => onUpdateStatus("in_transit")} className="w-full rounded-xl font-black text-xs h-10 bg-indigo-500 hover:bg-indigo-600 text-white">بدء التحرك</Button>}
                  {order.status === "in_transit" && <Button onClick={() => onUpdateStatus("arrived")} className="w-full rounded-xl font-black text-xs h-10 bg-orange-500 hover:bg-orange-600 text-white">وصلت للموقع</Button>}
                  {order.status === "arrived" && <Button onClick={() => onUpdateStatus("delivered")} className="w-full rounded-xl font-black text-xs h-10 bg-emerald-500 hover:bg-emerald-600 text-white">تم التسليم</Button>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
