import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2, ChevronRight, Star, Clock, Coins, Gift } from "lucide-react";
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
  { id: 138, name: "أرز باللبن فرن 🍮", category: "الحلويات", price: 22 },
  { id: 139, name: "أرز باللبن مكسرات 🥜", category: "الحلويات", price: 26 },
  { id: 140, name: "أرز باللبن كنافة 🍯", category: "الحلويات", price: 26 },
  { id: 141, name: "أرز باللبن لوتس 🍪", category: "الحلويات", price: 37 },
  { id: 142, name: "أرز باللبن مانجو 🥭", category: "الحلويات", price: 32 },
  { id: 143, name: "قنبلة بسبوسة 💣", category: "الحلويات", price: 27 },
  { id: 144, name: "قنبلة فراولة 🍓", category: "الحلويات", price: 27 },
  { id: 145, name: "شوكليت كيك 🍰", category: "الحلويات", price: 27 },
  { id: 146, name: "ديسباسيتو 🍫", category: "الحلويات", price: 32 },
  { id: 147, name: "أم علي 🥣", category: "الحلويات", price: 37 },
  // الإضافات
  { id: 148, name: "دقة 🍶", category: "الإضافات", price: 9 },
  { id: 149, name: "شطة 🌶️", category: "الإضافات", price: 10 },
  { id: 150, name: "عدس 🥣", category: "الإضافات", price: 10 },
  { id: 151, name: "حمص 🥜", category: "الإضافات", price: 10 },
  { id: 152, name: "تقلية 🧅", category: "الإضافات", price: 12 },
  { id: 153, name: "صلصة 🍅", category: "الإضافات", price: 12 },
  { id: 154, name: "سلطة 🥗", category: "الإضافات", price: 9 },
  { id: 155, name: "عيش لبناني 🍞", category: "الإضافات", price: 10 },
  { id: 156, name: "موتزاريللا 🧀", category: "الإضافات", price: 25 },
];

// مطعم "الحوت" - البيانات
const AL_HOUT_RESTAURANT: Restaurant = {
  id: 3,
  name: "الحوت - Al-Hout",
  phone: "01557564373",
  whatsappPhone: "201557564373",
  address: "العبور الجديدة - حي المجد - مول ريتاج - بجانب مدرسة بلال بن رباح الثانوية",
  description: "أشهى المأكولات البحرية والأسماك",
  logoUrl: "https://ui-avatars.com/api/?name=AH&background=0369a1&color=fff&size=128&bold=true",
  coverUrl: "/assets/al-hout-blue-whale.jpg",
  rating: "5.0",
  deliveryTime: "25-40 دقيقة",
  location: {
    latitude: 30.2767773,
    longitude: 31.5299175
  }
};

// مطعم "رول وي" - البيانات
const ROLL_WE_RESTAURANT: Restaurant = {
  id: 1,
  name: "رول وي - مطعم وكافيه",
  phone: "01032809502",
  whatsappPhone: "201032809502",
  address: "7GG2+462 ملعب حي الحرية, العبور، محافظة القليوبية 6363322",
  description: "أشهى أنواع الكريب والرول والمكرونة والحواوشي في العبور",
  logoUrl: "https://ui-avatars.com/api/?name=RW&background=f97316&color=fff&size=128&bold=true",
  coverUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
  rating: "4.8",
  deliveryTime: "30-45 دقيقة",
  location: {
    latitude: 30.275262,
    longitude: 31.5005241
  }
};

const ROLL_WE_MENU: MenuItem[] = [
  // كريب
  { id: 1, name: "كريب موزاريلا 🧀", category: "كريب", price: 45 },
  { id: 2, name: "كريب سجق 🌭", category: "كريب", price: 55 },
  { id: 3, name: "كريب دجاج 🍗", category: "كريب", price: 50 },
  { id: 4, name: "كريب جبن 🧀", category: "كريب", price: 40 },
  { id: 5, name: "كريب شوكولاتة 🍫", category: "كريب", price: 35 },
  { id: 6, name: "كريب فراولة 🍓", category: "كريب", price: 35 },
  { id: 7, name: "كريب عسل 🍯", category: "كريب", price: 30 },
  { id: 8, name: "كريب نوتيلا 🍫", category: "كريب", price: 40 },
  // رول
  { id: 9, name: "رول موزاريلا 🧀", category: "رول", price: 50 },
  { id: 10, name: "رول دجاج 🍗", category: "رول", price: 55 },
  { id: 11, name: "رول سجق 🌭", category: "رول", price: 60 },
  { id: 12, name: "رول جبن 🧀", category: "رول", price: 45 },
  { id: 13, name: "رول خضار 🥦", category: "رول", price: 40 },
  { id: 14, name: "رول مختلط 🥙", category: "رول", price: 65 },
  // مكرونة
  { id: 15, name: "مكرونة كريمة 🥛", category: "مكرونة", price: 45 },
  { id: 16, name: "مكرونة طماطم 🍅", category: "مكرونة", price: 40 },
  { id: 17, name: "مكرونة بشاميل 🥘", category: "مكرونة", price: 50 },
  { id: 18, name: "مكرونة جبن 🧀", category: "مكرونة", price: 45 },
  { id: 19, name: "مكرونة دجاج 🍗", category: "مكرونة", price: 55 },
  // حواوشي
  { id: 20, name: "حواوشي دجاج 🍗", category: "حواوشي", price: 35 },
  { id: 21, name: "حواوشي لحم 🥩", category: "حواوشي", price: 40 },
  { id: 22, name: "حواوشي مختلط 🥙", category: "حواوشي", price: 45 },
  { id: 23, name: "حواوشي جبن 🧀", category: "حواوشي", price: 30 },
];

