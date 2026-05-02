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

const getAccurateItemImage = (item: MenuItem) => {
  if (item.imageUrl) return item.imageUrl;
  const name = item.name.toLowerCase();
  if (name.includes("كشري")) return "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن لحمة")) return "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن فراخ")) return "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop";
  if (name.includes("طاجن") || name.includes("وايت صوص")) return "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=500&auto=format&fit=crop";
  if (name.includes("حواوشي")) return "https://images.unsplash.com/photo-1626078299034-9c35ec7739bb?q=80&w=500&auto=format&fit=crop";
  if (name.includes("كريب")) return "https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بيتزا فراخ")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بيتزا جبن") || name.includes("مارغريتا")) return "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بيتزا")) return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بلطي") || name.includes("سمك")) return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=500&auto=format&fit=crop";
  if (name.includes("جمبري")) return "https://images.unsplash.com/photo-1559740038-64b4519a63c0?q=80&w=500&auto=format&fit=crop";
  if (name.includes("برجر")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop";
  if (name.includes("أرز باللبن")) return "https://images.unsplash.com/photo-1590080874088-eec64895b423?q=80&w=500&auto=format&fit=crop";
  if (name.includes("بطاطس")) return "https://images.unsplash.com/photo-1573015084184-213019c3c74b?q=80&w=500&auto=format&fit=crop";
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

// مطعم "كشري الخديوي" - القائمة الكاملة
const KHEDIVE_KOSHARY_MENU: MenuItem[] = [
  { id: 101, name: "علبة كمالة 🥣", category: "العلب", price: 15 },
  { id: 102, name: "علبة صغيرة 🥣", category: "العلب", price: 17 },
  { id: 103, name: "علبة الخديوي 👑", category: "العلب", price: 25 },
  { id: 104, name: "لوكس الخديوي ✨", category: "العلب", price: 30 },
  { id: 105, name: "سوبر الخديوي 🔥", category: "العلب", price: 35 },
  { id: 106, name: "أسبيشيال الخديوي 🌟", category: "العلب", price: 40 },
  { id: 107, name: "وليمة الخديوي 🥘", category: "العلب", price: 45 },
  { id: 108, name: "جامبو الخديوي 🐘", category: "العلب", price: 50 },
  { id: 109, name: "طاجن عادة 🥘", category: "الطواجن", price: 30 },
  { id: 110, name: "طاجن لحمة 🥩", category: "الطواجن", price: 45 },
  { id: 111, name: "طاجن سجق 🌭", category: "الطواجن", price: 45 },
  { id: 112, name: "طاجن كبدة 🥘", category: "الطواجن", price: 45 },
  { id: 113, name: "طاجن فراخ 🍗", category: "الطواجن", price: 50 },
  { id: 114, name: "طاجن خضار 🥦", category: "الطواجن", price: 50 },
  { id: 115, name: "طاجن وايت صوص 🥛", category: "طواجن وايت صوص", price: 80 },
  { id: 118, name: "طاجن فراخ وايت صوص 🍗", category: "طواجن وايت صوص", price: 90 },
  { id: 121, name: "موتزاريللا سادة 🧀", category: "طواجن موتزاريللا", price: 53 },
  { id: 122, name: "موتزاريللا لحمة 🥩", category: "طواجن موتزاريللا", price: 68 },
  { id: 132, name: "حواوشي سادة 🥙", category: "الحواوشي", price: 35 },
  { id: 133, name: "حواوشي سجق 🌭", category: "الحواوشي", price: 60 },
  { id: 137, name: "أرز باللبن سادة 🍚", category: "الحلويات", price: 20 },
  { id: 138, name: "أرز باللبن فرن 🍮", category: "الحلويات", price: 22 },
  { id: 148, name: "دقة 🍶", category: "الإضافات", price: 9 },
  { id: 152, name: "تقلية 🧅", category: "الإضافات", price: 12 },
];

// مطعم "الحوت" - القائمة الكاملة
const AL_HOUT_MENU: MenuItem[] = [
  { id: 319, name: "سمك بلطي 🐟", category: "الأسماك", price: 100 },
  { id: 320, name: "سمك بوري 🐟", category: "الأسماك", price: 150 },
  { id: 323, name: "سمك مكرونة 🐟", category: "الأسماك", price: 120 },
  { id: 330, name: "جمبري إسكندراني 🍤", category: "الأسماك", price: 250 },
  { id: 301, name: "شوربة كريمة 🥣", category: "الشوربة", price: 140 },
  { id: 302, name: "شوربة جمبري حمراء 🥣", category: "الشوربة", price: 140 },
  { id: 304, name: "ملوخية بالجمبري 🥘", category: "الشوربة", price: 100 },
];

// مطعم "رول وي" - القائمة الكاملة
const ROLL_WE_MENU: MenuItem[] = [
  { id: 1001, name: "بيتزا فراخ صغير 🍕", category: "البيتزا", price: 120 },
  { id: 1002, name: "بيتزا فراخ كبير 🍕", category: "البيتزا", price: 170 },
  { id: 1005, name: "بيتزا مارغريتا صغير 🍕", category: "البيتزا", price: 90 },
  { id: 1006, name: "بيتزا مارغريتا كبير 🍕", category: "البيتزا", price: 130 },
  { id: 1025, name: "كريب استربس عادي 🌯", category: "الكريب", price: 80 },
  { id: 1026, name: "كريب استربس سوبر 🌯", category: "الكريب", price: 110 },
  { id: 1063, name: "ساندوتش برجر 🍔", category: "كيزر", price: 60 },
  { id: 1066, name: "باكت بطاطس 🍟", category: "إضافات", price: 20 },
];

const RESTAURANTS = [
  { id: 1, name: "مطعم وصلي", phone: "01557564373", whatsappPhone: "201557564373", address: "العبور الجديدة - مطعم وصلي", description: "أشهى المأكولات والبيتزا والكريب", logoUrl: "https://ui-avatars.com/api/?name=WS&background=f97316&color=fff&size=128&bold=true", coverUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop", rating: "5.0", deliveryTime: "20-35 دقيقة", location: { latitude: 30.2750625, longitude: 31.5256719 } },
  { id: 2, name: "كشري الخديوي", phone: "01032809502", whatsappPhone: "201032809502", address: "7F49+V89 كشري الخديوي، العبور", description: "أصل الكشري المصري والطواجن البيتي", logoUrl: "https://ui-avatars.com/api/?name=KK&background=e11d48&color=fff&size=128&bold=true", coverUrl: "https://web-production-0eb1b.up.railway.app/uploads/khedive_koshary_logo_fb.webp", rating: "4.9", deliveryTime: "20-35 دقيقة", location: { latitude: 30.2570159, longitude: 31.4682469 } },
  { id: 3, name: "الحوت - Al-Hout", phone: "01557564373", whatsappPhone: "201557564373", address: "العبور الجديدة - حي المجد", description: "أشهى المأكولات البحرية والأسماك", logoUrl: "https://ui-avatars.com/api/?name=AH&background=0369a1&color=fff&size=128&bold=true", coverUrl: "/assets/al-hout-blue-whale.jpg", rating: "5.0", deliveryTime: "25-40 دقيقة", location: { latitude: 30.2767773, longitude: 31.5299175 } }
];

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
      await createRestaurantOrderMutation.mutateAsync({ restaurantId: selectedRestaurant.id, items: orderItems, totalPrice: totalPrice, address: addressDescription, location: { latitude: 0, longitude: 0 } });
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
            <Card className="overflow-hidden border-none shadow-lg rounded-[2.5rem] bg-white border border-slate-100 group cursor-pointer h-full">
              <div className="h-40 w-full relative overflow-hidden">
                <img src={restaurant.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              </div>
              <CardContent className="p-6 relative">
                <div className="absolute -top-10 right-6 h-16 w-16 rounded-2xl bg-white p-1 shadow-xl border-2 border-orange-500">
                  <img src={restaurant.logoUrl} className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-black text-slate-900 mb-1">{restaurant.name}</h3>
                  <p className="text-slate-400 text-xs font-medium line-clamp-1 mb-4">{restaurant.description}</p>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1 text-orange-500"><Star className="h-3 w-3 fill-orange-500" /> {restaurant.rating}</div>
                    <div className="flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" /> {restaurant.deliveryTime}</div>
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
    <div className="space-y-6 pb-48 min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedRestaurant(null)} className="h-12 w-12 rounded-2xl bg-white text-slate-900 shadow-sm border border-slate-100">
          <ChevronRight className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-black text-slate-900">{selectedRestaurant.name}</h1>
          <p className="text-[10px] text-orange-600 font-bold tracking-widest uppercase">Premium Menu</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl py-4 border-b border-slate-100 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 px-6 min-w-max">
          {categories.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className="flex flex-col items-center gap-2 group">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${selectedCategory === category ? "bg-orange-600 border-orange-600 shadow-lg shadow-orange-100 scale-110" : "bg-white border-slate-100 hover:border-orange-200"}`}>
                <div className={selectedCategory === category ? "text-white" : "text-slate-400 group-hover:text-orange-600"}>{getCategoryIcon(category)}</div>
              </div>
              <span className={`text-[11px] font-black ${selectedCategory === category ? "text-orange-600" : "text-slate-500"}`}>{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
              <Card className="overflow-hidden border-none bg-white rounded-[2rem] border border-slate-100 hover:border-orange-200 transition-all duration-500 h-full flex flex-col shadow-sm">
                <div className="relative h-32 sm:h-40 w-full overflow-hidden">
                  <img src={getAccurateItemImage(item)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"></div>
                  <button onClick={() => addToCart(item)} className="absolute bottom-3 left-3 h-10 w-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-100 active:scale-90 transition-all">
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-sm line-clamp-1 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1">مكونات طازجة وجودة عالية</p>
                  </div>
                  <div className="pt-3">
                    <p className="text-orange-600 font-black text-sm">{item.price} ج.م</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sticky Cart Bar - Fixed ABOVE Bottom Nav */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-[100]">
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="w-full">
            <Button onClick={() => setIsCartExpanded(true)} className="w-full h-20 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] shadow-xl shadow-orange-200 flex items-center justify-between px-8 transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg">{cart.reduce((sum, i) => sum + i.quantity, 0)}</div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] p-4 flex items-end justify-center" onClick={() => setIsCartExpanded(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900">سلتك الملكية</h2>
                  <button onClick={() => setIsCartExpanded(false)} className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                </div>
                <div className="max-h-[40vh] overflow-y-auto space-y-4 no-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-orange-600 font-black text-sm">{item.price * item.quantity} ج.م</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100">
                        <button onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-900"><Minus size={16} /></button>
                        <span className="font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 flex items-center justify-center text-orange-600 hover:text-orange-700"><Plus size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <Input placeholder="اكتب عنوانك بالتفصيل هنا..." className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 text-lg focus:border-orange-600 transition-all" value={addressDescription} onChange={e => setAddressDescription(e.target.value)} />
                  <Button onClick={handleCheckout} disabled={isLoading} className="w-full h-20 bg-orange-600 text-white font-black text-xl rounded-[2rem] shadow-xl shadow-orange-100">
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
