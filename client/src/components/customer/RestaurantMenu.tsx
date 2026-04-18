import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2, ChevronRight, Star, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

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
}

// مطعم "رول وي" - البيانات
const ROLL_WE_RESTAURANT: Restaurant = {
  id: 1,
  name: "رول وي - مطعم وكافيه",
  phone: "01032809502",
  whatsappPhone: "201032809502",
  address: "العبور الجديدة، مصر",
  description: "أشهى أنواع الكريب والرول والمكرونة والحواوشي في العبور الجديدة",
  logoUrl: "https://ui-avatars.com/api/?name=RW&background=f97316&color=fff&size=128&bold=true",
  coverUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
  rating: "4.8",
  deliveryTime: "30-45 دقيقة"
};

// مطعم "كشري الخديوي" - البيانات
const KHEDIVE_KOSHARY_RESTAURANT: Restaurant = {
  id: 2,
  name: "كشري الخديوي",
  phone: "01032809502", // نفس رقم رول وي بناءً على طلب المستخدم
  whatsappPhone: "201032809502",
  address: "7F49+V89 كشري الخديوي، العبور، القليوبية",
  description: "أصل الكشري المصري والطواجن البيتي في قلب العبور",
  logoUrl: "https://ui-avatars.com/api/?name=KK&background=e11d48&color=fff&size=128&bold=true",
  coverUrl: "https://images.unsplash.com/photo-1567103472667-6898f3a79cf2?q=80&w=2000&auto=format&fit=crop",
  rating: "4.9",
  deliveryTime: "20-35 دقيقة"
};

const ROLL_WE_MENU: MenuItem[] = [
  { id: 1, name: "كريب موزاريلا", category: "كريب", price: 45 },
  { id: 2, name: "كريب سجق", category: "كريب", price: 55 },
  { id: 3, name: "كريب دجاج", category: "كريب", price: 50 },
  { id: 4, name: "كريب جبن", category: "كريب", price: 40 },
  { id: 5, name: "كريب شوكولاتة", category: "كريب", price: 35 },
  { id: 6, name: "كريب فراولة", category: "كريب", price: 35 },
  { id: 7, name: "كريب عسل", category: "كريب", price: 30 },
  { id: 8, name: "كريب نوتيلا", category: "كريب", price: 40 },
  { id: 9, name: "رول موزاريلا", category: "رول", price: 50 },
  { id: 10, name: "رول دجاج", category: "رول", price: 55 },
  { id: 11, name: "رول سجق", category: "رول", price: 60 },
  { id: 12, name: "رول جبن", category: "رول", price: 45 },
  { id: 13, name: "رول خضار", category: "رول", price: 40 },
  { id: 14, name: "رول مختلط", category: "رول", price: 65 },
  { id: 15, name: "مكرونة كريمة", category: "مكرونة", price: 45 },
  { id: 16, name: "مكرونة طماطم", category: "مكرونة", price: 40 },
  { id: 17, name: "مكرونة بشاميل", category: "مكرونة", price: 50 },
  { id: 18, name: "مكرونة جبن", category: "مكرونة", price: 45 },
  { id: 19, name: "مكرونة دجاج", category: "مكرونة", price: 55 },
  { id: 20, name: "حواوشي دجاج", category: "حواوشي", price: 35 },
  { id: 21, name: "حواوشي لحم", category: "حواوشي", price: 40 },
  { id: 22, name: "حواوشي مختلط", category: "حواوشي", price: 45 },
  { id: 23, name: "حواوشي جبن", category: "حواوشي", price: 30 },
  { id: 24, name: "عصير برتقال", category: "مشروبات", price: 15 },
  { id: 25, name: "عصير ليمون", category: "مشروبات", price: 15 },
  { id: 26, name: "مشروب غازي", category: "مشروبات", price: 10 },
  { id: 27, name: "قهوة", category: "مشروبات", price: 20 },
  { id: 28, name: "شاي", category: "مشروبات", price: 10 },
  { id: 29, name: "بطاطس مقلية", category: "تسلية", price: 20 },
  { id: 30, name: "دجاج مقلي", category: "تسلية", price: 35 },
  { id: 31, name: "سلطة", category: "تسلية", price: 25 },
  { id: 32, name: "خبز", category: "تسلية", price: 5 },
];

