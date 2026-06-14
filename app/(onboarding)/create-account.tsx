import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import NMHeader from '@/components/NMHeader';
import { useAuthStore } from '@/store/authStore';

export default function CreateAccount() {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    const err = await signInWithGoogle();
    if (err) setError(err);
  };

  const handleCreate = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setError('');
    const err = await signUp(email.trim().toLowerCase(), password);
    if (err) { setError(err); return; }
    router.push('/(onboarding)/about');
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.blob, { top: -80, left: -60, width: 260, height: 260, backgroundColor: NM.lavenderSoft }]} />
      <View style={[s.blob, { bottom: 80, right: -80, width: 280, height: 280, backgroundColor: NM.peachSoft }]} />

      <SafeAreaView>
        <NMHeader title="Step 1 of 8" left="Back" />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.wordmark}>Nestmakers</Text>
        <Text style={s.title}>Create your{'\n'}account</Text>
        <Text style={s.sub}>Your email and password are kept private — your profile name is what others see.</Text>

        <View style={s.form}>
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

          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={NM.ink3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                placeholder="At least 8 characters"
                placeholderTextColor={NM.ink3}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={s.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={NM.ink3} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Confirm password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={NM.ink3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={(v) => { setConfirm(v); setError(''); }}
                placeholder="Repeat your password"
                placeholderTextColor={NM.ink3}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {error ? (
            <View style={s.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={NM.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <ActivityIndicator color={NM.ink} style={{ marginTop: 8 }} />
          ) : (
            <NMBtn full onPress={handleCreate}>Create account</NMBtn>
          )}

        </View>

        <TouchableOpacity onPress={() => router.push('/(onboarding)/sign-in')}>
          <Text style={s.signInText}>
            Already have an account?{'  '}
            <Text style={s.signInBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.8 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 48, paddingTop: 16 },
  wordmark: { fontSize: 11, color: NM.ink3, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 },
  title: { fontSize: 40, lineHeight: 44, color: NM.ink, letterSpacing: -1, fontWeight: '300', marginBottom: 10 },
  sub: { fontSize: 15, lineHeight: 22, color: NM.ink2, marginBottom: 36 },
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
  errorText: { fontSize: 13, color: NM.danger, flex: 1 },
  signInText: { textAlign: 'center', fontSize: 14, color: NM.ink3 },
  signInBold: { color: NM.ink, fontWeight: '600' },
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
