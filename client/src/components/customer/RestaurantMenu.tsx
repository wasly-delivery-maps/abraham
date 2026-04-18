import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
}

// مطعم "رول وي" - البيانات
const ROLL_WE_RESTAURANT: Restaurant = {
  id: 1,
  name: "رول وي - مطعم وكافيه",
  phone: "01032809502",
  whatsappPhone: "201032809502",
  address: "العبور الجديدة، مصر",
  description: "أشهى أنواع الكريب والرول والمكرونة والحواوشي في العبور الجديدة",
  logoUrl: "https://web-production-0eb1b.up.railway.app/uploads/roll_we_logo.png", // سيتم رفع الصورة لهذا المسار
};

const ROLL_WE_MENU: MenuItem[] = [
  // كريب
  { id: 1, name: "كريب موزاريلا", category: "كريب", price: 45 },
  { id: 2, name: "كريب سجق", category: "كريب", price: 55 },
  { id: 3, name: "كريب دجاج", category: "كريب", price: 50 },
  { id: 4, name: "كريب جبن", category: "كريب", price: 40 },
  { id: 5, name: "كريب شوكولاتة", category: "كريب", price: 35 },
  { id: 6, name: "كريب فراولة", category: "كريب", price: 35 },
  { id: 7, name: "كريب عسل", category: "كريب", price: 30 },
  { id: 8, name: "كريب نوتيلا", category: "كريب", price: 40 },
  // رول
  { id: 9, name: "رول موزاريلا", category: "رول", price: 50 },
  { id: 10, name: "رول دجاج", category: "رول", price: 55 },
  { id: 11, name: "رول سجق", category: "رول", price: 60 },
  { id: 12, name: "رول جبن", category: "رول", price: 45 },
  { id: 13, name: "رول خضار", category: "رول", price: 40 },
  { id: 14, name: "رول مختلط", category: "رول", price: 65 },
  // مكرونة
  { id: 15, name: "مكرونة كريمة", category: "مكرونة", price: 45 },
  { id: 16, name: "مكرونة طماطم", category: "مكرونة", price: 40 },
  { id: 17, name: "مكرونة بشاميل", category: "مكرونة", price: 50 },
  { id: 18, name: "مكرونة جبن", category: "مكرونة", price: 45 },
  { id: 19, name: "مكرونة دجاج", category: "مكرونة", price: 55 },
  // حواوشي
  { id: 20, name: "حواوشي دجاج", category: "حواوشي", price: 35 },
  { id: 21, name: "حواوشي لحم", category: "حواوشي", price: 40 },
  { id: 22, name: "حواوشي مختلط", category: "حواوشي", price: 45 },
  { id: 23, name: "حواوشي جبن", category: "حواوشي", price: 30 },
  // مشروبات
  { id: 24, name: "عصير برتقال", category: "مشروبات", price: 15 },
  { id: 25, name: "عصير ليمون", category: "مشروبات", price: 15 },
  { id: 26, name: "مشروب غازي", category: "مشروبات", price: 10 },
  { id: 27, name: "قهوة", category: "مشروبات", price: 20 },
  { id: 28, name: "شاي", category: "مشروبات", price: 10 },
  // تسلية
  { id: 29, name: "بطاطس مقلية", category: "تسلية", price: 20 },
  { id: 30, name: "دجاج مقلي", category: "تسلية", price: 35 },
  { id: 31, name: "سلطة", category: "تسلية", price: 25 },
  { id: 32, name: "خبز", category: "تسلية", price: 5 },
];

