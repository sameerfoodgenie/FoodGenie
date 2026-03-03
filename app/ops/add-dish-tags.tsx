import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useAuth, useAlert } from '@/template';
import {
  fetchRestaurants, fetchDishesForRestaurant, createDishTags,
  fetchTagsForDish, logOpsAction, RestaurantRow, DishRow, DishTagRow,
} from '../../services/opsService';

const SUGGESTED_TAGS = [
  'paneer', 'sabzi', 'gravy', 'jain-option', 'no-onion-garlic', 'thali',
  'family-pack', 'under-250', 'light-meal', 'heavy-meal', 'high-protein',
  'spicy', 'less-spicy',
];

export default function AddDishTagsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [existingTags, setExistingTags] = useState<DishTagRow[]>([]);
  const [loadingRest, setLoadingRest] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);

  const [selectedRestId, setSelectedRestId] = useState('');
  const [selectedRestName, setSelectedRestName] = useState('');
  const [selectedDishId, setSelectedDishId] = useState('');
  const [selectedDishName, setSelectedDishName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurants().then(({ data }) => {
      setRestaurants(data);
      setLoadingRest(false);
    });
  }, []);

  const handleSelectRestaurant = useCallback(async (r: RestaurantRow) => {
    setSelectedRestId(r.id);
    setSelectedRestName(r.name);
    setSelectedDishId('');
    setSelectedDishName('');
    setTags([]);
    setExistingTags([]);
    setLoadingDishes(true);
    const { data } = await fetchDishesForRestaurant(r.id);
    setDishes(data);
    setLoadingDishes(false);
  }, []);

  const handleSelectDish = useCallback(async (d: DishRow) => {
    setSelectedDishId(d.id);
    setSelectedDishName(d.name);
    setTags([]);
    const { data } = await fetchTagsForDish(d.id);
    setExistingTags(data);
  }, []);

  const addTag = useCallback((tag: string) => {
    const t = tag.toLowerCase().trim();
    if (!t) return;
    const existing = existingTags.map((et) => et.tag);
    if (tags.includes(t) || existing.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput('');
  }, [tags, existingTags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedDishId) {
      showAlert('Required', 'Please select a dish');
      return;
    }
    if (tags.length === 0) {
      showAlert('Required', 'Add at least one tag');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const { inserted, error } = await createDishTags(selectedDishId, tags);
    if (error) {
      setSaving(false);
      showAlert('Error', error);
      return;
    }

    if (user?.id) {
      logOpsAction(user.id, 'tag_create', 'dish_tags', selectedDishId, {
        tags,
        dish_name: selectedDishName,
        inserted_count: inserted,
      }).catch(() => {});
    }

    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Success', `${inserted} tag(s) saved for "${selectedDishName}"`);
    setTags([]);
    // Refresh existing tags
    const { data } = await fetchTagsForDish(selectedDishId);
    setExistingTags(data);
  }, [selectedDishId, selectedDishName, tags, user?.id, showAlert]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Dish Tags</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Step 1: Select Restaurant */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>1. Select Restaurant</Text>
            {selectedRestId ? (
              <Pressable style={styles.selectedItem} onPress={() => { setSelectedRestId(''); setSelectedDishId(''); setDishes([]); setTags([]); setExistingTags([]); }}>
                <MaterialIcons name="storefront" size={16} color={theme.primary} />
                <Text style={styles.selectedItemText}>{selectedRestName}</Text>
                <MaterialIcons name="close" size={16} color={theme.textMuted} />
              </Pressable>
            ) : loadingRest ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.pickerList}>
                {restaurants.map((r) => (
                  <Pressable key={r.id} style={styles.pickerOption} onPress={() => handleSelectRestaurant(r)}>
                    <Text style={styles.pickerOptionText}>{r.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Step 2: Select Dish */}
          {selectedRestId ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.fieldGroup}>
              <Text style={styles.label}>2. Select Dish</Text>
              {selectedDishId ? (
                <Pressable style={styles.selectedItem} onPress={() => { setSelectedDishId(''); setTags([]); setExistingTags([]); }}>
                  <MaterialIcons name="restaurant-menu" size={16} color={theme.primary} />
                  <Text style={styles.selectedItemText}>{selectedDishName}</Text>
                  <MaterialIcons name="close" size={16} color={theme.textMuted} />
                </Pressable>
              ) : loadingDishes ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : dishes.length === 0 ? (
                <Text style={styles.emptyText}>No dishes for this restaurant. Add one first.</Text>
              ) : (
                <View style={styles.pickerList}>
                  {dishes.map((d) => (
                    <Pressable key={d.id} style={styles.pickerOption} onPress={() => handleSelectDish(d)}>
                      <Text style={styles.pickerOptionText}>{d.name}</Text>
                      <Text style={styles.pickerOptionSub}>₹{d.price_est} · {d.category || 'No category'}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          ) : null}

          {/* Step 3: Tags */}
          {selectedDishId ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.fieldGroup}>
              <Text style={styles.label}>3. Add Tags</Text>

              {/* Existing tags */}
              {existingTags.length > 0 ? (
                <View style={styles.existingBlock}>
                  <Text style={styles.existingLabel}>Existing tags:</Text>
                  <View style={styles.chipRow}>
                    {existingTags.map((t) => (
                      <View key={t.id} style={styles.existingChip}>
                        <Text style={styles.existingChipText}>{t.tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Tag input */}
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Type a tag and press enter"
                  placeholderTextColor={theme.textMuted}
                  onSubmitEditing={() => addTag(tagInput)}
                  returnKeyType="done"
                />
                <Pressable
                  style={styles.addTagBtn}
                  onPress={() => addTag(tagInput)}
                >
                  <MaterialIcons name="add" size={20} color={theme.primary} />
                </Pressable>
              </View>

              {/* New tags */}
              {tags.length > 0 ? (
                <View style={styles.chipRow}>
                  {tags.map((t) => (
                    <Pressable key={t} style={styles.newChip} onPress={() => removeTag(t)}>
                      <Text style={styles.newChipText}>{t}</Text>
                      <MaterialIcons name="close" size={14} color={theme.primary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* Suggested tags */}
              <Text style={styles.suggestedLabel}>Suggested:</Text>
              <View style={styles.chipRow}>
                {SUGGESTED_TAGS.filter((s) =>
                  !tags.includes(s) && !existingTags.some((et) => et.tag === s),
                ).map((s) => (
                  <Pressable key={s} style={styles.suggestedChip} onPress={() => addTag(s)}>
                    <Text style={styles.suggestedChipText}>{s}</Text>
                    <MaterialIcons name="add" size={12} color={theme.textMuted} />
                  </Pressable>
                ))}
              </View>

              {/* Save */}
              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient colors={theme.gradients.genie} style={styles.saveGradient}>
                  {saving ? (
                    <ActivityIndicator size="small" color={theme.textOnPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name="local-offer" size={18} color={theme.textOnPrimary} />
                      <Text style={styles.saveBtnText}>Save Tags</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  form: { padding: 20, gap: 24 },
  fieldGroup: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
  },
  selectedItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.primary },
  pickerList: { gap: 6, maxHeight: 220 },
  pickerOption: {
    backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  pickerOptionText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  pickerOptionSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  emptyText: { fontSize: 13, color: theme.textMuted, padding: 10 },
  existingBlock: { gap: 8 },
  existingLabel: { fontSize: 12, color: theme.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  existingChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: theme.backgroundTertiary, borderWidth: 1, borderColor: theme.border,
  },
  existingChipText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
  tagInputRow: { flexDirection: 'row', gap: 8 },
  tagInput: {
    flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: theme.textPrimary, borderWidth: 1, borderColor: theme.border,
  },
  addTagBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
  },
  newChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)',
  },
  newChipText: { fontSize: 12, fontWeight: '600', color: theme.primary },
  suggestedLabel: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  suggestedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border,
  },
  suggestedChipText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
