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

// مطعم "رول وي" - البيانات
const ROLL_WE_RESTAURANT: Restaurant = {
  id: 1,
  name: "مطعم وصلي",
  phone: "01557564373",
  whatsappPhone: "201557564373",
  address: "العبور الجديدة - مطعم وصلي",
  description: "أشهى المأكولات والبيتزا والكريب في العبور الجديدة",
  logoUrl: "https://ui-avatars.com/api/?name=WS&background=f97316&color=fff&size=128&bold=true",
  coverUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
  rating: "5.0",
  deliveryTime: "20-35 دقيقة",
  location: {
    latitude: 30.2750625,
    longitude: 31.5256719
  }
};
const ROLL_WE_MENU: MenuItem[] = [
  {
    "id": 1001,
    "name": "بيتزا فراخ صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1002,
    "name": "بيتزا فراخ كبير 🍕",
    "category": "البيتزا",
    "price": 170
  },
  {
    "id": 1003,
    "name": "بيتزا جبن صغير 🍕",
    "category": "البيتزا",
    "price": 110
  },
  {
    "id": 1004,
    "name": "بيتزا جبن كبير 🍕",
    "category": "البيتزا",
    "price": 130
  },
  {
    "id": 1005,
    "name": "بيتزا مارغريتا صغير 🍕",
    "category": "البيتزا",
    "price": 90
  },
  {
    "id": 1006,
    "name": "بيتزا مارغريتا كبير 🍕",
    "category": "البيتزا",
    "price": 130
  },
  {
    "id": 1007,
    "name": "بيتزا كفتة صغير 🍕",
    "category": "البيتزا",
    "price": 130
  },
  {
    "id": 1008,
    "name": "بيتزا كفتة كبير 🍕",
    "category": "البيتزا",
    "price": 150
  },
  {
    "id": 1009,
    "name": "بيتزا سجق صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1010,
    "name": "بيتزا سجق كبير 🍕",
    "category": "البيتزا",
    "price": 160
  },
  {
    "id": 1011,
    "name": "بيتزا استربس صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1012,
    "name": "بيتزا استربس كبير 🍕",
    "category": "البيتزا",
    "price": 170
  },
  {
    "id": 1013,
    "name": "بيتزا شيش صغير 🍕",
    "category": "البيتزا",
    "price": 150
  },
  {
    "id": 1014,
    "name": "بيتزا شيش كبير 🍕",
    "category": "البيتزا",
    "price": 200
  },
  {
    "id": 1015,
    "name": "بيتزا برجر صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1016,
    "name": "بيتزا برجر كبير 🍕",
    "category": "البيتزا",
    "price": 150
  },
  {
    "id": 1017,
    "name": "بيتزا شاورما صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1018,
    "name": "بيتزا شاورما كبير 🍕",
    "category": "البيتزا",
    "price": 200
  },
  {
    "id": 1019,
    "name": "بيتزا مكس فراخ صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1020,
    "name": "بيتزا مكس فراخ كبير 🍕",
    "category": "البيتزا",
    "price": 160
  },
  {
    "id": 1021,
    "name": "بيتزا مكس جبن صغير 🍕",
    "category": "البيتزا",
    "price": 100
  },
  {
    "id": 1022,
    "name": "بيتزا مكس جبن كبير 🍕",
    "category": "البيتزا",
    "price": 130
  },
  {
    "id": 1023,
    "name": "بيتزا فراخ رانش صغير 🍕",
    "category": "البيتزا",
    "price": 120
  },
  {
    "id": 1024,
    "name": "بيتزا فراخ رانش كبير 🍕",
    "category": "البيتزا",
    "price": 170
  },
  {
    "id": 1025,
    "name": "كريب استربس عادي 🌯",
    "category": "الكريب",
    "price": 80
  },
  {
    "id": 1026,
    "name": "كريب استربس سوبر 🌯",
    "category": "الكريب",
    "price": 110
  },
  {
    "id": 1027,
    "name": "كريب بانيه عادي 🌯",
    "category": "الكريب",
    "price": 50
  },
  {
    "id": 1028,
    "name": "كريب بانيه سوبر 🌯",
    "category": "الكريب",
    "price": 70
  },
  {
    "id": 1029,
    "name": "كريب كفتة عادي 🌯",
    "category": "الكريب",
    "price": 70
  },
  {
    "id": 1030,
    "name": "كريب كفتة سوبر 🌯",
    "category": "الكريب",
    "price": 90
  },
  {
    "id": 1031,
    "name": "كريب برجر عادي 🌯",
    "category": "الكريب",
    "price": 80
  },
  {
    "id": 1032,
    "name": "كريب برجر سوبر 🌯",
    "category": "الكريب",
    "price": 100
  },
  {
    "id": 1033,
    "name": "كريب سجق عادي 🌯",
    "category": "الكريب",
    "price": 70
  },
  {
    "id": 1034,
    "name": "كريب سجق سوبر 🌯",
    "category": "الكريب",
    "price": 90
  },
  {
    "id": 1035,
    "name": "كريب بطاطس عادي 🌯",
    "category": "الكريب",
    "price": 40
  },
  {
    "id": 1036,
    "name": "كريب بطاطس سوبر 🌯",
    "category": "الكريب",
    "price": 60
  },
  {
    "id": 1037,
    "name": "كريب زنجر عادي 🌯",
    "category": "الكريب",
    "price": 100
  },
  {
    "id": 1038,
    "name": "كريب زنجر سوبر 🌯",
    "category": "الكريب",
    "price": 120
  },
  {
    "id": 1039,
    "name": "كريب جبن عادي 🌯",
    "category": "الكريب",
    "price": 40
  },
  {
    "id": 1040,
    "name": "كريب جبن سوبر 🌯",
    "category": "الكريب",
    "price": 70
  },
  {
    "id": 1041,
    "name": "كريب شيش سوبر 🌯",
    "category": "الكريب",
    "price": 110
  },
  {
    "id": 1042,
    "name": "وجبة كفتة 🍱",
    "category": "الوجبات",
    "price": 100
  },
  {
    "id": 1043,
    "name": "وجبة شيش 🍱",
    "category": "الوجبات",
    "price": 100
  },
  {
    "id": 1044,
    "name": "وجبة ميكس 🍱",
    "category": "الوجبات",
    "price": 150
  },
  {
    "id": 1045,
    "name": "استربس بانيه 🥗",
    "category": "الميكسات",
    "price": 100
  },
  {
    "id": 1046,
    "name": "استربس بطاطس 🥗",
    "category": "الميكسات",
    "price": 100
  },
  {
    "id": 1047,
    "name": "استربس شيش 🥗",
    "category": "الميكسات",
    "price": 120
  },
  {
    "id": 1048,
    "name": "بانيه بطاطس 🥗",
    "category": "الميكسات",
    "price": 70
  },
  {
    "id": 1049,
    "name": "شيش بطاطس 🥗",
    "category": "الميكسات",
    "price": 110
  },
  {
    "id": 1050,
    "name": "شيش شاورما 🥗",
    "category": "الميكسات",
    "price": 120
  },
  {
    "id": 1051,
    "name": "شيش برجر 🥗",
    "category": "الميكسات",
    "price": 100
  },
  {
    "id": 1052,
    "name": "نجرسكو فراخ ع الفحم 🍝",
    "category": "المكرونات",
    "price": 70
  },
  {
    "id": 1053,
    "name": "نجرسكو فراخ ع الفحم ك 🍝",
    "category": "المكرونات",
    "price": 80
  },
  {
    "id": 1054,
    "name": "نجرسكو لحوم 🍝",
    "category": "المكرونات",
    "price": 70
  },
  {
    "id": 1055,
    "name": "نجرسكو جبن 🍝",
    "category": "المكرونات",
    "price": 50
  },
  {
    "id": 1056,
    "name": "فرخة مشوية كاملة 🍗",
    "category": "المشاوي",
    "price": 380
  },
  {
    "id": 1057,
    "name": "نص فرخة 🍗",
    "category": "المشاوي",
    "price": 190
  },
  {
    "id": 1058,
    "name": "ربع فرخة ورك 🍗",
    "category": "المشاوي",
    "price": 85
  },
  {
    "id": 1059,
    "name": "ربع فرخة صدر 🍗",
    "category": "المشاوي",
    "price": 100
  },
  {
    "id": 1060,
    "name": "ساندوتش كفتة 🥖",
    "category": "المشاوي",
    "price": 40
  },
  {
    "id": 1061,
    "name": "ساندوتش شيش 🥖",
    "category": "المشاوي",
    "price": 50
  },
  {
    "id": 1062,
    "name": "ساندوتش حواوشي 🥙",
    "category": "المشاوي",
    "price": 30
  },
  {
    "id": 1063,
    "name": "ساندوتش برجر 🍔",
    "category": "كيزر",
    "price": 60
  },
  {
    "id": 1064,
    "name": "ساندوتش رانش 🍔",
    "category": "كيزر",
    "price": 60
  },
  {
    "id": 1065,
    "name": "ساندوتش زنجر 🍔",
    "category": "كيزر",
    "price": 70
  },
  {
    "id": 1066,
    "name": "باكت بطاطس 🍟",
    "category": "إضافات",
    "price": 20
  },
  {
    "id": 1067,
    "name": "سلطة 🥗",
    "category": "إضافات",
    "price": 15
  }
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

const RESTAURANTS = [ROLL_WE_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT, AL_HOUT_RESTAURANT];
const MENUS: Record<number, MenuItem[]> = {
  1: ROLL_WE_MENU,
  2: KHEDIVE_KOSHARY_MENU,
  3: AL_HOUT_MENU,
};

export function RestaurantMenu() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [addressDescription, setAddressDescription] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showGiftAlert, setShowGiftAlert] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const createRestaurantOrderMutation = trpc.orders.createRestaurantOrder.useMutation();
  const validateCouponMutation = trpc.coupons.validate.useMutation();

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`تم إضافة ${item.name} للسلة`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  useEffect(() => {
    if (selectedRestaurant) {
      const menu = MENUS[selectedRestaurant.id] || [];
      if (menu.length > 0) {
        setSelectedCategory(menu[0].category);
      }
    }
  }, [selectedRestaurant]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? (appliedCoupon.discountType === 'fixed' ? appliedCoupon.discountValue : Math.min(totalPrice * (appliedCoupon.discountValue / 100), appliedCoupon.maxDiscount || Infinity)) : 0;
  const finalTotalPrice = Math.max(0, totalPrice - discountAmount);
  
  const hasGift = totalPrice >= 600;
  const freeDeliveryThreshold = 1000;
  const hasFreeDelivery = totalPrice >= freeDeliveryThreshold;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const coupon = await validateCouponMutation.mutateAsync({ code: couponCode });
      if (totalPrice && coupon.minOrderValue && totalPrice < coupon.minOrderValue) {
        toast.error(`هذا الكوبون يتطلب طلباً بقيمة ${coupon.minOrderValue} ج.م على الأقل`);
        return;
      }
      setAppliedCoupon(coupon);
      toast.success("تم تطبيق الكوبون بنجاح! 🎉");
    } catch (error: any) {
      toast.error(error.message || "كود الخصم غير صحيح");
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

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
  }, [hasGift, showGiftAlert]);

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

    setIsLoading(true);
    
    const getCurrentPositionPromise = () => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 
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
      
      setUserLocation(finalLocation);
      setLocationStatus("success");
      toast.dismiss(toastId);

      const orderItems = cart
        .map((item) => `${item.name} × ${item.quantity} = ${item.price * item.quantity} ج.م`)
        .join("\n");

      const message = `طلب جديد من تطبيق وصلي 📱\n\nالمطعم: ${selectedRestaurant.name}\n\n${orderItems}\n\nالإجمالي الأصلي: ${totalPrice} ج.م\n${appliedCoupon ? `الخصم: ${discountAmount} ج.م (${appliedCoupon.code})\nالإجمالي بعد الخصم: ${finalTotalPrice} ج.م\n` : ''}\nالعنوان: ${addressDescription || "موقع GPS"}\n\nملاحظات: ${customerNotes || "بدون ملاحظات"}`;

      const encodedMessage = encodeURIComponent(message);
      const directWhatsappUrl = `https://wa.me/${selectedRestaurant.whatsappPhone}?text=${encodedMessage}`;

      window.open(directWhatsappUrl, "_blank");

      const cartItemsData = cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      await createRestaurantOrderMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        items: cartItemsData,
        totalPrice: finalTotalPrice,
        notes: `${customerNotes}${appliedCoupon ? `\n🎟️ [كوبون]: ${appliedCoupon.code} (خصم ${discountAmount} ج.م)` : ""}${hasGift ? "\n🎁 [هدية مجانية]: وجبة جانبية مجانية (عرض الـ 600 جنيه)" : ""}${hasFreeDelivery ? "\n🚚 [توصيل مجاني]: هذا الطلب مؤهل للتوصيل المجاني (عرض الـ 1000 جنيه)" : ""}`,
        couponId: appliedCoupon?.id,
        usePoints: usePoints,
        pickupLocation: {
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
      setIsCartExpanded(false);
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
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
        {RESTAURANTS.map((restaurant) => (
          <motion.div
            key={restaurant.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="min-w-[280px] snap-center"
          >
          <Card 
            className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all rounded-[2rem] bg-white group cursor-pointer h-full"
            onClick={() => setSelectedRestaurant(restaurant)}
          >
            <div className="h-32 w-full relative overflow-hidden">
              <img 
                src={restaurant.coverUrl} 
                alt={restaurant.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <div className="bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-slate-800">{restaurant.rating}</span>
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Clock className="h-2.5 w-2.5 text-orange-500" />
                  <span className="text-[10px] font-black text-slate-800">{restaurant.deliveryTime}</span>
                </div>
              </div>
            </div>
            <CardContent className="p-3 relative">
              <div className="absolute -top-8 right-3 h-12 w-12 rounded-xl bg-white p-1 shadow-lg border border-slate-50 overflow-hidden">
                <img src={restaurant.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="pt-2">
                <h3 className="text-lg font-black text-slate-800 mb-0.5 group-hover:text-orange-600 transition-colors">{restaurant.name}</h3>
                <p className="text-slate-500 text-[11px] font-medium line-clamp-1 mb-2">{restaurant.description}</p>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] font-bold line-clamp-1">{restaurant.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  const currentMenu = MENUS[selectedRestaurant.id] || [];
  const categories = Array.from(new Set(currentMenu.map((item) => item.category)));
  const filteredMenu = currentMenu.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6 pb-32" dir="rtl">
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
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 90 }} 
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      size="icon"
                      onClick={() => addToCart(item)}
                      className="rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-none border-2 border-orange-200"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <Card className={`max-w-2xl mx-auto border-none shadow-2xl bg-slate-900 text-white rounded-3xl overflow-hidden relative transition-all duration-300 pointer-events-auto ${isCartExpanded ? 'h-auto' : 'h-20'}`}>
            {!isCartExpanded ? (
              <div 
                className="h-20 flex items-center justify-between px-6 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setIsCartExpanded(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="bg-orange-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center absolute -top-2 -right-2 border-2 border-slate-900">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                    <motion.div
                      animate={cart.length > 0 ? { 
                        scale: [1, 1.3, 1],
                        rotate: [0, -10, 10, 0]
                      } : {}}
                      transition={{ duration: 0.4 }}
                      key={cart.length}
                    >
                      <ShoppingCart className="h-6 w-6 text-orange-500" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">سلتك الحالية</p>
                    <p className="text-lg font-black text-white">ج.م {totalPrice}</p>
                  </div>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl px-6">
                  عرض السلة
                </Button>
              </div>
            ) : (
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                  <h3 className="font-black text-lg">سلة الطلبات</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-slate-800 text-white hover:bg-slate-700"
                      onClick={() => setCart([])}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-slate-800 text-white hover:bg-slate-700"
                      onClick={() => setIsCartExpanded(false)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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

                <div className="space-y-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-400">كود الخصم</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أدخل كود الخصم..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon || isValidatingCoupon}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 outline-none disabled:opacity-50 transition-all"
                    />
                    <Button
                      size="sm"
                      onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(""); } : handleValidateCoupon}
                      disabled={isValidatingCoupon || (!couponCode && !appliedCoupon)}
                      className={`rounded-xl font-black ${appliedCoupon ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                    >
                      {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : (appliedCoupon ? "إلغاء" : "تطبيق")}
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-emerald-400 text-[10px] font-black flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      تم تطبيق خصم {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `${appliedCoupon.discountValue} ج.م`}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">الإجمالي</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-black text-orange-500 ${appliedCoupon ? 'line-through text-slate-500 text-lg' : ''}`}>ج.م {totalPrice}</p>
                      {appliedCoupon && (
                        <p className="text-2xl font-black text-emerald-400">ج.م {finalTotalPrice}</p>
                      )}
                    </div>
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
