import React, { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Field, Btn, Empty, ErrorNotice, Page, Panel, Section, Txt } from '../../src/ui';
import { useData } from '../../src/useData';
import { unwrapItems } from '../../src/backend';
import { C } from '../../src/theme';
import { formatAddress, formatDuration, formatWhen, incidentLabel, INCIDENT_TYPES, statusLabel } from '../../src/format';

const PAGE_SIZE = 20;

export default function History() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', type: '' });
  const [page, setPage] = useState(1);
  const [filterError, setFilterError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.type) params.set('type', filters.type);
    return params.toString();
  }, [filters, page]);
  const history = useData(`/api/rescuer/history?${query}`);
  const stats = useData('/api/rescuer/stats');
  const data = history.data as any;
  const summary = stats.data as any;
  const rows = unwrapItems(data);
  const total = Number(data?.total ?? 0);
  const currentPage = Number(data?.page ?? page);
  const pageSize = Number(data?.page_size ?? PAGE_SIZE);

  function applyFilters() {
    const date = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !date.test(from)) || (to && !date.test(to))) {
      setFilterError('Enter dates in YYYY-MM-DD format.');
      return;
    }
    if (from && to && from > to) {
      setFilterError('To date must not be before the from date.');
      return;
    }
    setFilterError('');
    setPage(1);
    setFilters({ from, to, type });
  }

  function resetFilters() {
    setFrom('');
    setTo('');
    setType('');
    setFilters({ from: '', to: '', type: '' });
    setFilterError('');
    setPage(1);
  }

  const statRows = [
    ['Total missions', summary?.total_missions ?? 0, 'Recorded team missions'],
    ['People rescued', summary?.total_people_rescued ?? 0, 'Recorded rescue count'],
    ['Average response time', formatDuration(summary?.average_response_seconds), 'Across completed missions'],
  ];

  return (
    <Page
      eyebrow="Mission records"
      title="Rescue history"
      subtitle="Review team statistics and completed assignments."
      refreshControl={<RefreshControl refreshing={history.loading || stats.loading} onRefresh={() => { history.reload(); stats.reload(); }} tintColor={C.red} colors={[C.red]} />}
    >
      <ErrorNotice message={history.error || stats.error} />
      {statRows.map(([label, value, hint]) => (
        <Panel key={String(label)} style={{ padding: 15, backgroundColor: C.panel2, borderRadius: 20, minHeight: 112 }}>
          <Txt muted size={13}>{label}</Txt>
          <Txt size={29} bold style={{ marginTop: 4, letterSpacing: -0.8 }}>{value}</Txt>
          <Txt muted size={11} style={{ marginTop: 2 }}>{hint}</Txt>
        </Panel>
      ))}

      <Section title="Completed missions" subtitle="Filter previous assignments" right={<View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.panel3 }}><Txt size={11} bold>{total} {total === 1 ? 'record' : 'records'}</Txt></View>}>
        <Field label="From date" value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        <Field label="To date" value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        <View style={{ gap: 7, marginBottom: 13 }}>
          <Txt size={12} bold>Incident type</Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose incident type"
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 13, backgroundColor: C.panel, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: pressed ? 0.75 : 1 })}
          >
            <Txt>{type ? incidentLabel(type) : 'All types'}</Txt>
            <Ionicons name="chevron-down" size={18} color={C.muted} />
          </Pressable>
        </View>
        <ErrorNotice message={filterError} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Btn onPress={applyFilters}>Apply filters</Btn>
          <Pressable accessibilityRole="button" onPress={resetFilters}><Txt size={13} bold style={{ color: C.red }}>Reset</Txt></Pressable>
        </View>

        {history.loading && !history.data ? <Txt muted style={{ textAlign: 'center', padding: 20 }}>Loading completed missions…</Txt> : null}
        {!history.loading && !history.error && rows.length === 0 ? <Empty title="No completed missions" detail="Finished operations will appear here." /> : null}
        {rows.map((item: any) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => router.push(`/assignment/${item.id}`)}
            style={({ pressed }) => ({ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.72 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <Txt size={12} bold style={{ color: C.red }}>{item.public_reference}</Txt>
                <Txt bold>{incidentLabel(item.incident_type)}</Txt>
                <Txt muted size={12}>{formatAddress(item.location)}</Txt>
                <Txt muted size={11}>{formatWhen(item.date)} · {item.people_rescued ?? 0} rescued · {formatDuration(item.duration_seconds)}</Txt>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 9 }}>
                <StatusPill status={item.status} />
                <Ionicons name="arrow-forward" size={17} color={C.muted} />
              </View>
            </View>
          </Pressable>
        ))}
        {rows.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <Btn outline disabled={currentPage <= 1} onPress={() => setPage((current) => Math.max(1, current - 1))}>Previous</Btn>
            <Txt muted size={12}>Page {currentPage}</Txt>
            <Btn outline disabled={currentPage * pageSize >= total} onPress={() => setPage((current) => current + 1)}>Next</Btn>
          </View>
        ) : null}
      </Section>

      <Modal transparent visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: C.overlay }}>
          <View style={{ maxHeight: '72%', paddingTop: 16, paddingHorizontal: 18, paddingBottom: 24, backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderColor: C.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: C.border }}>
              <Txt size={18} bold>Incident type</Txt>
              <Pressable accessibilityRole="button" onPress={() => setPickerOpen(false)}><Ionicons name="close" size={22} color={C.text} /></Pressable>
            </View>
            <ScrollView>
              {[{ value: '', label: 'All types' }, ...INCIDENT_TYPES].map((option) => (
                <Pressable
                  key={option.value || 'all'}
                  onPress={() => { setType(option.value); setPickerOpen(false); }}
                  style={({ pressed }) => ({ minHeight: 48, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: pressed ? 0.7 : 1 })}
                >
                  <Txt>{option.label}</Txt>
                  {type === option.value ? <Ionicons name="checkmark" size={18} color={C.red} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

function StatusPill({ status }: { status?: string }) {
  const done = status === 'RESOLVED' || status === 'CLOSED';
  return <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: done ? C.greenSoft : C.blueSoft }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: done ? C.green : C.blue }} /><Txt size={10} bold style={{ color: done ? C.green : C.blue }}>{statusLabel(status)}</Txt></View>;
}
