import React, { useState, useMemo } from 'react';
import { useOnboardingStore } from '@/store/onboardingStore';
import {
  View, Text, TextInput, TouchableOpacity, Modal, Pressable,
  ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NM } from '@/constants/tokens';
import NMBtn from '@/components/NMBtn';
import NMHeader from '@/components/NMHeader';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua & Barbuda','Argentina','Armenia',
  'Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus',
  'Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia & Herzegovina','Botswana','Brazil',
  'Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia',
  'Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
  'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru',
  'Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts & Nevis',
  'Saint Lucia','Saint Vincent & the Grenadines','Samoa','San Marino','Sao Tome & Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
  'Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka',
  'Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand',
  'Timor-Leste','Togo','Tonga','Trinidad & Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay',
  'Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

const PROFANE_WORDS = [
  'fuck','shit','ass','bitch','cunt','dick','cock','pussy','piss','bastard',
  'damn','hell','slut','whore','nigger','nigga','faggot','fag','retard','twat',
  'wank','wanker','bollocks','arse','arsehole','asshole','motherfucker','fucker',
  'fucking','bullshit','crap','prick','dildo','boob','tit','tits','penis','vagina',
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return PROFANE_WORDS.some((w) => lower.includes(w));
}

const MIN_DOB = new Date(1900, 0, 1);
const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
})();

function isAdult(date: Date): boolean {
  return date <= MAX_DOB;
}

