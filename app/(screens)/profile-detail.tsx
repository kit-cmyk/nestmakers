import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBadge from '@/components/NMBadge';
import NMBtn from '@/components/NMBtn';
import PortraitRect from '@/components/PortraitRect';
import LikeablePrompt from '@/components/LikeablePrompt';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PROFILE_SELECT, asPublicProfile } from '@/lib/publicProfiles';
import { PublicProfile, INVOLVEMENT_LABELS, INSEM_LABELS } from '@/types/database';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');

const GIVER_TYPE_LABELS: Record<string, string> = {
  egg: 'Egg donor',
  sperm: 'Sperm donor',
  womb: 'Surrogate',
  embryo: 'Embryo donor',
};

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default function ProfileDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, preview, threadId: threadIdParam } = useLocalSearchParams<{ id: string; preview?: string; threadId?: string }>();
  const isPreview = preview === 'true';
  const { profile: ownProfile } = useAuthStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedPrompts, setLikedPrompts] = React.useState<Set<string>>(new Set());
  const [matchThreadId, setMatchThreadId] = React.useState<string | null>(threadIdParam ?? null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    if (isPreview) {
      setProfile(ownProfile as unknown as PublicProfile | null);
      setLoading(false);
      return;
    }
    supabase
      .from('public_profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.warn('profile-detail fetch error:', error.message);
        setProfile(asPublicProfile(data));
        setLoading(false);
      });
    supabase.rpc('record_profile_view', { p_viewed_id: id });
  }, [id, isPreview, ownProfile]);

  useEffect(() => {
    if (!id || isPreview || !ownProfile?.id) return;
    const uid = ownProfile.id;
    supabase
      .from('matches')
      .select('threads(id)')
      .or(`and(user1_id.eq.${uid},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${uid})`)
      .maybeSingle()
      .then(({ data }) => {
        const t = (data as any)?.threads;
        const threadId = Array.isArray(t) ? t[0]?.id : t?.id;
        if (threadId) setMatchThreadId(threadId);
      });
  }, [id, isPreview, ownProfile?.id]);

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={NM.lavenderDeep} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.errorText}>Profile not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: NM.lavenderDeep, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = getAge(profile.date_of_birth);
  const displayName = profile.is_anonymous
    ? (profile.display_name ?? 'Anonymous')
    : (profile.first_name ?? 'Unknown');
  const giverLabel = profile.giver_types?.[0] ? GIVER_TYPE_LABELS[profile.giver_types[0]] : profile.role;
  const insemLabel = profile.insemination_preference ? INSEM_LABELS[profile.insemination_preference] : null;
  const invLabel   = profile.involvement_level ? INVOLVEMENT_LABELS[profile.involvement_level] : null;

  const basics: [string, string | null][] = [
    ['Ethnicity', profile.ethnicity],
    ['Education', profile.education],
    ['Hair colour', profile.hair_color],
    ['Eye colour', profile.eye_color],
    ['Blood type', profile.blood_type],
    ['Country', profile.country],
  ].filter(([, v]) => v != null) as [string, string][];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={s.hero}>
          {profile.profile_photo_url
            ? <Image source={{ uri: profile.profile_photo_url }} style={{ width: '100%', height: 380 }} resizeMode="cover" />
            : <PortraitRect seed={profile.id?.charCodeAt(0) ?? 0} height={380} radius={0} />
          }
          <View style={[s.topChrome, { top: insets.top + 12 }]}>
            <TouchableOpacity style={s.circleBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={16} color={NM.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={s.circleBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={18} color={NM.ink} />
            </TouchableOpacity>
          </View>
          <View style={s.heroGrad} />
          <View style={s.heroName}>
            {giverLabel && (
              <Text style={s.heroMeta}>{giverLabel}{profile.country ? ` · ${profile.country}` : ''}</Text>
            )}
            <Text style={s.heroTitle}>{displayName}{age ? `, ${age}` : ''}</Text>
            {(insemLabel || invLabel) && (
              <Text style={s.heroSub}>{[insemLabel, invLabel].filter(Boolean).join(' · ')}</Text>
            )}
          </View>
        </View>

        <View style={s.body}>
          {/* Bio */}
          {profile.bio ? (
            <View style={s.card}>
              <Text style={s.sectionLabel}>About</Text>
              <Text style={s.bioText}>{profile.bio}</Text>
            </View>
          ) : null}


          {/* Journeys completed */}
          {profile.journeys_completed > 0 && (
            <View style={s.card}>
              <View style={s.ratingsHeader}>
                <Text style={s.sectionLabel}>Experience</Text>
                <Text style={s.journeyCount}>
                  {profile.journeys_completed} {profile.journeys_completed === 1 ? 'journey' : 'journeys'} completed
                </Text>
              </View>
            </View>
          )}

          {/* Prompts */}
          {(profile.prompts ?? []).length > 0 ? (
            (profile.prompts ?? []).map((p, i) => (
              <React.Fragment key={p.id}>
                <LikeablePrompt
                  kicker={p.kicker}
                  text={p.answer}
                  tone={p.tone}
                  liked={likedPrompts.has(p.id)}
                  onLike={() => {
                    setLikedPrompts((prev) => new Set([...prev, p.id]));
                    router.push({
                      pathname: '/(screens)/like-compose',
                      params: { otherId: profile.id, promptKicker: p.kicker, promptText: p.answer },
                    });
                  }}
                />
                {i === 0 && (
                  <View style={s.photoWrap}>
                    <PortraitRect seed={(profile.id?.charCodeAt(0) ?? 0) + 5} height={220} radius={NM.r.xl} />
                  </View>
                )}
              </React.Fragment>
            ))
          ) : null}

          {/* Basics */}
          {basics.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionLabel}>Basics</Text>
              {basics.map(([k, v], i) => (
                <View key={k} style={[s.basicsRow, i < basics.length - 1 && s.basicsBorder]}>
                  <Text style={s.basicsKey}>{k}</Text>
                  <Text style={s.basicsVal}>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {isPreview ? (
        <View style={[s.previewBar, { paddingBottom: insets.bottom + 12 }]}>
          <Ionicons name="eye-outline" size={16} color={NM.lavenderDeep} />
          <Text style={s.previewBarText}>This is how your profile appears to others</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.previewClose}>
            <Ionicons name="close" size={18} color={NM.ink2} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[s.actionBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={s.actionCircle} onPress={() => router.back()}>
            <Ionicons name="close" size={18} color={NM.ink2} />
          </TouchableOpacity>
          {matchThreadId ? (
            <NMBtn
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/(screens)/chat', params: { threadId: matchThreadId, otherId: profile.id } })}
            >
              Message
            </NMBtn>
          ) : (
            <NMBtn
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/(screens)/like-compose', params: { otherId: profile?.id } })}
            >
              {(profile?.bio || (profile?.prompts ?? []).length > 0)
                ? 'Like a specific moment'
                : 'Like this profile'}
            </NMBtn>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: NM.ink2 },
  hero: { position: 'relative', height: 380 },
  topChrome: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 10,
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, backgroundColor: 'rgba(42,31,61,0.5)' },
  heroName: { position: 'absolute', bottom: 22, left: 20, right: 20 },
  heroMeta: { fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 44, color: '#fff', letterSpacing: -1, lineHeight: 48, fontWeight: '400', marginTop: 4 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.95)', marginTop: 2 },
  body: { padding: 20, gap: 0 },
  card: { backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16, ...NM.shadow.card, marginBottom: 14 },
  sectionLabel: { fontSize: 9, color: NM.ink3, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10, fontWeight: '600' },
  bioText: { fontSize: 15, color: NM.ink2, lineHeight: 22 },
  ratingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  journeyCount: { fontSize: 10, color: NM.ink3 },
  photoWrap: { borderRadius: NM.r.xl, overflow: 'hidden', marginBottom: 12 },
  basicsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  basicsBorder: { borderBottomWidth: 1, borderBottomColor: NM.hair },
  basicsKey: { fontSize: 13, color: NM.ink3 },
  basicsVal: { fontSize: 13, color: NM.ink, fontWeight: '500' },
  previewBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: NM.lavenderSoft,
    borderTopWidth: 1, borderTopColor: NM.lavenderDeep + '33',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 14,
  },
  previewBarText: { flex: 1, fontSize: 13, color: NM.lavenderDeep, fontWeight: '500' },
  previewClose: { padding: 4 },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: NM.cream,
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  actionCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: NM.hair2, ...NM.shadow.card,
  },
});
