import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PROFILE_SELECT, asPublicProfile } from '@/lib/publicProfiles';
import { useAuthStore } from '@/store/authStore';
import { PublicProfile } from '@/types/database';
import { compatSummary } from '@/lib/compatibility';
import { notifyNewLike } from '@/lib/notifications';

export default function LikeCompose() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { otherId, promptKicker, promptText } = useLocalSearchParams<{
    otherId: string;
    promptKicker?: string;
    promptText?: string;
  }>();
  const { profile: myProfile, session } = useAuthStore();
  const [theirProfile, setTheirProfile] = useState<PublicProfile | null>(null);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!otherId) return;
    supabase
      .from('public_profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .eq('id', otherId)
      .single()
      .then(({ data }) => setTheirProfile(asPublicProfile(data)));
  }, [otherId]);

  const theirName = theirProfile?.is_anonymous
    ? (theirProfile.display_name ?? 'Anonymous')
    : (theirProfile?.first_name ?? 'Someone');

  const pillText = myProfile && theirProfile
    ? compatSummary(myProfile, theirProfile)
    : null;

  const isLoading = otherId && !theirProfile;

  const handleSendLike = async () => {
    if (!otherId || !session?.user || sending) return;
    setSending(true);
    const { error } = await supabase.from('likes').upsert({
      from_user_id: session.user.id,
      to_user_id: otherId,
      note: note.trim() || null,
      prompt_kicker: promptKicker || null,
    });
    setSending(false);
    if (error) {
      Alert.alert('Error', 'Could not send like. Please try again.');
      return;
    }
    notifyNewLike(otherId);
    router.back();
  };

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={s.cancel} onPress={() => router.back()}>Cancel</Text>
        <Text style={s.topTitle}>Like this moment</Text>
        <View style={{ width: 46 }} />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={NM.lavenderDeep} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {promptKicker && promptText ? (
            <View style={s.quotedCard}>
              <Text style={s.quotedKicker}>{promptKicker}</Text>
              <Text style={s.quotedText}>{promptText}</Text>
            </View>
          ) : (
            <View style={[s.quotedCard, { backgroundColor: NM.peachSoft, borderColor: NM.peachDeep }]}>
              <Text style={[s.quotedKicker, { color: NM.peachDeep }]}>Liking their profile</Text>
              <Text style={s.quotedText}>{theirName}'s full profile</Text>
            </View>
          )}

          <Text style={s.noteLabel}>
            Send a note with your like{'  '}
            <Text style={{ color: NM.ink, fontWeight: '600' }}>· optional</Text>
          </Text>
          <View style={s.noteWrap}>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              style={s.noteInput}
              placeholder="Write something genuine…"
              placeholderTextColor={NM.ink3}
            />
          </View>

          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={14} color={NM.ink3} />
            <Text style={s.infoText}>
              {theirName} will see exactly what you liked plus this note. No links allowed — for safety.
            </Text>
          </View>

          {pillText ? (
            <View style={s.compatCard}>
              <View style={s.compatIcon}>
                <Ionicons name="checkmark" size={16} color="#3F5A2C" />
              </View>
              <View>
                <Text style={s.compatTitle}>Compatible match</Text>
                <Text style={s.compatSub}>{pillText}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <NMBtn full onPress={handleSendLike} disabled={sending}>
          {sending ? 'Sending…' : 'Send interest'}
        </NMBtn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  cancel: { fontSize: 15, color: NM.ink2, fontWeight: '500' },
  topTitle: { fontSize: 13, color: NM.ink3, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  quotedCard: {
    backgroundColor: NM.lavenderSoft, borderRadius: NM.r.xl,
    padding: 18, borderWidth: 1.5, borderColor: NM.lavenderDeep, marginBottom: 20,
  },
  quotedKicker: { fontSize: 10, color: NM.lavenderDeep, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' },
  quotedText: { fontSize: 19, lineHeight: 26, color: NM.ink, letterSpacing: -0.2 },
  noteLabel: { fontSize: 10, color: NM.ink3, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10, fontWeight: '600' },
  noteWrap: {
    backgroundColor: '#fff', borderRadius: NM.r.xl,
    padding: 16, minHeight: 120,
    borderWidth: 1, borderColor: NM.hair, ...NM.shadow.soft,
  },
  noteInput: { fontSize: 17, lineHeight: 24, color: NM.ink, letterSpacing: -0.2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14 },
  infoText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 17 },
  compatCard: {
    marginTop: 20, backgroundColor: NM.sageSoft,
    borderRadius: NM.r.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  compatIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: NM.sage, alignItems: 'center', justifyContent: 'center',
  },
  compatTitle: { fontSize: 13, color: NM.ink, fontWeight: '600' },
  compatSub: { fontSize: 12, color: NM.ink2, marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
