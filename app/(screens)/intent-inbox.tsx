import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBadge from '@/components/NMBadge';
import NMBtn from '@/components/NMBtn';
import PortraitBlob from '@/components/PortraitBlob';
import { PUBLIC_PROFILE_SELECT, asPublicProfiles } from '@/lib/publicProfiles';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Like, PublicProfile } from '@/types/database';

interface LikeRow {
  like: Like;
  profile: PublicProfile;
}

export default function IntentInbox() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [rows, setRows] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const loadLikes = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      const [{ data: likesData, error: likesErr }, { data: matchData, error: matchErr }] = await Promise.all([
        supabase.from('likes').select('*').eq('to_user_id', session.user.id),
        supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`),
      ]);

      if (likesErr) throw likesErr;
      if (matchErr) throw matchErr;

      const matchedIds = new Set(
        (matchData ?? []).flatMap((m) => [m.user1_id, m.user2_id]).filter((id) => id !== session.user.id)
      );
      const pending = (likesData ?? []).filter((l: Like) => !matchedIds.has(l.from_user_id));

      if (!pending.length) { setRows([]); return; }

      const { data: profileData, error: profileErr } = await supabase
        .from('public_profiles')
        .select(PUBLIC_PROFILE_SELECT)
        .in('id', pending.map((l: Like) => l.from_user_id));

      if (profileErr) throw profileErr;

      const profileMap = Object.fromEntries(asPublicProfiles(profileData).map((p) => [p.id, p]));
      setRows(pending.map((l: Like) => ({ like: l, profile: profileMap[l.from_user_id] })).filter((r) => r.profile));
    } catch {
      setError('Could not load interests. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadLikes(); }, [loadLikes]);

  const handleMatch = async (row: LikeRow) => {
    if (!session?.user || matchingId) return;
    setMatchingId(row.like.from_user_id);

    const { error: likeErr } = await supabase
      .from('likes')
      .upsert({ from_user_id: session.user.id, to_user_id: row.like.from_user_id, note: null });

    if (likeErr) {
      Alert.alert('Error', 'Could not create match. Please try again.');
      setMatchingId(null);
      return;
    }

    const uid = session.user.id;
    const otherId = row.like.from_user_id;
    const { data: matchRow, error: matchErr } = await supabase
      .from('matches')
      .select('id, threads(id)')
      .or(`and(user1_id.eq.${uid},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${uid})`)
      .single();

    const threadId = (matchRow as any)?.threads?.[0]?.id;
    if (matchErr || !threadId) {
      Alert.alert('Error', 'Could not start thread. Please try again.');
      setMatchingId(null);
      return;
    }

    setMatchingId(null);
    setRows((prev) => prev.filter((r) => r.like.from_user_id !== row.like.from_user_id));
    router.push({
      pathname: '/(screens)/match-reveal',
      params: { threadId, otherId: row.like.from_user_id },
    });
  };

  const handlePass = (row: LikeRow) => {
    setRows((prev) => prev.filter((r) => r.like.from_user_id !== row.like.from_user_id));
  };

  const getDisplayName = (p: PublicProfile) =>
    p.is_anonymous ? (p.display_name ?? 'Anonymous') : (p.first_name ?? 'Someone');

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Interest received</Text>
          <Text style={s.headerSub}>{rows.length} {rows.length === 1 ? 'person liked' : 'people liked'} your profile</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={NM.lavenderDeep} /></View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySub}>{error}</Text>
          <TouchableOpacity onPress={loadLikes} style={s.retryBtn}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : rows.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>No new interests</Text>
          <Text style={s.emptySub}>When someone likes your profile, they'll appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {rows.map((row) => (
            <View key={row.like.id} style={s.card}>
              <View style={s.cardTop}>
                <PortraitBlob seed={row.profile.id.charCodeAt(0) % 8} size={52} />
                <View style={s.cardMeta}>
                  <Text style={s.cardName}>{getDisplayName(row.profile)}</Text>
                  <Text style={s.cardKind}>{row.like.prompt_kicker ?? 'liked your profile'}</Text>
                </View>
                <NMBadge tone="sage">Compatible</NMBadge>
              </View>
              {row.like.note ? (
                <View style={s.snippet}>
                  <Text style={s.snippetLabel}>Their note →</Text>
                  <Text style={s.snippetText}>{row.like.note}</Text>
                </View>
              ) : null}
              <View style={s.actions}>
                <NMBtn kind="ghost" style={{ flex: 1, paddingVertical: 12 }} onPress={() => handlePass(row)}>
                  Pass
                </NMBtn>
                <NMBtn
                  kind="primary"
                  style={{ flex: 1.3, paddingVertical: 12 }}
                  onPress={() => handleMatch(row)}
                  disabled={matchingId === row.like.from_user_id}
                >
                  {matchingId === row.like.from_user_id ? 'Matching…' : 'Match'}
                </NMBtn>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: NM.ink },
  headerSub: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 18, color: NM.ink, fontWeight: '600' },
  emptySub: { fontSize: 14, color: NM.ink3, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: NM.r.pill, backgroundColor: NM.ink },
  retryText: { fontSize: 14, color: NM.cream, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 14, marginBottom: 10, ...NM.shadow.soft },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 19, color: NM.ink, fontWeight: '400', letterSpacing: -0.2 },
  cardKind: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  snippet: { marginTop: 10, borderRadius: NM.r.md, padding: 12, backgroundColor: NM.lavenderSoft },
  snippetLabel: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600', color: NM.lavenderDeep },
  snippetText: { fontSize: 16, color: NM.ink, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
