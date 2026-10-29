import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Page, Panel, Section, Txt, ErrorNotice, Btn } from '../../src/ui';
import { useData } from '../../src/useData';
import { api } from '../../src/backend';
import { C } from '../../src/theme';

export default function Team() {
  const { data, error, reload } = useData<any>('/api/rescuer/profile');
  const active = useData<any>('/api/rescuer/assignments?tab=active&page_size=1');
  const [contact, setContact] = useState('');
  const [availability, setAvailability] = useState('AVAILABLE');
  const [editingContact, setEditingContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const locked = Number(active.data?.total ?? 0) > 0;
  const onMission = data?.availability === 'ON_MISSION' || locked;

  useEffect(() => {
    if (data) {
      setContact(data.contact_number ?? '');
      setAvailability(data.availability ?? 'AVAILABLE');
    }
  }, [data]);

  async function updateProfile(values: { contact_number?: string; availability?: string }, message: string) {
    if (!data) return;
    setSaving(true);
    setSaveError('');
    setSavedMessage('');
    try {
      await api('/api/rescuer/profile', 'PUT', {
        contact_number: data.contact_number ?? '',
        availability: data.availability,
        ...values,
      });
      setSavedMessage(message);
      await reload();
      return true;
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : 'Could not save team changes.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveContact() {
    const saved = await updateProfile({ contact_number: contact.trim() }, 'Contact number updated.');
    if (saved) setEditingContact(false);
  }

  const members = data?.members ?? [];
  const coverage = [data?.coverage_city, data?.coverage_province].filter(Boolean).join(', ');
  const baseCoordinates = data?.base_latitude != null && data?.base_longitude != null
    ? `${Number(data.base_latitude).toFixed(5)}, ${Number(data.base_longitude).toFixed(5)}`
    : 'Base location not configured';

  return (
    <Page title="Team profile" subtitle="Rescuers may edit the team contact number and availability only — everything else is admin-owned">
      <ErrorNotice message={error || saveError} />
      {!data && !error ? <Txt muted style={{ padding: 20, textAlign: 'center' }}>Loading team profile…</Txt> : null}
      {data ? (
        <>
          <Panel>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt size={18} bold>{data.name || 'Rescue team'}</Txt>
                {data.description ? <Txt muted style={{ marginTop: 4 }}>{data.description}</Txt> : null}
              </View>
              <StatusBadge status={onMission ? 'ON_MISSION' : availability} />
            </View>

            <View style={{ padding: 20, gap: 14 }}>
              <View style={{ padding: 18, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 20, backgroundColor: C.panel }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Ionicons name="location-outline" size={17} color={C.muted} /><Txt muted size={12} bold>BASE</Txt></View>
                <Txt bold style={{ marginTop: 10 }}>{baseCoordinates}</Txt>
                <Txt muted style={{ marginTop: 3 }}>{coverage ? `${coverage} · ${data.dispatch_radius_km ?? 10} km coverage radius` : 'Coverage details not configured'}</Txt>
              </View>

              <View style={{ padding: 18, minHeight: 112, borderWidth: 1, borderColor: C.border, borderRadius: 20, backgroundColor: C.panel }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Ionicons name="call-outline" size={17} color={C.muted} /><Txt muted size={12} bold>CONTACT NUMBER</Txt></View>
                {editingContact ? (
                  <View style={{ marginTop: 9, gap: 10 }}>
                    <TextInput
                      keyboardType="phone-pad"
                      value={contact}
                      onChangeText={setContact}
                      maxLength={20}
                      placeholder="Enter contact number"
                      placeholderTextColor={C.muted2}
                      style={{ color: C.text, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 12, paddingHorizontal: 12, minHeight: 46 }}
                    />
                    <View style={{ flexDirection: 'row', gap: 9 }}>
                      <Btn disabled={saving} onPress={saveContact}>{saving ? 'Saving…' : 'Save'}</Btn>
                      <Btn secondary disabled={saving} onPress={() => { setContact(data.contact_number ?? ''); setEditingContact(false); setSaveError(''); }}>Cancel</Btn>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Txt size={17} bold style={{ flex: 1 }}>{data.contact_number || 'No contact number added'}</Txt>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Edit contact number"
                      onPress={() => { setContact(data.contact_number ?? ''); setEditingContact(true); setSavedMessage(''); }}
                      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="create-outline" size={19} color={C.muted} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingVertical: 19, borderTopWidth: 1, borderTopColor: C.border }}>
              <Txt size={16} bold>Availability</Txt>
              <Txt muted size={12} style={{ marginTop: 3 }}>{onMission ? 'Your team is on a mission. Availability unlocks when the mission ends.' : 'Set your team off duty or available.'}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Txt muted size={13} bold>Off duty</Txt>
                <Switch
                  value={availability === 'AVAILABLE'}
                  disabled={saving || onMission}
                  onValueChange={(value) => {
                    if (onMission) return;
                    const next = value ? 'AVAILABLE' : 'OFF_DUTY';
                    setAvailability(next);
                    updateProfile({ availability: next }, 'Availability updated.').catch(() => {});
                  }}
                  trackColor={{ true: C.green, false: C.panel3 }}
                  thumbColor={C.white}
                  accessibilityLabel="Team availability"
                />
                <Txt size={13} bold>Available</Txt>
              </View>
              {savedMessage ? <Txt size={12} style={{ color: C.green, marginTop: 8 }}>{savedMessage}</Txt> : null}
            </View>
          </Panel>

          <Section title={`Members (${members.length})`} subtitle="Linked rescuer accounts" right={<Ionicons name="people-outline" size={20} color={C.muted} />} bodyStyle={{ paddingHorizontal: 20, paddingVertical: 0 }}>
            {members.map((member: any, index: number) => (
              <View key={member.user_id || member.id || index} style={{ minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: index === members.length - 1 ? 0 : 1, borderBottomColor: C.border }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: index % 2 ? '#11a98f' : '#00b89c' }}>
                  <Txt size={14} bold style={{ color: '#ffffff' }}>{initials(member.full_name || member.name)}</Txt>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt bold>{member.full_name || member.name || 'Rescuer'}</Txt>
                  {member.email ? <Txt muted size={12}>{member.email}</Txt> : null}
                </View>
                <View accessibilityLabel="Active team membership" style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }} />
              </View>
            ))}
            {!members.length ? <Txt muted style={{ paddingVertical: 20 }}>No linked members.</Txt> : null}
          </Section>
        </>
      ) : null}
    </Page>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'AVAILABLE' ? C.green : status === 'ON_MISSION' ? C.warning : C.muted;
  const bg = status === 'AVAILABLE' ? C.greenSoft : status === 'ON_MISSION' ? '#33291a' : C.panel3;
  const label = status === 'ON_MISSION' ? 'On mission' : status === 'OFF_DUTY' ? 'Off duty' : 'Available';
  return <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', gap: 7 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} /><Txt size={12} bold style={{ color: tone }}>{label}</Txt></View>;
}

function initials(name?: string) {
  return (name ?? '?').split(/\s+/).map((word) => word[0] || '').join('').slice(0, 2).toUpperCase();
}
