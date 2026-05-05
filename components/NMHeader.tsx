import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';

interface Props {
  title?: string;
  left?: React.ReactNode | string;
  right?: React.ReactNode | string;
  subtitle?: string;
  onBack?: () => void;
}

export default function NMHeader({ title, left, right, subtitle, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderLeft = () => {
    if (left === 'Back') {
      return (
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack ?? (() => router.back())}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={18} color={NM.ink2} />
          <Text style={s.sideText}>Back</Text>
        </TouchableOpacity>
      );
    }
    if (typeof left === 'string') {
      return <Text style={s.sideText}>{left}</Text>;
    }
    return left ?? null;
  };

  const renderRight = () => {
    if (typeof right === 'string') {
      return <Text style={s.sideText}>{right}</Text>;
    }
    return right ?? null;
  };

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={s.row}>
        <View style={s.side}>{renderLeft()}</View>
        {title ? <Text style={s.title}>{title}</Text> : <View style={s.center} />}
        <View style={[s.side, s.sideRight]}>{renderRight()}</View>
      </View>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  side: { width: 70 },
  sideRight: { alignItems: 'flex-end' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sideText: {
    fontSize: 15,
    color: NM.ink2,
    fontWeight: '500',
  },
  title: {
    fontSize: 13,
    color: NM.ink3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  center: { flex: 1 },
  subtitle: {
    fontSize: 13,
    color: NM.ink3,
    textAlign: 'center',
  },
});
