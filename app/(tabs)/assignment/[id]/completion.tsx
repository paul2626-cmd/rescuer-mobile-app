import React, { useState } from 'react';
import { Alert, Image, RefreshControl, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../../../../src/useData';
import { api } from '../../../../src/backend';
import { downloadCompletionPdf } from '../../../../src/download';
import { C } from '../../../../src/theme';
import { Btn, Empty, ErrorNotice, Page, Section, Txt } from '../../../../src/ui';
import { formatDuration, formatWhen, statusLabel } from '../../../../src/format';

export default function CompletionReport() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const router = useRouter();
  const data = useData<any>(id ? `/api/rescuer/incidents/${encodeURIComponent(id)}/record` : null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const incident = data.data?.incident;
  const record = data.data?.record;
  const summary = data.data?.summary;
  const completed = incident?.status === 'RESOLVED' || incident?.status === 'CLOSED';
  const canSubmit = incident?.status === 'IN_PROGRESS' && Boolean(record?.actions_taken?.trim());

  async function submit() {
    if (!incident?.id) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/rescuer/incidents/${incident.id}/complete`, 'POST');
      setNotice('Completion report submitted. The Admin/Dispatcher has been notified.');
      await data.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The completion report could not be submitted.');
      if ((submitError as any)?.status === 404 || (submitError as any)?.status === 409) await data.reload();
    } finally {
      setBusy(false);
    }
  }

  function confirmSubmit() {
    Alert.alert(
      'Confirm completion report',
      'Submitting marks this incident resolved, locks the rescue record, and notifies the Admin/Dispatcher. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, submit report', style: 'destructive', onPress: () => { submit().catch(() => {}); } },
      ],
    );
  }

  async function download() {
    if (!incident?.id) return;
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadCompletionPdf(incident.id, `${incident.public_reference || 'incident'}-completion-report.pdf`);
    } catch (downloadFailure) {
      setDownloadError(downloadFailure instanceof Error ? downloadFailure.message : 'The PDF could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Page
      eyebrow="Mission report"
      title="Completion report"
      subtitle={incident ? `${incident.public_reference} · ${summary?.team?.name ?? 'Your team'}` : 'Review and submit the rescue operation report.'}
      refreshControl={<RefreshControl refreshing={data.loading} onRefresh={data.reload} tintColor={C.red} colors={[C.red]} />}
    >
      <ErrorNotice message={data.error || error} />
      {data.loading && !data.data ? <Txt muted>Loading completion report…</Txt> : null}
      {data.data ? (
        <>
          <Section title="Operation" subtitle="Timing and team" right={<StatusBadge status={incident.status} />}>
            <InfoRow label="Team" value={summary?.team?.name || 'Unknown team'} />
            <InfoRow label="Operation started" value={formatWhen(summary?.started_at)} />
            <InfoRow label="Operation finished" value={formatWhen(summary?.finished_at)} />
            <InfoRow label="Duration" value={summary?.duration_seconds == null ? 'Not finished yet' : formatDuration(summary.duration_seconds)} />
            <Txt muted size={11} style={{ marginTop: 11 }}>{completed ? 'This incident is resolved. The rescue record is locked.' : 'Review the operation record before submitting it to the Admin/Dispatcher.'}</Txt>
          </Section>

          {!record ? (
            <Section title="Rescue record required" subtitle="Add the operation outcome before submitting completion.">
              <Empty title="No rescue record yet" detail="Record the outcome, actions taken, and any photos first." />
              <Btn onPress={() => router.push(`/assignment/${id}/record`)}>Record the operation</Btn>
            </Section>
          ) : (
            <>
              <Section title="People" subtitle="Recorded counts">
                <InfoRow label="People rescued" value={String(record.people_rescued ?? 0)} />
                <InfoRow label="People injured" value={String(record.people_injured ?? 0)} />
                <InfoRow label="People evacuated" value={String(record.people_evacuated ?? 0)} />
                <InfoRow label="Casualties or missing" value={String(record.casualties_missing ?? 0)} />
              </Section>
              <Section title="Actions taken"><Txt>{record.actions_taken || '—'}</Txt></Section>
              <Section title="Resources used"><Txt>{record.resources_used || '—'}</Txt></Section>
              <Section title="Operation notes"><Txt>{record.operation_notes || '—'}</Txt></Section>
              {record.photos?.length ? (
                <Section title="Operation photos" subtitle={`${record.photos.length} saved`}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {record.photos.map((photo: any) => <Image key={photo.id} source={{ uri: photo.url }} style={{ width: 82, height: 82, borderRadius: 12, backgroundColor: C.panel2 }} />)}
                  </View>
                </Section>
              ) : null}
            </>
          )}

          {completed && record ? (
            <Section title="Download completion report">
              <Btn disabled={downloading} onPress={download}>{downloading ? 'Preparing PDF…' : 'Download PDF report'}</Btn>
              <ErrorNotice message={downloadError} />
            </Section>
          ) : incident.status === 'IN_PROGRESS' && record ? (
            <Section title="Submit completion report">
              <Txt muted size={12} style={{ marginBottom: 13 }}>Submission resolves the incident and makes the rescue record read-only.</Txt>
              <Btn disabled={busy || !canSubmit} onPress={confirmSubmit}>{busy ? 'Submitting…' : 'Submit completion report'}</Btn>
              {!canSubmit ? <Txt size={11} style={{ color: C.warning, marginTop: 10 }}>Describe the actions taken before submitting.</Txt> : null}
              {notice ? <Txt size={12} style={{ color: C.green, marginTop: 10 }}>{notice}</Txt> : null}
            </Section>
          ) : !completed ? (
            <Section title="Completion not available">
              <Txt muted size={12}>Reach the IN PROGRESS stage before submitting the completion report. Current status: {statusLabel(incident.status)}.</Txt>
            </Section>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border }}><Txt muted size={12} style={{ flex: 1 }}>{label}</Txt><Txt size={12} bold style={{ flex: 1, textAlign: 'right' }}>{value}</Txt></View>;
}

function StatusBadge({ status }: { status?: string }) {
  const completed = status === 'RESOLVED' || status === 'CLOSED';
  return <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: completed ? C.greenSoft : C.blueSoft }}><Txt size={10} bold style={{ color: completed ? C.green : C.blue }}>{statusLabel(status)}</Txt></View>;
}
