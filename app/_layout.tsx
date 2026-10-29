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
  const showWaiting = !configError && (!ready || (Boolean(session) && profileLoading));
  const showLoginRedirect = ready && !session && !configError;
  const showProfileError = Boolean(ready && session && !profileLoading && !configError && profileError);
  const showWrongRole = Boolean(
    ready && session && !profileLoading && !configError && !profileError && profile && profile.role !== 'RESCUER',
  );
  const showAlarm = Boolean(
    ready && session && !profileLoading && !configError && !profileError && profile?.role === 'RESCUER',
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
      </Stack>
      {showLoginRedirect ? <Redirect href="/login" /> : null}

      {showWaiting ? (
        <View style={{ position: 'absolute', inset: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator color={C.red} size="large" />
          <Txt muted style={{ marginTop: 12 }}>
            {ready ? 'Connecting to the rescue service…' : 'Checking your saved sign-in…'}
          </Txt>
          {ready && profileLoading ? (
            <Txt muted style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 36 }}>
              The server may take a little longer to start. You can retry if it does not respond.
            </Txt>
          ) : null}
        </View>
      ) : null}

      {configError ? (
        <View style={{ position: 'absolute', inset: 0, zIndex: 11, justifyContent: 'center', padding: 24, backgroundColor: C.bg }}>
          <Txt size={25} bold style={{ marginBottom: 12 }}>We couldn’t restore your sign-in</Txt>
          <ErrorNotice message={configError} />
          <Txt muted style={{ marginTop: 14 }}>
            Clear the saved session to return to sign in. Your account and rescue records will not be changed.
          </Txt>
          <Btn style={{ marginTop: 20 }} onPress={() => signOut().catch(() => {})}>
            Clear session and sign in
          </Btn>
        </View>
      ) : null}

      {showProfileError ? (
        <View style={{ position: 'absolute', inset: 0, zIndex: 11, justifyContent: 'center', padding: 24, backgroundColor: C.bg }}>
          <Txt size={25} bold style={{ marginBottom: 12 }}>Could not verify your account</Txt>
          <ErrorNotice message={profileError} />
          <Btn onPress={() => refreshProfile().catch(() => {})}>Try again</Btn>
          <Btn secondary style={{ marginTop: 10 }} onPress={() => signOut().catch(() => {})}>Sign out</Btn>
        </View>
      ) : null}

      {showWrongRole ? (
        <View style={{ position: 'absolute', inset: 0, zIndex: 11, justifyContent: 'center', padding: 24, backgroundColor: C.bg }}>
          <Txt size={26} bold style={{ marginBottom: 10 }}>Rescuer account required</Txt>
          <Txt muted style={{ marginBottom: 24 }}>This mobile app only opens Rescuer tools. Your account was verified by the server and has a different role.</Txt>
          <Btn onPress={() => signOut().catch(() => {})}>Sign out</Btn>
        </View>
      ) : null}

      {showAlarm ? <AssignmentAlarmOverlay alarm={push.alarm} onStop={push.clearAlarm} onSnooze={push.snoozeAlarm} /> : null}
    </View>
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
