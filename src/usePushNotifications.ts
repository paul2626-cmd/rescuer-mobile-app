import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './backend';
import { Session } from '@supabase/supabase-js';

export type AssignmentAlarm = {
  assignmentId: string;
  incidentId?: string;
  title: string;
  body: string;
  localNotificationId?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function openNotificationRoute(data: Record<string, unknown>, router: ReturnType<typeof useRouter>, dismissAlarm: () => void) {
  const assignmentId = data.assignment_id;
  dismissAlarm();
  if (typeof assignmentId === 'string' && assignmentId.length > 0) {
    router.push(`/assignment/${assignmentId}`);
    return;
  }
  router.push('/notifications');
}

export function usePushNotifications(session: Session | null, role?: string | null) {
  const router = useRouter();
  const [alarm, setAlarm] = useState<AssignmentAlarm | null>(null);
  const alarmRef = useRef<AssignmentAlarm | null>(null);
  const snoozedNotification = useRef<{ id: string; assignmentId: string } | null>(null);
  const registeredToken = useRef<{ token: string; userId: string; accessToken: string } | null>(null);

  const clearAlarm = useCallback(() => {
    const current = alarmRef.current;
    alarmRef.current = null;
    setAlarm(null);
    if (current?.localNotificationId) {
      Notifications.dismissNotificationAsync(current.localNotificationId).catch(() => {});
    }
  }, []);

  const snoozeAlarm = useCallback(async () => {
    const current = alarmRef.current;
    if (!current) return;
    clearAlarm();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: current.title,
        body: current.body,
        sound: true,
        data: {
          type: 'ASSIGNMENT',
          assignment_id: current.assignmentId,
          incident_id: current.incidentId,
          local_alarm: true,
          snoozed_alarm: true,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    snoozedNotification.current = { id, assignmentId: current.assignmentId };
  }, [clearAlarm]);

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
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      if (!session?.access_token || role !== 'RESCUER') {
        clearAlarm();
        return;
      }
      const data = notification.request.content.data as Record<string, unknown>;
      const type = data.type;
      const assignmentId = data.assignment_id;
      const alarmAction = data.alarm_action;

      if (alarmAction === 'STOP') {
        const current = alarmRef.current;
        if (!current || typeof assignmentId !== 'string' || current.assignmentId === assignmentId) clearAlarm();
        const snoozed = snoozedNotification.current;
        if (snoozed && (typeof assignmentId !== 'string' || snoozed.assignmentId === assignmentId)) {
          Notifications.cancelScheduledNotificationAsync(snoozed.id).catch(() => {});
          snoozedNotification.current = null;
        }
        return;
      }

      if ((type !== 'ASSIGNMENT' && type !== 'REASSIGNMENT') || typeof assignmentId !== 'string' || !assignmentId) return;
      const existing = alarmRef.current;
      if (existing && existing.assignmentId !== assignmentId && existing.localNotificationId) {
        Notifications.dismissNotificationAsync(existing.localNotificationId).catch(() => {});
      }
      const snoozed = snoozedNotification.current;
      if (snoozed && snoozed.assignmentId !== assignmentId) {
        Notifications.cancelScheduledNotificationAsync(snoozed.id).catch(() => {});
        snoozedNotification.current = null;
      }
      const next: AssignmentAlarm = {
        assignmentId,
        incidentId: typeof data.incident_id === 'string' ? data.incident_id : undefined,
        title: typeof data.title === 'string' ? data.title : 'New rescue assignment',
        body: typeof data.body === 'string' ? data.body : 'Your team has a new assignment.',
        localNotificationId: existing?.assignmentId === assignmentId ? existing.localNotificationId : undefined,
      };
      alarmRef.current = next;
      setAlarm(next);

      // The backend sends assignment alerts as data-only FCM. A local alert makes
      // the active foreground app produce the configured system sound and banner.
      if (data.local_alarm !== true) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: next.title,
            body: next.body,
            sound: true,
            data: { ...data, local_alarm: true },
          },
          trigger: null,
        }).then((id) => {
          if (alarmRef.current?.assignmentId === assignmentId) {
            const updated = { ...next, localNotificationId: id };
            alarmRef.current = updated;
            setAlarm(updated);
          } else {
            Notifications.dismissNotificationAsync(id).catch(() => {});
          }
        }).catch(() => {});
      }
    });
    return () => receivedListener.remove();
  }, [clearAlarm, role, session?.user.id]);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationRoute(response.notification.request.content.data as Record<string, unknown>, router, clearAlarm);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openNotificationRoute(response.notification.request.content.data as Record<string, unknown>, router, clearAlarm);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }).catch(() => {});

    return () => responseListener.remove();
  }, [router, clearAlarm]);

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

  return { alarm, clearAlarm, snoozeAlarm };
}
