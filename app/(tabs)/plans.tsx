import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { config } from '../../constants/config';
import { mockMealPlans } from '../../services/mockData';

export default function PlansScreen() {
  const insets = useSafeAreaInsets();

  const handlePlanPress = (planId: string) => {
    Haptics.selectionAsync();
    // Navigate to plan details
  };

  const gymPlans = mockMealPlans.filter(p => p.type === 'gym');
  const dailyPlans = mockMealPlans.filter(p => p.type === 'daily');

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meal Plans</Text>
          <Text style={styles.subtitle}>
            Subscribe for hassle-free healthy eating
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {config.mealPlanCategories.map((category) => (
            <Pressable
              key={category.id}
              style={styles.categoryCard}
              onPress={() => Haptics.selectionAsync()}
            >
              <LinearGradient
                colors={
                  category.id === 'gym'
                    ? ['#EF4444', '#DC2626']
                    : category.id === 'weight'
                    ? ['#10B981', '#059669']
                    : theme.gradients.genie
                }
                style={styles.categoryGradient}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Gym Plans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏋️ Gym & Fitness Plans</Text>
            <Text style={styles.sectionSubtitle}>
              Chef-monitored, macro-balanced meals
            </Text>
          </View>

          {gymPlans.map((plan) => (
            <Pressable
              key={plan.id}
              style={styles.planCard}
              onPress={() => handlePlanPress(plan.id)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceTag}>
                  <Text style={styles.priceValue}>₹{plan.price}</Text>
                  <Text style={styles.priceDuration}>/{plan.duration}</Text>
                </View>
              </View>
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <View style={styles.badgesRow}>
                {plan.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <MaterialIcons
                      name={
                        badge.includes('Chef') ? 'restaurant' :
                        badge.includes('Pause') ? 'pause-circle' :
                        'check-circle'
                      }
                      size={14}
                      color={theme.primary}
                    />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.mealsInfo}>
                <MaterialIcons name="lunch-dining" size={16} color={theme.textSecondary} />
                <Text style={styles.mealsText}>{plan.meals} meals included</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Daily Restaurant Plans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🍱 Daily Restaurant Plans</Text>
            <Text style={styles.sectionSubtitle}>
              Fixed weekly menus from trusted kitchens
            </Text>
          </View>

          {dailyPlans.map((plan) => (
            <Pressable
              key={plan.id}
              style={styles.planCard}
              onPress={() => handlePlanPress(plan.id)}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.restaurant && (
                    <Text style={styles.restaurantName}>by {plan.restaurant}</Text>
                  )}
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceValue}>₹{plan.price}</Text>
                  <Text style={styles.priceDuration}>/{plan.duration}</Text>
                </View>
              </View>
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <View style={styles.badgesRow}>
                {plan.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <MaterialIcons
                      name={
                        badge.includes('Veg') ? 'eco' :
                        badge.includes('Score') ? 'verified' :
                        'check-circle'
                      }
                      size={14}
                      color={theme.success}
                    />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color={theme.primary} />
          <Text style={styles.infoText}>
            All plans can be paused or cancelled anytime. No hidden charges.
          </Text>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  categoryCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  categoryGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textOnPrimary,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadows.card,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  restaurantName: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
  },
  priceDuration: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  planDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  mealsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  mealsText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.backgroundTertiary,
    padding: 16,
    borderRadius: theme.borderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.textPrimary,
    lineHeight: 18,
  },
});
