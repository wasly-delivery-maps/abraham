import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, User, Truck, Clock, X, Phone, ChevronRight, Package, MessageCircle, BarChart3, Zap, Timer, ChevronLeft, Info, Loader2 } from "lucide-react";
import { CountdownTimer } from "@/components/customer/CountdownTimer";
import { RestaurantMenu } from "@/components/customer/RestaurantMenu";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
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
  const [activeTab, setActiveTab] = useState("active");
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
      in_transit: { label: "في الطريق", color: "text-purple-600", bgColor: "bg-purple-50", icon: Truck },
      arrived: { label: "وصل السائق", color: "text-orange-600", bgColor: "bg-orange-50", icon: MapPin },
      delivered: { label: "تم التسليم", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: Package },
      cancelled: { label: "ملغى", color: "text-rose-600", bgColor: "bg-rose-50", icon: X },
    };
    return statusMap[status] || { label: status, color: "text-slate-600", bgColor: "bg-slate-50", icon: Package };
  };

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans pb-10" dir="rtl">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-1 rounded-xl shadow-lg shadow-orange-200 overflow-hidden">
              <img src="/logo.jpg" alt="وصلي" className="h-8 w-8 object-cover" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">وصلي</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/customer/stats">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <Link href="/customer/profile">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                <User className="h-5 w-5 text-slate-600" />
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
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500 fill-orange-500" />
                عروض حصرية
              </h3>
              <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px] px-3 py-1 rounded-full">
                لفترة محدودة
              </Badge>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {activeOffers.map((offer) => (
                <motion.div key={offer.id} className="min-w-[320px] snap-center">
                  <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-white flex h-44">
                    <div className="w-2/5 relative">
                      <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-orange-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg">
                        <CountdownTimer expiresAt={offer.expiresAt} />
                      </div>
                    </div>
                    <div className="w-3/5 p-4 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-slate-900 line-clamp-1">{offer.title}</h4>
                        <p className="text-xs font-medium text-slate-500 line-clamp-3 leading-relaxed">{offer.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-orange-500 text-white hover:bg-orange-600 border-none shadow-md h-9 text-xs font-black rounded-xl"
                          onClick={() => setActiveTab("restaurants")}
                        >
                          اطلب الآن
                        </Button>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Info className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="active" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-orange-600 transition-all">
              النشطة
              {activeOrders.length > 0 && <span className="mr-1.5 bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md text-[10px]">{activeOrders.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all">السجل</TabsTrigger>
            <TabsTrigger value="restaurants" className="rounded-xl font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all">المطاعم</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => {
                const status = getStatusInfo(order.status);
                const StatusIcon = status.icon;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`${status.bgColor} p-2 rounded-xl`}>
                              <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">طلب #{order.id}</span>
                              <span className={`text-xs font-black ${status.color}`}>{status.label}</span>
                            </div>
                          </div>
                          <div className="text-lg font-black text-slate-900">ج.م {order.price}</div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="h-2 w-2 rounded-full bg-slate-200 mt-1.5" />
                            <p className="text-xs font-medium text-slate-600 line-clamp-1">{order.pickupLocation?.address}</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-3.5 w-3.5 text-orange-500 mt-0.5" />
                            <p className="text-xs font-medium text-slate-600 line-clamp-1">{order.deliveryLocation?.address}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            {order.driver && (
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                  {order.driver.name.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{order.driver.name}</span>
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
                              className="rounded-xl border-slate-100 text-slate-600 font-bold text-xs h-9 px-4"
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
              <div className="text-center py-12">
                <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold">لا توجد طلبات نشطة حالياً</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <Card key={order.id} className="border-none shadow-sm rounded-2xl bg-white opacity-80">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${status.bgColor} p-2 rounded-xl`}>
                            <Package className={`h-4 w-4 ${status.color}`} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">طلب #{order.id}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">ج.م {order.price}</div>
                          <span className={`text-[10px] font-bold ${status.color}`}>{status.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">سجل الطلبات فارغ</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="restaurants">
            <RestaurantMenu />
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none" dir="rtl">
          <div className="bg-orange-500 p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <DialogTitle className="text-xl font-black">تفاصيل الطلب #{selectedOrderId}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {orderDetailsQuery.data && (
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-none font-bold">
                  {getStatusInfo(orderDetailsQuery.data.status).label}
                </Badge>
                <span className="text-sm font-bold opacity-80">
                  {new Date(orderDetailsQuery.data.createdAt).toLocaleString('ar-EG')}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6 bg-white">
            {orderDetailsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              </div>
            ) : orderDetailsQuery.data ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">من</p>
                      <p className="text-sm font-bold text-slate-700">{orderDetailsQuery.data.pickupLocation?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-orange-500 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">إلى</p>
                      <p className="text-sm font-bold text-slate-700">{orderDetailsQuery.data.deliveryLocation?.address}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">سعر التوصيل</span>
                    <span className="text-base font-black text-slate-900">ج.م {orderDetailsQuery.data.price}</span>
                  </div>
                  {orderDetailsQuery.data.description && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ملاحظات</p>
                      <p className="text-sm font-medium text-slate-600">{orderDetailsQuery.data.description}</p>
                    </div>
                  )}
                </div>

                {orderDetailsQuery.data.driver && (
                  <div className="flex items-center justify-between p-4 border-2 border-orange-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-lg">
                        {orderDetailsQuery.data.driver.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{orderDetailsQuery.data.driver.name}</p>
                        <p className="text-xs font-bold text-slate-400">سائق التوصيل</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${orderDetailsQuery.data.driver.phone}`} className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-200">
                        <Phone className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-slate-500 font-bold">فشل تحميل التفاصيل</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
