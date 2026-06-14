import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import NMHeader from '@/components/NMHeader';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type EmailStep = 'idle' | 'form' | 'sent';
type PasswordStep = 'idle' | 'form' | 'done';

export default function AccountSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuthStore();
  const currentEmail = session?.user?.email ?? '';

  // Email change state
  const [emailStep, setEmailStep] = useState<EmailStep>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change state
  const [passwordStep, setPasswordStep] = useState<PasswordStep>('idle');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Email ────────────────────────────────────────────────────────────────

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) { setEmailError('Please enter a new email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("That doesn't look like a valid email address.");
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setEmailError("That's already your current email address.");
      return;
    }
    setEmailError('');
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailLoading(false);
    if (error) { setEmailError(error.message); return; }
    setEmailStep('sent');
  };

  // ── Password ─────────────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setPasswordError('');
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) { setPasswordError(error.message); return; }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStep('done');
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, matches, and messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Are you absolutely sure?',
      `Your account tied to ${currentEmail} will be deleted immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete permanently',
          style: 'destructive',
          onPress: runDelete,
        },
      ],
    );
  };

  const runDelete = async () => {
    setDeleteLoading(true);
    const { error } = await supabase.rpc('delete_my_account');
    setDeleteLoading(false);
    if (error) {
      Alert.alert('Could not delete account', error.message);
      return;
    }
    await signOut();
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.headerWrap, { paddingTop: insets.top }]}>
        <NMHeader left="Back" />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Account settings</Text>
        <Text style={s.pageSub}>Manage your email, password, and account.</Text>

        {/* ── Email ── */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={s.iconBox}>
              <Ionicons name="mail-outline" size={18} color={NM.lavenderDeep} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardLabel}>Email address</Text>
              <Text style={s.cardValue} numberOfLines={1}>{currentEmail || '—'}</Text>
            </View>
            {emailStep === 'idle' && (
              <TouchableOpacity onPress={() => setEmailStep('form')}>
                <Text style={s.actionLink}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {emailStep === 'form' && (
            <View style={s.expandedForm}>
              <View style={s.divider} />
              <Text style={s.fieldLabel}>New email address</Text>
              <View style={[s.inputWrap, emailError ? s.inputError : null]}>
                <Ionicons name="mail-outline" size={17} color={emailError ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={newEmail}
                  onChangeText={(v) => { setNewEmail(v); setEmailError(''); }}
                  placeholder="new@example.com"
                  placeholderTextColor={NM.ink3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {emailError ? <Text style={s.errorText}>{emailError}</Text> : null}
              <Text style={s.hintText}>We'll send a confirmation link to the new address.</Text>
              <View style={s.formActions}>
                {emailLoading ? (
                  <ActivityIndicator color={NM.ink} />
                ) : (
                  <>
                    <NMBtn kind="secondary" onPress={() => { setEmailStep('idle'); setEmailError(''); setNewEmail(''); }}>
                      Cancel
                    </NMBtn>
                    <NMBtn style={s.actionFlex} onPress={handleChangeEmail}>
                      Send confirmation
                    </NMBtn>
                  </>
                )}
              </View>
            </View>
          )}

          {emailStep === 'sent' && (
            <View style={s.expandedForm}>
              <View style={s.divider} />
              <View style={s.successRow}>
                <Ionicons name="checkmark-circle" size={18} color={NM.sage} />
                <Text style={s.successText}>
                  Confirmation sent to <Text style={s.successEmail}>{newEmail.trim()}</Text>.
                  Click the link to confirm the change.
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setEmailStep('idle'); setNewEmail(''); }}>
                <Text style={s.actionLink}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Password ── */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <View style={s.iconBox}>
              <Ionicons name="lock-closed-outline" size={18} color={NM.lavenderDeep} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardLabel}>Password</Text>
              <Text style={s.cardValue}>••••••••</Text>
            </View>
            {passwordStep === 'idle' && (
              <TouchableOpacity onPress={() => setPasswordStep('form')}>
                <Text style={s.actionLink}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {passwordStep === 'form' && (
            <View style={s.expandedForm}>
              <View style={s.divider} />

              <Text style={s.fieldLabel}>New password</Text>
              <View style={[s.inputWrap, passwordError ? s.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={17} color={passwordError ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setPasswordError(''); }}
                  placeholder="At least 8 characters"
                  placeholderTextColor={NM.ink3}
                  secureTextEntry={!showNew}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowNew(v => !v)}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={17} color={NM.ink3} />
                </TouchableOpacity>
              </View>

              <Text style={[s.fieldLabel, { marginTop: 12 }]}>Confirm new password</Text>
              <View style={[s.inputWrap, passwordError ? s.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={17} color={passwordError ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setPasswordError(''); }}
                  placeholder="Repeat new password"
                  placeholderTextColor={NM.ink3}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color={NM.ink3} />
                </TouchableOpacity>
              </View>

              {passwordError ? <Text style={s.errorText}>{passwordError}</Text> : null}

              <View style={s.formActions}>
                {passwordLoading ? (
                  <ActivityIndicator color={NM.ink} />
                ) : (
                  <>
                    <NMBtn kind="secondary" onPress={() => { setPasswordStep('idle'); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); }}>
                      Cancel
                    </NMBtn>
                    <NMBtn style={s.actionFlex} onPress={handleChangePassword}>
                      Update password
                    </NMBtn>
                  </>
                )}
              </View>
            </View>
          )}

          {passwordStep === 'done' && (
            <View style={s.expandedForm}>
              <View style={s.divider} />
              <View style={s.successRow}>
                <Ionicons name="checkmark-circle" size={18} color={NM.sage} />
                <Text style={s.successText}>Password updated successfully.</Text>
              </View>
              <TouchableOpacity onPress={() => setPasswordStep('idle')}>
                <Text style={s.actionLink}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Danger zone ── */}
        <View style={s.dangerCard}>
          <Text style={s.dangerTitle}>Danger zone</Text>
          <Text style={s.dangerSub}>
            Deleting your account is permanent and immediate. All your profile data, matches, and messages will be removed.
          </Text>
          {deleteLoading ? (
            <ActivityIndicator color={NM.danger} style={{ marginTop: 12 }} />
          ) : (
            <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={16} color={NM.danger} />
              <Text style={s.deleteBtnText}>Delete my account</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  headerWrap: { backgroundColor: NM.cream },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  pageTitle: { fontSize: 30, fontWeight: '300', color: NM.ink, letterSpacing: -0.7, marginBottom: 6, marginTop: 4 },
  pageSub: { fontSize: 15, color: NM.ink3, lineHeight: 22, marginBottom: 28 },

  card: {
    backgroundColor: '#fff', borderRadius: NM.r.xl,
    marginBottom: 12, ...NM.shadow.card, overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: NM.lavenderSoft, alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 11, color: NM.ink3, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: '600' },
  cardValue: { fontSize: 15, color: NM.ink, fontWeight: '500', marginTop: 2 },
  actionLink: { fontSize: 14, color: NM.lavenderDeep, fontWeight: '600' },

  expandedForm: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  divider: { height: 1, backgroundColor: NM.hair, marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: NM.ink2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: NM.cream2, borderRadius: NM.r.lg,
    borderWidth: 1.5, borderColor: NM.hair2,
    paddingHorizontal: 12, height: 48,
  },
  inputError: { borderColor: NM.danger, backgroundColor: NM.dangerSoft },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: NM.ink },
  errorText: { fontSize: 13, color: NM.danger },
  hintText: { fontSize: 12, color: NM.ink3, lineHeight: 17 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4, alignItems: 'center' },
  actionFlex: { flex: 1 },

  successRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  successText: { flex: 1, fontSize: 14, color: NM.ink2, lineHeight: 20 },
  successEmail: { color: NM.ink, fontWeight: '600' },

  dangerCard: {
    backgroundColor: '#fff', borderRadius: NM.r.xl,
    padding: 16, marginTop: 8, ...NM.shadow.card,
    borderWidth: 1, borderColor: NM.dangerSoft,
  },
  dangerTitle: { fontSize: 13, fontWeight: '700', color: NM.danger, textTransform: 'uppercase', letterSpacing: 1 },
  dangerSub: { fontSize: 13, color: NM.ink3, lineHeight: 19, marginTop: 6, marginBottom: 12 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: NM.danger, borderRadius: NM.r.lg,
    paddingVertical: 11, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: NM.danger },
});
