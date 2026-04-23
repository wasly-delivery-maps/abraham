import { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, MessageCircle, MapPin, Phone, Loader2, ChevronRight, Star, Clock, Coins, Gift, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Restaurant {
  id: number;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  image: string;
  address: string;
  phone: string;
  menu: MenuItem[];
}

const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "كشري الخديوي",
    category: "كشري مصري",
    rating: 4.8,
    deliveryTime: "20-30 دقيقة",
    minOrder: 50,
    image: "https://images.unsplash.com/photo-1562158074-934339958745?w=800&auto=format&fit=crop&q=60",
    address: "7F49+V89 كشري الخديوي، العبور، القليوبية",
    phone: "01234567890",
    menu: [
      { id: 101, name: "علبة كشري سوبر", description: "أرز، مكرونة، عدس، حمص، بصل مقرمش، صلصة ودقة", price: 45, image: "https://images.unsplash.com/photo-1562158074-934339958745?w=400&auto=format&fit=crop&q=60", category: "كشري" },
      { id: 102, name: "طاجن لحمة", description: "مكرونة بالفرن مع اللحم المفروم والصلصة", price: 65, image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=60", category: "طواجن" },
      { id: 103, name: "أرز بلبن", description: "أرز باللبن كريمي ومحلى", price: 25, image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop&q=60", category: "حلويات" },
    ]
  },
  {
    id: 2,
    name: "برجر كينج",
    category: "وجبات سريعة",
    rating: 4.5,
    deliveryTime: "30-45 دقيقة",
    minOrder: 100,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&auto=format&fit=crop&q=60",
    address: "العبور الجديدة - حي المجد - مول ريتاج - بجانب مدرسة بلال بن رباح الثانوية",
    phone: "01098765432",
    menu: [
      { id: 201, name: "وجبة ووبر", description: "ساندوتش ووبر مع بطاطس وبيبسي", price: 185, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60", category: "وجبات" },
      { id: 202, name: "تشيكن رويال", description: "ساندوتش دجاج مقرمش مع مايونيز وخس", price: 145, image: "https://images.unsplash.com/photo-1610614819513-58e34989848b?w=400&auto=format&fit=crop&q=60", category: "ساندوتشات" },
      { id: 203, name: "بطاطس مقلية", description: "بطاطس مقرمشة ومملحة", price: 40, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60", category: "جانبيات" },
    ]
  },
  {
    id: 3,
    name: "بيتزا هت",
    category: "بيتزا",
    rating: 4.6,
    deliveryTime: "25-40 دقيقة",
    minOrder: 120,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=60",
    address: "7GG2+462 ملعب حي الحرية, العبور، محافظة القليوبية 6363322",
    phone: "01122334455",
    menu: [
      { id: 301, name: "بيتزا سوبر سوبريم", description: "لحم بقري، بيبيروني، فلفل، بصل، زيتون، مشروم", price: 210, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60", category: "بيتزا" },
      { id: 302, name: "بيتزا مارجريتا", description: "صلصة طماطم وجبنة موتزاريللا", price: 140, image: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=400&auto=format&fit=crop&q=60", category: "بيتزا" },
      { id: 303, name: "خبز بالثوم", description: "خبز محمص بالزبدة والثوم والجبنة", price: 55, image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&auto=format&fit=crop&q=60", category: "مقبلات" },
    ]
  }
];

export function RestaurantMenu() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [addressDescription, setAddressDescription] = useState("");

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeDeliveryThreshold = 300;
  const hasFreeDelivery = totalPrice >= freeDeliveryThreshold;
  const hasGift = totalPrice >= 500;

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`تم إضافة ${item.name} للسلة`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  const handleCheckout = async () => {
    if (!selectedRestaurant) return;
    if (!addressDescription || addressDescription.trim().length < 5) {
      toast.error("يرجى كتابة العنوان بالتفصيل أولاً (رقم العمارة، الشقة، أو علامة مميزة)");
      return;
    }

    setIsLoading(true);
    try {
      const orderItems = cart.map(item => `${item.name} (${item.quantity})`).join('\n');
      
      // Create order in database
      const result = await createOrderMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        totalPrice,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        pickupLocation: {
          latitude: 30.2219, // Default coordinates for Obour City
          longitude: 31.4719,
          address: selectedRestaurant.address,
        },
        deliveryLocation: {
          latitude: userLocation?.latitude || 30.2219,
          longitude: userLocation?.longitude || 31.4719,
          address: addressDescription || "موقع العميل المكتشف",
        },
        notes: customerNotes
      });

      const message = `طلب جديد من تطبيق وصلي 📱\n\nالمطعم: ${selectedRestaurant.name}\n\n${orderItems}\n\nالإجمالي: ${totalPrice} ج.م\n\nالعنوان: ${addressDescription || "موقع GPS"}\n\nملاحظات: ${customerNotes || "بدون ملاحظات"}`;
      const whatsappUrl = `https://wa.me/${selectedRestaurant.phone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      toast.success("تم إرسال الطلب بنجاح!");
      setCart([]);
      setCustomerNotes("");
      setAddressDescription("");
      setIsCartExpanded(false);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">المطاعم المتاحة</h1>
          <Badge variant="outline" className="bg-white font-bold">العبور الجديدة</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map((restaurant) => (
            <Card 
              key={restaurant.id} 
              className={`overflow-hidden cursor-pointer transition-all hover:shadow-xl border-2 ${selectedRestaurant?.id === restaurant.id ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-transparent'}`}
              onClick={() => setSelectedRestaurant(restaurant)}
            >
              <div className="relative h-40">
                <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 text-slate-900 font-black backdrop-blur-sm">
                    <Star className="h-3 w-3 ml-1 fill-orange-500 text-orange-500" />
                    {restaurant.rating}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{restaurant.name}</h3>
                    <p className="text-xs text-slate-500 font-bold">{restaurant.category}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-orange-600">{restaurant.deliveryTime}</p>
                    <p className="text-[10px] text-slate-400 font-bold">أقل طلب: {restaurant.minOrder} ج.م</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 mt-3">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] font-bold line-clamp-1">{restaurant.address}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AnimatePresence>
          {selectedRestaurant && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 pt-4">
                <div className="h-1 w-8 bg-orange-500 rounded-full"></div>
                <h2 className="text-xl font-black text-slate-900">قائمة الطعام - {selectedRestaurant.name}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {selectedRestaurant.menu.map((item) => (
                  <Card key={item.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
                    <div className="flex p-3 gap-4">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover" />
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-black text-slate-900">{item.name}</h4>
                          <p className="text-xs text-slate-500 font-bold line-clamp-2 mt-1">{item.description}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-black text-orange-600">ج.م {item.price}</span>
                          <Button 
                            size="sm" 
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black h-8 px-4"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            إضافة
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 pointer-events-none">
          <Card className={`max-w-2xl mx-auto border-none shadow-2xl bg-slate-900 text-white rounded-3xl overflow-hidden relative transition-all duration-300 pointer-events-auto ${isCartExpanded ? 'h-auto' : 'h-20'}`}>
            {!isCartExpanded ? (
              <div 
                className="h-full flex items-center justify-between px-6 cursor-pointer"
                onClick={() => setIsCartExpanded(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/20">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="absolute -top-2 -right-2 bg-white text-slate-900 border-none font-black h-6 w-6 flex items-center justify-center rounded-full">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">سلة المشتريات</p>
                    <p className="text-lg font-black text-white">ج.م {totalPrice}</p>
                  </div>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black px-6">
                  عرض السلة
                  <ChevronRight className="h-4 w-4 mr-1" />
                </Button>
              </div>
            ) : (
              <CardContent className="p-0 max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black">سلة المشتريات</h3>
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                      {cart.length} أصناف
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white font-bold"
                      onClick={() => setCart([])}
                    >
                      مسح الكل
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-slate-800"
                      onClick={() => setIsCartExpanded(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <p className="font-black text-sm">{item.name}</p>
                          <p className="text-xs text-orange-500 font-bold">ج.م {item.price * item.quantity}</p>
                        </div>
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
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none shadow-inner"
                    />
                    <textarea
                      placeholder="ملاحظات إضافية للمطعم (اختياري)..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all h-20 resize-none outline-none shadow-inner"
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
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
