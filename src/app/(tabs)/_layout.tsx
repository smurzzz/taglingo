import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/taglingo/BottomNav';

/** The five primary destinations; every tab screen keeps the bottom nav visible. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => <BottomNav />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="browse" />
      <Tabs.Screen name="study" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
