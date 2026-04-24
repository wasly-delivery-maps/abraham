import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2, ChevronRight, Star, Clock, Coins, Gift, Truck, CheckCircle2 } from "lucide-react";
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

// مطعم "وصلي" - البيانات الجديدة
const WASLY_RESTAURANT: Restaurant = {
  id: 1,
  name: "مطعم وصلي",
  phone: "01109492630",
  whatsappPhone: "201109492630",
  address: "العبور الجديدة - حي المجد - خلف بنزينة بترومين مول جودي",
  description: "أشهى أنواع الكريب والبيتزا والمشاوي والمكرونة في العبور",
  logoUrl: "https://web-production-0eb1b.up.railway.app/uploads/wasly_logo.png",
  coverUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
  rating: "4.9",
  deliveryTime: "20-40 دقيقة",
  location: {
    latitude: 30.275262,
    longitude: 31.5005241
  }
};

const WASLY_MENU: MenuItem[] = [
  // البيتزا
  { id: 1, name: "بيتزا فراخ (صغير)", category: "البيتزا", price: 120 },
  { id: 2, name: "بيتزا فراخ (كبير)", category: "البيتزا", price: 170 },
  { id: 3, name: "بيتزا جبن (صغير)", category: "البيتزا", price: 110 },
  { id: 4, name: "بيتزا جبن (كبير)", category: "البيتزا", price: 130 },
  { id: 5, name: "بيتزا مارغريتا (صغير)", category: "البيتزا", price: 90 },
  { id: 6, name: "بيتزا مارغريتا (كبير)", category: "البيتزا", price: 130 },
  { id: 7, name: "بيتزا كفتة (صغير)", category: "البيتزا", price: 130 },
  { id: 8, name: "بيتزا كفتة (كبير)", category: "البيتزا", price: 150 },
  { id: 9, name: "بيتزا سجق (صغير)", category: "البيتزا", price: 120 },
  { id: 10, name: "بيتزا سجق (كبير)", category: "البيتزا", price: 160 },
  { id: 11, name: "بيتزا استربس (صغير)", category: "البيتزا", price: 120 },
  { id: 12, name: "بيتزا استربس (كبير)", category: "البيتزا", price: 170 },
  { id: 13, name: "بيتزا شيش (صغير)", category: "البيتزا", price: 150 },
  { id: 14, name: "بيتزا شيش (كبير)", category: "البيتزا", price: 200 },
  { id: 15, name: "بيتزا برجر (صغير)", category: "البيتزا", price: 120 },
  { id: 16, name: "بيتزا برجر (كبير)", category: "البيتزا", price: 150 },
  { id: 17, name: "بيتزا شاورما (صغير)", category: "البيتزا", price: 120 },
  { id: 18, name: "بيتزا شاورما (كبير)", category: "البيتزا", price: 200 },
  { id: 19, name: "بيتزا مكس فراخ (صغير)", category: "البيتزا", price: 120 },
  { id: 20, name: "بيتزا مكس فراخ (كبير)", category: "البيتزا", price: 160 },
  { id: 21, name: "بيتزا مكس جبن (صغير)", category: "البيتزا", price: 100 },
  { id: 22, name: "بيتزا مكس جبن (كبير)", category: "البيتزا", price: 130 },
  { id: 23, name: "بيتزا فراخ رانش (صغير)", category: "البيتزا", price: 120 },
  { id: 24, name: "بيتزا فراخ رانش (كبير)", category: "البيتزا", price: 170 },
  // الكريب
  { id: 25, name: "كريب استربس (عادي)", category: "الكريب", price: 80 },
  { id: 26, name: "كريب استربس (سوبر)", category: "الكريب", price: 110 },
  { id: 27, name: "كريب بانيه (عادي)", category: "الكريب", price: 50 },
  { id: 28, name: "كريب بانيه (سوبر)", category: "الكريب", price: 70 },
  { id: 29, name: "كريب كفتة (عادي)", category: "الكريب", price: 70 },
  { id: 30, name: "كريب كفتة (سوبر)", category: "الكريب", price: 90 },
  { id: 31, name: "كريب برجر (عادي)", category: "الكريب", price: 80 },
  { id: 32, name: "كريب برجر (سوبر)", category: "الكريب", price: 100 },
  { id: 33, name: "كريب سجق (عادي)", category: "الكريب", price: 70 },
  { id: 34, name: "كريب سجق (سوبر)", category: "الكريب", price: 90 },
  { id: 35, name: "كريب بطاطس (عادي)", category: "الكريب", price: 40 },
  { id: 36, name: "كريب بطاطس (سوبر)", category: "الكريب", price: 60 },
  { id: 37, name: "كريب زنجر (عادي)", category: "الكريب", price: 100 },
  { id: 38, name: "كريب زنجر (سوبر)", category: "الكريب", price: 120 },
  { id: 39, name: "كريب جبن (عادي)", category: "الكريب", price: 40 },
  { id: 40, name: "كريب جبن (سوبر)", category: "الكريب", price: 70 },
  { id: 41, name: "كريب شيش (عادي)", category: "الكريب", price: 110 },
  // الوجبات
  { id: 42, name: "وجبة كفتة", category: "الوجبات", price: 100 },
  { id: 43, name: "وجبة شيش", category: "الوجبات", price: 100 },
  { id: 44, name: "وجبة ميكس", category: "الوجبات", price: 150 },
  // الميكسات
  { id: 45, name: "استربس بانيه", category: "الميكسات", price: 100 },
  { id: 46, name: "استربس بطاطس", category: "الميكسات", price: 100 },
  { id: 47, name: "استربس شيش", category: "الميكسات", price: 120 },
  { id: 48, name: "بانيه بطاطس", category: "الميكسات", price: 70 },
  { id: 49, name: "شيش بطاطس", category: "الميكسات", price: 110 },
  { id: 50, name: "شيش شاورما", category: "الميكسات", price: 120 },
  { id: 51, name: "شيش برجر", category: "الميكسات", price: 100 },
  // المكرونات
  { id: 52, name: "نجرسكو فراخ ع الفحم", category: "المكرونات", price: 70 },
  { id: 53, name: "نجرسكو فراخ ك", category: "المكرونات", price: 80 },
  { id: 54, name: "نجرسكو لحوم", category: "المكرونات", price: 70 },
  { id: 55, name: "نجرسكو جبن", category: "المكرونات", price: 50 },
  // المشاوي
  { id: 56, name: "فرخة مشوية كاملة", category: "المشاوي", price: 380 },
  { id: 57, name: "نص فرخة", category: "المشاوي", price: 190 },
  { id: 58, name: "ربع فرخة ورك", category: "المشاوي", price: 85 },
  { id: 59, name: "ربع فرخة صدر", category: "المشاوي", price: 100 },
  { id: 60, name: "ساندوتش كفتة", category: "المشاوي", price: 40 },
  { id: 61, name: "ساندوتش شيش", category: "المشاوي", price: 50 },
  { id: 62, name: "ساندوتش حواوشي", category: "المشاوي", price: 30 },
  // كيزر
  { id: 63, name: "ساندوتش برجر", category: "كيزر", price: 60 },
  { id: 64, name: "ساندوتش رانش", category: "كيزر", price: 60 },
  { id: 65, name: "ساندوتش زنجر", category: "كيزر", price: 70 },
  // إضافات
  { id: 66, name: "باكت بطاطس", category: "إضافات", price: 20 },
  { id: 67, name: "سلطة", category: "إضافات", price: 15 },
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
];

