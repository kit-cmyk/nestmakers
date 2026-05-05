import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import PortraitBlob from '@/components/PortraitBlob';
import { PUBLIC_PROFILE_SELECT, asPublicProfiles } from '@/lib/publicProfiles';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { PublicProfile } from '@/types/database';

interface ThreadRow {
  id: string;
  matchId: string;
  otherProfile: PublicProfile;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

const FILTERS = ['All', 'New matches', 'Active', 'Paused'];

const EMPTY_MESSAGES: Record<number, { title: string; sub: string }> = {
  0: { title: 'No threads yet', sub: 'When you match with someone, your conversation will appear here.' },
  1: { title: 'No new matches', sub: 'When you get a new match, say hello first.' },
  2: { title: 'No active conversations', sub: 'Send the first message to one of your matches to get started.' },
  3: { title: 'No paused threads', sub: 'Threads go quiet here after a week of no messages.' },
};

function timeLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Threads() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);

  const loadThreads = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: threadList, error: rpcErr } = await supabase.rpc('get_thread_list', {
        p_user_id: session.user.id,
      });

      if (rpcErr) throw rpcErr;
      if (!threadList?.length) {
        setThreads([]);
        return;
      }

      const otherIds = threadList.map((r: any) => r.other_user_id as string);
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select(PUBLIC_PROFILE_SELECT)
        .in('id', otherIds);

      const profileMap = Object.fromEntries(asPublicProfiles(profileData).map((p) => [p.id, p]));

      const rows: ThreadRow[] = threadList.map((r: any) => ({
        id: r.thread_id as string,
        matchId: r.match_id as string,
        otherProfile: profileMap[r.other_user_id] as PublicProfile,
        lastMessage: (r.last_message_content as string | null) ?? 'Start the conversation',
        lastMessageAt: (r.last_message_at as string | null) ?? (r.thread_created_at as string),
        unreadCount: Number(r.unread_count ?? 0),
      }));

      setThreads(rows);
    } catch {
      setError('Could not load conversations. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadThreads();

    if (!session?.user) return;
    const channel = supabase
      .channel('threads-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadThreads())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadThreads, session?.user]);

  const getDisplayName = (p: PublicProfile) =>
    p.is_anonymous ? (p.display_name ?? 'Anonymous') : (p.first_name ?? 'Someone');

  const filteredThreads = threads.filter((t) => {
    if (activeFilter === 0) return true;
    const noMessages = t.lastMessage === 'Start the conversation';
    if (activeFilter === 1) return noMessages;
    if (!t.lastMessageAt) return false;
    const ageMs = Date.now() - new Date(t.lastMessageAt).getTime();
    const isRecent = ageMs < 7 * 24 * 60 * 60 * 1000;
    if (activeFilter === 2) return !noMessages && isRecent;
    if (activeFilter === 3) return !noMessages && !isRecent;
    return true;
  });

  const emptyMsg = EMPTY_MESSAGES[activeFilter];

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={s.headerTitle}>Threads</Text>
        <Text style={s.headerSub}>Private conversations - moderated for safety</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.filterBar}>
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
          <ActivityIndicator color={NM.lavenderDeep} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Text style={s.emptyIconText}>!</Text>
          </View>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySub}>{error}</Text>
          <TouchableOpacity onPress={loadThreads} style={s.retryBtn}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredThreads.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Text style={s.emptyIconText}>*</Text>
          </View>
          <Text style={s.emptyTitle}>{emptyMsg.title}</Text>
          <Text style={s.emptySub}>{emptyMsg.sub}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {filteredThreads.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={s.row}
              onPress={() => router.push({ pathname: '/(screens)/chat', params: { threadId: t.id, otherId: t.otherProfile.id } })}
              activeOpacity={0.75}
            >
              <View style={s.avatarWrap}>
                <PortraitBlob seed={t.otherProfile.id.charCodeAt(0) % 8} size={56} />
                {t.unreadCount > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{t.unreadCount > 9 ? '9+' : t.unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={s.rowBody}>
                <View style={s.rowTop}>
                  <Text style={s.rowName}>{getDisplayName(t.otherProfile)}</Text>
                  <Text style={s.rowWhen}>{timeLabel(t.lastMessageAt)}</Text>
                </View>
                <View style={s.rowPreview}>
                  <Text
                    style={[s.rowLast, t.unreadCount > 0 && { fontWeight: '500', color: NM.ink }]}
                    numberOfLines={1}
                  >
                    {t.lastMessage}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  emptyTitle: { fontSize: 18, color: NM.ink, fontWeight: '600', textAlign: 'center' },
  emptySub: { fontSize: 14, color: NM.ink3, textAlign: 'center', lineHeight: 20 },
  scroll: { paddingHorizontal: 16, paddingBottom: 140 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: NM.r.pill, backgroundColor: NM.ink },
  retryText: { fontSize: 14, color: NM.cream, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: NM.hair,
  },
  avatarWrap: { position: 'relative' },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: NM.peachDeep, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: NM.cream, paddingHorizontal: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  rowName: { flex: 1, fontSize: 18, color: NM.ink, fontWeight: '400', letterSpacing: -0.2 },
  rowWhen: { fontSize: 12, color: NM.ink3 },
  rowPreview: { flexDirection: 'row', alignItems: 'center' },
  rowLast: { flex: 1, fontSize: 13, color: NM.ink2 },
});
