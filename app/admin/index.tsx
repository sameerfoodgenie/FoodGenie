import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { theme } from '../../constants/theme';
import { getUserRole } from '../../services/opsService';
import { fetchDashboardStats, DashboardStats } from '../../services/adminService';

interface QuickAction {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { title: 'Users', icon: 'people', route: '/admin/users', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.10)' },
  { title: 'Posts', icon: 'dynamic-feed', route: '/admin/posts', color: '#D4AF37', bgColor: 'rgba(212,175,55,0.10)' },
  { title: 'Restaurants', icon: 'storefront', route: '/ops/restaurants', color: '#4ADE80', bgColor: 'rgba(74,222,128,0.10)' },
  { title: 'Push Notify', icon: 'campaign', route: '/send-notification', color: '#F472B6', bgColor: 'rgba(244,114,182,0.10)' },
  { title: 'Add Restaurant', icon: 'add-business', route: '/ops/onboard-restaurant', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.10)' },
  { title: 'Add Dish', icon: 'restaurant-menu', route: '/ops/add-dish', color: '#A78BFA', bgColor: 'rgba(167,139,250,0.10)' },
  { title: 'Dish Tags', icon: 'local-offer', route: '/ops/add-dish-tags', color: '#FB923C', bgColor: 'rgba(251,146,60,0.10)' },
  { title: 'Activity Log', icon: 'history', route: '/admin/activity', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.10)' },
];

interface StatCardData {
  label: string;
  value: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
}

