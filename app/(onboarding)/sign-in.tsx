import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import NMHeader from '@/components/NMHeader';
import { useAuthStore } from '@/store/authStore';

export default function SignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
  const { width: screenW } = useWindowDimensions();
  const lavenderSize = Math.round(screenW * 0.78);
  const peachSize = Math.round(screenW * 0.88);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    const err = await signInWithGoogle();
    if (err) setError(err);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    const err = await signIn(email.trim().toLowerCase(), password);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Ambient blobs — sized & offset relative to screen width so they sit consistently on any device */}
      <View
        pointerEvents="none"
        style={[
          s.blob,
          {
            top: -lavenderSize * 0.42,
            left: -lavenderSize * 0.35,
            width: lavenderSize,
            height: lavenderSize,
            backgroundColor: NM.lavenderSoft,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          s.blob,
          {
            bottom: -peachSize * 0.42,
            right: -peachSize * 0.35,
            width: peachSize,
            height: peachSize,
            backgroundColor: NM.peachSoft,
          },
        ]}
      />

      <SafeAreaView>
        <NMHeader />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.wordmark}>Nestmakers</Text>
        <Text style={s.title}>
          How a family{'\n'}
          <Text style={s.italic}>begins</Text>
          {' '}matters as{'\n'}much as the outcome.
        </Text>
        <Text style={s.sub}>
          A considered space for Givers and Seekers to meet with clarity — before a match is made.
        </Text>

        <View style={s.form}>
          {/* Email */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Email address</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={NM.ink3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                placeholder="you@example.com"
                placeholderTextColor={NM.ink3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={NM.ink3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                placeholder="Your password"
                placeholderTextColor={NM.ink3}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={s.eyeBtn}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={NM.ink3}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={s.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={NM.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Forgot password */}
          <TouchableOpacity
            style={s.forgotWrap}
            onPress={() => router.push('/(onboarding)/forgot-password')}
          >
            <Text style={s.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>

          {isLoading ? (
            <ActivityIndicator color={NM.ink} style={{ marginTop: 4 }} />
          ) : (
            <NMBtn full onPress={handleSignIn}>Sign in</NMBtn>
          )}

        </View>

        <TouchableOpacity onPress={() => router.push('/(onboarding)/create-account')}>
          <Text style={s.createText}>
            Don't have an account?{'  '}
            <Text style={s.createBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.45 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 48, paddingTop: 16 },
  wordmark: { fontSize: 11, color: NM.ink3, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 },
  title: { fontSize: 46, lineHeight: 50, color: NM.ink, letterSpacing: -1.2, fontWeight: '300', marginBottom: 10 },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  sub: { fontSize: 16, lineHeight: 24, color: NM.ink2, marginBottom: 36 },
  form: { gap: 16, marginBottom: 28 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: NM.ink2, letterSpacing: 0.1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: NM.r.lg,
    borderWidth: 1.5, borderColor: NM.hair2,
    paddingHorizontal: 14, height: 52,
    ...NM.shadow.soft,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: NM.ink },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 13, color: NM.danger },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 14, color: NM.lavenderDeep, fontWeight: '600' },
  createText: { textAlign: 'center', fontSize: 14, color: NM.ink3 },
  createBold: { color: NM.ink, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: NM.hair2 },
  dividerText: { fontSize: 13, color: NM.ink3 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: NM.r.lg,
    borderWidth: 1.5, borderColor: NM.hair2,
    paddingHorizontal: 14, height: 52, gap: 10,
    ...NM.shadow.soft,
  },
  googleBtnText: { fontSize: 16, color: NM.ink, fontWeight: '500' },
});
