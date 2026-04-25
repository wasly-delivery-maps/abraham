import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Star, Clock, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description?: string;
}

interface Restaurant {
  id: number;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  category: string;
  address: string;
  whatsappPhone: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const ROLL_WE_RESTAURANT: Restaurant = {
  id: 1,
  name: "مطعم وصلي 🌯",
  image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  rating: 4.8,
  deliveryTime: "25-35 دقيقة",
  minOrder: 50,
  category: "ساندوتشات ووجبات",
  address: "العبور، الحي الأول، سنتر الحجاز",
  whatsappPhone: "201032809502",
  location: { latitude: 30.2350, longitude: 31.4650 }
};

const KHEDIVE_KOSHARY_RESTAURANT: Restaurant = {
  id: 2,
  name: "كشري الخديوي 🥣",
  image: "https://images.unsplash.com/photo-1589187151032-573a91317445?w=800&q=80",
  rating: 4.7,
  deliveryTime: "20-30 دقيقة",
  minOrder: 30,
  category: "كشري مصري",
  address: "العبور، الحي الثاني، سنتر الياسمين",
  whatsappPhone: "201032809502",
  location: { latitude: 30.2380, longitude: 31.4680 }
};

const AL_HOUT_RESTAURANT: Restaurant = {
  id: 3,
  name: "أسماك الحوت 🐟",
  image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  rating: 4.9,
  deliveryTime: "40-50 دقيقة",
  minOrder: 150,
  category: "مأكولات بحرية",
  address: "العبور، الحي التاسع",
  whatsappPhone: "201032809502",
  location: { latitude: 30.2450, longitude: 31.4750 }
};

const ROLL_WE_MENU: MenuItem[] = [
  { id: 101, name: "شاورما دجاج سوبر 🌯", category: "ساندوتشات", price: 85 },
  { id: 102, name: "شاورما لحم سوبر 🌯", category: "ساندوتشات", price: 95 },
  { id: 103, name: "وجبة عربي دجاج 🍱", category: "وجبات", price: 120 },
  { id: 104, name: "وجبة عربي لحم 🍱", category: "وجبات", price: 140 },
];

const KHEDIVE_KOSHARY_MENU: MenuItem[] = [
  { id: 201, name: "علبة كشري صغير 🥣", category: "كشري", price: 35 },
  { id: 202, name: "علبة كشري وسط 🥣", category: "كشري", price: 45 },
  { id: 203, name: "علبة كشري كبير 🥣", category: "كشري", price: 60 },
  { id: 204, name: "طاجن لحم بالفرن 🥘", category: "طواجن", price: 75 },
];

const AL_HOUT_MENU: MenuItem[] = [
  { id: 301, name: "كيلو سمك بلطي مشوي 🐟", category: "أسماك", price: 160 },
  { id: 302, name: "كيلو سمك بوري سنجاري 🐟", category: "أسماك", price: 220 },
  { id: 303, name: "وجبة فيليه مقلي 🍱", category: "وجبات", price: 180 },
  { id: 304, name: "شوربة سي فود 🥣", category: "شوربة", price: 140 },
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
  const { addToCart } = useCart();

  useEffect(() => {
    if (selectedRestaurant) {
      const menu = MENUS[selectedRestaurant.id] || [];
      if (menu.length > 0) {
        setSelectedCategory(menu[0].category);
      }
    }
  }, [selectedRestaurant]);

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
                <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                  <span className="text-[10px] font-black text-slate-900">{restaurant.rating}</span>
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-black text-slate-900 mb-1">{restaurant.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 mb-3">{restaurant.category}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-black">{restaurant.deliveryTime}</span>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <ChevronRight className="h-4 w-4 text-orange-500 group-hover:text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  const menu = MENUS[selectedRestaurant.id] || [];
  const categories = Array.from(new Set(menu.map(item => item.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedRestaurant(null)} className="rounded-xl hover:bg-slate-100">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-black text-slate-900">{selectedRestaurant.name}</h2>
            <p className="text-[10px] font-bold text-slate-400">قائمة الطعام</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-6 font-black text-xs transition-all ${selectedCategory === category ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {menu.filter(item => item.category === selectedCategory).map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group"
            >
              <div className="flex-1">
                <h4 className="font-black text-slate-900 text-sm mb-1">{item.name}</h4>
                <p className="text-orange-600 font-black text-sm">ج.م {item.price}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => addToCart(item)}
                className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
              >
                <Plus className="h-6 w-6" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
