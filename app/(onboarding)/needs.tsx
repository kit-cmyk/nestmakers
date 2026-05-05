import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMHeader from '@/components/NMHeader';
import NMBtn from '@/components/NMBtn';
import { useOnboardingStore } from '@/store/onboardingStore';
import { GiverType } from '@/types/database';

const OPTIONS = [
  {
    id: 'egg',
    label: 'Egg',
    icon: 'ellipse-outline',
    desc: 'Egg donation',
    swatch: NM.peach,
  },
  {
    id: 'sperm',
    label: 'Sperm',
    icon: 'water-outline',
    desc: 'Sperm donation',
    swatch: NM.lavender,
  },
  {
    id: 'womb',
    label: 'Womb',
    icon: 'heart-outline',
    desc: 'Surrogacy / gestational carrier',
    swatch: NM.sage,
  },
  {
    id: 'embryo',
    label: 'Embryo',
    icon: 'sparkles-outline',
    desc: 'Embryo donation',
    swatch: NM.butter,
  },
];

const CONFLICTS: Record<string, { blocks: string[]; reason: string }> = {
  egg: {
    blocks: ['sperm'],
    reason: 'Egg and sperm donations are biologically exclusive — one person can only provide one.',
  },
  sperm: {
    blocks: ['egg', 'womb'],
    reason: 'Sperm donors and egg donors / surrogates have incompatible biological roles.',
  },
  womb: {
    blocks: ['sperm'],
    reason: 'Surrogates carry a pregnancy — this role is incompatible with sperm donation.',
  },
};

export default function Needs() {
  const router = useRouter();
  const setGiverTypes = useOnboardingStore((s) => s.setGiverTypes);
  const { role } = useLocalSearchParams<{ role: string }>();
  const isSeeker = role === 'seeker';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  const toggle = (id: string) => {
    if (selected.has(id)) {
      setBlockedMsg(null);
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      return;
    }
    const conflict = CONFLICTS[id];
    if (conflict) {
      const hit = conflict.blocks.find((b) => selected.has(b));
      if (hit) {
        setBlockedMsg(conflict.reason);
        return;
      }
    }
    // also check if any already-selected item blocks this one
    for (const sel of selected) {
      const selConflict = CONFLICTS[sel];
      if (selConflict?.blocks.includes(id)) {
        setBlockedMsg(selConflict.reason);
        return;
      }
    }
    setBlockedMsg(null);
    setSelected((prev) => { const next = new Set(prev); next.add(id); return next; });
  };

  const title = isSeeker ? "What do you\nhave?" : "What can\nyou give?";
  const sub = isSeeker
    ? "Select everything that applies. You can update this later."
    : "Select everything you're open to offering. You can update this later.";

  return (
    <View style={s.root}>
      <SafeAreaView>
        <NMHeader title="Step 4 of 8" left="Back" />
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heading}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.sub}>{sub}</Text>
        </View>

        {blockedMsg && (
          <View style={s.blockedBanner}>
            <Ionicons name="ban-outline" size={14} color="#c0392b" />
            <Text style={s.blockedText}>{blockedMsg}</Text>
          </View>
        )}

        <View style={s.cards}>
          {OPTIONS.map((opt) => {
            const on = selected.has(opt.id);
            const isBlocked = !on && (() => {
              const conflict = CONFLICTS[opt.id];
              if (conflict?.blocks.some((b) => selected.has(b))) return true;
              for (const sel of selected) {
                if (CONFLICTS[sel]?.blocks.includes(opt.id)) return true;
              }
              return false;
            })();
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.card, on && s.cardOn, isBlocked && s.cardBlocked]}
                onPress={() => toggle(opt.id)}
                activeOpacity={0.85}
              >
                <View style={[s.iconWrap, { backgroundColor: opt.swatch, opacity: isBlocked ? 0.4 : 1 }]}>
                  <View style={s.iconShine} />
                  <Ionicons name={opt.icon as any} size={22} color="#fff" />
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardTitle, isBlocked && s.textDim]}>{opt.label}</Text>
                  <Text style={[s.cardDesc, isBlocked && s.textDim]}>{opt.desc}</Text>
                </View>
                <View style={[s.check, on && s.checkOn]}>
                  {on && <Ionicons name="checkmark" size={13} color={NM.cream} />}
                  {isBlocked && <Ionicons name="ban-outline" size={13} color={NM.hair2} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <NMBtn
          full
          onPress={() => {
            setGiverTypes(Array.from(selected) as GiverType[]);
            router.push('/(onboarding)/insem-pref');
          }}
          disabled={selected.size === 0}
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
  cardTitle: { fontSize: 22, color: NM.ink, letterSpacing: -0.3, lineHeight: 26, fontWeight: '400' },
  cardDesc: { fontSize: 13, color: NM.ink2, marginTop: 3, lineHeight: 18 },
  check: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  cardBlocked: { opacity: 0.5, borderColor: NM.hair },
  textDim: { color: NM.ink3 },
  blockedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fff0ee', borderRadius: NM.r.md,
    borderWidth: 1, borderColor: '#f5c6c0',
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12,
  },
  blockedText: { flex: 1, fontSize: 13, color: '#8b2e24', lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
