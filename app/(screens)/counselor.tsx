import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM, PORTRAIT_PALETTES } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';

const COUNSELORS = [
  {
    seed: 1,
    name: 'Dr. Miriam Osei',
    specialty: 'Fertility & family formation',
    credentials: 'PhD, LCSW',
    languages: 'English, French',
    tone: NM.lavenderSoft,
    accent: NM.lavenderDeep,
  },
  {
    seed: 4,
    name: 'James Thornton',
    specialty: 'Donor relationship dynamics',
    credentials: 'MA, MFT',
    languages: 'English, Spanish',
    tone: NM.sageSoft,
    accent: '#5A8A6E',
  },
  {
    seed: 6,
    name: 'Priya Nair',
    specialty: 'Surrogacy & co-parenting',
    credentials: 'PsyD',
    languages: 'English, Hindi',
    tone: NM.peachSoft,
    accent: NM.peachDeep,
  },
];

function CounselorCard({ counselor, onBook }: { counselor: typeof COUNSELORS[0]; onBook: () => void }) {
  const palette = PORTRAIT_PALETTES[counselor.seed % PORTRAIT_PALETTES.length];

  return (
    <View style={[s.card, { borderTopColor: counselor.tone, borderTopWidth: 3 }]}>
      {/* Avatar */}
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: palette[0] }]}>
          <View style={[s.avatarInner, { backgroundColor: palette[1] }]} />
        </View>
        <View style={s.cardInfo}>
          <Text style={s.counselorName}>{counselor.name}</Text>
          <Text style={s.counselorCreds}>{counselor.credentials}</Text>
        </View>
      </View>

      <Text style={[s.specialty, { color: counselor.accent }]}>{counselor.specialty}</Text>

      <View style={s.cardMeta}>
        <View style={s.metaRow}>
          <Ionicons name="language-outline" size={13} color={NM.ink3} />
          <Text style={s.metaText}>{counselor.languages}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="videocam-outline" size={13} color={NM.ink3} />
          <Text style={s.metaText}>Video · Phone · Text</Text>
        </View>
      </View>

      <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={14} color={NM.cream} />
        <Text style={s.bookBtnText}>Request a session</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Counselor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBook = (name: string) => {
    const subject = encodeURIComponent(`Booking request — ${name}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to book a session with ${name} through Nestmakers.\n\nPlease let me know their next available slot.\n\nThank you.`,
    );
    Alert.alert(
      `Book with ${name}`,
      "This will open your email app to send a booking request. Sessions are confidential and not shared with Nestmakers.",
      [
        {
          text: 'Send booking request',
          onPress: async () => {
            try {
              await Linking.openURL(`mailto:counselors@nestmakers.app?subject=${subject}&body=${body}`);
            } catch {
              Alert.alert('Could not open email app', 'Please email counselors@nestmakers.app directly.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Talk to a Counselor</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={s.introCard}>
          <Text style={s.introTitle}>You don't have to navigate this alone.</Text>
          <Text style={s.introBody}>
            Our counselors specialise in donor relationships, surrogacy, and family formation.
            Sessions are fully confidential — your match will never know you spoke to someone.
          </Text>
        </View>

        {/* Why it matters */}
        <View style={s.pillsRow}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Confidential' },
            { icon: 'person-outline', label: 'Specialised' },
            { icon: 'star-outline', label: 'Vetted' },
          ].map((item) => (
            <View key={item.label} style={s.pill}>
              <Ionicons name={item.icon as any} size={14} color={NM.ink2} />
              <Text style={s.pillText}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Available now</Text>
        {COUNSELORS.map((c) => (
          <CounselorCard key={c.name} counselor={c} onBook={() => handleBook(c.name)} />
        ))}

        <View style={s.crisisCard}>
          <Ionicons name="call-outline" size={16} color={NM.danger} />
          <View style={{ flex: 1 }}>
            <Text style={s.crisisTitle}>In crisis or need immediate support?</Text>
            <Text style={s.crisisSub}>Call or text 988 (Suicide & Crisis Lifeline) · Available 24/7</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: NM.hair,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, color: NM.ink, fontWeight: '600', letterSpacing: -0.2 },
  scroll: { padding: 20, paddingBottom: 48 },
  introCard: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 20,
    marginBottom: 16, ...NM.shadow.card,
  },
  introTitle: { fontSize: 22, color: NM.ink, fontWeight: '300', letterSpacing: -0.4, lineHeight: 28, marginBottom: 10 },
  introBody: { fontSize: 14, color: NM.ink2, lineHeight: 21 },
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: NM.r.lg, paddingVertical: 10,
    borderWidth: 1, borderColor: NM.hair,
  },
  pillText: { fontSize: 12, color: NM.ink2, fontWeight: '500' },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    marginBottom: 14, ...NM.shadow.card, overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 32, height: 32, borderRadius: 8 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  counselorName: { fontSize: 16, color: NM.ink, fontWeight: '600' },
  counselorCreds: { fontSize: 12, color: NM.ink3, marginTop: 2, marginBottom: 6 },
  specialty: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  cardMeta: { gap: 4, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: NM.ink3 },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: NM.r.lg, paddingVertical: 12,
    backgroundColor: NM.ink,
  },
  bookBtnText: { fontSize: 13, color: NM.cream, fontWeight: '600' },
  crisisCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: NM.dangerSoft, borderRadius: NM.r.lg, padding: 14,
    borderWidth: 1, borderColor: 'rgba(194,90,90,0.2)', marginTop: 8,
  },
  crisisTitle: { fontSize: 14, color: NM.danger, fontWeight: '600', marginBottom: 2 },
  crisisSub: { fontSize: 12, color: NM.danger, opacity: 0.8, lineHeight: 17 },
});
