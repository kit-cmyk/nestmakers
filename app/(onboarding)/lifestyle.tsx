import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMHeader from '@/components/NMHeader';
import NMBtn from '@/components/NMBtn';
import { useOnboardingStore } from '@/store/onboardingStore';

const ETHNICITIES = [
  'White', 'Black / African', 'Hispanic / Latino', 'East Asian', 'South Asian',
  'Southeast Asian', 'Middle Eastern', 'Mixed', 'Other', 'Prefer not to say',
];

const EDUCATION = [
  { id: 'hs', label: 'High school' },
  { id: 'some_college', label: 'Some college' },
  { id: 'bachelors', label: "Bachelor's" },
  { id: 'masters', label: "Master's" },
  { id: 'doctorate', label: 'Doctorate' },
  { id: 'trade', label: 'Trade / Vocational' },
  { id: 'other', label: 'Other' },
];

const HAIR_COLORS = [
  'Black', 'Dark brown', 'Light brown', 'Blonde', 'Red', 'Auburn', 'Grey / White', 'Other',
];

const EYE_COLORS = [
  'Brown', 'Blue', 'Green', 'Hazel', 'Grey', 'Amber', 'Other',
];

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Unknown'];

type Frequency = 'Never' | 'Occasionally' | 'Regularly';
const FREQUENCIES: Frequency[] = ['Never', 'Occasionally', 'Regularly'];

