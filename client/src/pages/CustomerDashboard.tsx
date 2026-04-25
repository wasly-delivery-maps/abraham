import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, User, Truck, Clock, X, Phone, ChevronRight, Package, MessageCircle, BarChart3, Zap, Timer, ChevronLeft, Info, Loader2, Sparkles, Map, ShoppingCart } from "lucide-react";
import { CountdownTimer } from "@/components/customer/CountdownTimer";
import { RestaurantMenu } from "@/components/customer/RestaurantMenu";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatBox } from "@/components/ChatBox";
import MapPicker from "@/components/MapPicker";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

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
  const [isExternalCartOpen, setIsExternalCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // جعل تبويب المطاعم هو الافتراضي دائماً إلا إذا تم تحديد غير ذلك
      return params.get('tab') || "restaurants";
    }
    return "restaurants";
  });
  const { unreadCounts } = useChatContext();
  const { itemCount } = useCart();


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
    <div className="min-h-screen bg-[#F1F3F6] text-slate-900 font-sans pb-32" dir="rtl">
      {/* Mobile-Style Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-md border border-orange-100 flex items-center justify-center overflow-hidden p-1">
            <img src="/logo.jpg" alt="وصلي" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 leading-none">وصلي</h1>
            <span className="text-[10px] font-bold text-orange-500">دليلك في العبور</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Zap className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6">
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
                        <p className="text-[11px] font-bold text-slate-500 line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => setActiveTab("restaurants")}
                        className="w-full bg-slate-900 hover:bg-orange-600 text-white font-black rounded-2xl py-6 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-orange-200"
                      >
                        استخدم العرض الآن
                        <ChevronLeft className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="restaurants">المطاعم</TabsTrigger>
            <TabsTrigger value="active">الطلبات النشطة</TabsTrigger>
            <TabsTrigger value="completed">الطلبات السابقة</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="mt-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-black text-slate-900">المطاعم المتاحة</h3>
              <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold">
                {3} مطاعم
              </Badge>
            </div>
            <RestaurantMenu 
              isExternalCartOpen={isExternalCartOpen} 
              onExternalCartClose={() => setIsExternalCartOpen(false)} 
            />
          </TabsContent>

          <TabsContent value="active" className="mt-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-black text-slate-900">طلباتك الحالية</h3>
              {activeOrders.length > 0 && (
                <Badge className="bg-orange-500 text-white border-none font-black">
                  {activeOrders.length} نشط
                </Badge>
              )}
            </div>
            
            {activeOrders.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[2rem] bg-white p-10 text-center">
                <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-slate-300" />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2">لا توجد طلبات نشطة</h4>
                <p className="text-slate-500 text-sm font-medium mb-6">ابدأ بطلب وجبتك المفضلة الآن!</p>
                <Button 
                  onClick={() => setActiveTab("restaurants")}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl px-8"
                >
                  تصفح المطاعم
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <motion.div key={order.id} layout>
                      <Card className="overflow-hidden border-none shadow-md rounded-[2rem] bg-white">
                        <CardContent className="p-0">
                          <div className="p-5 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-3">
                              <div className={`h-12 w-12 rounded-2xl ${status.bgColor} flex items-center justify-center`}>
                                <status.icon className={`h-6 w-6 ${status.color}`} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">طلب #{order.id}</p>
                                <h4 className="font-black text-slate-900">{status.label}</h4>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-lg font-black text-orange-600">ج.م {order.totalPrice || order.price}</p>
                              <p className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          
                          <div className="p-5 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                  {order.driver?.avatarUrl ? (
                                    <img src={order.driver.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <User className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <span className="text-xs font-black text-slate-700">{order.driver?.name || "جاري البحث عن سائق..."}</span>
                              </div>
                              <div className="flex gap-2">
                                {order.status === 'pending' && (
                                  <CancelOrderButton orderId={order.id} onSuccess={() => ordersQuery.refetch()} />
                                )}
                                {order.driver && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-9 w-9 rounded-xl bg-white shadow-sm text-orange-500 hover:text-orange-600 p-0"
                                    onClick={() => handleOpenChat(order.id)}
                                  >
                                    <div className="relative">
                                      <MessageCircle className="h-5 w-5" />
                                      {unreadCounts[order.id] > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                                          {unreadCounts[order.id]}
                                        </span>
                                      )}
                                    </div>
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <Button 
                              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl py-6 border border-slate-200 shadow-sm"
                              onClick={() => handleShowDetails(order.id)}
                            >
                              تتبع الطلب بالتفصيل
                              <ChevronLeft className="mr-2 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="bg-orange-500 p-8 text-white relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsDetailsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">تفاصيل الطلب</h2>
                <p className="text-orange-100 font-bold opacity-80">طلب رقم #{selectedOrderId}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
            {orderDetailsQuery.isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-black">جاري تحميل التفاصيل...</p>
              </div>
            ) : orderDetailsQuery.data ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">نقطة الاستلام:</p>
                      <p className="text-xs font-black text-slate-700 leading-snug">{orderDetailsQuery.data.pickupLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Truck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">نقطة التسليم:</p>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 pb-8 flex justify-between items-center shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab("restaurants")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'restaurants' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl ${activeTab === 'restaurants' ? 'bg-orange-100' : ''}`}>
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black">المطاعم</span>
        </button>

        <button 
          onClick={() => setActiveTab("active")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'active' ? 'text-orange-600 scale-110' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl ${activeTab === 'active' ? 'bg-orange-100' : ''}`}>
            <Truck className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black">طلباتي</span>
        </button>

        <Link href="/customer/create-order" className="flex flex-col items-center gap-1 text-slate-400">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 -translate-y-4 border-4 border-[#F1F3F6]">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black -translate-y-3">اطلب الآن</span>
        </Link>

        <button 
          onClick={() => {
            setActiveTab("restaurants");
            setIsExternalCartOpen(true);
          }}
          className={`flex flex-col items-center gap-1 transition-all relative ${isExternalCartOpen ? 'text-orange-600 scale-110' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-2xl ${isExternalCartOpen ? 'bg-orange-100' : ''}`}>
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-orange-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black">السلة</span>
        </button>

        <Link href="/customer/profile" className="flex flex-col items-center gap-1 text-slate-400">
          <div className="p-2 rounded-2xl">
            <User className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black">حسابي</span>
        </Link>
      </nav>
    </div>
  );
}
