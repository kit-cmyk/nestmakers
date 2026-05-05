import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMHeader from '@/components/NMHeader';
import NMBtn from '@/components/NMBtn';
import NMBadge from '@/components/NMBadge';
import { useOnboardingStore } from '@/store/onboardingStore';
import { InsemPref as InsemPrefValue } from '@/types/database';

const OPTIONS: {
  id: InsemPrefValue;
  badge: { label: string; tone: 'sky' | 'rose' | 'lavender' };
  title: string;
  desc: string;
  note: string | null;
}[] = [
  {
    id: 'ai',
    badge: { label: 'AI', tone: 'sky' },
    title: 'Artificial Insemination',
    desc: 'Clinical procedure - IUI, IVF, or sperm bank. No physical contact between Giver and Seeker.',
    note: null,
  },
  {
    id: 'ni',
    badge: { label: 'NI', tone: 'rose' },
    title: 'Natural Insemination',
    desc: 'Conception through intercourse. Requires mutual consent, background check, and STI documentation before messaging unlocks.',
    note: 'Requires mutual consent, background check, and STI documentation.',
  },
  {
    id: 'both',
    badge: { label: 'Both', tone: 'lavender' },
    title: 'Open to either',
    desc: 'Willing to consider either method depending on the match. Final method agreed in writing.',
    note: null,
  },
];

export default function InsemPref() {
  const router = useRouter();
  const setInsemPref = useOnboardingStore((s) => s.setInsemPref);
  const [selected, setSelected] = useState<InsemPrefValue>('ai');

  return (
    <View style={s.root}>
      <SafeAreaView>
        <NMHeader title="Step 5 of 8" left="Back" />
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heading}>
          <Text style={s.kicker}>Core preference - 1 of 2</Text>
          <Text style={s.title}>How would{'\n'}<Text style={s.italic}>you</Text> like conception to happen?</Text>
          <Text style={s.sub}>
            This is visible on your profile and used to match you only with compatible people.
          </Text>
        </View>

        <View style={s.cards}>
          {OPTIONS.map((opt) => {
            const on = opt.id === selected;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.card, on && s.cardOn]}
                onPress={() => setSelected(opt.id)}
                activeOpacity={0.85}
              >
                <View style={s.cardTop}>
                  <NMBadge tone={opt.badge.tone}>{opt.badge.label}</NMBadge>
                  <View style={{ flex: 1 }} />
                  <View style={[s.radio, on && s.radioOn]}>
                    {on && <Ionicons name="checkmark" size={12} color={NM.cream} />}
                  </View>
                </View>
                <Text style={s.cardTitle}>{opt.title}</Text>
                <Text style={s.cardDesc}>{opt.desc}</Text>
                {opt.note ? (
                  <View style={s.noteRow}>
                    <Ionicons name="information-circle-outline" size={12} color={NM.ink3} />
                    <Text style={s.noteText}>{opt.note}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <NMBtn
          full
          onPress={() => {
            setInsemPref(selected);
            router.push('/(onboarding)/involvement');
          }}
        >
          Continue
        </NMBtn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heading: { paddingHorizontal: 8, paddingBottom: 20, gap: 10 },
  kicker: { fontSize: 10, color: NM.lavenderDeep, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 30, lineHeight: 34, color: NM.ink, letterSpacing: -0.7, fontWeight: '600' },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  sub: { fontSize: 13, lineHeight: 19, color: NM.ink2 },
  cards: { gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    borderWidth: 1.5, borderColor: NM.hair,
  },
  cardOn: { borderColor: NM.ink, ...NM.shadow.card },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  cardTitle: { fontSize: 19, color: NM.ink, lineHeight: 23, marginBottom: 6, fontWeight: '500' },
  cardDesc: { fontSize: 13, color: NM.ink2, lineHeight: 19 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  noteText: { fontSize: 10, color: NM.ink3, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '600' },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
