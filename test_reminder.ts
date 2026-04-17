import 'dotenv/config';
import { getAvailableOrders, getDb } from "./server/db";
import { notifyDriversOfNewOrder } from "./server/notifications";

async function testReminderSystem() {
  console.log("--- بدء اختبار نظام التذكير الدوري ---");
  
  try {
    const db = await getDb();
    if (!db) {
      console.log("⚠️ تنبيه: قاعدة البيانات غير متوفرة، يتم استخدام الذاكرة المؤقتة (In-memory)");
    } else {
      console.log("✅ قاعدة البيانات متصلة بنجاح.");
    }

    // 1. جلب الطلبات المعلقة
    const pendingOrders = await getAvailableOrders();
    console.log(`🔍 تم العثور على ${pendingOrders.length} طلبات معلقة حالياً.`);

    if (pendingOrders.length > 0) {
      console.log("🚀 جاري تجربة إرسال إشعار تذكيري للسائقين...");
      
      const count = pendingOrders.length;
      const message = count === 1 
        ? `اختبار: يوجد طلب متاح الآن بانتظارك! 🚀` 
        : `اختبار: يوجد ${count} طلبات متاحة الآن بانتظارك! 🚀`;
        
      // محاكاة إرسال الإشعار (سيقوم بطباعة السجلات فيnotifications.ts)
      await notifyDriversOfNewOrder(pendingOrders[0].id, message);
      console.log("✅ تمت محاكاة إرسال الإشعار بنجاح.");
    } else {
      console.log("ℹ️ لا توجد طلبات معلقة حالياً للاختبار. يرجى إنشاء طلب من التطبيق.");
    }

  } catch (error) {
    console.error("❌ خطأ أثناء الاختبار:", error);
  }
  
  console.log("--- انتهى الاختبار ---");
  process.exit(0);
}

testReminderSystem();
