import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Animated, PanResponder, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NM } from '@/constants/tokens';
import NMBadge from '@/components/NMBadge';
import PortraitRect from '@/components/PortraitRect';
import LikeablePrompt from '@/components/LikeablePrompt';
import { supabase } from '@/lib/supabase';
import { asPublicProfiles } from '@/lib/publicProfiles';
import { useAuthStore } from '@/store/authStore';
import { useBrowseFiltersStore } from '@/store/browseFiltersStore';
import { useDealBreakersStore } from '@/store/dealBreakersStore';
import { PublicProfile, INVOLVEMENT_LABELS, INSEM_LABELS } from '@/types/database';
import { notifyNewLike } from '@/lib/notifications';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

export default function Browse() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile: myProfile } = useAuthStore();
  const filters = useBrowseFiltersStore();
  const dealBreakers = useDealBreakersStore();
  const pan = useRef(new Animated.ValueXY()).current;
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersBlocking, setFiltersBlocking] = useState(false);

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-6deg', '0deg', '6deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const buildRpcParams = useCallback((offset = 0) => {
    if (!session?.user) return null;
    const now = new Date();
    const dobMax = new Date(now.getFullYear() - filters.ageMin, now.getMonth(), now.getDate())
      .toISOString().split('T')[0];
    const dobMin = new Date(now.getFullYear() - filters.ageMax, now.getMonth(), now.getDate())
      .toISOString().split('T')[0];
    const useRadius = filters.radiusKm > 0 && myProfile?.latitude != null && myProfile?.longitude != null;
    return {
      p_user_id:       session.user.id,
      p_giver_types:   filters.giverTypes.length > 0        ? filters.giverTypes        : null,
      p_insem_prefs:   filters.insemPrefs.length > 0        ? filters.insemPrefs        : null,
      p_involvement:   filters.involvementLevels.length > 0  ? filters.involvementLevels  : null,
      p_verified_only: filters.verifiedOnly,
      p_dob_min:       dobMin,
      p_dob_max:       dobMax,
      p_blocked_insem: dealBreakers.blockedInsemPrefs.length > 0        ? dealBreakers.blockedInsemPrefs        : null,
      p_blocked_inv:   dealBreakers.blockedInvolvementLevels.length > 0  ? dealBreakers.blockedInvolvementLevels  : null,
      p_require_age21: dealBreakers.requireAge21,
      p_same_country:  dealBreakers.sameCountryOnly,
      p_lat:           useRadius ? myProfile!.latitude  : null,
      p_lng:           useRadius ? myProfile!.longitude : null,
      p_radius_km:     useRadius ? filters.radiusKm     : null,
      p_limit:         20,
      p_offset:        offset,
    };
  }, [session, myProfile, filters, dealBreakers]);

  const loadProfiles = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    setFiltersBlocking(false);

    try {
      const rpcParams = buildRpcParams(0);
      if (!rpcParams) return;

      const { data, error: rpcError } = await supabase.rpc('get_browse_profiles', rpcParams);

      if (rpcError) throw rpcError;

      const loaded = asPublicProfiles(data);
      setProfiles(loaded);
      setCardIndex(0);

      if (loaded.length === 0 && filters.activeCount() > 0) {
        const { data: unfiltered } = await supabase.rpc('get_browse_profiles', {
          p_user_id: session.user.id,
          p_limit: 1,
        });
        if (asPublicProfiles(unfiltered).length > 0) setFiltersBlocking(true);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load profiles. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session, filters, dealBreakers, buildRpcParams]);

  const loadMoreProfiles = useCallback(async (currentCount: number) => {
    if (!session?.user || loadingMore) return;
    setLoadingMore(true);
    try {
      const rpcParams = buildRpcParams(currentCount);
      if (!rpcParams) return;
      const { data } = await supabase.rpc('get_browse_profiles', rpcParams);
      const more = asPublicProfiles(data);
      if (more.length > 0) setProfiles((prev) => [...prev, ...more]);
    } finally {
      setLoadingMore(false);
    }
  }, [session, loadingMore, buildRpcParams]);

  // Debounce filter/dealbreaker changes to avoid firing an RPC on every slider tick
  useEffect(() => {
    const id = setTimeout(loadProfiles, 300);
    return () => clearTimeout(id);
  }, [loadProfiles]);

  // Auto-load more cards when 3 remain in the deck
  useEffect(() => {
    if (!loading && !loadingMore && profiles.length > 0 && cardIndex >= profiles.length - 3) {
      loadMoreProfiles(profiles.length);
    }
  }, [cardIndex, profiles.length, loading, loadingMore, loadMoreProfiles]);

  const sendLike = async (toUserId: string, note?: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('likes').upsert({
      from_user_id: session.user.id,
      to_user_id: toUserId,
      note: note ?? null,
    });
    if (!error) notifyNewLike(toUserId);
  };

  const recordPass = async (toUserId: string) => {
    if (!session?.user) return;
    await supabase.from('browse_passes').upsert({
      from_user_id: session.user.id,
      to_user_id: toUserId,
    });
  };

  const flyOut = (direction: 'like' | 'pass') => {
    const toX = direction === 'like' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
    const current = profiles[cardIndex];
    Animated.timing(pan, {
      toValue: { x: toX, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      if (direction === 'like' && current) {
        sendLike(current.id);
      }
      if (direction === 'pass' && current) recordPass(current.id);
      setLastAction(direction);
      pan.setValue({ x: 0, y: 0 });
      setCardIndex((i) => i + 1);
    });
  };

  // Keep a ref so the PanResponder (created once) always calls the latest flyOut
  const flyOutRef = useRef(flyOut);
  flyOutRef.current = flyOut;

  const resetCard = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const resetCardRef = useRef(resetCard);
  resetCardRef.current = resetCard;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD) flyOutRef.current('like');
        else if (dx < -SWIPE_THRESHOLD) flyOutRef.current('pass');
        else resetCardRef.current();
      },
    }),
  ).current;

  const profile = profiles[cardIndex];
  const isDeckEmpty = !loading && cardIndex >= profiles.length;

  const getDisplayName = (p: PublicProfile) =>
    p.is_anonymous ? (p.display_name ?? 'Anonymous') : `${p.first_name ?? ''}`.trim();

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const insemLabel = (p: PublicProfile) => p.insemination_preference ? INSEM_LABELS[p.insemination_preference] : '';
  const invLabel = (p: PublicProfile) => p.involvement_level ? INVOLVEMENT_LABELS[p.involvement_level] : '';

  const activeFilterCount = filters.activeCount();

  // Describe which filters are on, for the suggestion copy
  const activeFilterNames = [
    filters.giverTypes.length > 0 && 'giver type',
    filters.insemPrefs.length > 0 && 'insemination preference',
    filters.involvementLevels.length > 0 && 'involvement level',
    (filters.ageMin !== 18 || filters.ageMax !== 45) && 'age range',
    filters.radiusKm > 0 && `${filters.radiusKm}km radius`,
  ].filter(Boolean) as string[];

  const header = (
    <View style={[s.headerRow, { paddingTop: insets.top + 8 }]}>
      <Text style={s.headerTitle}>Browse {myProfile?.role === 'seeker' ? 'Givers' : 'Seekers'}</Text>
      <TouchableOpacity style={s.filterBtn} onPress={() => router.push('/(screens)/browse-filters')}>
        <Ionicons name="options-outline" size={18} color={NM.ink2} />
        <Text style={s.filterText}>Filters</Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={s.filterBadge}
            onPress={(e) => { e.stopPropagation(); filters.reset(); }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="close" size={12} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.center}>
          <ActivityIndicator size="large" color={NM.lavenderDeep} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={28} color={NM.ink3} />
          </View>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySub}>{error}</Text>
          <TouchableOpacity style={s.undoBtn} onPress={loadProfiles}>
            <Ionicons name="refresh-outline" size={16} color={NM.lavenderDeep} />
            <Text style={s.undoText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state — filters blocking or swiped through everything
  if (isDeckEmpty) {
    const isFilterBlocked = filtersBlocking || (profiles.length === 0 && activeFilterCount > 0);

    if (isFilterBlocked) {
      return (
        <View style={s.root}>
          {header}
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="options-outline" size={28} color={NM.lavenderDeep} />
            </View>
            <Text style={s.emptyTitle}>No profiles match your filters</Text>
            <Text style={s.emptySub}>
              {activeFilterNames.length > 0
                ? `Try relaxing your ${activeFilterNames.join(', ')} filter${activeFilterNames.length > 1 ? 's' : ''} to see more people.`
                : 'Try broadening your filters to see more people.'}
            </Text>
            <View style={s.filterSuggestions}>
              {(filters.ageMin !== 18 || filters.ageMax !== 45) && (
                <TouchableOpacity
                  style={s.suggestionChip}
                  onPress={() => { filters.setFilters({ ageMin: 18, ageMax: 45 }); loadProfiles(); }}
                >
                  <Ionicons name="close-circle" size={14} color={NM.lavenderDeep} />
                  <Text style={s.suggestionText}>Reset age range</Text>
                </TouchableOpacity>
              )}
              {filters.involvementLevels.length > 0 && (
                <TouchableOpacity
                  style={s.suggestionChip}
                  onPress={() => { filters.setFilters({ involvementLevels: [] }); loadProfiles(); }}
                >
                  <Ionicons name="close-circle" size={14} color={NM.lavenderDeep} />
                  <Text style={s.suggestionText}>Clear involvement filter</Text>
                </TouchableOpacity>
              )}
              {filters.insemPrefs.length > 0 && (
                <TouchableOpacity
                  style={s.suggestionChip}
                  onPress={() => { filters.setFilters({ insemPrefs: [] }); loadProfiles(); }}
                >
                  <Ionicons name="close-circle" size={14} color={NM.lavenderDeep} />
                  <Text style={s.suggestionText}>Clear insemination filter</Text>
                </TouchableOpacity>
              )}
              {filters.radiusKm > 0 && (
                <TouchableOpacity
                  style={s.suggestionChip}
                  onPress={() => { filters.setFilters({ radiusKm: 0 }); loadProfiles(); }}
                >
                  <Ionicons name="close-circle" size={14} color={NM.lavenderDeep} />
                  <Text style={s.suggestionText}>Clear distance filter</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={s.undoBtn}
              onPress={() => router.push('/(screens)/browse-filters')}
            >
              <Ionicons name="options-outline" size={16} color={NM.lavenderDeep} />
              <Text style={s.undoText}>Adjust all filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={s.root}>
        {header}
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <Ionicons
              name={lastAction === 'like' ? 'heart' : 'checkmark-done'}
              size={32}
              color={lastAction === 'like' ? '#6B8E56' : NM.ink3}
            />
          </View>
          <Text style={s.emptyTitle}>You're all caught up</Text>
          <Text style={s.emptySub}>No more profiles right now. Check back soon.</Text>
          <TouchableOpacity
            style={s.undoBtn}
            onPress={() => { setCardIndex(0); loadProfiles(); pan.setValue({ x: 0, y: 0 }); }}
          >
            <Ionicons name="refresh-outline" size={16} color={NM.lavenderDeep} />
            <Text style={s.undoText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const age = profile ? getAge(profile.date_of_birth) : null;

  return (
    <View style={s.root}>
      {header}

      <View style={s.cardArea}>
        <Animated.View
          style={[s.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={0.97}
            onPress={() => router.push({ pathname: '/(screens)/profile-detail', params: { id: profile?.id } })}
          >
            <View style={s.heroWrap}>
              {profile?.profile_photo_url
                ? <Image source={{ uri: profile.profile_photo_url }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
                : <PortraitRect seed={profile?.id?.charCodeAt(0) ?? 0} height={300} radius={0} />
              }
              <View style={s.heroBadges}>
              </View>
              <View style={s.heroOverlay}>
                <View style={s.heroGrad} />
                <View style={s.heroName}>
                  <Text style={s.heroTitle}>
                    {getDisplayName(profile!)}{age ? `, ${age}` : ''}
                  </Text>
                  <Text style={s.heroSub}>
                    {profile?.giver_types?.[0] ?? profile?.role} · {profile?.country ?? ''}
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.cardBody}>
              <View style={s.badgeRow}>
                {profile?.insemination_preference && (
                  <NMBadge tone="sky">{insemLabel(profile)}</NMBadge>
                )}
                {profile?.involvement_level && (
                  <NMBadge tone="butter">{invLabel(profile)}</NMBadge>
                )}
              </View>
              {profile?.bio
                ? <Text style={s.bio}>{profile.bio}</Text>
                : (() => {
                    const basics = [
                      profile?.ethnicity  && { label: 'Ethnicity',  value: profile.ethnicity },
                      profile?.education  && { label: 'Education',  value: profile.education },
                      profile?.hair_color && { label: 'Hair',       value: profile.hair_color },
                      profile?.eye_color  && { label: 'Eyes',       value: profile.eye_color },
                      profile?.blood_type && { label: 'Blood type', value: profile.blood_type },
                      profile?.country    && { label: 'Country',    value: profile.country },
                    ].filter(Boolean) as { label: string; value: string }[];
                    if (!basics.length) return null;
                    return (
                      <View style={s.basicsList}>
                        {basics.map(b => (
                          <View key={b.label} style={s.basicsItem}>
                            <Text style={s.basicsLabel}>{b.label}</Text>
                            <Text style={s.basicsValue}>{b.value}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()
              }
            </View>
          </TouchableOpacity>

          <Animated.View style={[s.stampWrap, s.stampLike, { opacity: likeOpacity }]} pointerEvents="none">
            <Text style={s.stampLikeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[s.stampWrap, s.stampNope, { opacity: passOpacity }]} pointerEvents="none">
            <Text style={s.stampNopeText}>NOPE</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={s.progressRow}>
        {profiles.slice(cardIndex, cardIndex + 5).map((_, i) => (
          <View key={i} style={[s.dot, i === 0 && s.dotActive]} />
        ))}
      </View>

      <View style={[s.actionRow, { marginBottom: insets.bottom + 72 }]}>
        <TouchableOpacity style={[s.actionBtn, s.actionPass]} onPress={() => flyOut('pass')} activeOpacity={0.8}>
          <Ionicons name="close" size={28} color={NM.danger} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.actionBtnSm}
          onPress={() => router.push({ pathname: '/(screens)/profile-detail', params: { id: profile?.id } })}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle-outline" size={20} color={NM.ink3} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionLike]} onPress={() => flyOut('like')} activeOpacity={0.8}>
          <Ionicons name="heart" size={28} color="#6B8E56" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NM.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { paddingHorizontal: 20, paddingBottom: 14, position: 'relative' },
  headerTitle: { fontSize: 22, fontWeight: '600', color: NM.ink, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: NM.ink3, marginTop: 2 },
  filterBtn: {
    position: 'absolute', right: 20, bottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: NM.r.pill, borderWidth: 1, borderColor: NM.hair,
  },
  filterText: { fontSize: 13, color: NM.ink2, fontWeight: '500' },
  filterBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: NM.lavenderDeep, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cardArea: { flex: 1, marginHorizontal: 16, marginBottom: 8 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: NM.r.xxl,
    overflow: 'hidden', ...NM.shadow.lift,
  },
  stampWrap: {
    position: 'absolute', top: 28, zIndex: 10,
    borderWidth: 3, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  stampLike: { left: 20, borderColor: '#6B8E56', transform: [{ rotate: '-15deg' }] },
  stampNope: { right: 20, borderColor: NM.danger, transform: [{ rotate: '15deg' }] },
  stampLikeText: { fontSize: 28, fontWeight: '800', color: '#6B8E56', letterSpacing: 2 },
  stampNopeText: { fontSize: 28, fontWeight: '800', color: NM.danger, letterSpacing: 2 },
  heroWrap: { position: 'relative' },
  heroBadges: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', gap: 6 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  heroGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, backgroundColor: 'rgba(42,31,61,0.45)' },
  heroName: { padding: 18, paddingTop: 50 },
  heroTitle: { fontSize: 28, color: '#fff', letterSpacing: -0.5, fontWeight: '400', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  heroSub: { fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  cardBody: { padding: 16 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  bio: { fontSize: 13, color: NM.ink2, lineHeight: 19, marginBottom: 12 },
  basicsList: { gap: 6 },
  basicsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: NM.hair },
  basicsLabel: { fontSize: 12, color: NM.ink3, fontWeight: '500' },
  basicsValue: { fontSize: 12, color: NM.ink, fontWeight: '500' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingHorizontal: 20, paddingVertical: 10,
  },
  actionBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...NM.shadow.card,
  },
  actionBtnSm: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    ...NM.shadow.soft,
  },
  actionPass: { borderWidth: 1.5, borderColor: NM.dangerSoft },
  actionLike: { borderWidth: 1.5, borderColor: NM.sageSoft },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NM.hair },
  dotActive: { backgroundColor: NM.lavenderDeep, width: 18 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: NM.cream2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, color: NM.ink, fontWeight: '600', letterSpacing: -0.4, textAlign: 'center' },
  emptySub: { fontSize: 14, color: NM.ink3, textAlign: 'center', lineHeight: 20 },
  filterSuggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: NM.lavenderSoft, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: NM.r.pill,
  },
  suggestionText: { fontSize: 13, color: NM.lavenderDeep, fontWeight: '500' },
  undoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  undoText: { fontSize: 14, color: NM.lavenderDeep, fontWeight: '600' },
});
