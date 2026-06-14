import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Alert } from 'react-native';
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
import { PublicProfile, Like } from '@/types/database';

interface LikeItem {
  like: Like;
  profile: PublicProfile;
}

interface SentLikeItem {
  like: Like;
  profile: PublicProfile;
  isMatched: boolean;
  threadId?: string;
}

const FILTERS = ['All', 'Liked you', 'Matched', 'Sent'];

const EMPTY_MESSAGES: Record<number, { title: string; sub: string }> = {
  0: { title: 'No responses yet', sub: "When someone likes you, they'll show up here." },
  1: { title: 'No likes yet', sub: 'Keep browsing — someone will like you back soon.' },
  2: { title: 'No matches yet', sub: "When you both like each other, you'll meet here." },
  3: { title: 'No sent likes yet', sub: "Profiles you like will appear here while you wait for a response." },
};

interface ResponseCardProps {
  item: LikeItem;
  onPass: (likeId: string) => void;
  onMatch: (item: LikeItem) => void;
  matching: boolean;
}

function ResponseCard({ item, onPass, onMatch, matching }: ResponseCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePass = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -420, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.92, duration: 300, useNativeDriver: true }),
    ]).start(() => onPass(item.like.id));
  }, [item.like.id, onPass, translateX, opacity, scale]);

  const p = item.profile;
  const displayName = p.is_anonymous ? (p.display_name ?? 'Anonymous') : (p.first_name ?? 'Someone');

  return (
    <Animated.View style={[s.card, { transform: [{ translateX }, { scale }], opacity }]}>
      <View style={s.cardTop}>
        <PortraitBlob seed={p.id.charCodeAt(0)} size={52} />
        <View style={s.cardMeta}>
          <Text style={s.cardName}>{displayName}</Text>
          <Text style={s.cardKind}>
            {item.like.prompt_kicker ? `liked your prompt` : 'liked your profile'}
          </Text>
        </View>
        <NMBadge tone="sage">Compatible</NMBadge>
      </View>

      {item.like.note ? (
        <View style={[s.snippet, { backgroundColor: NM.lavenderSoft }]}>
          <Text style={[s.snippetKicker, { color: NM.lavenderDeep }]}>They wrote →</Text>
          <Text style={s.snippetText}>{item.like.note}</Text>
        </View>
      ) : item.like.prompt_kicker ? (
        <View style={[s.snippet, { backgroundColor: NM.peachSoft }]}>
          <Text style={[s.snippetKicker, { color: NM.peachDeep }]}>They noticed →</Text>
          <Text style={s.snippetText}>{item.like.prompt_kicker}</Text>
        </View>
      ) : null}

      <View style={s.actions}>
        <NMBtn kind="ghost" style={{ flex: 1, paddingVertical: 12 }} onPress={handlePass}>
          Pass
        </NMBtn>
        <NMBtn
          kind="primary"
          style={{ flex: 1.3, paddingVertical: 12 }}
          onPress={() => onMatch(item)}
          disabled={matching}
        >
          {matching ? 'Matching…' : 'Match'}
        </NMBtn>
      </View>
    </Animated.View>
  );
}

