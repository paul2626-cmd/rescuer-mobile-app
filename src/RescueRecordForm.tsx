import React, { useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from './backend';
import { C } from './theme';
import { Btn, ErrorNotice, Field, Txt } from './ui';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ASSET_OPTIONS = [
  'Rescue boat', 'Ambulance', 'Fire truck', 'Chainsaw', 'Life vests',
  'First aid kit', 'Rope kit', 'Service van', 'Generator', 'Ladder',
];

type PhotoAsset = ImagePicker.ImagePickerAsset;
type RecordPhoto = { id: string; url: string; original_filename?: string; mime_type?: string };

export function RescueRecordForm({
  incidentId,
  record,
  editable,
  onSaved,
}: {
  incidentId: string;
  record: any;
  editable: boolean;
  onSaved?: () => void;
}) {
  const [rescued, setRescued] = useState(String(record?.people_rescued ?? 0));
  const [injured, setInjured] = useState(String(record?.people_injured ?? 0));
  const [evacuated, setEvacuated] = useState(String(record?.people_evacuated ?? 0));
  const [casualties, setCasualties] = useState(String(record?.casualties_missing ?? 0));
  const [actions, setActions] = useState(record?.actions_taken ?? '');
  const [resources, setResources] = useState<string>(record?.resources_used ?? '');
  const [notes, setNotes] = useState(record?.operation_notes ?? '');
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const savedPhotos: RecordPhoto[] = Array.isArray(record?.photos) ? record.photos : [];
  const selectedAssets = useMemo<string[]>(
    () => resources.split(',').map((value) => value.trim()).filter(Boolean),
    [resources],
  );
  const photoCount = savedPhotos.length + photos.length;
  const counts = [rescued, injured, evacuated, casualties];
  const countsValid = counts.every((value) => value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 100000);
  const finalReady = countsValid && actions.trim().length >= 5 && photoCount <= MAX_PHOTOS;

  function acceptPhotos(chosen: PhotoAsset[]) {
    if (savedPhotos.length + photos.length + chosen.length > MAX_PHOTOS) {
      setError('Up to 5 photos are allowed.');
      return;
    }
    const invalid = chosen.find((photo) => {
      const mime = photo.mimeType ?? '';
      const allowed = ['image/jpeg', 'image/png'].includes(mime);
      return !allowed || (photo.fileSize != null && photo.fileSize > MAX_PHOTO_BYTES);
    });
    if (invalid) {
      setError('Photos must be JPEG or PNG and 5 MB or smaller.');
      return;
    }
    setError('');
    setPhotos((current) => [...current, ...chosen]);
  }

  async function chooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo library access to attach operation photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - photoCount),
      quality: 0.85,
    });
    if (!result.canceled) acceptPhotos(result.assets);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Allow camera access to take operation photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) acceptPhotos(result.assets);
  }

  function openPhotoOptions() {
    Alert.alert('Operation photos', 'Add evidence from your device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose photos', onPress: () => { chooseFromLibrary().catch(() => setError('Could not open your photo library. Try again.')); } },
      { text: 'Take photo', onPress: () => { takePhoto().catch(() => setError('Could not open the camera. Try again.')); } },
    ]);
  }

  function toggleAsset(asset: string) {
    const next = selectedAssets.includes(asset)
      ? selectedAssets.filter((entry) => entry !== asset)
      : [...selectedAssets, asset];
    setResources(next.join(', '));
  }

  async function save(draft: boolean) {
    if (!countsValid) {
      setError('Enter whole numbers from 0 to 100,000 for each count.');
      return;
    }
    if (photoCount > MAX_PHOTOS) {
      setError('Up to 5 photos are allowed.');
      return;
    }
    if (!draft && actions.trim().length < 5) {
      setError('Describe the actions taken (at least 5 characters) before saving the record.');
      return;
    }

    const body = new FormData();
    body.append('is_draft', String(draft));
    body.append('people_rescued', rescued);
    body.append('people_injured', injured);
    body.append('people_evacuated', evacuated);
    body.append('casualties_missing', casualties);
    body.append('actions_taken', actions);
    body.append('resources_used', resources);
    body.append('operation_notes', notes);
    photos.forEach((photo, index) => {
      const fileName = photo.fileName || `operation-photo-${Date.now()}-${index}.jpg`;
      const mimeType = photo.mimeType || (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      body.append('photos', { uri: photo.uri, name: fileName, type: mimeType } as any);
    });

    setSaving(true);
    setError('');
    try {
      await api(`/api/rescuer/incidents/${incidentId}/record`, record ? 'PUT' : 'POST', body);
      setPhotos([]);
      onSaved?.();
      Alert.alert(draft ? 'Draft saved' : 'Record saved', draft ? 'Your rescue record draft was saved.' : 'The rescue record is ready for review.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The rescue record could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      {!editable ? (
        <View style={{ backgroundColor: C.panel2, borderRadius: 12, padding: 13, marginBottom: 14 }}>
          <Txt muted size={12}>This incident is resolved. The rescue record is read-only.</Txt>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CountField label="Rescued" value={rescued} onChangeText={setRescued} editable={editable && !saving} />
        <CountField label="Evacuated" value={evacuated} onChangeText={setEvacuated} editable={editable && !saving} />
        <CountField label="Injured" value={injured} onChangeText={setInjured} editable={editable && !saving} />
      </View>
      <Field
        label="Casualties / missing"
        value={casualties}
        onChangeText={setCasualties}
        editable={editable && !saving}
        keyboardType="number-pad"
        maxLength={6}
      />

      <Field
        label="Actions taken *"
        value={actions}
        onChangeText={setActions}
        editable={editable && !saving}
        placeholder="Describe the actions taken"
        multiline
        maxLength={2000}
        inputStyle={{ minHeight: 92, textAlignVertical: 'top' }}
      />
      {editable && actions.trim().length < 5 ? (
        <Txt size={11} style={{ color: C.warning, marginTop: -8, marginBottom: 12 }}>Actions taken is required before saving the record or submitting completion.</Txt>
      ) : null}

      <View style={{ marginBottom: 14 }}>
        <Txt size={12} bold>Assets used</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
          {ASSET_OPTIONS.map((asset) => {
            const active = selectedAssets.includes(asset);
            return (
              <Pressable
                key={asset}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => editable && !saving && toggleAsset(asset)}
                style={{ borderRadius: 999, borderWidth: 1, borderColor: active ? C.red : C.border, backgroundColor: active ? C.redSoft : C.panel2, paddingHorizontal: 10, paddingVertical: 6, opacity: editable ? 1 : 0.55 }}
              >
                <Txt size={10} style={{ color: active ? C.redInk : C.muted }}>{asset}</Txt>
              </Pressable>
            );
          })}
        </View>
        <Field label="Other assets or resources" value={resources} onChangeText={setResources} editable={editable && !saving} maxLength={2000} style={{ marginTop: 10 }} />
      </View>

      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        editable={editable && !saving}
        placeholder="Follow-ups, endorsements…"
        multiline
        maxLength={2000}
        inputStyle={{ minHeight: 82, textAlignVertical: 'top' }}
      />

      <View style={{ marginBottom: 15 }}>
        <Txt size={12} bold>Operation photos</Txt>
        <Txt muted size={11} style={{ marginTop: 4 }}>{photoCount} of {MAX_PHOTOS} photos. JPEG or PNG, up to 5 MB each.</Txt>
        {savedPhotos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 9 }}>
            {savedPhotos.map((photo) => (
              <Pressable key={photo.id} accessibilityRole="imagebutton" accessibilityLabel="Open saved operation photo" onPress={() => Linking.openURL(photo.url).catch(() => setError('The saved photo could not be opened.'))}>
                <Image source={{ uri: photo.url }} style={{ width: 72, height: 72, borderRadius: 11, backgroundColor: C.panel2 }} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
            {photos.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} style={{ width: 78 }}>
                <Image source={{ uri: photo.uri }} style={{ width: 72, height: 72, borderRadius: 11, backgroundColor: C.panel2 }} />
                <Pressable accessibilityRole="button" accessibilityLabel="Remove selected photo" onPress={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={{ position: 'absolute', top: -6, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
                <Txt muted size={9} numberOfLines={1} style={{ marginTop: 3 }}>{photo.fileName || 'Photo'}</Txt>
              </View>
            ))}
          </ScrollView>
        ) : null}
        {editable ? (
          <Pressable accessibilityRole="button" onPress={openPhotoOptions} disabled={saving || photoCount >= MAX_PHOTOS} style={({ pressed }) => ({ borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 13, backgroundColor: C.panel2, opacity: saving || photoCount >= MAX_PHOTOS ? 0.45 : pressed ? 0.72 : 1 })}>
            <Txt bold size={12} style={{ textAlign: 'center' }}>Add operation photos</Txt>
            <Txt muted size={10} style={{ textAlign: 'center', marginTop: 3 }}>Choose from your device or take a photo</Txt>
          </Pressable>
        ) : null}
      </View>

      <ErrorNotice message={error} />
      {editable ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          <Btn secondary disabled={saving} onPress={() => save(true)}>{saving ? 'Saving…' : 'Save draft'}</Btn>
          <Btn disabled={saving || !finalReady} onPress={() => save(false)}>{saving ? 'Saving…' : 'Save record'}</Btn>
        </View>
      ) : null}
    </View>
  );
}

function CountField({ label, value, onChangeText, editable }: { label: string; value: string; onChangeText: (value: string) => void; editable: boolean }) {
  return (
    <View style={{ flex: 1, marginBottom: 12 }}>
      <Txt size={10} muted bold numberOfLines={1}>{label}</Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        editable={editable}
        placeholder="0"
        placeholderTextColor={C.muted2}
        style={{ borderWidth: 1, borderColor: C.borderStrong, borderRadius: 12, backgroundColor: C.panel2, color: C.text, minHeight: 43, paddingHorizontal: 11, marginTop: 5, opacity: editable ? 1 : 0.6 }}
      />
    </View>
  );
}