type DrugFreq = 'Never' | 'Occasionally' | 'Prefer not to say';
const DRUG_OPTIONS: DrugFreq[] = ['Never', 'Occasionally', 'Prefer not to say'];

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function FreqRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.freqWrap}>
      <Text style={s.freqLabel}>{label}</Text>
      <View style={s.freqBtns}>
        {options.map((opt) => {
          const on = opt === value;
          return (
            <TouchableOpacity
              key={opt}
              style={[s.freqChip, on && s.freqChipOn]}
              onPress={() => onChange(opt)}
              activeOpacity={0.8}
            >
              <Text style={[s.freqChipText, on && s.freqChipTextOn]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function Lifestyle() {
  const router = useRouter();
  const setLifestyle = useOnboardingStore((s) => s.setLifestyle);

  const [ethnicities, setEthnicities] = useState<Set<string>>(new Set());
  const [education, setEducation] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [eyeColor, setEyeColor] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [drink, setDrink] = useState<Frequency>('Never');
  const [smoke, setSmoke] = useState<Frequency>('Never');
  const [cannabis, setCannabis] = useState<Frequency>('Never');
  const [drugs, setDrugs] = useState<DrugFreq>('Never');

  const toggleEthnicity = (e: string) => {
    setEthnicities((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e); else next.add(e);
      return next;
    });
  };

  const canContinue = ethnicities.size > 0 && education !== '';

  return (
    <View style={s.root}>
      <SafeAreaView>
        <NMHeader title="Step 7 of 8" left="Back" />
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heading}>
          <Text style={s.kicker}>Background & lifestyle</Text>
          <Text style={s.title}>A little more{'\n'}about you.</Text>
          <Text style={s.sub}>
            This helps with compatibility matching. You control exactly what's shown on your profile.
          </Text>
        </View>

        {/* Ethnicity */}
        <View style={s.card}>
          <SectionLabel>Ethnicity · select all that apply</SectionLabel>
          <View style={s.chipGrid}>
            {ETHNICITIES.map((e) => {
              const on = ethnicities.has(e);
              return (
                <TouchableOpacity
                  key={e}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => toggleEthnicity(e)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{e}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Education */}
        <View style={s.card}>
          <SectionLabel>Highest educational attainment</SectionLabel>
          <View style={s.educGrid}>
            {EDUCATION.map((ed) => {
              const on = education === ed.id;
              return (
                <TouchableOpacity
                  key={ed.id}
                  style={[s.educChip, on && s.educChipOn]}
                  onPress={() => setEducation(ed.id)}
                  activeOpacity={0.8}
                >
                  {on && <Ionicons name="checkmark" size={12} color={NM.cream} style={{ marginRight: 4 }} />}
                  <Text style={[s.educChipText, on && s.educChipTextOn]}>{ed.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Physical traits */}
        <View style={s.card}>
          <SectionLabel>Physical traits</SectionLabel>

          <Text style={s.traitLabel}>Hair colour</Text>
          <View style={s.chipGrid}>
            {HAIR_COLORS.map((h) => (
              <TouchableOpacity
                key={h}
                style={[s.chip, hairColor === h && s.chipOn]}
                onPress={() => setHairColor(h)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, hairColor === h && s.chipTextOn]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.divider} />

          <Text style={s.traitLabel}>Eye colour</Text>
          <View style={s.chipGrid}>
            {EYE_COLORS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[s.chip, eyeColor === e && s.chipOn]}
                onPress={() => setEyeColor(e)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, eyeColor === e && s.chipTextOn]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.divider} />

          <Text style={s.traitLabel}>Blood type</Text>
          <View style={s.chipGrid}>
            {BLOOD_TYPES.map((b) => (
              <TouchableOpacity
                key={b}
                style={[s.chip, bloodType === b && s.chipOn]}
                onPress={() => setBloodType(b)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, bloodType === b && s.chipTextOn]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lifestyle habits */}
        <View style={s.card}>
          <SectionLabel>Lifestyle habits</SectionLabel>
          <FreqRow label="Alcohol" options={FREQUENCIES} value={drink} onChange={(v) => setDrink(v as Frequency)} />
          <View style={s.divider} />
          <FreqRow label="Tobacco / smoking" options={FREQUENCIES} value={smoke} onChange={(v) => setSmoke(v as Frequency)} />
          <View style={s.divider} />
          <FreqRow label="Cannabis" options={FREQUENCIES} value={cannabis} onChange={(v) => setCannabis(v as Frequency)} />
          <View style={s.divider} />
          <FreqRow label="Recreational drugs" options={DRUG_OPTIONS} value={drugs} onChange={(v) => setDrugs(v as DrugFreq)} />
        </View>

        <View style={s.notice}>
          <Ionicons name="lock-closed-outline" size={14} color={NM.ink3} />
          <Text style={s.noticeText}>
            Lifestyle information is only shared with mutual matches and never used to restrict who can view your profile.
          </Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <NMBtn full onPress={() => {
          setLifestyle({
            ethnicity: Array.from(ethnicities).join(', '),
            education,
            hairColor,
            eyeColor,
            bloodType,
            alcoholFrequency: drink,
            smokingFrequency: smoke,
            drugFrequency: drugs,
          });
          router.push('/(onboarding)/profile-photo');
        }} disabled={!canContinue}>
          Continue
        </NMBtn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heading: { paddingHorizontal: 8, paddingBottom: 20, gap: 8 },
  kicker: { fontSize: 10, color: NM.lavenderDeep, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 30, lineHeight: 34, color: NM.ink, letterSpacing: -0.7, fontWeight: '600' },
  sub: { fontSize: 13, lineHeight: 19, color: NM.ink2 },
  card: {
    backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16,
    marginBottom: 12, ...NM.shadow.card,
  },
  sectionLabel: {
    fontSize: 9, color: NM.ink3, letterSpacing: 1.4, textTransform: 'uppercase',
    fontWeight: '600', marginBottom: 12,
  },
  traitLabel: { fontSize: 14, color: NM.ink, fontWeight: '500', marginBottom: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: NM.r.pill,
    backgroundColor: NM.cream2, borderWidth: 1.5, borderColor: NM.hair2,
  },
  chipOn: { backgroundColor: NM.lavenderDeep, borderColor: NM.lavenderDeep },
  chipText: { fontSize: 13, color: NM.ink2, fontWeight: '500' },
  chipTextOn: { color: NM.cream },
  educGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  educChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: NM.r.pill,
    backgroundColor: NM.cream2, borderWidth: 1.5, borderColor: NM.hair2,
  },
  educChipOn: { backgroundColor: NM.lavenderDeep, borderColor: NM.lavenderDeep },
  educChipText: { fontSize: 13, color: NM.ink2, fontWeight: '500' },
  educChipTextOn: { color: NM.cream },
  freqWrap: { gap: 8 },
  freqLabel: { fontSize: 14, color: NM.ink, fontWeight: '500' },
  freqBtns: { flexDirection: 'row', gap: 8 },
  freqChip: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    borderRadius: NM.r.lg, borderWidth: 1.5, borderColor: NM.hair2,
    backgroundColor: NM.cream2,
  },
  freqChipOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  freqChipText: { fontSize: 13, color: NM.ink2, fontWeight: '500' },
  freqChipTextOn: { color: NM.cream },
  divider: { height: 1, backgroundColor: NM.hair, marginVertical: 14 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: NM.cream2, borderRadius: NM.r.md, padding: 12, marginBottom: 8,
  },
  noticeText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 17 },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
