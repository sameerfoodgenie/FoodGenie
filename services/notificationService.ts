import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FoodGenie',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined,
    });
    const token = tokenData.data;

    // Store token in database
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
      },
      { onConflict: 'user_id,token' },
    );

    return token;
  } catch (e) {
    console.error('Failed to register push notifications:', e);
    return null;
  }
}

export async function fetchNotifications(userId: string): Promise<{ data: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:user_profiles!notifications_actor_user_id_fkey(username)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    return { data: data || [], error: error?.message || null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch notifications' };
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count || 0;
  } catch {
    return 0;
  }
}

export async function createNotification(params: {
  user_id: string;
  type: string;
  actor_user_id?: string;
  post_id?: string;
  message: string;
}): Promise<void> {
  try {
    await supabase.from('notifications').insert(params);
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null, // immediate
    });
  } catch (e) {
    console.error('Failed to schedule notification:', e);
  }
}

// Send push notification to all users or specific users via Edge Function
export async function sendBroadcastPushNotification(params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  user_ids?: string[];
}): Promise<{ success: boolean; sent?: number; failed?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params,
    });

    if (error) {
      // Check for FunctionsHttpError
      let errorMessage = error.message;
      try {
        if ((error as any).context?.text) {
          const textContent = await (error as any).context.text();
          errorMessage = textContent || error.message;
        }
      } catch {
        // use default message
      }
      return { success: false, error: errorMessage };
    }

    return { success: true, sent: data?.sent || 0, failed: data?.failed || 0 };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to send notification' };
  }
}
