import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import PortraitBlob from '@/components/PortraitBlob';
import { PUBLIC_PROFILE_SELECT, asPublicProfile } from '@/lib/publicProfiles';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { PublicProfile } from '@/types/database';
import { scoreCompatibility, CompatResult } from '@/lib/compatibility';

const { width } = Dimensions.get('window');
const DOTS = Array.from({ length: 28 });
const DOT_COLORS = [NM.lavender, NM.peach, NM.butter, NM.sage, NM.rose];

export default function MatchReveal() {
  const router = useRouter();
  const { threadId, otherId } = useLocalSearchParams<{ threadId: string; otherId: string }>();
  const { profile: myProfile } = useAuthStore();
  const [otherProfile, setOtherProfile] = useState<PublicProfile | null>(null);
  const [compat, setCompat] = useState<CompatResult | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const portraitLeftX = useRef(new Animated.Value(-80)).current;
  const portraitRightX = useRef(new Animated.Value(80)).current;
  const portraitOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const heartLoopRef = useRef<any>(null);

  useEffect(() => {
    if (!otherId) return;
    supabase
      .from('public_profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .eq('id', otherId)
      .single()
      .then(({ data }) => {
        if (data) {
          const nextProfile = asPublicProfile(data);
          setOtherProfile(nextProfile);
          if (myProfile && nextProfile) setCompat(scoreCompatibility(myProfile, nextProfile));
        }
        setLoadingProfile(false);
      });
  }, [otherId, myProfile]);

  useEffect(() => {
    if (loadingProfile) return;

    Animated.timing(headerAnim, {
      toValue: 1, duration: 500, delay: 100, useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.spring(portraitLeftX, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.spring(portraitRightX, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(portraitOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(450),
      Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start(() => {
      heartLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(heartScale, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(heartScale, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      );
      heartLoopRef.current.start();
    });

    Animated.timing(cardAnim, {
      toValue: 1, duration: 450, delay: 550, useNativeDriver: true,
    }).start();

    Animated.timing(actionsAnim, {
      toValue: 1, duration: 400, delay: 750, useNativeDriver: true,
    }).start();

    return () => heartLoopRef.current?.stop();
  }, [loadingProfile]);

  if (loadingProfile || !compat) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={NM.lavender} />
      </View>
    );
  }

  const mySeed = myProfile?.id?.charCodeAt(0) ?? 2;
  const theirSeed = otherProfile?.id?.charCodeAt(0) ?? 5;
  const theirName = otherProfile?.is_anonymous
    ? (otherProfile.display_name ?? 'Anonymous')
    : (otherProfile?.first_name ?? 'Someone');

  // Show only top 3 factors for the card
  const topFactors = compat.factors.slice(0, 3);

  return (
    <View style={s.root}>
      {DOTS.map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            {
              top: `${(i * 37) % 100}%` as any,
              left: `${(i * 53) % 100}%` as any,
              width: 4 + (i % 4),
              height: 4 + (i % 4),
              backgroundColor: DOT_COLORS[i % 5],
              opacity: 0.5 + (i % 3) * 0.15,
            },
          ]}
        />
      ))}
      <View style={s.blob1} />
      <View style={s.blob2} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.inner}>
          <Animated.View style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}>
            <Text style={s.kicker}>✦ Mutual interest</Text>
            <Text style={s.headline}>You two{'\n'}found each{'\n'}other.</Text>
          </Animated.View>

          <View style={s.portraits}>
            <Animated.View style={{ opacity: portraitOpacity, transform: [{ translateX: portraitLeftX }] }}>
              <PortraitBlob seed={mySeed} size={120} style={s.portrait} />
            </Animated.View>
            <Animated.View style={[s.heartCenter, { transform: [{ scale: heartScale }] }]}>
              <Ionicons name="heart" size={22} color={NM.ink} />
            </Animated.View>
            <Animated.View style={{ opacity: portraitOpacity, transform: [{ translateX: portraitRightX }] }}>
              <PortraitBlob seed={theirSeed} size={120} style={s.portrait} />
            </Animated.View>
          </View>

          <Animated.View style={[s.compatCard, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }]}>
            <View style={s.compatHeader}>
              <Text style={s.compatKicker}>Compatibility report</Text>
              <Text style={s.compatScore}>
                {compat.score}
                <Text style={s.compatScoreSub}>/100</Text>
              </Text>
            </View>
            {topFactors.map(({ label, detail }) => (
              <View key={label} style={s.compatRow}>
                <Text style={s.compatKey}>{label}</Text>
                <Text style={s.compatVal}>{detail}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={[s.actions, {
            opacity: actionsAnim,
            transform: [{ translateY: actionsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <NMBtn
              full
              kind="peach"
              onPress={() => router.push({ pathname: '/(screens)/chat', params: { threadId, otherId } })}
            >
              Send the first message
            </NMBtn>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.keepBrowsing}>Keep browsing</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.ink, overflow: 'hidden' },
  dot: { position: 'absolute', borderRadius: 999 },
  blob1: {
    position: 'absolute', top: 60, left: -70,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: NM.lavenderDeep, opacity: 0.3,
  },
  blob2: {
    position: 'absolute', bottom: 220, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: NM.peachDeep, opacity: 0.25,
  },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40, justifyContent: 'space-between' },
  kicker: { fontSize: 11, color: NM.lavender, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600' },
  headline: { fontSize: 52, lineHeight: 55, color: NM.cream, letterSpacing: -1.5, fontWeight: '300', fontStyle: 'italic' },
  portraits: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  portrait: { borderWidth: 3, borderColor: NM.ink, ...NM.shadow.lift },
  heartCenter: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: NM.cream, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: -18, zIndex: 2, ...NM.shadow.lift,
  },
  compatCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: NM.r.xl, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  compatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  compatKicker: { fontSize: 10, color: NM.lavender, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' },
  compatScore: { fontSize: 28, color: NM.cream, letterSpacing: -0.5, fontWeight: '600' },
  compatScoreSub: { fontSize: 16, opacity: 0.6 },
  compatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  compatKey: { fontSize: 13, color: 'rgba(251,247,241,0.8)' },
  compatVal: { fontSize: 13, color: NM.cream, fontWeight: '600' },
  actions: { gap: 12 },
  keepBrowsing: { textAlign: 'center', fontSize: 13, color: 'rgba(251,247,241,0.7)' },
});
