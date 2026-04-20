import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, LogOut, User, Truck, Clock, DollarSign, X, Phone, Calendar, ChevronRight, Package, Search, CheckCircle2, Loader2, TrendingUp, Award, Zap, Navigation, Info, MessageCircle, BarChart3, Map as MapIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { ChatBox } from "@/components/ChatBox";
import { useChatContext } from "@/contexts/ChatContext";
import { RestaurantMenu } from "@/components/customer/RestaurantMenu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

// Custom icons for A (Pickup) and B (Delivery)
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

function ChangeView({ center, bounds, shouldFit }: { center?: [number, number], bounds?: L.LatLngBoundsExpression, shouldFit?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
    if (bounds && shouldFit) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [center, bounds, shouldFit, map]);
  return null;
}

// Component to draw routing path
function RoutingPolyline({ start, end }: { start: [number, number]; end: [number, number] }) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [
            coord[1],
            coord[0],
          ] as [number, number]);
          setRouteCoordinates(coordinates);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setRouteCoordinates([start, end]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [start, end]);

  if (loading || routeCoordinates.length === 0) {
    return null;
  }

  return (
    <Polyline
      positions={routeCoordinates}
      color="#f97316"
      weight={4}
      opacity={0.8}
    />
  );
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
  const { unreadCounts } = useChatContext();
  const [showMapModal, setShowMapModal] = useState(false);

  const ordersQuery = trpc.orders.getCustomerOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const orderDetailsQuery = trpc.orders.getOrderDetails.useQuery(
    { orderId: selectedOrderId as number },
    { enabled: !!selectedOrderId && isDetailsOpen, refetchInterval: 10000 }
  );

  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);

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
      if (isDetailsOpen || isChatOpen || showMapModal) {
        e.preventDefault();
        setIsDetailsOpen(false);
        setIsChatOpen(false);
        setShowMapModal(false);
        window.history.pushState(null, "", window.location.pathname);
      }
    };

    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [isDetailsOpen, isChatOpen, showMapModal]);

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

  const mapModal = useMemo(() => {
    if (!showMapModal || !orderDetailsQuery.data) return null;
    
    const order = orderDetailsQuery.data;
    const driverLoc = order.assignedDriver?.lastLocation;
    
    const driver: [number, number] = driverLoc 
      ? [driverLoc.latitude, driverLoc.longitude]
      : [30.1200, 31.4500];
    const pickup: [number, number] = [order.pickupLocation.latitude, order.pickupLocation.longitude];
    const destination: [number, number] = [order.deliveryLocation.latitude, order.deliveryLocation.longitude];

    const bounds = L.latLngBounds([driver, pickup, destination]);

    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg md:max-w-4xl h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col mx-auto border border-white/20"
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <Navigation className="h-5 w-5 text-orange-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">المسار الكامل للمندوب</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تتبع مباشر • طلب #{order.id}</p>
              </div>
            </div>
            <button
              onClick={() => setShowMapModal(false)}
              className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <MapContainer
              center={driver}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <ChangeView bounds={bounds} shouldFit={true} />
              
              <Marker position={driver} icon={iconDriver}>
                <Popup>📍 موقع المندوب الحالي</Popup>
              </Marker>
              
              <Marker position={pickup} icon={iconA}>
                <Popup>📦 موقع الاستلام (المطعم)</Popup>
              </Marker>
              
              <Marker position={destination} icon={iconB}>
                <Popup>🎯 موقع التسليم (منزلك)</Popup>
              </Marker>
              
              <RoutingPolyline start={driver} end={pickup} />
              <RoutingPolyline start={pickup} end={destination} />
            </MapContainer>

            {/* Floating Info Overlay */}
            <div className="absolute bottom-6 left-6 right-6 z-[400]">
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{order.assignedDriver?.name || "المندوب"}</p>
                    <p className="text-[10px] font-bold text-slate-500">جاري التوصيل الآن</p>
                  </div>
                </div>
                {order.assignedDriver?.phone && (
                  <a href={`tel:${order.assignedDriver.phone}`} className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <Button
              onClick={() => setShowMapModal(false)}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 h-14 font-black rounded-2xl transition-all"
            >
              إغلاق الخريطة
            </Button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${driver[0]},${driver[1]}&destination=${destination[0]},${destination[1]}&waypoints=${pickup[0]},${pickup[1]}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 font-black rounded-2xl shadow-xl shadow-orange-100 transition-all">
                🗺️ فتح في خرائط جوجل
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }, [showMapModal, orderDetailsQuery.data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.05 }}
          >
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <motion.div 
                  className="bg-white p-1 rounded-full shadow-md border border-orange-100 overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <img src="/logo.jpg" alt="وصلي" className="h-8 w-8 object-contain" />
                </motion.div>
                <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">وصلي</span>
              </div>
            </Link>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{user.name}</span>
              <motion.span 
                className="text-[10px] font-bold text-orange-600 uppercase tracking-widest"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐ عميل مميز
              </motion.span>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/customer/stats">
                <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-br from-slate-100 to-slate-50 h-10 w-10 hover:from-orange-100 hover:to-orange-50 transition-all">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/customer/profile">
                <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-br from-slate-100 to-slate-50 h-10 w-10 hover:from-orange-100 hover:to-orange-50 transition-all">
                  <User className="h-5 w-5 text-slate-600" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="active" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">طلباتي</h2>
              <p className="text-slate-500 font-medium mt-1">تتبع طلباتك الحالية واستعرض سجل معاملاتك</p>
            </div>
            <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-14 border border-slate-200/50 shadow-inner">
              <TabsTrigger value="active" className="rounded-xl px-8 h-full font-black text-sm data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md transition-all">
                النشطة ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-xl px-8 h-full font-black text-sm data-[state=active]:bg-white data-[state=active]:text-slate-600 data-[state=active]:shadow-md transition-all">
                المكتملة ({completedOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-0 outline-none">
            {activeOrders.length === 0 ? (
              <motion.div 
                className="py-24 text-center bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="h-24 w-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-12 w-12 text-orange-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">لا توجد طلبات نشطة</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8">ابدأ بطلب وجبتك المفضلة الآن من أفضل المطاعم</p>
                <Link href="/">
                  <Button className="rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black px-10 h-14 shadow-xl shadow-orange-100">اطلب الآن</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  const Icon = status.icon;
                  return (
                    <Card key={order.id} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
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
                          <Badge className={`${status.color} border-none font-bold px-4 py-1.5 rounded-full text-[10px] shadow-sm`}>
                            {status.label}
                          </Badge>
                        </div>

                        <div className="p-8 space-y-6">
                          <div className="relative space-y-6">
                            <div className="absolute right-[11px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-orange-500 via-slate-100 to-blue-500 rounded-full" />
                            <div className="relative flex gap-4">
                              <div className="h-6 w-6 rounded-full bg-orange-500 border-4 border-white shadow-lg z-10 flex-shrink-0" />
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">من</p>
                                <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{order.pickupLocation?.address}</p>
                              </div>
                            </div>
                            <div className="relative flex gap-4">
                              <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow-lg z-10 flex-shrink-0" />
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إلى</p>
                                <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{order.deliveryLocation?.address}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجمالي</p>
                              <p className="text-xl font-black text-orange-600">ج.م {order.price}</p>
                            </div>
                            <Button 
                              onClick={() => handleShowDetails(order.id)}
                              className="rounded-2xl bg-slate-900 hover:bg-orange-600 text-white font-black text-xs px-6 h-12 transition-all shadow-lg shadow-slate-200"
                            >
                              التفاصيل والتتبع
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {completedOrders.map((order) => {
                const status = getStatusInfo(order.status);
                return (
                  <Card key={order.id} className="border-none shadow-lg bg-white/60 rounded-[2.5rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">طلب #{order.id}</p>
                          <Badge className={`${status.color} border-none font-bold px-3 py-1 rounded-full text-[10px] shadow-sm`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-900">ج.م {order.price}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            const repeatData = encodeURIComponent(JSON.stringify({
                              pickup: order.pickupLocation,
                              delivery: order.deliveryLocation,
                              notes: (order as any).notes || ""
                            }));
                            navigate(`/customer/create-order?repeat=${repeatData}`);
                          }}
                          className="w-full rounded-xl font-bold text-xs h-10 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all"
                        >
                          إعادة الطلب
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
          <DialogHeader className="p-8 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full -mr-16 -mt-16 blur-2xl" />
            <DialogTitle className="text-2xl font-black flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-orange-600 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              تفاصيل الطلب #{selectedOrderId}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold mt-2 relative z-10">
              تتبع حالة طلبك لحظة بلحظة
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            {orderDetailsQuery.isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
                <p className="text-slate-500 font-black">جاري جلب المعلومات...</p>
              </div>
            ) : orderDetailsQuery.data ? (
              <>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${getStatusInfo(orderDetailsQuery.data.status).color.split(' ')[0]} shadow-sm`}>
                      {(() => {
                        const Icon = getStatusInfo(orderDetailsQuery.data.status).icon;
                        return <Icon className="h-6 w-6" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الطلب</p>
                      <p className="text-base font-black text-slate-900">{getStatusInfo(orderDetailsQuery.data.status).label}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجمالي</p>
                    <p className="text-2xl font-black text-orange-600">ج.م {orderDetailsQuery.data.price}</p>
                  </div>
                </div>

                {['accepted', 'arrived', 'in_transit'].includes(orderDetailsQuery.data.status) && (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setShowMapModal(true)}
                      className="w-full py-10 rounded-3xl bg-slate-900 hover:bg-orange-600 text-white transition-all flex flex-col gap-2 group shadow-xl shadow-slate-200"
                    >
                      <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <MapIcon className="h-6 w-6 text-orange-500" />
                      </div>
                      <span className="font-black text-sm">📍 تتبع المسار الكامل للمندوب على الخريطة</span>
                    </Button>
                    
                    {orderDetailsQuery.data.assignedDriver?.lastLocation && (
                      <div className="h-40 w-full rounded-3xl overflow-hidden border border-slate-100 shadow-inner relative grayscale hover:grayscale-0 transition-all">
                        <MapContainer 
                          center={[orderDetailsQuery.data.assignedDriver.lastLocation.latitude, orderDetailsQuery.data.assignedDriver.lastLocation.longitude]} 
                          zoom={15} 
                          style={{ height: '100%', width: '100%' }}
                          zoomControl={false}
                          dragging={false}
                          touchZoom={false}
                          scrollWheelZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <ChangeView center={[orderDetailsQuery.data.assignedDriver.lastLocation.latitude, orderDetailsQuery.data.assignedDriver.lastLocation.longitude]} />
                          <Marker position={[orderDetailsQuery.data.assignedDriver.lastLocation.latitude, orderDetailsQuery.data.assignedDriver.lastLocation.longitude]} icon={iconDriver} />
                        </MapContainer>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6 relative">
                  <div className="absolute right-[19px] top-10 bottom-10 w-[2px] bg-dashed border-r-2 border-slate-100 border-dashed" />
                  <div className="flex items-start gap-5 relative z-10">
                    <div className="h-10 w-10 rounded-full bg-orange-500 border-4 border-white shadow-md flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">موقع الاستلام</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{orderDetailsQuery.data.pickupLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 relative z-10">
                    <div className="h-10 w-10 rounded-full bg-blue-500 border-4 border-white shadow-md flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وجهة التسليم</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{orderDetailsQuery.data.deliveryLocation?.address}</p>
                    </div>
                  </div>
                </div>

                {orderDetailsQuery.data.assignedDriver && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl font-black text-orange-600 border border-orange-50">
                          {orderDetailsQuery.data.assignedDriver.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المندوب المكلف</p>
                          <p className="text-base font-black text-slate-900">{orderDetailsQuery.data.assignedDriver.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setChatOrderId(selectedOrderId);
                            setIsChatOpen(true);
                          }}
                          className="h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                        <a href={`tel:${orderDetailsQuery.data.assignedDriver.phone}`}>
                          <Button className="h-12 w-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-100 transition-all">
                            <Phone className="h-5 w-5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {isChatOpen && chatOrderId && (
        <ChatBox 
          orderId={chatOrderId}
          userId={user.id}
          userRole="customer"
          userName={user.name}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      <AnimatePresence>
        {mapModal}
      </AnimatePresence>
    </div>
  );
}
