import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

function getReturnDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DURATIONS = [
  { key: '1w', label: '1 week', desc: 'Back on ' + getReturnDate(7) },
  { key: '2w', label: '2 weeks', desc: 'Back on ' + getReturnDate(14) },
  { key: '1m', label: '1 month', desc: 'Back on ' + getReturnDate(30) },
  { key: 'indefinite', label: 'Indefinitely', desc: "Resume manually whenever you're ready" },
];

export default function TakeABreak() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getBreakUntil = (key: string): string | null => {
    const d = new Date();
    if (key === '1w')         { d.setDate(d.getDate() + 7); return d.toISOString(); }
    if (key === '2w')         { d.setDate(d.getDate() + 14); return d.toISOString(); }
    if (key === '1m')         { d.setMonth(d.getMonth() + 1); return d.toISOString(); }
    return null; // indefinite
  };

  const handlePause = async () => {
    if (!selected || !session?.user || saving) return;
    setSaving(true);
    const breakUntil = getBreakUntil(selected);
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, break_until: breakUntil })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not pause your profile. Please try again.');
      return;
    }
    setPaused(true);
    setTimeout(() => router.replace('/(tabs)/profile'), 1400);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will hide your profile and sign you out. Contact support if you need a full data deletion request.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            if (!session?.user) return;
            setDeleting(true);
            try {
              await supabase
                .from('profiles')
                .update({ is_active: false, onboarding_complete: false })
                .eq('id', session.user.id);
              await signOut();
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Could not delete account. Please try again or contact support.');
            }
          },
        },
      ],
    );
  };

  if (paused) {
    return (
      <View style={s.thankRoot}>
        <View style={s.thankIcon}>
          <Ionicons name="pause-circle" size={32} color="#fff" />
        </View>
        <Text style={s.thankTitle}>You're on a break</Text>
        <Text style={s.thankSub}>
          Your profile is hidden. Your matches and conversations are safe.
          {'\n'}Resume any time from your profile.
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Take a Break</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* What happens card */}
        <View style={s.explainCard}>
          <Text style={s.explainTitle}>What happens when you pause?</Text>
          {[
            { icon: 'eye-off-outline', text: 'Your profile is hidden from discovery' },
            { icon: 'chatbubbles-outline', text: 'All existing conversations are preserved' },
            { icon: 'heart-outline', text: 'Your matches stay — nothing is lost' },
            { icon: 'play-circle-outline', text: 'Resume any time from this screen' },
          ].map((item) => (
            <View key={item.icon} style={s.explainRow}>
              <Ionicons name={item.icon as any} size={16} color={NM.ink3} />
              <Text style={s.explainText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>How long?</Text>
        <View style={s.durationCard}>
          {DURATIONS.map((dur, i) => (
            <View key={dur.key}>
              <TouchableOpacity
                style={s.durationRow}
                onPress={() => setSelected(dur.key)}
                activeOpacity={0.7}
              >
                <View style={s.durationInfo}>
                  <Text style={[s.durationLabel, selected === dur.key && s.durationLabelActive]}>
                    {dur.label}
                  </Text>
                  <Text style={s.durationDesc}>{dur.desc}</Text>
                </View>
                <View style={[s.radio, selected === dur.key && s.radioActive]}>
                  {selected === dur.key && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
              {i < DURATIONS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <NMBtn full onPress={handlePause} disabled={!selected || saving}>
            {saving ? 'Pausing…' : 'Pause my profile'}
          </NMBtn>
          {!selected && (
            <Text style={s.hintText}>Select a duration to continue</Text>
          )}
        </View>

        {/* Danger zone */}
        <View style={s.dangerZone}>
          <Text style={s.dangerTitle}>Danger zone</Text>
          <TouchableOpacity style={[s.dangerBtn, deleting && { opacity: 0.6 }]} onPress={handleDeleteAccount} activeOpacity={0.8} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color={NM.danger} />
              : <Ionicons name="trash-outline" size={16} color={NM.danger} />}
            <Text style={s.dangerBtnText}>{deleting ? 'Deleting…' : 'Delete my account'}</Text>
          </TouchableOpacity>
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
  explainCard: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    marginBottom: 24, ...NM.shadow.card,
  },
  explainTitle: { fontSize: 15, color: NM.ink, fontWeight: '600', marginBottom: 14 },
  explainRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  explainText: { fontSize: 14, color: NM.ink2, lineHeight: 20 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10,
  },
  durationCard: { backgroundColor: '#fff', borderRadius: NM.r.xl, ...NM.shadow.card, overflow: 'hidden', marginBottom: 24 },
  durationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  durationInfo: { flex: 1 },
  durationLabel: { fontSize: 16, color: NM.ink2, fontWeight: '500' },
  durationLabelActive: { color: NM.ink, fontWeight: '600' },
  durationDesc: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: NM.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: NM.ink },
  divider: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
  hintText: { textAlign: 'center', fontSize: 12, color: NM.ink3, marginTop: 10 },
  dangerZone: {
    marginTop: 36, borderTopWidth: 1, borderTopColor: NM.hair,
    paddingTop: 20,
  },
  dangerTitle: { fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: NM.dangerSoft, borderRadius: NM.r.lg, padding: 14,
    borderWidth: 1, borderColor: 'rgba(194,90,90,0.2)',
  },
  dangerBtnText: { fontSize: 15, color: NM.danger, fontWeight: '500' },
  thankRoot: { flex: 1, backgroundColor: NM.cream, alignItems: 'center', justifyContent: 'center', padding: 40 },
  thankIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: NM.ink,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  thankTitle: { fontSize: 28, color: NM.ink, fontWeight: '300', letterSpacing: -0.5, textAlign: 'center', marginBottom: 10 },
  thankSub: { fontSize: 15, color: NM.ink2, textAlign: 'center', lineHeight: 22 },
});
