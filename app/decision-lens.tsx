import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';

export default function DecisionLensScreen() {
  const router = useRouter();
  const { setDecisionMode, setRecommendations, allDishes } = useApp();

  const handleSelectMode = (mode: 'dishes' | 'restaurants') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDecisionMode(mode);
    
    // Set top 3 recommendations based on mode
    const topDishes = allDishes.slice(0, 3);
    setRecommendations(topDishes);
    
    router.push('/recommendations');
  };

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
      </View>

      {/* Title */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.titleContainer}
      >
        <Text style={styles.genieBadge}>🧞‍♂️ FoodGenie</Text>
        <Text style={styles.title}>How should I decide today?</Text>
        <Text style={styles.subtitle}>
          Choose how you want to explore your options
        </Text>
      </Animated.View>

      {/* Decision Cards */}
      <View style={styles.cardsContainer}>
        {/* Dishes Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
        >
          <Pressable
            style={styles.decisionCard}
            onPress={() => handleSelectMode('dishes')}
          >
            <LinearGradient
              colors={theme.gradients.genie}
              style={styles.cardGradient}
            >
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardEmoji}>
                  {config.decisionOptions.dishes.emoji}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {config.decisionOptions.dishes.title}
              </Text>
              <Text style={styles.cardDescription}>
                {config.decisionOptions.dishes.description}
              </Text>
              <View style={styles.cardArrow}>
                <MaterialIcons name="arrow-forward" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Restaurants Card */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(400)}
        >
          <Pressable
            style={styles.decisionCard}
            onPress={() => handleSelectMode('restaurants')}
          >
            <View style={styles.cardOutlined}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardEmoji}>
                  {config.decisionOptions.restaurants.emoji}
                </Text>
              </View>
              <Text style={[styles.cardTitle, styles.cardTitleDark]}>
                {config.decisionOptions.restaurants.title}
              </Text>
              <Text style={[styles.cardDescription, styles.cardDescriptionDark]}>
                {config.decisionOptions.restaurants.description}
              </Text>
              <View style={styles.cardArrow}>
                <MaterialIcons name="arrow-forward" size={24} color={theme.textSecondary} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Trust Footer */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(400)}
        style={styles.footer}
      >
        <MaterialIcons name="verified" size={16} color={theme.success} />
        <Text style={styles.footerText}>
          All recommendations are from chef-verified kitchens
        </Text>
      </Animated.View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  genieBadge: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    lineHeight: 24,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  decisionCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.cardElevated,
  },
  cardGradient: {
    padding: 24,
    minHeight: 160,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  cardOutlined: {
    padding: 24,
    minHeight: 160,
    justifyContent: 'flex-end',
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: theme.border,
    borderRadius: theme.borderRadius.xl,
    position: 'relative',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textOnPrimary,
    marginBottom: 4,
  },
  cardTitleDark: {
    color: theme.textPrimary,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  cardDescriptionDark: {
    color: theme.textSecondary,
  },
  cardArrow: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
});
