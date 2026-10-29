import React, { useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, RefreshControl, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AssignmentMap } from '../../../src/AssignmentMap';
import { api } from '../../../src/backend';
import { RescueRecordForm } from '../../../src/RescueRecordForm';
import { C } from '../../../src/theme';
import { useData } from '../../../src/useData';
import { Btn, Empty, ErrorNotice, Field, Page, Panel, Section, Txt } from '../../../src/ui';
import { distanceKm, formatAddress, formatWhen, incidentLabel, statusLabel } from '../../../src/format';

const FLOW = ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'RESOLVED'];
const NEXT_STATUS: Record<string, string> = {
  ACCEPTED: 'EN_ROUTE',
  EN_ROUTE: 'ON_SCENE',
  ON_SCENE: 'IN_PROGRESS',
};

export default function AssignmentDetail() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const router = useRouter();
  const assignment = useData<any>(id ? `/api/rescuer/assignments/${encodeURIComponent(id)}` : null);
  const incident = assignment.data?.incident;
  const recordData = useData<any>(incident?.id ? `/api/rescuer/incidents/${incident.id}/record` : null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceBusy, setEvidenceBusy] = useState(false);

  const item = assignment.data;
  const report = item?.report;
  const status = incident?.status;
  const stepIndex = FLOW.indexOf(status);
  const nextStatus = NEXT_STATUS[status];
  const isCompleted = status === 'RESOLVED' || status === 'CLOSED';
  const canRespond = item?.assignment_status === 'PENDING';
  const canAdvance = item?.assignment_status === 'ACCEPTED' && Boolean(nextStatus);
  const timeline = useMemo(() => [...(item?.history ?? [])].reverse(), [item?.history]);
  const team = item?.team;
  const hasCoords = incident?.latitude != null && incident?.longitude != null;
  const distance = hasCoords && team?.base_latitude != null && team?.base_longitude != null
    ? distanceKm(Number(team.base_latitude), Number(team.base_longitude), Number(incident.latitude), Number(incident.longitude))
    : null;

  async function refresh() {
    await Promise.all([assignment.reload(), recordData.reload()]);
  }

  async function respond(decision: 'ACCEPT' | 'DECLINE', reason?: string) {
    setBusy(true);
    setActionError('');
    try {
      await api(`/api/rescuer/assignments/${encodeURIComponent(id)}/respond`, 'PATCH', {
        decision,
        ...(decision === 'DECLINE' ? { decline_reason: reason?.trim() } : {}),
      });
      setDeclineOpen(false);
      setDeclineReason('');
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Your response could not be saved.';
      setActionError(message);
      if ((error as any)?.status === 404 || (error as any)?.status === 409) await assignment.reload();
    } finally {
      setBusy(false);
    }
  }

  function confirmAccept() {
    Alert.alert('Accept assignment', 'Confirm that your team will respond to this incident?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => { respond('ACCEPT').catch(() => {}); } },
    ]);
  }

  async function advance() {
    if (!incident?.id || !nextStatus) return;
    setBusy(true);
    setActionError('');
    try {
      await api(`/api/rescuer/incidents/${incident.id}/status`, 'PATCH', { status: nextStatus });
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The incident status could not be updated.');
      if ((error as any)?.status === 404 || (error as any)?.status === 409) await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function showEvidence() {
    if (!incident?.id) return;
    setEvidenceBusy(true);
    setActionError('');
    try {
      const result = await api<any>(`/api/incidents/${incident.id}/image`);
      if (result?.url) setEvidenceUrl(result.url);
      else setActionError('No report photo is available.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The report photo could not be loaded.');
    } finally {
      setEvidenceBusy(false);
    }
  }

  if (assignment.loading && !item) return <Page><View style={{ flex: 1, justifyContent: 'center' }}><Txt muted>Loading incident…</Txt></View></Page>;
  if (!item || !incident) {
    return <Page title="Incident details" subtitle="Assignment details could not be loaded."><ErrorNotice message={assignment.error || 'This assignment is unavailable to your team.'} /><Btn secondary onPress={() => router.back()}>Back</Btn></Page>;
  }

  return (
    <Page
      title="Incident report"
      subtitle={`${formatAddress(incident)} · ${item.assigned_at ? `dispatched ${formatWhen(item.assigned_at)}` : 'dispatch time unavailable'}`}
      eyebrow="Assignment details"
      refreshControl={<RefreshControl refreshing={assignment.loading || recordData.loading} onRefresh={refresh} tintColor={C.red} colors={[C.red]} />}
      titleAccessory={<Pressable accessibilityRole="button" accessibilityLabel="Back to assignments" onPress={() => router.push('/(tabs)/assignments')} style={{ padding: 8 }}><Ionicons name="arrow-back" size={20} color={C.text} /></Pressable>}
    >
      <ErrorNotice message={assignment.error || recordData.error || actionError} />
      <Panel style={{ padding: 18, backgroundColor: C.panel }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }}>
          <Txt size={12} bold style={{ color: C.red }}>{incident.public_reference || 'Incident'}</Txt>
          <StatusPill status={status} />
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: C.blueSoft }}><Txt size={9} bold style={{ color: C.blue }}>{incident.priority || 'NORMAL'}</Txt></View>
        </View>
        <Txt muted size={10} bold style={{ letterSpacing: 1, marginTop: 8 }}>{incidentLabel(incident.incident_type).toUpperCase()}</Txt>
        <Txt size={24} bold style={{ marginTop: 8, letterSpacing: -0.7 }}>Incident report</Txt>
        <Txt muted size={12} style={{ marginTop: 8 }}>{incident.barangay?.name ? `Barangay ${incident.barangay.name}` : formatAddress(incident)}{item.assigned_at ? ` · dispatched ${formatWhen(item.assigned_at)}` : ''}</Txt>
      </Panel>

      <Section title="Mission progress" subtitle="Transitions are validated server-side; out-of-order jumps are rejected.">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          {FLOW.map((step, index) => {
            const active = index <= stepIndex || (step === 'RESOLVED' && isCompleted);
            const current = step === status;
            return (
              <React.Fragment key={step}>
                <View style={{ width: current ? 24 : 21, height: current ? 24 : 21, borderRadius: 15, borderWidth: 1, borderColor: active ? C.green : C.borderStrong, backgroundColor: active ? C.green : C.panel2, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={active ? 'checkmark' : 'ellipse'} size={active ? 13 : 6} color={active ? '#101614' : C.muted2} />
                </View>
                {index < FLOW.length - 1 ? <View style={{ flex: 1, height: 2, backgroundColor: index < stepIndex ? C.green : C.border }} /> : null}
              </React.Fragment>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginBottom: 15 }}>
          {FLOW.map((step) => <Txt key={step} muted size={8} style={{ flex: 1, textAlign: 'center' }}>{statusLabel(step)}</Txt>)}
        </View>
        {canRespond ? (
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Btn disabled={busy} onPress={confirmAccept}>Accept</Btn>
            <Btn secondary disabled={busy} onPress={() => setDeclineOpen(true)}>Decline</Btn>
          </View>
        ) : null}
        {canAdvance ? <Btn disabled={busy} onPress={advance}>{busy ? 'Updating…' : `Advance to ${statusLabel(nextStatus)}`}</Btn> : null}
        {status === 'IN_PROGRESS' && !isCompleted ? <Btn onPress={() => router.push(`/assignment/${id}/completion`)} style={{ marginTop: canAdvance ? 10 : 0 }}>Submit completion report</Btn> : null}
        {isCompleted ? <Btn secondary onPress={() => router.push(`/assignment/${id}/completion`)}>View completion report</Btn> : null}
        {report?.callback_number ? <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`tel:${report.callback_number}`)} style={{ paddingVertical: 12 }}><Txt size={13} bold style={{ color: C.red }}>Call reporter · {report.callback_number}</Txt></Pressable> : null}
      </Section>

      {canRespond ? (
        <Section title="Your response" subtitle="Accept to start responding, or decline so dispatch can reassign it.">
          <Txt muted size={12}>Assignment status: {statusLabel(item.assignment_status)}</Txt>
        </Section>
      ) : null}

      <Section title="Incident brief" subtitle="Structured report details">
        <Txt size={13}>{report?.description || 'No description was recorded for this report.'}</Txt>
        <View style={{ gap: 9, marginTop: 13 }}>
          <Fact label="Affected" value={incident.affected_people_unknown ? 'Unknown' : incident.affected_people_count == null ? 'Not recorded' : `${incident.affected_people_count} people`} />
          <Fact label="Callback" value={report?.callback_number || 'Not provided'} detail={report?.reporter_name || 'Reporter'} />
          <View style={{ padding: 11, borderRadius: 12, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border }}>
            <Txt muted size={9} bold style={{ letterSpacing: 0.8 }}>EVIDENCE</Txt>
            {item.image ? <Pressable accessibilityRole="button" onPress={showEvidence} disabled={evidenceBusy} style={{ marginTop: 4 }}><Txt bold size={13}>{evidenceBusy ? 'Loading photo…' : 'View report photo'}</Txt></Pressable> : <Txt bold size={13} style={{ marginTop: 4 }}>None</Txt>}
          </View>
        </View>
        {incident.immediate_danger ? <Txt size={12} bold style={{ color: C.red, marginTop: 12 }}>Immediate danger was reported.</Txt> : null}
      </Section>

      <Section title="Route & location" subtitle={`From ${team?.name || 'your team base'} · straight-line estimate until road routing is enabled`}>
        <AssignmentMap incident={incident} team={team} />
        <Txt muted size={11} style={{ marginTop: 9 }}>{formatAddress(incident)}{hasCoords ? ` · ${incident.latitude}, ${incident.longitude}` : ''}</Txt>
      </Section>

      {item.assignment_status !== 'PENDING' ? (
        <Section title="Rescue record" subtitle="Required before the mission can be resolved" right={<Ionicons name="document-text-outline" size={19} color={C.muted} />}>
          {recordData.loading && !recordData.data ? <Txt muted>Loading rescue record…</Txt> : recordData.data ? (
            <>
              <Txt muted size={11} style={{ marginBottom: 13 }}>{isCompleted ? 'This record is read-only because the mission is resolved.' : 'Record counts, actions, resources, notes, and operation photos.'}</Txt>
              <RescueRecordForm
                key={recordData.data.record?.id ?? 'new-record'}
                incidentId={incident.id}
                record={recordData.data.record}
                editable={Boolean(recordData.data.editable)}
                onSaved={() => { recordData.reload(); assignment.reload(); }}
              />
            </>
          ) : <ErrorNotice message={recordData.error || 'Rescue record could not be loaded.'} />}
        </Section>
      ) : null}

      <Section title="Dispatch info" subtitle="Assignment metadata">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <MiniStat label="ETA" value="—" />
          <MiniStat label="DISTANCE" value={distance == null ? '—' : `${distance.toFixed(1)} km`} />
        </View>
        <Txt muted size={10} style={{ marginTop: 13 }}>Dispatched {formatWhen(item.assigned_at)} · {item.responded_at ? 'response accepted' : 'awaiting response'}</Txt>
      </Section>

      <Section title="Mission timeline" subtitle="Your team’s status history">
        {timeline.length ? timeline.map((entry: any, index: number) => (
          <View key={`${entry.to_status}-${entry.created_at}`} style={{ flexDirection: 'row', gap: 11, paddingBottom: 15 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: index === 0 ? C.red : C.panel3, borderWidth: 2, borderColor: C.red }} />
              {index < timeline.length - 1 ? <View style={{ width: 1, flex: 1, backgroundColor: C.border, marginTop: 3 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Txt size={12} bold>{statusLabel(entry.to_status)}</Txt><Txt muted size={10}>{formatWhen(entry.created_at)}</Txt></View>
              {entry.actor_name ? <Txt muted size={11} style={{ marginTop: 3 }}>{entry.actor_name}</Txt> : null}
              {entry.notes ? <Txt muted size={11} style={{ marginTop: 3 }}>{entry.notes}</Txt> : null}
            </View>
          </View>
        )) : <Empty title="No status history yet" detail="Updates from your team will appear here." />}
      </Section>

      <Modal transparent visible={declineOpen} animationType="slide" onRequestClose={() => setDeclineOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: C.overlay }}>
          <View style={{ backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: C.border }}>
            <Txt size={20} bold>Decline assignment</Txt>
            <Txt muted size={13} style={{ marginTop: 6, marginBottom: 16 }}>Give dispatch a reason so they can reassign the incident.</Txt>
            <Field label="Reason (required)" value={declineReason} onChangeText={setDeclineReason} maxLength={1000} multiline placeholder="Explain why your team cannot respond" inputStyle={{ minHeight: 90, textAlignVertical: 'top' }} />
            <ErrorNotice message={actionError} />
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <Btn secondary disabled={busy} onPress={() => setDeclineOpen(false)}>Cancel</Btn>
              <Btn danger disabled={busy || declineReason.trim().length < 5} onPress={() => respond('DECLINE', declineReason)}>{busy ? 'Submitting…' : 'Decline assignment'}</Btn>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(evidenceUrl)} animationType="fade" onRequestClose={() => setEvidenceUrl('')}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: C.overlay }}>
          <View style={{ backgroundColor: C.panel, borderRadius: 20, padding: 12 }}>
            <Image source={{ uri: evidenceUrl }} resizeMode="contain" style={{ width: '100%', height: 400 }} />
            <Btn secondary full onPress={() => setEvidenceUrl('')}>Close photo</Btn>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

function Fact({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
  return <View style={{ padding: 11, borderRadius: 12, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border }}><Txt muted size={9} bold style={{ letterSpacing: 0.8 }}>{label.toUpperCase()}</Txt><Txt bold size={13} style={{ marginTop: 4 }}>{value}</Txt>{detail ? <Txt muted size={10}>{detail}</Txt> : null}</View>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 66, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2, borderRadius: 13 }}><Txt size={18} bold>{value}</Txt><Txt muted size={9} style={{ letterSpacing: 0.6, marginTop: 3 }}>{label}</Txt></View>;
}

function StatusPill({ status }: { status?: string }) {
  const done = status === 'RESOLVED' || status === 'CLOSED';
  const color = done ? C.green : status === 'ASSIGNED' ? C.blue : C.green;
  return <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: done ? C.greenSoft : C.blueSoft, flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} /><Txt size={10} bold style={{ color }}>{statusLabel(status)}</Txt></View>;
}
