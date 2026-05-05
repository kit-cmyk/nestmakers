import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import PortraitBlob from '@/components/PortraitBlob';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { notifyJourneyConfirmation } from '@/lib/notifications';

const OPTIONS = [
  {
    id: 'donation',
    kicker: 'Donation',
    title: 'Successful Donation',
    desc: 'Egg or sperm donation completed. Both parties confirm.',
    badge: 'Trusted Donor',
    tone: NM.sage,
    dual: true,
    label: 'successful donation',
  },
  {
    id: 'preg',
    kicker: 'Pregnancy',
    title: 'Successful Pregnancy',
    desc: 'A pregnancy was confirmed following the arrangement.',
    badge: 'Pregnancy Confirmed',
    tone: NM.peach,
    dual: false,
    note: 'Seeker only · medical privacy',
    label: 'confirmed pregnancy',
  },
  {
    id: 'birth',
    kicker: 'Birth · highest honour',
    title: 'Successful Birth',
    desc: 'A child was born. Seeker chooses whether to share publicly.',
    badge: 'Nestmaker',
    tone: NM.lavender,
    dual: false,
    note: 'Seeker only · optional public share',
    label: 'successful birth',
  },
];

export default function MarkSuccess() {
  const router = useRouter();
  const { partnerId, partnerName } = useLocalSearchParams<{ partnerId?: string; partnerName?: string }>();
  const { profile, session, setProfile } = useAuthStore();
  const [selected, setSelected] = useState('donation');
  const [submitting, setSubmitting] = useState(false);

  const displayPartner = partnerName ?? 'your match';
  const myName = profile?.is_anonymous
    ? (profile.display_name ?? 'Your match')
    : (profile?.first_name ?? 'Your match');

  const handleSubmit = async () => {
    if (submitting || !session?.user) return;
    setSubmitting(true);
    const opt = OPTIONS.find((o) => o.id === selected)!;
    const userId = session.user.id;

    // Persist the journey confirmation record
    const { error } = await supabase.from('reports').insert({
      reporter_id: userId,
      reported_id: partnerId || null,
      reason: 'JOURNEY_CONFIRMATION',
      details: JSON.stringify({ journey_type: selected, badge: opt.badge }),
    });

    if (error) {
      setSubmitting(false);
      Alert.alert('Error', 'Could not record journey. Please try again.');
      return;
    }

    // Increment journeys_completed on the local profile (DB has no function for this yet)
    const newCount = (profile?.journeys_completed ?? 0) + 1;
    await supabase
      .from('profiles')
      .update({ journeys_completed: newCount })
      .eq('id', userId);
    if (profile) setProfile({ ...profile, journeys_completed: newCount });

    if (partnerId) {
      await notifyJourneyConfirmation(partnerId, opt.label, myName);
    }

    router.push({
      pathname: '/(screens)/success',
      params: {
        partnerId: partnerId ?? '',
        partnerName: displayPartner,
        journeyType: selected,
        badgeLabel: opt.badge,
      },
    });
  };

  return (
    <View style={s.root}>
      <SafeAreaView>
        <View style={s.topBar}>
          <Text style={s.cancel} onPress={() => router.back()}>Cancel</Text>
          <Text style={s.topTitle}>Mark as Success</Text>
          <View style={{ width: 50 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Close the loop on{'\n'}<Text style={s.italic}>your journey.</Text></Text>
        <Text style={s.sub}>
          {displayPartner} needs to confirm too before a Success badge is awarded. Both of you in agreement — no one party alone.
        </Text>

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
                <View style={[s.swatch, { backgroundColor: opt.tone }]}>
                  <View style={s.swatchShine} />
                </View>
                <View style={s.cardMeta}>
                  <Text style={s.cardKicker}>{opt.kicker}</Text>
                  <Text style={s.cardTitle}>{opt.title}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>
                  {on && <Ionicons name="checkmark" size={12} color={NM.cream} />}
                </View>
              </View>
              <Text style={s.cardDesc}>{opt.desc}</Text>
              <View style={s.noteRow}>
                <Ionicons
                  name={opt.dual ? 'shield-checkmark-outline' : 'lock-closed-outline'}
                  size={11} color={NM.ink3}
                />
                <Text style={s.noteText}>
                  {opt.dual ? 'Dual confirmation' : opt.note}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={s.howCard}>
          <Text style={s.howKicker}>How confirmation works</Text>
          <View style={s.howRow}>
            <View style={s.howAvatars}>
              <PortraitBlob seed={2} size={40} />
              <PortraitBlob seed={9} size={40} style={{ marginLeft: -8 }} />
            </View>
            <Text style={s.howText}>
              You'll confirm now. {displayPartner} receives a private prompt to confirm independently. Badge appears only after{' '}
              <Text style={{ fontWeight: '700' }}>both</Text> are in.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <NMBtn full onPress={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit my confirmation'}
        </NMBtn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  cancel: { fontSize: 15, color: NM.ink2, fontWeight: '500' },
  topTitle: { fontSize: 13, color: NM.ink3, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  title: { fontSize: 28, lineHeight: 33, color: NM.ink, letterSpacing: -0.7, fontWeight: '600', marginBottom: 10, paddingHorizontal: 8 },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  sub: { fontSize: 14, lineHeight: 21, color: NM.ink2, marginBottom: 20, paddingHorizontal: 8 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: NM.r.xl, padding: 16,
    borderWidth: 1.5, borderColor: NM.hair, marginBottom: 10,
  },
  cardOn: { backgroundColor: '#fff', borderColor: NM.ink, ...NM.shadow.card },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  swatch: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden' },
  swatchShine: { position: 'absolute', inset: 0, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)' },
  cardMeta: { flex: 1 },
  cardKicker: { fontSize: 9, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' },
  cardTitle: { fontSize: 18, color: NM.ink, letterSpacing: -0.2, fontWeight: '500' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  cardDesc: { fontSize: 13, color: NM.ink2, lineHeight: 19 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  noteText: { fontSize: 10, color: NM.ink3, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600' },
  howCard: { backgroundColor: NM.sageSoft, borderRadius: NM.r.xl, padding: 16, marginTop: 4 },
  howKicker: { fontSize: 10, color: '#3F5A2C', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontWeight: '600' },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howAvatars: { flexDirection: 'row' },
  howText: { flex: 1, fontSize: 13, color: NM.ink, lineHeight: 19 },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
