import React from 'react';
import { RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../../../../src/useData';
import { RescueRecordForm } from '../../../../src/RescueRecordForm';
import { formatWhen, statusLabel } from '../../../../src/format';
import { Btn, ErrorNotice, Page, Section, Txt } from '../../../../src/ui';

export default function RescueRecord() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId ?? '');
  const router = useRouter();
  const assignment = useData<any>(id ? `/api/rescuer/assignments/${encodeURIComponent(id)}` : null);
  const incident = assignment.data?.incident;
  const detail = useData<any>(incident?.id ? `/api/rescuer/incidents/${incident.id}/record` : null);

  return (
    <Page
      title="Rescue record"
      subtitle={incident ? `${incident.public_reference} · ${statusLabel(incident.status)}` : 'Record people, actions, resources, and operation photos.'}
      refreshControl={<RefreshControl refreshing={assignment.loading || detail.loading} onRefresh={() => { assignment.reload(); detail.reload(); }} />}
    >
      <ErrorNotice message={assignment.error || detail.error} />
      {assignment.loading || detail.loading ? <Txt muted>Loading rescue record…</Txt> : null}
      {detail.data ? (
        <Section title="Rescue record" subtitle={detail.data.editable ? 'Drafts can be updated until the incident is resolved.' : `Resolved ${formatWhen(incident?.resolved_at)} · read-only`}>
          <RescueRecordForm
            key={detail.data.record?.id ?? 'new-record'}
            incidentId={incident.id}
            record={detail.data.record}
            editable={Boolean(detail.data.editable)}
            onSaved={() => { detail.reload(); assignment.reload(); }}
          />
          {detail.data.record ? <Btn secondary onPress={() => router.push(`/assignment/${id}/completion`)} style={{ marginTop: 12 }}>Review completion report</Btn> : null}
        </Section>
      ) : null}
      {!assignment.loading && !detail.loading && !detail.data ? <Btn secondary onPress={() => router.back()}>Back to assignment</Btn> : null}
    </Page>
  );
}
