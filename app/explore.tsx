import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { mockDishes, mockRestaurants, Dish, Restaurant } from '../services/mockData';
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
  keywords: string[];
}

const DISH_CATEGORIES: DishCategory[] = [
  {
    id: 'biryani',
    name: 'Biryani',
    emoji: '🍚',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    keywords: ['biryani', 'dum', 'pulao'],
  },
  {
    id: 'pizza',
    name: 'Pizza',
    emoji: '🍕',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    keywords: ['pizza'],
  },
  {
    id: 'north-indian',
    name: 'North Indian',
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    keywords: ['butter', 'paneer', 'dal', 'roti', 'naan', 'chole', 'rajma', 'paratha', 'tikka'],
  },
  {
    id: 'chinese',
    name: 'Chinese',
    emoji: '🥡',
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80',
    keywords: ['manchurian', 'noodle', 'chinese', 'fried rice', 'schezwan'],
  },
  {
    id: 'healthy',
    name: 'Healthy',
    emoji: '🥗',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    keywords: ['healthy', 'salad', 'protein', 'light', 'palak', 'iron'],
  },
  {
    id: 'street-food',
    name: 'Street Food',
    emoji: '🌮',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    keywords: ['street', 'chaat', 'pav', 'bhature', 'keema pav', 'vada'],
  },
  {
    id: 'desserts',
    name: 'Desserts',
    emoji: '🍰',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
    keywords: ['dessert', 'sweet', 'gulab', 'cake', 'ice cream', 'kheer'],
  },
  {
    id: 'beverages',
    name: 'Beverages',
    emoji: '🥤',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
    keywords: ['lassi', 'chai', 'juice', 'shake', 'coffee', 'tea'],
  },
  {
    id: 'south-indian',
    name: 'South Indian',
    emoji: '🫓',
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80',
    keywords: ['dosa', 'idli', 'sambar', 'south', 'uttapam', 'rasam'],
  },
  {
    id: 'thalis',
    name: 'Thalis',
    emoji: '🍱',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
    keywords: ['thali', 'combo', 'meal', 'chawal', 'complete'],
  },
];

const EXTENDED_RESTAURANTS: Restaurant[] = [
  ...mockRestaurants,
  {
    id: 'r6',
    name: 'Kashmir Kitchen',
    cuisine: 'Kashmiri',
    image: require('../assets/images/dish-biryani.png'),
    chefScore: 90,
    hygieneScore: 92,
    rating: 4.8,
    deliveryTime: '35-40 min',
    priceRange: '₹300-500',
    lastAudit: '1 week ago',
    improvements: ['Authentic Kashmiri spice sourcing'],
    featuredDishes: ['7'],
  },
  {
    id: 'r7',
    name: 'Coastal Flavors',
    cuisine: 'Seafood',
    image: require('../assets/images/dish-butter-chicken.png'),
    chefScore: 91,
    hygieneScore: 93,
    rating: 4.7,
    deliveryTime: '30-35 min',
    priceRange: '₹250-500',
    lastAudit: '5 days ago',
    improvements: ['Daily fresh catch procurement'],
    featuredDishes: ['9', '17'],
  },
  {
    id: 'r8',
    name: 'Home Style Kitchen',
    cuisine: 'Home Style',
    image: require('../assets/images/dish-veg-thali.png'),
    chefScore: 85,
    hygieneScore: 87,
    rating: 4.5,
    deliveryTime: '20-25 min',
    priceRange: '₹100-250',
    lastAudit: '2 weeks ago',
    improvements: ['Home-cooked recipes, no MSG'],
    featuredDishes: ['11', '18'],
  },
];

function getDishesForCategory(category: DishCategory): Dish[] {
  return mockDishes.filter((dish) => {
    const nameLower = dish.name.toLowerCase();
    const tagLower = dish.tags.map((t) => t.toLowerCase()).join(' ');
    const restLower = dish.restaurant.toLowerCase();
    const search = `${nameLower} ${tagLower} ${restLower}`;
    return category.keywords.some((kw) => search.includes(kw));
  });
}

