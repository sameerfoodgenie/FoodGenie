import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');

interface MasterChef {
  id: string;
  name: string;
  handle: string;
  specialty: string;
  tagline: string;
  avatarUri: string;
  coverUri: string;
  followers: number;
  showCount: number;
  recipeCount: number;
  rating: number;
  isVerified: boolean;
  badgeColor: string;
}

const MASTER_CHEFS: MasterChef[] = [
  {
    id: 'chef_aarav',
    name: 'Chef Aarav',
    handle: 'aarav_eats',
    specialty: 'Healthy Meals',
    tagline: 'Clean eating, big flavors. Making healthy food exciting for everyone.',
    avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    coverUri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    followers: 12400,
    showCount: 5,
    recipeCount: 87,
    rating: 4.9,
    isVerified: true,
    badgeColor: '#22C55E',
  },
  {
    id: 'chef_meera',
    name: 'Chef Meera',
    handle: 'meera_kitchen',
    specialty: 'Home Style Cooking',
    tagline: 'Bringing grandma\'s recipes to your kitchen with a modern twist.',
    avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    coverUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    followers: 8700,
    showCount: 3,
    recipeCount: 65,
    rating: 4.8,
    isVerified: true,
    badgeColor: '#D4AF37',
  },
  {
    id: 'chef_rohan',
    name: 'Chef Rohan',
    handle: 'rohan_streetfood',
    specialty: 'Street Food Expert',
    tagline: 'Authentic street food flavors, restaurant-quality presentation.',
    avatarUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    coverUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    followers: 15200,
    showCount: 8,
    recipeCount: 120,
    rating: 4.9,
    isVerified: true,
    badgeColor: '#FF6B6B',
  },
  {
    id: 'chef_ananya',
    name: 'Chef Ananya',
    handle: 'ananya_desserts',
    specialty: 'Desserts Specialist',
    tagline: 'Life is sweet. Creating dreamy desserts that melt your heart.',
    avatarUri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    coverUri: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80',
    followers: 9800,
    showCount: 4,
    recipeCount: 94,
    rating: 4.7,
    isVerified: true,
    badgeColor: '#FF69B4',
  },
  {
    id: 'chef_vikram',
    name: 'Chef Vikram',
    handle: 'vikram_biryani',
    specialty: 'Biryani & Rice',
    tagline: 'The rice whisperer. Perfecting every grain, every spice, every bite.',
    avatarUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    coverUri: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    followers: 18600,
    showCount: 6,
    recipeCount: 73,
    rating: 5.0,
    isVerified: true,
    badgeColor: '#FFB347',
  },
  {
    id: 'chef_priya',
    name: 'Chef Priya',
    handle: 'priya_vegan',
    specialty: 'Vegan & Plant-Based',
    tagline: 'Plant-powered cooking that even meat lovers will crave.',
    avatarUri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    coverUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    followers: 7300,
    showCount: 2,
    recipeCount: 56,
    rating: 4.8,
    isVerified: false,
    badgeColor: '#4ADE80',
  },
];

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function ChefCard({ chef, index, isFollowing, onToggleFollow, onPress, colors }: {
  chef: MasterChef;
  index: number;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
      <Pressable
        style={({ pressed }) => [
          styles.chefCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
        ]}
        onPress={onPress}
      >
        {/* Cover image */}
        <View style={styles.chefCover}>
          <Image source={{ uri: chef.coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Specialty badge */}
          <View style={[styles.specialtyBadge, { backgroundColor: `${chef.badgeColor}DD` }]}>
            <Text style={styles.specialtyText}>{chef.specialty}</Text>
          </View>
          {/* Rating */}
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{chef.rating}</Text>
          </View>
        </View>

        {/* Chef info */}
        <View style={styles.chefInfo}>
          <View style={styles.chefInfoLeft}>
            {/* Avatar */}
            <View style={[styles.chefAvatarWrap, { borderColor: chef.badgeColor }]}>
              <Image source={{ uri: chef.avatarUri }} style={styles.chefAvatar} contentFit="cover" transition={150} />
              {chef.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={16} color="#D4AF37" />
                </View>
              ) : null}
            </View>

            <View style={styles.chefTextBlock}>
              <View style={styles.chefNameRow}>
                <Text style={[styles.chefName, { color: colors.textPrimary }]}>{chef.name}</Text>
              </View>
              <Text style={[styles.chefHandle, { color: colors.textMuted }]}>@{chef.handle}</Text>
            </View>
          </View>

          {/* Follow button */}
          <Pressable
            style={({ pressed }) => [
              styles.followBtn,
              isFollowing
                ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border }
                : {},
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleFollow();
            }}
          >
            {isFollowing ? (
              <Text style={[styles.followBtnText, { color: colors.textSecondary }]}>Following</Text>
            ) : (
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.followBtnGrad}>
                <Text style={styles.followBtnText}>Follow</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>

        {/* Tagline */}
        <Text style={[styles.chefTagline, { color: colors.textSecondary }]} numberOfLines={2}>
          {chef.tagline}
        </Text>

        {/* Stats row */}
        <View style={[styles.chefStats, { borderTopColor: colors.border }]}>
          <View style={styles.chefStatItem}>
            <Text style={[styles.chefStatValue, { color: colors.textPrimary }]}>{formatFollowers(chef.followers + (isFollowing ? 1 : 0))}</Text>
            <Text style={[styles.chefStatLabel, { color: colors.textMuted }]}>Followers</Text>
          </View>
          <View style={[styles.chefStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.chefStatItem}>
            <Text style={[styles.chefStatValue, { color: colors.textPrimary }]}>{chef.showCount}</Text>
            <Text style={[styles.chefStatLabel, { color: colors.textMuted }]}>Shows</Text>
          </View>
          <View style={[styles.chefStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.chefStatItem}>
            <Text style={[styles.chefStatValue, { color: colors.textPrimary }]}>{chef.recipeCount}</Text>
            <Text style={[styles.chefStatLabel, { color: colors.textMuted }]}>Recipes</Text>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.chefActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => { Haptics.selectionAsync(); }}
          >
            <MaterialIcons name="play-circle-outline" size={18} color="#D4AF37" />
            <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Watch Shows</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => { Haptics.selectionAsync(); }}
          >
            <MaterialIcons name="person-outline" size={18} color="#D4AF37" />
            <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>View Profile</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MasterChefsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const FILTERS = useMemo(() => [
    { id: 'all', label: 'All Chefs', emoji: '👨‍🍳' },
    { id: 'healthy', label: 'Healthy', emoji: '🥗' },
    { id: 'home', label: 'Home Style', emoji: '🏠' },
    { id: 'street', label: 'Street Food', emoji: '🍜' },
    { id: 'desserts', label: 'Desserts', emoji: '🍰' },
  ], []);

  const filteredChefs = useMemo(() => {
    if (activeFilter === 'all') return MASTER_CHEFS;
    const filterMap: Record<string, string[]> = {
      healthy: ['Healthy Meals', 'Vegan & Plant-Based'],
      home: ['Home Style Cooking'],
      street: ['Street Food Expert'],
      desserts: ['Desserts Specialist'],
    };
    const specialties = filterMap[activeFilter] || [];
    return MASTER_CHEFS.filter(c => specialties.includes(c.specialty));
  }, [activeFilter]);

  const toggleFollow = useCallback((id: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const headerGradient = isDark
    ? ['#1A1510', '#1E1A12', '#14141C'] as const
    : ['#FFF8E1', '#FFECB3', '#FDF8F0'] as const;

  const renderChef = useCallback(({ item, index }: { item: MasterChef; index: number }) => (
    <ChefCard
      chef={item}
      index={index}
      isFollowing={following.has(item.id)}
      onToggleFollow={() => toggleFollow(item.id)}
      onPress={() => { Haptics.selectionAsync(); }}
      colors={colors}
    />
  ), [following, toggleFollow, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={filteredChefs}
          keyExtractor={item => item.id}
          renderItem={renderChef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          ListHeaderComponent={
            <View>
              {/* Header */}
              <LinearGradient colors={headerGradient} style={styles.headerGradient}>
                <View style={styles.header}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.backBtn,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.80)', borderColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); router.back(); }}
                  >
                    <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Master Chefs</Text>
                  <View style={{ width: 44 }} />
                </View>

                {/* Hero section */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.heroSection}>
                  <Text style={styles.heroEmoji}>👨‍🍳</Text>
                  <Text style={[styles.heroTitle, { color: isDark ? '#FFD700' : '#8B6914' }]}>Curated Experts</Text>
                  <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                    Follow top chefs, watch their shows, and learn their secret recipes
                  </Text>
                  <View style={styles.heroStats}>
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{MASTER_CHEFS.length}</Text>
                      <Text style={[styles.heroStatLabel, { color: isDark ? '#D4AF37' : '#8B6914' }]}>Chefs</Text>
                    </View>
                    <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(212,175,55,0.20)' }]} />
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>
                        {MASTER_CHEFS.reduce((s, c) => s + c.showCount, 0)}
                      </Text>
                      <Text style={[styles.heroStatLabel, { color: isDark ? '#D4AF37' : '#8B6914' }]}>Shows</Text>
                    </View>
                    <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(212,175,55,0.20)' }]} />
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>
                        {MASTER_CHEFS.reduce((s, c) => s + c.recipeCount, 0)}
                      </Text>
                      <Text style={[styles.heroStatLabel, { color: isDark ? '#D4AF37' : '#8B6914' }]}>Recipes</Text>
                    </View>
                  </View>
                </Animated.View>
              </LinearGradient>

              {/* Filter chips */}
              <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.filterSection}>
                <FlatList
                  data={FILTERS}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.filterScroll}
                  renderItem={({ item }) => {
                    const isActive = activeFilter === item.id;
                    return (
                      <Pressable
                        style={[
                          styles.filterChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          isActive && styles.filterChipActive,
                        ]}
                        onPress={() => { Haptics.selectionAsync(); setActiveFilter(item.id); }}
                      >
                        <Text style={styles.filterEmoji}>{item.emoji}</Text>
                        <Text style={[
                          styles.filterLabel,
                          { color: colors.textSecondary },
                          isActive && styles.filterLabelActive,
                        ]}>{item.label}</Text>
                      </Pressable>
                    );
                  }}
                />
              </Animated.View>

              {/* Section title */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {activeFilter === 'all' ? 'All Master Chefs' : `${FILTERS.find(f => f.id === activeFilter)?.label || ''} Chefs`}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{filteredChefs.length} chefs</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍳</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No chefs found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Try a different filter</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerGradient: { paddingBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },

  /* Hero */
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 8,
  },
  heroEmoji: { fontSize: 48, marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  heroStats: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    width: '100%',
    justifyContent: 'space-around',
  },
  heroStatItem: { alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: 20, fontWeight: '900' },
  heroStatLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroStatDivider: { width: 1, height: 30 },

  /* Filters */
  filterSection: { marginTop: 12 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: 'rgba(212,175,55,0.30)',
  },
  filterEmoji: { fontSize: 16 },
  filterLabel: { fontSize: 13, fontWeight: '700' },
  filterLabelActive: { color: '#D4AF37' },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCount: { fontSize: 12, fontWeight: '600' },

  /* Chef Card */
  chefCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  chefCover: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  specialtyBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  specialtyText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#FFF' },

  /* Chef info row */
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  chefInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  chefAvatarWrap: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2.5,
    overflow: 'hidden',
    position: 'relative',
  },
  chefAvatar: { width: '100%', height: '100%' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chefTextBlock: { flex: 1, gap: 1 },
  chefNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chefName: { fontSize: 16, fontWeight: '800' },
  chefHandle: { fontSize: 13, fontWeight: '500' },

  /* Follow button */
  followBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 90,
  },
  followBtnGrad: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
  },
  followBtnText: { fontSize: 13, fontWeight: '800', color: '#FFF' },

  /* Tagline */
  chefTagline: {
    paddingHorizontal: 16,
    paddingTop: 10,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },

  /* Stats */
  chefStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    justifyContent: 'space-around',
  },
  chefStatItem: { alignItems: 'center', gap: 2 },
  chefStatValue: { fontSize: 16, fontWeight: '900' },
  chefStatLabel: { fontSize: 11, fontWeight: '600' },
  chefStatDivider: { width: 1, height: 28 },

  /* Actions */
  chefActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  /* Empty */
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14 },
});