function buildStatCards(stats: DashboardStats): StatCardData[] {
  return [
    { label: 'Total Users', value: stats.totalUsers, icon: 'people', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.10)' },
    { label: 'Total Posts', value: stats.totalPosts, icon: 'dynamic-feed', color: '#D4AF37', bgColor: 'rgba(212,175,55,0.10)' },
    { label: 'Posts Today', value: stats.postsToday, icon: 'today', color: '#4ADE80', bgColor: 'rgba(74,222,128,0.10)' },
    { label: 'Active (7d)', value: stats.activeUsers7d, icon: 'trending-up', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.10)' },
    { label: 'Restaurants', value: stats.totalRestaurants, icon: 'storefront', color: '#F472B6', bgColor: 'rgba(244,114,182,0.10)' },
    { label: 'Verified', value: stats.verifiedRestaurants, icon: 'verified', color: '#2DD4BF', bgColor: 'rgba(45,212,191,0.10)' },
    { label: 'Dishes', value: stats.totalDishes, icon: 'restaurant-menu', color: '#A78BFA', bgColor: 'rgba(167,139,250,0.10)' },
    { label: 'Total Likes', value: stats.totalLikes, icon: 'favorite', color: '#FB7185', bgColor: 'rgba(251,113,133,0.10)' },
    { label: 'Comments', value: stats.totalComments, icon: 'chat-bubble', color: '#38BDF8', bgColor: 'rgba(56,189,248,0.10)' },
    { label: 'Follows', value: stats.totalFollows, icon: 'person-add', color: '#FB923C', bgColor: 'rgba(251,146,60,0.10)' },
  ];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    getUserRole(user.id)
      .then((r) => { setRole(r); if (r === 'admin_ops') loadStats(); })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const loadStats = useCallback(async () => {
    const { data, error } = await fetchDashboardStats();
    if (error) {
      showAlert('Error', error);
    }
    setStats(data);
  }, [showAlert]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

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
        <View style={styles.accessHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.center}>
          <View style={styles.lockIcon}>
            <MaterialIcons name="admin-panel-settings" size={56} color={theme.error} />
          </View>
          <Text style={styles.deniedTitle}>Access Restricted</Text>
          <Text style={styles.deniedSub}>Admin privileges required to access this dashboard.</Text>
          <Pressable style={({ pressed }) => [styles.goBackBtn, pressed && { opacity: 0.8 }]} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statCards = stats ? buildStatCards(stats) : [];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSub}>FoodGenie Operations</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={22} color="#D4AF37" />
            </Pressable>
          </Animated.View>

          {/* Hero banner */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.heroBanner}>
            <LinearGradient
              colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.03)']}
              style={styles.heroInner}
            >
              <View style={styles.heroLeft}>
                <View style={styles.heroIconWrap}>
                  <MaterialIcons name="dashboard" size={28} color="#D4AF37" />
                </View>
                <View>
                  <Text style={styles.heroTitle}>Platform Overview</Text>
                  <Text style={styles.heroSub}>Real-time data from your FoodGenie instance</Text>
                </View>
              </View>
              {stats ? (
                <View style={styles.heroHighlight}>
                  <Text style={styles.heroHighlightVal}>{stats.totalUsers}</Text>
                  <Text style={styles.heroHighlightLabel}>Users</Text>
                </View>
              ) : null}
            </LinearGradient>
          </Animated.View>

          {/* Stats Grid */}
          {stats ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.statsGrid}>
                {statCards.map((card, i) => (
                  <Animated.View
                    key={card.label}
                    entering={FadeInDown.delay(250 + i * 40).duration(350)}
                    style={styles.statCard}
                  >
                    <View style={[styles.statIconWrap, { backgroundColor: card.bgColor }]}>
                      <MaterialIcons name={card.icon} size={20} color={card.color} />
                    </View>
                    <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                    <Text style={styles.statLabel}>{card.label}</Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.loadingStats}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Loading metrics...</Text>
            </View>
          )}

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action, i) => (
                <Animated.View key={action.title} entering={FadeInDown.delay(450 + i * 40).duration(300)}>
                  <Pressable
                    style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
                    onPress={() => { Haptics.selectionAsync(); router.push(action.route as any); }}
                  >
                    <View style={[styles.actionIconWrap, { backgroundColor: action.bgColor, borderColor: `${action.color}20` }]}>
                      <MaterialIcons name={action.icon} size={24} color={action.color} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Engagement Summary */}
          {stats ? (
            <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.engagementSection}>
              <Text style={styles.sectionTitle}>Engagement Summary</Text>
              <View style={styles.engagementCard}>
                <View style={styles.engRow}>
                  <View style={styles.engItem}>
                    <MaterialIcons name="favorite" size={18} color="#FB7185" />
                    <View>
                      <Text style={styles.engVal}>{stats.totalLikes}</Text>
                      <Text style={styles.engLabel}>Likes</Text>
                    </View>
                  </View>
                  <View style={styles.engDivider} />
                  <View style={styles.engItem}>
                    <MaterialIcons name="chat-bubble" size={18} color="#38BDF8" />
                    <View>
                      <Text style={styles.engVal}>{stats.totalComments}</Text>
                      <Text style={styles.engLabel}>Comments</Text>
                    </View>
                  </View>
                  <View style={styles.engDivider} />
                  <View style={styles.engItem}>
                    <MaterialIcons name="person-add" size={18} color="#FB923C" />
                    <View>
                      <Text style={styles.engVal}>{stats.totalFollows}</Text>
                      <Text style={styles.engLabel}>Follows</Text>
                    </View>
                  </View>
                </View>
                {stats.totalPosts > 0 ? (
                  <View style={styles.engFooter}>
                    <MaterialIcons name="insights" size={14} color="#6B6B6B" />
                    <Text style={styles.engFooterText}>
                      Avg {(stats.totalLikes / stats.totalPosts).toFixed(1)} likes per post
                    </Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>
          ) : null}

          {/* Restaurant Health */}
          {stats ? (
            <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.healthSection}>
              <Text style={styles.sectionTitle}>Restaurant Health</Text>
              <View style={styles.healthCard}>
                <View style={styles.healthRow}>
                  <View style={styles.healthItem}>
                    <Text style={styles.healthVal}>{stats.totalRestaurants}</Text>
                    <Text style={styles.healthLabel}>Total</Text>
                  </View>
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthVal, { color: '#4ADE80' }]}>{stats.verifiedRestaurants}</Text>
                    <Text style={styles.healthLabel}>Verified</Text>
                  </View>
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthVal, { color: '#FBBF24' }]}>{stats.totalRestaurants - stats.verifiedRestaurants}</Text>
                    <Text style={styles.healthLabel}>Pending</Text>
                  </View>
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthVal, { color: '#A78BFA' }]}>{stats.totalDishes}</Text>
                    <Text style={styles.healthLabel}>Dishes</Text>
                  </View>
                </View>
                {stats.totalRestaurants > 0 ? (
                  <View style={styles.healthBar}>
                    <View
                      style={[
                        styles.healthBarFill,
                        { width: `${(stats.verifiedRestaurants / stats.totalRestaurants) * 100}%` },
                      ]}
                    />
                  </View>
                ) : null}
                <Text style={styles.healthFooter}>
                  {stats.totalRestaurants > 0
                    ? `${Math.round((stats.verifiedRestaurants / stats.totalRestaurants) * 100)}% verification rate`
                    : 'No restaurants onboarded yet'}
                </Text>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  accessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 13, fontWeight: '500', color: '#6B6B6B', marginTop: 2 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Denied
  lockIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,59,48,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.15)',
  },
  deniedTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  deniedSub: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 20 },
  goBackBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    marginTop: 4,
  },
  goBackText: { fontSize: 15, fontWeight: '700', color: '#D4AF37' },

  // Hero
  heroBanner: { paddingHorizontal: 16, marginBottom: 8 },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  heroSub: { fontSize: 12, fontWeight: '500', color: '#6B6B6B', marginTop: 2, maxWidth: 180 },
  heroHighlight: { alignItems: 'center' },
  heroHighlightVal: { fontSize: 28, fontWeight: '900', color: '#D4AF37' },
  heroHighlightLabel: { fontSize: 11, fontWeight: '600', color: '#6B6B6B', marginTop: 2 },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A0A0A0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Stats
  statsSection: { paddingHorizontal: 16, paddingTop: 20 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '31%',
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B6B6B', textAlign: 'center' },
  loadingStats: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },

  // Quick Actions
  actionsSection: { paddingHorizontal: 16, paddingTop: 28 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '100%',
    flexBasis: '23%',
    flexGrow: 1,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionTitle: { fontSize: 12, fontWeight: '700', color: '#A0A0A0', textAlign: 'center' },

  // Engagement
  engagementSection: { paddingHorizontal: 16, paddingTop: 28 },
  engagementCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 14,
  },
  engRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  engItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  engVal: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  engLabel: { fontSize: 11, fontWeight: '500', color: '#6B6B6B' },
  engDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)' },
  engFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  engFooterText: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },

  // Restaurant Health
  healthSection: { paddingHorizontal: 16, paddingTop: 28 },
  healthCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 14,
  },
  healthRow: { flexDirection: 'row', justifyContent: 'space-around' },
  healthItem: { alignItems: 'center', gap: 4 },
  healthVal: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  healthLabel: { fontSize: 11, fontWeight: '600', color: '#6B6B6B' },
  healthBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  healthFooter: { fontSize: 12, fontWeight: '500', color: '#6B6B6B', textAlign: 'center' },
});
