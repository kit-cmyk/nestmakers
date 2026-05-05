import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMHeader from '@/components/NMHeader';
import NMBtn from '@/components/NMBtn';
import { useOnboardingStore } from '@/store/onboardingStore';
import { UserRole } from '@/types/database';

const ROLES: {
  id: UserRole;
  title: string;
  sub: string;
  tone: 'lavender' | 'peach' | 'butter';
  swatch: string;
  desc: string;
  icon: string;
}[] = [
  {
    id: 'seeker',
    title: 'Seeker',
    sub: 'Building a family',
    tone: 'lavender' as const,
    swatch: NM.lavender,
    desc: "I'm searching for a Giver to help build my family",
    icon: 'home-outline',
  },
  {
    id: 'giver',
    title: 'Giver',
    sub: 'Helping build one',
    tone: 'peach' as const,
    swatch: NM.peach,
    desc: 'Egg donor, sperm donor, or surrogate — we ask which next',
    icon: 'heart-outline',
  },
  {
    id: 'both',
    title: 'Both',
    sub: 'Open to either path',
    tone: 'butter' as const,
    swatch: NM.butter,
    desc: 'Some users hold both roles across different journeys',
    icon: 'link-outline',
  },
];

export default function Role() {
  const router = useRouter();
  const setRole = useOnboardingStore((s) => s.setRole);
  const [selected, setSelected] = useState<UserRole>('seeker');

  return (
    <View style={s.root}>
      <SafeAreaView>
        <NMHeader title="Step 3 of 8" left="Back" />
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heading}>
          <Text style={s.title}>Which brings{'\n'}you here?</Text>
          <Text style={s.sub}>
            A single choice to start. We'll ask what you have or can offer on the next step.
          </Text>
        </View>

        <View style={s.cards}>
          {ROLES.map((r) => {
            const on = r.id === selected;
            return (
              <TouchableOpacity
                key={r.id}
                style={[s.card, on && s.cardOn]}
                onPress={() => setSelected(r.id)}
                activeOpacity={0.85}
              >
                <View style={[s.iconWrap, { backgroundColor: r.swatch }]}>
                  <View style={s.iconShine} />
                  <Ionicons name={r.icon as any} size={22} color="#fff" />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardSub}>{r.sub}</Text>
                  <Text style={s.cardTitle}>{r.title}</Text>
                  <Text style={s.cardDesc}>{r.desc}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>
                  {on && <Ionicons name="checkmark" size={13} color={NM.cream} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <NMBtn full onPress={() => {
          setRole(selected);
          router.push({ pathname: '/(onboarding)/needs', params: { role: selected } });
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
  heading: { paddingHorizontal: 8, paddingBottom: 20, gap: 14 },
  title: { fontSize: 30, lineHeight: 34, color: NM.ink, letterSpacing: -0.7, fontWeight: '600' },
  sub: { fontSize: 14, lineHeight: 21, color: NM.ink2 },
  cards: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: NM.r.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: NM.hair,
  },
  cardOn: { borderColor: NM.ink, ...NM.shadow.card },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  iconShine: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
  },
  cardBody: { flex: 1 },
  cardSub: { fontSize: 9, color: NM.ink3, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2, fontWeight: '600' },
  cardTitle: { fontSize: 26, color: NM.ink, letterSpacing: -0.4, lineHeight: 28, fontWeight: '400' },
  cardDesc: { fontSize: 13, color: NM.ink2, marginTop: 4, lineHeight: 18 },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