const KHEDIVE_KOSHARY_MENU: MenuItem[] = [
  // العلب
  { id: 101, name: "علبة كمالة", category: "العلب", price: 15 },
  { id: 102, name: "علبة صغيرة", category: "العلب", price: 17 },
  { id: 103, name: "علبة الخديوي", category: "العلب", price: 25 },
  { id: 104, name: "لوكس الخديوي", category: "العلب", price: 30 },
  { id: 105, name: "سوبر الخديوي", category: "العلب", price: 35 },
  { id: 106, name: "أسبيشيال الخديوي", category: "العلب", price: 40 },
  { id: 107, name: "وليمة الخديوي", category: "العلب", price: 45 },
  { id: 108, name: "جامبو الخديوي", category: "العلب", price: 50 },
  // الطواجن
  { id: 109, name: "طاجن عادة", category: "الطواجن", price: 30 },
  { id: 110, name: "طاجن لحمة", category: "الطواجن", price: 45 },
  { id: 111, name: "طاجن سجق", category: "الطواجن", price: 45 },
  { id: 112, name: "طاجن كبدة", category: "الطواجن", price: 45 },
  { id: 113, name: "طاجن فراخ", category: "الطواجن", price: 50 },
  { id: 114, name: "طاجن خضار", category: "الطواجن", price: 50 },
  // طواجن وايت صوص
  { id: 115, name: "طاجن وايت صوص", category: "طواجن وايت صوص", price: 80 },
  { id: 116, name: "طاجن لحمة وايت صوص", category: "طواجن وايت صوص", price: 80 },
  { id: 117, name: "طاجن سجق وايت صوص", category: "طواجن وايت صوص", price: 80 },
  { id: 118, name: "طاجن فراخ وايت صوص", category: "طواجن وايت صوص", price: 90 },
  { id: 119, name: "طاجن جمبري", category: "طواجن وايت صوص", price: 120 },
  { id: 120, name: "طاجن مشروم", category: "طواجن وايت صوص", price: 80 },
  // طواجن موتزاريللا
  { id: 121, name: "موتزاريللا سادة", category: "طواجن موتزاريللا", price: 53 },
  { id: 122, name: "موتزاريللا لحمة", category: "طواجن موتزاريللا", price: 68 },
  { id: 123, name: "موتزاريللا كبدة", category: "طواجن موتزاريللا", price: 68 },
  { id: 124, name: "موتزاريللا سجق", category: "طواجن موتزاريللا", price: 68 },
  { id: 125, name: "موتزاريللا فراخ", category: "طواجن موتزاريللا", price: 75 },
  { id: 126, name: "موتزاريللا خضار", category: "طواجن موتزاريللا", price: 75 },
  // الميكسات
  { id: 127, name: "ميكس عادة", category: "الميكسات", price: 48 },
  { id: 128, name: "ميكس لحمة", category: "الميكسات", price: 60 },
  { id: 129, name: "ميكس سجق", category: "الميكسات", price: 60 },
  { id: 130, name: "ميكس كبدة", category: "الميكسات", price: 60 },
  { id: 131, name: "ميكس فراخ", category: "الميكسات", price: 66 },
  // الحواوشي
  { id: 132, name: "حواوشي سادة", category: "الحواوشي", price: 35 },
  { id: 133, name: "حواوشي سجق", category: "الحواوشي", price: 60 },
  { id: 134, name: "حواوشي بسطرمة", category: "الحواوشي", price: 60 },
  { id: 135, name: "حواوشي هالبينو", category: "الحواوشي", price: 40 },
  { id: 136, name: "حواوشي ميكس تركي", category: "الحواوشي", price: 60 },
  // الحلويات
  { id: 137, name: "أرز باللبن سادة", category: "الحلويات", price: 20 },
  { id: 138, name: "أرز باللبن فرن", category: "الحلويات", price: 22 },
  { id: 139, name: "أرز باللبن مكسرات", category: "الحلويات", price: 26 },
  { id: 140, name: "أرز باللبن كنافة", category: "الحلويات", price: 26 },
  { id: 141, name: "أرز باللبن لوتس", category: "الحلويات", price: 37 },
  { id: 142, name: "أرز باللبن مانجو", category: "الحلويات", price: 32 },
  { id: 143, name: "قنبلة بسبوسة", category: "الحلويات", price: 27 },
  { id: 144, name: "قنبلة فراولة", category: "الحلويات", price: 27 },
  { id: 145, name: "شوكليت كيك", category: "الحلويات", price: 27 },
  { id: 146, name: "ديسباسيتو", category: "الحلويات", price: 32 },
  { id: 147, name: "أم علي", category: "الحلويات", price: 37 },
  // الإضافات
  { id: 148, name: "دقة", category: "الإضافات", price: 9 },
  { id: 149, name: "شطة", category: "الإضافات", price: 10 },
  { id: 150, name: "عدس", category: "الإضافات", price: 10 },
  { id: 151, name: "حمص", category: "الإضافات", price: 10 },
  { id: 152, name: "تقلية", category: "الإضافات", price: 12 },
  { id: 153, name: "صلصة", category: "الإضافات", price: 12 },
  { id: 154, name: "سلطة", category: "الإضافات", price: 9 },
  { id: 155, name: "عيش لبناني", category: "الإضافات", price: 10 },
  { id: 156, name: "موتزاريللا", category: "الإضافات", price: 25 },
];

