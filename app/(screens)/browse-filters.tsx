import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import { useBrowseFiltersStore } from '@/store/browseFiltersStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { GiverType, InsemPref, InvolvementLevel } from '@/types/database';

function ChipGroup<T extends string>({ options, selected, onChange }: {
  options: { key: T; label: string }[];
  selected: T[];
  onChange: (key: T) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt.key);
        return (
          <TouchableOpacity
            key={opt.key}
            style={[s.chip, active && s.chipActive]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function toggle<T>(arr: T[], key: T): T[] {
  return arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];
}

const GIVER_TYPES: { key: GiverType; label: string }[] = [
  { key: 'egg', label: 'Egg donor' },
  { key: 'sperm', label: 'Sperm donor' },
  { key: 'womb', label: 'Surrogate' },
  { key: 'embryo', label: 'Embryo donor' },
];

const INSEM: { key: InsemPref; label: string }[] = [
  { key: 'ai', label: 'AI only' },
  { key: 'ni', label: 'Natural insemination' },
  { key: 'both', label: 'Either' },
];

const INVOLVEMENT: { key: InvolvementLevel; label: string }[] = [
  { key: 'anonymous', label: 'Anonymous' },
  { key: 'identity_release', label: 'Identity release' },
  { key: 'limited_contact', label: 'Limited contact' },
  { key: 'known_donor', label: 'Known donor' },
  { key: 'co_parenting', label: 'Co-parenting' },
];

const RADIUS_OPTIONS = [25, 50, 100, 250, 500];

export default function BrowseFilters() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { giverTypes, insemPrefs, involvementLevels, ageMin, ageMax, verifiedOnly, radiusKm, setFilters, reset, activeCount } =
    useBrowseFiltersStore();
  const { session, profile: myProfile, setProfile } = useAuthStore();

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const count = activeCount();
  const hasLocation = !!(myProfile?.latitude && myProfile?.longitude);

  const handleSetLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Enable it in Settings to use this filter.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      if (!session?.user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ latitude, longitude })
        .eq('id', session.user.id);

      if (error) {
        setLocationError('Could not save your location. Try again.');
        return;
      }

      if (myProfile) setProfile({ ...myProfile, latitude, longitude });
    } catch {
      setLocationError('Could not get your location. Try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Show me</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={s.resetLink}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>Giver type</Text>
        <ChipGroup
          options={GIVER_TYPES}
          selected={giverTypes}
          onChange={(k) => setFilters({ giverTypes: toggle(giverTypes, k) })}
        />

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Insemination preference</Text>
        <ChipGroup
          options={INSEM}
          selected={insemPrefs}
          onChange={(k) => setFilters({ insemPrefs: toggle(insemPrefs, k) })}
        />

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Involvement level</Text>
        <ChipGroup
          options={INVOLVEMENT}
          selected={involvementLevels}
          onChange={(k) => setFilters({ involvementLevels: toggle(involvementLevels, k) })}
        />

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Age range</Text>
        <View style={s.ageRow}>
          <View style={s.agePicker}>
            <TouchableOpacity
              onPress={() => setFilters({ ageMin: Math.max(18, ageMin - 1) })}
              style={s.ageBtn}
            >
              <Ionicons name="remove" size={16} color={NM.ink2} />
            </TouchableOpacity>
            <Text style={s.ageValue}>{ageMin}</Text>
            <TouchableOpacity
              onPress={() => setFilters({ ageMin: Math.min(ageMax - 1, ageMin + 1) })}
              style={s.ageBtn}
            >
              <Ionicons name="add" size={16} color={NM.ink2} />
            </TouchableOpacity>
          </View>
          <Text style={s.ageDash}>to</Text>
          <View style={s.agePicker}>
            <TouchableOpacity
              onPress={() => setFilters({ ageMax: Math.max(ageMin + 1, ageMax - 1) })}
              style={s.ageBtn}
            >
              <Ionicons name="remove" size={16} color={NM.ink2} />
            </TouchableOpacity>
            <Text style={s.ageValue}>{ageMax}</Text>
            <TouchableOpacity
              onPress={() => setFilters({ ageMax: Math.min(60, ageMax + 1) })}
              style={s.ageBtn}
            >
              <Ionicons name="add" size={16} color={NM.ink2} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Verification</Text>
        <View style={s.toggleCard}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={s.toggleLabel}>Verified profiles only</Text>
            <Text style={s.toggleSub}>Only show profiles that have passed ID verification</Text>
          </View>
          <Switch
            value={verifiedOnly}
            onValueChange={(v) => setFilters({ verifiedOnly: v })}
            trackColor={{ false: '#E5E5E5', true: NM.ink }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>Location</Text>
        <View style={s.locationCard}>
          <TouchableOpacity
            style={s.locationBtn}
            onPress={handleSetLocation}
            disabled={locationLoading}
            activeOpacity={0.75}
          >
            {locationLoading
              ? <ActivityIndicator size="small" color={NM.lavenderDeep} />
              : <Ionicons name="location-outline" size={16} color={NM.lavenderDeep} />
            }
            <Text style={s.locationBtnText}>
              {locationLoading ? 'Getting location…' : hasLocation ? 'Update my location' : 'Use my location'}
            </Text>
          </TouchableOpacity>
          {hasLocation && !locationLoading && (
            <View style={s.locationSetRow}>
              <Ionicons name="checkmark-circle" size={14} color={NM.sage} />
              <Text style={s.locationSetText}>Location saved</Text>
            </View>
          )}
          {locationError && (
            <Text style={s.locationError}>{locationError}</Text>
          )}
        </View>

        {hasLocation && (
          <>
            <Text style={s.radiusLabel}>Search radius</Text>
            <View style={s.chipRow}>
              {RADIUS_OPTIONS.map((km) => {
                const active = radiusKm === km;
                return (
                  <TouchableOpacity
                    key={km}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setFilters({ radiusKm: active ? 0 : km })}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{km} km</Text>
                  </TouchableOpacity>
                );
              })}
              {radiusKm > 0 && (
                <TouchableOpacity
                  style={s.chip}
                  onPress={() => setFilters({ radiusKm: 0 })}
                  activeOpacity={0.75}
                >
                  <Text style={s.chipText}>Any distance</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <View style={{ marginTop: 32 }}>
          <NMBtn full onPress={() => router.back()}>
            {count > 0 ? `Apply ${count} filter${count > 1 ? 's' : ''}` : 'Apply filters'}
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
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: NM.hair,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, color: NM.ink, fontWeight: '600', letterSpacing: -0.2 },
  resetLink: { fontSize: 14, color: NM.ink3, fontWeight: '500' },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 10, color: NM.ink3, letterSpacing: 1.2, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: NM.r.pill, borderWidth: 1.5, borderColor: NM.hair2,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: NM.ink, borderColor: NM.ink },
  chipText: { fontSize: 14, color: NM.ink2, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  agePicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: NM.r.lg, ...NM.shadow.soft,
    overflow: 'hidden',
  },
  ageBtn: { padding: 14 },
  ageValue: { fontSize: 17, color: NM.ink, fontWeight: '600', minWidth: 36, textAlign: 'center' },
  ageDash: { fontSize: 14, color: NM.ink3 },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: NM.r.lg, padding: 16, ...NM.shadow.soft,
  },
  toggleLabel: { fontSize: 15, color: NM.ink, fontWeight: '500', marginBottom: 2 },
  toggleSub: { fontSize: 12, color: NM.ink3, lineHeight: 17 },
  locationCard: {
    backgroundColor: '#fff', borderRadius: NM.r.lg, padding: 14,
    gap: 8, ...NM.shadow.soft,
  },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 4,
  },
  locationBtnText: { fontSize: 15, color: NM.lavenderDeep, fontWeight: '600' },
  locationSetRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationSetText: { fontSize: 12, color: NM.sage, fontWeight: '500' },
  locationError: { fontSize: 12, color: NM.danger, lineHeight: 17 },
  radiusLabel: {
    fontSize: 12, color: NM.ink3, fontWeight: '500',
    marginTop: 14, marginBottom: 8,
  },
});
