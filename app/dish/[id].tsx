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
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { comboSuggestions, priceComparison, mockRestaurants } from '../../services/mockData';

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { allDishes, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);

  const dish = allDishes.find(d => d.id === id);
  const restaurant = dish ? mockRestaurants.find(r => r.id === dish.restaurantId) : null;

  if (!dish) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Dish not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (let i = 0; i < quantity; i++) {
      addToCart(dish, selectedCombos);
    }
    router.back();
  };

  const toggleCombo = (comboId: string) => {
    Haptics.selectionAsync();
    setSelectedCombos(prev =>
      prev.includes(comboId)
        ? prev.filter(id => id !== comboId)
        : [...prev, comboId]
    );
  };

  const comboTotal = selectedCombos.reduce((sum, id) => {
    const combo = comboSuggestions.find(c => c.id === id);
    return sum + (combo?.price || 0);
  }, 0);

  const totalPrice = (dish.price + comboTotal) * quantity;

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image
          source={dish.image}
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageOverlay}
        />
        <SafeAreaView edges={['top']} style={styles.headerOverlay}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
        </SafeAreaView>
        {dish.tags[0] && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{dish.tags[0]}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Price */}
        <View style={styles.titleSection}>
          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.restaurantName}>{dish.restaurant}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{dish.price}</Text>
            {dish.originalPrice > dish.price && (
              <Text style={styles.originalPrice}>₹{dish.originalPrice}</Text>
            )}
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                Save ₹{dish.originalPrice - dish.price}
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Row */}
        <View style={styles.trustSection}>
          <Pressable
            style={styles.trustCard}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/trust-profile');
            }}
          >
            <View style={styles.trustIcon}>
              <MaterialIcons name="verified" size={20} color={theme.success} />
            </View>
            <View style={styles.trustInfo}>
              <Text style={styles.trustLabel}>Chef Score</Text>
              <Text style={styles.trustValue}>{dish.chefScore}%</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <View style={styles.trustCard}>
            <View style={styles.trustIcon}>
              <MaterialIcons name="star" size={20} color={theme.accent} />
            </View>
            <View style={styles.trustInfo}>
              <Text style={styles.trustLabel}>Rating</Text>
              <Text style={styles.trustValue}>{dish.rating}</Text>
            </View>
          </View>

          <View style={styles.trustCard}>
            <View style={styles.trustIcon}>
              <MaterialIcons name="local-shipping" size={20} color={theme.primary} />
            </View>
            <View style={styles.trustInfo}>
              <Text style={styles.trustLabel}>Delivery</Text>
              <Text style={styles.trustValue}>{dish.deliveryTime}</Text>
            </View>
          </View>
        </View>

        {/* Why FoodGenie Picked This */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Why FoodGenie picked this</Text>
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>{dish.reason}</Text>
          </View>
        </View>

        {/* Nutrition Info */}
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{dish.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{dish.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{dish.spiceLevel}/4</Text>
              <Text style={styles.nutritionLabel}>Spice Level</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{dish.isVeg ? '🥬' : '🍗'}</Text>
              <Text style={styles.nutritionLabel}>{dish.isVeg ? 'Veg' : 'Non-Veg'}</Text>
            </View>
          </View>
        </View>

        {/* Smart Combo */}
        <View style={styles.comboSection}>
          <Text style={styles.sectionTitle}>Complete your meal</Text>
          <Text style={styles.sectionSubtitle}>Suggested to balance your meal</Text>
          <View style={styles.comboChips}>
            {comboSuggestions.map((combo) => (
              <Pressable
                key={combo.id}
                style={[
                  styles.comboChip,
                  selectedCombos.includes(combo.id) && styles.comboChipActive,
                ]}
                onPress={() => toggleCombo(combo.id)}
              >
                <Text
                  style={[
                    styles.comboChipText,
                    selectedCombos.includes(combo.id) && styles.comboChipTextActive,
                  ]}
                >
                  {combo.label}
                </Text>
                <Text
                  style={[
                    styles.comboChipPrice,
                    selectedCombos.includes(combo.id) && styles.comboChipTextActive,
                  ]}
                >
                  +₹{combo.price}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Price Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Transparent Pricing</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Other Apps</Text>
                <Text style={styles.comparisonValueOther}>
                  ₹{Math.round(dish.price * 1.35)}
                </Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>FoodGenie</Text>
                <Text style={styles.comparisonValueGenie}>₹{dish.price}</Text>
              </View>
            </View>
            <Text style={styles.comparisonNote}>{priceComparison.note}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Add to Cart */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.quantitySelector}>
          <Pressable
            style={styles.quantityButton}
            onPress={() => {
              Haptics.selectionAsync();
              setQuantity(Math.max(1, quantity - 1));
            }}
          >
            <MaterialIcons name="remove" size={20} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.quantityText}>{quantity}</Text>
          <Pressable
            style={styles.quantityButton}
            onPress={() => {
              Haptics.selectionAsync();
              setQuantity(quantity + 1);
            }}
          >
            <MaterialIcons name="add" size={20} color={theme.textPrimary} />
          </Pressable>
        </View>

        <Pressable style={styles.addToCartButton} onPress={handleAddToCart}>
          <LinearGradient
            colors={theme.gradients.genie}
            style={styles.addToCartGradient}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
            <Text style={styles.addToCartPrice}>₹{totalPrice}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textOnPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  dishName: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  restaurantName: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.primary,
  },
  originalPrice: {
    fontSize: 20,
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.success,
  },
  trustSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  trustCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    gap: 8,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustInfo: {
    flex: 1,
  },
  trustLabel: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  trustValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  reasonSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: -8,
    marginBottom: 12,
  },
  reasonBox: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
  },
  reasonText: {
    fontSize: 15,
    color: theme.textPrimary,
    lineHeight: 22,
  },
  nutritionSection: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  comboSection: {
    marginBottom: 24,
  },
  comboChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  comboChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  comboChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  comboChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  comboChipPrice: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  comboChipTextActive: {
    color: theme.textOnPrimary,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  comparisonValueOther: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  comparisonValueGenie: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.success,
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: theme.border,
  },
  comparisonNote: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    width: 28,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addToCartText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  addToCartPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
});
