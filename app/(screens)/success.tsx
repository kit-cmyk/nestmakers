import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { useAuthStore } from '@/store/authStore';

const JOURNEY_COLORS = [NM.lavender, NM.peach, NM.sage, NM.butter, NM.rose];
const CONFETTI_COLORS = [NM.lavender, NM.peach, NM.sage, NM.rose, NM.gold];
const CONFETTI = Array.from({ length: 36 });

export default function Success() {
  const router = useRouter();
  const { partnerId, partnerName, journeyType, badgeLabel } = useLocalSearchParams<{
    partnerId?: string;
    partnerName?: string;
    journeyType?: string;
    badgeLabel?: string;
  }>();
  const profile = useAuthStore((s) => s.profile);

  const partnerDisplay = partnerName ?? 'your partner';
  const journeyCount = (profile?.journeys_completed ?? 0) + 1;
  const journeyBlocks = Math.min(journeyCount, 8);
  const medal = badgeLabel ?? 'Nestmaker';
  const ordinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  const journeyOrdinal = `${journeyCount}${ordinalSuffix(journeyCount)} journey`;

  const confettiAnims = useRef(CONFETTI.map(() => new Animated.Value(0))).current;
  const medalScale = useRef(new Animated.Value(0)).current;
  const medalGlow = useRef(new Animated.Value(0.4)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const journeyAnim = useRef(new Animated.Value(0)).current;
  const journeyBlockAnims = useRef(Array.from({ length: 8 }).map(() => new Animated.Value(0))).current;
  const ratingAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const glowLoopRef = useRef<any>(null);

  useEffect(() => {
    Animated.parallel(
      confettiAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500 + (i % 4) * 80,
          delay: i * 20,
          useNativeDriver: true,
        })
      )
    ).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.spring(medalScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start(() => {
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(medalGlow, { toValue: 0.9, duration: 1400, useNativeDriver: true }),
          Animated.timing(medalGlow, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
        ])
      );
      glowLoopRef.current.start();
    });

    Animated.timing(contentAnim, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }).start();
    Animated.timing(journeyAnim, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }).start();

    Animated.parallel(
      journeyBlockAnims.slice(0, journeyBlocks).map((anim, i) =>
        Animated.sequence([
          Animated.delay(800 + i * 80),
          Animated.spring(anim, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
        ])
      )
    ).start();

    Animated.timing(ratingAnim, { toValue: 1, duration: 400, delay: 1100, useNativeDriver: true }).start();
    Animated.timing(actionsAnim, { toValue: 1, duration: 400, delay: 1250, useNativeDriver: true }).start();

    return () => glowLoopRef.current?.stop();
  }, []);

  return (
    <View style={s.root}>
      {CONFETTI.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            s.confetti,
            {
              top: `${(i * 17) % 55}%` as any,
              left: `${(i * 41) % 100}%` as any,
              width: 6 + (i % 5),
              height: 3 + (i % 4),
              backgroundColor: CONFETTI_COLORS[i % 5],
              opacity: confettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
              transform: [
                { rotate: `${(i * 47) % 360}deg` },
                { translateY: confettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
              ],
            },
          ]}
        />
      ))}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.medalWrap, { transform: [{ scale: medalScale }] }]}>
            <Animated.View style={[s.medalGlow, { opacity: medalGlow }]} />
            <View style={s.medal}>
              <Text style={s.medalStar}>★</Text>
              <Text style={s.medalLabel}>{medal}</Text>
              <Text style={s.medalSub}>{journeyOrdinal}</Text>
            </View>
          </Animated.View>

          <Animated.View style={{
            alignItems: 'center', width: '100%',
            opacity: contentAnim,
            transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
            <Text style={s.kicker}>✦ Both confirmed</Text>
            <Text style={s.title}>A family began.{'\n'}<Text style={s.italic}>Thank you, {partnerDisplay}.</Text></Text>
            <Text style={s.sub}>
              You've earned the {medal} badge. Would you like to leave {partnerDisplay} a private rating?
            </Text>
          </Animated.View>

          <Animated.View style={[s.journeyCard, {
            opacity: journeyAnim,
            transform: [{ translateY: journeyAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <View style={s.journeyHeader}>
              <Text style={s.journeyLabel}>Your journeys</Text>
              <Text style={s.journeyCount}>{journeyCount} / ∞</Text>
            </View>
            <View style={s.journeyRow}>
              {Array.from({ length: journeyBlocks }).map((_, i) => (
                <Animated.View
                  key={i}
                  style={[s.journeyBlock, {
                    backgroundColor: JOURNEY_COLORS[i % JOURNEY_COLORS.length],
                    transform: [{ scale: journeyBlockAnims[i] }],
                  }]}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[s.ratingPreview, {
            opacity: ratingAnim,
            transform: [{ translateY: ratingAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <Text style={s.ratingTitle}>Leave a private rating</Text>
            {['Communication', 'Honesty', 'Reliability', 'Emotional support'].map((dim) => (
              <View key={dim} style={s.ratingRow}>
                <Text style={s.ratingKey}>{dim}</Text>
                <View style={s.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star-outline" size={18} color={NM.gold} />
                  ))}
                </View>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={[s.actions, { opacity: actionsAnim }]}>
            <NMBtn full onPress={() => router.push({ pathname: '/(screens)/rating-submit', params: { partnerId: partnerId ?? '', partnerName: partnerDisplay } })}>
              Leave a rating
            </NMBtn>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/browse')}>
              <Text style={s.later}>Maybe later</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.butterSoft, overflow: 'hidden' },
  confetti: { position: 'absolute', borderRadius: 1 },
  scroll: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48, alignItems: 'center' },
  medalWrap: { width: 160, height: 160, position: 'relative', marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
  medalGlow: {
    position: 'absolute', inset: 0, borderRadius: 80,
    backgroundColor: NM.butter,
  },
  medal: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...NM.shadow.lift,
  },
  medalStar: { fontSize: 42, color: NM.gold },
  medalLabel: { fontSize: 9, color: NM.ink3, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 4, fontWeight: '600' },
  medalSub: { fontSize: 13, color: NM.ink, fontStyle: 'italic', marginTop: 2 },
  kicker: { fontSize: 11, color: NM.peachDeep, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  title: { fontSize: 36, lineHeight: 40, color: NM.ink, letterSpacing: -0.8, fontWeight: '300', textAlign: 'center', marginBottom: 14 },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  sub: { fontSize: 15, lineHeight: 22, color: NM.ink2, textAlign: 'center', marginBottom: 28 },
  journeyCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: NM.r.xl, padding: 16, marginBottom: 16,
  },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  journeyLabel: { fontSize: 10, color: NM.ink3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  journeyCount: { fontSize: 10, color: NM.ink3, fontWeight: '600' },
  journeyRow: { flexDirection: 'row', gap: 6 },
  journeyBlock: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ratingPreview: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: NM.r.xl, padding: 16, marginBottom: 24, ...NM.shadow.card,
  },
  ratingTitle: { fontSize: 13, color: NM.ink, fontWeight: '600', marginBottom: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  ratingKey: { fontSize: 13, color: NM.ink2 },
  stars: { flexDirection: 'row', gap: 2 },
  actions: { width: '100%', gap: 14 },
  later: { textAlign: 'center', fontSize: 13, color: NM.ink3 },
});
