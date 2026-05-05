import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { supabase } from '@/lib/supabase';

type Step = 'form' | 'done';

function StrengthBar({ password }: { password: string }) {
  const score = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['', NM.danger, NM.peachDeep, NM.gold, '#6B8E56', NM.lavenderDeep];

  if (!password) return null;

  return (
    <View style={sb.wrap}>
      <View style={sb.bars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[sb.bar, { backgroundColor: i <= score ? colors[score] : NM.hair2 }]}
          />
        ))}
      </View>
      <Text style={[sb.label, { color: colors[score] }]}>{labels[score]}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '600', width: 68, textAlign: 'right' },
});

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(password)) e.password = 'Include at least one uppercase letter.';
    else if (!/[0-9]/.test(password)) e.password = 'Include at least one number.';
    if (confirm !== password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErrors({ password: error.message });
      return;
    }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <View style={s.root}>
        <View style={[s.blob, { bottom: 60, right: -60, width: 260, height: 260, backgroundColor: NM.sageSoft }]} />
        <SafeAreaView style={s.safe}>
          <View style={s.doneWrap}>
            <View style={s.doneIcon}>
              <Ionicons name="checkmark" size={36} color="#6B8E56" />
            </View>
            <Text style={s.doneTitle}>Password{'\n'}updated.</Text>
            <Text style={s.doneSub}>
              Your password has been changed successfully. You can now sign in with your new password.
            </Text>
            <NMBtn full onPress={() => router.replace('/(onboarding)/sign-in')} style={{ marginTop: 8 }}>
              Sign in
            </NMBtn>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.blob, { top: -60, left: -50, width: 240, height: 240, backgroundColor: NM.lavenderSoft }]} />
      <View style={[s.blob, { bottom: 80, right: -60, width: 220, height: 220, backgroundColor: NM.butterSoft }]} />

      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={s.inner}>
          <View style={s.iconWrap}>
            <Ionicons name="lock-closed-outline" size={28} color={NM.lavenderDeep} />
          </View>

          <Text style={s.title}>Choose a new{'\n'}password.</Text>
          <Text style={s.sub}>
            Pick something you haven't used before and that only you would know.
          </Text>

          <View style={s.form}>
            {/* New password */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>New password</Text>
              <View style={[s.inputWrap, errors.password ? s.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={errors.password ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                  placeholder="At least 8 characters"
                  placeholderTextColor={NM.ink3}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={s.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={NM.ink3} />
                </TouchableOpacity>
              </View>
              <StrengthBar password={password} />
              {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Confirm password */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Confirm new password</Text>
              <View style={[s.inputWrap, errors.confirm ? s.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={errors.confirm ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={confirm}
                  onChangeText={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
                  placeholder="Re-enter your password"
                  placeholderTextColor={NM.ink3}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm((p) => !p)} style={s.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={NM.ink3} />
                </TouchableOpacity>
              </View>
              {errors.confirm ? <Text style={s.errorText}>{errors.confirm}</Text> : null}
            </View>

            {/* Requirements */}
            <View style={s.requirements}>
              {[
                ['8+ characters', password.length >= 8],
                ['One uppercase letter', /[A-Z]/.test(password)],
                ['One number', /[0-9]/.test(password)],
              ].map(([label, met]) => (
                <View key={label as string} style={s.reqRow}>
                  <Ionicons
                    name={met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={met ? '#6B8E56' : NM.ink3}
                  />
                  <Text style={[s.reqText, met ? s.reqMet : null]}>{label as string}</Text>
                </View>
              ))}
            </View>

            {loading ? (
              <ActivityIndicator color={NM.ink} style={{ marginTop: 8 }} />
            ) : (
              <NMBtn full onPress={handleReset}>
                Update password
              </NMBtn>
            )}
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.85 },
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 4 },
  backText: { fontSize: 15, color: NM.ink2, fontWeight: '500' },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },
  iconWrap: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: NM.lavenderSoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 38, lineHeight: 43, color: NM.ink, letterSpacing: -0.9, fontWeight: '300', marginBottom: 14 },
  sub: { fontSize: 16, lineHeight: 24, color: NM.ink2, marginBottom: 36 },
  form: { gap: 16 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: NM.ink2, letterSpacing: 0.1, marginBottom: 4 },
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
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 13, color: NM.danger, marginTop: 4 },
  requirements: { gap: 6, paddingHorizontal: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqText: { fontSize: 13, color: NM.ink3 },
  reqMet: { color: '#6B8E56' },
  // Done state
  doneWrap: { flex: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40, gap: 20 },
  doneIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: NM.sageSoft, alignItems: 'center', justifyContent: 'center',
  },
  doneTitle: { fontSize: 46, lineHeight: 50, color: NM.ink, letterSpacing: -1.2, fontWeight: '300' },
  doneSub: { fontSize: 16, lineHeight: 24, color: NM.ink2 },
});
