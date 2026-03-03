import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

export default function TrustProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { allRestaurants } = useApp();
  const restaurant = allRestaurants[0]; // Use first restaurant as example

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trust Profile</Text>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Info */}
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisineType}>{restaurant.cuisine}</Text>
        </View>

        {/* Score Cards */}
        <View style={styles.scoresContainer}>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={[styles.scoreValue, { color: theme.success }]}>
                {restaurant.chefScore}%
              </Text>
            </View>
            <Text style={styles.scoreLabel}>Chef Score</Text>
            <Text style={styles.scoreDescription}>
              Based on ingredient quality, cooking standards & presentation
            </Text>
          </View>

          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
              <Text style={[styles.scoreValue, { color: theme.primary }]}>
                {restaurant.hygieneScore}%
              </Text>
            </View>
            <Text style={styles.scoreLabel}>Hygiene Score</Text>
            <Text style={styles.scoreDescription}>
              Kitchen cleanliness, food handling & storage practices
            </Text>
          </View>
        </View>

        {/* Last Audit */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="fact-check" size={24} color={theme.primary} />
            <Text style={styles.sectionTitle}>Last Audit</Text>
          </View>
          <View style={styles.auditCard}>
            <View style={styles.auditRow}>
              <MaterialIcons name="schedule" size={20} color={theme.textSecondary} />
              <Text style={styles.auditText}>{restaurant.lastAudit}</Text>
            </View>
            <View style={styles.auditBadge}>
              <MaterialIcons name="verified" size={16} color={theme.success} />
              <Text style={styles.auditBadgeText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Improvements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="trending-up" size={24} color={theme.success} />
            <Text style={styles.sectionTitle}>Recent Improvements</Text>
          </View>
          {restaurant.improvements.map((improvement, index) => (
            <View key={index} style={styles.improvementItem}>
              <MaterialIcons name="check-circle" size={20} color={theme.success} />
              <Text style={styles.improvementText}>{improvement}</Text>
            </View>
          ))}
        </View>

        {/* Customer Snapshot */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={24} color={theme.accent} />
            <Text style={styles.sectionTitle}>Customer Snapshot</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{restaurant.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1.2K+</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>On-time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Taste</Text>
            </View>
          </View>
        </View>

        {/* Trust Promise */}
        <View style={styles.trustPromise}>
          <MaterialIcons name="security" size={32} color={theme.primary} />
          <Text style={styles.trustPromiseTitle}>FoodGenie Trust Promise</Text>
          <Text style={styles.trustPromiseText}>
            Every kitchen on FoodGenie is verified by our chef team. We audit regularly and remove kitchens that don't meet our standards.
          </Text>
          <View style={styles.promiseBadges}>
            <View style={styles.promiseBadge}>
              <MaterialIcons name="no-food" size={16} color={theme.textSecondary} />
              <Text style={styles.promiseBadgeText}>No Ads</Text>
            </View>
            <View style={styles.promiseBadge}>
              <MaterialIcons name="price-check" size={16} color={theme.textSecondary} />
              <Text style={styles.promiseBadgeText}>Fair Prices</Text>
            </View>
            <View style={styles.promiseBadge}>
              <MaterialIcons name="verified-user" size={16} color={theme.textSecondary} />
              <Text style={styles.promiseBadgeText}>Chef Verified</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  restaurantHeader: {
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  cuisineType: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 4,
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  auditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  auditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  auditBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.success,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 8,
  },
  improvementText: {
    flex: 1,
    fontSize: 15,
    color: theme.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  trustPromise: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
  },
  trustPromiseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  trustPromiseText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  promiseBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  promiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  promiseBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textPrimary,
  },
});
