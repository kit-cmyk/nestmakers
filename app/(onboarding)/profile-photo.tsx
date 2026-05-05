import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, Image, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NM } from '@/constants/tokens';
import NMHeader from '@/components/NMHeader';
import NMBtn from '@/components/NMBtn';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { uploadFileFromBase64 } from '@/lib/uploadFile';

const MAX_PHOTOS = 5;
const GAP = 8;
const COLS = 3;
const SLOT_SIZE = (Dimensions.get('window').width - 40 - GAP * (COLS - 1)) / COLS;

type Slot = { localUri: string; url: string | null; uploading: boolean };

export default function ProfilePhoto() {
  const router = useRouter();
  const { saveProfile, setPhotoUrls } = useOnboardingStore();
  const { loadProfile, session } = useAuthStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [saving, setSaving] = useState(false);

  const updateSlot = (index: number, patch: Partial<Slot>) =>
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const pickImage = async (fromCamera: boolean, slotIndex: number) => {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow camera access in Settings.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo library access in Settings.');
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });

    if (result.canceled || !result.assets[0]?.base64) return;

    const { uri, base64, mimeType } = result.assets[0];
    const isNew = slotIndex === slots.length;
    const newSlot: Slot = { localUri: uri, url: null, uploading: true };

    setSlots((prev) => {
      const next = [...prev];
      if (isNew) next.push(newSlot);
      else next[slotIndex] = newSlot;
      return next;
    });

    try {
      const userId = session?.user?.id ?? 'unknown';
      const ext = (mimeType ?? 'image/jpeg').split('/')[1] ?? 'jpg';
      const url = await uploadFileFromBase64(
        'profile-photos',
        `${userId}/photo-${slotIndex}.${ext}`,
        base64,
        mimeType ?? 'image/jpeg',
      );
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { localUri: uri, url, uploading: false };
        setPhotoUrls(next.filter((s) => s.url).map((s) => s.url!));
        return next;
      });
    } catch (e: any) {
      setSlots((prev) => prev.filter((_, i) => i !== slotIndex));
      Alert.alert('Upload failed', e.message);
    }
  };

  const handleSlotPress = (index: number) => {
    const slot = slots[index];
    if (slot?.uploading) return;

    if (slot?.localUri) {
      Alert.alert('Photo options', undefined, [
        { text: 'Replace from library', onPress: () => pickImage(false, index) },
        { text: 'Replace with camera', onPress: () => pickImage(true, index) },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setSlots((prev) => {
            const next = prev.filter((_, i) => i !== index);
            setPhotoUrls(next.filter((s) => s.url).map((s) => s.url!));
            return next;
          });
        }},
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Add photo', undefined, [
        { text: 'Upload from library', onPress: () => pickImage(false, index) },
        { text: 'Take a photo', onPress: () => pickImage(true, index) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const canAddMore = slots.length < MAX_PHOTOS;
  const hasAtLeastOne = slots.some((s) => s.url !== null);
  const anyUploading = slots.some((s) => s.uploading);

  const allSlots = [
    ...slots,
    ...(canAddMore ? [null] : []),
  ];

  return (
    <View style={s.root}>
      <SafeAreaView>
        <NMHeader title="Step 8 of 8" left="Back" />
      </SafeAreaView>

      <ScrollView style={s.scroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.heading}>
          <Text style={s.kicker}>Almost there</Text>
          <Text style={s.title}>Add your{'\n'}photos.</Text>
          <Text style={s.sub}>
            Add up to 5 photos. Your first photo is your main profile picture.
          </Text>
        </View>

        {/* Photo grid */}
        <View style={s.grid}>
          {allSlots.map((slot, i) => {
            const isAdd = slot === null;
            const isFirst = i === 0;
            return (
              <TouchableOpacity
                key={i}
                style={[s.slot, isFirst && s.slotPrimary]}
                onPress={() => isAdd ? handleSlotPress(slots.length) : handleSlotPress(i)}
                activeOpacity={0.8}
                disabled={slot?.uploading}
              >
                {isAdd ? (
                  <View style={s.slotEmpty}>
                    <Ionicons name="add" size={28} color={NM.ink3} />
                  </View>
                ) : slot!.uploading ? (
                  <View style={s.slotEmpty}>
                    <ActivityIndicator color={NM.lavenderDeep} />
                  </View>
                ) : (
                  <View style={s.slotFilled}>
                    <Image source={{ uri: slot!.localUri }} style={s.slotImage} />
                    {isFirst && (
                      <View style={s.primaryBadge}>
                        <Text style={s.primaryBadgeText}>Main</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={s.removeBtn}
                      onPress={() => {
                        setSlots((prev) => {
                          const next = prev.filter((_, idx) => idx !== i);
                          setPhotoUrls(next.filter((s) => s.url).map((s) => s.url!));
                          return next;
                        });
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.countHint}>{slots.length} of {MAX_PHOTOS} photos added</Text>

        <View style={s.notice}>
          <Ionicons name="shield-checkmark-outline" size={14} color={NM.ink3} />
          <Text style={s.noticeText}>
            Photos are reviewed by our team. You can add, remove, or reorder them from your profile at any time.
          </Text>
        </View>
      </ScrollView>

      <View style={s.footer}>
        {saving ? (
          <ActivityIndicator color={NM.ink} />
        ) : (
          <NMBtn full disabled={!hasAtLeastOne || anyUploading} onPress={async () => {
            setSaving(true);
            const err = await saveProfile();
            if (err) {
              Alert.alert('Error', err);
              setSaving(false);
              return;
            }
            await loadProfile();
            router.replace('/(tabs)/browse');
          }}>
            Start matching
          </NMBtn>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  heading: { paddingHorizontal: 8, paddingBottom: 24, gap: 8 },
  kicker: { fontSize: 10, color: NM.lavenderDeep, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 30, lineHeight: 34, color: NM.ink, letterSpacing: -0.7, fontWeight: '600' },
  sub: { fontSize: 13, lineHeight: 19, color: NM.ink2 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 12,
  },
  slot: {
    width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: NM.r.lg, overflow: 'hidden',
  },
  slotPrimary: {
    width: SLOT_SIZE * 2 + GAP, height: SLOT_SIZE * 2 + GAP,
  },
  slotEmpty: {
    flex: 1, backgroundColor: NM.cream2,
    borderWidth: 2, borderColor: NM.hair2, borderStyle: 'dashed', borderRadius: NM.r.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  slotFilled: { flex: 1 },
  slotImage: { width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  primaryBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10,
  },
  countHint: { fontSize: 12, color: NM.ink3, textAlign: 'center', marginBottom: 14 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: NM.cream2, borderRadius: NM.r.md, padding: 12,
  },
  noticeText: { flex: 1, fontSize: 12, color: NM.ink3, lineHeight: 17 },
  footer: { paddingHorizontal: 20, paddingBottom: 36 },
});
