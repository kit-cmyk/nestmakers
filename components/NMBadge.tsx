import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NM } from '@/constants/tokens';

type Tone = 'lavender' | 'peach' | 'butter' | 'sage' | 'rose' | 'sky' | 'ink' | 'danger';

const TONE_MAP: Record<Tone, [string, string]> = {
  lavender: [NM.lavenderSoft, NM.lavenderDeep],
  peach: [NM.peachSoft, NM.peachDeep],
  butter: [NM.butterSoft, NM.gold],
  sage: [NM.sageSoft, '#6B8E56'],
  rose: [NM.roseSoft, '#B15474'],
  sky: [NM.skySoft, '#4A7B9E'],
  ink: [NM.ink, NM.cream],
  danger: [NM.dangerSoft, NM.danger],
};

interface Props {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function NMBadge({ tone = 'lavender', children, icon }: Props) {
  const [bg, fg] = TONE_MAP[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      {icon && <View style={s.icon}>{icon}</View>}
      <Text style={[s.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: NM.r.pill,
    alignSelf: 'flex-start',
  },
  icon: { marginRight: 5 },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
