import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, User, Truck, Clock, X, Phone, ChevronRight, Package, MessageCircle, BarChart3, Zap, Timer, ChevronLeft, Info, Loader2, Sparkles, Map } from "lucide-react";
import { CountdownTimer } from "@/components/customer/CountdownTimer";
import { RestaurantMenu } from "@/components/customer/RestaurantMenu";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatBox } from "@/components/ChatBox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCancel}
      disabled={isLoading}
      className="text-rose-500 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all"
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5 ml-1" />}
      إلغاء
    </Button>
  );
}

export default function CustomerDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // جعل تبويب المطاعم هو الافتراضي دائماً إلا إذا تم تحديد غير ذلك
      return params.get('tab') || "restaurants";
    }
    return "restaurants";
  });
  const { unreadCounts } = useChatContext();

  const ordersQuery = trpc.orders.getCustomerOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const offersQuery = trpc.offers.getActive.useQuery(undefined, {
    refetchInterval: 60000,
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

  const handleOpenChat = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsChatOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-10 w-10 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "customer") {
    navigate("/auth");
    return null;
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string, color: string, icon: any, bgColor: string }> = {
      pending: { label: "قيد الانتظار", color: "text-amber-600", bgColor: "bg-amber-50", icon: Clock },
      assigned: { label: "تم الإسناد", color: "text-blue-600", bgColor: "bg-blue-50", icon: User },
      accepted: { label: "تم القبول", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: Package },
      picked_up: { label: "تم الاستلام", color: "text-purple-600", bgColor: "bg-purple-50", icon: Package },
      in_transit: { label: "في الطريق", color: "text-purple-600", bgColor: "bg-purple-50", icon: Truck },
      arrived: { label: "وصل السائق", color: "text-orange-600", bgColor: "bg-orange-50", icon: MapPin },
      delivered: { label: "تم التسليم", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: Package },
      cancelled: { label: "ملغى", color: "text-rose-600", bgColor: "bg-rose-50", icon: X },
    };
    return statusMap[status] || { label: status, color: "text-slate-600", bgColor: "bg-slate-50", icon: Package };
  };

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const otherUserName = selectedOrder?.driver?.name || "السائق";

  return (
    <div className="min-h-screen bg-[#F1F3F6] text-slate-900 font-sans pb-24" dir="rtl">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden">
              <img src="/logo.jpg" alt="وصلي" className="h-10 w-10 object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">وصلي</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/customer/stats">
              <div className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                  <BarChart3 className="h-5 w-5 text-slate-600 group-hover:text-orange-600" />
                </div>
                <span className="text-[10px] font-black text-slate-500">الإحصائيات</span>
              </div>
            </Link>
            <Link href="/customer/profile">
              <div className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                  <User className="h-5 w-5 text-slate-600 group-hover:text-orange-600" />
                </div>
                <span className="text-[10px] font-black text-slate-500">الملف الشخصي</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1">أهلاً بك، {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 font-medium">ماذا تريد أن تطلب اليوم؟</p>
        </div>

        {/* Quick Action Card */}
        <Link href="/customer/create-order">
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-[2rem] shadow-xl shadow-orange-200 mb-10 cursor-pointer relative overflow-hidden group"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-black mb-1">طلب مندوب توصيل</h2>
                <p className="text-orange-100 text-sm font-medium">أرسل أي شيء لأي مكان في دقائق</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Truck className="h-32 w-32 text-white" />
            </div>
          </motion.div>
        </Link>

        {/* Horizontal Offers Section */}
        {activeOffers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-orange-500 fill-orange-500" />
                عروض حصرية لك
              </h3>
              <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-xs px-4 py-1.5 rounded-full animate-pulse">
                لفترة محدودة
              </Badge>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
              {activeOffers.map((offer) => (
                <motion.div 
                  key={offer.id} 
                  className="min-w-[280px] sm:min-w-[320px] snap-center group cursor-pointer"
                >
                  <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white flex flex-col h-full">
                    {/* Image Container - Fixed 16:10 Ratio Full Fit */}
                    <div className="relative overflow-hidden bg-slate-100 w-full" style={{ aspectRatio: '16/10' }}>
                      <img 
                        src={offer.imageUrl} 
                        alt={offer.title} 
                        className="w-full h-full object-fill transition-transform duration-700 group-hover:scale-105" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 250%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22250%22/%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    
                    {/* Content Container */}
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div className="space-y-2 mb-4">
                        {/* Timer Badge - Professional Placement Between Image and Title */}
                        <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 w-fit border border-orange-100 mb-2">
                          <Timer className="h-3 w-3" />
                          <span>ينتهي خلال:</span>
                          <CountdownTimer expiresAt={offer.expiresAt} />
                        </div>
                        
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                          {offer.title}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full bg-orange-500 text-white hover:bg-orange-600 border-none shadow-md shadow-orange-100 h-9 text-xs font-black rounded-xl transition-all active:scale-95"
                        onClick={() => setActiveTab("restaurants")}
                      >
                        اطلب الآن
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
          <TabsList className="bg-slate-100 p-1.5 rounded-[1.5rem] mb-8 w-full grid grid-cols-3 h-14">
            <TabsTrigger value="active" className="rounded-2xl font-black text-sm data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all">
              النشطة
              {activeOrders.length > 0 && <span className="mr-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px]">{activeOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-2xl font-black text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">السجل</TabsTrigger>
            <TabsTrigger value="restaurants" className="rounded-2xl font-black text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">المطاعم</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-5">
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => {
                const status = getStatusInfo(order.status);
                const unreadCount = unreadCounts[order.id] || 0;
                const orderNotes = order.notes || order.description;

                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`${status.bgColor} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                              <status.icon className={`h-6 w-6 ${status.color}`} />
                            </div>
                            <div>
                              <span className="text-base font-black text-slate-900 block">طلب #{order.id}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={`${status.bgColor} ${status.color} border-none font-black text-[10px] px-3 rounded-lg`}>
                                  {status.label}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-slate-900">ج.م {order.price}</div>
                          </div>
                        </div>

                        {/* Order Notes for Customer List */}
                        {orderNotes && (
                          <div className="mb-4 bg-orange-50/50 p-3 rounded-xl border border-orange-100/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Info className="h-3 w-3 text-orange-500" />
                              <p className="text-[10px] font-bold text-orange-600">ملاحظات الطلب:</p>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 italic line-clamp-2 leading-relaxed">"{orderNotes}"</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                            {order.driverId || order.driver ? (
                              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 pr-4">
                                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                  {(order.driver?.name || "كابتن").charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-700">{order.driver?.name || "كابتن وصلي"}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {order.driver?.phone && (
                                      <a href={`tel:${order.driver.phone}`} className="text-orange-600 bg-orange-50 p-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                                        <Phone className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                    <div 
                                      onClick={() => handleOpenChat(order.id)}
                                      className="relative text-blue-600 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                      {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                                          {unreadCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-[10px] font-bold">بحث عن سائق...</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!["in_transit", "arrived", "delivered", "cancelled"].includes(order.status) && (
                              <CancelOrderButton orderId={order.id} onSuccess={() => ordersQuery.refetch()} />
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleShowDetails(order.id)}
                              className="rounded-2xl border-slate-100 text-slate-600 font-black text-xs h-10 px-5 hover:bg-slate-50 transition-all"
                            >
                              التفاصيل
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <div className="bg-slate-100 h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto mb-5">
                  <Package className="h-10 w-10 text-slate-300" />
                </div>
                <p className="text-slate-400 font-black text-lg">لا توجد طلبات نشطة حالياً</p>
                <p className="text-slate-300 text-sm font-bold mt-1">اطلب الآن وسنصلك في أسرع وقت</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <Card key={order.id} className="border-none shadow-sm rounded-[1.5rem] bg-white opacity-90">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`${status.bgColor} p-2.5 rounded-2xl`}>
                            <Package className={`h-5 w-5 ${status.color}`} />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 block">طلب #{order.id}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-slate-900">ج.م {order.price}</div>
                          <span className={`text-[10px] font-black ${status.color}`}>{status.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-16 text-slate-400 font-black">سجل الطلبات فارغ</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="restaurants">
            <RestaurantMenu />
          </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Order Details Dialog - Full width on Mobile */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white z-[9999]" dir="rtl">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 sm:p-8 text-white relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <DialogTitle className="text-2xl font-black mb-2">تفاصيل الطلب #{selectedOrderId}</DialogTitle>
                {orderDetailsQuery.data && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 text-white border-none font-black px-3 py-1 rounded-lg backdrop-blur-md">
                      {getStatusInfo(orderDetailsQuery.data.status).label}
                    </Badge>
                  </div>
                )}
              </div>
              {/* Custom Close Button - Professional Positioning */}
              <button 
                onClick={() => setIsDetailsOpen(false)} 
                className="text-white hover:bg-white/20 rounded-2xl h-10 w-10 shrink-0 flex items-center justify-center transition-colors z-[10000]"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="absolute -left-6 -bottom-6 opacity-10">
              <Package className="h-32 w-32" />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {orderDetailsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                <p className="text-slate-400 font-bold">جاري تحميل البيانات...</p>
              </div>
            ) : orderDetailsQuery.data ? (
              <>
                {/* Driver Info Section - Priority Visibility Fixed Logic */}
                {orderDetailsQuery.data.driverId || orderDetailsQuery.data.driver ? (
                  <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-[1.5rem] shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                        {(orderDetailsQuery.data.driver?.name || "كابتن").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{orderDetailsQuery.data.driver?.name || "كابتن وصلي"}</p>
                        <p className="text-[10px] font-black text-orange-600">كابتن وصلي</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {orderDetailsQuery.data.driver?.phone && (
                        <a href={`tel:${orderDetailsQuery.data.driver.phone}`} className="bg-white p-2.5 rounded-xl text-orange-500 shadow-sm border border-orange-100 hover:bg-orange-500 hover:text-white transition-all active:scale-90" title="اتصال">
                          <Phone className="h-5 w-5" />
                        </a>
                      )}
                      <div 
                        onClick={() => { setIsDetailsOpen(false); handleOpenChat(selectedOrderId!); }}
                        className="bg-white p-2.5 rounded-xl text-blue-500 shadow-sm border border-blue-100 hover:bg-blue-500 hover:text-white transition-all active:scale-90 cursor-pointer"
                        title="دردشة"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <Link href={`/customer/track/${selectedOrderId}`}>
                        <div className="bg-white p-2.5 rounded-xl text-emerald-500 shadow-sm border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all active:scale-90 cursor-pointer" title="تتبع المندوب">
                          <Map className="h-5 w-5" />
                        </div>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-center">
                    <p className="text-xs font-bold text-slate-400">جاري البحث عن كابتن لتوصيل طلبك...</p>
                  </div>
                )}

                <div className="space-y-5 relative px-2">
                  <div className="absolute right-[15px] top-3 bottom-3 w-0.5 bg-slate-100" />
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="h-4 w-4 rounded-full border-4 border-white bg-slate-300 shadow-sm mt-1" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">نقطة الاستلام</p>
                      <p className="text-xs font-black text-slate-700 leading-snug">{orderDetailsQuery.data.pickupLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="h-4 w-4 rounded-full border-4 border-white bg-orange-500 shadow-sm mt-1" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">وجهة التوصيل</p>
                      <p className="text-xs font-black text-slate-700 leading-snug">{orderDetailsQuery.data.deliveryLocation?.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-[1.5rem] space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400">تكلفة التوصيل</span>
                    <span className="text-xl font-black text-orange-600">ج.م {orderDetailsQuery.data.price}</span>
                  </div>
                  {(orderDetailsQuery.data.notes || orderDetailsQuery.data.description) && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ملاحظات العميل:</p>
                      <p className="text-xs font-bold text-slate-600 italic bg-white p-3 rounded-xl border border-slate-100">
                        "{orderDetailsQuery.data.notes || orderDetailsQuery.data.description}"
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <X className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <p className="text-slate-500 font-black">عذراً، فشل تحميل تفاصيل الطلب</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Box Component */}
      {isChatOpen && selectedOrderId && (
        <ChatBox 
          orderId={selectedOrderId}
          userId={user.id}
          userRole="customer"
          userName={user.name}
          otherUserName={otherUserName}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
