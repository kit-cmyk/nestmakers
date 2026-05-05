import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Switch, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import PortraitBlob from '@/components/PortraitBlob';
import { PUBLIC_PROFILE_SELECT, asPublicProfile } from '@/lib/publicProfiles';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { PublicProfile } from '@/types/database';

const REASONS = [
  { key: 'harassment', label: 'Harassment or threatening behaviour' },
  { key: 'inappropriate', label: 'Sending inappropriate content' },
  { key: 'payment', label: 'Requesting money or payment' },
  { key: 'identity', label: 'Misrepresenting identity' },
  { key: 'solicitation', label: 'Off-platform solicitation' },
  { key: 'other', label: 'Other' },
];

export default function ReportUser() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reportedId } = useLocalSearchParams<{ reportedId?: string }>();
  const { session } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportedProfile, setReportedProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!reportedId) return;
    supabase
      .from('public_profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .eq('id', reportedId)
      .single()
      .then(({ data }) => setReportedProfile(asPublicProfile(data)));
  }, [reportedId]);

  const displayName = reportedProfile
    ? reportedProfile.is_anonymous
      ? (reportedProfile.display_name ?? 'Anonymous')
      : (reportedProfile.first_name ?? 'This user')
    : 'This user';

  const roleLabel = reportedProfile?.role === 'giver'
    ? 'Active match'
    : reportedProfile?.role
      ? `${reportedProfile.role} match`
      : 'Active match';

  const handleSubmit = async () => {
    if (!selected || !session?.user || !reportedId || submitting) return;

    setSubmitting(true);
    const { error: reportError } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      reported_id: reportedId,
      reason: selected,
      details: details.trim() || null,
    });

    if (reportError) {
      setSubmitting(false);
      Alert.alert('Error', 'Could not submit the report. Please try again.');
      return;
    }

    if (blockUser) {
      const { error: blockError } = await supabase.from('blocked_users').upsert({
        blocker_id: session.user.id,
        blocked_id: reportedId,
      });
      if (blockError) {
        setSubmitting(false);
        Alert.alert('Error', 'The report was saved, but blocking failed. Please try again.');
        return;
      }
    }

    setSubmitted(true);
    setTimeout(() => router.replace('/(tabs)/threads'), 1400);
  };

  if (submitted) {
    return (
      <View style={s.thankRoot}>
        <View style={s.thankIcon}>
          <Ionicons name="shield-checkmark" size={28} color="#fff" />
        </View>
        <Text style={s.thankTitle}>Report received</Text>
        <Text style={s.thankSub}>
          Our safety team reviews every report within 24 hours. Thank you for keeping the community safe.
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
        <Text style={s.headerTitle}>Report</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.personCard}>
          <PortraitBlob seed={reportedProfile ? reportedProfile.id.charCodeAt(0) % 8 : 5} size={48} />
          <View>
            <Text style={s.personName}>{displayName}</Text>
            <Text style={s.personSub}>{roleLabel}</Text>
          </View>
        </View>

        <View style={s.infoCard}>
          <Ionicons name="lock-closed-outline" size={14} color={NM.ink3} />
          <Text style={s.infoText}>
            Reports are confidential. The other person will not be told who submitted it.
          </Text>
        </View>

        <Text style={s.sectionLabel}>What is happening?</Text>
        <View style={s.reasonsCard}>
          {REASONS.map((r, i) => (
            <View key={r.key}>
              <TouchableOpacity
                style={s.reasonRow}
                onPress={() => setSelected(r.key)}
                activeOpacity={0.7}
              >
                <Text style={[s.reasonText, selected === r.key && s.reasonTextActive]}>
                  {r.label}
                </Text>
                <View style={[s.radio, selected === r.key && s.radioActive]}>
                  {selected === r.key && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
              {i < REASONS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>Additional details (optional)</Text>
        <TextInput
          style={s.noteInput}
          value={details}
          onChangeText={setDetails}
          placeholder="Describe what happened..."
          placeholderTextColor={NM.ink3}
          multiline
          maxLength={500}
        />

        <View style={s.blockRow}>
          <View>
            <Text style={s.blockLabel}>Block {displayName}</Text>
            <Text style={s.blockSub}>They will not be able to message or match with you</Text>
          </View>
          <Switch
            value={blockUser}
            onValueChange={setBlockUser}
            trackColor={{ false: NM.hair2, true: NM.danger }}
            thumbColor="#fff"
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <NMBtn
            full
            onPress={handleSubmit}
            disabled={!selected || !reportedId || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit report'}
          </NMBtn>
          {!selected && (
            <Text style={s.hintText}>Select a reason to continue</Text>
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
    marginBottom: 12, ...NM.shadow.card,
  },
  personName: { fontSize: 17, color: NM.ink, fontWeight: '600' },
  personSub: { fontSize: 12, color: NM.ink3, marginTop: 2, textTransform: 'capitalize' },
  infoCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: NM.cream2, borderRadius: NM.r.lg, padding: 12, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 18 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10,
  },
  reasonsCard: { backgroundColor: '#fff', borderRadius: NM.r.xl, ...NM.shadow.card, overflow: 'hidden' },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
  },
  reasonText: { fontSize: 15, color: NM.ink2, flex: 1 },
  reasonTextActive: { color: NM.ink, fontWeight: '500' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: NM.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: NM.ink },
  divider: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
  noteInput: {
    backgroundColor: '#fff', borderRadius: NM.r.lg, padding: 14,
    fontSize: 14, color: NM.ink, lineHeight: 21, minHeight: 90,
    textAlignVertical: 'top', ...NM.shadow.soft, marginBottom: 16,
  },
  blockRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NM.dangerSoft, borderRadius: NM.r.lg, padding: 16,
    borderWidth: 1, borderColor: 'rgba(194,90,90,0.2)',
  },
  blockLabel: { fontSize: 15, color: NM.danger, fontWeight: '600', marginBottom: 2 },
  blockSub: { fontSize: 12, color: NM.danger, opacity: 0.75, maxWidth: '80%', lineHeight: 17 },
  hintText: { textAlign: 'center', fontSize: 12, color: NM.ink3, marginTop: 10 },
  thankRoot: { flex: 1, backgroundColor: NM.cream, alignItems: 'center', justifyContent: 'center', padding: 40 },
  thankIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: NM.ink,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  thankTitle: { fontSize: 28, color: NM.ink, fontWeight: '300', letterSpacing: -0.5, textAlign: 'center', marginBottom: 10 },
  thankSub: { fontSize: 15, color: NM.ink2, textAlign: 'center', lineHeight: 22 },
});
