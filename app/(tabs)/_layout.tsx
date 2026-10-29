import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/AppHeader';
import { GlassTabBar } from '../../src/GlassTabBar';
import { C } from '../../src/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: C.bg },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="assignments" options={{ title: 'Assignments', tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="assignment/[id]" options={{ href: null }} />
        <Tabs.Screen name="assignment/[id]/record" options={{ href: null }} />
        <Tabs.Screen name="assignment/[id]/completion" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