function formatDOB(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m} / ${d} / ${y}`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function About() {
  const router = useRouter();
  const setAbout = useOnboardingStore((s) => s.setAbout);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [pickerDate, setPickerDate] = useState(MAX_DOB);
  const [showPicker, setShowPicker] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [alias, setAlias] = useState('');
  const [location, setLocation] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCountries = useMemo(
    () => COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch],
  );

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) {
        setDob(date);
        setPickerDate(date);
        setErrors((e) => ({
          ...e,
          dob: isAdult(date) ? undefined as any : 'You must be 18 or older to join Nestmakers.',
        }));
      }
    } else if (date) {
      setPickerDate(date);
    }
  };

  const confirmIOSPicker = () => {
    setDob(pickerDate);
    setErrors((e) => ({
      ...e,
      dob: isAdult(pickerDate) ? undefined as any : 'You must be 18 or older to join Nestmakers.',
    }));
    setShowPicker(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Please enter your first name.';
    if (!lastName.trim()) e.lastName = 'Please enter your last name.';
    if (anonymous && !alias.trim()) e.alias = 'Please enter an alias to display on your profile.';
    else if (anonymous && containsProfanity(alias)) e.alias = 'Your alias contains language that isn\'t allowed. Please choose something appropriate.';
    if (!dob) {
      e.dob = 'Please enter your date of birth.';
    } else if (!isAdult(dob)) {
      e.dob = 'You must be 18 or older to join Nestmakers.';
    }
    if (!location.trim()) e.location = 'Please enter your location.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    setAbout({
      firstName,
      lastName,
      isAnonymous: anonymous,
      displayName: alias,
      dateOfBirth: dob ? dob.toISOString().split('T')[0] : '',
      country: location,
    });
    router.push('/(onboarding)/role');
  };

  const signInLink = (
    <TouchableOpacity onPress={() => router.push('/(onboarding)/sign-in')}>
      <Text style={s.signInLink}>Sign in instead</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView>
          <NMHeader title="Step 2 of 8" right={signInLink} />
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.heading}>
            <Text style={s.title}>Tell us a bit{'\n'}about you.</Text>
            <Text style={s.sub}>This stays private until you choose to share it.</Text>
          </View>

          <View style={s.form}>
            {/* Name row */}
            <View style={s.nameRow}>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>First name</Text>
                <View style={[s.inputWrap, errors.firstName ? s.inputError : null]}>
                  <TextInput
                    style={s.input}
                    value={firstName}
                    onChangeText={(v) => { setFirstName(v); setErrors((e) => ({ ...e, firstName: undefined as any })); }}
                    placeholder="First"
                    placeholderTextColor={NM.ink3}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
                {errors.firstName ? <Text style={s.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Last name</Text>
                <View style={[s.inputWrap, errors.lastName ? s.inputError : null]}>
                  <TextInput
                    style={s.input}
                    value={lastName}
                    onChangeText={(v) => { setLastName(v); setErrors((e) => ({ ...e, lastName: undefined as any })); }}
                    placeholder="Last"
                    placeholderTextColor={NM.ink3}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {errors.lastName ? <Text style={s.errorText}>{errors.lastName}</Text> : null}
              </View>
            </View>

            {/* Anonymous toggle */}
            <TouchableOpacity
              style={s.toggleRow}
              onPress={() => setAnonymous((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={s.toggleInfo}>
                <Text style={s.toggleLabel}>Stay anonymous</Text>
                <Text style={s.toggleSub}>Your real name won't be shown on your profile</Text>
              </View>
              <View style={[s.toggle, anonymous && s.toggleOn]}>
                <View style={[s.toggleThumb, anonymous && s.toggleThumbOn]} />
              </View>
            </TouchableOpacity>

            {/* Alias field — shown only when anonymous */}
            {anonymous && (
              <Field label="Alias" error={errors.alias}>
                <View style={[s.inputWrap, errors.alias ? s.inputError : null]}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={errors.alias ? NM.danger : NM.ink3}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={s.input}
                    value={alias}
                    onChangeText={(v) => {
                      setAlias(v);
                      setErrors((e) => ({
                        ...e,
                        alias: containsProfanity(v)
                          ? 'Your alias contains language that isn\'t allowed. Please choose something appropriate.'
                          : undefined as any,
                      }));
                    }}
                    placeholder="e.g. Starling, J.M., NestSeeker42"
                    placeholderTextColor={NM.ink3}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </Field>
            )}

            {/* Date of birth */}
            <Field label="Date of birth" error={errors.dob}>
              <TouchableOpacity
                style={[s.inputWrap, errors.dob ? s.inputError : null]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={errors.dob ? NM.danger : NM.ink3}
                  style={s.inputIcon}
                />
                <Text style={[s.input, !dob && s.placeholder]}>
                  {dob ? formatDOB(dob) : 'MM / DD / YYYY'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={NM.ink3} />
              </TouchableOpacity>
              <View style={s.dobHint}>
                <Ionicons name="lock-closed-outline" size={12} color={NM.ink3} />
                <Text style={s.dobHintText}>You must be 18 or older. Age shown on your profile, not your full date.</Text>
              </View>

              {/* Android: inline picker */}
              {Platform.OS === 'android' && showPicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  minimumDate={MIN_DOB}
                  onChange={onPickerChange}
                />
              )}
            </Field>

            {/* Location */}
            <Field label="Country" error={errors.location}>
              <TouchableOpacity
                style={[s.inputWrap, errors.location ? s.inputError : null]}
                onPress={() => { setCountrySearch(''); setShowCountryPicker(true); }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={errors.location ? NM.danger : NM.ink3}
                  style={s.inputIcon}
                />
                <Text style={[s.input, !location && s.placeholder]}>
                  {location || 'Select your country'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={NM.ink3} />
              </TouchableOpacity>
            </Field>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <NMBtn
            full
            onPress={handleContinue}
            disabled={(dob !== null && !isAdult(dob)) || (anonymous && containsProfanity(alias))}
          >
            Continue
          </NMBtn>
        </View>
      </KeyboardAvoidingView>

      {/* Country picker */}
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => setShowCountryPicker(false)}>
        <Pressable style={s.overlay} onPress={() => setShowCountryPicker(false)} />
        <View style={[s.sheet, s.countrySheet]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
              <Text style={s.sheetCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.sheetTitle}>Select Country</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={16} color={NM.ink3} style={s.searchIcon} />
            <TextInput
              style={s.searchInput}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search countries…"
              placeholderTextColor={NM.ink3}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.countryRow, item === location && s.countryRowSelected]}
                onPress={() => {
                  setLocation(item);
                  setErrors((e) => ({ ...e, location: undefined as any }));
                  setShowCountryPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[s.countryLabel, item === location && s.countryLabelSelected]}>{item}</Text>
                {item === location && <Ionicons name="checkmark" size={16} color={NM.ink} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={s.separator} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>

      {/* iOS date picker bottom sheet */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <Pressable style={s.overlay} onPress={() => setShowPicker(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={s.sheetCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.sheetTitle}>Date of Birth</Text>
              <TouchableOpacity onPress={confirmIOSPicker}>
                <Text style={s.sheetDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              maximumDate={MAX_DOB}
              minimumDate={MIN_DOB}
              onChange={onPickerChange}
              style={s.picker}
              textColor={NM.ink}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  flex: { flex: 1 },
  signInLink: { fontSize: 14, color: NM.lavenderDeep, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  heading: { paddingHorizontal: 8, paddingBottom: 24, gap: 12 },
  title: { fontSize: 30, lineHeight: 34, color: NM.ink, letterSpacing: -0.7, fontWeight: '600' },
  sub: { fontSize: 14, lineHeight: 21, color: NM.ink2 },
  form: { paddingHorizontal: 8, gap: 20 },
  nameRow: { flexDirection: 'row', gap: 12 },
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
  placeholder: { color: NM.ink3 },
  errorText: { fontSize: 13, color: NM.danger, marginTop: 2 },
  dobHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  dobHintText: { fontSize: 12, color: NM.ink3, lineHeight: 17, flex: 1 },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
  // Toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: NM.r.lg,
    borderWidth: 1.5, borderColor: NM.hair2,
    paddingHorizontal: 16, paddingVertical: 14,
    ...NM.shadow.soft,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: NM.ink },
  toggleSub: { fontSize: 12, color: NM.ink3, marginTop: 2, lineHeight: 16 },
  toggle: {
    width: 46, height: 26, borderRadius: 13,
    backgroundColor: NM.hair2,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: NM.lavenderDeep },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff',
    ...NM.shadow.soft,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  // Sheet (date picker + country picker)
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: NM.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: NM.hair2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: NM.hair,
  },
  sheetTitle: { fontSize: 15, fontWeight: '600', color: NM.ink },
  sheetCancel: { fontSize: 15, color: NM.ink3 },
  sheetDone: { fontSize: 15, fontWeight: '600', color: NM.lavenderDeep },
  picker: { width: '100%', backgroundColor: NM.cream },
  countrySheet: { maxHeight: '80%', flex: 0 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: NM.cream, borderRadius: NM.r.lg,
    borderWidth: 1.5, borderColor: NM.hair2,
    paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: NM.ink },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  countryRowSelected: { backgroundColor: NM.cream },
  countryLabel: { fontSize: 16, color: NM.ink },
  countryLabelSelected: { fontWeight: '600' },
  separator: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
});
