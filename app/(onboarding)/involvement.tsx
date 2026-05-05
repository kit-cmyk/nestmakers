import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMHeader from '@/components/NMHeader';
import NMBtn from '@/components/NMBtn';
import { useOnboardingStore } from '@/store/onboardingStore';
import { InvolvementLevel } from '@/types/database';

const LEVEL_VALUES: InvolvementLevel[] = [
  'anonymous', 'identity_release', 'limited_contact', 'known_donor', 'co_parenting',
];

const LEVELS = [
  { id: 0, label: 'Anonymous', sub: 'No contact after birth', tone: NM.sky },
  { id: 1, label: 'Identity release', sub: 'Child may access identity at 18', tone: NM.lavender },
  { id: 2, label: 'Limited contact', sub: 'Annual photo, brief letter', tone: NM.butter },
  { id: 3, label: 'Known donor', sub: 'Like a family friend', tone: NM.peach },
  { id: 4, label: 'Co-parenting', sub: 'Active, ongoing parental role', tone: NM.rose },
];

export default function Involvement() {
  const router = useRouter();
  const setInvolvement = useOnboardingStore((s) => s.setInvolvement);
  const [selected, setSelected] = useState(2);

  return (
    <View style={s.root}>
      <SafeAreaView>
        <NMHeader title="Step 6 of 8" left="Back" />
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heading}>
          <Text style={s.kicker}>Core preference · 2 of 2</Text>
          <Text style={s.title}>How involved do you want to be after the child is born?</Text>
        </View>

        {/* Scale strip */}
        <View style={s.scaleWrap}>
          <View style={s.track}>
            {LEVELS.map((l, i) => (
              <TouchableOpacity
                key={l.id}
                style={[
                  s.dot,
                  { backgroundColor: selected === l.id ? NM.ink : '#fff' },
                ]}
                onPress={() => setSelected(l.id)}
              />
            ))}
          </View>
          <View style={s.scaleLabels}>
            <Text style={s.scaleLbl}>Less</Text>
            <Text style={s.scaleLbl}>More</Text>
          </View>
        </View>

        {/* Tier cards */}
        <View style={s.cards}>
          {LEVELS.map((l) => {
            const on = l.id === selected;
            return (
              <TouchableOpacity
                key={l.id}
                style={[s.card, on && s.cardOn]}
                onPress={() => setSelected(l.id)}
                activeOpacity={0.85}
              >
                <View style={[s.bar, { backgroundColor: l.tone }]} />
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>{l.label}</Text>
                  <Text style={s.cardSub}>{l.sub}</Text>
                </View>
                {on && (
                  <View style={s.check}>
                    <Ionicons name="checkmark" size={12} color={NM.cream} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.hint}>
          You'll only see profiles within one tier of your choice — big mismatches are filtered out for you.
        </Text>
      </ScrollView>

      <View style={s.footer}>
        <NMBtn full onPress={() => {
          setInvolvement(LEVEL_VALUES[selected]);
          router.push('/(onboarding)/lifestyle');
        }}>
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
  kicker: { fontSize: 10, color: NM.peachDeep, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 30, lineHeight: 34, color: NM.ink, letterSpacing: -0.7, fontWeight: '600' },
  scaleWrap: { marginHorizontal: 8, marginBottom: 20 },
  track: {
    height: 12, borderRadius: 6,
    backgroundColor: NM.sky,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    overflow: 'visible',
  },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, borderColor: NM.ink,
    ...NM.shadow.soft,
  },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  scaleLbl: { fontSize: 9, color: NM.ink3, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600' },
  cards: { gap: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: NM.r.lg, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: NM.hair,
  },
  cardOn: {
    backgroundColor: '#fff', borderColor: NM.ink,
    ...NM.shadow.card,
  },
  bar: { width: 10, height: 36, borderRadius: 5 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 17, color: NM.ink, letterSpacing: -0.2, fontWeight: '500' },
  cardSub: { fontSize: 12, color: NM.ink2, marginTop: 2 },
  check: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: NM.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  hint: { fontSize: 11, color: NM.ink3, textAlign: 'center', marginTop: 14, lineHeight: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
