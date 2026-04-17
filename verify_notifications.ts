import 'dotenv/config';
import { getAvailableOrders, getDb } from "./server/db";
import { notifyDriversOfNewOrder } from "./server/notifications";

async function verify() {
  console.log("--- فحص نظام التنبيهات الدوري ---");
  try {
    const pendingOrders = await getAvailableOrders();
    console.log(`عدد الطلبات المعلقة المكتشفة: ${pendingOrders.length}`);
    
    if (pendingOrders.length > 0) {
      console.log("جاري إرسال تنبيه تجريبي لجميع السائقين...");
      await notifyDriversOfNewOrder(pendingOrders[0].id, "تنبيه تجريبي: يوجد طلبات بانتظارك! 🚀");
      console.log("✅ تم إرسال التنبيه بنجاح.");
    } else {
      console.log("⚠️ لا توجد طلبات معلقة حالياً للفحص.");
    }
  } catch (e) {
    console.error("❌ فشل الفحص:", e);
  }
  process.exit(0);
}

verify();
