import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideOutRight } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '@/template';
import { useAlert } from '@/template';
import {
  PantryItem,
  fetchPantryItems,
  addPantryItem,
  updatePantryItem,
  markItemUsed,
  getExpiryStatus,
  getDaysUntilExpiry,
  getPantryEmoji,
} from '../services/pantryService';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Category Grouping ──
function getCategoryFromName(name: string): string {
  const lower = name.toLowerCase();
  if (['milk', 'curd', 'yogurt', 'paneer', 'butter', 'ghee', 'cheese', 'cream'].some(v => lower.includes(v))) return 'Dairy';
  if (['rice', 'atta', 'flour', 'wheat', 'dal', 'lentil', 'chana', 'moong', 'toor', 'sugar', 'poha', 'besan', 'maida'].some(v => lower.includes(v))) return 'Grains & Staples';
  if (['onion', 'tomato', 'potato', 'spinach', 'capsicum', 'cauliflower', 'ginger', 'garlic', 'chilli', 'coriander leaves', 'cabbage'].some(v => lower.includes(v))) return 'Vegetables';
  if (['banana', 'apple', 'orange', 'mango', 'grapes'].some(v => lower.includes(v))) return 'Fruits';
  if (['oil', 'sunflower', 'mustard oil', 'olive'].some(v => lower.includes(v))) return 'Oils';
  if (['turmeric', 'cumin', 'masala', 'pepper', 'salt', 'coriander powder', 'mustard seed'].some(v => lower.includes(v))) return 'Spices';
  if (['egg', 'chicken', 'fish', 'paneer'].some(v => lower.includes(v))) return 'Protein';
  return 'Others';
}

const CATEGORY_COLORS: Record<string, { color: string; emoji: string }> = {
  'Dairy': { color: '#60A5FA', emoji: '🥛' },
  'Grains & Staples': { color: '#D4AF37', emoji: '🌾' },
  'Vegetables': { color: '#4ADE80', emoji: '🥬' },
  'Fruits': { color: '#FF6B6B', emoji: '🍎' },
  'Oils': { color: '#A78BFA', emoji: '🫗' },
  'Spices': { color: '#F97316', emoji: '🌶️' },
  'Protein': { color: '#EF4444', emoji: '🥩' },
  'Others': { color: '#6B7280', emoji: '📦' },
};

