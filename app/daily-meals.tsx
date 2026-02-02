import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { dailyMealsOfferings } from '../services/mockData';

type MealType = 'lunch' | 'dinner' | 'both';

export default function DailyMealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMealType, setSelectedMealType] = useState<MealType>('both');
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const handleMealTypeChange = (type: MealType) => {
    Haptics.selectionAsync();
    setSelectedMealType(type);
  };

  const toggleMenuExpand = (mealId: string) => {
    Haptics.selectionAsync();
    setExpandedMenus(prev =>
      prev.includes(mealId)
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const handleSubscribe = (meal: typeof dailyMealsOfferings[0]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate to subscription confirmation
  };

  const getPrice = (meal: typeof dailyMealsOfferings[0]) => {
    switch (selectedMealType) {
      case 'lunch':
        return meal.lunchPrice;
      case 'dinner':
        return meal.dinnerPrice;
      case 'both':
        return meal.bothPrice;
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🍱 Daily Meals</Text>
          <Text style={styles.headerSubtitle}>Fixed menu, predictable pricing</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Meal Type Selector */}
      <View style={styles.mealTypeContainer}>
        <Text style={styles.selectorLabel}>SELECT MEAL TYPE</Text>
        <View style={styles.mealTypeButtons}>
          {[
            { type: 'lunch' as MealType, icon: 'wb-sunny', label: 'Lunch Only' },
            { type: 'dinner' as MealType, icon: 'nightlight', label: 'Dinner Only' },
            { type: 'both' as MealType, icon: 'restaurant', label: 'Both', badge: 'Save ₹30' },
          ].map((option) => (
            <Pressable
              key={option.type}
              style={[
                styles.mealTypeButton,
                selectedMealType === option.type && styles.mealTypeButtonActive,
              ]}
              onPress={() => handleMealTypeChange(option.type)}
            >
              <MaterialIcons
                name={option.icon as any}
                size={20}
                color={selectedMealType === option.type ? theme.textOnPrimary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.mealTypeText,
                  selectedMealType === option.type && styles.mealTypeTextActive,
                ]}
              >
                {option.label}
              </Text>
              {option.badge && selectedMealType === option.type && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{option.badge}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Meal Plans */}
        {dailyMealsOfferings.map((meal, index) => {
          const isExpanded = expandedMenus.includes(meal.id);
          const price = getPrice(meal);

          return (
            <Animated.View
              key={meal.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <View style={styles.mealCard}>
                {/* Header */}
                <View style={styles.mealCardHeader}>
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{meal.restaurantName}</Text>
                    <Text style={styles.cuisine}>{meal.cuisine}</Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.price}>₹{price}</Text>
                    <Text style={styles.priceLabel}>per day</Text>
                  </View>
                </View>

                {/* Badges */}
                <View style={styles.badgesRow}>
                  <View style={styles.badge}>
                    <MaterialIcons name="verified" size={14} color={theme.success} />
                    <Text style={styles.badgeText}>Chef {meal.chefScore}%</Text>
                  </View>
                  {meal.isVeg && (
                    <View style={styles.badge}>
                      <MaterialIcons name="eco" size={14} color={theme.success} />
                      <Text style={styles.badgeText}>Pure Veg</Text>
                    </View>
                  )}
                  <View style={styles.badge}>
                    <MaterialIcons name="event" size={14} color={theme.primary} />
                    <Text style={styles.badgeText}>Mon-Fri</Text>
                  </View>
                </View>

                {/* Weekly Price */}
                <View style={styles.weeklyPriceBox}>
                  <View style={styles.weeklyPriceLeft}>
                    <MaterialIcons name="calendar-today" size={16} color={theme.textSecondary} />
                    <Text style={styles.weeklyPriceLabel}>Weekly subscription:</Text>
                  </View>
                  <View style={styles.weeklyPriceRight}>
                    <Text style={styles.weeklyPrice}>₹{meal.weeklyPrice}</Text>
                    <Text style={styles.weeklySave}>Save ₹{(price * 5) - meal.weeklyPrice}</Text>
                  </View>
                </View>

                {/* View Menu Toggle */}
                <Pressable
                  style={styles.menuToggle}
                  onPress={() => toggleMenuExpand(meal.id)}
                >
                  <Text style={styles.menuToggleText}>
                    {isExpanded ? 'Hide' : 'View'} Weekly Menu
                  </Text>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={theme.primary}
                  />
                </Pressable>

                {/* Menu Details (Expanded) */}
                {isExpanded && (
                  <View style={styles.menuContainer}>
                    {Object.entries(meal.menu).map(([day, meals]) => (
                      <View key={day} style={styles.menuDay}>
                        <Text style={styles.menuDayName}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Text>
                        <View style={styles.menuMeals}>
                          {selectedMealType !== 'dinner' && (
                            <View style={styles.menuMeal}>
                              <MaterialIcons name="wb-sunny" size={14} color={theme.accent} />
                              <Text style={styles.menuMealText}>{meals.lunch}</Text>
                            </View>
                          )}
                          {selectedMealType !== 'lunch' && (
                            <View style={styles.menuMeal}>
                              <MaterialIcons name="nightlight" size={14} color={theme.primary} />
                              <Text style={styles.menuMealText}>{meals.dinner}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Subscribe Button */}
                <Pressable
                  style={styles.subscribeButton}
                  onPress={() => handleSubscribe(meal)}
                >
                  <LinearGradient
                    colors={theme.gradients.genie}
                    style={styles.subscribeGradient}
                  >
                    <Text style={styles.subscribeText}>Subscribe Weekly</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color={theme.primary} />
          <Text style={styles.infoText}>
            Pause or cancel anytime. Min 5-day subscription. Menu fixed weekly, no customization.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  mealTypeContainer: {
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primaryDark,
  },
  mealTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  mealTypeTextActive: {
    color: theme.textOnPrimary,
  },
  saveBadge: {
    backgroundColor: theme.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: 4,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  mealCard: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    ...theme.shadows.cardElevated,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  cuisine: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
  weeklyPriceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.backgroundTertiary,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    marginBottom: 12,
  },
  weeklyPriceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyPriceLabel: {
    fontSize: 13,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  weeklyPriceRight: {
    alignItems: 'flex-end',
  },
  weeklyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  weeklySave: {
    fontSize: 11,
    color: theme.success,
    fontWeight: '600',
  },
  menuToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  menuToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  menuContainer: {
    marginTop: 16,
    gap: 12,
  },
  menuDay: {
    backgroundColor: theme.backgroundSecondary,
    padding: 12,
    borderRadius: theme.borderRadius.md,
  },
  menuDayName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuMeals: {
    gap: 6,
  },
  menuMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuMealText: {
    fontSize: 13,
    color: theme.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  subscribeButton: {
    marginTop: 16,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.backgroundTertiary,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.textPrimary,
    lineHeight: 18,
  },
});
