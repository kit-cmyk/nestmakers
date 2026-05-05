import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { NM } from '@/constants/tokens';

type Kind = 'primary' | 'secondary' | 'ghost' | 'peach' | 'danger';

const KIND_MAP: Record<Kind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: NM.ink, fg: NM.cream },
  secondary: { bg: NM.lavenderSoft, fg: NM.lavenderDeep },
  ghost: { bg: 'transparent', fg: NM.ink, border: NM.hair2 },
  peach: { bg: NM.peach, fg: NM.ink },
  danger: { bg: NM.dangerSoft, fg: NM.danger },
};

interface Props {
  children: React.ReactNode;
  kind?: Kind;
  full?: boolean;
  style?: object;
  icon?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export default function NMBtn({
  children,
  kind = 'primary',
  full,
  style,
  icon,
  onPress,
  disabled,
}: Props) {
  const { bg, fg, border } = KIND_MAP[kind];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[
        s.btn,
        { backgroundColor: bg, alignSelf: full ? 'stretch' : 'flex-start' },
        border ? { borderWidth: 1, borderColor: border } : null,
        disabled ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      {icon && <View style={s.icon}>{icon}</View>}
      <Text style={[s.label, { color: fg }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: NM.r.pill,
  },
  icon: { marginRight: 8 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
