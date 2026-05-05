import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Pressable, FlatList,
  Platform, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { NM } from '@/constants/tokens';
import { useAuthStore } from '@/store/authStore';
import { uploadFileFromBase64 } from '@/lib/uploadFile';
import { supabase } from '@/lib/supabase';
import { ProfilePrompt, InsemPref, InvolvementLevel, GiverType, INSEM_LABELS, INVOLVEMENT_LABELS } from '@/types/database';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_PHOTOS = 5;
const PHOTO_GAP = 8;
const PHOTO_COLS = 3;
const SCREEN_W = Dimensions.get('window').width;
const SLOT_SIZE = (SCREEN_W - 32 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;
type PhotoSlot = { localUri: string; url: string | null; uploading: boolean };

const MAX_BIO = 200;
const MAX_ANSWER = 160;

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

const EDUCATION_OPTIONS = [
  'High school','Trade / vocational',"Associate's","Bachelor's","Master's",'PhD / Doctorate','Other',
];
const HAIR_OPTIONS = ['Black','Dark brown','Brown','Light brown','Blonde','Red','Auburn','Grey','White','Other'];
const EYE_OPTIONS = ['Brown','Blue','Green','Hazel','Grey','Amber','Other'];
const BLOOD_OPTIONS = ['A+','A−','B+','B−','AB+','AB−','O+','O−'];

const GIVER_TYPES = [
  { id: 'egg',    label: 'Egg',    icon: 'ellipse-outline',  desc: 'Egg donation',                    swatch: NM.peach    },
  { id: 'sperm',  label: 'Sperm',  icon: 'water-outline',    desc: 'Sperm donation',                  swatch: NM.lavender },
  { id: 'womb',   label: 'Womb',   icon: 'heart-outline',    desc: 'Surrogacy / gestational carrier', swatch: NM.sage     },
  { id: 'embryo', label: 'Embryo', icon: 'sparkles-outline', desc: 'Embryo donation',                 swatch: NM.butter   },
];

const CONFLICTS: Record<string, { blocks: string[]; reason: string }> = {
  egg:   { blocks: ['sperm'],       reason: 'Egg and sperm donations are biologically exclusive.' },
  sperm: { blocks: ['egg', 'womb'], reason: 'Sperm donors and egg donors / surrogates have incompatible biological roles.' },
  womb:  { blocks: ['sperm'],       reason: 'Surrogates carry a pregnancy — incompatible with sperm donation.' },
};

type Tone = 'lavender' | 'peach' | 'butter' | 'sage';
const PROMPT_OPTIONS: { id: string; kicker: string; tone: Tone }[] = [
  { id: 'reason', kicker: 'My reason for doing this is…',             tone: 'lavender' },
  { id: 'family', kicker: 'The kind of family I hope to help build…', tone: 'peach'    },
  { id: 'know',   kicker: 'Something I want you to know…',            tone: 'butter'   },
  { id: 'proud',  kicker: "Something I'm proud of…",                  tone: 'sage'     },
  { id: 'values', kicker: 'A value I live by…',                       tone: 'lavender' },
  { id: 'free',   kicker: "On a free afternoon you'll find me…",      tone: 'peach'    },
  { id: 'deal',   kicker: 'A non-negotiable for me…',                 tone: 'butter'   },
  { id: 'hope',   kicker: 'My hope for this journey…',                tone: 'sage'     },
];
const TONE_BG: Record<Tone, string> = { lavender: NM.lavenderSoft, peach: NM.peachSoft, butter: NM.butterSoft, sage: NM.sageSoft };
const TONE_FG: Record<Tone, string> = { lavender: NM.lavenderDeep, peach: NM.peachDeep, butter: NM.gold, sage: '#6B8E56' };

const PROFANE = ['fuck','shit','ass','bitch','cunt','dick','cock','pussy','piss','bastard','damn','hell','slut','whore','nigger','nigga','faggot','fag','retard','twat','wank','wanker','bollocks','arse','arsehole','asshole','motherfucker','fucker','fucking','bullshit','crap','prick'];
function hasProfanity(t: string) { const l = t.toLowerCase().replace(/[^a-z0-9]/g, ''); return PROFANE.some(w => l.includes(w)); }

const MAX_DOB = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })();
const MIN_DOB = new Date(1900, 0, 1);
function isAdult(d: Date) { return d <= MAX_DOB; }
function formatDOB(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, '0')} / ${String(d.getDate()).padStart(2, '0')} / ${d.getFullYear()}`;
}

// ─── Small picker modal ───────────────────────────────────────────────────────
function OptionPicker({
  visible, title, options, value, onSelect, onClose,
}: {
  visible: boolean; title: string; options: string[]; value: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={[s.sheet, { maxHeight: '60%' }]}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.sheetCancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.sheetTitle}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>
        <FlatList
          data={options}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.countryRow, item === value && s.countryRowSelected]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[s.countryLabel, item === value && s.countryLabelSelected]}>{item}</Text>
              {item === value && <Ionicons name="checkmark" size={16} color={NM.ink} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </Modal>
  );
}

// ─── Prompt card ──────────────────────────────────────────────────────────────
function PromptCard({
  prompt, answer, onChange, onRemove,
}: {
  prompt: typeof PROMPT_OPTIONS[number]; answer: string;
  onChange: (v: string) => void; onRemove: () => void;
}) {
  const bg = TONE_BG[prompt.tone];
  const fg = TONE_FG[prompt.tone];
  return (
    <View style={[pc.wrap, { backgroundColor: bg }]}>
      <View style={pc.header}>
        <Text style={[pc.kicker, { color: fg }]}>{prompt.kicker}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={fg} style={{ opacity: 0.6 }} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={pc.input}
        value={answer}
        onChangeText={onChange}
        placeholder="Write your answer…"
        placeholderTextColor={NM.ink3}
        multiline
        maxLength={MAX_ANSWER}
        scrollEnabled={false}
      />
      <Text style={pc.counter}>{answer.length}/{MAX_ANSWER}</Text>
    </View>
  );
}
const pc = StyleSheet.create({
  wrap:   { borderRadius: NM.r.xl, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  kicker: { flex: 1, fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingRight: 8 },
  input:  { fontSize: 17, lineHeight: 24, color: NM.ink, letterSpacing: -0.2, minHeight: 60 },
  counter:{ fontSize: 10, color: NM.ink3, textAlign: 'right', marginTop: 6 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, setProfile } = useAuthStore();

  // Photos
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([]);
  useEffect(() => {
    const urls = profile?.profile_photo_urls?.length
      ? profile.profile_photo_urls
      : profile?.profile_photo_url
        ? [profile.profile_photo_url]
        : [];
    setPhotoSlots(urls.map(u => ({ localUri: u, url: u, uploading: false })));
  }, []);

  // Personal info
  const parsedDob = profile?.date_of_birth ? new Date(profile.date_of_birth) : null;
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName,  setLastName]  = useState(profile?.last_name ?? '');
  const [anonymous, setAnonymous] = useState(profile?.is_anonymous ?? false);
  const [alias,     setAlias]     = useState(profile?.display_name ?? '');
  const [dob,       setDob]       = useState<Date | null>(parsedDob);
  const [pickerDate, setPickerDate] = useState(parsedDob ?? MAX_DOB);
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Role (seeker / giver / both)
  const [userRole, setUserRole] = useState<'seeker' | 'giver' | 'both'>(
    (profile?.role as 'seeker' | 'giver' | 'both') ?? 'giver',
  );

  // Giver types
  const [selectedGiverTypes, setSelectedGiverTypes] = useState<Set<string>>(
    new Set(profile?.giver_types ?? []),
  );
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  // Core preferences
  const [insemPref,    setInsemPref]    = useState<InsemPref | null>(profile?.insemination_preference ?? null);
  const [involvLevel,  setInvolvLevel]  = useState<InvolvementLevel | null>(profile?.involvement_level ?? null);

  // Bio & prompts
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [activePrompts, setActivePrompts] = useState<{ id: string; answer: string }[]>(
    () => (profile?.prompts ?? []).map(p => ({ id: p.id, answer: p.answer })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  // Basics
  const [country,    setCountry]    = useState(profile?.country ?? '');
  const [ethnicity,  setEthnicity]  = useState(profile?.ethnicity ?? '');
  const [education,  setEducation]  = useState(profile?.education ?? '');
  const [hairColor,  setHairColor]  = useState(profile?.hair_color ?? '');
  const [eyeColor,   setEyeColor]   = useState(profile?.eye_color ?? '');
  const [bloodType,  setBloodType]  = useState(profile?.blood_type ?? '');

  // Picker modals
  const [showCountryPicker,  setShowCountryPicker]  = useState(false);
  const [showEducationPicker,setShowEducationPicker] = useState(false);
  const [showHairPicker,     setShowHairPicker]      = useState(false);
  const [showEyePicker,      setShowEyePicker]       = useState(false);
  const [showBloodPicker,    setShowBloodPicker]     = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const filteredCountries = useMemo(
    () => COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch],
  );

  // Saving
  const [saving, setSaving] = useState(false);
  const anyPhotoUploading = photoSlots.some(s => s.uploading);
  const canAddMorePhotos  = photoSlots.length < MAX_PHOTOS;
  const allPhotoSlots     = [...photoSlots, ...(canAddMorePhotos ? [null] : [])];

  // ── Date picker ────────────────────────────────────────────────────────────
  const onPickerChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (date) { setDob(date); setPickerDate(date); }
    } else if (date) { setPickerDate(date); }
  };
  const confirmIOSPicker = () => { setDob(pickerDate); setShowPicker(false); };

  // ── Giver type toggle ──────────────────────────────────────────────────────
  const toggleGiverType = (id: string) => {
    if (selectedGiverTypes.has(id)) {
      setBlockedMsg(null);
      setSelectedGiverTypes(prev => { const n = new Set(prev); n.delete(id); return n; });
      return;
    }
    const conflict = CONFLICTS[id];
    if (conflict?.blocks.some(b => selectedGiverTypes.has(b))) { setBlockedMsg(conflict.reason); return; }
    for (const sel of selectedGiverTypes) {
      if (CONFLICTS[sel]?.blocks.includes(id)) { setBlockedMsg(CONFLICTS[sel].reason); return; }
    }
    setBlockedMsg(null);
    setSelectedGiverTypes(prev => { const n = new Set(prev); n.add(id); return n; });
  };

  // ── Prompt handlers ────────────────────────────────────────────────────────
  const usedIds  = new Set(activePrompts.map(p => p.id));
  const available = PROMPT_OPTIONS.filter(p => !usedIds.has(p.id));
  const addPrompt = (id: string) => {
    if (activePrompts.length >= 3) { Alert.alert('Limit reached', 'You can show up to 3 prompts.'); return; }
    setActivePrompts(prev => [...prev, { id, answer: '' }]);
    setPickerOpen(false);
  };
  const removePrompt = (id: string) => setActivePrompts(prev => prev.filter(p => p.id !== id));
  const updateAnswer = (id: string, text: string) =>
    setActivePrompts(prev => prev.map(p => p.id === id ? { ...p, answer: text } : p));

  // ── Photo helpers ──────────────────────────────────────────────────────────
  const pickPhoto = async (fromCamera: boolean, slotIndex: number) => {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Allow camera access in Settings.'); return; }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Allow photo library access in Settings.'); return; }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
    if (result.canceled || !result.assets[0]?.base64) return;
    const { uri, base64, mimeType } = result.assets[0];
    const isNew = slotIndex === photoSlots.length;
    const uploading: PhotoSlot = { localUri: uri, url: null, uploading: true };
    setPhotoSlots(prev => { const n = [...prev]; if (isNew) n.push(uploading); else n[slotIndex] = uploading; return n; });
    try {
      const userId = session?.user?.id ?? 'unknown';
      const ct = mimeType ?? 'image/jpeg';
      const ext = ct.split('/')[1] ?? 'jpg';
      const url = await uploadFileFromBase64('profile-photos', `${userId}/photo-${Date.now()}.${ext}`, base64, ct);
      setPhotoSlots(prev => {
        const n = [...prev];
        const idx = n.findIndex(sl => sl.localUri === uri && sl.uploading);
        if (idx !== -1) n[idx] = { localUri: uri, url, uploading: false };
        return n;
      });
    } catch (e: any) {
      setPhotoSlots(prev => prev.filter(sl => !(sl.localUri === uri && sl.uploading)));
      Alert.alert('Upload failed', e.message);
    }
  };

  const handlePhotoSlotPress = (index: number) => {
    const slot = photoSlots[index];
    if (slot?.uploading) return;
    if (slot?.localUri) {
      Alert.alert('Photo options', undefined, [
        { text: 'Replace from library', onPress: () => pickPhoto(false, index) },
        { text: 'Replace with camera',  onPress: () => pickPhoto(true, index) },
        { text: 'Remove', style: 'destructive', onPress: () => setPhotoSlots(prev => prev.filter((_, i) => i !== index)) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Add photo', undefined, [
        { text: 'Upload from library', onPress: () => pickPhoto(false, index) },
        { text: 'Take a photo',        onPress: () => pickPhoto(true, index) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (anyPhotoUploading) { Alert.alert('Please wait', 'Photos are still uploading.'); return; }
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim())  e.lastName  = 'Required';
    if (anonymous && !alias.trim()) e.alias = 'Please enter an alias.';
    if (anonymous && hasProfanity(alias)) e.alias = "Your alias contains language that isn't allowed.";
    if (!dob) e.dob = 'Required';
    else if (!isAdult(dob)) e.dob = 'You must be 18 or older.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    const userId = session?.user?.id;
    if (!userId) { setSaving(false); return; }

    const savedUrls = photoSlots.filter(sl => sl.url).map(sl => sl.url!);
    const newPhotoUrl = savedUrls[0] ?? profile?.profile_photo_url ?? null;

    const promptsToSave: ProfilePrompt[] = activePrompts
      .filter(p => p.answer.trim())
      .map(p => {
        const meta = PROMPT_OPTIONS.find(o => o.id === p.id)!;
        return { id: p.id, kicker: meta.kicker, answer: p.answer.trim(), tone: meta.tone };
      });

    const updates = {
      first_name:    firstName.trim(),
      last_name:     lastName.trim(),
      is_anonymous:  anonymous,
      display_name:  anonymous ? alias.trim() : null,
      date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
      country:       country || null,
      role:          userRole,
      giver_types:              [...selectedGiverTypes] as GiverType[],
      insemination_preference:  insemPref,
      involvement_level:        involvLevel,
      bio:                      bio.trim() || null,
      prompts:       promptsToSave,
      ethnicity:     ethnicity.trim() || null,
      education:     education || null,
      hair_color:    hairColor || null,
      eye_color:     eyeColor || null,
      blood_type:    bloodType || null,
      profile_photo_url:  newPhotoUrl,
      profile_photo_urls: savedUrls,
    };

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) {
      Alert.alert('Save failed', error.message);
      setSaving(false);
      return;
    }
    if (profile) setProfile({ ...profile, ...updates });
    setSaving(false);
    router.back();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={NM.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[s.saveBtn, (saving || anyPhotoUploading) && { opacity: 0.5 }]}
          disabled={saving || anyPhotoUploading}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {/* ── Photos ─────────────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Photos</Text>
        <Text style={[s.sectionSub, { marginBottom: 12 }]}>Up to 5 photos. First photo is your main profile picture.</Text>
        <View style={s.photoGrid}>
          {allPhotoSlots.map((slot, i) => {
            const isAdd   = slot === null;
            const isFirst = i === 0;
            return (
              <TouchableOpacity
                key={i}
                style={[s.photoSlot, isFirst && s.photoSlotPrimary]}
                onPress={() => isAdd ? handlePhotoSlotPress(photoSlots.length) : handlePhotoSlotPress(i)}
                activeOpacity={0.8}
                disabled={slot?.uploading}
              >
                {isAdd ? (
                  <View style={s.photoSlotEmpty}>
                    <Ionicons name="add" size={28} color={NM.ink3} />
                  </View>
                ) : slot!.uploading ? (
                  <View style={s.photoSlotEmpty}>
                    <ActivityIndicator color={NM.lavenderDeep} />
                  </View>
                ) : (
                  <View style={s.photoSlotFilled}>
                    <Image source={{ uri: slot!.localUri }} style={s.photoSlotImage} resizeMode="cover" />
                    {isFirst && <View style={s.photoPrimaryBadge}><Text style={s.photoPrimaryBadgeText}>Main</Text></View>}
                    <TouchableOpacity style={s.photoRemoveBtn} onPress={() => setPhotoSlots(prev => prev.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={s.photoCountHint}>{photoSlots.length} of {MAX_PHOTOS} photos added</Text>

        {/* ── Personal information ────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Personal information</Text>
        <View style={s.card}>
          <View style={s.nameRow}>
            <View style={s.nameField}>
              <Text style={s.fieldLabel}>First name</Text>
              <View style={[s.inputWrap, errors.firstName && s.inputError]}>
                <TextInput style={s.input} value={firstName} onChangeText={v => { setFirstName(v); setErrors(e => ({ ...e, firstName: undefined as any })); }} placeholder="First" placeholderTextColor={NM.ink3} autoCapitalize="words" autoCorrect={false} />
              </View>
              {errors.firstName ? <Text style={s.errorText}>{errors.firstName}</Text> : null}
            </View>
            <View style={s.nameField}>
              <Text style={s.fieldLabel}>Last name</Text>
              <View style={[s.inputWrap, errors.lastName && s.inputError]}>
                <TextInput style={s.input} value={lastName} onChangeText={v => { setLastName(v); setErrors(e => ({ ...e, lastName: undefined as any })); }} placeholder="Last" placeholderTextColor={NM.ink3} autoCapitalize="words" autoCorrect={false} />
              </View>
              {errors.lastName ? <Text style={s.errorText}>{errors.lastName}</Text> : null}
            </View>
          </View>

          <View style={s.divider} />

          <TouchableOpacity style={s.toggleRow} onPress={() => setAnonymous(v => !v)} activeOpacity={0.8}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Stay anonymous</Text>
              <Text style={s.toggleSub}>Your real name won't be shown on your profile</Text>
            </View>
            <View style={[s.toggle, anonymous && s.toggleOn]}>
              <View style={[s.toggleThumb, anonymous && s.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {anonymous && (
            <>
              <View style={s.divider} />
              <Text style={s.fieldLabel}>Alias</Text>
              <View style={[s.inputWrap, errors.alias && s.inputError, { marginTop: 8 }]}>
                <Ionicons name="at-outline" size={18} color={errors.alias ? NM.danger : NM.ink3} style={s.inputIcon} />
                <TextInput style={s.input} value={alias} onChangeText={v => { setAlias(v); setErrors(e => ({ ...e, alias: hasProfanity(v) ? "Your alias contains language that isn't allowed." : undefined as any })); }} placeholder="e.g. Starling, J.M., NestSeeker42" placeholderTextColor={NM.ink3} autoCorrect={false} />
              </View>
              {errors.alias ? <Text style={s.errorText}>{errors.alias}</Text> : null}
            </>
          )}

          <View style={s.divider} />

          <Text style={s.fieldLabel}>Date of birth</Text>
          <TouchableOpacity style={[s.inputWrap, errors.dob && s.inputError, { marginTop: 8 }]} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={18} color={errors.dob ? NM.danger : NM.ink3} style={s.inputIcon} />
            <Text style={[s.input, !dob && s.placeholder]}>{dob ? formatDOB(dob) : 'MM / DD / YYYY'}</Text>
            <Ionicons name="chevron-down" size={16} color={NM.ink3} />
          </TouchableOpacity>
          {errors.dob ? <Text style={s.errorText}>{errors.dob}</Text> : null}
          {Platform.OS === 'android' && showPicker && (
            <DateTimePicker value={pickerDate} mode="date" display="default" maximumDate={MAX_DOB} minimumDate={MIN_DOB} onChange={onPickerChange} />
          )}
        </View>

        {/* ── Your role ───────────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Your role</Text>
        <Text style={[s.sectionSub, { marginBottom: 12 }]}>Are you looking to give, receive, or open to both?</Text>
        <View style={s.segmented}>
          {(['giver', 'seeker', 'both'] as const).map(r => (
            <TouchableOpacity
              key={r}
              style={[s.segment, userRole === r && s.segmentActive]}
              onPress={() => setUserRole(r)}
              activeOpacity={0.8}
            >
              <Text style={[s.segmentText, userRole === r && s.segmentTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── What can you give? ──────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>
          {userRole === 'seeker' ? 'What do you have?' : 'What can you give?'}
        </Text>
        {userRole === 'seeker' && (
          <Text style={[s.sectionSub, { marginBottom: 12 }]}>Help us match you better by sharing what you have.</Text>
        )}
        {errors.role ? <Text style={[s.errorText, { marginBottom: 8 }]}>{errors.role}</Text> : null}
        {blockedMsg && (
          <View style={s.blockedBanner}>
            <Ionicons name="ban-outline" size={14} color="#c0392b" />
            <Text style={s.blockedText}>{blockedMsg}</Text>
          </View>
        )}
        <View style={s.roleCards}>
          {GIVER_TYPES.map(opt => {
            const on = selectedGiverTypes.has(opt.id);
            const isBlocked = !on && (() => {
              if (CONFLICTS[opt.id]?.blocks.some(b => selectedGiverTypes.has(b))) return true;
              for (const sel of selectedGiverTypes) { if (CONFLICTS[sel]?.blocks.includes(opt.id)) return true; }
              return false;
            })();
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.roleCard, on && s.roleCardOn, isBlocked && s.roleCardBlocked]}
                onPress={() => toggleGiverType(opt.id)}
                activeOpacity={0.85}
              >
                <View style={[s.roleIcon, { backgroundColor: opt.swatch, opacity: isBlocked ? 0.4 : 1 }]}>
                  <View style={s.roleIconShine} />
                  <Ionicons name={opt.icon as any} size={22} color="#fff" />
                </View>
                <View style={s.roleBody}>
                  <Text style={[s.roleTitle, isBlocked && s.textDim]}>{opt.label}</Text>
                  <Text style={[s.roleDesc, isBlocked && s.textDim]}>{opt.desc}</Text>
                </View>
                <View style={[s.check, on && s.checkOn]}>
                  {on && <Ionicons name="checkmark" size={13} color={NM.cream} />}
                  {isBlocked && <Ionicons name="ban-outline" size={13} color={NM.hair2} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Core preferences ────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Core preferences</Text>

        <Text style={s.prefGroupLabel}>Insemination preference</Text>
        <View style={s.prefRow}>
          {(['ai', 'ni', 'both'] as InsemPref[]).map(v => (
            <TouchableOpacity
              key={v}
              style={[s.prefChip, insemPref === v && s.prefChipActive]}
              onPress={() => setInsemPref(prev => prev === v ? null : v)}
              activeOpacity={0.8}
            >
              <Text style={[s.prefChipText, insemPref === v && s.prefChipTextActive]}>
                {INSEM_LABELS[v]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.prefGroupLabel, { marginTop: 16 }]}>Involvement level</Text>
        <View style={s.involvCards}>
          {(Object.entries(INVOLVEMENT_LABELS) as [InvolvementLevel, string][]).map(([v, label]) => {
            const active = involvLevel === v;
            return (
              <TouchableOpacity
                key={v}
                style={[s.involvCard, active && s.involvCardActive]}
                onPress={() => setInvolvLevel(prev => prev === v ? null : v)}
                activeOpacity={0.8}
              >
                <View style={[s.involvCheck, active && s.involvCheckActive]}>
                  {active && <Ionicons name="checkmark" size={12} color={NM.cream} />}
                </View>
                <Text style={[s.involvLabel, active && s.involvLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Bio</Text>
        <View style={s.card}>
          <Text style={s.sectionSub}>A short introduction shown on your profile card.</Text>
          <TextInput
            style={s.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people a little about yourself and what brings you here…"
            placeholderTextColor={NM.ink3}
            multiline
            maxLength={MAX_BIO}
            scrollEnabled={false}
          />
          <Text style={s.bioCounter}>{bio.length}/{MAX_BIO}</Text>
        </View>

        {/* ── Prompts ─────────────────────────────────────────────────────── */}
        <View style={s.promptsHeader}>
          <Text style={s.sectionHeading}>Prompts</Text>
          <View style={s.promptCount}>
            <Text style={s.promptCountText}>{activePrompts.length}/3</Text>
          </View>
        </View>
        <Text style={[s.sectionSub, { marginBottom: 12 }]}>Up to 3 prompts appear on your browse card and full profile.</Text>

        {activePrompts.map(({ id, answer }) => {
          const prompt = PROMPT_OPTIONS.find(p => p.id === id)!;
          return (
            <PromptCard
              key={id}
              prompt={prompt}
              answer={answer}
              onChange={v => updateAnswer(id, v)}
              onRemove={() => removePrompt(id)}
            />
          );
        })}

        {activePrompts.length < 3 && (
          <TouchableOpacity style={s.addPromptBtn} onPress={() => setPickerOpen(v => !v)} activeOpacity={0.8}>
            <Ionicons name={pickerOpen ? 'chevron-up' : 'add'} size={18} color={NM.lavenderDeep} />
            <Text style={s.addPromptText}>{pickerOpen ? 'Close' : 'Add a prompt'}</Text>
          </TouchableOpacity>
        )}

        {pickerOpen && (
          <View style={s.pickerCard}>
            <Text style={s.pickerLabel}>Choose a question</Text>
            {available.map(p => (
              <TouchableOpacity key={p.id} style={s.pickerRow} onPress={() => addPrompt(p.id)} activeOpacity={0.7}>
                <View style={[s.pickerDot, { backgroundColor: TONE_BG[p.tone] }]} />
                <Text style={s.pickerRowText}>{p.kicker}</Text>
                <Ionicons name="add-circle-outline" size={18} color={NM.ink3} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Basics ──────────────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Basics</Text>
        <View style={s.card}>

          {/* Country */}
          <Text style={s.fieldLabel}>Country</Text>
          <TouchableOpacity style={[s.inputWrap, { marginTop: 6, marginBottom: 14 }]} onPress={() => { setCountrySearch(''); setShowCountryPicker(true); }} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={18} color={NM.ink3} style={s.inputIcon} />
            <Text style={[s.input, !country && s.placeholder]}>{country || 'Select your country'}</Text>
            <Ionicons name="chevron-down" size={16} color={NM.ink3} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Ethnicity */}
          <Text style={s.fieldLabel}>Ethnicity</Text>
          <View style={[s.inputWrap, { marginTop: 6, marginBottom: 14 }]}>
            <TextInput style={s.input} value={ethnicity} onChangeText={setEthnicity} placeholder="e.g. East Asian, White, Mixed…" placeholderTextColor={NM.ink3} autoCorrect={false} />
          </View>

          <View style={s.divider} />

          {/* Education */}
          <Text style={s.fieldLabel}>Education</Text>
          <TouchableOpacity style={[s.inputWrap, { marginTop: 6, marginBottom: 14 }]} onPress={() => setShowEducationPicker(true)} activeOpacity={0.7}>
            <Ionicons name="school-outline" size={18} color={NM.ink3} style={s.inputIcon} />
            <Text style={[s.input, !education && s.placeholder]}>{education || 'Select education level'}</Text>
            <Ionicons name="chevron-down" size={16} color={NM.ink3} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Hair + Eye in a row */}
          <View style={s.nameRow}>
            <View style={s.nameField}>
              <Text style={s.fieldLabel}>Hair colour</Text>
              <TouchableOpacity style={[s.inputWrap, { marginTop: 6 }]} onPress={() => setShowHairPicker(true)} activeOpacity={0.7}>
                <Text style={[s.input, !hairColor && s.placeholder]}>{hairColor || 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={NM.ink3} />
              </TouchableOpacity>
            </View>
            <View style={s.nameField}>
              <Text style={s.fieldLabel}>Eye colour</Text>
              <TouchableOpacity style={[s.inputWrap, { marginTop: 6 }]} onPress={() => setShowEyePicker(true)} activeOpacity={0.7}>
                <Text style={[s.input, !eyeColor && s.placeholder]}>{eyeColor || 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={NM.ink3} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[s.divider, { marginTop: 14 }]} />

          {/* Blood type */}
          <Text style={s.fieldLabel}>Blood type</Text>
          <TouchableOpacity style={[s.inputWrap, { marginTop: 6 }]} onPress={() => setShowBloodPicker(true)} activeOpacity={0.7}>
            <Ionicons name="water-outline" size={18} color={NM.ink3} style={s.inputIcon} />
            <Text style={[s.input, !bloodType && s.placeholder]}>{bloodType || 'Select blood type'}</Text>
            <Ionicons name="chevron-down" size={16} color={NM.ink3} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Country picker modal ──────────────────────────────────────────── */}
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => setShowCountryPicker(false)}>
        <Pressable style={s.overlay} onPress={() => setShowCountryPicker(false)} />
        <View style={[s.sheet, s.countrySheet]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)}><Text style={s.sheetCancel}>Cancel</Text></TouchableOpacity>
            <Text style={s.sheetTitle}>Select Country</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={16} color={NM.ink3} style={s.searchIcon} />
            <TextInput style={s.searchInput} value={countrySearch} onChangeText={setCountrySearch} placeholder="Search countries…" placeholderTextColor={NM.ink3} autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={i => i}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={[s.countryRow, item === country && s.countryRowSelected]} onPress={() => { setCountry(item); setShowCountryPicker(false); }} activeOpacity={0.7}>
                <Text style={[s.countryLabel, item === country && s.countryLabelSelected]}>{item}</Text>
                {item === country && <Ionicons name="checkmark" size={16} color={NM.ink} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={s.separator} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>

      {/* ── Option pickers ────────────────────────────────────────────────── */}
      <OptionPicker visible={showEducationPicker} title="Education" options={EDUCATION_OPTIONS} value={education} onSelect={setEducation} onClose={() => setShowEducationPicker(false)} />
      <OptionPicker visible={showHairPicker}      title="Hair colour" options={HAIR_OPTIONS}      value={hairColor}  onSelect={setHairColor}  onClose={() => setShowHairPicker(false)} />
      <OptionPicker visible={showEyePicker}       title="Eye colour"  options={EYE_OPTIONS}       value={eyeColor}   onSelect={setEyeColor}   onClose={() => setShowEyePicker(false)} />
      <OptionPicker visible={showBloodPicker}     title="Blood type"  options={BLOOD_OPTIONS}     value={bloodType}  onSelect={setBloodType}  onClose={() => setShowBloodPicker(false)} />

      {/* ── iOS date picker ───────────────────────────────────────────────── */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <Pressable style={s.overlay} onPress={() => setShowPicker(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={s.sheetCancel}>Cancel</Text></TouchableOpacity>
              <Text style={s.sheetTitle}>Date of Birth</Text>
              <TouchableOpacity onPress={confirmIOSPicker}><Text style={s.sheetDone}>Done</Text></TouchableOpacity>
            </View>
            <DateTimePicker value={pickerDate} mode="date" display="spinner" maximumDate={MAX_DOB} minimumDate={MIN_DOB} onChange={onPickerChange} style={s.picker} textColor={NM.ink} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: NM.cream },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: NM.ink, letterSpacing: -0.3, textAlign: 'center' },
  saveBtn: { backgroundColor: NM.lavenderDeep, borderRadius: NM.r.pill, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeading: { fontSize: 13, fontWeight: '700', color: NM.ink, letterSpacing: -0.1, marginBottom: 10, marginTop: 4 },
  sectionSub: { fontSize: 12, color: NM.ink3, lineHeight: 17 },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GAP, marginBottom: 8 },
  photoSlot: { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: NM.r.lg, overflow: 'hidden' },
  photoSlotPrimary: { width: SLOT_SIZE * 2 + PHOTO_GAP, height: SLOT_SIZE * 2 + PHOTO_GAP },
  photoSlotEmpty: { flex: 1, backgroundColor: NM.cream2, borderWidth: 2, borderColor: NM.hair2, borderStyle: 'dashed', borderRadius: NM.r.lg, alignItems: 'center', justifyContent: 'center' },
  photoSlotFilled: { ...StyleSheet.absoluteFillObject },
  photoSlotImage: { width: '100%', height: '100%' },
  photoPrimaryBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  photoPrimaryBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  photoRemoveBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10 },
  photoCountHint: { fontSize: 12, color: NM.ink3, textAlign: 'center', marginBottom: 16 },

  // Cards & inputs
  card: { backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16, marginBottom: 16, ...NM.shadow.card },
  divider: { height: 1, backgroundColor: NM.hair, marginVertical: 14 },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameField: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: NM.ink2, letterSpacing: 0.1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: NM.cream2, borderRadius: NM.r.md, borderWidth: 1.5, borderColor: NM.hair2, paddingHorizontal: 12, height: 48 },
  inputError: { borderColor: NM.danger, backgroundColor: NM.dangerSoft },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: NM.ink },
  placeholder: { color: NM.ink3 },
  errorText: { fontSize: 12, color: NM.danger, marginTop: 4 },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: NM.ink },
  toggleSub: { fontSize: 12, color: NM.ink3, marginTop: 2, lineHeight: 16 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: NM.hair2, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: NM.lavenderDeep },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...NM.shadow.soft },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Segmented role control
  segmented: { flexDirection: 'row', backgroundColor: NM.cream2, borderRadius: NM.r.lg, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: NM.hair2 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: NM.r.md, alignItems: 'center' },
  segmentActive: { backgroundColor: '#fff', ...NM.shadow.soft },
  segmentText: { fontSize: 14, color: NM.ink3, fontWeight: '500' },
  segmentTextActive: { color: NM.ink, fontWeight: '700' },

  // Role cards
  roleCards: { gap: 10, marginBottom: 16 },
  roleCard: { backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: NM.hair },
  roleCardOn: { borderColor: NM.ink, ...NM.shadow.card },
  roleCardBlocked: { opacity: 0.5, borderColor: NM.hair },
  roleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  roleIconShine: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 14 },
  roleBody: { flex: 1 },
  roleTitle: { fontSize: 20, color: NM.ink, letterSpacing: -0.3, fontWeight: '400' },
  roleDesc:  { fontSize: 13, color: NM.ink2, marginTop: 2 },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: NM.hair2, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: NM.ink, borderColor: NM.ink },
  textDim: { color: NM.ink3 },
  blockedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fff0ee', borderRadius: NM.r.md, borderWidth: 1, borderColor: '#f5c6c0', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  blockedText: { flex: 1, fontSize: 13, color: '#8b2e24', lineHeight: 18 },

  // Core preferences
  prefGroupLabel: { fontSize: 12, fontWeight: '600', color: NM.ink2, letterSpacing: 0.1, marginBottom: 10 },
  prefRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  prefChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: NM.r.pill, borderWidth: 1.5, borderColor: NM.hair2, backgroundColor: '#fff' },
  prefChipActive: { borderColor: NM.lavenderDeep, backgroundColor: NM.lavenderSoft },
  prefChipText: { fontSize: 14, color: NM.ink2, fontWeight: '500' },
  prefChipTextActive: { color: NM.lavenderDeep, fontWeight: '700' },
  involvCards: { gap: 8, marginBottom: 16 },
  involvCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: NM.r.lg, padding: 14, borderWidth: 1.5, borderColor: NM.hair },
  involvCardActive: { borderColor: NM.lavenderDeep, backgroundColor: NM.lavenderSoft },
  involvCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: NM.hair2, alignItems: 'center', justifyContent: 'center' },
  involvCheckActive: { backgroundColor: NM.lavenderDeep, borderColor: NM.lavenderDeep },
  involvLabel: { fontSize: 15, color: NM.ink2, fontWeight: '500' },
  involvLabelActive: { color: NM.lavenderDeep, fontWeight: '700' },

  // Bio
  bioInput: { fontSize: 15, color: NM.ink, lineHeight: 22, marginTop: 10, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: NM.hair2, borderRadius: NM.r.md, padding: 12 },
  bioCounter: { fontSize: 10, color: NM.ink3, textAlign: 'right', marginTop: 6 },

  // Prompts
  promptsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  promptCount: { backgroundColor: NM.lavenderSoft, borderRadius: NM.r.pill, paddingHorizontal: 10, paddingVertical: 4 },
  promptCountText: { fontSize: 12, color: NM.lavenderDeep, fontWeight: '700' },
  addPromptBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: NM.lavenderDeep, borderStyle: 'dashed', borderRadius: NM.r.lg, padding: 14, justifyContent: 'center', marginBottom: 12 },
  addPromptText: { fontSize: 14, color: NM.lavenderDeep, fontWeight: '600' },
  pickerCard: { backgroundColor: '#fff', borderRadius: NM.r.xl, padding: 16, marginBottom: 12, ...NM.shadow.card },
  pickerLabel: { fontSize: 9, color: NM.ink3, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: NM.hair },
  pickerDot: { width: 10, height: 10, borderRadius: 5 },
  pickerRowText: { flex: 1, fontSize: 14, color: NM.ink, lineHeight: 19 },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: NM.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: NM.hair2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: NM.hair },
  sheetTitle: { fontSize: 15, fontWeight: '600', color: NM.ink },
  sheetCancel: { fontSize: 15, color: NM.ink3 },
  sheetDone: { fontSize: 15, fontWeight: '600', color: NM.lavenderDeep },
  picker: { width: '100%', backgroundColor: NM.cream },
  countrySheet: { maxHeight: '80%', flex: 0 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: NM.cream, borderRadius: NM.r.lg, borderWidth: 1.5, borderColor: NM.hair2, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: NM.ink },
  countryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  countryRowSelected: { backgroundColor: NM.cream },
  countryLabel: { fontSize: 16, color: NM.ink },
  countryLabelSelected: { fontWeight: '600' },
  separator: { height: 1, backgroundColor: NM.hair, marginHorizontal: 16 },
});
