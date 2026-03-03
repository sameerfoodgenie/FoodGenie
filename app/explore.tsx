import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { Dish, Restaurant } from '../services/mockData';
import { useApp } from '../contexts/AppContext';
import { getPartnerById, openPartnerWithSearch, recordPartnerRedirect } from '../services/partnerApps';
import { useAuth, useAlert } from '@/template';
import OrderPartnerSheet from '../components/OrderPartnerSheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TILE_GAP = 12;
const TILE_WIDTH = (SCREEN_WIDTH - 20 * 2 - TILE_GAP) / 2;

interface DishCategory {
  id: string;
  name: string;
  emoji: string;
  image: string;
  gradient: [string, string];
  keywords: string[];
}

const DISH_CATEGORIES: DishCategory[] = [
  {
    id: 'biryani',
    name: 'Biryani',
    emoji: '🍚',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    gradient: ['rgba(234,179,8,0.7)', 'rgba(202,138,4,0.9)'],
    keywords: ['biryani', 'dum', 'pulao'],
  },
  {
    id: 'pizza',
    name: 'Pizza & Fast Food',
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    gradient: ['rgba(239,68,68,0.6)', 'rgba(185,28,28,0.9)'],
    keywords: ['pizza', 'burger', 'fries', 'pasta', 'sandwich', 'momos', 'wrap'],
  },
  {
    id: 'north-indian',
    name: 'North Indian',
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    gradient: ['rgba(245,158,11,0.6)', 'rgba(180,83,9,0.9)'],
    keywords: ['north-indian', 'punjabi', 'paneer', 'dal', 'naan', 'roti', 'chole', 'rajma', 'paratha'],
  },
  {
    id: 'chinese',
    name: 'Chinese',
    emoji: '🥡',
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80',
    gradient: ['rgba(220,38,38,0.6)', 'rgba(153,27,27,0.9)'],
    keywords: ['chinese', 'noodles', 'manchurian', 'schezwan', 'hakka', 'fried rice'],
  },
  {
    id: 'healthy',
    name: 'Healthy',
    emoji: '🥗',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    gradient: ['rgba(34,197,94,0.6)', 'rgba(21,128,61,0.9)'],
    keywords: ['healthy', 'high-protein', 'salad', 'smoothie', 'protein', 'quinoa', 'millet', 'sprout'],
  },
  {
    id: 'street-food',
    name: 'Street Food',
    emoji: '🌮',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    gradient: ['rgba(251,146,60,0.6)', 'rgba(194,65,12,0.9)'],
    keywords: ['street-food', 'chaat', 'pav bhaji', 'samosa', 'pani puri', 'vada pav', 'bhel'],
  },
  {
    id: 'desserts',
    name: 'Desserts',
    emoji: '🍰',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
    gradient: ['rgba(168,85,247,0.6)', 'rgba(107,33,168,0.9)'],
    keywords: ['dessert', 'sweet', 'gulab', 'cake', 'jalebi', 'kheer', 'halwa', 'brownie'],
  },
  {
    id: 'beverages',
    name: 'Beverages',
    emoji: '🥤',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
    gradient: ['rgba(59,130,246,0.6)', 'rgba(29,78,216,0.9)'],
    keywords: ['beverage', 'juice', 'shake', 'coffee', 'chai', 'lassi', 'smoothie', 'buttermilk'],
  },
  {
    id: 'south-indian',
    name: 'South Indian',
    emoji: '🫓',
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80',
    gradient: ['rgba(234,179,8,0.6)', 'rgba(161,98,7,0.9)'],
    keywords: ['south-indian', 'dosa', 'idli', 'sambar', 'uttapam', 'pongal', 'vada'],
  },
  {
    id: 'thalis',
    name: 'Thalis',
    emoji: '🍱',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
    gradient: ['rgba(245,158,11,0.7)', 'rgba(146,64,14,0.9)'],
    keywords: ['thali', 'combo', 'unlimited'],
  },
];

// Alternate tile heights for visual dynamism
const TILE_HEIGHTS = [TILE_WIDTH * 0.85, TILE_WIDTH * 1.0];

function getDishesForCategory(category: DishCategory, allDishes: Dish[]): Dish[] {
  return allDishes.filter((dish) => {
    const extra = dish as any;
    const rawTags: string[] = extra._rawTags || [];
    const catLower = (extra._category || '').toLowerCase();
    const nameLower = dish.name.toLowerCase();
    const searchText = `${nameLower} ${rawTags.join(' ')} ${catLower} ${dish.tags.join(' ').toLowerCase()}`;
    return category.keywords.some((kw) => searchText.includes(kw));
  });
}