export default function Interest() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState(0);
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [sentLikes, setSentLikes] = useState<SentLikeItem[]>([]);
  const [matches, setMatches] = useState<{ otherId: string; threadId: string; profile: PublicProfile }[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dismissedSent, setDismissedSent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
    // Inbound likes — exclude ones already passed by the recipient
    const { data: likeRows } = await supabase
      .from('likes')
      .select('*')
      .eq('to_user_id', session.user.id)
      .is('passed_at', null)
      .order('created_at', { ascending: false });

    if (likeRows && likeRows.length > 0) {
      const fromIds = likeRows.map((l: Like) => l.from_user_id);
      const { data: profileRows } = await supabase
        .from('public_profiles')
        .select(PUBLIC_PROFILE_SELECT)
        .in('id', fromIds);

      const profileMap = new Map(asPublicProfiles(profileRows).map((p) => [p.id, p]));

      // Exclude likes where a match already exists (they go to "Matched" tab)
      const { data: matchRows } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

      const matchedUserIds = new Set(
        (matchRows ?? []).flatMap((m: { user1_id: string; user2_id: string }) =>
          [m.user1_id, m.user2_id].filter((id) => id !== session.user.id)
        )
      );

      const pending = likeRows
        .filter((l: Like) => !matchedUserIds.has(l.from_user_id))
        .map((l: Like) => ({ like: l, profile: profileMap.get(l.from_user_id) }))
        .filter((item): item is LikeItem => item.profile !== undefined);

      setLikes(pending);
    } else {
      setLikes([]);
    }

    // Existing matches
    const { data: matchRows } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id, threads(id)')
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

    if (matchRows && matchRows.length > 0) {
      const otherIds = matchRows.map((m: any) =>
        m.user1_id === session.user.id ? m.user2_id : m.user1_id
      );
      const { data: profileRows } = await supabase
        .from('public_profiles')
        .select(PUBLIC_PROFILE_SELECT)
        .in('id', otherIds);

      const profileMap = new Map(asPublicProfiles(profileRows).map((p) => [p.id, p]));

      const matchItems = matchRows
        .map((m: any) => {
          const otherId = m.user1_id === session.user.id ? m.user2_id : m.user1_id;
          const threadId = m.threads?.[0]?.id;
          const profile = profileMap.get(otherId);
          if (!profile || !threadId) return null;
          return { otherId, threadId, profile };
        })
        .filter(Boolean) as { otherId: string; threadId: string; profile: PublicProfile }[];

      setMatches(matchItems);
    } else {
      setMatches([]);
    }

    // Sent likes — likes this user has sent that haven't been passed by the recipient
    const { data: sentRows } = await supabase
      .from('likes')
      .select('*')
      .eq('from_user_id', session.user.id)
      .is('passed_at', null)
      .order('created_at', { ascending: false });

    if (sentRows && sentRows.length > 0) {
      const toIds = sentRows.map((l: Like) => l.to_user_id);
      const { data: sentProfileRows } = await supabase
        .from('public_profiles')
        .select(PUBLIC_PROFILE_SELECT)
        .in('id', toIds);

      const { data: myMatchRows } = await supabase
        .from('matches')
        .select('user1_id, user2_id, threads(id)')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

      const matchedIds = new Set(
        (myMatchRows ?? []).flatMap((m: any) =>
          [m.user1_id, m.user2_id].filter((id: string) => id !== session.user.id)
        )
      );

      const threadIdByOther = new Map<string, string>(
        (myMatchRows ?? []).map((m: any) => {
          const otherId = m.user1_id === session.user.id ? m.user2_id : m.user1_id;
          return [otherId, m.threads?.[0]?.id as string];
        })
      );

      const profileMap = new Map(asPublicProfiles(sentProfileRows).map((p) => [p.id, p]));
      const sent = sentRows
        .map((l: Like) => {
          const profile = profileMap.get(l.to_user_id);
          if (!profile) return null;
          return { like: l, profile, isMatched: matchedIds.has(l.to_user_id), threadId: threadIdByOther.get(l.to_user_id) };
        })
        .filter(Boolean) as SentLikeItem[];

      setSentLikes(sent);
    } else {
      setSentLikes([]);
    }
    } catch {
      setError('Could not load responses. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadData();

    if (!session?.user) return;
    const channel = supabase
      .channel('interest-tab')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `to_user_id=eq.${session.user.id}`,
      }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData, session?.user?.id]);

  const handlePass = useCallback(async (likeId: string) => {
    // Optimistically remove from UI
    setDismissed((prev) => new Set([...prev, likeId]));
    // Persist the pass so it survives restarts
    await supabase
      .from('likes')
      .update({ passed_at: new Date().toISOString() })
      .eq('id', likeId)
      .eq('to_user_id', session?.user?.id ?? '');
  }, [session?.user?.id]);

  const handleWithdrawLike = useCallback(async (likeId: string) => {
    setDismissedSent((prev) => new Set([...prev, likeId]));
    await supabase
      .from('likes')
      .delete()
      .eq('id', likeId)
      .eq('from_user_id', session?.user?.id ?? '');
  }, [session?.user?.id]);

  const handleMatch = useCallback(async (item: LikeItem) => {
    if (!session?.user) return;
    setMatchingId(item.like.id);

    // Like them back — the DB trigger creates the match + thread
    await supabase.from('likes').upsert({
      from_user_id: session.user.id,
      to_user_id: item.like.from_user_id,
      note: null,
    });

    // Fetch the newly created match + thread
    const uid = session.user.id;
    const otherId = item.like.from_user_id;
    const { data: matchRow } = await supabase
      .from('matches')
      .select('id, threads(id)')
      .or(`and(user1_id.eq.${uid},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${uid})`)
      .single();

    const threadId = (matchRow as any)?.threads?.[0]?.id;
    setMatchingId(null);
    setDismissed((prev) => new Set([...prev, item.like.id]));

    router.push({
      pathname: '/(screens)/match-reveal',
      params: { threadId: threadId ?? '', otherId },
    });
  }, [session, router]);

  const visibleLikes = likes.filter((l) => !dismissed.has(l.like.id));
  // filter 0 = All, 1 = Liked you, 2 = Matched, 3 = Sent
  const filtered = (activeFilter === 2 || activeFilter === 3) ? [] : visibleLikes;

  // For the All tab, only show non-matched sent likes (matched ones appear in the Matched section)
  const pendingSentInAll = sentLikes.filter((item) => !item.isMatched && !dismissedSent.has(item.like.id));

  const empty = EMPTY_MESSAGES[activeFilter];
  const showMatches = activeFilter === 2;
  const showSent = activeFilter === 3;
  const totalCount = activeFilter === 2 ? matches.length :
                     activeFilter === 3 ? sentLikes.filter((item) => !dismissedSent.has(item.like.id)).length :
                     activeFilter === 1 ? visibleLikes.length :
                     visibleLikes.length + matches.length + pendingSentInAll.length;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.headerTitle}>Responses</Text>
        <Text style={s.headerSub}>
          {loading ? 'Loading…' : totalCount > 0
            ? `${totalCount} ${activeFilter === 3 ? `sent like${totalCount !== 1 ? 's' : ''}` : `response${totalCount !== 1 ? 's' : ''} waiting`}`
            : 'All caught up'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={s.filterBar}
      >
        {FILTERS.map((f, i) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, i === activeFilter && s.filterChipOn]}
            onPress={() => setActiveFilter(i)}
          >
            <Text style={[s.filterText, i === activeFilter && s.filterTextOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={NM.lavenderDeep} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <View style={s.emptyIcon}><Ionicons name="cloud-offline-outline" size={28} color={NM.ink3} /></View>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySub}>{error}</Text>
          <TouchableOpacity
            style={[s.upgradeBtn, { backgroundColor: NM.ink }]}
            onPress={loadData}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={s.upgradeBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : showMatches ? (
        matches.length === 0 ? (
          <View style={s.center}>
            <View style={s.emptyIcon}><Text style={s.emptyIconText}>✦</Text></View>
            <Text style={s.emptyTitle}>{empty.title}</Text>
            <Text style={s.emptySub}>{empty.sub}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {matches.map((m) => {
              const name = m.profile.is_anonymous
                ? (m.profile.display_name ?? 'Anonymous')
                : (m.profile.first_name ?? 'Someone');
              return (
                <View key={m.otherId} style={s.matchCard}>
                  <PortraitBlob seed={m.profile.id.charCodeAt(0)} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardName}>{name}</Text>
                    <Text style={s.cardKind}>Mutual match</Text>
                  </View>
                  <NMBtn
                    kind="primary"
                    style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                    onPress={() =>
                      router.push({ pathname: '/(screens)/chat', params: { threadId: m.threadId, otherId: m.otherId } })
                    }
                  >
                    Message
                  </NMBtn>
                </View>
              );
            })}
          </ScrollView>
        )
      ) : showSent ? (
        sentLikes.filter((item) => !dismissedSent.has(item.like.id)).length === 0 ? (
          <View style={s.center}>
            <View style={s.emptyIcon}><Text style={s.emptyIconText}>✦</Text></View>
            <Text style={s.emptyTitle}>{empty.title}</Text>
            <Text style={s.emptySub}>{empty.sub}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {sentLikes.filter((item) => !dismissedSent.has(item.like.id)).map((item) => {
              const name = item.profile.is_anonymous
                ? (item.profile.display_name ?? 'Anonymous')
                : (item.profile.first_name ?? 'Someone');
              return (
                <View key={item.like.id} style={s.matchCard}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    onPress={() => router.push({
                      pathname: '/(screens)/profile-detail',
                      params: {
                        id: item.profile.id,
                        ...(item.isMatched && item.threadId ? { threadId: item.threadId } : {}),
                      },
                    })}
                  >
                    <PortraitBlob seed={item.profile.id.charCodeAt(0)} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{name}</Text>
                      {item.like.note ? (
                        <Text style={s.cardKind} numberOfLines={1}>"{item.like.note}"</Text>
                      ) : item.like.prompt_kicker ? (
                        <Text style={s.cardKind} numberOfLines={1}>Liked a prompt</Text>
                      ) : (
                        <Text style={s.cardKind}>Liked their profile</Text>
                      )}
                    </View>
                    {!item.isMatched && <NMBadge tone="butter">Awaiting</NMBadge>}
                  </TouchableOpacity>
                  {item.isMatched && (
                    <NMBtn
                      kind="primary"
                      style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                      onPress={() => {
                        const threadId = item.threadId ?? matches.find((m) => m.otherId === item.profile.id)?.threadId ?? '';
                        router.push({ pathname: '/(screens)/chat', params: { threadId, otherId: item.profile.id } });
                      }}
                    >
                      Message
                    </NMBtn>
                  )}
                  {!item.isMatched && (
                    <TouchableOpacity
                      style={s.withdrawBtn}
                      onPress={() =>
                        Alert.alert(
                          'Withdraw like?',
                          `This will remove your like from ${name}'s profile.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Withdraw', style: 'destructive', onPress: () => handleWithdrawLike(item.like.id) },
                          ]
                        )
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color={NM.ink3} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )
      ) : (activeFilter === 0 ? (filtered.length === 0 && matches.length === 0 && pendingSentInAll.length === 0) : filtered.length === 0) ? (
        <View style={s.center}>
          <View style={s.emptyIcon}><Text style={s.emptyIconText}>✦</Text></View>
          <Text style={s.emptyTitle}>{empty.title}</Text>
          <Text style={s.emptySub}>{empty.sub}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Liked you section */}
          {activeFilter === 0 && filtered.length > 0 && (
            <View style={s.sectionDivider}>
              <Text style={s.sectionDividerText}>Liked you</Text>
            </View>
          )}
          {filtered.map((item) => (
            <ResponseCard
              key={item.like.id}
              item={item}
              onPass={handlePass}
              onMatch={handleMatch}
              matching={matchingId === item.like.id}
            />
          ))}
          {/* Matched section (All tab) */}
          {activeFilter === 0 && matches.length > 0 && (
            <>
              <View style={s.sectionDivider}>
                <Text style={s.sectionDividerText}>Matched</Text>
              </View>
              {matches.map((m) => {
                const name = m.profile.is_anonymous
                  ? (m.profile.display_name ?? 'Anonymous')
                  : (m.profile.first_name ?? 'Someone');
                return (
                  <View key={m.otherId} style={s.matchCard}>
                    <PortraitBlob seed={m.profile.id.charCodeAt(0)} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{name}</Text>
                      <Text style={s.cardKind}>Mutual match</Text>
                    </View>
                    <NMBtn
                      kind="primary"
                      style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                      onPress={() =>
                        router.push({ pathname: '/(screens)/chat', params: { threadId: m.threadId, otherId: m.otherId } })
                      }
                    >
                      Message
                    </NMBtn>
                  </View>
                );
              })}
            </>
          )}
          {/* Sent section (All tab) */}
          {activeFilter === 0 && pendingSentInAll.length > 0 && (
            <>
              <View style={s.sectionDivider}>
                <Text style={s.sectionDividerText}>Sent</Text>
              </View>
              {pendingSentInAll.map((item) => {
                const name = item.profile.is_anonymous
                  ? (item.profile.display_name ?? 'Anonymous')
                  : (item.profile.first_name ?? 'Someone');
                return (
                  <View key={item.like.id} style={s.matchCard}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                      onPress={() => router.push({ pathname: '/(screens)/profile-detail', params: { id: item.profile.id } })}
                    >
                      <PortraitBlob seed={item.profile.id.charCodeAt(0)} size={48} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardName}>{name}</Text>
                        {item.like.note ? (
                          <Text style={s.cardKind} numberOfLines={1}>"{item.like.note}"</Text>
                        ) : item.like.prompt_kicker ? (
                          <Text style={s.cardKind} numberOfLines={1}>Liked a prompt</Text>
                        ) : (
                          <Text style={s.cardKind}>Liked their profile</Text>
                        )}
                      </View>
                      <NMBadge tone="butter">Awaiting</NMBadge>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.withdrawBtn}
                      onPress={() =>
                        Alert.alert(
                          'Withdraw like?',
                          `This will remove your like from ${name}'s profile.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Withdraw', style: 'destructive', onPress: () => handleWithdrawLike(item.like.id) },
                          ]
                        )
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color={NM.ink3} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: NM.ink, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  filterBar: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: NM.r.pill,
    backgroundColor: '#fff', borderWidth: 1, borderColor: NM.hair,
  },
  filterChipOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  filterText: { fontSize: 13, color: NM.ink2, fontWeight: '500' },
  filterTextOn: { color: NM.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: NM.lavenderSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconText: { fontSize: 24, color: NM.lavenderDeep },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: NM.ink, textAlign: 'center' },
  emptySub: { fontSize: 14, color: NM.ink3, textAlign: 'center', lineHeight: 20 },
  scroll: { paddingHorizontal: 16, paddingBottom: 140 },
  card: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 14,
    marginBottom: 10, ...NM.shadow.soft,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 19, color: NM.ink, fontWeight: '400', letterSpacing: -0.2 },
  cardKind: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  snippet: { marginTop: 10, borderRadius: NM.r.md, padding: 12 },
  snippetKicker: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  snippetText: { fontSize: 16, color: NM.ink, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  matchCard: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 14, marginBottom: 10,
    ...NM.shadow.soft, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginVertical: 12,
  },
  sectionDividerText: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2,
    textTransform: 'uppercase', fontWeight: '600',
  },
  withdrawBtn: {
    marginLeft: 8, padding: 4,
    borderRadius: NM.r.pill,
    backgroundColor: NM.hair,
    alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28,
  },
});