export default function RestaurantMenu() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant>(WASLY_RESTAURANT);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const createOrder = trpc.createRestaurantOrder.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.");
      setCart([]);
      setAddress("");
      setNotes("");
      setIsCartOpen(false);
      setAppliedCoupon(null);
      setCouponCode("");
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إرسال الطلب");
    }
  });

  const validateCoupon = trpc.validateCoupon.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        toast.success("تم تطبيق الكوبون بنجاح!");
      } else {
        toast.error(data.message || "كوبون غير صالح");
        setAppliedCoupon(null);
      }
    }
  });

  const restaurants = [WASLY_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT, AL_HOUT_RESTAURANT];
  const menu = selectedRestaurant.id === 1 ? WASLY_MENU : 
               selectedRestaurant.id === 2 ? KHEDIVE_KOSHARY_MENU : 
               AL_HOUT_MENU;

  const categories = Array.from(new Set(menu.map(item => item.category)));

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`تم إضافة ${item.name} إلى السلة`);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
      return 0;
    }

    let discount = 0;
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else {
      discount = appliedCoupon.value;
    }
    
    return discount;
  };

  const discount = calculateDiscount();
  const total = Math.max(0, subtotal - discount);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error("السلة فارغة!");
      return;
    }
    if (!address.trim()) {
      toast.error("يرجى إدخال عنوان التوصيل بالتفصيل");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder.mutateAsync({
        restaurantId: selectedRestaurant.id,
        restaurantName: selectedRestaurant.name,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total,
        subtotal,
        discount,
        couponCode: appliedCoupon?.code,
        address,
        notes,
        customerPhone: selectedRestaurant.phone // This will be replaced by actual user phone in backend
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">وصلي</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          )}
        </Button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Restaurant Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedRestaurant.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-gray-900">{selectedRestaurant.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedRestaurant.deliveryTime}</span>
                </div>
              </div>
            </div>
            <img 
              src={selectedRestaurant.logoUrl} 
              alt={selectedRestaurant.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-md"
            />
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {selectedRestaurant.description}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="truncate">{selectedRestaurant.address}</span>
          </div>
        </div>

        {/* Restaurant Selector */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {restaurants.map((r) => (
            <Button
              key={r.id}
              variant={selectedRestaurant.id === r.id ? "default" : "outline"}
              className={`rounded-full whitespace-nowrap px-6 ${
                selectedRestaurant.id === r.id ? "bg-orange-500 hover:bg-orange-600" : ""
              }`}
              onClick={() => {
                setSelectedRestaurant(r);
                setCart([]);
                setAppliedCoupon(null);
              }}
            >
              {r.name}
            </Button>
          ))}
        </div>

        {/* Menu Categories */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              {category}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {menu
                .filter((item) => item.category === category)
                .map((item) => (
                  <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-2xl">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.description}</p>
                        )}
                        <div className="text-orange-600 font-bold">
                          {item.price === 0 ? "سعر اليوم" : `${item.price} ج.م`}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold">سلة الطلبات</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">السلة فارغة</p>
                      <p className="text-sm">ابدأ بإضافة بعض الأصناف اللذيذة</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.name}</h4>
                          <p className="text-orange-600 font-medium">{item.price * item.quantity} ج.م</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-6 border-t space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">عنوان التوصيل بالتفصيل</label>
                        <div className="relative">
                          <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                          <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="مثال: الحي الثالث، المجاورة الثانية، عمارة 10، شقة 5"
                            className="w-full pr-10 pl-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 min-h-[80px] resize-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">ملاحظات إضافية (اختياري)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="أي تعليمات خاصة للسائق أو المطعم..."
                          className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">كوبون الخصم</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="أدخل الكود هنا"
                            className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
                          />
                          <Button 
                            onClick={() => validateCoupon.mutate({ code: couponCode })}
                            disabled={!couponCode || validateCoupon.isLoading}
                            className="rounded-xl bg-gray-900 hover:bg-gray-800"
                          >
                            تطبيق
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-gray-50 rounded-t-[32px] space-y-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-500">
                      <span>المجموع الفرعي</span>
                      <span>{subtotal} ج.م</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>الخصم</span>
                        <span>-{discount} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                      <span>الإجمالي</span>
                      <span>{total} ج.م</span>
                    </div>
                  </div>
                  <Button
                    className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-lg font-bold shadow-lg shadow-orange-200"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      "تأكيد الطلب الآن"
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