// VEG TYPE EMOJI
function vegTypeLabel(vt: string): { label: string; color: string } {
  switch (vt) {
    case 'pure_veg':
      return { label: '🟢 Pure Veg', color: '#22C55E' };
    case 'veg_egg':
      return { label: '🟡 Veg & Egg', color: '#EAB308' };
    case 'nonveg':
      return { label: '🔴 Non-Veg', color: '#EF4444' };
    default:
      return { label: '🍽️ Multi', color: theme.textSecondary };
  }
}

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const { preferences, updatePreferences, allDishes, allRestaurants, dataLoaded } = useApp();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<'dishes' | 'restaurants'>(
    params.view === 'restaurants' ? 'restaurants' : 'dishes',
  );
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderContext, setOrderContext] = useState<{ dish: string; restaurant: string; price: number } | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const preferredPartnerId = preferences.preferredPartnerApp || null;
  const preferredPartner = preferredPartnerId ? getPartnerById(preferredPartnerId) : null;

  // Dish count per category (for badge)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of DISH_CATEGORIES) {
      counts[cat.id] = getDishesForCategory(cat, allDishes).length;
    }
    return counts;
  }, [allDishes]);

  // Unique areas for filter
  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRestaurants) {
      const extra = r as any;
      const area = extra._area || (r as any).area;
      if (area) set.add(area);
    }
    return Array.from(set).sort();
  }, [allRestaurants]);

  // Filtered restaurants
  const filteredRestaurants = useMemo(() => {
    let list = [...allRestaurants];
    if (areaFilter) {
      list = list.filter((r) => {
        const extra = r as any;
        return (extra._area || '') === areaFilter;
      });
    }
    return list.sort((a, b) => b.rating - a.rating);
  }, [allRestaurants, areaFilter]);

  // Count dishes per restaurant
  const restaurantDishCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of allDishes) {
      counts[d.restaurantId] = (counts[d.restaurantId] || 0) + 1;
    }
    return counts;
  }, [allDishes]);

  const handleOrderDish = useCallback(
    async (dishName: string, restaurantName: string, price: number) => {
      Haptics.selectionAsync();
      if (preferredPartner) {
        if (user?.id) {
          recordPartnerRedirect(user.id, preferredPartner.id).catch(() => {});
        }
        updatePreferences({ lastPartnerUsed: preferredPartner.id });
        const success = await openPartnerWithSearch(preferredPartner, restaurantName, dishName);
        if (!success) {
          showAlert('Could not open app', 'Please install the app or try the web version.');
        }
      } else {
        setOrderContext({ dish: dishName, restaurant: restaurantName, price });
        setShowOrderSheet(true);
      }
    },
    [preferredPartner, user?.id, updatePreferences, showAlert],
  );

  const handleCategoryPress = useCallback((category: DishCategory) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
  }, []);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      router.back();
    }
  }, [selectedCategory, router]);

  const handleDishPress = useCallback(
    (dishId: string) => {
      Haptics.selectionAsync();
      router.push(`/dish/${dishId}`);
    },
    [router],
  );

  // Loading state
  if (!dataLoaded) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textMuted, marginTop: 12, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Category detail view ──
  if (selectedCategory) {
    const dishes = getDishesForCategory(selectedCategory, allDishes);
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>
              {selectedCategory.emoji} {selectedCategory.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'} found
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {dishes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No dishes yet</Text>
            <Text style={styles.emptySubtitle}>We are adding more dishes to this category soon.</Text>
          </View>
        ) : (
          <FlatList
            data={dishes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.dishList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 80).duration(350)}>
                <Pressable
                  style={({ pressed }) => [styles.dishRow, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                  onPress={() => handleDishPress(item.id)}
                >
                  <Image source={item.image} style={styles.dishRowImage} contentFit="cover" transition={200} />
                  <View style={styles.dishRowContent}>
                    <Text style={styles.dishRowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.dishRowRestaurant} numberOfLines={1}>{item.restaurant}</Text>
                    <View style={styles.dishRowMeta}>
                      <MaterialIcons name="star" size={13} color={theme.accent} />
                      <Text style={styles.dishRowRating}>{item.rating}</Text>
                      <Text style={styles.dishRowDot}>·</Text>
                      <Text style={styles.dishRowTime}>{item.deliveryTime}</Text>
                      <Text style={styles.dishRowDot}>·</Text>
                      <Text style={styles.dishRowSpice}>{'🌶️'.repeat(item.spiceLevel)}</Text>
                    </View>
                    <View style={styles.dishRowTagsRow}>
                      {item.tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.dishRowTag}>
                          <Text style={styles.dishRowTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.dishRowRight}>
                    <Text style={styles.dishRowPrice}>₹{item.price}</Text>
                    {item.originalPrice > item.price ? (
                      <Text style={styles.dishRowOriginal}>₹{item.originalPrice}</Text>
                    ) : null}
                    <Pressable
                      style={({ pressed }) => [styles.dishOrderBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => handleOrderDish(item.name, item.restaurant, item.price)}
                    >
                      <MaterialIcons name="open-in-new" size={12} color={theme.primary} />
                      <Text style={styles.dishOrderText}>Order</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Main explore view ──
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>
            {allRestaurants.length} restaurants · {allDishes.length} dishes
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'dishes' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('dishes'); }}
        >
          <MaterialIcons name="restaurant-menu" size={16} color={activeTab === 'dishes' ? theme.primary : theme.textMuted} />
          <Text style={[styles.tabText, activeTab === 'dishes' && styles.tabTextActive]}>Dishes</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'restaurants' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('restaurants'); }}
        >
          <MaterialIcons name="storefront" size={16} color={activeTab === 'restaurants' ? theme.primary : theme.textMuted} />
          <Text style={[styles.tabText, activeTab === 'restaurants' && styles.tabTextActive]}>Restaurants</Text>
        </Pressable>
      </View>

      {activeTab === 'dishes' ? (
        /* ─── DISHES TAB ─── */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Text style={styles.sectionTitle}>Browse by dish</Text>
            <Text style={styles.sectionSubtitle}>Find exactly what you are craving</Text>
          </Animated.View>

          <View style={styles.categoryGrid}>
            {DISH_CATEGORIES.map((cat, i) => {
              const height = TILE_HEIGHTS[i % 2 === 0 ? 0 : 1];
              const count = categoryCounts[cat.id] || 0;
              return (
                <Animated.View key={cat.id} entering={FadeInDown.delay(150 + i * 60).duration(350)}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.categoryTile,
                      { height },
                      pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => handleCategoryPress(cat)}
                  >
                    <Image source={{ uri: cat.image }} style={styles.categoryImage} contentFit="cover" transition={200} />
                    {/* Gradient overlay */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.25)', cat.gradient[1]]}
                      locations={[0, 0.4, 1]}
                      style={styles.categoryGradient}
                    />
                    {/* Top-right count badge */}
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{count}</Text>
                    </View>
                    {/* Bottom label */}
                    <View style={styles.categoryLabelBlock}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <View style={styles.categoryLabelTextBlock}>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        <Text style={styles.categoryCountSub}>
                          {count} {count === 1 ? 'dish' : 'dishes'}
                        </Text>
                      </View>
                    </View>
                    {/* Subtle gold corner accent */}
                    <View style={styles.categoryCornerAccent} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
          <View style={{ height: 48 }} />
        </ScrollView>
      ) : (
        /* ─── RESTAURANTS TAB ─── */
        <View style={{ flex: 1 }}>
          {/* Area filter chips */}
          <View style={styles.filterBarOuter}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBar}
            >
              <Pressable
                style={[styles.filterChip, !areaFilter && styles.filterChipActive]}
                onPress={() => { Haptics.selectionAsync(); setAreaFilter(null); }}
              >
                <Text style={[styles.filterChipText, !areaFilter && styles.filterChipTextActive]}>All</Text>
              </Pressable>
              {areas.map((area) => (
                <Pressable
                  key={area}
                  style={[styles.filterChip, areaFilter === area && styles.filterChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setAreaFilter(area === areaFilter ? null : area); }}
                >
                  <Text style={[styles.filterChipText, areaFilter === area && styles.filterChipTextActive]}>{area}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredRestaurants}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.restGridRow}
            contentContainerStyle={styles.restGridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const extra = item as any;
              const area = extra._area || '';
              const vegInfo = vegTypeLabel(extra._vegType || '');
              const dishCount = restaurantDishCounts[item.id] || 0;
              const tier = extra._reliabilityTier || 'medium';
              const isVerified = extra._isVerified || false;

              return (
                <Animated.View entering={FadeInDown.delay(index * 60).duration(350)} style={styles.restCardWrapper}>
                  <Pressable
                    style={({ pressed }) => [styles.restCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const firstDish = item.featuredDishes[0];
                      if (firstDish) router.push(`/dish/${firstDish}`);
                    }}
                  >
                    {/* Image */}
                    <View style={styles.restCardImageWrap}>
                      <Image source={item.image} style={styles.restCardImage} contentFit="cover" transition={200} />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.restCardImgGradient}
                      />
                      {/* Rating badge */}
                      <View style={styles.restRatingBadge}>
                        <MaterialIcons name="star" size={11} color="#FFF" />
                        <Text style={styles.restRatingText}>{item.rating}</Text>
                      </View>
                      {/* Tier badge */}
                      {tier === 'high' ? (
                        <View style={styles.restTierBadge}>
                          <MaterialIcons name="workspace-premium" size={10} color={theme.primary} />
                        </View>
                      ) : null}
                    </View>

                    {/* Info */}
                    <View style={styles.restCardBody}>
                      <View style={styles.restNameRow}>
                        <Text style={styles.restCardName} numberOfLines={1}>{item.name}</Text>
                        {isVerified ? (
                          <MaterialIcons name="verified" size={13} color={theme.success} />
                        ) : null}
                      </View>
                      <Text style={styles.restCardCuisine} numberOfLines={1}>{item.cuisine}</Text>
                      {area ? (
                        <View style={styles.restAreaRow}>
                          <MaterialIcons name="location-on" size={11} color={theme.textMuted} />
                          <Text style={styles.restAreaText} numberOfLines={1}>{area}</Text>
                        </View>
                      ) : null}
                      <View style={styles.restCardFooter}>
                        <Text style={[styles.restVegLabel, { color: vegInfo.color }]}>{vegInfo.label}</Text>
                        <Text style={styles.restDishCount}>{dishCount} dishes</Text>
                      </View>
                      <Text style={styles.restCardPrice}>{item.priceRange}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏪</Text>
                <Text style={styles.emptyTitle}>No restaurants found</Text>
                <Text style={styles.emptySubtitle}>Try a different area filter.</Text>
              </View>
            }
          />
        </View>
      )}

      <OrderPartnerSheet
        visible={showOrderSheet}
        onClose={() => setShowOrderSheet(false)}
        restaurantName={orderContext?.restaurant || ''}
        dishName={orderContext?.dish || ''}
        dishPrice={orderContext?.price}
        preferredPartnerId={preferredPartnerId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(63,63,70,0.25)',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  tabTextActive: { color: theme.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 32 },

  // Sections
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, paddingHorizontal: 20 },
  sectionSubtitle: { fontSize: 14, color: theme.textSecondary, paddingHorizontal: 20, marginTop: 4, marginBottom: 20 },

  // ── Dynamic Category Grid ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: TILE_GAP,
    marginBottom: 24,
  },
  categoryTile: {
    width: TILE_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryLabelBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryEmoji: { fontSize: 20 },
  categoryLabelTextBlock: { flex: 1 },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryCountSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
    fontWeight: '500',
  },
  categoryCornerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'rgba(251,191,36,0.15)',
  },

  // ── Area filter bar ──
  filterBarOuter: {
    minHeight: 52,
    paddingVertical: 8,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.3)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.4)',
  },
  filterChipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  filterChipTextActive: { color: theme.primary, fontWeight: '600' },

  // ── Restaurant Grid ──
  restGridContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 12 },
  restGridRow: { justifyContent: 'space-between' },
  restCardWrapper: { width: (SCREEN_WIDTH - 16 * 2 - 12) / 2 },
  restCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
    ...theme.shadows.card,
  },
  restCardImageWrap: { height: 110, position: 'relative' },
  restCardImage: { width: '100%', height: '100%' },
  restCardImgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  restRatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245,158,11,0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  restRatingText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  restTierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  restCardBody: { padding: 12 },
  restNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  restCardName: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  restCardCuisine: { fontSize: 11, color: theme.textMuted, marginBottom: 4 },
  restAreaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  restAreaText: { fontSize: 11, color: theme.textSecondary, flex: 1 },
  restCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  restVegLabel: { fontSize: 10, fontWeight: '600' },
  restDishCount: { fontSize: 10, color: theme.textMuted, fontWeight: '500' },
  restCardPrice: { fontSize: 11, color: theme.textSecondary, fontWeight: '500' },

  // ── Category Detail: Dish List ──
  dishList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 10 },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.08)',
  },
  dishRowImage: { width: 80, height: 80, borderRadius: 14 },
  dishRowContent: { flex: 1 },
  dishRowName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  dishRowRestaurant: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  dishRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  dishRowRating: { fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  dishRowDot: { fontSize: 10, color: theme.textMuted },
  dishRowTime: { fontSize: 12, color: theme.textSecondary },
  dishRowSpice: { fontSize: 11 },
  dishRowTagsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dishRowTag: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  dishRowTagText: { fontSize: 10, fontWeight: '600', color: theme.primary },
  dishRowRight: { alignItems: 'flex-end', gap: 2 },
  dishRowPrice: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  dishRowOriginal: { fontSize: 13, color: theme.textMuted, textDecorationLine: 'line-through' },
  dishOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    backgroundColor: 'rgba(251,191,36,0.06)',
  },
  dishOrderText: { fontSize: 11, fontWeight: '600', color: theme.primary },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
});
