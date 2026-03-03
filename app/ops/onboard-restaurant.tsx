import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useAuth, useAlert } from '@/template';
import { createRestaurant, logOpsAction } from '../../services/opsService';

const AREAS = ['Mahavir Nagar', 'Poisar', 'Charkop', 'Lokhandwala Kandivali', 'Other'];
const CUISINES = ['North Indian', 'Punjabi', 'Chinese', 'South Indian', 'Street Food', 'Desserts', 'Healthy', 'Thali', 'Pizza', 'Other'];
const VEG_TYPES = [
  { value: 'pure_veg', label: 'Pure Veg' },
  { value: 'veg_egg', label: 'Veg + Egg' },
  { value: 'nonveg', label: 'Non-Veg' },
];
const PRICE_BANDS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid', label: 'Mid' },
  { value: 'premium', label: 'Premium' },
];
const RELIABILITY_TIERS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'new', label: 'New' },
];

export default function OnboardRestaurantScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [city] = useState('Mumbai');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [vegType, setVegType] = useState('pure_veg');
  const [priceBand, setPriceBand] = useState('mid');
  const [googleRating, setGoogleRating] = useState('');
  const [reliabilityTier, setReliabilityTier] = useState('medium');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleCuisine = useCallback((c: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showAlert('Required', 'Restaurant name is required');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const finalArea = area === 'Other' ? customArea.trim() : area;
    const rating = googleRating ? parseFloat(googleRating) : null;

    const { data, error } = await createRestaurant({
      name: name.trim(),
      area: finalArea || undefined,
      city,
      cuisines: selectedCuisines,
      veg_type: vegType,
      price_band: priceBand,
      is_verified: isVerified,
      reliability_tier: reliabilityTier,
      google_rating: rating,
      is_active: isActive,
    });

    if (error) {
      setSaving(false);
      showAlert('Error', error);
      return;
    }

    if (user?.id && data?.id) {
      logOpsAction(user.id, 'restaurant_create', 'restaurants', data.id, {
        name: name.trim(),
        area: finalArea,
        cuisines: selectedCuisines,
      }).catch(() => {});
    }

    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Success', 'Restaurant onboarded successfully');
    router.replace('/ops/restaurants' as any);
  }, [name, area, customArea, city, selectedCuisines, vegType, priceBand, googleRating, reliabilityTier, isVerified, isActive, user?.id, showAlert, router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Onboard Restaurant</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter restaurant name"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Area */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Area</Text>
            <View style={styles.chipRow}>
              {AREAS.map((a) => (
                <Pressable
                  key={a}
                  style={[styles.chip, area === a && styles.chipSelected]}
                  onPress={() => setArea(a)}
                >
                  <Text style={[styles.chipText, area === a && styles.chipTextSelected]}>{a}</Text>
                </Pressable>
              ))}
            </View>
            {area === 'Other' ? (
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                value={customArea}
                onChangeText={setCustomArea}
                placeholder="Enter area name"
                placeholderTextColor={theme.textMuted}
              />
            ) : null}
          </View>

          {/* City */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>City</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{city}</Text>
            </View>
          </View>

          {/* Cuisines */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Cuisines</Text>
            <View style={styles.chipRow}>
              {CUISINES.map((c) => {
                const selected = selectedCuisines.includes(c);
                return (
                  <Pressable
                    key={c}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleCuisine(c)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Veg Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Veg Type</Text>
            <View style={styles.radioRow}>
              {VEG_TYPES.map((v) => (
                <Pressable
                  key={v.value}
                  style={[styles.radio, vegType === v.value && styles.radioSelected]}
                  onPress={() => setVegType(v.value)}
                >
                  <Text style={[styles.radioText, vegType === v.value && styles.radioTextSelected]}>{v.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Price Band */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Price Band</Text>
            <View style={styles.radioRow}>
              {PRICE_BANDS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[styles.radio, priceBand === p.value && styles.radioSelected]}
                  onPress={() => setPriceBand(p.value)}
                >
                  <Text style={[styles.radioText, priceBand === p.value && styles.radioTextSelected]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Google Rating */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Google Rating (optional)</Text>
            <TextInput
              style={styles.input}
              value={googleRating}
              onChangeText={setGoogleRating}
              placeholder="e.g. 4.3"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Reliability Tier */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reliability Tier</Text>
            <View style={styles.radioRow}>
              {RELIABILITY_TIERS.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.radio, reliabilityTier === r.value && styles.radioSelected]}
                  onPress={() => setReliabilityTier(r.value)}
                >
                  <Text style={[styles.radioText, reliabilityTier === r.value && styles.radioTextSelected]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Toggles */}
          <View style={styles.fieldGroup}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Verified Kitchen</Text>
              <Switch
                value={isVerified}
                onValueChange={setIsVerified}
                trackColor={{ false: theme.border, true: 'rgba(251,191,36,0.4)' }}
                thumbColor={isVerified ? theme.primary : theme.textMuted}
              />
            </View>
          </View>

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
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient colors={theme.gradients.genie} style={styles.saveGradient}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color={theme.textOnPrimary} />
                  <Text style={styles.saveBtnText}>Save Restaurant</Text>
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
  readOnlyField: {
    backgroundColor: theme.backgroundTertiary, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: theme.border,
  },
  readOnlyText: { fontSize: 15, color: theme.textSecondary },
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
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
