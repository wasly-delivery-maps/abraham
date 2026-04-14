import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Phone, Package, CheckCircle2, Clock, DollarSign, TrendingUp, User, LogOut, Loader2, ChevronRight, Truck, Map as MapIcon, ShieldCheck, Info, Zap, Route, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { ChatBox } from "@/components/ChatBox";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
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

// Custom icons for A and B
const iconA = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#f97316; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);'>A</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const iconB = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3b82f6; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);'>B</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Component to auto-fit map bounds
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function DriverDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("available");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const hasNavigatedRef = useRef(false);

  const ordersQuery = trpc.orders.getDriverOrders.useQuery(undefined, {
    enabled: !!user && user.role === "driver",
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const updateLocationMutation = trpc.location.updateDriverLocation.useMutation();

  const orderDetailsQuery = trpc.orders.getOrderWithCustomer.useQuery(
    { orderId: selectedOrderId as number },
    { enabled: !!selectedOrderId }
  );

  const availableQuery = trpc.orders.getAvailableOrders.useQuery(undefined, {
    enabled: !!user && user.role === "driver",
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const updateStatusMutation = trpc.orders.updateOrderStatus.useMutation();
  const acceptOrderMutation = trpc.orders.acceptOrder.useMutation();
  const completeOrderMutation = trpc.orders.completeOrder.useMutation();

  useEffect(() => {
    if (!loading && (!user || user.role !== "driver") && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const lastLocationUpdateRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  
  useEffect(() => {
    if (!user || user.role !== "driver") return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const now = Date.now();
          
          if (!lastLocationUpdateRef.current || 
              now - lastLocationUpdateRef.current.time > 30000 ||
              (Math.abs(latitude - lastLocationUpdateRef.current.lat) > 0.0001 ||
               Math.abs(longitude - lastLocationUpdateRef.current.lng) > 0.0001)) {
            lastLocationUpdateRef.current = { lat: latitude, lng: longitude, time: now };
            setDriverLocation({ latitude, longitude });
            updateLocationMutation.mutate({ latitude, longitude });
          }
        },
        (error) => console.warn("Location error:", error),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "driver") {
    return null;
  }

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      if (status === "delivered") {
        const result = await completeOrderMutation.mutateAsync({ orderId });
        if ((result as any).isSuspended) {
          toast.error(result.message);
        } else {
          toast.success(result.message || "تم تسليم الطلب بنجاح ✅");
        }
      } else {
        await updateStatusMutation.mutateAsync({ 
          orderId, 
          status: status as any
        });
        toast.success("تم تحديث حالة الطلب بنجاح 🚀");
      }
      ordersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل في تحديث الحالة");
    }
  };

  const openMaps = (order: any, type: string) => {
    const currentLocation = driverLocation 
      ? `${driverLocation.latitude},${driverLocation.longitude}`
      : "30.1200,31.4500";
    
    const pickup = `${order.pickupLocation.latitude},${order.pickupLocation.longitude}`;
    const destination = `${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`;
    
    let url = "";
    if (type === "pickup") {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation}&destination=${pickup}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation}&destination=${destination}&waypoints=${pickup}&travelmode=driving`;
    }
    window.open(url, "_blank");
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
  const activeOrders = orders.filter((o) => ["assigned", "accepted", "picked_up", "in_transit", "arrived"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "delivered");

  const stats = [
    { label: "طلبات متاحة", value: availableOrders.length, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "طلبات جارية", value: activeOrders.length, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "أرباح اليوم", value: `ج.م ${completedOrders.reduce((sum, o) => sum + (o.price || 0), 0)}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-orange-100 text-orange-600 border-none px-3 py-1 rounded-full font-black text-[10px]">متاح الآن</Badge>;
      case "assigned":
      case "accepted": return <Badge className="bg-blue-100 text-blue-600 border-none px-3 py-1 rounded-full font-black text-[10px]">جاري التوجه للاستلام</Badge>;
      case "picked_up": return <Badge className="bg-purple-100 text-purple-600 border-none px-3 py-1 rounded-full font-black text-[10px]">تم استلام الشحنة</Badge>;
      case "in_transit": return <Badge className="bg-indigo-100 text-indigo-600 border-none px-3 py-1 rounded-full font-black text-[10px]">في الطريق</Badge>;
      case "arrived": return <Badge className="bg-amber-100 text-amber-600 border-none px-3 py-1 rounded-full font-black text-[10px]">وصلت</Badge>;
      case "delivered": return <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 py-1 rounded-full font-black text-[10px]">تم التسليم</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-600 border-none px-3 py-1 rounded-full font-black text-[10px]">{status}</Badge>;
    }
  };

  const isValidCoordinate = (lat: any, lng: any): boolean => {
    const l = typeof lat === 'string' ? parseFloat(lat) : lat;
    const g = typeof lng === 'string' ? parseFloat(lng) : lng;
    return (
      typeof l === 'number' && 
      typeof g === 'number' && 
      !isNaN(l) && 
      !isNaN(g) && 
      l >= -90 && 
      l <= 90 && 
      g >= -180 && 
      g <= 180
    );
  };

  const OrderCard = ({ order, isAvailable = false }: { order: any, isAvailable?: boolean }) => {
    const isSelected = selectedOrderId === order.id;
    const details = orderDetailsQuery.data;

    const pickupLat = typeof order.pickupLocation?.latitude === 'string' ? parseFloat(order.pickupLocation.latitude) : order.pickupLocation?.latitude;
    const pickupLng = typeof order.pickupLocation?.longitude === 'string' ? parseFloat(order.pickupLocation.longitude) : order.pickupLocation?.longitude;
    const deliveryLat = typeof order.deliveryLocation?.latitude === 'string' ? parseFloat(order.deliveryLocation.latitude) : order.deliveryLocation?.latitude;
    const deliveryLng = typeof order.deliveryLocation?.longitude === 'string' ? parseFloat(order.deliveryLocation.longitude) : order.deliveryLocation?.longitude;

    const isPickupValid = isValidCoordinate(pickupLat, pickupLng);
    const isDeliveryValid = isValidCoordinate(deliveryLat, deliveryLng);

    const customerName = details?.customer?.name || order.customer?.name || "عميل وصلي";
    const customerPhone = details?.customer?.phone || order.customer?.phone;

    const bounds = isPickupValid && isDeliveryValid 
      ? L.latLngBounds([pickupLat, pickupLng], [deliveryLat, deliveryLng])
      : null;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
        <Card 
          className={`border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden mb-6 group transition-all duration-500 ${isSelected ? 'ring-2 ring-orange-500' : 'hover:shadow-2xl'}`}
          onClick={() => !isAvailable && setSelectedOrderId(order.id)}
        >
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

            {/* Leaflet Map - Visible for ALL orders */}
            {isPickupValid && isDeliveryValid && (
              <div className="h-64 w-full bg-slate-100 relative z-0">
                <MapContainer 
                  center={[pickupLat, pickupLng]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  dragging={true}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[pickupLat, pickupLng]} icon={iconA}>
                    <Popup>نقطة الاستلام</Popup>
                  </Marker>
                  <Marker position={[deliveryLat, deliveryLng]} icon={iconB}>
                    <Popup>وجهة التسليم</Popup>
                  </Marker>
                  <Polyline 
                    positions={[[pickupLat, pickupLng], [deliveryLat, deliveryLng]]} 
                    color="#f97316" 
                    weight={4} 
                    opacity={0.8}
                  />
                  {bounds && <ChangeView bounds={bounds} />}
                </MapContainer>
              </div>
            )}

            <div className="p-8 space-y-8">
              <div className="relative space-y-8">
                <div className="absolute right-[11px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-orange-500 via-slate-200 to-blue-500 rounded-full" />
                
                <div className="relative flex gap-6">
                  <div className="h-6 w-6 rounded-full bg-orange-500 border-4 border-white shadow-lg z-10 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نقطة الاستلام</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.pickupLocation?.address || "عنوان غير متاح"}</p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow-lg z-10 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وجهة التسليم</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{order.deliveryLocation?.address || "عنوان غير متاح"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">أرباحك</p>
                  <p className="text-xl font-black text-orange-600">ج.م {order.price || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العميل</p>
                  <p className="text-sm font-black text-slate-900 truncate">{customerName}</p>
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
                    onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
                    className="w-full py-7 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg shadow-xl shadow-orange-100 transition-all"
                  >
                    قبول الطلب الآن 🚀
                  </Button>
                )}
                {!isAvailable && (order.status === "assigned" || order.status === "accepted") && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); openMaps(order, "pickup"); }}
                      className="py-7 rounded-2xl border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50"
                    >
                      <Navigation className="ml-2 h-4 w-4" /> موقع الاستلام
                    </Button>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, "picked_up"); }}
                      className="py-7 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl transition-all"
                    >
                      تم استلام الشحنة 📦
                    </Button>
                  </div>
                )}
                {!isAvailable && order.status === "picked_up" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); openMaps(order, "delivery"); }}
                      className="py-7 rounded-2xl border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50"
                    >
                      <Navigation className="ml-2 h-4 w-4" /> المسار الكامل
                    </Button>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, "in_transit"); }}
                      className="py-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl transition-all"
                    >
                      بدء التحرك للتسليم 🏁
                    </Button>
                  </div>
                )}
                {!isAvailable && order.status === "in_transit" && (
                  <Button 
                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, "arrived"); }}
                    className="w-full py-7 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg shadow-xl transition-all"
                  >
                    لقد وصلت للموقع 📍
                  </Button>
                )}
                {!isAvailable && order.status === "arrived" && (
                  <Button 
                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, "delivered"); }}
                    className="w-full py-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl transition-all"
                  >
                    تم التسليم بنجاح ✅
                  </Button>
                )}
                
                {!isAvailable && order.status !== "delivered" && (
                  <div className="grid grid-cols-2 gap-3">
                    {customerPhone && (
                      <a href={`tel:${customerPhone}`} className="w-full" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" className="w-full py-7 rounded-2xl border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50">
                          <Phone className="ml-2 h-4 w-4" /> اتصل بالعميل
                        </Button>
                      </a>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); setIsChatOpen(true); }}
                      className="w-full py-7 rounded-2xl border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50"
                    >
                      <MessageSquare className="ml-2 h-4 w-4" /> مراسلة
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || availableOrders.find(o => o.id === selectedOrderId);
  const otherUserName = orderDetailsQuery.data?.customer?.name || selectedOrder?.customer?.name || "العميل";

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
                  <p className="text-slate-500 text-sm">سيتم إخطارك فور توفر طلب جديد</p>
                </div>
              ) : (
                <div>
                  {availableOrders.map((order) => (
                    <OrderCard key={order.id} order={order} isAvailable={true} />
                  ))}
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
                  <p className="text-slate-500 text-sm">اقبل طلباً لبدء التوصيل</p>
                </div>
              ) : (
                <div>
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} isAvailable={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0 outline-none">
              {completedOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">لم تكمل أي طلبات بعد</h3>
                  <p className="text-slate-500 text-sm">ابدأ بقبول الطلبات المتاحة</p>
                </div>
              ) : (
                <div>
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} isAvailable={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {isChatOpen && selectedOrderId && (
        <ChatBox 
          orderId={selectedOrderId}
          otherUserId={selectedOrder?.customerId}
          otherUserName={otherUserName}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
