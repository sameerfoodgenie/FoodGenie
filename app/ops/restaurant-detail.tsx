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
  fetchRestaurantById, updateRestaurant, RestaurantRow, logOpsAction,
} from '../../services/opsService';

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

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [vegType, setVegType] = useState('pure_veg');
  const [priceBand, setPriceBand] = useState('mid');
  const [googleRating, setGoogleRating] = useState('');
  const [reliabilityTier, setReliabilityTier] = useState('medium');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await fetchRestaurantById(id);
    if (error || !data) {
      showAlert('Error', error || 'Restaurant not found');
      setLoading(false);
      return;
    }
    setRestaurant(data);
    setName(data.name);
    setArea(data.area || '');
    setCuisines(data.cuisines || []);
    setVegType(data.veg_type || 'pure_veg');
    setPriceBand(data.price_band || 'mid');
    setGoogleRating(data.google_rating ? String(data.google_rating) : '');
    setReliabilityTier(data.reliability_tier || 'medium');
    setIsVerified(data.is_verified);
    setIsActive(data.is_active);
    setLoading(false);
  }, [id, showAlert]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleCuisine = useCallback((c: string) => {
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!id || !name.trim()) {
      showAlert('Required', 'Restaurant name is required');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const rating = googleRating ? parseFloat(googleRating) : null;
    const payload = {
      name: name.trim(),
      area: area.trim() || null,
      cuisines,
      veg_type: vegType,
      price_band: priceBand,
      google_rating: rating,
      reliability_tier: reliabilityTier,
      is_verified: isVerified,
      is_active: isActive,
    };

    const { error } = await updateRestaurant(id, payload);
    if (error) {
      setSaving(false);
      showAlert('Error', error);
      return;
    }

    if (user?.id) {
      logOpsAction(user.id, 'restaurant_update', 'restaurants', id, payload).catch(() => {});
    }

    setSaving(false);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Updated', 'Restaurant updated successfully');
    loadData();
  }, [id, name, area, cuisines, vegType, priceBand, googleRating, reliabilityTier, isVerified, isActive, user?.id, showAlert, loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Restaurant not found</Text>
          <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        <Pressable
          style={styles.editBtn}
          onPress={() => setEditing(!editing)}
        >
          <MaterialIcons name={editing ? 'close' : 'edit'} size={18} color={theme.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Info Card */}
          <View style={styles.infoCard}>
            <InfoRow label="Name" value={editing ? undefined : name}>
              {editing ? (
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={theme.textMuted} />
              ) : null}
            </InfoRow>
            <InfoRow label="Area" value={editing ? undefined : (area || 'Not set')}>
              {editing ? (
                <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="Area" placeholderTextColor={theme.textMuted} />
              ) : null}
            </InfoRow>
            <InfoRow label="City" value={restaurant.city} />
            <InfoRow label="Cuisines" value={editing ? undefined : (cuisines.join(', ') || 'None')}>
              {editing ? (
                <View style={styles.chipRow}>
                  {CUISINES.map((c) => {
                    const selected = cuisines.includes(c);
                    return (
                      <Pressable key={c} style={[styles.chip, selected && styles.chipSelected]} onPress={() => toggleCuisine(c)}>
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </InfoRow>
            <InfoRow label="Veg Type" value={editing ? undefined : vegType}>
              {editing ? (
                <View style={styles.radioRow}>
                  {VEG_TYPES.map((v) => (
                    <Pressable key={v.value} style={[styles.radio, vegType === v.value && styles.radioSelected]} onPress={() => setVegType(v.value)}>
                      <Text style={[styles.radioText, vegType === v.value && styles.radioTextSelected]}>{v.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </InfoRow>
            <InfoRow label="Price Band" value={editing ? undefined : priceBand}>
              {editing ? (
                <View style={styles.radioRow}>
                  {PRICE_BANDS.map((p) => (
                    <Pressable key={p.value} style={[styles.radio, priceBand === p.value && styles.radioSelected]} onPress={() => setPriceBand(p.value)}>
                      <Text style={[styles.radioText, priceBand === p.value && styles.radioTextSelected]}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </InfoRow>
            <InfoRow label="Google Rating" value={editing ? undefined : (googleRating || 'N/A')}>
              {editing ? (
                <TextInput style={styles.input} value={googleRating} onChangeText={setGoogleRating} keyboardType="decimal-pad" placeholder="e.g. 4.3" placeholderTextColor={theme.textMuted} />
              ) : null}
            </InfoRow>
            <InfoRow label="Reliability Tier" value={editing ? undefined : reliabilityTier}>
              {editing ? (
                <View style={styles.radioRow}>
                  {RELIABILITY_TIERS.map((r) => (
                    <Pressable key={r.value} style={[styles.radio, reliabilityTier === r.value && styles.radioSelected]} onPress={() => setReliabilityTier(r.value)}>
                      <Text style={[styles.radioText, reliabilityTier === r.value && styles.radioTextSelected]}>{r.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </InfoRow>
            <View style={styles.toggleRow}>
              <Text style={styles.infoLabel}>Verified</Text>
              {editing ? (
                <Switch value={isVerified} onValueChange={setIsVerified} trackColor={{ false: theme.border, true: 'rgba(251,191,36,0.4)' }} thumbColor={isVerified ? theme.primary : theme.textMuted} />
              ) : (
                <View style={styles.badgeRow}>
                  {isVerified ? (
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={14} color={theme.success} />
                      <Text style={styles.verifiedText}>Yes</Text>
                    </View>
                  ) : <Text style={styles.infoValue}>No</Text>}
                </View>
              )}
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.infoLabel}>Active</Text>
              {editing ? (
                <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: theme.border, true: 'rgba(34,197,94,0.4)' }} thumbColor={isActive ? theme.success : theme.textMuted} />
              ) : (
                <Text style={[styles.infoValue, !isActive && { color: theme.error }]}>{isActive ? 'Yes' : 'No'}</Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          {editing ? (
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
                    <Text style={styles.saveBtnText}>Update Restaurant</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          ) : null}

          {/* Action: Add dish for this restaurant */}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/ops/add-dish?restaurantId=${restaurant.id}&restaurantName=${encodeURIComponent(restaurant.name)}` as any);
            }}
          >
            <MaterialIcons name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.actionBtnText}>Add Dish for this Restaurant</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {value ? <Text style={styles.infoValue}>{value}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(251,191,36,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  content: { padding: 20, gap: 16 },
  infoCard: {
    backgroundColor: theme.backgroundSecondary, borderRadius: 18, padding: 20, gap: 16,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.1)',
  },
  infoRow: { gap: 6 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  verifiedText: { fontSize: 12, fontWeight: '600', color: theme.success },
  input: {
    backgroundColor: theme.backgroundTertiary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: theme.textPrimary, borderWidth: 1, borderColor: theme.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: theme.backgroundTertiary, borderWidth: 1, borderColor: theme.border,
  },
  chipSelected: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)' },
  chipText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
  chipTextSelected: { color: theme.primary, fontWeight: '600' },
  radioRow: { flexDirection: 'row', gap: 8 },
  radio: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: theme.backgroundTertiary, borderWidth: 1, borderColor: theme.border,
  },
  radioSelected: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)' },
  radioText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
  radioTextSelected: { color: theme.primary, fontWeight: '600' },
  saveBtn: { borderRadius: 14, overflow: 'hidden' },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)',
  },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.primary },
  emptyText: { fontSize: 14, color: theme.textSecondary },
  goBackBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.backgroundSecondary },
  goBackText: { fontSize: 14, fontWeight: '600', color: theme.primary },
});
