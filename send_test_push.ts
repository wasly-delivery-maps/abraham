
import { sendOneSignalNotification } from './server/notifications';
import 'dotenv/config';

async function test() {
  console.log('Sending high-priority test notification...');
  try {
    await sendOneSignalNotification({
      title: 'اختبار نظام واصلي 🚀',
      body: 'هذا إشعار تجريبي للتأكد من ظهور التنبيهات فوق التطبيقات وبصوت واهتزاز قوي.',
      role: 'driver',
      data: { url: '/driver/dashboard', test: true }
    });
    console.log('Notification sent successfully!');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

test();
