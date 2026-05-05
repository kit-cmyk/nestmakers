import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { useDealBreakersStore } from '@/store/dealBreakersStore';
import { InsemPref, InvolvementLevel } from '@/types/database';
import { usePremium } from '@/hooks/usePremium';
import { usePremiumSheetStore } from '@/store/premiumSheetStore';

const FREE_RULE_LIMIT = 1;

const INSEM_OPTIONS: { key: InsemPref; label: string }[] = [
  { key: 'ai', label: 'AI only' },
  { key: 'ni', label: 'Natural insemination' },
  { key: 'both', label: 'Either' },
];

const INVOLVEMENT_OPTIONS: { key: InvolvementLevel; label: string }[] = [
  { key: 'anonymous', label: 'Anonymous' },
  { key: 'identity_release', label: 'Identity release' },
  { key: 'limited_contact', label: 'Limited contact' },
  { key: 'known_donor', label: 'Known donor' },
  { key: 'co_parenting', label: 'Co-parenting' },
];

function toggle<T>(arr: T[], key: T): T[] {
  return arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];
}

function MultiChips<T extends string>({ options, selected, onToggle }: {
  options: { key: T; label: string }[];
  selected: T[];
  onToggle: (key: T) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt.key);
        return (
          <TouchableOpacity
            key={opt.key}
            style={[s.chip, active && s.chipDanger]}
            onPress={() => onToggle(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, active && s.chipTextDanger]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function DealBreakers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useDealBreakersStore();
  const activeCount = store.activeCount();
  const isPremium = usePremium();
  const showPremiumSheet = usePremiumSheetStore((s) => s.show);

  const guardRule = (isAdding: boolean) => {
    if (isAdding && !isPremium && activeCount >= FREE_RULE_LIMIT) {
      showPremiumSheet('Upgrade to set unlimited deal-breaker rules.');
      return false;
    }
    return true;
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Deal-Breaker Filters</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.infoCard}>
          <Ionicons name="funnel-outline" size={16} color={NM.peachDeep} />
          <Text style={s.infoText}>
            Deal-breakers auto-decline anyone who doesn't meet your requirements.
            They'll never appear in your browse queue.
          </Text>
        </View>

        <Text style={s.sectionLabel}>Insemination preference</Text>
        <Text style={s.chipHint}>Select methods you will NOT accept</Text>
        <MultiChips
          options={INSEM_OPTIONS}
          selected={store.blockedInsemPrefs}
          onToggle={(key) => {
            const isAdding = !store.blockedInsemPrefs.includes(key);
            if (!guardRule(isAdding)) return;
            store.set({ blockedInsemPrefs: toggle(store.blockedInsemPrefs, key) });
          }}
        />

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>Involvement level</Text>
        <Text style={s.chipHint}>Select involvement tiers you will NOT accept</Text>
        <MultiChips
          options={INVOLVEMENT_OPTIONS}
          selected={store.blockedInvolvementLevels}
          onToggle={(key) => {
            const isAdding = !store.blockedInvolvementLevels.includes(key);
            if (!guardRule(isAdding)) return;
            store.set({ blockedInvolvementLevels: toggle(store.blockedInvolvementLevels, key) });
          }}
        />

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>Age</Text>
        <View style={s.toggleCard}>
          <View style={s.toggleInfo}>
            <Text style={s.toggleLabel}>Must be 21 or older</Text>
            <Text style={s.toggleSub}>Exclude anyone under 21 (regardless of legal age)</Text>
          </View>
          <Switch
            value={store.requireAge21}
            onValueChange={(v) => {
              if (!guardRule(v)) return;
              store.set({ requireAge21: v });
            }}
            trackColor={{ false: NM.hair2, true: NM.ink }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[s.sectionLabel, { marginTop: 20 }]}>Location</Text>
        <View style={s.toggleCard}>
          <View style={s.toggleInfo}>
            <Text style={s.toggleLabel}>Same country only</Text>
            <Text style={s.toggleSub}>Exclude profiles from outside your country</Text>
          </View>
          <Switch
            value={store.sameCountryOnly}
            onValueChange={(v) => {
              if (!guardRule(v)) return;
              store.set({ sameCountryOnly: v });
            }}
            trackColor={{ false: NM.hair2, true: NM.ink }}
            thumbColor="#fff"
          />
        </View>

        {activeCount > 0 && (
          <View style={s.activePill}>
            <Ionicons name="funnel" size={12} color={NM.ink} />
            <Text style={s.activeText}>{activeCount} active deal-breaker{activeCount > 1 ? 's' : ''}</Text>
          </View>
        )}

        <View style={{ marginTop: activeCount > 0 ? 12 : 28 }}>
          <NMBtn full onPress={() => router.back()}>
            {activeCount > 0 ? `Save ${activeCount} deal-breaker${activeCount > 1 ? 's' : ''}` : 'Done'}
          </NMBtn>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: NM.hair,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, color: NM.ink, fontWeight: '600', letterSpacing: -0.2 },
  scroll: { padding: 20, paddingBottom: 48 },
  infoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: NM.peachSoft, borderRadius: NM.r.lg, padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: NM.peachDeep, lineHeight: 19 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 8,
  },
  chipHint: { fontSize: 12, color: NM.ink3, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: NM.r.pill, borderWidth: 1.5, borderColor: NM.hair2,
    backgroundColor: '#fff',
  },
  chipDanger: { backgroundColor: NM.dangerSoft, borderColor: NM.danger },
  chipText: { fontSize: 14, color: NM.ink2, fontWeight: '500' },
  chipTextDanger: { color: NM.danger },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: NM.r.lg, padding: 16, ...NM.shadow.soft,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, color: NM.ink, fontWeight: '500', marginBottom: 2 },
  toggleSub: { fontSize: 12, color: NM.ink3, lineHeight: 17 },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', backgroundColor: NM.butterSoft,
    borderRadius: NM.r.pill, paddingHorizontal: 14, paddingVertical: 8,
    marginTop: 24,
  },
  activeText: { fontSize: 12, color: NM.ink, fontWeight: '600' },
});
