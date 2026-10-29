import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth';
import { usePushNotifications } from '../src/usePushNotifications';
import { AssignmentAlarmOverlay } from '../src/AssignmentAlarmOverlay';
import { Btn, ErrorNotice, Txt } from '../src/ui';
import { C, useThemeMode } from '../src/theme';

function Gate() {
  const {
    ready,
    session,
    profile,
    profileLoading,
    profileError,
    configError,
    refreshProfile,
    signOut,
  } = useAuth();
  const theme = useThemeMode();
  const push = usePushNotifications(session, profile?.role);

  if (!ready || (session && profileLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.red} size="large" />
        <Txt muted style={{ marginTop: 12 }}>Restoring your secure session…</Txt>
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (profileError || configError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: C.bg }}>
        <Txt size={25} bold style={{ marginBottom: 12 }}>Could not verify your account</Txt>
        <ErrorNotice message={profileError || configError} />
        {profileError ? <Btn onPress={() => refreshProfile().catch(() => {})}>Try again</Btn> : null}
        <Btn secondary style={{ marginTop: 10 }} onPress={() => signOut().catch(() => {})}>Sign out</Btn>
      </View>
    );
  }

  if (profile && profile.role !== 'RESCUER') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: C.bg }}>
        <Txt size={26} bold style={{ marginBottom: 10 }}>Rescuer account required</Txt>
        <Txt muted style={{ marginBottom: 24 }}>This mobile app only opens Rescuer tools. Your account was verified by the server and has a different role.</Txt>
        <Btn onPress={() => signOut().catch(() => {})}>Sign out</Btn>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
      </Stack>
      <AssignmentAlarmOverlay alarm={push.alarm} onStop={push.clearAlarm} onSnooze={push.snoozeAlarm} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
