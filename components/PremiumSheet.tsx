import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { usePremiumSheetStore } from '@/store/premiumSheetStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

const BENEFITS = [
  { icon: '♾️', label: 'Unlimited likes & browses' },
  { icon: '👁️', label: 'See who liked you — full reveal' },
  { icon: '✏️', label: 'Personal notes with every like' },
  { icon: '🔁', label: 'Undo passes (3/day)' },
  { icon: '🛡️', label: 'Verified badge on your profile' },
  { icon: '🕵️', label: 'Incognito browse mode' },
  { icon: '💬', label: 'Unlimited message threads' },
  { icon: '⚡', label: 'Priority placement in browse decks' },
];

const SHEET_HEIGHT = Dimensions.get('window').height * 0.82;

export default function PremiumSheet() {
  const { visible, reason, hide } = usePremiumSheetStore();
  const { offerings, loadOfferings, purchase, restore } = useSubscriptionStore();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (!offerings) loadOfferings();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Auto-select annual when offerings load
  useEffect(() => {
    const annual = offerings?.current?.annual;
    const monthly = offerings?.current?.monthly;
    if (!selectedPkg) setSelectedPkg(annual ?? monthly ?? null);
  }, [offerings]);

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setLoading(true);
    try {
      await purchase(selectedPkg);
      hide();
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restore();
      hide();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch (e: any) {
      Alert.alert('Restore failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const annual = offerings?.current?.annual;
  const monthly = offerings?.current?.monthly;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={hide}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={hide} />

      <Animated.View
        style={[s.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <NMBtn kind="ghost" style={s.closeBtn} onPress={hide}>
            <Text style={s.closeTxt}>✕</Text>
          </NMBtn>
          <View style={s.crown}><Text style={s.crownTxt}>✦</Text></View>
          <Text style={s.title}>Go Premium</Text>
          <Text style={s.subtitle}>{reason}</Text>
        </View>

        {/* Benefits */}
        <View style={s.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={s.benefitRow}>
              <Text style={s.benefitIcon}>{b.icon}</Text>
              <Text style={s.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* Package selector */}
        {(annual || monthly) ? (
          <View style={s.packages}>
            {annual && (
              <PackageOption
                pkg={annual}
                label="Annual"
                badge="Best value · 45% off"
                selected={selectedPkg?.identifier === annual.identifier}
                onSelect={() => setSelectedPkg(annual)}
              />
            )}
            {monthly && (
              <PackageOption
                pkg={monthly}
                label="Monthly"
                selected={selectedPkg?.identifier === monthly.identifier}
                onSelect={() => setSelectedPkg(monthly)}
              />
            )}
          </View>
        ) : (
          <View style={s.loadingRow}>
            <ActivityIndicator color={NM.lavenderDeep} />
          </View>
        )}

        {/* CTA */}
        <NMBtn
          kind="primary"
          full
          style={s.cta}
          onPress={handlePurchase}
          disabled={loading || !selectedPkg}
        >
          {loading ? 'Processing…' : 'Continue'}
        </NMBtn>

        <TouchableOpacity onPress={handleRestore} disabled={loading} style={s.restoreRow}>
          <Text style={s.restoreTxt}>Restore purchases</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the period.
        </Text>
      </Animated.View>
    </Modal>
  );
}

function PackageOption({
  pkg,
  label,
  badge,
  selected,
  onSelect,
}: {
  pkg: PurchasesPackage;
  label: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      style={[s.pkgCard, selected && s.pkgCardSelected]}
    >
      <View style={s.pkgLeft}>
        <View style={[s.radio, selected && s.radioSelected]}>
          {selected && <View style={s.radioDot} />}
        </View>
        <View>
          <Text style={s.pkgLabel}>{label}</Text>
          {badge && <Text style={s.pkgBadge}>{badge}</Text>}
        </View>
      </View>
      <Text style={s.pkgPrice}>{pkg.product.priceString}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,31,61,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: NM.cream,
    borderTopLeftRadius: NM.r.xl,
    borderTopRightRadius: NM.r.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    ...NM.shadow.lift,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: NM.hair2,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeTxt: {
    fontSize: 14,
    color: NM.ink3,
  },
  crown: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NM.butterSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  crownTxt: { fontSize: 22 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: NM.ink,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: NM.ink3,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefits: {
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  benefitLabel: { fontSize: 14, color: NM.ink2, fontWeight: '500' },
  packages: { gap: 10, marginBottom: 20 },
  loadingRow: { alignItems: 'center', paddingVertical: 20 },
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: NM.r.md,
    borderWidth: 1.5,
    borderColor: NM.hair2,
    backgroundColor: NM.cream2,
  },
  pkgCardSelected: {
    borderColor: NM.lavenderDeep,
    backgroundColor: NM.lavenderSoft,
  },
  pkgLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: NM.hair2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: NM.lavenderDeep },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NM.lavenderDeep,
  },
  pkgLabel: { fontSize: 15, fontWeight: '600', color: NM.ink },
  pkgBadge: { fontSize: 11, color: NM.lavenderDeep, fontWeight: '600', marginTop: 2 },
  pkgPrice: { fontSize: 15, fontWeight: '700', color: NM.ink },
  cta: { marginBottom: 12 },
  restoreRow: { alignItems: 'center', paddingVertical: 10 },
  restoreTxt: { fontSize: 13, color: NM.ink3 },
  legal: {
    fontSize: 10,
    color: NM.ink3,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 8,
    opacity: 0.7,
  },
});
