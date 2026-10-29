import React, { useState } from 'react';
import { Pressable, RefreshControl, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api, unwrapItems } from '../../src/backend';
import { C } from '../../src/theme';
import { useData } from '../../src/useData';
import { Btn, Empty, ErrorNotice, Page, Panel, Section, Txt } from '../../src/ui';
import { formatAddress, formatDuration, formatWhen, incidentLabel, statusLabel } from '../../src/format';

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();
  const team = useData('/api/rescuer/team');
  const active = useData('/api/rescuer/assignments?tab=active&page_size=1');
  const stats = useData('/api/rescuer/stats');
  const history = useData('/api/rescuer/history?page=1&page_size=3');
  const [availabilityOverride, setAvailabilityOverride] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const activeCount = Number(active.data?.total ?? 0);
  const locked = activeCount > 0;
  const availability = availabilityOverride ?? team.data?.availability ?? 'AVAILABLE';
  const isAvailable = availability === 'AVAILABLE' && !locked;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const outcomes = unwrapItems(history.data);
  const missions = unwrapItems(active.data);

  async function changeAvailability() {
    if (locked || savingAvailability || !team.data) return;
    const next = isAvailable ? 'OFF_DUTY' : 'AVAILABLE';
    setSavingAvailability(true);
    setAvailabilityError('');
    try {
      const updated = await api<any>('/api/rescuer/profile', 'PUT', { availability: next });
      setAvailabilityOverride(updated?.availability ?? next);
      team.reload();
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'Availability could not be updated.');
    } finally {
      setSavingAvailability(false);
    }
  }

  const reloadAll = () => {
    team.reload();
    active.reload();
    stats.reload();
    history.reload();
  };

  const statCards = [
    { label: 'ACTIVE MISSIONS', value: active.data?.total ?? 0, hint: locked ? 'Needs your team' : 'Needs your team', icon: 'paper-plane-outline' as const },
    { label: 'COMPLETED', value: stats.data?.total_missions ?? 0, hint: 'All-time for the team', icon: 'checkmark-circle-outline' as const },
    { label: 'PEOPLE RESCUED', value: stats.data?.total_people_rescued ?? 0, hint: 'From rescue records', icon: 'heart-outline' as const },
    { label: 'AVG RESPONSE', value: formatDuration(stats.data?.average_response_seconds), hint: 'Dispatch to arrival', icon: 'stopwatch-outline' as const },
  ];

  return (
    <Page
      title={`On shift: ${firstName || 'Rescuer'}`}
      subtitle={`${team.data?.name || 'Rescue team'} · Live rescue operations`}
      refreshControl={<RefreshControl refreshing={team.loading || active.loading} onRefresh={reloadAll} tintColor={C.red} colors={[C.red]} />}
    >
      <ErrorNotice message={team.error || active.error || stats.error || history.error || availabilityError} />

      <Panel style={{ position: 'relative', padding: 22, backgroundColor: C.panel, minHeight: 190 }}>
        <LinearGradient
          pointerEvents="none"
          colors={C.redSoft === '#30191b' ? ['#17191d', '#211719', '#201719'] : ['#ffffff', '#fff9f6', '#faefed']}
          locations={[0, 0.6, 1]}
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <View style={{ width: 20, height: 1, backgroundColor: C.red }} />
          <Txt muted size={12} bold style={{ letterSpacing: 1.1 }}>TEAM AVAILABILITY</Txt>
        </View>
        <Txt size={25} bold style={{ letterSpacing: -0.7 }}>{locked ? 'On mission' : isAvailable ? 'Available' : 'Off duty'}</Txt>
        <Txt muted style={{ marginTop: 7, maxWidth: 390, lineHeight: 22 }}>
          {locked ? 'Your team is responding to an active assignment.' : 'Ready for dispatch. New assignments for your team can arrive here.'}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15 }}>
          <Txt muted size={13} bold>Off duty</Txt>
          <Switch
            value={isAvailable}
            onValueChange={() => changeAvailability()}
            disabled={locked || savingAvailability || !team.data}
            trackColor={{ true: C.green, false: C.panel3 }}
            thumbColor={C.white}
            accessibilityLabel="Team availability"
          />
          <Txt size={13} bold>Available</Txt>
          {savingAvailability ? <Txt muted size={12}>Saving…</Txt> : null}
        </View>
      </Panel>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {statCards.map((item, index) => (
          <Panel
            key={item.label}
            style={{ width: '48.2%', height: 140, padding: 18, backgroundColor: index === 0 ? 'transparent' : C.panel, borderRadius: 22 }}
          >
            {index === 0 ? (
              <LinearGradient
                colors={C.redSoft === '#30191b' ? ['#f5e8e4', '#f9b4ae'] : ['#fff1ec', '#f8c6c0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
              />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Txt muted size={11} bold style={{ letterSpacing: 0.8, flex: 1 }}>{item.label}</Txt>
              <Ionicons name={item.icon} size={20} color={index === 0 ? '#8c8584' : C.muted} />
            </View>
            <Txt size={index === 3 ? 24 : 29} bold style={{ color: index === 0 ? '#f04b50' : C.text, marginTop: 12 }} numberOfLines={1}>
              {item.value}
            </Txt>
            <Txt muted size={11} style={{ marginTop: 'auto' }}>{item.hint}</Txt>
          </Panel>
        ))}
      </View>

      <Section title="Active mission" subtitle="Status must advance in order · mirrors the server state machine">
        {missions.length ? missions.map((assignment: any) => (
          <Pressable
            key={assignment.id}
            onPress={() => router.push(`/assignment/${assignment.id}`)}
            style={({ pressed }) => ({ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2, opacity: pressed ? 0.75 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Txt bold style={{ color: C.red }} numberOfLines={1}>{assignment.incident?.public_reference || 'Assigned mission'}</Txt>
              <StatusPill status={assignment.incident?.status} />
            </View>
            <Txt bold size={16} style={{ marginTop: 6 }}>{incidentLabel(assignment.incident?.incident_type)}</Txt>
            <Txt muted size={12} style={{ marginTop: 4 }}>{formatAddress(assignment.incident)}</Txt>
            <Txt muted size={12} style={{ marginTop: 3 }}>Assignment: {statusLabel(assignment.assignment_status)}</Txt>
          </Pressable>
        )) : (
          <Empty title="No active missions" detail="Your team has no assignment in progress right now." />
        )}
      </Section>

      <Section
        title="Recent outcomes"
        subtitle="Last resolved and closed missions"
        right={<Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/history')} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.borderStrong, flexDirection: 'row', alignItems: 'center', gap: 7, opacity: pressed ? 0.75 : 1 })}><Txt bold size={12}>History</Txt><Ionicons name="time-outline" size={15} color={C.text} /></Pressable>}
      >
        {outcomes.length ? outcomes.map((item: any) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/assignment/${item.id}`)}
            style={({ pressed }) => ({ minHeight: 106, paddingHorizontal: 15, paddingVertical: 13, marginBottom: 9, borderRadius: 17, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel, opacity: pressed ? 0.76 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Txt size={12} bold style={{ color: C.red, flex: 1 }}>{item.public_reference}</Txt>
              <StatusPill status={item.status} />
            </View>
            <Txt bold style={{ marginTop: 6 }}>{incidentLabel(item.incident_type)}</Txt>
            <Txt muted size={12} style={{ marginTop: 5 }} numberOfLines={2}>
              {formatWhen(item.date)} · {formatAddress(item.location)} · {item.people_rescued ?? 0} rescued
            </Txt>
          </Pressable>
        )) : (
          <Empty title="No recent outcomes" detail="Resolved missions will appear here." />
        )}
      </Section>
    </Page>
  );
}

function StatusPill({ status }: { status?: string }) {
  const resolved = status === 'RESOLVED' || status === 'CLOSED';
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: resolved ? C.greenSoft : C.blueSoft, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: resolved ? C.green : C.blue }} />
      <Txt size={10} bold style={{ color: resolved ? C.green : C.blue }}>{statusLabel(status)}</Txt>
    </View>
  );
}
