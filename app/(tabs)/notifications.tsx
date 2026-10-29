import React, { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api, unwrapItems } from '../../src/backend';
import { useData } from '../../src/useData';
import { C } from '../../src/theme';
import { Empty, ErrorNotice, Page, Section, Txt } from '../../src/ui';
import { formatWhen } from '../../src/format';

export default function Notifications() {
  const router = useRouter();
  const notifications = useData<any>('/api/notifications');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const items = unwrapItems(notifications.data);
  const unread = Number(notifications.data?.unread_count ?? 0);

  async function markRead(id: string) {
    setBusyId(id);
    setActionError('');
    try {
      await api(`/api/notifications/${id}/read`, 'PATCH');
      await notifications.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update this notification.');
    } finally {
      setBusyId('');
    }
  }

  async function markAllRead() {
    setBusyId('all');
    setActionError('');
    try {
      await api('/api/notifications/read-all', 'POST');
      await notifications.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update notifications.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <Page
      eyebrow="Rescuer workspace"
      title="Notifications"
      subtitle="Assignment and incident updates for your team."
      refreshControl={<RefreshControl refreshing={notifications.loading} onRefresh={notifications.reload} tintColor={C.red} colors={[C.red]} />}
    >
      <ErrorNotice message={notifications.error || actionError} />
      <Section
        title="Your notifications"
        subtitle="Newest first"
        right={unread > 0 ? <Pressable accessibilityRole="button" disabled={busyId === 'all'} onPress={markAllRead}><Txt size={12} bold style={{ color: C.red }}>{busyId === 'all' ? 'Saving…' : 'Mark all read'}</Txt></Pressable> : null}
      >
        {notifications.loading && !notifications.data ? <Txt muted style={{ textAlign: 'center', padding: 18 }}>Loading notifications…</Txt> : null}
        {items.length === 0 && !notifications.loading ? <Empty title="No notifications" detail="New assignment and incident updates will appear here." /> : null}
        {items.map((item: any) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (!item.is_read) markRead(item.id);
              if (item.assignment_id) router.push(`/assignment/${item.assignment_id}`);
            }}
            style={({ pressed }) => ({ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.76 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: item.is_read ? C.panel3 : C.redSoft }}>
                <Ionicons name="notifications-outline" size={17} color={item.is_read ? C.muted : C.red} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Txt bold style={{ flex: 1 }}>{item.title || 'Rescue update'}</Txt>
                  {!item.is_read ? <View accessibilityLabel="Unread" style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.red }} /> : null}
                </View>
                <Txt muted size={13}>{item.message || 'A rescue operation has been updated.'}</Txt>
                <Txt muted size={11}>{formatWhen(item.created_at)}{busyId === item.id ? ' · Saving…' : ''}</Txt>
              </View>
            </View>
          </Pressable>
        ))}
      </Section>
    </Page>
  );
}
