import React from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './auth';
import { C, toggleTheme, useThemeMode } from './theme';
import { Txt } from './ui';
import { useData } from './useData';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mode = useThemeMode();
  const { profile, signOut } = useAuth();
  const notifications = useData('/api/notifications');
  const unread = Number(notifications.data?.unread_count ?? 0);
  const initials = (profile?.full_name ?? 'R')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function openAccount() {
    Alert.alert('Rescuer account', profile?.full_name || 'Kalinga Rescuer', [
      { text: 'Team profile', onPress: () => router.push('/(tabs)/team') },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut().catch(() => {}) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border, overflow: 'hidden' }}>
      <BlurView tint={mode} intensity={25} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <View style={{ height: 54, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Image source={require('../assets/kalinga-symbol.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
        <Txt size={17} bold style={{ flex: 1, letterSpacing: -0.3 }}>Kalinga</Txt>
        <HeaderAction label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onPress={toggleTheme}>
          <Ionicons name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={C.text} />
        </HeaderAction>
        <HeaderAction label="Notifications" onPress={() => router.push('/(tabs)/notifications')}>
          <Ionicons name="notifications-outline" size={20} color={C.text} />
          {unread > 0 ? <View style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, borderWidth: 1, borderColor: C.panel }} /> : null}
        </HeaderAction>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account menu"
          onPress={openAccount}
          style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}
        >
          <View style={{ width: 34, height: 34, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.borderStrong }}>
            <Txt size={12} bold style={{ color: C.red }}>{initials}</Txt>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function HeaderAction({ children, label, onPress }: { children: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1 })}
    >
      {children}
    </Pressable>
  );
}