const RESTAURANTS = [ROLL_WE_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT];
const MENUS: Record<number, MenuItem[]> = {
  1: ROLL_WE_MENU,
  2: KHEDIVE_KOSHARY_MENU
};

export function RestaurantMenu() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [addressDescription, setAddressDescription] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  const createRestaurantOrderMutation = trpc.orders.createRestaurantOrder.useMutation();

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("متصفحك لا يدعم تحديد الموقع الجغرافي");
      setLocationStatus("error");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "موقعي الحالي المكتشف",
        });
        setLocationStatus("success");
        toast.success("تم تحديد موقعك بنجاح! 📍");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus("error");
        let errorMsg = "فشل تحديد الموقع. يرجى تفعيل GPS وإعطاء صلاحية الموقع للمتصفح.";
        if (error.code === 1) errorMsg = "يرجى السماح للمتصفح بالوصول لموقعك من إعدادات الهاتف/المتصفح.";
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      const menu = MENUS[selectedRestaurant.id];
      if (menu && menu.length > 0) {
        setSelectedCategory(menu[0].category);
      }
    }
  }, [selectedRestaurant]);

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((c) => c.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`تمت إضافة ${item.name} للسلة`);
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(
        cart.map((c) =>
          c.id === itemId ? { ...c, quantity } : c
        )
      );
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!selectedRestaurant) return;
    if (cart.length === 0) {
      toast.error("السلة فارغة!");
      return;
    }

    const finalLocation = userLocation || {
      latitude: 30.1856,
      longitude: 31.2567,
      address: "موقع العميل (العبور الجديدة)",
    };

    setIsLoading(true);
    try {
      const orderItems = cart
        .map((item) => `${item.name} × ${item.quantity} = ${item.price * item.quantity} ج.م`)
        .join("\n");

      const message = `طلب جديد من تطبيق وصلي 📱\n\nالمطعم: ${selectedRestaurant.name}\n\n${orderItems}\n\nالإجمالي: ${totalPrice} ج.م\n\nالعنوان: ${addressDescription || "موقع GPS"}\n\nملاحظات: ${customerNotes || "بدون ملاحظات"}`;

      const encodedMessage = encodeURIComponent(message);
      const directWhatsappUrl = `whatsapp://send?phone=${selectedRestaurant.whatsappPhone}&text=${encodedMessage}`;
      const webWhatsappUrl = `https://api.whatsapp.com/send?phone=${selectedRestaurant.whatsappPhone}&text=${encodedMessage}`;

      try {
        window.location.href = directWhatsappUrl;
        setTimeout(() => {
          if (document.hasFocus()) {
            window.open(webWhatsappUrl, "_blank");
          }
        }, 500);
      } catch (e) {
        window.open(webWhatsappUrl, "_blank");
      }

      const cartItems = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      await createRestaurantOrderMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        items: cartItems,
        totalPrice,
        notes: customerNotes,
        deliveryLocation: {
          address: finalLocation.address,
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude,
          neighborhood: "موقع العميل",
        },
      });

      toast.success("تم إرسال الطلب للمطعم وتم إنشاء طلب توصيل تلقائي!");
      setCart([]);
      setCustomerNotes("");
    } catch (error: any) {
      toast.error(error.message || "فشل في إنشاء الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedRestaurant) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black text-slate-900">اختر مطعمك المفضل 🍔</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {RESTAURANTS.map((res) => (
            <motion.div
              key={res.id}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRestaurant(res)}
            >
              <Card className="overflow-hidden cursor-pointer border-none shadow-md hover:shadow-xl transition-all rounded-2xl">
                <div className="relative h-32 w-full">
                  <img src={res.coverUrl} alt={res.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-white p-1 shadow-lg">
                      <img src={res.logoUrl} alt={res.name} className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <div className="text-white">
                      <h3 className="font-black text-lg drop-shadow-md">{res.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] opacity-90">
                        <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {res.rating}</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {res.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  const currentMenu = MENUS[selectedRestaurant.id] || [];
  const categories = Array.from(new Set(currentMenu.map((item) => item.category)));
  const filteredMenu = currentMenu.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6 pb-96" dir="rtl">
      <Button 
        variant="ghost" 
        onClick={() => setSelectedRestaurant(null)}
        className="mb-2 font-bold text-slate-600 hover:text-orange-600 transition-colors"
      >
        <ChevronRight className="h-5 w-5 ml-1" /> العودة للمطاعم
      </Button>

      <div className="relative rounded-2xl overflow-hidden shadow-xl mb-6 group">
        <div className="h-48 w-full relative">
          <img 
            src={selectedRestaurant.coverUrl} 
            alt="Restaurant Cover" 
            className="w-full h-full object-cover brightness-100 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-orange-400 z-20 transform -translate-y-2">
             <img 
              src={selectedRestaurant.logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="flex-1 pb-2 text-white z-20">
            <h1 className="text-2xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{selectedRestaurant.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-medium opacity-90">
              <span className="flex items-center gap-1 bg-orange-500/80 px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" /> {selectedRestaurant.address}
              </span>
              <span className="flex items-center gap-1 bg-green-500/80 px-2 py-0.5 rounded-full">
                <Phone className="h-3 w-3" /> {selectedRestaurant.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 mb-4">
        <p className="text-sm text-gray-600 font-medium leading-relaxed border-r-4 border-orange-500 pr-3">
          {selectedRestaurant.description}
        </p>
      </div>

      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md py-3 -mx-4 px-4 border-b border-orange-100 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-6 font-bold transition-all ${
                selectedCategory === category 
                ? "bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200" 
                : "border-orange-100 text-orange-600 hover:bg-orange-50"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-white group">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-800 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                    <p className="text-orange-600 font-black text-lg">ج.م {item.price}</p>
                  </div>
                  <Button
                    size="icon"
                    onClick={() => addToCart(item)}
                    className="rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-none"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-slate-900 text-white rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 max-h-60 overflow-y-auto border-b border-slate-800">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-orange-400 text-xs font-black">ج.م {item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg hover:bg-slate-700 text-white"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg hover:bg-slate-700 text-white"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="العنوان بالتفصيل (رقم العمارة، الشقة، الدور)..."
                    value={addressDescription}
                    onChange={(e) => setAddressDescription(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <textarea
                    placeholder="ملاحظات إضافية للسائق أو المطعم..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 transition-all h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">الإجمالي</p>
                    <p className="text-2xl font-black text-orange-500">ج.م {totalPrice}</p>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-7 rounded-2xl shadow-lg shadow-orange-900/20 transition-all"
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
          </Card>
        </div>
      )}
    </div>
  );
}
