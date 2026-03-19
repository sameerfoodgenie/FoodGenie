import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
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
import { usePosts } from '../contexts/PostContext';
import { useApp } from '../contexts/AppContext';
import { useAuth, useAlert } from '@/template';
import { POPULAR_DISHES, ORDER_PLATFORMS } from '../services/mealInsights';

type MealSource = 'home_cooked' | 'restaurant' | 'online_order';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: '☀️' },
  { id: 'lunch', label: 'Lunch', icon: '🍽' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snack', icon: '🍿' },
];

function getAutoMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const { addPost } = usePosts();
  const { allRestaurants } = useApp();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [dishName, setDishName] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState<MealSource | null>(null);
  const [mealType, setMealType] = useState<MealType>(getAutoMealType());
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [taggedFriends, setTaggedFriends] = useState('');
  const [showDishSuggestions, setShowDishSuggestions] = useState(false);
  const [showRestaurantSearch, setShowRestaurantSearch] = useState(false);

  const filteredDishes = useMemo(() => {
    if (!dishName.trim()) return POPULAR_DISHES.slice(0, 10);
    const lower = dishName.toLowerCase();
    return POPULAR_DISHES.filter(d => d.toLowerCase().includes(lower)).slice(0, 8);
  }, [dishName]);

  const filteredRestaurants = useMemo(() => {
    const list = allRestaurants.map(r => r.name);
    if (!restaurantSearch.trim()) return list.slice(0, 8);
    const lower = restaurantSearch.toLowerCase();
    return list.filter(r => r.toLowerCase().includes(lower)).slice(0, 6);
  }, [restaurantSearch, allRestaurants]);

  const canPost = dishName.trim().length > 0;

  const handlePost = useCallback(() => {
    if (!canPost) {
      showAlert('Add Dish Name', 'Give your post a dish name before posting');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const username = user?.username || 'you';
    const initials = username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const friends = taggedFriends.split(',').map(f => f.trim()).filter(Boolean);

    addPost({
      userId: 'me',
      username,
      avatarInitials: initials || 'ME',
      imageUri: params.imageUri || null,
      dishName: dishName.trim(),
      caption: caption.trim(),
      location: location.trim() || (restaurantName ? restaurantName : ''),
      mealType,
      source: source || 'home_cooked',
      restaurantName: restaurantName || undefined,
      platform: platform || undefined,
      tags: [],
      taggedFriends: friends,
      timestamp: Date.now(),
    });

    showAlert('Posted!', 'Your meal has been shared');
    router.back();
  }, [canPost, user, dishName, caption, location, source, mealType, restaurantName, platform, taggedFriends, params.imageUri, addPost, router, showAlert]);

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
              <Text style={styles.headerTitle}>New Post</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.postHeaderBtn,
                  !canPost && { opacity: 0.4 },
                  pressed && canPost && { opacity: 0.8 },
                ]}
                onPress={handlePost}
                disabled={!canPost}
              >
                <Text style={styles.postHeaderText}>Share</Text>
              </Pressable>
            </View>

            {/* Photo preview */}
            {params.imageUri ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.photoSection}>
                <Image source={{ uri: params.imageUri }} style={styles.photoPreview} contentFit="cover" />
              </Animated.View>
            ) : (
              <View style={styles.noPhotoSection}>
                <Text style={{ fontSize: 48 }}>📷</Text>
                <Text style={styles.noPhotoText}>No photo selected</Text>
              </View>
            )}

            {/* Dish Name */}
            <Animated.View entering={FadeInDown.duration(350)}>
              <Text style={styles.sectionLabel}>Dish Name *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="restaurant-menu" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={dishName}
                  onChangeText={(t) => { setDishName(t); setShowDishSuggestions(true); }}
                  placeholder="What did you eat?"
                  placeholderTextColor={theme.textMuted}
                  onFocus={() => setShowDishSuggestions(true)}
                  returnKeyType="next"
                  onSubmitEditing={() => setShowDishSuggestions(false)}
                />
              </View>
              {showDishSuggestions ? (
                <View style={styles.chipGrid}>
                  {filteredDishes.map(d => (
                    <Pressable
                      key={d}
                      style={({ pressed }) => [
                        styles.chip,
                        dishName === d && styles.chipActive,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setDishName(d); setShowDishSuggestions(false); }}
                    >
                      <Text style={[styles.chipText, dishName === d && styles.chipTextActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Animated.View>

            {/* Caption */}
            <Animated.View entering={FadeInDown.delay(50).duration(350)}>
              <Text style={styles.sectionLabel}>Caption</Text>
              <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                <MaterialIcons name="edit" size={18} color={theme.textMuted} style={{ marginTop: 2 }} />
                <TextInput
                  style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Write a caption..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  maxLength={300}
                />
              </View>
            </Animated.View>

            {/* Source */}
            <Animated.View entering={FadeInUp.delay(100).duration(350)}>
              <Text style={styles.sectionLabel}>Source</Text>
              <View style={styles.sourceRow}>
                {([
                  { id: 'home_cooked' as MealSource, label: 'Home', emoji: '🏠' },
                  { id: 'restaurant' as MealSource, label: 'Restaurant', emoji: '🍽' },
                  { id: 'online_order' as MealSource, label: 'Online', emoji: '📦' },
                ] as const).map(s => (
                  <Pressable
                    key={s.id}
                    style={({ pressed }) => [
                      styles.sourceChip,
                      source === s.id && styles.sourceChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setSource(s.id); }}
                  >
                    <Text style={styles.sourceEmoji}>{s.emoji}</Text>
                    <Text style={[styles.sourceChipText, source === s.id && styles.sourceChipTextActive]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Platform for online */}
              {source === 'online_order' ? (
                <View style={styles.platformRow}>
                  {ORDER_PLATFORMS.map(p => (
                    <Pressable
                      key={p.id}
                      style={({ pressed }) => [
                        styles.platformChip,
                        platform === p.id && { borderColor: p.color, backgroundColor: `${p.color}15` },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setPlatform(p.id); }}
                    >
                      <Text style={[styles.platformText, platform === p.id && { color: p.color, fontWeight: '700' }]}>{p.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* Restaurant tag */}
              {(source === 'restaurant' || source === 'online_order') ? (
                <View style={styles.restSection}>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="storefront" size={18} color={theme.textMuted} />
                    <TextInput
                      style={styles.textInput}
                      value={restaurantSearch}
                      onChangeText={(t) => {
                        setRestaurantSearch(t);
                        setRestaurantName(t);
                        setShowRestaurantSearch(true);
                      }}
                      placeholder="Tag restaurant (optional)"
                      placeholderTextColor={theme.textMuted}
                      onFocus={() => setShowRestaurantSearch(true)}
                    />
                  </View>
                  {showRestaurantSearch && restaurantSearch.length > 0 ? (
                    <View style={styles.dropdown}>
                      {filteredRestaurants.slice(0, 4).map(r => (
                        <Pressable
                          key={r}
                          style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: theme.backgroundTertiary }]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setRestaurantName(r);
                            setRestaurantSearch(r);
                            setShowRestaurantSearch(false);
                          }}
                        >
                          <MaterialIcons name="restaurant" size={14} color={theme.textMuted} />
                          <Text style={styles.dropdownText} numberOfLines={1}>{r}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Animated.View>

            {/* Meal type */}
            <Animated.View entering={FadeInUp.delay(150).duration(350)}>
              <Text style={styles.sectionLabel}>Meal Type</Text>
              <View style={styles.mealTypeRow}>
                {MEAL_TYPES.map(mt => (
                  <Pressable
                    key={mt.id}
                    style={({ pressed }) => [
                      styles.mealChip,
                      mealType === mt.id && styles.mealChipActive,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setMealType(mt.id); }}
                  >
                    <Text style={styles.mealIcon}>{mt.icon}</Text>
                    <Text style={[styles.mealChipText, mealType === mt.id && styles.mealChipTextActive]}>{mt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInUp.delay(200).duration(350)}>
              <Text style={styles.sectionLabel}>Location</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="place" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Add location"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </Animated.View>

            {/* Tag friends */}
            <Animated.View entering={FadeInUp.delay(250).duration(350)}>
              <Text style={styles.sectionLabel}>Tag Friends</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="people" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={taggedFriends}
                  onChangeText={setTaggedFriends}
                  placeholder="@username1, @username2"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </Animated.View>
          </ScrollView>

          {/* Bottom CTA */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.postBtn,
                !canPost && styles.postBtnDisabled,
                pressed && canPost && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handlePost}
              disabled={!canPost}
            >
              <LinearGradient
                colors={canPost ? ['#4ADE80', '#22C55E'] : [theme.backgroundTertiary, theme.backgroundTertiary]}
                style={styles.postBtnGradient}
              >
                <MaterialIcons name="send" size={20} color={canPost ? theme.textOnPrimary : theme.textMuted} />
                <Text style={[styles.postBtnText, !canPost && { color: theme.textMuted }]}>Post</Text>
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
  postHeaderBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.primary,
  },
  postHeaderText: { fontSize: 15, fontWeight: '700', color: theme.textOnPrimary },

  photoSection: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoPreview: { width: '100%', height: '100%' },
  noPhotoSection: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noPhotoText: { fontSize: 14, color: theme.textMuted },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 16,
  },

  inputContainer: {
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
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    padding: 0,
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.4)',
  },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipTextActive: { color: theme.primary, fontWeight: '600' },

  sourceRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  sourceChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  sourceChipActive: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  sourceEmoji: { fontSize: 24 },
  sourceChipText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
  sourceChipTextActive: { color: theme.primary, fontWeight: '700' },

  platformRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  platformChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  platformText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },

  restSection: { marginTop: 12 },
  dropdown: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dropdownText: { flex: 1, fontSize: 14, color: theme.textPrimary, fontWeight: '500' },

  mealTypeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  mealChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  mealChipActive: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  mealIcon: { fontSize: 18 },
  mealChipText: { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  mealChipTextActive: { color: theme.primary, fontWeight: '700' },

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
  postBtn: { borderRadius: 16, overflow: 'hidden' },
  postBtnDisabled: { opacity: 0.6 },
  postBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  postBtnText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
});
