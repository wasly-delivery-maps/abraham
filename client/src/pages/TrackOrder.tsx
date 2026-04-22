import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { OrderTracking } from "@/components/OrderTracking";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function TrackOrder() {
  const [, params] = useRoute("/customer/track/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const orderDetailsQuery = trpc.orders.getOrderDetails.useQuery(
    { orderId: orderId as number },
    { enabled: !!orderId }
  );

  if (orderDetailsQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-black">جاري تحميل خريطة التتبع...</p>
      </div>
    );
  }

  const order = orderDetailsQuery.data;

  if (!order || !orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-sm w-full">
          <div className="bg-rose-50 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-10 w-10 text-rose-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">عذراً، الطلب غير موجود</h1>
          <p className="text-slate-500 font-medium mb-8">لم نتمكن من العثور على تفاصيل هذا الطلب أو أنك لا تملك صلاحية الوصول إليه.</p>
          <Link href="/customer/dashboard">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl py-6">
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-10" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/customer/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                <ChevronRight className="h-6 w-6 text-slate-600" />
              </Button>
            </Link>
            <span className="text-lg font-black text-slate-900">تتبع الطلب #{orderId}</span>
          </div>
          <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black border border-orange-100">
            مباشر 📡
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Banner */}
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">حالة الطلب الحالية</p>
              <p className="text-lg font-black text-slate-900">
                {order.status === 'assigned' || order.status === 'accepted' ? 'المندوب في طريقه للاستلام' : 
                 order.status === 'picked_up' || order.status === 'in_transit' ? 'المندوب استلم الطلب وفي طريقه إليك' :
                 order.status === 'arrived' ? 'المندوب وصل لموقعك' : 'جاري التوصيل'}
              </p>
            </div>
          </div>

          {/* Map Component */}
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-white h-[500px] relative">
            {order.driverId ? (
              <OrderTracking
                orderId={orderId}
                driverId={order.driverId}
                driverName={order.driver?.name}
                driverPhone={order.driver?.phone}
                pickupLocation={{
                  address: order.pickupLocation?.address || "موقع الاستلام",
                  latitude: order.pickupLocation?.latitude || 0,
                  longitude: order.pickupLocation?.longitude || 0
                }}
                deliveryLocation={{
                  address: order.deliveryLocation?.address || "موقع التسليم",
                  latitude: order.deliveryLocation?.latitude || 0,
                  longitude: order.deliveryLocation?.longitude || 0
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4 bg-slate-50">
                <div className="bg-slate-200 h-20 w-20 rounded-3xl flex items-center justify-center animate-pulse">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-slate-500 font-black">جاري تعيين مندوب لتتمكن من التتبع...</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {order.driver?.phone && (
              <a href={`tel:${order.driver.phone}`} className="w-full">
                <Button className="w-full bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-100 font-black rounded-2xl py-7 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  اتصال بالمندوب
                </Button>
              </a>
            )}
            <Link href="/customer/dashboard" className="w-full">
              <Button variant="outline" className="w-full bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-100 font-black rounded-2xl py-7 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                <ChevronLeft className="h-5 w-5" />
                تفاصيل الطلب
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Re-importing missing icons for the page
import { Truck, User, Phone, ChevronLeft } from "lucide-react";
