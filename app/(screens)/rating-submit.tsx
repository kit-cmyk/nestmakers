import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import PortraitBlob from '@/components/PortraitBlob';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const DIMENSIONS = [
  { key: 'communication', label: 'Communication', icon: 'chatbubble-outline' },
  { key: 'honesty', label: 'Honesty', icon: 'shield-checkmark-outline' },
  { key: 'reliability', label: 'Reliability', icon: 'checkmark-circle-outline' },
  { key: 'emotional', label: 'Emotional support', icon: 'heart-outline' },
  { key: 'overall', label: 'Overall experience', icon: 'star-outline' },
];

function StarRow({ label, icon, value, onChange }: {
  label: string; icon: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <View style={s.dimRow}>
      <View style={s.dimLeft}>
        <Ionicons name={icon as any} size={16} color={NM.ink3} />
        <Text style={s.dimLabel}>{label}</Text>
      </View>
      <View style={s.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)} hitSlop={6}>
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={26}
              color={star <= value ? NM.gold : NM.hair2}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function RatingSubmit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { partnerId, partnerName } = useLocalSearchParams<{ partnerId?: string; partnerName?: string }>();
  const partnerDisplay = partnerName ?? 'Your match';
  const { session } = useAuthStore();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setRating = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const allRated = DIMENSIONS.every((d) => ratings[d.key] > 0);

  const handleSubmit = async () => {
    if (!allRated || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('ratings').insert({
      rater_id: session?.user?.id,
      rated_id: partnerId || null,
      communication: ratings.communication,
      honesty: ratings.honesty,
      reliability: ratings.reliability,
      emotional: ratings.emotional,
      overall: ratings.overall,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', 'Could not submit rating. Please try again.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => router.replace('/(tabs)/browse'), 1400);
  };

  if (submitted) {
    return (
      <View style={s.thankRoot}>
        <View style={s.thankIcon}>
          <Ionicons name="checkmark" size={32} color="#fff" />
        </View>
        <Text style={s.thankTitle}>Rating submitted</Text>
        <Text style={s.thankSub}>Your private rating helps the Nestmakers community.</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Leave a rating</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Who you're rating */}
        <View style={s.personCard}>
          <PortraitBlob seed={(partnerId?.charCodeAt(0) ?? 0) % 8} size={52} />
          <View style={s.personInfo}>
            <Text style={s.personName}>{partnerDisplay}</Text>
            <Text style={s.personSub}>Journey completed</Text>
          </View>
          <View style={s.verifiedPill}>
            <Ionicons name="shield-checkmark" size={12} color={NM.lavenderDeep} />
            <Text style={s.verifiedText}>Private rating</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Rate your experience</Text>

        <View style={s.ratingsCard}>
          {DIMENSIONS.map((dim, i) => (
            <View key={dim.key}>
              <StarRow
                label={dim.label}
                icon={dim.icon}
                value={ratings[dim.key] ?? 0}
                onChange={(v) => setRating(dim.key, v)}
              />
              {i < DIMENSIONS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Add a note (optional)</Text>
        <TextInput
          style={s.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Share what made this journey meaningful, or what could be improved…"
          placeholderTextColor={NM.ink3}
          multiline
          maxLength={300}
        />
        <Text style={s.charCount}>{note.length} / 300</Text>

        {/* Privacy note */}
        <View style={s.privacyCard}>
          <Ionicons name="lock-closed-outline" size={14} color={NM.ink3} />
          <Text style={s.privacyText}>
            Ratings are anonymised before being shown. Your identity is never revealed.
            Both parties must confirm the journey to leave a rating.
          </Text>
        </View>

        <View style={{ marginTop: 8 }}>
          <NMBtn full onPress={handleSubmit} disabled={!allRated || submitting}>
            {submitting ? 'Submitting…' : 'Submit rating'}
          </NMBtn>
          {!allRated && (
            <Text style={s.hintText}>Rate all five dimensions to continue</Text>
          )}
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
  personCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    marginBottom: 24, ...NM.shadow.card,
  },
  personInfo: { flex: 1 },
  personName: { fontSize: 17, color: NM.ink, fontWeight: '600' },
  personSub: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  verifiedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: NM.lavenderSoft, borderRadius: NM.r.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verifiedText: { fontSize: 10, color: NM.lavenderDeep, fontWeight: '600' },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10, marginLeft: 4,
  },
  ratingsCard: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    marginBottom: 20, ...NM.shadow.card,
  },
  dimRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dimLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimLabel: { fontSize: 14, color: NM.ink2 },
  stars: { flexDirection: 'row', gap: 4 },
  divider: { height: 1, backgroundColor: NM.hair },
  noteInput: {
    backgroundColor: '#fff', borderRadius: NM.r.lg, padding: 14,
    fontSize: 14, color: NM.ink, lineHeight: 21, minHeight: 100,
    textAlignVertical: 'top', ...NM.shadow.soft,
    marginBottom: 6,
  },
  charCount: { fontSize: 11, color: NM.ink3, textAlign: 'right', marginBottom: 20 },
  privacyCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: NM.cream2, borderRadius: NM.r.lg, padding: 12,
    marginBottom: 20,
  },
  privacyText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 18 },
  hintText: { textAlign: 'center', fontSize: 12, color: NM.ink3, marginTop: 10 },
  thankRoot: { flex: 1, backgroundColor: NM.cream, alignItems: 'center', justifyContent: 'center', padding: 40 },
  thankIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: NM.ink,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  thankTitle: { fontSize: 28, color: NM.ink, fontWeight: '300', letterSpacing: -0.5, textAlign: 'center', marginBottom: 10 },
  thankSub: { fontSize: 15, color: NM.ink2, textAlign: 'center', lineHeight: 22 },
});
