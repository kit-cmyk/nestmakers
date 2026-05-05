import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import ChatBubble from '@/components/ChatBubble';
import PortraitBlob from '@/components/PortraitBlob';
import { PUBLIC_PROFILE_SELECT, asPublicProfile } from '@/lib/publicProfiles';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Message, PublicProfile } from '@/types/database';
import { notifyNewMessage } from '@/lib/notifications';

export default function Chat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { threadId, otherId } = useLocalSearchParams<{ threadId: string; otherId: string }>();
  const { session, profile } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<PublicProfile | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [olderOffset, setOlderOffset] = useState(50);
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const PAGE_SIZE = 50;

  const handleShareDoc = () => {
    const files = profile?.medical_file_urls ?? [];
    if (files.length === 0) {
      Alert.alert(
        'No documents uploaded',
        'Upload medical documents from your Profile tab first, then you can share them here.',
      );
      return;
    }
    const fileButtons = files.map((url) => {
      const name = url.split('/').pop() ?? 'Document';
      return {
        text: name,
        onPress: async () => {
          if (!session?.user || !threadId) return;
          const payload = JSON.stringify({ url, name });
          await supabase.from('messages').insert({
            thread_id: threadId,
            sender_id: session.user.id,
            content: `DOC_SHARE:${payload}`,
          });
        },
      };
    });
    Alert.alert('Share a document', 'Choose a file to send to this conversation:', [
      ...fileButtons,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const PAYMENT_KEYWORDS = /\b(pay|payment|venmo|cashapp|zelle|transfer|wire|money|compensation|cash)\b/i;

  const loadData = useCallback(async () => {
    if (!threadId || !otherId) {
      setLoading(false);
      return;
    }

    try {
      const [{ data: msgs }, { data: publicProfile }] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE),
        supabase.from('public_profiles').select(PUBLIC_PROFILE_SELECT).eq('id', otherId).single(),
      ]);

      const sorted = ((msgs as Message[]) ?? []).reverse();
      setMessages(sorted);
      setHasEarlier((msgs?.length ?? 0) === PAGE_SIZE);
      setOlderOffset(PAGE_SIZE);
      setOtherProfile(asPublicProfile(publicProfile));

      if (session?.user && sorted.length) {
        const unread = sorted.filter((m) => m.sender_id !== session.user.id && !m.read_at);
        if (unread.length) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unread.map((m) => m.id));
        }
      }
    } catch {
      // Keep rendering even if part of the thread payload fails.
    } finally {
      setLoading(false);
    }
  }, [threadId, otherId, session]);

  const loadEarlier = useCallback(async () => {
    if (!threadId || loadingEarlier || !hasEarlier) return;
    setLoadingEarlier(true);
    try {
      const { data: older } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .range(olderOffset, olderOffset + PAGE_SIZE - 1);

      const sorted = ((older as Message[]) ?? []).reverse();
      setMessages((prev) => [...sorted, ...prev]);
      setHasEarlier(sorted.length === PAGE_SIZE);
      setOlderOffset((o) => o + PAGE_SIZE);
    } finally {
      setLoadingEarlier(false);
    }
  }, [threadId, loadingEarlier, hasEarlier, olderOffset]);

  useEffect(() => {
    loadData();

    if (!threadId) return;
    const channel = supabase
      .channel(`chat-${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== session?.user.id) {
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', newMsg.id);
          }
          if (PAYMENT_KEYWORDS.test(newMsg.content)) setShowPaymentBanner(true);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, threadId, session?.user?.id]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [loading, messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !session?.user || !threadId || sending) return;

    setSending(true);
    setInput('');
    if (PAYMENT_KEYWORDS.test(text)) setShowPaymentBanner(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      thread_id: threadId,
      sender_id: session.user.id,
      content: text,
      read_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({ thread_id: threadId, sender_id: session.user.id, content: text })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      Alert.alert('Error', 'Could not send message. Please try again.');
    } else {
      setMessages((prev) => {
        const replaced = prev.map((m) => (m.id === tempId ? (inserted as Message) : m));
        const seen = new Set<string>();
        return replaced.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      });
      if (otherId) {
        const senderName = profile?.is_anonymous
          ? (profile.display_name ?? 'Someone')
          : (profile?.first_name ?? 'Someone');
        notifyNewMessage(otherId, senderName);
      }
    }
    setSending(false);
  };

  const getDisplayName = (p: PublicProfile | null) => {
    if (!p) return 'Loading...';
    return p.is_anonymous ? (p.display_name ?? 'Anonymous') : (p.first_name ?? 'Someone');
  };

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={NM.lavenderDeep} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
    >
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <PortraitBlob seed={otherProfile ? otherProfile.id.charCodeAt(0) % 8 : 0} size={38} />
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{getDisplayName(otherProfile)}</Text>
          <Text style={s.headerMeta}>Private chat - {otherProfile?.role ?? ''}</Text>
        </View>
        <TouchableOpacity
          style={s.exitBtn}
          onPress={() => router.push({ pathname: '/(screens)/report-user', params: { reportedId: otherId } })}
        >
          <Ionicons name="warning-outline" size={16} color={NM.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {hasEarlier && (
          <TouchableOpacity style={s.loadEarlierBtn} onPress={loadEarlier} disabled={loadingEarlier}>
            {loadingEarlier
              ? <ActivityIndicator size="small" color={NM.lavenderDeep} />
              : <Text style={s.loadEarlierText}>Load earlier messages</Text>}
          </TouchableOpacity>
        )}

        <View style={s.matchPill}>
          <Text style={s.matchPillText}>You matched on Nestmakers</Text>
        </View>

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            me={msg.sender_id === session?.user.id}
            text={msg.content}
          />
        ))}

        {messages.length === 0 && (
          <View style={s.emptyChatWrap}>
            <Text style={s.emptyChatText}>Send a message to start the conversation.</Text>
          </View>
        )}

        {showPaymentBanner && (
          <View style={s.paymentBanner}>
            <View style={s.paymentIcon}>
              <Ionicons name="warning" size={16} color="#fff" />
            </View>
            <View style={s.paymentBody}>
              <Text style={s.paymentTitle}>Safety notice - financial discussion detected</Text>
              <Text style={s.paymentText}>
                Nestmakers does not facilitate payments. Never transfer money outside a formal, legally reviewed agreement. Feeling pressured?{' '}
                <Text style={{ color: NM.danger, fontWeight: '700' }}>Report</Text>.
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentBanner(false)} style={s.paymentAck}>
                <Text style={s.paymentAckText}>Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[s.inputBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={s.inputPlus}
          onPress={handleShareDoc}
        >
          <Ionicons name="add" size={18} color={NM.ink2} />
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write with care..."
          placeholderTextColor={NM.ink3}
          style={s.input}
          multiline
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? <ActivityIndicator size="small" color={NM.cream} /> : <Ionicons name="send" size={16} color={NM.cream} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: NM.hair,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, color: NM.ink, fontWeight: '500', letterSpacing: -0.2 },
  headerMeta: { fontSize: 9, color: NM.ink3, letterSpacing: 0.8, textTransform: 'uppercase' },
  exitBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: NM.dangerSoft, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 10, paddingBottom: 16 },
  loadEarlierBtn: {
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: NM.r.pill, backgroundColor: NM.cream2,
    borderWidth: 1, borderColor: NM.hair, marginBottom: 8, minWidth: 48, alignItems: 'center',
  },
  loadEarlierText: { fontSize: 13, color: NM.lavenderDeep, fontWeight: '500' },
  matchPill: {
    alignSelf: 'center', backgroundColor: NM.lavenderSoft,
    borderRadius: NM.r.md, paddingHorizontal: 12, paddingVertical: 8,
  },
  matchPillText: { fontSize: 10, color: NM.lavenderDeep, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '600' },
  emptyChatWrap: { alignItems: 'center', marginTop: 32 },
  emptyChatText: { fontSize: 14, color: NM.ink3, textAlign: 'center' },
  paymentBanner: {
    backgroundColor: NM.butter, borderRadius: NM.r.lg, padding: 14,
    borderWidth: 1.5, borderColor: NM.gold,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', ...NM.shadow.card,
  },
  paymentIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: NM.gold, alignItems: 'center', justifyContent: 'center',
  },
  paymentBody: { flex: 1 },
  paymentTitle: { fontSize: 13, color: NM.ink, fontWeight: '700' },
  paymentText: { fontSize: 12, color: NM.ink2, lineHeight: 18, marginTop: 4 },
  paymentAck: { marginTop: 8, alignSelf: 'flex-start' },
  paymentAckText: { fontSize: 12, color: NM.ink3, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 10, paddingHorizontal: 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: NM.hair,
  },
  inputPlus: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: NM.cream2, alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: NM.cream, borderRadius: NM.r.pill,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: NM.ink, maxHeight: 120,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: NM.ink, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
