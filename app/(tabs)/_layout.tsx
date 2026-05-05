import { Tabs } from 'expo-router';

export default function TabsLayout() {
  // Using Expo Router's Tabs but with a fully custom tab bar via NMTabBar
  // rendered inside each screen to allow the floating pill design.
  // We hide the native tab bar entirely.
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="browse" />
      <Tabs.Screen name="interest" />
      <Tabs.Screen name="threads" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
