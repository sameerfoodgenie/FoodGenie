import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useCoin } from '../../hooks/useCoin';

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
  videoCount: number;
  rating: number;
  isVerified: boolean;
  badgeColor: string;
  signatureDishes: string[];
  cuisines: string[];
}

const MASTER_CHEFS: MasterChef[] = [
  {
    id: 'chef_harpal',
    name: 'Chef Harpal Singh Sokhi',
    handle: 'chefharpalsokhi',
    specialty: 'Punjabi & Dhaba-Style',
    tagline: 'Namak Shamak bringing the energy of Punjabi kitchens to your home. Turban Tadka!',
    avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg',
    coverUri: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
    followers: 245000,
    showCount: 12,
    recipeCount: 320,
    videoCount: 180,
    rating: 4.9,
    isVerified: true,
    badgeColor: '#FF6B6B',
    signatureDishes: ['Butter Chicken', 'Dal Makhani', 'Amritsari Kulcha', 'Paneer Lababdar'],
    cuisines: ['Punjabi', 'North Indian', 'Dhaba-style'],
  },
  {
    id: 'chef_vikas',
    name: 'Chef Vikas Khanna',
    handle: 'vikaboraink',
    specialty: 'Premium Indian & Global',
    tagline: 'From Amritsar to New York — elevating Indian cuisine on the world stage with soul and precision.',
    avatarUri: 'https://randomuser.me/api/portraits/men/45.jpg',
    coverUri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    followers: 890000,
    showCount: 18,
    recipeCount: 450,
    videoCount: 280,
    rating: 5.0,
    isVerified: true,
    badgeColor: '#D4AF37',
    signatureDishes: ['Modern Indian Thali', 'Millet Khichdi', 'Kashmiri Dum Aloo', 'Healthy Indian Bowls'],
    cuisines: ['Premium Indian', 'Global Fusion', 'Kashmiri'],
  },
  {
    id: 'chef_kunal',
    name: 'Chef Kunal Kapur',
    handle: 'chefkunalkapur',
    specialty: 'Home Cooking & Street Food',
    tagline: 'Making every Indian home cook feel like a MasterChef. Simple recipes, grand flavors.',
    avatarUri: 'https://randomuser.me/api/portraits/men/22.jpg',
    coverUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    followers: 520000,
    showCount: 15,
    recipeCount: 580,
    videoCount: 340,
    rating: 4.9,
    isVerified: true,
    badgeColor: '#4ADE80',
    signatureDishes: ['Chole Bhature', 'Rajma Chawal', 'Tandoori Paneer', 'Biryani'],
    cuisines: ['North Indian', 'Street Food', 'Festive'],
  },
  {
    id: 'chef_ranveer',
    name: 'Chef Ranveer Brar',
    handle: 'ranveerbrar',
    specialty: 'Regional Indian & Lucknowi',
    tagline: 'Food is a story. Every recipe has a tale from the streets of Lucknow to the soul of India.',
    avatarUri: 'https://randomuser.me/api/portraits/men/36.jpg',
    coverUri: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    followers: 680000,
    showCount: 22,
    recipeCount: 420,
    videoCount: 260,
    rating: 4.9,
    isVerified: true,
    badgeColor: '#818CF8',
    signatureDishes: ['Galouti Kebab', 'Awadhi Biryani', 'Nihari', 'Kathal Curry'],
    cuisines: ['Lucknowi', 'Awadhi', 'Regional Indian'],
  },
  {
    id: 'chef_sanjeev',
    name: 'Chef Sanjeev Kapoor',
    handle: 'sanjeevkapoor',
    specialty: 'Family Meals & Simple Recipes',
    tagline: 'Khana Khazana — making cooking simple, delicious and joyful for every Indian household.',
    avatarUri: 'https://randomuser.me/api/portraits/men/52.jpg',
    coverUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    followers: 1200000,
    showCount: 30,
    recipeCount: 1200,
    videoCount: 800,
    rating: 4.8,
    isVerified: true,
    badgeColor: '#FFB347',
    signatureDishes: ['Pav Bhaji', 'Paneer Butter Masala', 'Veg Pulao', 'Masala Dosa'],
    cuisines: ['Pan Indian', 'Family Cooking', 'Vegetarian'],
  },
  {
    id: 'chef_shipra',
    name: 'Chef Shipra Khanna',
    handle: 'shipra_khanna',
    specialty: 'Healthy & Innovative Indian',
    tagline: 'MasterChef India winner. Turning healthy ingredients into irresistible Indian flavors.',
    avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg',
    coverUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    followers: 320000,
    showCount: 8,
    recipeCount: 280,
    videoCount: 150,
    rating: 4.8,
    isVerified: true,
    badgeColor: '#F472B6',
    signatureDishes: ['Quinoa Upma', 'Ragi Dosa', 'Millet Biryani', 'Avocado Chaat'],
    cuisines: ['Healthy Indian', 'Fusion', 'Innovative'],
  },
  {
    id: 'chef_pankaj',
    name: 'Chef Pankaj Bhadouria',
    handle: 'pankajbhadouria',
    specialty: 'Traditional & Festive Cooking',
    tagline: 'India\'s first MasterChef winner. Celebrating tradition through authentic festive recipes.',
    avatarUri: 'https://randomuser.me/api/portraits/women/65.jpg',
    coverUri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    followers: 280000,
    showCount: 10,
    recipeCount: 350,
    videoCount: 200,
    rating: 4.7,
    isVerified: true,
    badgeColor: '#A78BFA',
    signatureDishes: ['Gujiya', 'Shahi Tukda', 'Mutton Korma', 'Festival Thali'],
    cuisines: ['Festive', 'Traditional', 'North Indian'],
  },
  {
    id: 'chef_amrita',
    name: 'Chef Amrita Raichand',
    handle: 'amritaraichand',
    specialty: 'Quick Meals & Kids Cooking',
    tagline: 'Mummy ka magic — quick, nutritious and kid-approved meals for busy Indian families.',
    avatarUri: 'https://randomuser.me/api/portraits/women/33.jpg',
    coverUri: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80',
    followers: 180000,
    showCount: 6,
    recipeCount: 220,
    videoCount: 130,
    rating: 4.8,
    isVerified: true,
    badgeColor: '#22D3EE',
    signatureDishes: ['Veggie Nuggets', 'Masala Pasta', 'Fruit Chaat', 'Paneer Wrap'],
    cuisines: ['Quick Meals', 'Kids Food', 'Healthy'],
  },
];

