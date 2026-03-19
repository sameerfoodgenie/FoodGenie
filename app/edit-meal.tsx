import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useMeals } from '../hooks/useMeals';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';
import { MealEntry, MealSource, MealType } from '../contexts/MealContext';
import { getMealInsight, POPULAR_DISHES, ORDER_PLATFORMS } from '../services/mealInsights';

const MEAL_TYPES: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: '☀️' },
  { id: 'lunch', label: 'Lunch', icon: '🍽' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snack', icon: '🍿' },
];

const QUICK_TAGS = [
  { id: 'healthy', label: 'Healthy', icon: '💚' },
  { id: 'cheat', label: 'Cheat', icon: '🍕' },
  { id: 'high_protein', label: 'High Protein', icon: '💪' },
  { id: 'oily', label: 'Oily', icon: '🫠' },
];

function getAutoMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

export default function EditMealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const { addMeal } = useMeals();
  const { allRestaurants } = useApp();
  const { showAlert } = useAlert();

  // State
  const [dishName, setDishName] = useState('');
  const [source, setSource] = useState<MealSource | null>(null);
  const [mealType, setMealType] = useState<MealType>(getAutoMealType());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [showDishSuggestions, setShowDishSuggestions] = useState(false);
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(false);
  const [step, setStep] = useState<'dish' | 'source' | 'details'>('dish');

  // Filter dish suggestions
  const filteredDishes = useMemo(() => {
    if (!dishName.trim()) return POPULAR_DISHES.slice(0, 12);
    const lower = dishName.toLowerCase();
    return POPULAR_DISHES.filter(d => d.toLowerCase().includes(lower)).slice(0, 8);
  }, [dishName]);

  // Filter restaurants
  const filteredRestaurants = useMemo(() => {
    const list = allRestaurants.map(r => r.name);
    if (!restaurantSearch.trim()) return list.slice(0, 10);
    const lower = restaurantSearch.toLowerCase();
    return list.filter(r => r.toLowerCase().includes(lower)).slice(0, 8);
  }, [restaurantSearch, allRestaurants]);

  const toggleTag = useCallback((tagId: string) => {
    Haptics.selectionAsync();
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleSelectDish = useCallback((name: string) => {
    Haptics.selectionAsync();
    setDishName(name);
    setShowDishSuggestions(false);
    setStep('source');
  }, []);

  const handleSelectSource = useCallback((s: MealSource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSource(s);
    if (s === 'home_cooked') {
      setStep('details');
    } else {
      setShowRestaurantSearch(true);
      setStep('details');
    }
  }, []);

  const handleSelectRestaurant = useCallback((name: string) => {
    Haptics.selectionAsync();
    setRestaurantName(name);
    setRestaurantSearch(name);
    setShowRestaurantSearch(false);
  }, []);

  const handleSelectPlatform = useCallback((id: string) => {
    Haptics.selectionAsync();
    setPlatform(id);
  }, []);

  const canSubmit = dishName.trim().length > 0 && source !== null;

  const handleAddToday = useCallback(() => {
    if (!canSubmit) {
      showAlert('Missing Info', 'Please select a dish name and source');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const nutrition = getMealInsight(dishName, source as string, selectedTags);

    const meal: MealEntry = {
      id: Date.now().toString(),
      name: dishName,
      healthScore: nutrition.healthScore,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      insight: nutrition.insight,
      imageUri: params.imageUri || null,
      timestamp: Date.now(),
      source: source as MealSource,
      mealType,
      restaurantName: restaurantName || undefined,
      platform: platform || undefined,
      tags: selectedTags,
    };

    addMeal(meal);

    // Navigate to food insight
    router.replace({
      pathname: '/food-insight',
      params: {
        imageUri: params.imageUri || '',
        name: dishName,
        healthScore: String(nutrition.healthScore),
        calories: String(nutrition.calories),
        protein: String(nutrition.protein),
        carbs: String(nutrition.carbs),
        fat: String(nutrition.fat),
        insight: nutrition.insight,
        alreadyAdded: 'true',
      },
    });
  }, [canSubmit, dishName, source, selectedTags, mealType, restaurantName, platform, params.imageUri, addMeal, router, showAlert]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
              >
                <MaterialIcons name="close" size={22} color={theme.textPrimary} />
              </Pressable>
              <Text style={styles.headerTitle}>Log Meal</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Photo preview */}
            {params.imageUri ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.photoSection}>
                <Image source={{ uri: params.imageUri }} style={styles.photoPreview} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.7)']}
                  style={styles.photoGradient}
                />
              </Animated.View>
            ) : null}

            {/* ─── STEP 1: Dish Name ─── */}
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={styles.sectionLabel}>What did you eat?</Text>
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={theme.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={dishName}
                  onChangeText={(t) => {
                    setDishName(t);
                    setShowDishSuggestions(true);
                  }}
                  placeholder="Search or type dish name"
                  placeholderTextColor={theme.textMuted}
                  onFocus={() => setShowDishSuggestions(true)}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    setShowDishSuggestions(false);
                    if (dishName.trim()) setStep('source');
                  }}
                />
                {dishName.length > 0 ? (
                  <Pressable onPress={() => { setDishName(''); setShowDishSuggestions(true); }}>
                    <MaterialIcons name="close" size={18} color={theme.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              {/* Suggestions */}
              {showDishSuggestions ? (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.suggestionsWrap}>
                  {!dishName.trim() ? (
                    <Text style={styles.suggestLabel}>Popular dishes</Text>
                  ) : null}
                  <View style={styles.chipGrid}>
                    {filteredDishes.map((dish) => (
                      <Pressable
                        key={dish}
                        style={({ pressed }) => [
                          styles.dishChip,
                          dishName === dish && styles.dishChipSelected,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => handleSelectDish(dish)}
                      >
                        <Text style={[
                          styles.dishChipText,
                          dishName === dish && styles.dishChipTextSelected,
                        ]}>
                          {dish}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              ) : null}
            </Animated.View>

            {/* ─── STEP 2: Source ─── */}
            {(step === 'source' || step === 'details') ? (
              <Animated.View entering={FadeInUp.duration(350)}>
                <Text style={styles.sectionLabel}>Where was it from?</Text>
                <View style={styles.sourceGrid}>
                  {([
                    { id: 'home_cooked' as MealSource, label: 'Home Cooked', icon: 'home', emoji: '🏠' },
                    { id: 'restaurant' as MealSource, label: 'Restaurant', icon: 'restaurant', emoji: '🍽' },
                    { id: 'online_order' as MealSource, label: 'Online Order', icon: 'delivery-dining', emoji: '📦' },
                  ]).map((s) => (
                    <Pressable
                      key={s.id}
                      style={({ pressed }) => [
                        styles.sourceCard,
                        source === s.id && styles.sourceCardSelected,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                      ]}
                      onPress={() => handleSelectSource(s.id)}
                    >
                      <Text style={styles.sourceEmoji}>{s.emoji}</Text>
                      <Text style={[
                        styles.sourceLabel,
                        source === s.id && styles.sourceLabelSelected,
                      ]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Platform selection for online order */}
                {source === 'online_order' ? (
                  <Animated.View entering={FadeInDown.duration(250)} style={styles.platformSection}>
                    <Text style={styles.subLabel}>Ordered via</Text>
                    <View style={styles.platformGrid}>
                      {ORDER_PLATFORMS.map((p) => (
                        <Pressable
                          key={p.id}
                          style={({ pressed }) => [
                            styles.platformChip,
                            platform === p.id && { borderColor: p.color, backgroundColor: `${p.color}15` },
                            pressed && { opacity: 0.8 },
                          ]}
                          onPress={() => handleSelectPlatform(p.id)}
                        >
                          <MaterialIcons name={p.icon as any} size={18} color={platform === p.id ? p.color : theme.textMuted} />
                          <Text style={[
                            styles.platformText,
                            platform === p.id && { color: p.color, fontWeight: '700' },
                          ]}>
                            {p.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </Animated.View>
                ) : null}

                {/* Restaurant search */}
                {(source === 'restaurant' || source === 'online_order') ? (
                  <Animated.View entering={FadeInDown.duration(250)} style={styles.restaurantSection}>
                    <Text style={styles.subLabel}>Restaurant name</Text>
                    <View style={styles.searchContainer}>
                      <MaterialIcons name="storefront" size={18} color={theme.textMuted} />
                      <TextInput
                        style={styles.searchInput}
                        value={restaurantSearch}
                        onChangeText={(t) => {
                          setRestaurantSearch(t);
                          setRestaurantName(t);
                          setShowRestaurantSearch(true);
                        }}
                        placeholder="Search restaurant"
                        placeholderTextColor={theme.textMuted}
                        onFocus={() => setShowRestaurantSearch(true)}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          setShowRestaurantSearch(false);
                          setRestaurantName(restaurantSearch);
                        }}
                      />
                    </View>
                    {showRestaurantSearch && restaurantSearch.length > 0 ? (
                      <View style={styles.restDropdown}>
                        {filteredRestaurants.slice(0, 5).map((r) => (
                          <Pressable
                            key={r}
                            style={({ pressed }) => [styles.restItem, pressed && { backgroundColor: theme.backgroundTertiary }]}
                            onPress={() => handleSelectRestaurant(r)}
                          >
                            <MaterialIcons name="restaurant" size={16} color={theme.textMuted} />
                            <Text style={styles.restItemText} numberOfLines={1}>{r}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </Animated.View>
                ) : null}
              </Animated.View>
            ) : null}

            {/* ─── STEP 3: Optional Details ─── */}
            {step === 'details' ? (
              <Animated.View entering={FadeInUp.delay(100).duration(350)}>
                {/* Meal Type */}
                <Text style={styles.sectionLabel}>Meal type</Text>
                <View style={styles.mealTypeGrid}>
                  {MEAL_TYPES.map((mt) => (
                    <Pressable
                      key={mt.id}
                      style={({ pressed }) => [
                        styles.mealTypeChip,
                        mealType === mt.id && styles.mealTypeSelected,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setMealType(mt.id); }}
                    >
                      <Text style={styles.mealTypeIcon}>{mt.icon}</Text>
                      <Text style={[
                        styles.mealTypeLabel,
                        mealType === mt.id && styles.mealTypeLabelSelected,
                      ]}>
                        {mt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Quick Tags */}
                <Text style={styles.sectionLabel}>Quick tags</Text>
                <View style={styles.tagGrid}>
                  {QUICK_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag.id);
                    return (
                      <Pressable
                        key={tag.id}
                        style={({ pressed }) => [
                          styles.tagChip,
                          active && styles.tagChipActive,
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => toggleTag(tag.id)}
                      >
                        <Text style={styles.tagIcon}>{tag.icon}</Text>
                        <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>
                          {tag.label}
                        </Text>
                        {active ? (
                          <MaterialIcons name="check-circle" size={16} color={theme.primary} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            ) : null}
          </ScrollView>

          {/* Bottom CTA */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                !canSubmit && styles.addBtnDisabled,
                pressed && canSubmit && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleAddToday}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={canSubmit ? theme.gradients.cameraBtn : [theme.backgroundTertiary, theme.backgroundTertiary]}
                style={styles.addBtnGradient}
              >
                <MaterialIcons name="add" size={22} color={canSubmit ? theme.textOnPrimary : theme.textMuted} />
                <Text style={[styles.addBtnText, !canSubmit && { color: theme.textMuted }]}>Add to Today</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  // Photo
  photoSection: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // Section
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 20,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 16,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    padding: 0,
  },

  // Suggestions
  suggestionsWrap: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  suggestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dishChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dishChipSelected: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.4)',
  },
  dishChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  dishChipTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },

  // Source
  sourceGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  sourceCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  sourceCardSelected: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  sourceEmoji: { fontSize: 28 },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  sourceLabelSelected: { color: theme.primary, fontWeight: '700' },

  // Platform
  platformSection: {},
  platformGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  platformChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  platformText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // Restaurant
  restaurantSection: {},
  restDropdown: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  restItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  restItemText: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
  },

  // Meal type
  mealTypeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  mealTypeChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  mealTypeSelected: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  mealTypeIcon: { fontSize: 18 },
  mealTypeLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  mealTypeLabelSelected: { color: theme.primary, fontWeight: '700' },

  // Tags
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tagChipActive: {
    borderColor: 'rgba(74,222,128,0.4)',
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  tagIcon: { fontSize: 14 },
  tagLabel: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  tagLabelActive: { color: theme.primary, fontWeight: '600' },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnDisabled: { opacity: 0.6 },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  addBtnText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
});
