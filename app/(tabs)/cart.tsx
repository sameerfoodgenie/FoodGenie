import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { priceComparison } from '../../services/mockData';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useApp();

  const handleQuantityChange = (dishId: string, delta: number) => {
    Haptics.selectionAsync();
    const item = cart.find(i => i.dish.id === dishId);
    if (item) {
      updateQuantity(dishId, item.quantity + delta);
    }
  };

  const handleRemove = (dishId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeFromCart(dishId);
  };

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Mock checkout
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Ask FoodGenie to find your perfect meal
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
          <Pressable onPress={() => { Haptics.selectionAsync(); clearCart(); }}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>
        </View>

        {/* Cart Items */}
        {cart.map((item) => (
          <View key={item.dish.id} style={styles.cartItem}>
            <Image
              source={item.dish.image}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.dish.name}</Text>
              <Text style={styles.itemRestaurant}>{item.dish.restaurant}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>₹{item.dish.price}</Text>
                {item.dish.originalPrice > item.dish.price && (
                  <Text style={styles.originalPrice}>₹{item.dish.originalPrice}</Text>
                )}
              </View>
            </View>
            <View style={styles.quantityControls}>
              <Pressable
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.dish.id, -1)}
              >
                <MaterialIcons name="remove" size={20} color={theme.textPrimary} />
              </Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Pressable
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item.dish.id, 1)}
              >
                <MaterialIcons name="add" size={20} color={theme.textPrimary} />
              </Pressable>
            </View>
          </View>
        ))}

        {/* Price Comparison Banner */}
        <View style={styles.comparisonBanner}>
          <View style={styles.comparisonHeader}>
            <MaterialIcons name="savings" size={24} color={theme.success} />
            <Text style={styles.comparisonTitle}>You're saving with FoodGenie!</Text>
          </View>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Other Apps</Text>
              <Text style={styles.comparisonValueOther}>
                ₹{Math.round(cartTotal * 1.25)}
              </Text>
            </View>
            <View style={styles.comparisonDivider} />
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>FoodGenie</Text>
              <Text style={styles.comparisonValueGenie}>₹{cartTotal}</Text>
            </View>
          </View>
          <Text style={styles.comparisonNote}>{priceComparison.note}</Text>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartTotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValueFree}>FREE</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes</Text>
            <Text style={styles.summaryValue}>₹{Math.round(cartTotal * 0.05)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₹{cartTotal + Math.round(cartTotal * 0.05)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={[styles.checkoutContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>
            Proceed to Checkout · ₹{cartTotal + Math.round(cartTotal * 0.05)}
          </Text>
        </Pressable>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  clearText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 8,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadows.card,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  itemRestaurant: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: theme.textMuted,
    textDecorationLine: 'line-through',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    width: 24,
    textAlign: 'center',
  },
  comparisonBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginVertical: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
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
  summaryCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  summaryValueFree: {
    fontSize: 15,
    color: theme.success,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  checkoutButton: {
    backgroundColor: theme.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
});
