import React from 'react';
import { Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, useThemeMode } from './theme';
import { Txt } from './ui';

const tabs = [
  { route: 'index', label: 'Home', icon: 'grid-outline' as const, active: 'grid' as const },
  { route: 'assignments', label: 'Assignments', icon: 'clipboard-outline' as const, active: 'clipboard' as const },
  { route: 'history', label: 'History', icon: 'time-outline' as const, active: 'time' as const },
  { route: 'team', label: 'Team', icon: 'people-outline' as const, active: 'people' as const },
];

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const mode = useThemeMode();

  return (
    <View style={{ backgroundColor: 'transparent', paddingHorizontal: 14, paddingTop: 5, paddingBottom: Math.max(8, insets.bottom), overflow: 'hidden' }}>
      <View style={{ overflow: 'hidden', borderRadius: 25, borderWidth: 1, borderColor: C.border }}>
        <BlurView tint={mode} intensity={32} style={{ backgroundColor: mode === 'dark' ? 'rgba(21,21,23,0.9)' : 'rgba(255,255,255,0.9)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 68, padding: 4, gap: 3 }}>
            {tabs.map((tab) => {
              const index = state.routes.findIndex((route) => route.name === tab.route);
              if (index < 0) return null;
              const route = state.routes[index];
              const focused = state.index === index;
              const color = focused ? C.red : C.muted;
              const icon = focused ? tab.active : tab.icon;
              const options = descriptors[route.key]?.options;
              const onPress = () => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              };

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
                  onPress={onPress}
                  style={({ pressed }) => ({ flex: 1, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: focused ? C.redSoft : 'transparent', opacity: pressed ? 0.75 : 1 })}
                >
                  <Ionicons name={icon} size={21} color={color} />
                  <Txt size={10} bold={focused} style={{ color, lineHeight: 13 }}>{tab.label}</Txt>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}
