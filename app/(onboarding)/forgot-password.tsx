import React, { useState } from 'react';
import {
  View, Text, TextInput, ActivityIndicator,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import NMHeader from '@/components/NMHeader';
import { supabase } from '@/lib/supabase';

type Step = 'form' | 'sent';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    setError('');
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(trimmed.toLowerCase());
    setLoading(false);
    setStep('sent');
  };

  if (step === 'sent') {
    return (
      <View style={s.root}>
        <View style={[s.blob, { top: -60, right: -40, width: 240, height: 240, backgroundColor: NM.sageSoft }]} />
        <SafeAreaView>
          <NMHeader left="Back" />
        </SafeAreaView>

        <View style={s.sentWrap}>
            <View style={s.sentIcon}>
              <Ionicons name="mail-open-outline" size={32} color="#6B8E56" />
            </View>
            <Text style={s.sentTitle}>Check your inbox.</Text>
            <Text style={s.sentSub}>
              We've sent a reset link to{'\n'}
              <Text style={s.sentEmail}>{email.trim()}</Text>
            </Text>
            <Text style={s.sentHint}>
              The link expires in 30 minutes. Check your spam folder if it doesn't arrive.
            </Text>

            <NMBtn full kind="secondary" onPress={() => setStep('form')} style={{ marginTop: 8 }}>
              Try a different address
            </NMBtn>
            <NMBtn full onPress={() => router.push('/(onboarding)/sign-in')} style={{ marginTop: 10 }}>
              Back to sign in
            </NMBtn>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.blob, { top: -80, right: -60, width: 260, height: 260, backgroundColor: NM.butterSoft }]} />
      <View style={[s.blob, { bottom: 100, left: -60, width: 220, height: 220, backgroundColor: NM.lavenderSoft }]} />

      <SafeAreaView>
        <NMHeader left="Back" />
      </SafeAreaView>

      <View style={s.inner}>
          {/* Lock icon */}
          <View style={s.iconWrap}>
            <Ionicons name="lock-open-outline" size={28} color={NM.lavenderDeep} />
          </View>

          <Text style={s.title}>Forgot your{'\n'}password?</Text>
          <Text style={s.sub}>
            No problem. Enter the email address linked to your account and we'll send you a reset link.
          </Text>

          <View style={s.form}>
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Email address</Text>
              <View style={[s.inputWrap, error ? s.inputError : null]}>
                <Ionicons name="mail-outline" size={18} color={error ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  placeholder="you@example.com"
                  placeholderTextColor={NM.ink3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {error ? <Ionicons name="alert-circle" size={18} color={NM.danger} /> : null}
              </View>
              {error ? (
                <Text style={s.errorText}>{error}</Text>
              ) : null}
            </View>

            <NMBtn full onPress={handleSend}>
              Send reset link
            </NMBtn>
          </View>

          <View style={s.notice}>
            <Ionicons name="shield-checkmark-outline" size={15} color={NM.ink3} />
            <Text style={s.noticeText}>
              For your safety we never disclose whether an email is registered with us.
            </Text>
          </View>
        </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.85 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 8, paddingBottom: 40 },
  iconWrap: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: NM.lavenderSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 38, lineHeight: 43, color: NM.ink, letterSpacing: -0.9, fontWeight: '300', marginBottom: 14 },
  sub: { fontSize: 16, lineHeight: 24, color: NM.ink2, marginBottom: 36 },
  form: { gap: 16 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: NM.ink2, letterSpacing: 0.1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: NM.r.lg,
    borderWidth: 1.5, borderColor: NM.hair2,
    paddingHorizontal: 14, height: 52,
    ...NM.shadow.soft,
  },
  inputError: { borderColor: NM.danger, backgroundColor: NM.dangerSoft },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: NM.ink },
  errorText: { fontSize: 13, color: NM.danger, marginTop: 2 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 'auto', paddingTop: 32,
  },
  noticeText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 17 },
  // Sent state
  sentWrap: { flex: 1, paddingHorizontal: 28, paddingTop: 8, paddingBottom: 40, gap: 16 },
  sentIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: NM.sageSoft, alignItems: 'center', justifyContent: 'center',
  },
  sentTitle: { fontSize: 38, lineHeight: 43, color: NM.ink, letterSpacing: -0.9, fontWeight: '300' },
  sentSub: { fontSize: 16, lineHeight: 24, color: NM.ink2 },
  sentEmail: { color: NM.ink, fontWeight: '600' },
  sentHint: { fontSize: 13, color: NM.ink3, lineHeight: 19 },
});
