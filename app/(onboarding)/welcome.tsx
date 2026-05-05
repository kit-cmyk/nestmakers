import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={s.root}>
      {/* Ambient blobs */}
      <View style={[s.blob, { top: -60, right: -50, width: 280, height: 280, backgroundColor: NM.lavenderSoft, opacity: 0.9 }]} />
      <View style={[s.blob, { bottom: 160, left: -90, width: 300, height: 300, backgroundColor: NM.peachSoft, opacity: 0.85 }]} />
      <View style={[s.blob, { top: 230, left: 50, width: 160, height: 160, backgroundColor: NM.butterSoft, opacity: 0.8 }]} />

      <SafeAreaView style={s.safe}>
        <View style={s.inner}>
          <Text style={s.wordmark}>Nestmakers</Text>

          <View style={s.mid}>
            <Text style={s.headline}>
              How a family{'\n'}
              <Text style={s.italic}>begins</Text>
              {' '}matters as{'\n'}much as the outcome.
            </Text>
            <Text style={s.sub}>
              A considered space for Givers and Seekers to meet with clarity — before a match is made.
            </Text>
          </View>

          <View style={s.actions}>
            <NMBtn full onPress={() => router.push('/(onboarding)/create-account')}>
              Create an account
            </NMBtn>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/sign-in')}>
              <Text style={s.signin}>
                Already have an account?{'  '}
                <Text style={s.signinBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  blob: { position: 'absolute', borderRadius: 999 },
  safe: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40, justifyContent: 'space-between' },
  wordmark: { fontFamily: 'System', fontSize: 11, color: NM.ink3, letterSpacing: 2, textTransform: 'uppercase' },
  mid: { gap: 18 },
  headline: { fontSize: 46, lineHeight: 50, color: NM.ink, letterSpacing: -1.2, fontWeight: '300' },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  sub: { fontSize: 16, lineHeight: 24, color: NM.ink2, maxWidth: 300 },
  actions: { gap: 16 },
  signin: { textAlign: 'center', fontSize: 14, color: NM.ink3 },
  signinBold: { color: NM.ink, fontWeight: '600' },
});
