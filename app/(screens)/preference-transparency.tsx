import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const FIELDS = [
  { key: 'insemination', label: 'Insemination preference', desc: 'AI, Natural, or Either', icon: 'medical-outline' },
  { key: 'involvement', label: 'Involvement tier', desc: 'How involved you want to be', icon: 'people-outline' },
  { key: 'age', label: 'Age', desc: 'Your exact age', icon: 'calendar-outline' },
  { key: 'location', label: 'Location', desc: 'Country or region', icon: 'location-outline' },
  { key: 'role', label: 'Role', desc: 'Giver, Seeker, or Both', icon: 'person-outline' },
  { key: 'lifestyle', label: 'Lifestyle tags', desc: 'Interests and vibes', icon: 'heart-outline' },
];

export default function PreferenceTransparency() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, setProfile } = useAuthStore();

  const initialVisibility = () => {
    const stored = (profile as any)?.preference_visibility ?? {};
    return Object.fromEntries(FIELDS.map((f) => [f.key, stored[f.key] !== false]));
  };

  const [visible, setVisible] = useState<Record<string, boolean>>(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => { setVisible((prev) => ({ ...prev, [key]: !prev[key] })); setSaved(false); };

  const handleSave = async () => {
    if (!session?.user || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ preference_visibility: visible })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not save preferences. Please try again.');
      return;
    }
    if (profile) setProfile({ ...profile, preference_visibility: visible } as any);
    setSaved(true);
    setTimeout(() => router.back(), 900);
  };

  const visibleCount = Object.values(visible).filter(Boolean).length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Preference Transparency</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.infoCard}>
          <Ionicons name="eye-outline" size={16} color={NM.lavenderDeep} />
          <Text style={s.infoText}>
            Control which details other members can see on your profile.
            Hiding a field removes it from browse cards and your public profile — it doesn't affect matching.
          </Text>
        </View>

        <Text style={s.sectionLabel}>Profile fields</Text>
        <View style={s.card}>
          {FIELDS.map((field, i) => (
            <View key={field.key}>
              <View style={s.row}>
                <View style={[s.iconWrap, { backgroundColor: visible[field.key] ? NM.lavenderSoft : NM.cream2 }]}>
                  <Ionicons
                    name={field.icon as any}
                    size={16}
                    color={visible[field.key] ? NM.lavenderDeep : NM.ink3}
                  />
                </View>
                <View style={s.rowInfo}>
                  <Text style={s.rowLabel}>{field.label}</Text>
                  <Text style={s.rowDesc}>{field.desc}</Text>
                </View>
                <Switch
                  value={visible[field.key]}
                  onValueChange={() => toggle(field.key)}
                  trackColor={{ false: NM.hair2, true: NM.ink }}
                  thumbColor="#fff"
                />
              </View>
              {i < FIELDS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <View style={s.summaryPill}>
          <Text style={s.summaryText}>
            {visibleCount} of {FIELDS.length} fields visible to others
          </Text>
        </View>

        <View style={{ marginTop: 8 }}>
          <NMBtn full onPress={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save preferences'}
          </NMBtn>
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
  infoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: NM.lavenderSoft, borderRadius: NM.r.lg, padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: NM.lavenderDeep, lineHeight: 19 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10,
  },
  card: { backgroundColor: '#fff', borderRadius: NM.r.xl, ...NM.shadow.card, overflow: 'hidden', marginBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, color: NM.ink, fontWeight: '500' },
  rowDesc: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  divider: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
  summaryPill: {
    alignSelf: 'center', backgroundColor: NM.cream2,
    borderRadius: NM.r.pill, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  summaryText: { fontSize: 12, color: NM.ink3, fontWeight: '500' },
});
