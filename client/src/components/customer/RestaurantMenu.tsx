import React, { useState } from "react";
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

const WASLY_RESTAURANT = {
  id: 1,
  name: "مطعم وصلي",
  description: "أشهى أنواع الكريب والبيتزا والمشاوي في العبور",
  image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  rating: 4.9,
  deliveryTime: "20-40 دقيقة",
  address: "العبور الجديدة - حي المجد - خلف بنزينة بترومين",
  logo: "https://manus-user-assets.s3.amazonaws.com/wasly_logo.png"
};

const KHEDIVE_KOSHARY_RESTAURANT = {
  id: 2,
  name: "كشري الخديوي",
  description: "أصل الكشري المصري والطواجن البيتي في قلب العبور",
  image: "https://images.unsplash.com/photo-1562158074-9542793796c4?w=800&q=80",
  rating: 4.9,
  deliveryTime: "20-35 دقيقة",
  address: "7F49+V89 كشري الخديوي، العبور، القليوبية"
};

const AL_HOUT_RESTAURANT = {
  id: 3,
  name: "الحوت - Al-Hout",
  description: "أشهى المأكولات البحرية والأسماك",
  image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  rating: 5.0,
  deliveryTime: "25-40 دقيقة",
  address: "العبور الجديدة - حي المجد - مول ريتاج - بجانب مدرسة بلال بن رباح"
};

