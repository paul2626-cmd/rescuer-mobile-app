import React from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useData } from '../../src/useData';
import { unwrapItems } from '../../src/backend';
import { C } from '../../src/theme';
import { Empty, ErrorNotice, Page, Section, Txt } from '../../src/ui';
import { formatAddress, formatWhen, incidentLabel, statusLabel } from '../../src/format';

export default function Assignments() {
  const router = useRouter();
  const active = useData('/api/rescuer/assignments?tab=active&page_size=50');
  const completed = useData('/api/rescuer/history?page=1&page_size=50');
  const activeRows = unwrapItems(active.data);
  const pending = activeRows.filter((item: any) => item.assignment_status === 'PENDING');
  const ongoing = activeRows.filter((item: any) => item.assignment_status === 'ACCEPTED');
  const done = unwrapItems(completed.data);
  const reload = () => { active.reload(); completed.reload(); };

  return (
    <Page
      eyebrow="Rescuer workspace"
      title="Assignments"
      subtitle="Your team only sees incidents dispatched to your team."
      refreshControl={<RefreshControl refreshing={active.loading || completed.loading} onRefresh={reload} tintColor={C.red} colors={[C.red]} />}
    >
      <ErrorNotice message={active.error || completed.error} />
      <Section title="Awaiting response" subtitle="Accept to respond, or decline so dispatch can reassign it.">
        {pending.length ? pending.map((item: any) => <AssignmentCard key={item.id} item={item} onPress={() => router.push(`/assignment/${item.id}`)} />) : (
          <Empty title="Nothing pending" detail="Dispatch notices will appear here when a new assignment arrives." />
        )}
      </Section>
      <Section title="Active missions" subtitle="Advance each mission in the order set by the server.">
        {ongoing.length ? ongoing.map((item: any) => <AssignmentCard key={item.id} item={item} onPress={() => router.push(`/assignment/${item.id}`)} />) : (
          <Empty title="No active missions" detail="Missions your team accepts will appear here." />
        )}
      </Section>
      <Section title="Completed" subtitle="Resolved operations awaiting closure and closed records.">
        {done.length ? done.map((item: any) => <AssignmentCard key={item.id} item={item} completed onPress={() => router.push(`/assignment/${item.id}`)} />) : (
          <Empty title="No completed missions" detail="Resolved missions will appear here." />
        )}
      </Section>
    </Page>
  );
}

function AssignmentCard({ item, completed = false, onPress }: { item: any; completed?: boolean; onPress: () => void }) {
  const incident = item.incident ?? item;
  const status = incident.status ?? item.assignment_status;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ padding: 15, marginBottom: 10, borderWidth: 1, borderColor: C.border, borderRadius: 17, backgroundColor: C.panel2, opacity: pressed ? 0.76 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Txt size={12} bold style={{ color: C.red, flex: 1 }}>{incident.public_reference || 'Incident assignment'}</Txt>
        <StatusPill status={status} />
      </View>
      <Txt size={16} bold style={{ marginTop: 7 }}>{incidentLabel(incident.incident_type)}</Txt>
      <Txt muted size={12} style={{ marginTop: 4 }} numberOfLines={2}>{formatAddress(incident)}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, gap: 8 }}>
        <Txt muted size={11} numberOfLines={1}>
          {completed ? formatWhen(item.date) : `Assignment: ${statusLabel(item.assignment_status)}`}
        </Txt>
        <Ionicons name="arrow-forward" size={17} color={C.muted} />
      </View>
    </Pressable>
  );
}

function StatusPill({ status }: { status?: string }) {
  const isDone = status === 'RESOLVED' || status === 'CLOSED' || status === 'COMPLETED';
  const color = isDone ? C.green : status === 'PENDING' ? C.warning : C.blue;
  const background = isDone ? C.greenSoft : status === 'PENDING' ? '#33291a' : C.blueSoft;
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, backgroundColor: background, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Txt size={10} bold style={{ color }}>{statusLabel(status)}</Txt>
    </View>
  );
}
