import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Power, RotateCcw, Plus, Ticket } from "lucide-react";

interface Coupon {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string | number;
  maxDiscount: string | number | null;
  minOrderValue: string | number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  isFirstOrderOnly: boolean;
}

export function CouponsManagement({ coupons: initialCoupons }: { coupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [isAdding, setIsAdding] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage" as const,
    discountValue: "" as string | number,
    maxDiscount: "" as string | number,
    minOrderValue: "" as string | number,
    isFirstOrderOnly: false,
  });

  const utils = trpc.useUtils();
  const createCouponMutation = trpc.coupons.create.useMutation();
  const updateStatusMutation = trpc.coupons.updateStatus.useMutation();
  const deleteCouponMutation = trpc.coupons.delete.useMutation();

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const discountValue = Number(newCoupon.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        toast.error("يرجى إدخال قيمة خصم صحيحة");
        return;
      }

      await createCouponMutation.mutateAsync({
        ...newCoupon,
        discountValue: discountValue,
        maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : undefined,
        minOrderValue: newCoupon.minOrderValue ? Number(newCoupon.minOrderValue) : undefined,
      });
      toast.success("تم إنشاء الكوبون بنجاح");
      setIsAdding(false);
      setNewCoupon({
        code: "",
        discountType: "percentage",
        discountValue: "",
        maxDiscount: "",
        minOrderValue: "",
        isFirstOrderOnly: false,
      });
      const updatedCoupons = await utils.coupons.getAll.fetch();
      setCoupons(updatedCoupons as any);
    } catch (error) {
      toast.error("فشل في إنشاء الكوبون");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean, code: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, isActive: !currentStatus });
      setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الكوبون ${code} بنجاح`);
    } catch (error) {
      toast.error("فشل في تحديث حالة الكوبون");
    }
  };

  const handleDeleteCoupon = async (id: number, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكوبون "${code}"؟`)) return;
    try {
      await deleteCouponMutation.mutateAsync({ id });
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success(`تم حذف الكوبون ${code} بنجاح`);
    } catch (error) {
      toast.error("فشل في حذف الكوبون");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-orange-500" />
            <span>إدارة الكوبونات</span>
          </div>
          <Button size="sm" onClick={() => setIsAdding(!isAdding)} className="gap-1">
            <Plus className="h-4 w-4" />
            {isAdding ? "إلغاء" : "إضافة كوبون"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleCreateCoupon} className="p-4 border rounded-xl bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">كود الخصم</label>
                <input
                  required
                  type="text"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: WASLY20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">نوع الخصم</label>
                <select
                  value={newCoupon.discountType}
                  onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">قيمة الخصم</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={newCoupon.discountValue}
                  onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="أدخل القيمة"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">أقصى خصم (اختياري)</label>
                <input
                  type="number"
                  step="any"
                  value={newCoupon.maxDiscount}
                  onChange={e => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: 50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">أقل قيمة للطلب (اختياري)</label>
                <input
                  type="number"
                  step="any"
                  value={newCoupon.minOrderValue}
                  onChange={e => setNewCoupon({ ...newCoupon, minOrderValue: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثال: 100"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="firstOrder"
                  checked={newCoupon.isFirstOrderOnly}
                  onChange={e => setNewCoupon({ ...newCoupon, isFirstOrderOnly: e.target.checked })}
                />
                <label htmlFor="firstOrder" className="text-sm font-medium">للطلب الأول فقط</label>
              </div>
            </div>
            <Button type="submit" disabled={createCouponMutation.isPending} className="w-full">
              {createCouponMutation.isPending ? "جاري الحفظ..." : "حفظ الكوبون"}
            </Button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-right py-3 px-4 font-semibold">الكود</th>
                <th className="text-right py-3 px-4 font-semibold">الخصم</th>
                <th className="text-right py-3 px-4 font-semibold">الاستخدام</th>
                <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">لا توجد كوبونات حالياً</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-orange-600">{coupon.code}</td>
                    <td className="py-3 px-4">
                      {coupon.discountValue}
                      {coupon.discountType === "percentage" ? "%" : " ج.م"}
                      {coupon.isFirstOrderOnly && <Badge className="mr-2 bg-blue-100 text-blue-800">أول طلب</Badge>}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      استخدم {coupon.usedCount} مرة
                      {coupon.usageLimit ? ` / حد ${coupon.usageLimit}` : ""}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={coupon.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {coupon.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(coupon.id, coupon.isActive, coupon.code)}
                          className="gap-1"
                        >
                          {coupon.isActive ? <Power className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                          {coupon.isActive ? "تعطيل" : "تفعيل"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
