import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2, ChevronRight, Star, Clock, Coins, Gift, Truck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Restaurant {
  id: number;
  name: string;
  phone: string;
  whatsappPhone: string;
  address: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  rating?: string;
  deliveryTime?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

// مطعم "كشري الخديوي" - البيانات
const KHEDIVE_KOSHARY_RESTAURANT: Restaurant = {
  id: 2,
  name: "كشري الخديوي",
  phone: "01032809502",
  whatsappPhone: "201032809502",
  address: "7F49+V89 كشري الخديوي، العبور، القليوبية",
  description: "أصل الكشري المصري والطواجن البيتي في قلب العبور",
  logoUrl: "https://ui-avatars.com/api/?name=KK&background=e11d48&color=fff&size=128&bold=true",
  coverUrl: "https://web-production-0eb1b.up.railway.app/uploads/khedive_koshary_logo_fb.webp",
  rating: "4.9",
  deliveryTime: "20-35 دقيقة",
  location: {
    latitude: 30.2570159,
    longitude: 31.4682469
  }
};

const KHEDIVE_KOSHARY_MENU: MenuItem[] = [
  // العلب
  { id: 101, name: "علبة كمالة 🥣", category: "العلب", price: 15 },
  { id: 102, name: "علبة صغيرة 🥣", category: "العلب", price: 17 },
  { id: 103, name: "علبة الخديوي 👑", category: "العلب", price: 25 },
  { id: 104, name: "لوكس الخديوي ✨", category: "العلب", price: 30 },
  { id: 105, name: "سوبر الخديوي 🔥", category: "العلب", price: 35 },
  { id: 106, name: "أسبيشيال الخديوي 🌟", category: "العلب", price: 40 },
  { id: 107, name: "وليمة الخديوي 🥘", category: "العلب", price: 45 },
  { id: 108, name: "جامبو الخديوي 🐘", category: "العلب", price: 50 },
  // الطواجن
  { id: 109, name: "طاجن عادة 🥘", category: "الطواجن", price: 30 },
  { id: 110, name: "طاجن لحمة 🥩", category: "الطواجن", price: 45 },
  { id: 111, name: "طاجن سجق 🌭", category: "الطواجن", price: 45 },
  { id: 112, name: "طاجن كبدة 🥘", category: "الطواجن", price: 45 },
  { id: 113, name: "طاجن فراخ 🍗", category: "الطواجن", price: 50 },
  { id: 114, name: "طاجن خضار 🥦", category: "الطواجن", price: 50 },
  // طواجن وايت صوص
  { id: 115, name: "طاجن وايت صوص 🥛", category: "طواجن وايت صوص", price: 80 },
  { id: 116, name: "طاجن لحمة وايت صوص 🥩", category: "طواجن وايت صوص", price: 80 },
  { id: 117, name: "طاجن سجق وايت صوص 🌭", category: "طواجن وايت صوص", price: 80 },
  { id: 118, name: "طاجن فراخ وايت صوص 🍗", category: "طواجن وايت صوص", price: 90 },
  { id: 119, name: "طاجن جمبري 🍤", category: "طواجن وايت صوص", price: 120 },
  { id: 120, name: "طاجن مشروم 🍄", category: "طواجن وايت صوص", price: 80 },
  // طواجن موتزاريللا
  { id: 121, name: "موتزاريللا سادة 🧀", category: "طواجن موتزاريللا", price: 53 },
  { id: 122, name: "موتزاريللا لحمة 🥩", category: "طواجن موتزاريللا", price: 68 },
  { id: 123, name: "موتزاريللا كبدة 🥘", category: "طواجن موتزاريللا", price: 68 },
  { id: 124, name: "موتزاريللا سجق 🌭", category: "طواجن موتزاريللا", price: 68 },
  { id: 125, name: "موتزاريللا فراخ 🍗", category: "طواجن موتزاريللا", price: 75 },
  { id: 126, name: "موتزاريللا خضار 🥦", category: "طواجن موتزاريللا", price: 75 },
  // الميكسات
  { id: 127, name: "ميكس عادة 🥘", category: "الميكسات", price: 48 },
  { id: 128, name: "ميكس لحمة 🥩", category: "الميكسات", price: 60 },
  { id: 129, name: "ميكس سجق 🌭", category: "الميكسات", price: 60 },
  { id: 130, name: "ميكس كبدة 🥘", category: "الميكسات", price: 60 },
  { id: 131, name: "ميكس فراخ 🍗", category: "الميكسات", price: 66 },
  // الحواوشي
  { id: 132, name: "حواوشي سادة 🥙", category: "الحواوشي", price: 35 },
  { id: 133, name: "حواوشي سجق 🌭", category: "الحواوشي", price: 60 },
  { id: 134, name: "حواوشي بسطرمة 🥩", category: "الحواوشي", price: 60 },
  { id: 135, name: "حواوشي هالبينو 🌶️", category: "الحواوشي", price: 40 },
  { id: 136, name: "حواوشي ميكس تركي 🥙", category: "الحواوشي", price: 60 },
  // الحلويات
  { id: 137, name: "أرز باللبن سادة 🍚", category: "الحلويات", price: 20 },
  { id: 138, name: "أرز باللبن فرن 🍮", category: "الحلويات", price: 25 },
  { id: 139, name: "أرز باللبن مكسرات 🥜", category: "الحلويات", price: 30 },
  { id: 140, name: "أرز باللبن قشطة 🥛", category: "الحلويات", price: 35 },
  { id: 141, name: "أرز باللبن لوتس 🍪", category: "الحلويات", price: 45 },
  { id: 142, name: "أرز باللبن نوتيلا 🍫", category: "الحلويات", price: 45 },
  // الإضافات
  { id: 143, name: "علبة صلصة 🍅", category: "الإضافات", price: 7 },
  { id: 144, name: "علبة دقة 🍋", category: "الإضافات", price: 7 },
  { id: 145, name: "علبة شطة 🌶️", category: "الإضافات", price: 7 },
  { id: 146, name: "كيس تقلية 🧅", category: "الإضافات", price: 7 },
  { id: 147, name: "كيس حمص 🥣", category: "الإضافات", price: 7 },
  { id: 148, name: "كيس عيش 🍞", category: "الإضافات", price: 7 },
  // المشروبات
  { id: 149, name: "بيبسي كانز 🥤", category: "المشروبات", price: 15 },
  { id: 150, name: "مياه معدنية صغيرة 💧", category: "المشروبات", price: 7 },
];

export function RestaurantMenu() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addressDescription, setAddressDescription] = useState("");

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeDeliveryThreshold = 300;
  const hasFreeDelivery = totalPrice >= freeDeliveryThreshold;
  const hasGift = totalPrice >= 500;

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`تم إضافة ${item.name} للسلة`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const handleCheckout = async () => {
    if (!addressDescription || addressDescription.trim().length < 5) {
      toast.error("يرجى كتابة العنوان بالتفصيل أولاً (رقم العمارة، الشقة، أو علامة مميزة)");
      return;
    }

    setIsLoading(true);
    try {
      const orderItems = cart.map(item => `${item.name} (${item.quantity})`).join('\n');
      
      await createOrderMutation.mutateAsync({
        restaurantId: KHEDIVE_KOSHARY_RESTAURANT.id,
        totalPrice,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        pickupLocation: {
          latitude: KHEDIVE_KOSHARY_RESTAURANT.location.latitude,
          longitude: KHEDIVE_KOSHARY_RESTAURANT.location.longitude,
          address: KHEDIVE_KOSHARY_RESTAURANT.address,
        },
        deliveryLocation: {
          latitude: KHEDIVE_KOSHARY_RESTAURANT.location.latitude,
          longitude: KHEDIVE_KOSHARY_RESTAURANT.location.longitude,
          address: addressDescription,
        },
        notes: customerNotes
      });

      const message = `طلب جديد من تطبيق وصلي 📱\n\nالمطعم: ${KHEDIVE_KOSHARY_RESTAURANT.name}\n\n${orderItems}\n\nالإجمالي: ${totalPrice} ج.م\n\nالعنوان: ${addressDescription}\n\nملاحظات: ${customerNotes || "بدون ملاحظات"}`;
      const whatsappUrl = `https://wa.me/${KHEDIVE_KOSHARY_RESTAURANT.whatsappPhone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      toast.success("تم إرسال الطلب بنجاح!");
      setCart([]);
      setCustomerNotes("");
      setAddressDescription("");
      setIsCartExpanded(false);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    return Array.from(new Set(KHEDIVE_KOSHARY_MENU.map(item => item.category)));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        <div className="relative h-64 rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src={KHEDIVE_KOSHARY_RESTAURANT.coverUrl} 
            className="w-full h-full object-cover"
            alt={KHEDIVE_KOSHARY_RESTAURANT.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-6 right-6 left-6 flex justify-between items-end">
            <div>
              <Badge className="bg-orange-500 text-white border-none mb-2 font-black">مفتوح الآن</Badge>
              <h1 className="text-4xl font-black text-white mb-1">{KHEDIVE_KOSHARY_RESTAURANT.name}</h1>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                  <span className="text-sm font-black text-white">{KHEDIVE_KOSHARY_RESTAURANT.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-bold">{KHEDIVE_KOSHARY_RESTAURANT.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-bold">العبور، القليوبية</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 bg-orange-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900">{category}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KHEDIVE_KOSHARY_MENU.filter(item => item.category === category).map((item) => (
                <Card key={item.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="font-black text-slate-900 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                        <p className="text-lg font-black text-slate-900">ج.م {item.price}</p>
                      </div>
                      <Button 
                        size="icon"
                        className="bg-slate-100 hover:bg-orange-500 text-slate-900 hover:text-white rounded-2xl transition-all duration-300"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 pointer-events-none">
          <Card className={`max-w-2xl mx-auto border-none shadow-2xl bg-slate-900 text-white rounded-3xl overflow-hidden relative transition-all duration-300 pointer-events-auto ${isCartExpanded ? 'h-auto' : 'h-20'}`}>
            {!isCartExpanded ? (
              <div 
                className="h-full flex items-center justify-between px-6 cursor-pointer"
                onClick={() => setIsCartExpanded(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/20">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="absolute -top-2 -right-2 bg-white text-slate-900 border-none font-black h-6 w-6 flex items-center justify-center rounded-full">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">سلة المشتريات</p>
                    <p className="text-lg font-black text-white">ج.م {totalPrice}</p>
                  </div>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black px-6">
                  عرض السلة
                  <ChevronRight className="h-4 w-4 mr-1" />
                </Button>
              </div>
            ) : (
              <CardContent className="p-0 max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black">سلة المشتريات</h3>
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                      {cart.length} أصناف
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white font-bold"
                      onClick={() => setCart([])}
                    >
                      مسح الكل
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-slate-800"
                      onClick={() => setIsCartExpanded(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-black text-sm">{item.name}</p>
                          <p className="text-xs text-orange-500 font-bold">ج.م {item.price * item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg hover:bg-slate-700 text-white"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-lg hover:bg-slate-700 text-white"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-bold text-slate-400">عنوان التوصيل</span>
                    </div>
                    <input
                      type="text"
                      placeholder="رقم العمارة، الشقة، الدور، أو علامة مميزة..."
                      value={addressDescription}
                      onChange={(e) => setAddressDescription(e.target.value)}
                      className="w-full bg-slate-700 border-2 border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none shadow-lg"
                    />
                    <textarea
                      placeholder="ملاحظات إضافية للمطعم (اختياري)..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full bg-slate-700 border-2 border-orange-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all h-20 resize-none outline-none shadow-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">الإجمالي</p>
                      <p className="text-2xl font-black text-orange-500">ج.م {totalPrice}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        {hasGift && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-emerald-400 text-[10px] font-black"
                          >
                            <Gift className="h-3 w-3" />
                            <span>تم تفعيل الهدية المجانية! 🎁</span>
                          </motion.div>
                        )}
                        {hasFreeDelivery ? (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-sky-400 text-[10px] font-black"
                          >
                            <Truck className="h-3 w-3" />
                            <span>توصيل مجاني مفعل! 🚚</span>
                          </motion.div>
                        ) : (
                          <p className="text-[9px] text-slate-400 font-bold">
                            أضف {freeDeliveryThreshold - totalPrice} ج.م للحصول على توصيل مجاني 🚚
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      disabled={isLoading || !addressDescription.trim()}
                      className={`font-black px-8 py-7 rounded-2xl shadow-lg transition-all ${
                        !addressDescription.trim() 
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50" 
                        : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-900/20"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <MessageCircle className="h-5 w-5 ml-2" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