export function RestaurantMenu() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("كريب");
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

  // Get user's current location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const categories = Array.from(new Set(ROLL_WE_MENU.map((item) => item.category)));
  const filteredMenu = ROLL_WE_MENU.filter((item) => item.category === selectedCategory);

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
    if (cart.length === 0) {
      toast.error("السلة فارغة!");
      return;
    }

    // إذا لم يتوفر الموقع، نستخدم موقعاً افتراضياً (العبور الجديدة) لضمان استمرار الطلب
    const finalLocation = userLocation || {
      latitude: 30.1856,
      longitude: 31.2567,
      address: "موقع العميل (العبور الجديدة)",
    };

    setIsLoading(true);
    try {
      // بناء رسالة الطلب للواتساب
      const orderItems = cart
        .map((item) => `${item.name} × ${item.quantity} = ${item.price * item.quantity} ج.م`)
        .join("\n");

      const message = `طلب جديد من تطبيق وصلي 📱\n\n${orderItems}\n\nالإجمالي: ${totalPrice} ج.م\n\nالعنوان: ${addressDescription || "موقع GPS"}\n\nملاحظات: ${customerNotes || "بدون ملاحظات"}`;

      const encodedMessage = encodeURIComponent(message);
      // استخدام رابط whatsapp:// المباشر لإجبار الهاتف على فتح التطبيق فوراً
      const directWhatsappUrl = `whatsapp://send?phone=${ROLL_WE_RESTAURANT.whatsappPhone}&text=${encodedMessage}`;
      const webWhatsappUrl = `https://api.whatsapp.com/send?phone=${ROLL_WE_RESTAURANT.whatsappPhone}&text=${encodedMessage}`;

      // محاولة فتح التطبيق مباشرة، وإذا فشل نستخدم رابط الويب
      try {
        window.location.href = directWhatsappUrl;
        // ننتظر قليلاً، إذا لم يتغير الرابط (فشل الفتح المباشر)، نفتح رابط الويب في نافذة جديدة
        setTimeout(() => {
          if (document.hasFocus()) {
            window.open(webWhatsappUrl, "_blank");
          }
        }, 500);
      } catch (e) {
        window.open(webWhatsappUrl, "_blank");
      }

      // إنشاء طلب توصيل تلقائي
      const cartItems = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      await createRestaurantOrderMutation.mutateAsync({
        restaurantId: ROLL_WE_RESTAURANT.id,
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
      
      // تنظيف السلة
      setCart([]);
      setCustomerNotes("");
    } catch (error: any) {
      toast.error(error.message || "فشل في إنشاء الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-96" dir="rtl">
      {/* رأس المطعم المطور بصورة غلاف جذابة */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl mb-6 group">
        {/* صورة الغلاف */}
        <div className="h-48 w-full relative">
          <img 
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop" 
            alt="Restaurant Cover" 
            className="w-full h-full object-cover brightness-100 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        {/* محتوى الرأس */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-orange-400 z-20 transform -translate-y-2">
             <img 
              src="https://ui-avatars.com/api/?name=RW&background=f97316&color=fff&size=128&bold=true" 
              alt="Roll We Logo" 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="flex-1 pb-2 text-white z-20">
            <h1 className="text-2xl font-black drop-shadow-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{ROLL_WE_RESTAURANT.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-medium opacity-90">
              <span className="flex items-center gap-1 bg-orange-500/80 px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" /> {ROLL_WE_RESTAURANT.address}
              </span>
              <span className="flex items-center gap-1 bg-green-500/80 px-2 py-0.5 rounded-full">
                <Phone className="h-3 w-3" /> {ROLL_WE_RESTAURANT.phone}
              </span>
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30">
            <MessageCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* وصف المطعم بتصميم أنيق */}
      <div className="px-2 mb-4">
        <p className="text-sm text-gray-600 font-medium leading-relaxed border-r-4 border-orange-500 pr-3">
          {ROLL_WE_RESTAURANT.description}
        </p>
      </div>

      {/* تصنيفات المنيو */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-semibold ${
              selectedCategory === category
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* قائمة الطعام بتصميم مطور */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenu.map((item) => (
          <Card key={item.id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group rounded-2xl bg-white">
            <CardContent className="p-0">
              <div className="flex p-4 gap-4 items-center">
                <div className="h-16 w-16 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                   {selectedCategory === "كريب" && <span className="text-2xl">🌯</span>}
                   {selectedCategory === "رول" && <span className="text-2xl">🥙</span>}
                   {selectedCategory === "مكرونة" && <span className="text-2xl">🍝</span>}
                   {selectedCategory === "حواوشي" && <span className="text-2xl">🥪</span>}
                   {selectedCategory === "مشروبات" && <span className="text-2xl">🥤</span>}
                   {selectedCategory === "تسلية" && <span className="text-2xl">🍿</span>}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-black text-orange-600">{item.price} <small className="text-[10px] text-gray-400 font-normal">ج.م</small></span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 rounded-full p-0 border-orange-200 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                      onClick={() => addToCart(item)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* سلة المشتريات */}
      {cart.length > 0 && (
        <Card className="fixed bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl border-0 max-w-full">
          <CardHeader className="bg-orange-500 text-white rounded-t-2xl">
            <CardTitle className="flex items-center justify-between">
              <span>سلة المشتريات ({cart.length})</span>
              <ShoppingCart className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[300px] overflow-y-auto bg-white">
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.price} ج.م × {item.quantity} = {item.price * item.quantity} ج.م
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-300 rounded"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-300 rounded"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-red-200 rounded ml-2"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">الإجمالي:</span>
                <span className="text-2xl font-bold text-orange-600">{totalPrice} ج.م</span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-orange-500" />
                    عنوان التوصيل بدقة:
                  </label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={requestLocation}
                    className="h-7 text-[10px] text-blue-600 hover:text-blue-700 p-0"
                  >
                    {locationStatus === "loading" ? "جاري التحديد..." : "تحديث موقعي 🔄"}
                  </Button>
                </div>
                <input
                  type="text"
                  placeholder="مثال: شقة 5، الدور الثالث، بجوار مسجد..."
                  value={addressDescription}
                  onChange={(e) => setAddressDescription(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                />
                {locationStatus === "error" && (
                  <p className="text-[10px] text-red-500 font-medium">
                    ⚠️ لم نتمكن من جلب موقعك بدقة. يرجى كتابة العنوان بالتفصيل أعلاه.
                  </p>
                )}
              </div>

              <textarea
                placeholder="أضف ملاحظات إضافية (اختياري)..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full p-2 border rounded-md text-sm mb-3 resize-none"
                rows={1}
              />

              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    إرسال الطلب عبر واتساب
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
