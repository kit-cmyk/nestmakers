import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBadge from '@/components/NMBadge';
import PortraitRect from '@/components/PortraitRect';
import { useAuthStore } from '@/store/authStore';
import { INSEM_LABELS, INVOLVEMENT_LABELS } from '@/types/database';

function getAge(dob: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

const GIVER_TYPE_LABELS: Record<string, string> = {
  egg: 'Egg donor', sperm: 'Sperm donor', womb: 'Surrogate', embryo: 'Embryo donor',
};

export default function ProfileCardPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const displayName = profile?.is_anonymous
    ? (profile.display_name ?? 'Anonymous')
    : (profile?.first_name ?? '');
  const age        = getAge(profile?.date_of_birth ?? null);
  const giverLabel = profile?.giver_types?.[0] ? GIVER_TYPE_LABELS[profile.giver_types[0]] : profile?.role;
  const insemLabel = profile?.insemination_preference ? INSEM_LABELS[profile.insemination_preference] : null;
  const invLabel   = profile?.involvement_level ? INVOLVEMENT_LABELS[profile.involvement_level] : null;

  return (
    <View style={s.root}>
      {/* Header — mirrors browse header style */}
      <View style={[s.headerRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Your profile card</Text>
          <Text style={s.headerSub}>How you appear to others</Text>
        </View>
      </View>

      {/* Card area — identical layout to browse */}
      <View style={s.cardArea}>
        <TouchableOpacity
          style={s.card}
          activeOpacity={0.97}
          onPress={() => router.push({
            pathname: '/(screens)/profile-detail',
            params: { id: profile?.id, preview: 'true' },
          })}
        >
          <View style={s.heroWrap}>
            {profile?.profile_photo_url
              ? <Image source={{ uri: profile.profile_photo_url }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
              : <PortraitRect seed={profile?.id?.charCodeAt(0) ?? 0} height={300} radius={0} />
            }
            <View style={s.heroBadges} />
            <View style={s.heroOverlay}>
              <View style={s.heroGrad} />
              <View style={s.heroName}>
                <Text style={s.heroTitle}>
                  {displayName}{age ? `, ${age}` : ''}
                </Text>
                <Text style={s.heroSub}>
                  {giverLabel}{profile?.country ? ` · ${profile.country}` : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.cardBody}>
            <View style={s.badgeRow}>
              {insemLabel && <NMBadge tone="sky">{insemLabel}</NMBadge>}
              {invLabel   && <NMBadge tone="butter">{invLabel}</NMBadge>}
            </View>
            {profile?.bio
              ? <Text style={s.bio}>{profile.bio}</Text>
              : (() => {
                  const basics = [
                    profile?.ethnicity  && { label: 'Ethnicity',  value: profile.ethnicity },
                    profile?.education  && { label: 'Education',  value: profile.education },
                    profile?.hair_color && { label: 'Hair',       value: profile.hair_color },
                    profile?.eye_color  && { label: 'Eyes',       value: profile.eye_color },
                    profile?.blood_type && { label: 'Blood type', value: profile.blood_type },
                    profile?.country    && { label: 'Country',    value: profile.country },
                  ].filter(Boolean) as { label: string; value: string }[];
                  if (!basics.length) return null;
                  return (
                    <View style={s.basicsList}>
                      {basics.map(b => (
                        <View key={b.label} style={s.basicsItem}>
                          <Text style={s.basicsLabel}>{b.label}</Text>
                          <Text style={s.basicsValue}>{b.value}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()
            }
          </View>
        </TouchableOpacity>
      </View>

      {/* Progress dot — single active dot */}
      <View style={s.progressRow}>
        <View style={[s.dot, s.dotActive]} />
      </View>

      {/* Action row — disabled, visual only */}
      <View style={[s.actionRow, { marginBottom: insets.bottom + 72 }]}>
        <View style={[s.actionBtn, s.actionPass, s.actionDisabled]}>
          <Ionicons name="close" size={28} color={NM.danger} style={{ opacity: 0.35 }} />
        </View>
        <TouchableOpacity
          style={[s.actionBtnSm]}
          onPress={() => router.push({
            pathname: '/(screens)/profile-detail',
            params: { id: profile?.id, preview: 'true' },
          })}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={20} color={NM.ink3} />
        </TouchableOpacity>
        <View style={[s.actionBtn, s.actionLike, s.actionDisabled]}>
          <Ionicons name="heart" size={28} color="#6B8E56" style={{ opacity: 0.35 }} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  headerRow: { paddingHorizontal: 20, paddingBottom: 14 },
  backBtn: { marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: NM.ink, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  cardArea: { flex: 1, marginHorizontal: 16, marginBottom: 8 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: NM.r.xxl,
    overflow: 'hidden', ...NM.shadow.lift,
  },
  heroWrap: { position: 'relative' },
  heroBadges: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', gap: 6 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  heroGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, backgroundColor: 'rgba(42,31,61,0.45)' },
  heroName: { padding: 18, paddingTop: 50 },
  heroTitle: { fontSize: 28, color: '#fff', letterSpacing: -0.5, fontWeight: '400', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  heroSub: { fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  cardBody: { padding: 16 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  bio: { fontSize: 13, color: NM.ink2, lineHeight: 19, marginBottom: 12 },
  basicsList: { gap: 6 },
  basicsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: NM.hair },
  basicsLabel: { fontSize: 12, color: NM.ink3, fontWeight: '500' },
  basicsValue: { fontSize: 12, color: NM.ink, fontWeight: '500' },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NM.hair },
  dotActive: { backgroundColor: NM.lavenderDeep, width: 18 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingHorizontal: 20, paddingVertical: 10,
  },
  actionBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...NM.shadow.card,
  },
  actionBtnSm: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...NM.shadow.soft,
  },
  actionDisabled: { opacity: 0.6 },
  actionPass: { borderWidth: 1.5, borderColor: NM.dangerSoft },
  actionLike: { borderWidth: 1.5, borderColor: NM.sageSoft },
});