const AL_HOUT_MENU: MenuItem[] = [
  // أنواع الأسماك المتاحة (حسب الوزن)
  { id: 319, name: "سمك بلطي 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 320, name: "سمك بوري 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 321, name: "سمك ماكريل 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 322, name: "فيليه قشر بياض 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 323, name: "سمك مكرونة 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 324, name: "سمك دنيس 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 325, name: "سمك لوت 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 326, name: "سبيط بلدي 🦑", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 327, name: "كالماري 🦑", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 328, name: "بلح بحر 🐚", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 329, name: "جندوفلي 🐚", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 330, name: "جمبري قشر إسكندراني 🍤", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  // سوق السمك والطواجن
  { id: 315, name: "مكرونة وايت صوص (سي فود / جمبري) 🍝", category: "سوق السمك والطواجن", price: 180 },
  { id: 316, name: "مكرونة ريد صوص (سي فود / جمبري) 🍝", category: "سوق السمك والطواجن", price: 180 },
  { id: 317, name: "كابوريا إسكندراني 🦀", category: "سوق السمك والطواجن", price: 130 },
  { id: 318, name: "فيليه (وايت صوص / ريد صوص) 🐟", category: "سوق السمك والطواجن", price: 130 },
  // الشوربة
  { id: 301, name: "شوربة كريمة 🥣", category: "الشوربة", price: 140 },
  { id: 302, name: "شوربة جمبري حمراء 🥣", category: "الشوربة", price: 140 },
  { id: 303, name: "شوربة صيامي 🥣", category: "الشوربة", price: 120 },
  { id: 304, name: "ملوخية بالجمبري 🥘", category: "الشوربة", price: 100 },
  { id: 305, name: "ملوخية سادة 🥘", category: "الشوربة", price: 70 },
  // الساندوتشات
  { id: 306, name: "ساندوتش جمبري 🍤", category: "الساندوتشات", price: 35 },
  { id: 307, name: "ساندوتش فيليه 🐟", category: "الساندوتشات", price: 40 },
  { id: 308, name: "ساندوتش سبيط 🦑", category: "الساندوتشات", price: 40 },
  // الإضافات والسلطات
  { id: 309, name: "أرز بالجمبري (صغير) 🍚", category: "الإضافات والسلطات", price: 90 },
  { id: 310, name: "أرز بالجمبري (كبير) 🍚", category: "الإضافات والسلطات", price: 110 },
  { id: 311, name: "أرز سادة (صغير) 🍚", category: "الإضافات والسلطات", price: 35 },
  { id: 312, name: "أرز سادة (كبير) 🍚", category: "الإضافات والسلطات", price: 55 },
  { id: 313, name: "طحينة 🍯", category: "الإضافات والسلطات", price: 10 },
  { id: 314, name: "سلطة 🥗", category: "الإضافات والسلطات", price: 20 },
];

const RESTAURANTS = [AL_HOUT_RESTAURANT, ROLL_WE_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT];
const MENUS: Record<number, MenuItem[]> = {
  1: ROLL_WE_MENU,
  2: KHEDIVE_KOSHARY_MENU,
  3: AL_HOUT_MENU
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
  const [usePoints, setUsePoints] = useState(false);
  const [showGiftAlert, setShowGiftAlert] = useState(false);rs.createRestaurantOrder.useMutation();

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
  const hasGift = totalPrice >= 600;
  const freeDeliveryThreshold = 1000;
  const hasFreeDelivery = totalPrice >= freeDeliveryThreshold;

  useEffect(() => {
    if (hasGift && !showGiftAlert) {
      setShowGiftAlert(true);
      toast.success("مبروك! لقد فتحت هدية سرية مجانية 🎁", {
        description: "سيتم إضافة صنف جانبي مجاني لطلبك تلقائياً (عرض الـ 600 جنيه).",
        duration: 5000,
      });
    } else if (!hasGift && showGiftAlert) {
      setShowGiftAlert(false);
    }
  }, [hasGift]);

  const handleCheckout = async () => {
    if (!selectedRestaurant) return;
    if (cart.length === 0) {
      toast.error("السلة فارغة!");
      return;
    }

    if (!addressDescription || addressDescription.trim().length < 5) {
      toast.error("يرجى كتابة العنوان بالتفصيل أولاً (رقم العمارة، الشقة، أو علامة مميزة)");
      return;
    }

    try {Loading(true);
    
    // وظيفة للحصول على الموقع الحالي بدقة في لحظة الطلب
    const getCurrentPositionPromise = () => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // إجبار المتصفح على جلب موقع جديد وليس مخزناً
        });
      });
    };

    try {
      const toastId = toast.info("جاري التأكد من موقعك الحالي بدقة... 📍", { duration: 5000 });
      const position = await getCurrentPositionPromise();
      
      if (!position || !position.coords.latitude || !position.coords.longitude) {
        throw new Error("لم نتمكن من الحصول على إحداثيات دقيقة. يرجى التأكد من فتح الـ GPS.");
      }

      const finalLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: "موقعي الحالي المكتشف",
      };
      
      // تحديث الحالة المحلية أيضاً
      setUserLocation(finalLocation);
      setLocationStatus("success");
      toast.dismiss(toastId);
      const orderItems = cart
        .map((item) => `${item.name} × ${item.quantity} = ${item.price * item.quantity} ج.م`)
        .join("\n");

      const message = `طلب جديد من تطبيق وصلي 📱\n\nالمطعم: ${selectedRestaurant.name}\n\n${orderItems}\n\nالإجمالي: ${totalPrice} ج.م\n\nالعنوان: ${addressDescription || "موقع GPS"}\n\nملاحظات: ${customerNotes || "بدون ملاحظات"}`;

      const encodedMessage = encodeURIComponent(message);
      // استخدام رابط wa.me المباشر لتقليل ظهور نوافذ الاختيار بين أنواع الواتساب
      const directWhatsappUrl = `https://wa.me/${selectedRestaurant.whatsappPhone}?text=${encodedMessage}`;

      // فتح الرابط مباشرة في نافذة جديدة، المتصفح سيتعامل مع فتح التطبيق الافتراضي
      window.open(directWhatsappUrl, "_blank");

      const cartItems = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      await createRestaurantOrderMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        items: cartIt        totalPrice,
        notes: `${customerNotes}${hasGift ? "\n🎁 [هدية مجانية]: وجبة جانبية مجانية (عرض الـ 600 جنيه)" : ""}${hasFreeDelivery ? "\n🚚 [توصيل مجاني]: هذا الطلب مؤهل للتوصيل المجاني (عرض الـ 1000 جنيه)" : ""}`,
        usePoints: usePoints,{
          address: selectedRestaurant.address,
          latitude: selectedRestaurant.location.latitude,
          longitude: selectedRestaurant.location.longitude,
          neighborhood: "موقع المطعم",
        },
        deliveryLocation: {
          address: addressDescription || "موقع العميل المكتشف",
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude,
          neighborhood: "موقع العميل",
        },
      });

      toast.success("تم إرسال الطلب للمطعم وتم إنشاء طلب توصيل تلقائي!");
      setCart([]);
      setCustomerNotes("");
      setAddressDescription("");
    } catch (error: any) {
      console.error("Checkout error:", error);
      if (error.code || error.message?.includes("denied") || error.message?.includes("location")) {
        toast.error("يجب فتح الموقع (GPS) وإعطاء صلاحية للمتصفح لإتمام الطلب. لا يمكن إرسال الطلب بدون تحديد مكانك الفعلي.");
        setLocationStatus("error");
      } else {
        toast.error(error.message || "فشل في إنشاء الطلب");
      }
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
          {selectedRestaurant.id === 3 ? (
            <motion.img 
              src={selectedRestaurant.coverUrl} 
              alt="Restaurant Cover" 
              className="w-full h-full object-cover brightness-110"
              animate={{ 
                scale: [1, 1.1, 1],
                x: [0, 10, -10, 0],
                y: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          ) : (
            <img 
              src={selectedRestaurant.coverUrl} 
              alt="Restaurant Cover" 
              className="w-full h-full object-cover brightness-100 group-hover:scale-105 transition-transform duration-700"
            />
          )}
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
                    <p className="text-orange-600 font-black text-lg">
                      {item.price === 0 ? "سعر اليوم" : `ج.م ${item.price}`}
                    </p>
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
                      <p className="text-orange-400 text-xs font-black">
                        {item.price === 0 ? "سعر اليوم" : `ج.م ${item.price * item.quantity}`}
                      </p>
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
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-400">عنوان التوصيل</span>
                  </div>
                  <input
                    type="text"
                    placeholder="رقم العمارة، الشقة، الدور، أو علامة مميزة..."
                    value={addressDescription}
                    onChange={(e) => setAddressDescription(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <textarea
                    placeholder="ملاحظات إضافية للمطعم (اختياري)..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 transition-all h-20 resize-none"
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
          </Card>
        </div>
      )}
    </div>
  );
}
