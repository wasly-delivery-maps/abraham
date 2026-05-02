import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2, ChevronRight, Star, Clock, Coins, Gift, Truck, CheckCircle2, Search, UtensilsCrossed, Pizza, Coffee, IceCream, Sandwich } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
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

// Helper to get category icon
const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("بيتزا")) return <Pizza className="h-5 w-5" />;
  if (c.includes("سندوتش") || c.includes("حواوشي") || c.includes("كريب")) return <Sandwich className="h-5 w-5" />;
  if (c.includes("حلو") || c.includes("أرز باللبن")) return <IceCream className="h-5 w-5" />;
  if (c.includes("مشروب") || c.includes("قهوة")) return <Coffee className="h-5 w-5" />;
  return <UtensilsCrossed className="h-5 w-5" />;
};

// Default images for menu items based on category
const getDefaultItemImage = (item: MenuItem) => {
  if (item.imageUrl) return item.imageUrl;
  const name = item.name.toLowerCase();
  if (name.includes("بيتزا")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=500&auto=format&fit=crop";
  if (name.includes("كريب")) return "https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=500&auto=format&fit=crop";
  if (name.includes("برجر")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop";
  if (name.includes("كشري")) return "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن")) return "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=500&auto=format&fit=crop";
  if (name.includes("سمك") || name.includes("جمبري")) return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=500&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop";
};

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

const AL_HOUT_MENU: MenuItem[] = [
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
  { id: 315, name: "مكرونة وايت صوص 🍝", category: "سوق السمك والطواجن", price: 180 },
  { id: 316, name: "مكرونة ريد صوص 🍝", category: "سوق السمك والطواجن", price: 180 },
  { id: 317, name: "كابوريا إسكندراني 🦀", category: "سوق السمك والطواجن", price: 130 },
  { id: 318, name: "فيليه وايت صوص 🐟", category: "سوق السمك والطواجن", price: 130 },
  { id: 301, name: "شوربة كريمة 🥣", category: "الشوربة", price: 140 },
  { id: 302, name: "شوربة جمبري حمراء 🥣", category: "الشوربة", price: 140 },
  { id: 303, name: "شوربة صيامي 🥣", category: "الشوربة", price: 120 },
  { id: 304, name: "ملوخية بالجمبري 🥘", category: "الشوربة", price: 100 },
];

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
  { id: 1001, name: "بيتزا فراخ صغير 🍕", category: "البيتزا", price: 120 },
  { id: 1002, name: "بيتزا فراخ كبير 🍕", category: "البيتزا", price: 170 },
  { id: 1003, name: "بيتزا جبن صغير 🍕", category: "البيتزا", price: 110 },
  { id: 1004, name: "بيتزا جبن كبير 🍕", category: "البيتزا", price: 130 },
  { id: 1005, name: "بيتزا مارغريتا صغير 🍕", category: "البيتزا", price: 90 },
  { id: 1006, name: "بيتزا مارغريتا كبير 🍕", category: "البيتزا", price: 130 },
  { id: 1007, name: "بيتزا كفتة صغير 🍕", category: "البيتزا", price: 130 },
  { id: 1008, name: "بيتزا كفتة كبير 🍕", category: "البيتزا", price: 150 },
  { id: 1009, name: "بيتزا سجق صغير 🍕", category: "البيتزا", price: 120 },
  { id: 1010, name: "بيتزا سجق كبير 🍕", category: "البيتزا", price: 160 },
  { id: 1025, name: "كريب استربس عادي 🌯", category: "الكريب", price: 80 },
  { id: 1026, name: "كريب استربس سوبر 🌯", category: "الكريب", price: 110 },
  { id: 1027, name: "كريب بانيه عادي 🌯", category: "الكريب", price: 50 },
  { id: 1028, name: "كريب بانيه سوبر 🌯", category: "الكريب", price: 70 },
  { id: 1063, name: "ساندوتش برجر 🍔", category: "كيزر", price: 60 },
  { id: 1064, name: "ساندوتش رانش 🍔", category: "كيزر", price: 60 },
  { id: 1065, name: "ساندوتش زنجر 🍔", category: "كيزر", price: 70 },
  { id: 1066, name: "باكت بطاطس 🍟", category: "إضافات", price: 20 },
];

const RESTAURANTS = [ROLL_WE_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT, AL_HOUT_RESTAURANT];
const MENUS: Record<number, MenuItem[]> = {
  1: ROLL_WE_MENU,
  2: KHEDIVE_KOSHARY_MENU,
  3: AL_HOUT_MENU,
};

interface RestaurantMenuProps {
  isExternalCartOpen?: boolean;
  onExternalCartClose?: () => void;
}

