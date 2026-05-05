import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';

type Tone = 'lavender' | 'peach' | 'butter' | 'rose' | 'sage';

const BG: Record<Tone, string> = {
  lavender: NM.lavenderSoft,
  peach: NM.peachSoft,
  butter: NM.butterSoft,
  rose: NM.roseSoft,
  sage: NM.sageSoft,
};
const FG: Record<Tone, string> = {
  lavender: NM.lavenderDeep,
  peach: NM.peachDeep,
  butter: NM.gold,
  rose: '#B15474',
  sage: '#6B8E56',
};

interface Props {
  kicker: string;
  text: string;
  tone?: Tone;
  liked?: boolean;
  onLike?: () => void;
}

export default function LikeablePrompt({ kicker, text, tone = 'lavender', liked, onLike }: Props) {
  const bg = BG[tone];
  const fg = FG[tone];
  return (
    <View style={[s.wrap, { backgroundColor: bg }]}>
      <Text style={[s.kicker, { color: fg }]}>{kicker}</Text>
      <Text style={[s.text, { paddingRight: onLike ? 56 : 0 }]}>{text}</Text>
      {onLike && (
        <TouchableOpacity
          style={[s.heartBtn, { borderColor: liked ? fg : NM.hair2, backgroundColor: liked ? fg : '#fff' }]}
          onPress={onLike}
          activeOpacity={0.8}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#fff' : fg}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: NM.r.xl,
    padding: 18,
    marginBottom: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  text: {
    fontSize: 19,
    lineHeight: 26,
    color: NM.ink,
    letterSpacing: -0.3,
  },
  heartBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...NM.shadow.card,
  },
});
