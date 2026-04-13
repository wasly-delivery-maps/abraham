import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, ArrowRight, Loader2, ChevronLeft, Navigation, Info, DollarSign, Truck, CheckCircle2, X, Zap, Route } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import MapPicker from "@/components/MapPicker";
import { motion, AnimatePresence } from "framer-motion";

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

export default function CreateOrder() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'pickup' | 'delivery' | 'confirm'>('pickup');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      const distance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude
      );
      setCalculatedDistance(distance);
      // Simple pricing logic: 25 EGP base + 5 EGP per km after 3km
      const price = distance <= 3 ? 25 : 25 + Math.ceil(distance - 3) * 5;
      setEstimatedPrice(price);
    }
  }, [pickupLocation, deliveryLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  if (!user || user.role !== "customer") {
    navigate("/");
    return null;
  }

  const handleCreateOrder = async () => {
    if (!pickupLocation || !deliveryLocation || !estimatedPrice) {
      toast.error("يرجى إكمال بيانات الطلب أولاً");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrderMutation.mutateAsync({
        pickupLocation: {
          address: pickupLocation.address,
          neighborhood: "الموقع المحدد",
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        },
        deliveryLocation: {
          address: deliveryLocation.address,
          neighborhood: "الموقع المحدد",
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude,
        },
        price: estimatedPrice,
        notes: notes || undefined,
      });
      toast.success("🚀 تم إرسال طلبك بنجاح! جاري البحث عن سائق...");
      navigate("/customer/dashboard");
    } catch (error) {
      toast.error("فشل في إنشاء الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col relative overflow-hidden font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-slate-100 h-10 w-10 hover:bg-orange-100 transition-all"
              onClick={() => {
                if (step === 'delivery') setStep('pickup');
                else if (step === 'confirm') setStep('delivery');
                else navigate("/customer/dashboard");
              }}
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
            <span className="text-xl font-black bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">طلب جديد</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                  (num === 1 && step === 'pickup') || (num === 2 && step === 'delivery') || (num === 3 && step === 'confirm')
                    ? 'bg-orange-500 text-white shadow-lg'
                    : (num === 1 && (step === 'delivery' || step === 'confirm')) || (num === 2 && step === 'confirm')
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {((num === 1 && (step === 'delivery' || step === 'confirm')) || (num === 2 && step === 'confirm')) ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {step === 'pickup' && (
            <motion.div key="pickup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">أين نستلم الطرد؟ 📍</h2>
                <p className="text-slate-500 font-medium">حدد موقع الاستلام بدقة على الخريطة</p>
              </div>
              <MapPicker onLocationSelect={setPickupLocation} initialLocation={pickupLocation || undefined} placeholder="ابحث عن موقع الاستلام..." />
              <Button
                disabled={!pickupLocation}
                onClick={() => setStep('delivery')}
                className="w-full py-8 text-xl font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg transition-all"
              >
                تأكيد موقع الاستلام
                <ArrowRight className="mr-2 h-6 w-6" />
              </Button>
            </motion.div>
          )}

          {step === 'delivery' && (
            <motion.div key="delivery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">أين وجهة التسليم؟ 🏁</h2>
                <p className="text-slate-500 font-medium">حدد المكان الذي تريد إرسال الطرد إليه</p>
              </div>
              <MapPicker onLocationSelect={setDeliveryLocation} initialLocation={deliveryLocation || undefined} placeholder="ابحث عن وجهة التسليم..." />
              <Button
                disabled={!deliveryLocation}
                onClick={() => setStep('confirm')}
                className="w-full py-8 text-xl font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg transition-all"
              >
                تأكيد وجهة التسليم
                <ArrowRight className="mr-2 h-6 w-6" />
              </Button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-black text-slate-900">تأكيد الطلب 📝</h2>
                <p className="text-slate-500 font-medium">راجع بيانات طلبك قبل الإرسال</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-orange-600">
                      <div className="p-2 bg-orange-50 rounded-xl"><MapPin className="h-5 w-5" /></div>
                      <span className="font-black">موقع الاستلام</span>
                    </div>
                    <p className="text-slate-600 font-bold leading-relaxed">{pickupLocation?.address}</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-blue-600">
                      <div className="p-2 bg-blue-50 rounded-xl"><Navigation className="h-5 w-5" /></div>
                      <span className="font-black">وجهة التسليم</span>
                    </div>
                    <p className="text-slate-600 font-bold leading-relaxed">{deliveryLocation?.address}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-lg bg-slate-900 text-white rounded-3xl overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-2xl"><DollarSign className="h-8 w-8 text-orange-500" /></div>
                    <div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">التكلفة التقديرية</p>
                      <p className="text-4xl font-black text-white">ج.م {estimatedPrice}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">المسافة التقريبية</p>
                    <p className="text-2xl font-black text-orange-500">{calculatedDistance?.toFixed(1)} كم</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Label className="text-lg font-black text-slate-700 mr-2">ملاحظات إضافية (اختياري)</Label>
                <Textarea
                  placeholder="مثال: رقم الشقة، علامة مميزة، أو أي تعليمات للسائق..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] rounded-2xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-bold p-4 text-lg"
                />
              </div>

              <Button
                disabled={isSubmitting}
                onClick={handleCreateOrder}
                className="w-full py-10 text-2xl font-black bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[2rem] shadow-2xl shadow-orange-200 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : "إرسال الطلب الآن 🚀"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
