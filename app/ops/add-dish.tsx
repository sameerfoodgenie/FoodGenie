import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useAuth, useAlert } from '@/template';
import {
  fetchRestaurants, createDish, logOpsAction, RestaurantRow,
} from '../../services/opsService';

const CATEGORIES = [
  'paneer_sabzi', 'dal', 'thali', 'breads', 'rice', 'chinese',
  'pizza', 'snacks', 'dessert', 'beverage', 'healthy', 'south_indian', 'other',
];
const SPICE_LEVELS = [
  { value: 'mild', label: 'Mild 🟢' },
  { value: 'medium', label: 'Medium 🟡' },
  { value: 'spicy', label: 'Spicy 🔴' },
];

export default function AddDishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ restaurantId?: string; restaurantName?: string }>();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [loadingRest, setLoadingRest] = useState(true);
  const [selectedRestId, setSelectedRestId] = useState(params.restaurantId || '');
  const [selectedRestName, setSelectedRestName] = useState(params.restaurantName || '');
  const [showRestPicker, setShowRestPicker] = useState(!params.restaurantId);

  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [priceEst, setPriceEst] = useState('');
  const [spiceLevel, setSpiceLevel] = useState('medium');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurants().then(({ data }) => {
      setRestaurants(data);
      setLoadingRest(false);
    });
  }, []);

  const handleSelectRestaurant = useCallback((r: RestaurantRow) => {
    setSelectedRestId(r.id);
    setSelectedRestName(r.name);
    setShowRestPicker(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedRestId) {
      showAlert('Required', 'Please select a restaurant');
      return;
    }
    if (!dishName.trim()) {
      showAlert('Required', 'Dish name is required');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const { data, error } = await createDish({
      restaurant_id: selectedRestId,
      name: dishName.trim(),
      category: category || undefined,
      is_veg: isVeg,
      price_est: priceEst ? parseInt(priceEst, 10) : 0,
      spice_level: spiceLevel,
      is_active: isActive,
    });

    if (error) {
      setSaving(false);
      showAlert('Error', error);
      return;
    }

    if (user?.id && data?.id) {
      logOpsAction(user.id, 'dish_create', 'dishes', data.id, {
        name: dishName.trim(),
        restaurant_id: selectedRestId,
        category,
      }).catch(() => {});
    }

    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Success', 'Dish added successfully');
    setDishName('');
    setPriceEst('');
    setCategory('');
  }, [selectedRestId, dishName, category, isVeg, priceEst, spiceLevel, isActive, user?.id, showAlert]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Dish</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Restaurant Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Restaurant *</Text>
            {selectedRestId && !showRestPicker ? (
              <Pressable style={styles.selectedRest} onPress={() => setShowRestPicker(true)}>
                <MaterialIcons name="storefront" size={18} color={theme.primary} />
                <Text style={styles.selectedRestText} numberOfLines={1}>{selectedRestName}</Text>
                <MaterialIcons name="edit" size={16} color={theme.textMuted} />
              </Pressable>
            ) : loadingRest ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <View style={styles.restList}>
                {restaurants.map((r) => (
                  <Pressable
                    key={r.id}
                    style={({ pressed }) => [styles.restOption, pressed && { opacity: 0.8 }]}
                    onPress={() => handleSelectRestaurant(r)}
                  >
                    <Text style={styles.restOptionText} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.restOptionArea}>{r.area || r.city}</Text>
                  </Pressable>
                ))}
                {restaurants.length === 0 ? (
                  <Text style={styles.emptyText}>No restaurants. Onboard one first.</Text>
                ) : null}
              </View>
            )}
          </View>

          {/* Dish Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dish Name *</Text>
            <TextInput
              style={styles.input}
              value={dishName}
              onChangeText={setDishName}
              placeholder="e.g. Paneer Butter Masala"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, category === c && styles.chipSelected]}
                  onPress={() => setCategory(category === c ? '' : c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextSelected]}>
                    {c.replace(/_/g, ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Is Veg */}
          <View style={styles.fieldGroup}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Vegetarian</Text>
              <Switch
                value={isVeg}
                onValueChange={setIsVeg}
                trackColor={{ false: theme.border, true: 'rgba(34,197,94,0.4)' }}
                thumbColor={isVeg ? theme.success : theme.textMuted}
              />
            </View>
          </View>

          {/* Price */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Price Estimate (₹)</Text>
            <TextInput
              style={styles.input}
              value={priceEst}
              onChangeText={setPriceEst}
              placeholder="e.g. 250"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
            />
          </View>

          {/* Spice Level */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Spice Level</Text>
            <View style={styles.radioRow}>
              {SPICE_LEVELS.map((s) => (
                <Pressable
                  key={s.value}
                  style={[styles.radio, spiceLevel === s.value && styles.radioSelected]}
                  onPress={() => setSpiceLevel(s.value)}
                >
                  <Text style={[styles.radioText, spiceLevel === s.value && styles.radioTextSelected]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Active */}
          <View style={styles.fieldGroup}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: theme.border, true: 'rgba(34,197,94,0.4)' }}
                thumbColor={isActive ? theme.success : theme.textMuted}
              />
            </View>
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
                  <MaterialIcons name="save" size={18} color={theme.textOnPrimary} />
                  <Text style={styles.saveBtnText}>Save Dish</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

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
  form: { padding: 20, gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: theme.backgroundSecondary, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    color: theme.textPrimary, borderWidth: 1, borderColor: theme.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border,
  },
  chipSelected: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)' },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipTextSelected: { color: theme.primary, fontWeight: '600' },
  radioRow: { flexDirection: 'row', gap: 10 },
  radio: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border,
  },
  radioSelected: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)' },
  radioText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  radioTextSelected: { color: theme.primary, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedRest: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)',
  },
  selectedRestText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.primary },
  restList: { gap: 6, maxHeight: 250 },
  restOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  restOptionText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, flex: 1 },
  restOptionArea: { fontSize: 12, color: theme.textMuted },
  emptyText: { fontSize: 13, color: theme.textMuted, textAlign: 'center', padding: 20 },
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
