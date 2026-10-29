import React, { useEffect } from 'react';
import { Alert, Modal, Vibration, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C } from './theme';
import { Btn, Txt } from './ui';
import { AssignmentAlarm } from './usePushNotifications';

export function AssignmentAlarmOverlay({
  alarm,
  onStop,
  onSnooze,
}: {
  alarm: AssignmentAlarm | null;
  onStop: () => void;
  onSnooze: () => Promise<void>;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!alarm) return undefined;
    Vibration.vibrate([0, 400, 200, 400, 200, 400], true);
    return () => Vibration.cancel();
  }, [alarm?.assignmentId]);

  async function snooze() {
    try {
      await onSnooze();
    } catch {
      Alert.alert('Could not snooze', 'The five-minute reminder could not be scheduled.');
    }
  }

  return (
    <Modal visible={Boolean(alarm)} animationType="fade" onRequestClose={onStop} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
          <Ionicons name="warning" size={52} color={C.red} />
        </View>
        <Txt size={12} bold style={{ letterSpacing: 2, color: C.red, textAlign: 'center' }}>INCOMING ASSIGNMENT</Txt>
        <Txt size={27} bold style={{ textAlign: 'center', marginTop: 10 }}>{alarm?.title || 'New rescue assignment'}</Txt>
        <Txt muted size={15} style={{ textAlign: 'center', maxWidth: 360, marginTop: 10, marginBottom: 30 }}>{alarm?.body || 'Your team has a new assignment.'}</Txt>
        <View style={{ width: '100%', maxWidth: 380, gap: 10 }}>
          <Btn full onPress={() => {
            const id = alarm?.assignmentId;
            onStop();
            if (id) router.push(`/assignment/${id}`);
          }}>View assignment</Btn>
          <Btn full secondary onPress={snooze}>Snooze 5 minutes</Btn>
          <Btn full outline onPress={onStop}>Stop alarm</Btn>
        </View>
        <Txt muted size={11} style={{ textAlign: 'center', maxWidth: 320, marginTop: 22 }}>Accepting or declining still happens on the assignment page.</Txt>
      </View>
    </Modal>
  );
}
