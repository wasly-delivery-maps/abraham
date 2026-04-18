import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Search, MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Order {
  id: number;
  status: string;
  customerId: number;
  driverId?: number;
  price: number;
  createdAt: Date;
  customerName?: string;
  driverName?: string;
  pickupLocation?: any;
  deliveryLocation?: any;
}

export function OrdersManagement({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [ordersWithNames, setOrdersWithNames] = useState<Order[]>([]);
  const [selectedOrderForWhatsApp, setSelectedOrderForWhatsApp] = useState<Order | null>(null);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [driverSearchTerm, setDriverSearchTerm] = useState("");
  
  const usersQuery = trpc.admin.getAllUsers.useQuery();
  const deleteOrderMutation = trpc.admin.deleteOrder.useMutation();
  
  useEffect(() => {
    if (usersQuery.data && orders.length > 0) {
      const usersMap = new Map(usersQuery.data.map((u: any) => [u.id, u.name]));
      const enrichedOrders = orders.map((order) => ({
        ...order,
        customerName: usersMap.get(order.customerId) || `عميل #${order.customerId}`,
        driverName: order.driverId ? usersMap.get(order.driverId) || `سائق #${order.driverId}` : "غير مسند",
      }));
      setOrdersWithNames(enrichedOrders);
    }
  }, [usersQuery.data, orders]);

  const filteredOrders = ordersWithNames.filter((order) => {
    const matchesSearch = order.id.toString().includes(searchTerm) || 
                         order.customerName?.includes(searchTerm) || 
                         order.driverName?.includes(searchTerm);
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`هل أنت متأكد من حذف الطلب #${orderId}؟ هذا الإجراء لا يمكن التراجع عنه.`))
      return;

    try {
      await deleteOrderMutation.mutateAsync({ orderId });
      setOrders(orders.filter((o) => o.id !== orderId));
      toast.success(`تم حذف الطلب #${orderId} بنجاح`);
    } catch (error) {
      toast.error("فشل في حذف الطلب");
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    setSelectedOrderForWhatsApp(order);
    setIsWhatsAppDialogOpen(true);
  };

  const sendDirectWhatsApp = (driverPhone: string, order: Order) => {
    const pickupAddress = order.pickupLocation?.address || "عنوان الاستلام";
    const deliveryAddress = order.deliveryLocation?.address || "عنوان التسليم";
    const price = order.price ? order.price.toFixed(2) : "0.00";
    
    const message = `لديك طلب جديد 📦\n\nرقم الطلب: #${order.id}\nالعميل: ${order.customerName || "عميل"}\nمن: ${pickupAddress}\nإلى: ${deliveryAddress}\nالسعر: ج.م ${price}\nالحالة: ${getStatusLabel(order.status)}\n\nيرجى الضغط على الرابط أدناه للمتابعة:\n${window.location.origin}`;
    
    const encodedMessage = encodeURIComponent(message);
    
    let phoneNumber = driverPhone.replace(/\D/g, '');
    if (!phoneNumber.startsWith('20')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '20' + phoneNumber.substring(1);
      } else {
        phoneNumber = '20' + phoneNumber;
      }
    }
    
    // استخدام رابط whatsapp:// لفتح التطبيق مباشرة على الموبايل
    const directWhatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
    const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // محاولة فتح التطبيق مباشرة، وإذا فشل نستخدم رابط الويب
    try {
      window.location.href = directWhatsappUrl;
      // ننتظر قليلاً، إذا لم يتغير الرابط (فشل الفتح المباشر)، نفتح رابط الويب في نافذة جديدة
      setTimeout(() => {
        if (document.hasFocus()) {
          window.open(webWhatsappUrl, "_blank");
        }
      }, 500);
    } catch (e) {
      window.open(webWhatsappUrl, "_blank");
    }
    
    toast.success("جاري فتح واتساب...");
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "قيد الانتظار",
      assigned: "مسند",
      accepted: "مقبول",
      picked_up: "تم الاستلام",
      in_transit: "في الطريق",
      delivered: "تم التسليم",
      cancelled: "ملغى",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "in_transit":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إدارة الطلبات</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredOrders.length} من {orders.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن رقم الطلب أو الاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="assigned">مسند</option>
            <option value="accepted">مقبول</option>
            <option value="picked_up">تم الاستلام</option>
            <option value="in_transit">في الطريق</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغى</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-right py-3 px-4 font-semibold">رقم الطلب</th>
                <th className="text-right py-3 px-4 font-semibold">العميل</th>
                <th className="text-right py-3 px-4 font-semibold">السائق</th>
                <th className="text-right py-3 px-4 font-semibold">السعر</th>
                <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                <th className="text-right py-3 px-4 font-semibold">التاريخ</th>
                <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                <th className="text-right py-3 px-4 font-semibold">واتساب</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">#{order.id}</td>
                    <td className="py-3 px-4 text-sm font-medium">{order.customerName}</td>
                    <td className="py-3 px-4 text-sm font-medium">{order.driverName}</td>
                    <td className="py-3 px-4 font-semibold">ج.م {order.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deleteOrderMutation.isPending}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendWhatsApp(order)}
                        className="gap-1 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                        title="إرسال تفاصيل الطلب للسائق عبر واتساب"
                      >
                        <MessageCircle className="h-3 w-3" />
                        إرسال
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

      {/* WhatsApp Driver Selection Dialog */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              إرسال الطلب للسائقين
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              اختر السائق لإرسال تفاصيل الطلب #{selectedOrderForWhatsApp?.id} له مباشرة عبر واتساب:
            </p>
            
            <div className="relative mb-4">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن اسم السائق أو رقمه..."
                className="w-full pr-10 pl-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {(() => {
                const allDrivers = usersQuery.data?.filter((u: any) => u.role === "driver") || [];
                const filteredDrivers = allDrivers.filter((d: any) => 
                  d.name?.toLowerCase().includes(driverSearchTerm.toLowerCase()) || 
                  d.phone?.includes(driverSearchTerm)
                );

                if (allDrivers.length === 0) {
                  return <p className="text-center py-4 text-muted-foreground">لا يوجد سائقين مسجلين</p>;
                }
                
                if (filteredDrivers.length === 0) {
                  return <p className="text-center py-4 text-muted-foreground">لا يوجد نتائج للبحث</p>;
                }

                return filteredDrivers.map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-bold">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">{driver.phone}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 gap-1"
                      onClick={() => selectedOrderForWhatsApp && sendDirectWhatsApp(driver.phone, selectedOrderForWhatsApp)}
                    >
                      <MessageCircle className="h-3 w-3" />
                      إرسال
                    </Button>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsWhatsAppDialogOpen(false)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
