import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useAuth } from '@/template';
import { getUserRole } from '../../services/opsService';

interface OpsItem {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
}

const OPS_ITEMS: OpsItem[] = [
  { title: 'Onboard Restaurant', subtitle: 'Add a new restaurant to catalog', icon: 'add-business', route: '/ops/onboard-restaurant' },
  { title: 'Restaurants List', subtitle: 'View and manage all restaurants', icon: 'storefront', route: '/ops/restaurants' },
  { title: 'Add Dish', subtitle: 'Add dishes to a restaurant', icon: 'restaurant-menu', route: '/ops/add-dish' },
  { title: 'Add Dish Tags', subtitle: 'Tag dishes for better discovery', icon: 'local-offer', route: '/ops/add-dish-tags' },
];

export default function OpsHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    getUserRole(user.id)
      .then((r) => setRole(r))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (role !== 'admin_ops') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Ops Panel</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.center}>
          <MaterialIcons name="lock" size={48} color={theme.error} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedSubtitle}>
            You do not have admin_ops privileges.
          </Text>
          <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
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
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Ops Panel</Text>
          <Text style={styles.headerSubtitle}>Restaurant management</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {OPS_ITEMS.map((item, i) => (
          <Animated.View key={item.route} entering={FadeInDown.delay(100 + i * 80).duration(350)}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            >
              <View style={styles.cardIconWrap}>
                <MaterialIcons name={item.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  deniedTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
  deniedSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  goBackBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, backgroundColor: theme.backgroundSecondary,
    marginTop: 8,
  },
  goBackText: { fontSize: 14, fontWeight: '600', color: theme.primary },
  content: { padding: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.12)',
    ...theme.shadows.card,
  },
  cardPressed: {
    backgroundColor: 'rgba(28,28,28,1)',
    borderColor: 'rgba(251,191,36,0.35)',
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  cardSub: { fontSize: 13, color: theme.textSecondary, marginTop: 3 },
});
