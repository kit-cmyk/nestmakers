import { View } from 'react-native';

// Render nothing — _layout.tsx handles all auth-based routing once the
// Supabase session resolves, preventing a flash of the welcome screen for
// already-authenticated users on every app start.
export default function Index() {
  return <View style={{ flex: 1 }} />;
}