function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function ChefCard({ chef, index, isFollowing, onToggleFollow, colors, isDark }: {
  chef: MasterChef; index: number; isFollowing: boolean;
  onToggleFollow: () => void; colors: any; isDark: boolean;
}) {
  const [showAllDishes, setShowAllDishes] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
      <Pressable
        style={[st.chefCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => Haptics.selectionAsync()}
      >
        {/* Cover */}
        <View style={st.chefCover}>
          <Image source={{ uri: chef.coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFillObject} />
          <View style={[st.specialtyBadge, { backgroundColor: `${chef.badgeColor}DD` }]}>
            <Text style={st.specialtyText}>{chef.specialty}</Text>
          </View>
          <View style={st.ratingBadge}>
            <MaterialIcons name="star" size={12} color="#FFD700" />
            <Text style={st.ratingText}>{chef.rating}</Text>
          </View>
          {/* Token badge */}
          <View style={st.tokenBadge}>
            <Text style={{ fontSize: 10 }}>🪙</Text>
            <Text style={st.tokenBadgeText}>Earn Tokens</Text>
          </View>
        </View>

        {/* Chef info row */}
        <View style={st.chefInfo}>
          <View style={st.chefInfoLeft}>
            <View style={[st.avatarWrap, { borderColor: chef.badgeColor }]}>
              <Image source={{ uri: chef.avatarUri }} style={st.avatar} contentFit="cover" transition={150} />
              {chef.isVerified ? (
                <View style={st.verifiedIcon}>
                  <MaterialIcons name="verified" size={16} color="#D4AF37" />
                </View>
              ) : null}
            </View>
            <View style={st.chefTextBlock}>
              <Text style={[st.chefName, { color: colors.textPrimary }]} numberOfLines={1}>{chef.name}</Text>
              <Text style={[st.chefHandle, { color: colors.textMuted }]}>@{chef.handle}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              st.followBtn,
              isFollowing ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border }
                : { overflow: 'hidden' as const },
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            ]}
            onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFollow(); }}
          >
            {isFollowing ? (
              <Text style={[st.followBtnText, { color: colors.textSecondary }]}>Following</Text>
            ) : (
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={st.followBtnGrad}>
                <Text style={st.followBtnText}>Follow</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>

        <Text style={[st.chefTagline, { color: colors.textSecondary }]} numberOfLines={2}>{chef.tagline}</Text>

        {/* Cuisine tags */}
        <View style={st.cuisineRow}>
          {chef.cuisines.map(c => (
            <View key={c} style={[st.cuisineTag, {
              backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.06)',
              borderColor: 'rgba(212,175,55,0.18)',
            }]}>
              <Text style={st.cuisineText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Signature Dishes */}
        <View style={st.dishesSection}>
          <Text style={[st.dishesSectionTitle, { color: colors.textSecondary }]}>Signature Dishes</Text>
          <View style={st.dishesWrap}>
            {chef.signatureDishes.map((dish, i) => (
              <View key={i} style={[st.dishChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={{ fontSize: 12 }}>🍛</Text>
                <Text style={[st.dishChipText, { color: colors.textPrimary }]}>{dish}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={[st.statsRow, { borderTopColor: colors.border }]}>
          <View style={st.statItem}>
            <Text style={[st.statValue, { color: colors.textPrimary }]}>{formatFollowers(chef.followers)}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Followers</Text>
          </View>
          <View style={[st.statDivider, { backgroundColor: colors.border }]} />
          <View style={st.statItem}>
            <Text style={[st.statValue, { color: colors.textPrimary }]}>{chef.showCount}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Shows</Text>
          </View>
          <View style={[st.statDivider, { backgroundColor: colors.border }]} />
          <View style={st.statItem}>
            <Text style={[st.statValue, { color: colors.textPrimary }]}>{chef.recipeCount}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Recipes</Text>
          </View>
          <View style={[st.statDivider, { backgroundColor: colors.border }]} />
          <View style={st.statItem}>
            <Text style={[st.statValue, { color: colors.textPrimary }]}>{chef.videoCount}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Videos</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={st.actionsRow}>
          <Pressable style={({ pressed }) => [st.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}>
            <MaterialIcons name="play-circle-outline" size={16} color="#D4AF37" />
            <Text style={[st.actionBtnText, { color: colors.textPrimary }]}>Watch Shows</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [st.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}>
            <MaterialIcons name="restaurant-menu" size={16} color="#D4AF37" />
            <Text style={[st.actionBtnText, { color: colors.textPrimary }]}>View Recipes</Text>
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
  const { balance } = useCoin();
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const FILTERS = useMemo(() => [
    { id: 'all', label: 'All Chefs', emoji: '👨‍🍳' },
    { id: 'punjabi', label: 'Punjabi', emoji: '🍛' },
    { id: 'home', label: 'Home Cooking', emoji: '🏠' },
    { id: 'premium', label: 'Premium', emoji: '👑' },
    { id: 'healthy', label: 'Healthy', emoji: '🥗' },
    { id: 'festive', label: 'Festive', emoji: '🎉' },
  ], []);

  const filteredChefs = useMemo(() => {
    if (activeFilter === 'all') return MASTER_CHEFS;
    const filterMap: Record<string, string[]> = {
      punjabi: ['Punjabi & Dhaba-Style'],
      home: ['Home Cooking & Street Food', 'Family Meals & Simple Recipes', 'Quick Meals & Kids Cooking'],
      premium: ['Premium Indian & Global', 'Regional Indian & Lucknowi'],
      healthy: ['Healthy & Innovative Indian'],
      festive: ['Traditional & Festive Cooking'],
    };
    const specialties = filterMap[activeFilter] || [];
    return MASTER_CHEFS.filter(c => specialties.includes(c.specialty));
  }, [activeFilter]);

  const toggleFollow = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const totalShows = MASTER_CHEFS.reduce((s, c) => s + c.showCount, 0);
  const totalRecipes = MASTER_CHEFS.reduce((s, c) => s + c.recipeCount, 0);
  const totalVideos = MASTER_CHEFS.reduce((s, c) => s + c.videoCount, 0);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={filteredChefs}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ChefCard
              chef={item} index={index}
              isFollowing={following.has(item.id)}
              onToggleFollow={() => toggleFollow(item.id)}
              colors={colors} isDark={isDark}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          ListHeaderComponent={
            <View>
              <LinearGradient
                colors={isDark ? ['#1A1510', '#1E1A12', '#14141C'] : ['#FFF8E1', '#FFECB3', '#FDF8F0']}
                style={st.headerGrad}
              >
                <View style={st.header}>
                  <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Master Chefs 👨‍🍳</Text>
                  <View style={st.headerCoinPill}>
                    <Text style={{ fontSize: 12 }}>🪙</Text>
                    <Text style={st.headerCoinText}>{balance}</Text>
                  </View>
                </View>

                <Animated.View entering={FadeIn.duration(500)} style={st.heroSection}>
                  <Text style={[st.heroSub, { color: colors.textSecondary }]}>
                    Watch recipe videos from India's top chefs — unlock with AI tokens
                  </Text>
                  <View style={[st.heroStats, { borderColor: 'rgba(212,175,55,0.18)' }]}>
                    {[
                      { value: MASTER_CHEFS.length.toString(), label: 'Chefs' },
                      { value: totalShows.toString(), label: 'Shows' },
                      { value: totalRecipes.toString(), label: 'Recipes' },
                      { value: totalVideos.toString(), label: 'Videos' },
                    ].map((s, i) => (
                      <React.Fragment key={s.label}>
                        {i > 0 ? <View style={[st.heroDivider, { backgroundColor: 'rgba(212,175,55,0.20)' }]} /> : null}
                        <View style={st.heroStatItem}>
                          <Text style={[st.heroStatValue, { color: colors.textPrimary }]}>{s.value}</Text>
                          <Text style={[st.heroStatLabel, { color: isDark ? '#D4AF37' : '#8B6914' }]}>{s.label}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </Animated.View>

                {/* Token Economy Banner */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                  <View style={[st.tokenBanner, { backgroundColor: isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.20)' }]}>
                    <View style={st.tokenBannerRow}>
                      <Text style={{ fontSize: 20 }}>🎬</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[st.tokenBannerTitle, { color: colors.textPrimary }]}>Unlock Recipe Videos</Text>
                        <Text style={[st.tokenBannerSub, { color: colors.textMuted }]}>
                          Free preview • 20 tokens for full recipe • 50 for premium • 100 for classes
                        </Text>
                      </View>
                    </View>
                    <View style={st.tokenPriceRow}>
                      {[
                        { label: 'Short Preview', tokens: 'Free', color: '#4ADE80' },
                        { label: 'Full Recipe', tokens: '20', color: '#D4AF37' },
                        { label: 'Premium', tokens: '50', color: '#FF6B6B' },
                        { label: 'Class', tokens: '100', color: '#818CF8' },
                      ].map(t => (
                        <View key={t.label} style={[st.tokenPriceItem, { backgroundColor: `${t.color}10` }]}>
                          <Text style={[st.tokenPriceLabel, { color: t.color }]}>{t.tokens === 'Free' ? '✓' : '🪙'} {t.tokens}</Text>
                          <Text style={[st.tokenPriceDesc, { color: colors.textMuted }]}>{t.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              </LinearGradient>

              {/* Filter chips */}
              <Animated.View entering={FadeInDown.delay(100).duration(350)} style={st.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterScroll}>
                  {FILTERS.map(f => {
                    const isActive = activeFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        style={[st.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && st.filterChipActive]}
                        onPress={() => { Haptics.selectionAsync(); setActiveFilter(f.id); }}
                      >
                        <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                        <Text style={[st.filterLabel, { color: colors.textSecondary }, isActive && { color: '#D4AF37' }]}>{f.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Animated.View>

              <View style={st.sectionHeader}>
                <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>
                  {activeFilter === 'all' ? 'All Master Chefs' : `${FILTERS.find(f => f.id === activeFilter)?.label || ''} Chefs`}
                </Text>
                <Text style={[st.sectionCount, { color: colors.textMuted }]}>{filteredChefs.length} chefs</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={st.emptyState}>
              <Text style={{ fontSize: 48 }}>🍳</Text>
              <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>No chefs found</Text>
              <Text style={[st.emptySub, { color: colors.textMuted }]}>Try a different filter</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingBottom: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerCoinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.10)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  headerCoinText: { fontSize: 13, fontWeight: '900', color: '#D4AF37' },
  heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 10 },
  heroSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  heroStats: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 14, borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, width: '100%', justifyContent: 'space-around',
  },
  heroStatItem: { alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: 18, fontWeight: '900' },
  heroStatLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroDivider: { width: 1, height: 28 },

  // Token Economy Banner
  tokenBanner: { marginHorizontal: 20, padding: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  tokenBannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tokenBannerTitle: { fontSize: 15, fontWeight: '800' },
  tokenBannerSub: { fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 2 },
  tokenPriceRow: { flexDirection: 'row', gap: 6 },
  tokenPriceItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 10 },
  tokenPriceLabel: { fontSize: 11, fontWeight: '800' },
  tokenPriceDesc: { fontSize: 8, fontWeight: '600' },

  // Filters
  filterSection: { marginTop: 12 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
  },
  filterChipActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.30)' },
  filterLabel: { fontSize: 13, fontWeight: '700' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCount: { fontSize: 12, fontWeight: '600' },

  // Chef Card
  chefCard: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 22, borderWidth: 1,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  chefCover: { width: '100%', height: 150, position: 'relative' },
  specialtyBadge: { position: 'absolute', bottom: 12, left: 12, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  specialtyText: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  ratingBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  tokenBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.90)',
  },
  tokenBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  chefInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14,
  },
  chefInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, overflow: 'hidden', position: 'relative' },
  avatar: { width: '100%', height: '100%' },
  verifiedIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  chefTextBlock: { flex: 1, gap: 1 },
  chefName: { fontSize: 15, fontWeight: '800' },
  chefHandle: { fontSize: 12, fontWeight: '500' },
  followBtn: { borderRadius: 20, overflow: 'hidden', minWidth: 86 },
  followBtnGrad: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  followBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },

  chefTagline: { paddingHorizontal: 16, paddingTop: 10, fontSize: 12, fontWeight: '500', lineHeight: 18 },

  cuisineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  cuisineTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  cuisineText: { fontSize: 10, fontWeight: '700', color: '#D4AF37' },

  dishesSection: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  dishesSectionTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dishesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dishChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  dishChipText: { fontSize: 11, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginHorizontal: 16, marginTop: 14, paddingTop: 14, borderTopWidth: 1,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 24 },

  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14 },
});
