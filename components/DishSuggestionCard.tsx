import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { Dish } from '../services/mockData';

interface DishSuggestionCardProps {
  dish: Dish;
  onAdd: () => void;
}

export function DishSuggestionCard({ dish, onAdd }: DishSuggestionCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const elevation = useSharedValue(4);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(`/dish/${dish.id}`);
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleAddPress = (e: any) => {
    e.stopPropagation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd();
  };

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <Pressable 
        style={styles.card} 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
      <View style={styles.imageContainer}>
        <Image
          source={dish.image}
          style={styles.image}
          contentFit="cover"
        />
        {dish.tags[0] && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{dish.tags[0]}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.dishName} numberOfLines={1}>
          {dish.name}
        </Text>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {dish.restaurant}
        </Text>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <MaterialIcons name="star" size={14} color={theme.accent} />
            <Text style={styles.trustText}>{dish.rating}</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="verified" size={14} color={theme.success} />
            <Text style={styles.trustText}>{dish.chefScore}%</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{dish.price}</Text>
            {dish.originalPrice > dish.price && (
              <Text style={styles.originalPrice}>₹{dish.originalPrice}</Text>
            )}
          </View>

          <Pressable style={styles.addButton} onPress={handleAddPress}>
            <LinearGradient
              colors={theme.gradients.genie}
              style={styles.addGradient}
            >
              <MaterialIcons name="add" size={18} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.08)',
    ...theme.shadows.cardElevated,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.card,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textOnPrimary,
  },
  content: {
    padding: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  restaurantName: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  originalPrice: {
    fontSize: 14,
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  addButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  addGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
