import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { fetchRestaurants, RestaurantRow } from '../../services/opsService';

const AREA_FILTERS = ['All', 'Mahavir Nagar', 'Poisar', 'Charkop', 'Lokhandwala Kandivali'];
const TIER_FILTERS = ['All', 'high', 'medium', 'new'];

export default function RestaurantsListScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchRestaurants({
      search: search.trim() || undefined,
      area: areaFilter !== 'All' ? areaFilter : undefined,
      reliability_tier: tierFilter !== 'All' ? tierFilter : undefined,
      is_verified: verifiedFilter,
    });
    setRestaurants(data);
    setLoading(false);
  }, [search, areaFilter, tierFilter, verifiedFilter]);

  useEffect(() => { load(); }, [load]);

  const renderItem = useCallback(({ item, index }: { item: RestaurantRow; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/ops/restaurant-detail?id=${item.id}` as any);
        }}
      >
        <View style={styles.rowLeft}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowArea}>{item.area || 'No area'} · {item.city}</Text>
          <View style={styles.rowBadges}>
            {item.is_verified ? (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={12} color={theme.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
            <View style={[styles.tierBadge, item.reliability_tier === 'high' && styles.tierHigh, item.reliability_tier === 'new' && styles.tierNew]}>
              <Text style={styles.tierText}>{item.reliability_tier}</Text>
            </View>
            {!item.is_active ? (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            ) : null}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
      </Pressable>
    </Animated.View>
  ), [router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Restaurants</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => { Haptics.selectionAsync(); router.push('/ops/onboard-restaurant' as any); }}
        >
          <MaterialIcons name="add" size={22} color={theme.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name..."
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <ScrollRow
          items={AREA_FILTERS}
          selected={areaFilter}
          onSelect={setAreaFilter}
        />
        <View style={styles.filterRow2}>
          <ScrollRow
            items={TIER_FILTERS}
            selected={tierFilter}
            onSelect={setTierFilter}
            label="Tier:"
          />
          <Pressable
            style={[styles.verifiedToggle, verifiedFilter === true && styles.verifiedToggleActive]}
            onPress={() => setVerifiedFilter(verifiedFilter === true ? undefined : true)}
          >
            <MaterialIcons name="verified" size={14} color={verifiedFilter === true ? theme.primary : theme.textMuted} />
            <Text style={[styles.verifiedToggleText, verifiedFilter === true && { color: theme.primary }]}>Verified only</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : restaurants.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="storefront" size={48} color={theme.textMuted} />
          <Text style={styles.emptyText}>No restaurants found</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollRow({ items, selected, onSelect, label }: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  label?: string;
}) {
  return (
    <View style={styles.scrollRow}>
      {label ? <Text style={styles.filterLabel}>{label}</Text> : null}
      {items.map((item) => (
        <Pressable
          key={item}
          style={[styles.filterChip, selected === item && styles.filterChipActive]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.filterChipText, selected === item && styles.filterChipTextActive]}>
            {item}
          </Text>
        </Pressable>
      ))}
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
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(251,191,36,0.1)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: theme.backgroundSecondary, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: theme.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.textPrimary, paddingVertical: 12 },
  filterSection: { paddingHorizontal: 16, paddingTop: 12, gap: 8, paddingBottom: 8 },
  scrollRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  filterRow2: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  filterLabel: { fontSize: 12, fontWeight: '600', color: theme.textMuted, marginRight: 2 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border,
  },
  filterChipActive: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.5)' },
  filterChipText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
  filterChipTextActive: { color: theme.primary, fontWeight: '600' },
  verifiedToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  verifiedToggleActive: { borderColor: 'rgba(251,191,36,0.5)', backgroundColor: 'rgba(251,191,36,0.08)' },
  verifiedToggleText: { fontSize: 12, fontWeight: '500', color: theme.textMuted },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.08)',
  },
  rowPressed: { backgroundColor: 'rgba(28,28,28,1)', borderColor: 'rgba(251,191,36,0.25)' },
  rowLeft: { flex: 1, gap: 4 },
  rowName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  rowArea: { fontSize: 13, color: theme.textSecondary },
  rowBadges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  verifiedText: { fontSize: 10, fontWeight: '600', color: theme.success },
  tierBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
  tierHigh: { backgroundColor: 'rgba(34,197,94,0.1)' },
  tierNew: { backgroundColor: 'rgba(99,102,241,0.1)' },
  tierText: { fontSize: 10, fontWeight: '600', color: theme.textSecondary, textTransform: 'capitalize' },
  inactiveBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  inactiveText: { fontSize: 10, fontWeight: '600', color: theme.error },
  emptyText: { fontSize: 14, color: theme.textSecondary },
});
