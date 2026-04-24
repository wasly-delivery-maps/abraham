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

// مطعم "وصلي" - البيانات (سابقاً رول وي)
const WASLY_RESTAURANT: Restaurant = {
  id: 1,
  name: "مطعم وصلي",
  phone: "01109492630",
  whatsappPhone: "201109492630",
  address: "العبور الجديدة - حي المجد - خلف بنزينة بترومين مول جودي",
  description: "أشهى أنواع الكريب والبيتزا والمشاوي في العبور",
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663594856213/gVZCGIAqHZqBwdDC.png",
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
  { id: 1, name: "بيتزا فراخ (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 2, name: "بيتزا فراخ (كبير) 🍕", category: "البيتزا", price: 170 },
  { id: 3, name: "بيتزا جبن (صغير) 🍕", category: "البيتزا", price: 110 },
  { id: 4, name: "بيتزا جبن (كبير) 🍕", category: "البيتزا", price: 130 },
  { id: 5, name: "بيتزا مارغريتا (صغير) 🍕", category: "البيتزا", price: 90 },
  { id: 6, name: "بيتزا مارغريتا (كبير) 🍕", category: "البيتزا", price: 130 },
  { id: 7, name: "بيتزا كفتة (صغير) 🍕", category: "البيتزا", price: 130 },
  { id: 8, name: "بيتزا كفتة (كبير) 🍕", category: "البيتزا", price: 150 },
  { id: 9, name: "بيتزا سجق (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 10, name: "بيتزا سجق (كبير) 🍕", category: "البيتزا", price: 160 },
  { id: 11, name: "بيتزا استربس (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 12, name: "بيتزا استربس (كبير) 🍕", category: "البيتزا", price: 170 },
  { id: 13, name: "بيتزا شيش (صغير) 🍕", category: "البيتزا", price: 150 },
  { id: 14, name: "بيتزا شيش (كبير) 🍕", category: "البيتزا", price: 200 },
  { id: 15, name: "بيتزا برجر (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 16, name: "بيتزا برجر (كبير) 🍕", category: "البيتزا", price: 150 },
  { id: 17, name: "بيتزا شاورما (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 18, name: "بيتزا شاورما (كبير) 🍕", category: "البيتزا", price: 200 },
  { id: 19, name: "بيتزا مكس فراخ (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 20, name: "بيتزا مكس فراخ (كبير) 🍕", category: "البيتزا", price: 160 },
  { id: 21, name: "بيتزا مكس جبن (صغير) 🍕", category: "البيتزا", price: 100 },
  { id: 22, name: "بيتزا مكس جبن (كبير) 🍕", category: "البيتزا", price: 130 },
  { id: 23, name: "بيتزا فراخ رانش (صغير) 🍕", category: "البيتزا", price: 120 },
  { id: 24, name: "بيتزا فراخ رانش (كبير) 🍕", category: "البيتزا", price: 170 },

  // الكريب
  { id: 25, name: "كريب استربس (عادي) 🌯", category: "الكريب", price: 80 },
  { id: 26, name: "كريب استربس (سوبر) 🌯", category: "الكريب", price: 110 },
  { id: 27, name: "كريب بانيه (عادي) 🌯", category: "الكريب", price: 50 },
  { id: 28, name: "كريب بانيه (سوبر) 🌯", category: "الكريب", price: 70 },
  { id: 29, name: "كريب كفتة (عادي) 🌯", category: "الكريب", price: 70 },
  { id: 30, name: "كريب كفتة (سوبر) 🌯", category: "الكريب", price: 90 },
  { id: 31, name: "كريب برجر (عادي) 🌯", category: "الكريب", price: 80 },
  { id: 32, name: "كريب برجر (سوبر) 🌯", category: "الكريب", price: 100 },
  { id: 33, name: "كريب سجق (عادي) 🌯", category: "الكريب", price: 70 },
  { id: 34, name: "كريب سجق (سوبر) 🌯", category: "الكريب", price: 90 },
  { id: 35, name: "كريب بطاطس (عادي) 🍟", category: "الكريب", price: 40 },
  { id: 36, name: "كريب بطاطس (سوبر) 🍟", category: "الكريب", price: 60 },
  { id: 37, name: "كريب زنجر (عادي) 🌯", category: "الكريب", price: 100 },
  { id: 38, name: "كريب زنجر (سوبر) 🌯", category: "الكريب", price: 120 },
  { id: 39, name: "كريب جبن (عادي) 🧀", category: "الكريب", price: 40 },
  { id: 40, name: "كريب جبن (سوبر) 🧀", category: "الكريب", price: 70 },
  { id: 41, name: "كريب شيش 🌯", category: "الكريب", price: 110 },

  // الوجبات
  { id: 42, name: "وجبة كفتة 🍱", category: "الوجبات", price: 100 },
  { id: 43, name: "وجبة شيش 🍱", category: "الوجبات", price: 100 },
  { id: 44, name: "وجبة ميكس 🍱", category: "الوجبات", price: 150 },

  // الميكسات
  { id: 45, name: "استربس بانيه 🍗", category: "الميكسات", price: 100 },
  { id: 46, name: "استربس بطاطس 🍗", category: "الميكسات", price: 100 },
  { id: 47, name: "استربس شيش 🍗", category: "الميكسات", price: 120 },
  { id: 48, name: "بانيه بطاطس 🍗", category: "الميكسات", price: 70 },
  { id: 49, name: "شيش بطاطس 🍗", category: "الميكسات", price: 110 },
  { id: 50, name: "شيش شاورما 🍗", category: "الميكسات", price: 120 },
  { id: 51, name: "شيش برجر 🍗", category: "الميكسات", price: 100 },

  // المكرونات
  { id: 52, name: "نجرسكو فراخ ع الفحم 🍝", category: "المكرونات", price: 70 },
  { id: 53, name: "نجرسكو فراخ ع الفحم (كبير) 🍝", category: "المكرونات", price: 80 },
  { id: 54, name: "نجرسكو لحوم 🍝", category: "المكرونات", price: 70 },
  { id: 55, name: "نجرسكو جبن 🍝", category: "المكرونات", price: 50 },

  // المشاوي
  { id: 56, name: "فرخة مشوية كاملة 🍗", category: "المشاوي", price: 380 },
  { id: 57, name: "نص فرخة 🍗", category: "المشاوي", price: 190 },
  { id: 58, name: "ربع فرخة ورك 🍗", category: "المشاوي", price: 85 },
  { id: 59, name: "ربع فرخة صدر 🍗", category: "المشاوي", price: 100 },
  { id: 60, name: "ساندوتش كفتة 🥖", category: "المشاوي", price: 40 },
  { id: 61, name: "ساندوتش شيش 🥖", category: "المشاوي", price: 50 },
  { id: 62, name: "ساندوتش حواوشي 🥙", category: "المشاوي", price: 30 },

  // كيزر
  { id: 63, name: "ساندوتش برجر 🍔", category: "كيزر", price: 60 },
  { id: 64, name: "ساندوتش رانش 🍔", category: "كيزر", price: 60 },
  { id: 65, name: "ساندوتش زنجر 🍔", category: "كيزر", price: 70 },

  // إضافات
  { id: 66, name: "باكت بطاطس 🍟", category: "إضافات", price: 20 },
  { id: 67, name: "سلطة 🥗", category: "إضافات", price: 15 },
];

const AL_HOUT_MENU: MenuItem[] = [
  // أنواع الأسماك المتاحة (حسب الوزن)
  { id: 319, name: "سمك بلطي 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 320, name: "سمك بوري 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 321, name: "سمك ماكريل 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 322, name: "فيليه قشر بياض 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 323, name: "سمك مكرونة 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
  { id: 324, name: "سمك dنيس 🐟", category: "أنواع الأسماك المتاحة", price: 0, description: "السعر حسب الوزن والنوع" },
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

export function RestaurantMenu() {
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant>(WASLY_RESTAURANT);
  const [menu, setMenu] = useState<MenuItem[]>(WASLY_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const validateCouponMutation = trpc.coupons.validate.useMutation();
  const createOrderMutation = trpc.orders.createRestaurantOrder.useMutation();

  const restaurants = [WASLY_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT, AL_HOUT_RESTAURANT];

  const handleRestaurantChange = (restaurant: Restaurant) => {
    setActiveRestaurant(restaurant);
    if (restaurant.id === 1) setMenu(WASLY_MENU);
    else if (restaurant.id === 2) setMenu(KHEDIVE_KOSHARY_MENU);
    else if (restaurant.id === 3) setMenu(AL_HOUT_MENU);
    setCart([]);
    setAppliedCoupon(null);
  };

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
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = appliedCoupon ? (
    appliedCoupon.discountType === "percentage" 
      ? Math.min(totalPrice * (appliedCoupon.discountValue / 100), appliedCoupon.maxDiscount || Infinity)
      : appliedCoupon.discountValue
  ) : 0;

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsValidatingCoupon(true);
    try {
      const coupon = await validateCouponMutation.mutateAsync({ code: couponCode });
      if (totalPrice && coupon.minOrderValue && totalPrice < coupon.minOrderValue) {
        toast.error(`هذا الكوبون يتطلب طلباً بقيمة ${coupon.minOrderValue} ج.م على الأقل`);
        return;
      }
      setAppliedCoupon(coupon);
      toast.success("تم تطبيق الكوبون بنجاح");
    } catch (error: any) {
      toast.error(error.message || "كود الخصم غير صحيح");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const result = await createOrderMutation.mutateAsync({
        restaurantId: activeRestaurant.id,
        items: cart.map(i => ({
          menuItemId: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        totalPrice: finalPrice,
        couponId: appliedCoupon?.id,
        deliveryLocation: {
          address: "سيتم تحديد العنوان في الخطوة التالية",
          latitude: 30.2750994,
          longitude: 31.5006526,
        }
      });

      toast.success("تم إرسال طلبك بنجاح!");
      setCart([]);
      setIsCartOpen(false);
      setAppliedCoupon(null);
      setCouponCode("");
    } catch (error) {
      toast.error("فشل في إرسال الطلب");
    }
  };

  const categories = Array.from(new Set(menu.map(item => item.category)));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <img src={activeRestaurant.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-black text-lg text-gray-900">{activeRestaurant.name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-0.5 text-orange-500 font-bold">
                  <Star className="w-3 h-3 fill-current" /> {activeRestaurant.rating}
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {activeRestaurant.deliveryTime}
                </span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative rounded-xl border-gray-200"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Restaurant Selector */}
      <div className="max-w-7xl mx-auto px-4 py-4 overflow-x-auto no-scrollbar flex gap-3">
        {restaurants.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRestaurantChange(r)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
              activeRestaurant.id === r.id 
                ? "bg-orange-600 text-white shadow-lg shadow-orange-200 scale-105" 
                : "bg-white text-gray-600 border border-gray-100 hover:border-orange-200"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-8 mt-2">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <div className="w-2 h-6 bg-orange-600 rounded-full" />
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menu.filter(item => item.category === category).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-lg font-black text-orange-600">
                          {item.price} <span className="text-[10px] font-bold text-gray-400">ج.م</span>
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      className="rounded-2xl bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white transition-all shadow-none"
                      onClick={() => addToCart(item)}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
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
              <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black">سلة الطلبات</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="rounded-xl">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-10 h-10 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">السلة فارغة</h3>
                      <p className="text-sm text-gray-500">ابدأ بإضافة بعض الأصناف اللذيذة</p>
                    </div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-orange-600 font-black text-sm">{item.price} ج.م</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-200">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-orange-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-white border-t space-y-4">
                  {/* Coupon Section */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="كود الخصم"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    />
                    <Button 
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode}
                      className="rounded-2xl bg-gray-900 hover:bg-black px-6"
                    >
                      {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                    </Button>
                  </div>

                  {appliedCoupon && (
                    <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
                        <Gift className="w-4 h-4" />
                        تم تطبيق خصم {appliedCoupon.discountValue}{appliedCoupon.discountType === "percentage" ? "%" : " ج.م"}
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-green-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>المجموع</span>
                      <span>{totalPrice} ج.م</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>الخصم</span>
                        <span>-{discountAmount} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t">
                      <span>الإجمالي</span>
                      <span className="text-orange-600">{finalPrice} ج.م</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    disabled={createOrderMutation.isPending}
                    className="w-full py-7 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg shadow-lg shadow-orange-200"
                  >
                    {createOrderMutation.isPending ? (
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