const WASLY_MENU: MenuItem[] = [
  // البيتزا
  { id: 101, name: "بيتزا فراخ (صغير)", category: "البيتزا", price: 120 },
  { id: 102, name: "بيتزا فراخ (كبير)", category: "البيتزا", price: 170 },
  { id: 103, name: "بيتزا جبن (صغير)", category: "البيتزا", price: 110 },
  { id: 104, name: "بيتزا جبن (كبير)", category: "البيتزا", price: 130 },
  { id: 105, name: "بيتزا مارغريتا (صغير)", category: "البيتزا", price: 90 },
  { id: 106, name: "بيتزا مارغريتا (كبير)", category: "البيتزا", price: 130 },
  { id: 107, name: "بيتزا كفتة (صغير)", category: "البيتزا", price: 130 },
  { id: 108, name: "بيتزا كفتة (كبير)", category: "البيتزا", price: 150 },
  { id: 109, name: "بيتزا سجق (صغير)", category: "البيتزا", price: 120 },
  { id: 110, name: "بيتزا سجق (كبير)", category: "البيتزا", price: 160 },
  { id: 111, name: "بيتزا استربس (صغير)", category: "البيتزا", price: 120 },
  { id: 112, name: "بيتزا استربس (كبير)", category: "البيتزا", price: 170 },
  { id: 113, name: "بيتزا شيش (صغير)", category: "البيتزا", price: 150 },
  { id: 114, name: "بيتزا شيش (كبير)", category: "البيتزا", price: 200 },
  { id: 115, name: "بيتزا برجر (صغير)", category: "البيتزا", price: 120 },
  { id: 116, name: "بيتزا برجر (كبير)", category: "البيتزا", price: 150 },
  { id: 117, name: "بيتزا شاورما (صغير)", category: "البيتزا", price: 120 },
  { id: 118, name: "بيتزا شاورما (كبير)", category: "البيتزا", price: 200 },
  { id: 119, name: "بيتزا مكس فراخ (صغير)", category: "البيتزا", price: 120 },
  { id: 120, name: "بيتزا مكس فراخ (كبير)", category: "البيتزا", price: 160 },
  { id: 121, name: "بيتزا مكس جبن (صغير)", category: "البيتزا", price: 100 },
  { id: 122, name: "بيتزا مكس جبن (كبير)", category: "البيتزا", price: 130 },
  { id: 123, name: "بيتزا فراخ رانش (صغير)", category: "البيتزا", price: 120 },
  { id: 124, name: "بيتزا فراخ رانش (كبير)", category: "البيتزا", price: 170 },
  // الكريب
  { id: 201, name: "كريب استربس (عادي)", category: "الكريب", price: 80 },
  { id: 202, name: "كريب استربس (سوبر)", category: "الكريب", price: 110 },
  { id: 203, name: "كريب بانيه (عادي)", category: "الكريب", price: 50 },
  { id: 204, name: "كريب بانيه (سوبر)", category: "الكريب", price: 70 },
  { id: 205, name: "كريب كفتة (عادي)", category: "الكريب", price: 70 },
  { id: 206, name: "كريب كفتة (سوبر)", category: "الكريب", price: 90 },
  { id: 207, name: "كريب برجر (عادي)", category: "الكريب", price: 80 },
  { id: 208, name: "كريب برجر (سوبر)", category: "الكريب", price: 100 },
  { id: 209, name: "كريب سجق (عادي)", category: "الكريب", price: 70 },
  { id: 210, name: "كريب سجق (سوبر)", category: "الكريب", price: 90 },
  { id: 211, name: "كريب بطاطس (عادي)", category: "الكريب", price: 40 },
  { id: 212, name: "كريب بطاطس (سوبر)", category: "الكريب", price: 60 },
  { id: 213, name: "كريب زنجر (عادي)", category: "الكريب", price: 100 },
  { id: 214, name: "كريب زنجر (سوبر)", category: "الكريب", price: 120 },
  { id: 215, name: "كريب جبن (عادي)", category: "الكريب", price: 40 },
  { id: 216, name: "كريب جبن (سوبر)", category: "الكريب", price: 70 },
  { id: 217, name: "كريب شيش (عادي)", category: "الكريب", price: 110 },
  // الوجبات
  { id: 301, name: "وجبة كفتة", category: "الوجبات", price: 100 },
  { id: 302, name: "وجبة شيش", category: "الوجبات", price: 100 },
  { id: 303, name: "وجبة ميكس", category: "الوجبات", price: 150 },
  // الميكسات
  { id: 401, name: "استربس بانيه", category: "الميكسات", price: 100 },
  { id: 402, name: "استربس بطاطس", category: "الميكسات", price: 100 },
  { id: 403, name: "استربس شيش", category: "الميكسات", price: 120 },
  { id: 404, name: "بانيه بطاطس", category: "الميكسات", price: 70 },
  { id: 405, name: "شيش بطاطس", category: "الميكسات", price: 110 },
  { id: 406, name: "شيش شاورما", category: "الميكسات", price: 120 },
  { id: 407, name: "شيش برجر", category: "الميكسات", price: 100 },
  // المكرونات
  { id: 501, name: "نجرسكو فراخ ع الفحم", category: "المكرونات", price: 70 },
  { id: 502, name: "نجرسكو فراخ ع الفحم ك", category: "المكرونات", price: 80 },
  { id: 503, name: "نجرسكو لحوم", category: "المكرونات", price: 70 },
  { id: 504, name: "نجرسكو جبن", category: "المكرونات", price: 50 },
  // المشاوي
  { id: 601, name: "فرخة مشوية كاملة", category: "المشاوي", price: 380 },
  { id: 602, name: "نص فرخة", category: "المشاوي", price: 190 },
  { id: 603, name: "ربع فرخة ورك", category: "المشاوي", price: 85 },
  { id: 604, name: "ربع فرخة صدر", category: "المشاوي", price: 100 },
  { id: 605, name: "ساندوتش كفتة", category: "المشاوي", price: 40 },
  { id: 606, name: "ساندوتش شيش", category: "المشاوي", price: 50 },
  { id: 607, name: "ساندوتش حواوشي", category: "المشاوي", price: 30 },
  // كيزر
  { id: 701, name: "ساندوتش برجر", category: "كيزر", price: 60 },
  { id: 702, name: "ساندوتش رانش", category: "كيزر", price: 60 },
  { id: 703, name: "ساندوتش زنجر", category: "كيزر", price: 70 },
  // إضافات
  { id: 801, name: "باكت بطاطس", category: "إضافات", price: 20 },
  { id: 802, name: "سلطة", category: "إضافات", price: 15 },
];

const KHEDIVE_KOSHARY_MENU: MenuItem[] = [
  { id: 2001, name: "كشري الخديوي (صغير)", category: "كشري", price: 25 },
  { id: 2002, name: "كشري الخديوي (وسط)", category: "كشري", price: 35 },
  { id: 2003, name: "كشري الخديوي (كبير)", category: "كشري", price: 45 },
  { id: 2004, name: "طاجن لحمة", category: "طواجن", price: 50 },
  { id: 2005, name: "طاجن فراخ", category: "طواجن", price: 55 },
];

