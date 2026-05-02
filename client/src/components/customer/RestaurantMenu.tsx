import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X, ChevronRight, Star, Clock, Search, UtensilsCrossed, Pizza, Coffee, IceCream, Sandwich, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

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

// دالة متطورة لاختيار صورة تعبر بدقة عن الصنف بناءً على اسمه
const getAccurateItemImage = (item: MenuItem) => {
  if (item.imageUrl) return item.imageUrl;
  const name = item.name.toLowerCase();
  
  // الكشري والطواجن
  if (name.includes("كشري")) return "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن لحمة")) return "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن فراخ")) return "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن") || name.includes("وايت صوص")) return "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=500&auto=format&fit=crop";
  
  // الحواوشي والكريب
  if (name.includes("حواوشي")) return "https://images.unsplash.com/photo-1626078299034-9c35ec7739bb?q=80&w=500&auto=format&fit=crop";
  if (name.includes("كريب")) return "https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=500&auto=format&fit=crop";
  
  // البيتزا
  if (name.includes("بيتزا فراخ")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بيتزا جبن") || name.includes("مارغريتا")) return "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بيتزا")) return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=500&auto=format&fit=crop";
  
  // الأسماك
  if (name.includes("بلطي") || name.includes("سمك")) return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=500&auto=format&fit=crop";
  if (name.includes("جمبري")) return "https://images.unsplash.com/photo-1559740038-64b4519a63c0?q=80&w=500&auto=format&fit=crop";
  if (name.includes("شوربة") || name.includes("سي فود")) return "https://images.unsplash.com/photo-1547592110-8036039160ad?q=80&w=500&auto=format&fit=crop";
  
  // البرجر والمشاوي
  if (name.includes("برجر")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop";
  if (name.includes("فرخة") || name.includes("مشاوي")) return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=500&auto=format&fit=crop";
  
  // الحلويات
  if (name.includes("أرز باللبن")) return "https://images.unsplash.com/photo-1590080874088-eec64895b423?q=80&w=500&auto=format&fit=crop";
  if (name.includes("قنبلة") || name.includes("كيك")) return "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=500&auto=format&fit=crop";
  
  // الإضافات
  if (name.includes("بطاطس")) return "https://images.unsplash.com/photo-1573015084184-213019c3c74b?q=80&w=500&auto=format&fit=crop";
  if (name.includes("سلطة")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=500&auto=format&fit=crop";

  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop";
};

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("بيتزا")) return <Pizza className="h-5 w-5" />;
  if (c.includes("سندوتش") || c.includes("حواوشي") || c.includes("كريب") || c.includes("كيزر")) return <Sandwich className="h-5 w-5" />;
  if (c.includes("حلو") || c.includes("أرز باللبن") || c.includes("حلويات")) return <IceCream className="h-5 w-5" />;
  if (c.includes("مشروب") || c.includes("شوربة")) return <Coffee className="h-5 w-5" />;
  return <UtensilsCrossed className="h-5 w-5" />;
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
  location: { latitude: 30.2570159, longitude: 31.4682469 }
};

const KHEDIVE_KOSHARY_MENU: MenuItem[] = [
  { id: 101, name: "علبة كمالة 🥣", category: "العلب", price: 15 },
  { id: 103, name: "علبة الخديوي 👑", category: "العلب", price: 25 },
  { id: 110, name: "طاجن لحمة 🥩", category: "الطواجن", price: 45 },
  { id: 113, name: "طاجن فراخ 🍗", category: "الطواجن", price: 50 },
  { id: 118, name: "طاجن فراخ وايت صوص 🍗", category: "طواجن وايت صوص", price: 90 },
  { id: 132, name: "حواوشي سادة 🥙", category: "الحواوشي", price: 35 },
  { id: 137, name: "أرز باللبن سادة 🍚", category: "الحلويات", price: 20 },
  { id: 152, name: "تقلية 🧅", category: "الإضافات", price: 12 },
];

// مطعم "الحوت" - البيانات
const AL_HOUT_RESTAURANT: Restaurant = {
  id: 3,
  name: "الحوت - Al-Hout",
  phone: "01557564373",
  whatsappPhone: "201557564373",
  address: "العبور الجديدة - حي المجد - مول ريتاج",
  description: "أشهى المأكولات البحرية والأسماك",
  logoUrl: "https://ui-avatars.com/api/?name=AH&background=0369a1&color=fff&size=128&bold=true",
  coverUrl: "/assets/al-hout-blue-whale.jpg",
  rating: "5.0",
  deliveryTime: "25-40 دقيقة",
  location: { latitude: 30.2767773, longitude: 31.5299175 }
};

const AL_HOUT_MENU: MenuItem[] = [
  { id: 319, name: "سمك بلطي 🐟", category: "الأسماك", price: 100 },
  { id: 330, name: "جمبري إسكندراني 🍤", category: "الأسماك", price: 250 },
  { id: 301, name: "شوربة كريمة 🥣", category: "الشوربة", price: 140 },
];

// مطعم "رول وي" - البيانات
const ROLL_WE_RESTAURANT: Restaurant = {
  id: 1,
  name: "مطعم وصلي",
  phone: "01557564373",
  whatsappPhone: "201557564373",
  address: "العبور الجديدة - مطعم وصلي",
  description: "أشهى المأكولات والبيتزا والكريب",
  logoUrl: "https://ui-avatars.com/api/?name=WS&background=f97316&color=fff&size=128&bold=true",
  coverUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
  rating: "5.0",
  deliveryTime: "20-35 دقيقة",
  location: { latitude: 30.2750625, longitude: 31.5256719 }
};

