import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Users, Truck, User, Loader2, Bell, Radio } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

interface NotificationTarget {
  type: "all" | "customers" | "drivers" | "specific";
  targetValue?: string; // For specific user ID
}

export function NotificationsManagement() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<NotificationTarget>({ type: "all" });
  const [specificUserId, setSpecificUserId] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendNotificationMutation = trpc.admin.sendManualNotification.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إرسال الإشعار بنجاح!");
      setTitle("");
      setMessage("");
      setTarget({ type: "all" });
      setSpecificUserId("");
    },
    onError: (error) => {
      toast.error(error.message || "فشل في إرسال الإشعار");
    },
  });

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("يرجى إدخال العنوان والرسالة");
      return;
    }

    if (target.type === "specific" && !specificUserId.trim()) {
      toast.error("يرجى إدخال معرف المستخدم");
      return;
    }

    setIsSending(true);
    try {
      await sendNotificationMutation.mutateAsync({
        title: title.trim(),
        body: message.trim(),
        target: target.type === "specific" ? "all" : target.type as any, // Backend only supports all, drivers, customers
        url: "/",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setIsSending(false);
    }
  };

  const targetOptions = [
    { value: "all", label: "جميع المستخدمين", icon: Radio, color: "bg-blue-500" },
    { value: "customers", label: "العملاء فقط", icon: Users, color: "bg-emerald-500" },
    { value: "drivers", label: "السائقين فقط", icon: Truck, color: "bg-orange-500" },
    { value: "specific", label: "مستخدم محدد", icon: User, color: "bg-purple-500" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Send Notification Form */}
      <Card className="lg:col-span-2 border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <CardTitle className="flex items-center gap-2 font-black">
            <Bell className="h-5 w-5" /> إرسال إشعار مخصص
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase mr-1">عنوان الإشعار</label>
            <Input
              placeholder="مثال: عرض خاص جديد 🎉"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-slate-100 h-12 font-bold"
              maxLength={100}
            />
            <p className="text-[10px] text-slate-400 font-bold">{title.length}/100</p>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase mr-1">نص الرسالة</label>
            <Textarea
              placeholder="اكتب رسالتك هنا... يمكنك استخدام الرموز التعبيرية 😊"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border-slate-100 font-bold h-32"
              maxLength={500}
            />
            <p className="text-[10px] text-slate-400 font-bold">{message.length}/500</p>
          </div>

          {/* Target Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase mr-1">المستقبلون</label>
            <div className="grid grid-cols-2 gap-3">
              {targetOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTarget({ type: option.value as any })}
                    className={`p-4 rounded-2xl border-2 transition-all font-bold flex items-center gap-2 ${
                      target.type === option.value
                        ? `${option.color} text-white border-transparent shadow-lg`
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Specific User ID Input */}
          {target.type === "specific" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <label className="text-xs font-black text-slate-400 uppercase mr-1">معرف المستخدم</label>
              <Input
                type="number"
                placeholder="أدخل معرف المستخدم (ID)"
                value={specificUserId}
                onChange={(e) => setSpecificUserId(e.target.value)}
                className="rounded-xl border-slate-100 h-12 font-bold"
              />
            </motion.div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendNotification}
            disabled={isSending || !title.trim() || !message.trim()}
            className={`w-full py-6 text-lg font-black rounded-2xl transition-all ${
              isSending || !title.trim() || !message.trim()
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
            }`}
          >
            {isSending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 ml-2" />
                إرسال الإشعار
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="bg-slate-900 text-white p-6">
          <CardTitle className="flex items-center gap-2 font-black">
            <Bell className="h-5 w-5" /> معاينة الإشعار
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Mobile Preview */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-slate-900">
              {/* Phone Header */}
              <div className="bg-slate-900 text-white px-4 py-2 text-center text-xs font-bold">
                📱 معاينة على الهاتف
              </div>

              {/* Notification Preview */}
              <div className="p-4 space-y-3">
                <div className="bg-blue-500 text-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-sm mb-1">
                        {title || "عنوان الإشعار"}
                      </h3>
                      <p className="text-xs font-bold text-white/90 line-clamp-3">
                        {message || "نص الرسالة سيظهر هنا..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Target Info */}
                <div className="bg-slate-100 rounded-xl p-3 text-xs font-bold text-slate-600 space-y-1">
                  <p>
                    <span className="text-slate-400">المستقبلون:</span>{" "}
                    {target.type === "all"
                      ? "جميع المستخدمين"
                      : target.type === "customers"
                      ? "العملاء فقط"
                      : target.type === "drivers"
                      ? "السائقين فقط"
                      : `المستخدم #${specificUserId || "..."}`}
                  </p>
                  <p>
                    <span className="text-slate-400">الوقت:</span>{" "}
                    {new Date().toLocaleTimeString("ar-EG")}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg text-xs font-bold text-blue-700">
              <p className="mb-1">💡 ملاحظات مهمة:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                <li>الإشعارات ترسل عبر OneSignal</li>
                <li>تصل فوراً لجميع الأجهزة المسجلة</li>
                <li>يمكن استخدام الرموز التعبيرية</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
