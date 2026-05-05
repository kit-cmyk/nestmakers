import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, Linking, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import PortraitBlob from '@/components/PortraitBlob';
import { PUBLIC_PROFILE_SELECT, asPublicProfiles } from '@/lib/publicProfiles';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { BlockedUser } from '@/types/database';

const REPORT_REASONS = [
  'Harassment or threats',
  'Inappropriate content',
  'Spam or scam',
  'Underage concern',
  'Impersonation',
  'Other',
];

const COMMUNITY_GUIDELINES_URL = 'https://nestmakers.app/community-guidelines';
const PRIVACY_POLICY_URL = 'https://nestmakers.app/privacy-policy';

function SectionHeader({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function blockedDisplayName(u: BlockedUser): string {
  const p = u.blocked_profile;
  if (!p) return 'Unknown user';
  if (p.is_anonymous) return p.display_name ?? 'Anonymous';
  return `${p.first_name ?? ''}`.trim() || 'Unknown user';
}

function blockedRoleLabel(u: BlockedUser): string {
  const p = u.blocked_profile;
  if (!p?.role) return '';
  if (p.role === 'giver' && p.giver_types?.[0]) {
    const map: Record<string, string> = { egg: 'Egg donor', sperm: 'Sperm donor', womb: 'Surrogate', embryo: 'Embryo donor' };
    return map[p.giver_types[0]] ?? 'Giver';
  }
  if (p.role === 'seeker') return 'Seeker';
  return p.role;
}

export default function SafetyPrivacy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, session, signOut } = useAuthStore();

  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);

  // Report modal state
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Delete account state
  const [deletingAccount, setDeletingAccount] = useState(false);

  const loadBlockedUsers = useCallback(async () => {
    if (!session?.user) return;
    setLoadingBlocked(true);
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocker_id, blocked_id, created_at')
        .eq('blocker_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const blockedIds = data.map((item) => item.blocked_id);
        const { data: publicProfiles } = blockedIds.length > 0
          ? await supabase.from('public_profiles').select(PUBLIC_PROFILE_SELECT).in('id', blockedIds)
          : { data: [] };

        const profileMap = new Map(asPublicProfiles(publicProfiles).map((item) => [item.id, item]));
        setBlocked(
          (data as BlockedUser[]).map((item) => ({
            ...item,
            blocked_profile: profileMap.get(item.blocked_id),
          })),
        );
      }
    } finally {
      setLoadingBlocked(false);
    }
  }, [session?.user]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = (item: BlockedUser) => {
    const name = blockedDisplayName(item);
    Alert.alert(
      `Unblock ${name}?`,
      `${name} will be able to see your profile and match with you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            const { error } = await supabase
              .from('blocked_users')
              .delete()
              .eq('id', item.id);
            if (!error) {
              setBlocked((prev) => prev.filter((u) => u.id !== item.id));
            } else {
              Alert.alert('Error', 'Could not unblock this user. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleSubmitReport = async () => {
    if (!selectedReason || !session?.user) return;
    setSubmittingReport(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: session.user.id,
        reason: selectedReason,
        details: reportDetails.trim() || null,
      });
      if (error) throw error;
      setReportVisible(false);
      setSelectedReason('');
      setReportDetails('');
      Alert.alert('Report submitted', 'Our safety team will review your concern within 24 hours.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDownloadData = () => {
    const email = profile?.email ?? session?.user?.email ?? 'your email';
    Alert.alert(
      'Request data export',
      `We'll prepare a copy of all your data and email it to ${email} within 72 hours.`,
      [
        {
          text: 'Request export',
          onPress: async () => {
            await supabase.from('reports').insert({
              reporter_id: session!.user.id,
              reason: 'DATA_EXPORT_REQUEST',
              details: `User requested data export. Email: ${email}`,
            });
            Alert.alert('Request sent', "You'll receive your data within 72 hours.");
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
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
            setDeletingAccount(true);
            try {
              await supabase
                .from('profiles')
                .update({ is_active: false, onboarding_complete: false })
                .eq('id', session.user.id);
              await signOut();
            } catch {
              setDeletingAccount(false);
              Alert.alert('Error', 'Could not delete account. Please try again or contact support.');
            }
          },
        },
      ],
    );
  };

  const blockedDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Safety & Privacy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* E2E encryption badge */}
        <View style={s.e2eCard}>
          <View style={s.e2eIcon}>
            <Ionicons name="lock-closed" size={18} color={NM.lavenderDeep} />
          </View>
          <View style={s.e2eInfo}>
            <Text style={s.e2eTitle}>Private conversations</Text>
            <Text style={s.e2eSub}>
              Conversations stay inside Nestmakers and are protected by account-level access controls.
            </Text>
          </View>
        </View>

        {/* Blocked users */}
        <SectionHeader label="Blocked users" />
        {loadingBlocked ? (
          <View style={s.emptyCard}>
            <ActivityIndicator size="small" color={NM.ink3} />
          </View>
        ) : blocked.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={NM.ink3} />
            <Text style={s.emptyText}>No blocked users</Text>
          </View>
        ) : (
          <View style={s.card}>
            {blocked.map((item, i) => (
              <View key={item.id}>
                <View style={s.blockedRow}>
                  <PortraitBlob seed={item.blocked_id.charCodeAt(0) % 8} size={40} />
                  <View style={s.blockedInfo}>
                    <Text style={s.blockedName}>{blockedDisplayName(item)}</Text>
                    <Text style={s.blockedMeta}>
                      {blockedRoleLabel(item)}{blockedRoleLabel(item) ? ' · ' : ''}Blocked {blockedDate(item.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.unblockBtn}
                    onPress={() => handleUnblock(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.unblockText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
                {i < blocked.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* Safety tools */}
        <SectionHeader label="Safety tools" />
        <View style={s.card}>
          <TouchableOpacity style={s.actionRow} activeOpacity={0.7} onPress={() => setReportVisible(true)}>
            <View style={[s.actionIcon, { backgroundColor: NM.dangerSoft }]}>
              <Ionicons name="flag-outline" size={18} color={NM.danger} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionLabel}>Report a concern</Text>
              <Text style={s.actionSub}>Flag content or behaviour to our safety team</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={NM.ink3} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.actionRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(COMMUNITY_GUIDELINES_URL)}
          >
            <View style={[s.actionIcon, { backgroundColor: NM.skySoft }]}>
              <Ionicons name="document-text-outline" size={18} color="#4A7B9E" />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionLabel}>Community guidelines</Text>
              <Text style={s.actionSub}>What's allowed on Nestmakers</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={NM.ink3} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.actionRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            <View style={[s.actionIcon, { backgroundColor: NM.sageSoft }]}>
              <Ionicons name="shield-outline" size={18} color="#5A8A6E" />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionLabel}>Privacy policy</Text>
              <Text style={s.actionSub}>How we collect and use your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={NM.ink3} />
          </TouchableOpacity>
        </View>

        {/* Your data */}
        <SectionHeader label="Your data" />
        <View style={s.card}>
          <TouchableOpacity style={s.actionRow} onPress={handleDownloadData} activeOpacity={0.7}>
            <View style={[s.actionIcon, { backgroundColor: NM.butterSoft }]}>
              <Ionicons name="download-outline" size={18} color={NM.gold} />
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionLabel}>Download my data</Text>
              <Text style={s.actionSub}>Get a copy of everything Nestmakers holds about you</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={NM.ink3} />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={s.dangerZone}>
          <Text style={s.dangerZoneLabel}>Danger zone</Text>
          <TouchableOpacity
            style={[s.dangerBtn, deletingAccount && s.dangerBtnDisabled]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color={NM.danger} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={NM.danger} />
            )}
            <Text style={s.dangerBtnText}>
              {deletingAccount ? 'Deleting account…' : 'Delete my account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Report concern modal */}
      <Modal visible={reportVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Report a concern</Text>
              <TouchableOpacity onPress={() => { setReportVisible(false); setSelectedReason(''); setReportDetails(''); }}>
                <Ionicons name="close" size={22} color={NM.ink2} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>Select a reason so our team can review it quickly.</Text>

            <View style={s.reasonList}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.reasonRow, selectedReason === r && s.reasonRowSelected]}
                  onPress={() => setSelectedReason(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.reasonText, selectedReason === r && s.reasonTextSelected]}>{r}</Text>
                  {selectedReason === r && <Ionicons name="checkmark" size={16} color={NM.lavenderDeep} />}
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.detailsInput}
              placeholder="Add details (optional)…"
              placeholderTextColor={NM.ink3}
              multiline
              numberOfLines={3}
              value={reportDetails}
              onChangeText={setReportDetails}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[s.submitBtn, (!selectedReason || submittingReport) && s.submitBtnDisabled]}
              onPress={handleSubmitReport}
              activeOpacity={0.8}
              disabled={!selectedReason || submittingReport}
            >
              {submittingReport ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>Submit report</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  e2eCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: NM.lavenderSoft, borderRadius: NM.r.xl, padding: 16,
    marginBottom: 24,
  },
  e2eIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...NM.shadow.soft,
  },
  e2eInfo: { flex: 1 },
  e2eTitle: { fontSize: 15, color: NM.ink, fontWeight: '600' },
  e2eSub: { fontSize: 12, color: NM.lavenderDeep, lineHeight: 17, marginTop: 3 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10,
  },
  card: { backgroundColor: '#fff', borderRadius: NM.r.xl, ...NM.shadow.card, overflow: 'hidden', marginBottom: 20 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 24,
    alignItems: 'center', gap: 8, marginBottom: 20, ...NM.shadow.soft,
  },
  emptyText: { fontSize: 14, color: NM.ink3 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  blockedInfo: { flex: 1 },
  blockedName: { fontSize: 15, color: NM.ink, fontWeight: '500' },
  blockedMeta: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: NM.r.pill, borderWidth: 1.5, borderColor: NM.hair2,
  },
  unblockText: { fontSize: 13, color: NM.ink2, fontWeight: '500' },
  divider: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 15, color: NM.ink, fontWeight: '500' },
  actionSub: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  dangerZone: {
    marginTop: 8, borderTopWidth: 1, borderTopColor: NM.hair, paddingTop: 20,
  },
  dangerZoneLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 12,
  },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: NM.dangerSoft, borderRadius: NM.r.lg, padding: 14,
    borderWidth: 1, borderColor: 'rgba(194,90,90,0.2)',
  },
  dangerBtnDisabled: { opacity: 0.6 },
  dangerBtnText: { fontSize: 15, color: NM.danger, fontWeight: '500' },
  // Modal
  modalBackdrop: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: NM.hair2,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: NM.ink, letterSpacing: -0.3 },
  modalSub: { fontSize: 13, color: NM.ink3, marginBottom: 16, lineHeight: 18 },
  reasonList: { gap: 8, marginBottom: 16 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: NM.r.md, borderWidth: 1.5, borderColor: NM.hair,
    backgroundColor: NM.cream,
  },
  reasonRowSelected: { borderColor: NM.lavenderDeep, backgroundColor: NM.lavenderSoft },
  reasonText: { fontSize: 14, color: NM.ink2, fontWeight: '500' },
  reasonTextSelected: { color: NM.lavenderDeep },
  detailsInput: {
    borderWidth: 1.5, borderColor: NM.hair, borderRadius: NM.r.md,
    padding: 12, fontSize: 14, color: NM.ink, minHeight: 80,
    backgroundColor: NM.cream, marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: NM.lavenderDeep, borderRadius: NM.r.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
