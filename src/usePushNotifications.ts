import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './backend';
import { Session } from '@supabase/supabase-js';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function openNotificationRoute(data: Record<string, unknown>, router: ReturnType<typeof useRouter>) {
  const assignmentId = data.assignment_id;
  if (typeof assignmentId === 'string' && assignmentId.length > 0) {
    router.push(`/assignment/${assignmentId}`);
    return;
  }
  router.push('/notifications');
}

export function usePushNotifications(session: Session | null, role?: string | null) {
  const router = useRouter();
  const latest = useRef({ session, role });
  latest.current = { session, role };
  const registeredToken = useRef<{ token: string; userId: string; accessToken: string } | null>(null);

  useEffect(() => {
    const previous = registeredToken.current;
    const nextUserId = session?.user.id ?? null;
    if (previous && previous.userId !== nextUserId) {
      api('/api/notifications/device-tokens', 'DELETE', { token: previous.token }, previous.accessToken)
        .catch(() => {});
      registeredToken.current = null;
    }
  }, [session?.user.id]);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationRoute(response.notification.request.content.data as Record<string, unknown>, router);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openNotificationRoute(response.notification.request.content.data as Record<string, unknown>, router);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }).catch(() => {});

    return () => responseListener.remove();
  }, [router]);

  useEffect(() => {
    if (!session?.access_token || role !== 'RESCUER' || Platform.OS !== 'android') return undefined;
    let active = true;
    let tokenListener: Notifications.Subscription | undefined;
    const userId = session.user.id;
    const accessToken = session.access_token;

    const register = async (token: string) => {
      if (!active || !token) return;
      registeredToken.current = { token, userId, accessToken };
      await api('/api/notifications/device-tokens', 'POST', { token, platform: 'ANDROID' }, accessToken);
    };

    (async () => {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Rescue updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 280, 140, 280],
          lightColor: '#ff4b50',
        });
        let permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
        if (!active || permission.status !== 'granted') return;
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        await register(String(deviceToken.data));
        tokenListener = Notifications.addPushTokenListener((freshToken) => {
          register(String(freshToken.data)).catch(() => {});
        });
      } catch {
        // Push registration is best-effort. The in-app notification list remains available.
      }
    })();

    return () => {
      active = false;
      tokenListener?.remove();
    };
  }, [session?.user.id, role]);
}