// ── Expiry Badge ──
function ExpiryBadge({ expiresAt, colors }: { expiresAt: string | null; colors: any }) {
  const status = getExpiryStatus(expiresAt);
  const days = getDaysUntilExpiry(expiresAt);

  if (status === 'unknown') return null;

  const config = {
    expired: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Expired', icon: 'warning' },
    expiring_soon: { bg: 'rgba(245,183,49,0.12)', text: '#D9A020', label: `${days}d left`, icon: 'schedule' },
    fresh: { bg: 'rgba(74,222,128,0.08)', text: '#4ADE80', label: `${days}d left`, icon: 'check-circle' },
  };

  const c = config[status];
  return (
    <View style={[expiryStyles.badge, { backgroundColor: c.bg }]}>
      <MaterialIcons name={c.icon as any} size={10} color={c.text} />
      <Text style={[expiryStyles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const expiryStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 9, fontWeight: '700' },
});

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterExpiry, setFilterExpiry] = useState<'all' | 'expiring' | 'expired'>('all');

  // Add Item Form
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newExpiryDays, setNewExpiryDays] = useState('');
  const [adding, setAdding] = useState(false);

  // Load pantry items
  const loadItems = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await fetchPantryItems(user.id);
    if (data) setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadItems();
  }, [loadItems]);

  // Mark as used
  const handleMarkUsed = useCallback(async (item: PantryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert('Mark as Used?', `Remove "${item.ingredient_name}" from pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Used Up',
        style: 'destructive',
        onPress: async () => {
          const { success } = await markItemUsed(item.id);
          if (success) {
            setItems(prev => prev.filter(i => i.id !== item.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }, [showAlert]);

  // Add new item
  const handleAddItem = useCallback(async () => {
    if (!user?.id || !newName.trim() || !newQty.trim()) {
      showAlert('Missing Info', 'Please enter item name and quantity');
      return;
    }

    setAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const expiresAt = newExpiryDays
      ? new Date(Date.now() + parseInt(newExpiryDays) * 86400000).toISOString()
      : undefined;

    const { success, error } = await addPantryItem(user.id, {
      ingredient_name: newName.trim(),
      remaining_quantity: newQty.trim(),
      remaining_value: parseFloat(newValue) || 0,
      expires_at: expiresAt,
    });

    setAdding(false);

    if (success) {
      setShowAddModal(false);
      setNewName('');
      setNewQty('');
      setNewValue('');
      setNewExpiryDays('');
      loadItems();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      showAlert('Error', error || 'Failed to add item');
    }
  }, [user?.id, newName, newQty, newValue, newExpiryDays, showAlert, loadItems]);

  // Filter items
  const filteredItems = items.filter(item => {
    if (filterCategory && getCategoryFromName(item.ingredient_name) !== filterCategory) return false;
    if (filterExpiry === 'expiring') {
      const status = getExpiryStatus(item.expires_at);
      return status === 'expiring_soon';
    }
    if (filterExpiry === 'expired') {
      return getExpiryStatus(item.expires_at) === 'expired';
    }
    return true;
  });

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = getCategoryFromName(item.ingredient_name);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  // Stats
  const totalValue = items.reduce((s, i) => s + (i.remaining_value || 0), 0);
  const expiringCount = items.filter(i => getExpiryStatus(i.expires_at) === 'expiring_soon').length;
  const expiredCount = items.filter(i => getExpiryStatus(i.expires_at) === 'expired').length;

  const categories = [...new Set(items.map(i => getCategoryFromName(i.ingredient_name)))];

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#1E1456', '#7B2FA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
          <View style={st.headerRow}>
            <Pressable style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Pantry Tracker 🏠</Text>
              <Text style={st.headerSub}>{items.length} items in stock</Text>
            </View>
            <Pressable
              style={({ pressed }) => [st.addBtnHeader, pressed && { opacity: 0.85 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddModal(true); }}
            >
              <MaterialIcons name="add" size={16} color="#1E1456" />
              <Text style={st.addBtnText}>Add</Text>
            </Pressable>
          </View>

          {/* Stats Row */}
          <View style={st.statsRow}>
            <View style={st.statCard}>
              <Text style={st.statValue}>₹{totalValue.toLocaleString()}</Text>
              <Text style={st.statLabel}>Total Value</Text>
            </View>
            <View style={st.statCard}>
              <Text style={[st.statValue, expiringCount > 0 ? { color: '#F5B731' } : {}]}>{expiringCount}</Text>
              <Text style={st.statLabel}>Expiring Soon</Text>
            </View>
            <View style={st.statCard}>
              <Text style={[st.statValue, expiredCount > 0 ? { color: '#EF4444' } : {}]}>{expiredCount}</Text>
              <Text style={st.statLabel}>Expired</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {/* Filter Row */}
          <View style={st.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
              <Pressable
                style={[st.filterChip, { backgroundColor: filterExpiry === 'all' && !filterCategory ? '#7B2FA0' : colors.surface, borderColor: filterExpiry === 'all' && !filterCategory ? '#7B2FA0' : colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setFilterCategory(null); setFilterExpiry('all'); }}
              >
                <Text style={[st.filterChipText, { color: filterExpiry === 'all' && !filterCategory ? '#FFF' : colors.textPrimary }]}>All</Text>
              </Pressable>
              <Pressable
                style={[st.filterChip, { backgroundColor: filterExpiry === 'expiring' ? '#D9A020' : colors.surface, borderColor: filterExpiry === 'expiring' ? '#D9A020' : colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setFilterExpiry(filterExpiry === 'expiring' ? 'all' : 'expiring'); setFilterCategory(null); }}
              >
                <Text style={[st.filterChipText, { color: filterExpiry === 'expiring' ? '#FFF' : colors.textPrimary }]}>⚠️ Expiring</Text>
              </Pressable>
              <Pressable
                style={[st.filterChip, { backgroundColor: filterExpiry === 'expired' ? '#EF4444' : colors.surface, borderColor: filterExpiry === 'expired' ? '#EF4444' : colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setFilterExpiry(filterExpiry === 'expired' ? 'all' : 'expired'); setFilterCategory(null); }}
              >
                <Text style={[st.filterChipText, { color: filterExpiry === 'expired' ? '#FFF' : colors.textPrimary }]}>🚫 Expired</Text>
              </Pressable>
              {categories.map(cat => (
                <Pressable
                  key={cat}
                  style={[st.filterChip, { backgroundColor: filterCategory === cat ? (CATEGORY_COLORS[cat]?.color || '#7B2FA0') : colors.surface, borderColor: filterCategory === cat ? (CATEGORY_COLORS[cat]?.color || '#7B2FA0') : colors.border }]}
                  onPress={() => { Haptics.selectionAsync(); setFilterCategory(filterCategory === cat ? null : cat); setFilterExpiry('all'); }}
                >
                  <Text style={[st.filterChipText, { color: filterCategory === cat ? '#FFF' : colors.textPrimary }]}>
                    {CATEGORY_COLORS[cat]?.emoji || '📦'} {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Loading */}
          {loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#7B2FA0" />
              <Text style={[st.emptyText, { color: colors.textMuted }]}>Loading pantry...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={st.emptyState}>
              <Text style={{ fontSize: 48 }}>🍽️</Text>
              <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>Pantry is Empty</Text>
              <Text style={[st.emptyText, { color: colors.textMuted }]}>
                {filterCategory || filterExpiry !== 'all'
                  ? 'No items match your filter'
                  : 'Add leftover items from your grocery carts or manually add items to track'}
              </Text>
              <Pressable
                style={({ pressed }) => [st.emptyBtn, pressed && { opacity: 0.85 }]}
                onPress={() => setShowAddModal(true)}
              >
                <MaterialIcons name="add" size={16} color="#FFF" />
                <Text style={st.emptyBtnText}>Add First Item</Text>
              </Pressable>
            </View>
          ) : (
            /* Grouped Items */
            Object.entries(groupedItems).map(([category, catItems], catIdx) => (
              <Animated.View key={category} entering={FadeInDown.delay(catIdx * 50).duration(300)} style={st.categorySection}>
                <View style={st.categoryHeader}>
                  <View style={[st.categoryIcon, { backgroundColor: `${CATEGORY_COLORS[category]?.color || '#6B7280'}12` }]}>
                    <Text style={{ fontSize: 16 }}>{CATEGORY_COLORS[category]?.emoji || '📦'}</Text>
                  </View>
                  <Text style={[st.categoryName, { color: colors.textPrimary }]}>{category}</Text>
                  <View style={[st.categoryCount, { backgroundColor: `${CATEGORY_COLORS[category]?.color || '#6B7280'}12` }]}>
                    <Text style={[st.categoryCountText, { color: CATEGORY_COLORS[category]?.color || '#6B7280' }]}>{catItems.length}</Text>
                  </View>
                </View>

                <View style={st.itemsList}>
                  {catItems.map((item, i) => {
                    const status = getExpiryStatus(item.expires_at);
                    const isExpired = status === 'expired';
                    return (
                      <Animated.View key={item.id} entering={FadeInDown.delay(catIdx * 50 + i * 30).duration(250)} exiting={SlideOutRight.duration(200)}>
                        <View style={[
                          st.itemCard,
                          {
                            backgroundColor: isExpired ? (isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)') : colors.surface,
                            borderColor: isExpired ? 'rgba(239,68,68,0.15)' : colors.border,
                          },
                        ]}>
                          <View style={st.itemLeft}>
                            <Text style={{ fontSize: 22 }}>{getPantryEmoji(item.ingredient_name)}</Text>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[st.itemName, { color: colors.textPrimary }, isExpired && { opacity: 0.6 }]}>{item.ingredient_name}</Text>
                                <ExpiryBadge expiresAt={item.expires_at} colors={colors} />
                              </View>
                              <View style={st.itemMeta}>
                                <Text style={[st.itemQty, { color: colors.textMuted }]}>{item.remaining_quantity}</Text>
                                {item.remaining_value > 0 ? (
                                  <Text style={[st.itemValue, { color: '#F5B731' }]}>₹{item.remaining_value}</Text>
                                ) : null}
                                {item.last_purchased_at ? (
                                  <Text style={[st.itemDate, { color: colors.textMuted }]}>
                                    Bought {new Date(item.last_purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          </View>

                          <View style={st.itemActions}>
                            <Pressable
                              style={({ pressed }) => [st.actionBtn, { backgroundColor: 'rgba(74,222,128,0.08)' }, pressed && { opacity: 0.7 }]}
                              onPress={() => handleMarkUsed(item)}
                            >
                              <MaterialIcons name="check-circle" size={16} color="#4ADE80" />
                            </Pressable>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            ))
          )}

          {/* Auto-Deduction Info Card */}
          {items.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(300).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
              <View style={[st.infoCard, { backgroundColor: isDark ? 'rgba(74,222,128,0.04)' : 'rgba(74,222,128,0.02)', borderColor: 'rgba(74,222,128,0.15)' }]}>
                <MaterialIcons name="auto-awesome" size={18} color="#4ADE80" />
                <View style={{ flex: 1 }}>
                  <Text style={[st.infoTitle, { color: colors.textPrimary }]}>Smart Auto-Deduction</Text>
                  <Text style={[st.infoText, { color: colors.textMuted }]}>
                    When you generate a grocery plan, pantry items will be automatically deducted from the shopping list. Items in stock will reduce required quantities.
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Refresh Button */}
          {items.length > 0 ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 16, alignItems: 'center' }}>
              <Pressable
                style={({ pressed }) => [st.refreshBtn, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? <ActivityIndicator size="small" color="#7B2FA0" /> : <MaterialIcons name="refresh" size={16} color="#7B2FA0" />}
                <Text style={[st.refreshBtnText, { color: '#7B2FA0' }]}>Refresh Pantry</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        {/* Floating Add Button */}
        <Pressable
          style={({ pressed }) => [st.fab, pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddModal(true); }}
        >
          <LinearGradient colors={['#7B2FA0', '#C41E7A']} style={st.fabGrad}>
            <MaterialIcons name="add" size={24} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </SafeAreaView>

      {/* ═══ Add Item Modal ═══ */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalContent, { backgroundColor: colors.surface }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.textPrimary }]}>Add Pantry Item</Text>
              <Pressable onPress={() => setShowAddModal(false)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <MaterialIcons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.textSecondary }]}>Item Name *</Text>
                <TextInput
                  style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g., Atta, Rice, Milk"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.textSecondary }]}>Remaining Quantity *</Text>
                <TextInput
                  style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                  value={newQty}
                  onChangeText={setNewQty}
                  placeholder="e.g., 3kg, 500ml, 2 packs"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.textSecondary }]}>Estimated Value (₹)</Text>
                <TextInput
                  style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                  value={newValue}
                  onChangeText={setNewValue}
                  placeholder="e.g., 150"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.textSecondary }]}>Expires in (days)</Text>
                <TextInput
                  style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                  value={newExpiryDays}
                  onChangeText={setNewExpiryDays}
                  placeholder="e.g., 7 (leave empty if non-perishable)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              {/* Quick Expiry Presets */}
              <View style={st.expiryPresets}>
                {[
                  { label: '2 days', value: '2' },
                  { label: '5 days', value: '5' },
                  { label: '1 week', value: '7' },
                  { label: '2 weeks', value: '14' },
                  { label: '1 month', value: '30' },
                  { label: '3 months', value: '90' },
                ].map(preset => (
                  <Pressable
                    key={preset.value}
                    style={[st.presetChip, { backgroundColor: newExpiryDays === preset.value ? 'rgba(123,47,160,0.10)' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'), borderColor: newExpiryDays === preset.value ? '#7B2FA0' : colors.border }]}
                    onPress={() => setNewExpiryDays(preset.value)}
                  >
                    <Text style={[st.presetText, { color: newExpiryDays === preset.value ? '#7B2FA0' : colors.textMuted }]}>{preset.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [st.modalSaveBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              onPress={handleAddItem}
              disabled={adding || !newName.trim() || !newQty.trim()}
            >
              <LinearGradient
                colors={newName.trim() && newQty.trim() ? ['#7B2FA0', '#1E1456'] : ['#9A9AB0', '#9A9AB0']}
                style={st.modalSaveBtnGrad}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name="add-circle" size={18} color="#FFF" />
                    <Text style={st.modalSaveBtnText}>Add to Pantry</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  addBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5B731' },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#1E1456' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Filter
  filterSection: { paddingTop: 12, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: '700' },

  // Category
  categorySection: { paddingHorizontal: 16, paddingTop: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 14, fontWeight: '800', flex: 1 },
  categoryCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  categoryCountText: { fontSize: 10, fontWeight: '800' },

  // Items
  itemsList: { gap: 6 },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  itemQty: { fontSize: 11, fontWeight: '600' },
  itemValue: { fontSize: 11, fontWeight: '700' },
  itemDate: { fontSize: 9, fontWeight: '500' },
  itemActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Empty State
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#7B2FA0', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  emptyBtnText: { fontSize: 13, fontWeight: '800', color: '#FFF' },

  // Info Card
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  infoTitle: { fontSize: 13, fontWeight: '800' },
  infoText: { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 16 },

  // Refresh
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  refreshBtnText: { fontSize: 12, fontWeight: '700' },

  // FAB
  fab: { position: 'absolute', bottom: 90, right: 20 },
  fabGrad: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#7B2FA0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900' },

  // Form
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '600' },

  // Expiry Presets
  expiryPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  presetText: { fontSize: 11, fontWeight: '600' },

  // Modal Save
  modalSaveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  modalSaveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  modalSaveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
