import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { NM } from '@/constants/tokens';
import NMBadge from '@/components/NMBadge';
import NMBtn from '@/components/NMBtn';
import PortraitBlob from '@/components/PortraitBlob';
import { useAuthStore } from '@/store/authStore';
import { INVOLVEMENT_LABELS, INSEM_LABELS } from '@/types/database';
import { getFileExtension, getMimeType, uploadFileFromUri } from '@/lib/uploadFile';
import { supabase } from '@/lib/supabase';

const SETTINGS = [
  { label: 'Preference Transparency', icon: 'eye-outline', desc: 'Control which fields are public', route: '/(screens)/preference-transparency' },
  { label: 'Deal-Breaker Filters', icon: 'funnel-outline', desc: 'Auto-decline incompatible requests', route: '/(screens)/deal-breakers' },
  { label: 'Take a Break Mode', icon: 'pause-circle-outline', desc: 'Pause without losing progress', route: '/(screens)/take-a-break' },
  { label: 'Notifications', icon: 'notifications-outline', desc: 'Matches, messages, likes', route: '/(screens)/notifications' },
  { label: 'Safety & Privacy', icon: 'shield-checkmark-outline', desc: 'Block, report, data export', route: '/(screens)/safety-privacy' },
];

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, session, setProfile, signOut, loadProfile } = useAuthStore();
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const handleMedicalUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert('Upload failed', 'You need to be signed in to upload medical history.');
      return;
    }

    setUploadPct(0);
    try {
      const ext = getFileExtension(asset.name, 'pdf');
      const filename = `${Date.now()}.${ext}`;
      const contentType = getMimeType(asset.name, asset.mimeType, 'application/pdf');
      const url = await uploadFileFromUri(
        'medical-files',
        `${userId}/${filename}`,
        asset.uri,
        contentType,
        setUploadPct,
      );
      const updated = [...(profile?.medical_file_urls ?? []), url];
      const { error } = await supabase
        .from('profiles')
        .update({ medical_file_urls: updated })
        .eq('id', userId);
      if (error) throw error;
      if (profile) setProfile({ ...profile, medical_file_urls: updated });
      await loadProfile();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploadPct(null);
    }
  };

  const displayName = profile?.is_anonymous
    ? (profile.display_name ?? 'Anonymous')
    : `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();

  const roleLabel = (() => {
    if (profile?.role === 'giver' && profile.giver_types?.[0]) {
      const t = profile.giver_types[0];
      const map: Record<string, string> = { egg: 'Egg donor', sperm: 'Sperm donor', womb: 'Surrogate', embryo: 'Embryo donor' };
      return map[t] ?? 'Giver';
    }
    if (profile?.role === 'seeker') return 'Seeker';
    return profile?.role ?? '';
  })();

  const insemLabel = profile?.insemination_preference ? INSEM_LABELS[profile.insemination_preference] : null;
  const invLabel = profile?.involvement_level ? INVOLVEMENT_LABELS[profile.involvement_level] : null;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={s.heroSection}>
          <View style={s.avatarWrap}>
            {profile?.profile_photo_url ? (
              <Image source={{ uri: profile.profile_photo_url }} style={s.avatarImage} />
            ) : (
              <PortraitBlob seed={profile ? profile.id.charCodeAt(0) % 8 : 0} size={84} />
            )}
          </View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{displayName || 'Your profile'}</Text>
            <Text style={s.heroRole}>{roleLabel}{profile?.country ? ` · ${profile.country}` : ''}</Text>
            <View style={s.heroBadges}>
              {insemLabel && <NMBadge tone="sky">{insemLabel}</NMBadge>}
              {invLabel && <NMBadge tone="butter">{invLabel}</NMBadge>}
              {profile?.journeys_completed ? <NMBadge tone="sage">{profile.journeys_completed} journeys</NMBadge> : null}
            </View>
          </View>
          <View style={s.heroActions}>
            <TouchableOpacity
              style={s.heroActionBtn}
              onPress={() => router.push('/(screens)/profile-card-preview')}
            >
              <Ionicons name="eye-outline" size={16} color={NM.ink2} />
            </TouchableOpacity>
            <TouchableOpacity style={s.heroActionBtn} onPress={() => router.push('/(screens)/edit-profile')}>
              <Ionicons name="create-outline" size={16} color={NM.ink2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Medical history */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.medTitleRow}>
              <Ionicons name="document-text-outline" size={15} color={NM.lavenderDeep} />
              <Text style={s.sectionLabel}>Documents</Text>
            </View>
            <TouchableOpacity onPress={handleMedicalUpload} disabled={uploadPct !== null}>
              <Text style={s.cardEditLink}>{uploadPct !== null ? `${uploadPct}%` : '+ Add'}</Text>
            </TouchableOpacity>
          </View>

          {(profile?.medical_file_urls ?? []).length === 0 ? (
            <Text style={s.medEmpty}>No documents uploaded yet.</Text>
          ) : (
            (profile?.medical_file_urls ?? []).map((url, i) => {
              const filename = url.split('/').pop() ?? `Document ${i + 1}`;
              const isPdf = filename.endsWith('.pdf');
              return (
                <View key={url} style={[s.medRow, i < (profile?.medical_file_urls ?? []).length - 1 && s.medRowBorder]}>
                  <View style={s.medFileIcon}>
                    <Ionicons name={isPdf ? 'document-outline' : 'image-outline'} size={18} color={NM.lavenderDeep} />
                  </View>
                  <View style={s.medFileBody}>
                    <Text style={s.medFileName} numberOfLines={1}>{filename}</Text>
                    <Text style={[s.medNoticeText, { marginTop: 0 }]}>Shareable in chat</Text>
                  </View>
                </View>
              );
            })
          )}

          <View style={s.medNotice}>
            <Ionicons name="lock-closed-outline" size={12} color={NM.ink3} />
            <Text style={s.medNoticeText}>Only shared when you choose to in a conversation.</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={s.settingsCard}>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.settingRow, i < SETTINGS.length - 1 && s.settingBorder]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.route) router.push(item.route as any);
              }}
            >
              <View style={s.settingIcon}>
                <Ionicons name={item.icon as any} size={18} color={NM.ink2} />
              </View>
              <View style={s.settingBody}>
                <Text style={s.settingLabel}>{item.label}</Text>
                <Text style={s.settingDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={NM.ink3} />
            </TouchableOpacity>
          ))}
        </View>

        <NMBtn kind="ghost" full style={{ marginTop: 16 }} onPress={handleSignOut}>
          Sign out
        </NMBtn>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: {
    paddingHorizontal: 20, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: NM.ink, letterSpacing: -0.4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 140 },
  heroSection: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 12, ...NM.shadow.card,
  },
  avatarWrap: {},
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  heroInfo: { flex: 1, gap: 4 },
  heroActions: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  heroActionBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: NM.cream2, borderWidth: 1.5, borderColor: NM.hair2,
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { fontSize: 22, color: NM.ink, letterSpacing: -0.4, fontWeight: '500' },
  heroRole: { fontSize: 12, color: NM.ink3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' },
  heroBadges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  card: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    marginBottom: 12, ...NM.shadow.card,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardEditLink: { fontSize: 13, color: NM.lavenderDeep, fontWeight: '600' },
  sectionLabel: { fontSize: 9, color: NM.ink3, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
  medTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medEmpty: { fontSize: 13, color: NM.ink3, lineHeight: 19, marginBottom: 8 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  medRowBorder: { borderBottomWidth: 1, borderBottomColor: NM.hair },
  medFileIcon: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: NM.lavenderSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  medFileBody: { flex: 1 },
  medFileName: { fontSize: 14, color: NM.ink, fontWeight: '500' },
  medNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
  medNoticeText: { flex: 1, fontSize: 11, color: NM.ink3, lineHeight: 16 },
  settingsCard: { backgroundColor: '#fff', borderRadius: NM.r.xl, overflow: 'hidden', ...NM.shadow.card, marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: NM.hair },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: NM.cream2, alignItems: 'center', justifyContent: 'center' },
  settingBody: { flex: 1 },
  settingLabel: { fontSize: 15, color: NM.ink, fontWeight: '500' },
  settingDesc: { fontSize: 12, color: NM.ink3, marginTop: 2 },
});
