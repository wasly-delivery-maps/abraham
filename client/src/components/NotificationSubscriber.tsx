import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSubscriberProps {
  vapidPublicKey: string;
  userId: number;
}

export function NotificationSubscriber({
  vapidPublicKey,
  userId,
}: NotificationSubscriberProps) {
  const {
    isSupported,
    isSubscribed,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);

  // Auto-subscribe on component mount if supported
  useEffect(() => {
    if (isSupported && !isSubscribed && Notification.permission === 'granted') {
      handleSubscribe();
    }
  }, [isSupported]);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      // Original Web Push Logic (OneSignal is handled server-side via external_id)
      await subscribeToPushNotifications(vapidPublicKey, userId);
      toast.success('تم تفعيل الإشعارات بنجاح');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('يرجى التأكد من منح إذن الإشعارات في المتصفح');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      await unsubscribeFromPushNotifications();
      toast.success('تم إيقاف الإشعارات');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast.error('فشل إيقاف الإشعارات');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Browser doesn't support push notifications
  }

  return (
    <Button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isLoading}
      variant={isSubscribed ? 'default' : 'outline'}
      size="sm"
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          إيقاف الإشعارات
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          تفعيل الإشعارات
        </>
      )}
    </Button>
  );
}