const ROLL_WE_MENU: MenuItem[] = [
  { id: 1001, name: "بيتزا فراخ 🍕", category: "البيتزا", price: 120 },
  { id: 1005, name: "بيتزا مارغريتا 🍕", category: "البيتزا", price: 90 },
  { id: 1025, name: "كريب استربس 🌯", category: "الكريب", price: 80 },
  { id: 1063, name: "ساندوتش برجر 🍔", category: "كيزر", price: 60 },
];

const RESTAURANTS = [ROLL_WE_RESTAURANT, KHEDIVE_KOSHARY_RESTAURANT, AL_HOUT_RESTAURANT];
const MENUS: Record<number, MenuItem[]> = { 1: ROLL_WE_MENU, 2: KHEDIVE_KOSHARY_MENU, 3: AL_HOUT_MENU };

export function RestaurantMenu() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addressDescription, setAddressDescription] = useState("");

  const createRestaurantOrderMutation = trpc.orders.createRestaurantOrder.useMutation();

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`تم إضافة ${item.name} للسلة`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0));
  };

  useEffect(() => {
    if (selectedRestaurant) {
      const menu = MENUS[selectedRestaurant.id] || [];
      if (menu.length > 0) setSelectedCategory(menu[0].category);
    }
  }, [selectedRestaurant]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!selectedRestaurant || cart.length === 0 || !addressDescription) {
      toast.error("يرجى إكمال البيانات");
      return;
    }
    setIsLoading(true);
    try {
      const orderItems = cart.map(i => `${i.name} x${i.quantity}`).join(", ");
      await createRestaurantOrderMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        items: orderItems,
        totalPrice: totalPrice,
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
          <motion.div key={restaurant.id} whileHover={{ y: -5 }} className="min-w-[300px] snap-center" onClick={() => setSelectedRestaurant(restaurant)}>
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
    <div className="space-y-6 pb-40 min-h-screen bg-[#0A0A0B]" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedRestaurant(null)} className="h-12 w-12 rounded-2xl bg-white/5 text-white hover:bg-white/10">
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

      {/* Categories */}
      <div className="sticky top-0 z-40 bg-[#0A0A0B]/80 backdrop-blur-xl py-4 border-b border-white/5 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 px-6 min-w-max">
          {categories.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className="flex flex-col items-center gap-2 group">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${selectedCategory === category ? "bg-[#FF6B00] border-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.4)] scale-110" : "bg-[#121214] border-white/5 hover:border-[#FF6B00]/30"}`}>
                <div className={selectedCategory === category ? "text-white" : "text-gray-400 group-hover:text-[#FF6B00]"}>{getCategoryIcon(category)}</div>
              </div>
              <span className={`text-[11px] font-black ${selectedCategory === category ? "text-white" : "text-gray-500"}`}>{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
              <Card className="overflow-hidden border-none bg-[#121214] rounded-[2rem] border border-white/5 hover:border-[#FF6B00]/20 transition-all duration-500 h-full flex flex-col">
                <div className="relative h-32 sm:h-40 w-full overflow-hidden">
                  <img src={getAccurateItemImage(item)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-60"></div>
                  <button onClick={() => addToCart(item)} className="absolute bottom-3 left-3 h-10 w-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-white text-sm line-clamp-1 group-hover:text-[#FF6B00] transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 font-medium line-clamp-1">مكونات طازجة وجودة عالية</p>
                  </div>
                  <div className="pt-3">
                    <p className="text-[#FF6B00] font-black text-sm">{item.price} ج.م</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sticky Cart Bar - Fixed and Always Visible when items exist */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-[100]">
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="w-full">
            <Button 
              onClick={() => setIsCartExpanded(true)}
              className="w-full h-20 bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-[2rem] shadow-[0_20px_50px_rgba(255,107,0,0.4)] flex items-center justify-between px-8 transition-all active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">عرض السلة</p>
                  <p className="font-black text-xl">استكمال الطلب</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl">{totalPrice}</span>
                <span className="text-sm font-bold opacity-80">ج.م</span>
              </div>
            </Button>
          </motion.div>
        </div>
      )}

      {/* Cart Overlay */}
      <AnimatePresence>
        {isCartExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] p-4 flex items-end justify-center" onClick={() => setIsCartExpanded(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#121214] w-full max-w-lg rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white">سلتك الملكية</h2>
                  <button onClick={() => setIsCartExpanded(false)} className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white"><X size={24} /></button>
                </div>
                <div className="max-h-[40vh] overflow-y-auto space-y-4 no-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex-1">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[#FF6B00] font-black text-sm">{item.price * item.quantity} ج.م</p>
                      </div>
                      <div className="flex items-center gap-4 bg-[#0A0A0B] p-2 rounded-xl border border-white/5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white"><Minus size={16} /></button>
                        <span className="font-black text-white w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 flex items-center justify-center text-[#FF6B00] hover:text-[#FF8533]"><Plus size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <Input placeholder="اكتب عنوانك بالتفصيل هنا..." className="h-16 bg-[#0A0A0B] border-white/10 rounded-2xl text-white text-lg focus:border-[#FF6B00] transition-all" value={addressDescription} onChange={e => setAddressDescription(e.target.value)} />
                  <Button onClick={handleCheckout} disabled={isLoading} className="w-full h-20 bg-[#FF6B00] text-white font-black text-xl rounded-[2rem] shadow-xl shadow-[#FF6B00]/20">
                    {isLoading ? <Loader2 className="animate-spin" /> : `تأكيد الطلب (${totalPrice} ج.م)`}
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