const AL_HOUT_MENU: MenuItem[] = [
  { id: 3001, name: "كيلو سمك بلطي مشوي", category: "أسماك", price: 120 },
  { id: 3002, name: "كيلو بوري مشوي", category: "أسماك", price: 180 },
  { id: 3003, name: "وجبة سمك فيليه", category: "وجبات", price: 90 },
];

export default function RestaurantMenu() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
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

  const validateCoupon = trpc.coupons.validate.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon(data);
      toast.success("تم تطبيق الكوبون بنجاح!");
    },
    onError: (error) => {
      toast.error(error.message || "كود الخصم غير صحيح");
      setAppliedCoupon(null);
    }
  });

  const restaurants = [WASLY_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT, AL_HOUT_RESTAURANT];

  if (!selectedRestaurant) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">المطاعم المتاحة</h2>
          <p className="text-gray-500">اختر مطعمك المفضل واطلب الآن</p>
        </div>

        <div className="grid gap-6">
          {restaurants.map((restaurant) => (
            <motion.div
              key={restaurant.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRestaurant(restaurant)}
            >
              <Card className="overflow-hidden border-none shadow-lg cursor-pointer group">
                <div className="relative h-48">
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                    <div className="text-white">
                      <h3 className="text-xl font-bold">{restaurant.name}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{restaurant.rating}</span>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                    </div>
                    {restaurant.logo && (
                      <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-lg">
                        <img src={restaurant.logo} alt="logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{restaurant.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

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
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else {
      discount = appliedCoupon.discountValue;
    }
    
    return discount;
  };

  const discount = calculateDiscount();
  const total = subtotal - discount;

  const handleSubmitOrder = () => {
    if (!address) {
      toast.error("يرجى إدخال عنوان التوصيل");
      return;
    }
    setIsSubmitting(true);
    createOrder.mutate({
      restaurantId: selectedRestaurant.id,
      items: cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      address,
      notes,
      total,
      couponId: appliedCoupon?.id
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header مع أزرار اختيار المطاعم (Tabs) */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedRestaurant(null)}
                className="rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{selectedRestaurant.rating}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.deliveryTime}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full border-gray-200"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>

          {/* أزرار اختيار المطاعم (Tabs) */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {restaurants.map((r) => (
              <Button
                key={r.id}
                variant={selectedRestaurant.id === r.id ? "default" : "outline"}
                onClick={() => setSelectedRestaurant(r)}
                className={`rounded-xl whitespace-nowrap px-6 ${
                  selectedRestaurant.id === r.id 
                    ? "bg-orange-500 hover:bg-orange-600 text-white border-none shadow-md shadow-orange-100" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {r.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* القائمة */}
      <div className="p-4 space-y-8">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">{category}</h2>
            </div>
            <div className="grid gap-4">
              {menu.filter(item => item.category === category).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                        )}
                        <div className="text-orange-600 font-bold pt-1">
                          {item.price} <span className="text-[10px] text-gray-400 font-normal">ج.م</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => addToCart(item)}
                        className="w-10 h-10 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border-none shadow-none"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* شريط السلة السفلي (نظام السلة الأصلي) */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-40"
          >
            <Button
              onClick={() => setIsCartOpen(true)}
              className="w-full h-16 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-2xl flex items-center justify-between px-6 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">سلتك الحالية</div>
                  <div className="font-bold">{subtotal} ج.م</div>
                </div>
              </div>
              <div className="flex items-center gap-2 font-bold">
                عرض السلة
                <ChevronRight className="w-5 h-5 rotate-180" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة السلة (نظام السلة الأصلي) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] z-50 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">سلة الطلبات</h2>
                    <p className="text-xs text-gray-500">{cart.length} أصناف مختارة</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-orange-600 font-bold text-sm">{item.price} ج.م</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-orange-600"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 rounded-lg text-orange-600"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      عنوان التوصيل
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="رقم العمارة، الشقة، الدور، أو علامة مميزة..."
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-orange-500" />
                      ملاحظات إضافية
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ملاحظات إضافية للمطعم (اختياري)..."
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-orange-500" />
                      كود الخصم
                    </label>
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