export function RestaurantMenu({ isExternalCartOpen, onExternalCartClose }: RestaurantMenuProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addressDescription, setAddressDescription] = useState("");
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

  const handleCheckout = async () => {
    if (!selectedRestaurant || cart.length === 0 || !addressDescription) {
      toast.error("يرجى إكمال البيانات أولاً");
      return;
    }
    setIsLoading(true);
    try {
      const orderItems = cart.map(i => `${i.name} x${i.quantity}`).join(", ");
      await createRestaurantOrderMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        items: orderItems,
        totalPrice: finalTotalPrice,
        address: addressDescription,
        location: { latitude: 0, longitude: 0 },
      });
      toast.success("تم إرسال طلبك بنجاح! 🎉");
      setCart([]);
      setIsCartExpanded(false);
    } catch (error: any) {
      toast.error(error.message || "فشل إرسال الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedRestaurant) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x px-4" dir="rtl">
        {RESTAURANTS.map((restaurant) => (
          <motion.div
            key={restaurant.id}
            whileHover={{ y: -5 }}
            className="min-w-[300px] snap-center"
            onClick={() => setSelectedRestaurant(restaurant)}
          >
            <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-[#121214] border border-white/5 group cursor-pointer h-full">
              <div className="h-40 w-full relative overflow-hidden">
                <img src={restaurant.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121214] to-transparent"></div>
              </div>
              <CardContent className="p-6 relative">
                <div className="absolute -top-10 right-6 h-16 w-16 rounded-2xl bg-white p-1 shadow-2xl border-2 border-[#FF6B00]">
                  <img src={restaurant.logoUrl} className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-black text-white mb-1">{restaurant.name}</h3>
                  <p className="text-gray-500 text-xs font-medium line-clamp-1 mb-4">{restaurant.description}</p>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1 text-[#FFD700]"><Star className="h-3 w-3 fill-[#FFD700]" /> {restaurant.rating}</div>
                    <div className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" /> {restaurant.deliveryTime}</div>
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
    <div className="space-y-6 pb-32 min-h-screen bg-[#0A0A0B]" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedRestaurant(null)}
          className="h-12 w-12 rounded-2xl bg-white/5 text-white hover:bg-white/10"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-black text-white">{selectedRestaurant.name}</h1>
          <p className="text-[10px] text-[#FF6B00] font-bold tracking-widest uppercase">Premium Menu</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Categories Bar - Circular Style */}
      <div className="sticky top-0 z-40 bg-[#0A0A0B]/80 backdrop-blur-xl py-4 border-b border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 px-6 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                selectedCategory === category 
                ? "bg-[#FF6B00] border-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.4)] scale-110" 
                : "bg-[#121214] border-white/5 hover:border-[#FF6B00]/30"
              }`}>
                <div className={selectedCategory === category ? "text-white" : "text-gray-400 group-hover:text-[#FF6B00]"}>
                  {getCategoryIcon(category)}
                </div>
              </div>
              <span className={`text-[11px] font-black transition-colors ${
                selectedCategory === category ? "text-white" : "text-gray-500"
              }`}>{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid - 2 Columns as in Screenshot */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="overflow-hidden border-none bg-[#121214] rounded-[2rem] border border-white/5 hover:border-[#FF6B00]/20 transition-all duration-500 h-full flex flex-col">
                <div className="relative h-32 sm:h-40 w-full overflow-hidden">
                  <img 
                    src={getDefaultItemImage(item)} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-60"></div>
                  <button
                    onClick={() => addToCart(item)}
                    className="absolute bottom-3 left-3 h-10 w-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/20 active:scale-90 transition-all"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-white text-sm line-clamp-1 group-hover:text-[#FF6B00] transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 font-medium line-clamp-2 leading-relaxed">أفضل المكونات الطازجة بلمسة وصلي الخاصة</p>
                  </div>
                  <div className="pt-3">
                    <p className="text-[#FF6B00] font-black text-sm">
                      {item.price === 0 ? "سعر اليوم" : `${item.price} ج.م`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-[100]">
          <Button 
            onClick={() => setIsCartExpanded(true)}
            className="w-full h-16 bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-2xl shadow-[0_15px_30px_rgba(255,107,0,0.3)] flex items-center justify-between px-6 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 h-8 w-8 rounded-lg flex items-center justify-center font-black">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </div>
              <span className="font-black">عرض السلة</span>
            </div>
            <span className="font-black text-lg">{totalPrice} ج.م</span>
          </Button>
        </div>
      )}

      {/* Cart Overlay */}
      <AnimatePresence>
        {isCartExpanded && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] p-4 flex items-end justify-center"
            onClick={() => setIsCartExpanded(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-[#121214] w-full max-w-lg rounded-[3rem] border border-white/10 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white">سلتك الملكية</h2>
                  <button onClick={() => setIsCartExpanded(false)} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center"><X className="text-white" /></button>
                </div>
                
                <div className="max-h-[40vh] overflow-y-auto space-y-4 no-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex-1">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[#FF6B00] font-black text-sm">{item.price * item.quantity} ج.م</p>
                      </div>
                      <div className="flex items-center gap-4 bg-[#0A0A0B] p-1 rounded-xl">
                        <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 flex items-center justify-center text-gray-400"><Minus size={16} /></button>
                        <span className="font-black text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 flex items-center justify-center text-[#FF6B00]"><Plus size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <Input 
                    placeholder="اكتب عنوانك بالتفصيل هنا..." 
                    className="h-14 bg-[#0A0A0B] border-white/10 rounded-xl text-white focus:border-[#FF6B00]"
                    value={addressDescription}
                    onChange={e => setAddressDescription(e.target.value)}
                  />
                  <Button 
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full h-16 bg-[#FF6B00] text-white font-black text-lg rounded-2xl"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : `تأكيد الطلب (${finalTotalPrice} ج.م)`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
