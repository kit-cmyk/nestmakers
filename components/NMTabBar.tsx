import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';

const TABS = [
  { id: 'browse', label: 'Browse', icon: 'home-outline' as const, route: '/(tabs)/browse' },
  { id: 'interest', label: 'Interest', icon: 'heart-outline' as const, route: '/(tabs)/interest' },
  { id: 'threads', label: 'Threads', icon: 'chatbubble-outline' as const, route: '/(tabs)/threads' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' as const, route: '/(tabs)/profile' },
];

interface Props {
  active?: string;
}

export default function NMTabBar({ active }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const path = usePathname();

  return (
    <View style={[s.outer, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={s.inner}>
        {TABS.map((tab) => {
          const on = active ? tab.id === active : path.includes(tab.id);
          return (
            <TouchableOpacity
              key={tab.id}
              style={[s.item, on ? s.itemOn : null]}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={on ? tab.icon.replace('-outline', '') as any : tab.icon}
                size={20}
                color={on ? NM.lavenderDeep : NM.ink3}
              />
              <Text style={[s.label, { color: on ? NM.lavenderDeep : NM.ink3 }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  inner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: NM.r.pill,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...NM.shadow.card,
    borderWidth: 1,
    borderColor: NM.hair,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: NM.r.pill,
  },
  itemOn: {
    backgroundColor: NM.lavenderSoft,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