export default function ExploreScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useApp();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderContext, setOrderContext] = useState<{ dish: string; restaurant: string; price: number } | null>(null);

  const preferredPartnerId = preferences.preferredPartnerApp || null;
  const preferredPartner = preferredPartnerId ? getPartnerById(preferredPartnerId) : null;

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

  const handleCategoryPress = useCallback(
    (category: DishCategory) => {
      Haptics.selectionAsync();
      setSelectedCategory(category);
    },
    [],
  );

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

  const topRestaurants = EXTENDED_RESTAURANTS.filter((r) => r.rating >= 4.5).sort(
    (a, b) => b.rating - a.rating,
  );

  // Category detail view
  if (selectedCategory) {
    const dishes = getDishesForCategory(selectedCategory);
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
            <Text style={styles.emptySubtitle}>
              We are adding more dishes to this category soon.
            </Text>
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
                  style={({ pressed }) => [
                    styles.dishRow,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => handleDishPress(item.id)}
                >
                  <Image
                    source={item.image}
                    style={styles.dishRowImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.dishRowContent}>
                    <Text style={styles.dishRowName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.dishRowRestaurant} numberOfLines={1}>
                      {item.restaurant}
                    </Text>
                    <View style={styles.dishRowMeta}>
                      <MaterialIcons name="star" size={13} color={theme.accent} />
                      <Text style={styles.dishRowRating}>{item.rating}</Text>
                      <Text style={styles.dishRowDot}>·</Text>
                      <Text style={styles.dishRowTime}>{item.deliveryTime}</Text>
                      <Text style={styles.dishRowDot}>·</Text>
                      <Text style={styles.dishRowSpice}>
                        {'🌶️'.repeat(item.spiceLevel)}
                      </Text>
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

  // Main explore view
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Browse dishes and restaurants</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Browse by Dish ─── */}
        <Animated.View entering={FadeIn.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Browse by dish</Text>
          <Text style={styles.sectionSubtitle}>
            Find exactly what you are craving
          </Text>
        </Animated.View>

        <View style={styles.categoryGrid}>
          {DISH_CATEGORIES.map((cat, i) => (
            <Animated.View
              key={cat.id}
              entering={FadeInDown.delay(150 + i * 60).duration(350)}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.categoryTile,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => handleCategoryPress(cat)}
              >
                <Image
                  source={{ uri: cat.image }}
                  style={styles.categoryImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.categoryOverlay} />
                <View style={styles.categoryLabelBlock}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* ─── Top Rated & Reliable ─── */}
        <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.restaurantSection}>
          <Text style={styles.sectionTitle}>Top Rated & Reliable</Text>
          <Text style={styles.sectionSubtitle}>
            Consistently great kitchens you can trust
          </Text>
        </Animated.View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.restaurantScroll}
        >
          {topRestaurants.map((rest, i) => (
            <Animated.View
              key={rest.id}
              entering={FadeInRight.delay(550 + i * 90).duration(400)}
            >
              <View style={styles.restaurantCard}>
                <Image
                  source={rest.image}
                  style={styles.restaurantImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.restaurantBody}>
                  <View style={styles.restaurantNameRow}>
                    <Text style={styles.restaurantName} numberOfLines={1}>
                      {rest.name}
                    </Text>
                    {rest.chefScore >= 90 ? (
                      <MaterialIcons name="verified" size={16} color={theme.success} />
                    ) : null}
                  </View>
                  <Text style={styles.restaurantCuisine}>{rest.cuisine}</Text>
                  <View style={styles.restaurantMeta}>
                    <View style={styles.ratingBadge}>
                      <MaterialIcons name="star" size={13} color={theme.accent} />
                      <Text style={styles.ratingText}>{rest.rating}</Text>
                    </View>
                    <Text style={styles.restaurantDot}>·</Text>
                    <Text style={styles.restaurantTime}>{rest.deliveryTime}</Text>
                  </View>
                  <Text style={styles.restaurantPrice}>{rest.priceRange}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.exploreMenuBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      // Navigate to first featured dish as preview
                      const firstDish = rest.featuredDishes[0];
                      if (firstDish) {
                        router.push(`/dish/${firstDish}`);
                      }
                    }}
                  >
                    <MaterialIcons name="restaurant-menu" size={14} color={theme.primary} />
                    <Text style={styles.exploreMenuText}>Explore menu</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={{ height: 48 }} />
      </ScrollView>

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

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 32 },

  // Sections
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: TILE_GAP,
    marginBottom: 40,
  },
  categoryTile: {
    width: TILE_WIDTH,
    height: TILE_WIDTH * 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.18)',
    ...theme.shadows.card,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  categoryLabelBlock: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryEmoji: { fontSize: 18 },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Restaurant Section
  restaurantSection: { marginBottom: 4 },
  restaurantScroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 8 },
  restaurantCard: {
    width: 230,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.12)',
    ...theme.shadows.card,
  },
  restaurantImage: {
    width: '100%',
    height: 120,
  },
  restaurantBody: { padding: 14 },
  restaurantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    flex: 1,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 10,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: theme.primary },
  restaurantDot: { fontSize: 12, color: theme.textMuted },
  restaurantTime: { fontSize: 13, color: theme.textSecondary },
  restaurantPrice: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 14,
  },
  exploreMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    backgroundColor: 'rgba(251,191,36,0.06)',
  },
  exploreMenuText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  // Category Detail: Dish List
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
  dishRowImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  dishRowContent: { flex: 1 },
  dishRowName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  dishRowRestaurant: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  dishRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
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
  dishRowOriginal: {
    fontSize: 13,
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
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
  dishOrderText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
});
