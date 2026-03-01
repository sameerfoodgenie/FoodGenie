import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { comboSuggestions } from '../services/mockData';

export default function RecommendationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { allDishes, addToCart } = useApp();
  const [selectedCombos, setSelectedCombos] = useState<string[]>([]);

  const handleDishPress = (dishId: string) => {
    Haptics.selectionAsync();
    router.push(`/dish/${dishId}`);
  };

  const handleAddToCart = (dish: typeof allDishes[0]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(dish);
  };

  const toggleCombo = (comboId: string) => {
    Haptics.selectionAsync();
    setSelectedCombos(prev =>
      prev.includes(comboId)
        ? prev.filter(id => id !== comboId)
        : [...prev, comboId]
    );
  };

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FoodGenie Picks</Text>
          <Text style={styles.headerSubtitle}>All dishes for you</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {allDishes.slice(0, Math.max(6, allDishes.length)).map((dish, index) => (
          <Animated.View
            key={dish.id}
            entering={FadeInDown.delay(index * 100).duration(400)}
          >
            <Pressable
              style={({ pressed }) => [
                styles.dishCard,
                pressed && styles.dishCardPressed,
              ]}
              onPress={() => handleDishPress(dish.id)}
            >
              <View style={styles.imageContainer}>
                <Image source={dish.image} style={styles.dishImage} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageOverlay}
                />
                {dish.tags[0] ? (
                  <LinearGradient colors={theme.gradients.vibrant} style={styles.tagBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.tagText}>{dish.tags[0]}</Text>
                  </LinearGradient>
                ) : null}
              </View>

              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{dish.name}</Text>
                <Text style={styles.restaurantName}>{dish.restaurant}</Text>

                <View style={styles.trustRow}>
                  <View style={styles.trustItem}>
                    <MaterialIcons name="star" size={16} color={theme.accent} />
                    <Text style={styles.trustText}>{dish.rating}</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <MaterialIcons name="verified" size={16} color={theme.success} />
                    <Text style={styles.trustText}>{dish.chefScore}%</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <MaterialIcons name="schedule" size={16} color={theme.textSecondary} />
                    <Text style={styles.trustText}>{dish.deliveryTime}</Text>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>Why FoodGenie picked this</Text>
                  <Text style={styles.reasonText}>{dish.reason}</Text>
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>₹{dish.price}</Text>
                    {dish.originalPrice > dish.price ? (
                      <Text style={styles.originalPrice}>₹{dish.originalPrice}</Text>
                    ) : null}
                  </View>
                  <Pressable style={styles.addButton} onPress={() => handleAddToCart(dish)}>
                    <LinearGradient colors={theme.gradients.genie} style={styles.addButtonGradient}>
                      <MaterialIcons name="add" size={20} color="#FFF" />
                      <Text style={styles.addButtonText}>Add</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        {/* Smart Combo Builder */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={styles.comboSection}>
            <View style={styles.comboHeader}>
              <Text style={styles.comboTitle}>Complete your meal</Text>
              <Text style={styles.comboSubtitle}>Suggested to balance your meal</Text>
            </View>
            <View style={styles.comboChips}>
              {comboSuggestions.slice(0, 4).map((combo) => (
                <Pressable
                  key={combo.id}
                  style={[styles.comboChip, selectedCombos.includes(combo.id) && styles.comboChipActive]}
                  onPress={() => toggleCombo(combo.id)}
                >
                  <Text style={[styles.comboChipText, selectedCombos.includes(combo.id) && styles.comboChipTextActive]}>
                    {combo.label}
                  </Text>
                  <Text style={[styles.comboChipPrice, selectedCombos.includes(combo.id) && styles.comboChipTextActive]}>
                    +₹{combo.price}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={styles.trustFooter}>
          <MaterialIcons name="info" size={18} color={theme.primary} />
          <Text style={styles.trustFooterText}>
            All prices are transparent — no hidden markup or surge pricing
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.stickyCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={styles.viewCartButton}
          onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/cart'); }}
        >
          <Text style={styles.viewCartText}>View Cart</Text>
          <MaterialIcons name="arrow-forward" size={20} color={theme.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  scrollContent: { padding: 16, gap: 16 },
  dishCard: { backgroundColor: theme.background, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.15)', ...theme.shadows.cardElevated, marginBottom: 16 },
  dishCardPressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  imageContainer: { position: 'relative', height: 220 },
  dishImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, zIndex: 1 },
  tagBadge: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.full, zIndex: 2, ...theme.shadows.card },
  tagText: { fontSize: 12, fontWeight: '600', color: theme.textOnPrimary },
  dishInfo: { padding: 20 },
  dishName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  restaurantName: { fontSize: 15, color: theme.textSecondary, marginTop: 4 },
  trustRow: { flexDirection: 'row', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  reasonBox: { backgroundColor: theme.backgroundTertiary, borderRadius: theme.borderRadius.lg, padding: 18, marginTop: 16, borderLeftWidth: 4, borderLeftColor: theme.primary },
  reasonLabel: { fontSize: 11, fontWeight: '600', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  reasonText: { fontSize: 14, color: theme.textPrimary, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
  originalPrice: { fontSize: 18, color: theme.textMuted, textDecorationLine: 'line-through' },
  addButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 24, paddingVertical: 14 },
  addButtonText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
  comboSection: { backgroundColor: theme.background, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', ...theme.shadows.cardElevated },
  comboHeader: { marginBottom: 16 },
  comboTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  comboSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  comboChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  comboChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.border },
  comboChipActive: { backgroundColor: theme.accent, borderColor: theme.accent, ...theme.shadows.colored },
  comboChipText: { fontSize: 14, fontWeight: '500', color: theme.textPrimary },
  comboChipPrice: { fontSize: 12, color: theme.textSecondary },
  comboChipTextActive: { color: theme.textOnPrimary },
  trustFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.backgroundTertiary, padding: 16, borderRadius: theme.borderRadius.md, marginTop: 8 },
  trustFooterText: { flex: 1, fontSize: 13, color: theme.textPrimary, lineHeight: 18 },
  stickyCTA: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.background, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
  viewCartButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.backgroundTertiary, borderRadius: theme.borderRadius.lg, paddingVertical: 16, borderWidth: 2, borderColor: theme.primary },
  viewCartText: { fontSize: 16, fontWeight: '700', color: theme.primary },
});
