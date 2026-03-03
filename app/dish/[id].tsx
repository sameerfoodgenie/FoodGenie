import React, { useState, useCallback } from 'react';
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
import { useAuth, useAlert } from '@/template';
import { comboSuggestions, priceComparison } from '../../services/mockData';
import {
  getPartnerById,
  openPartnerWithSearch,
  recordPartnerRedirect,
  PartnerApp,
} from '../../services/partnerApps';
import OrderPartnerSheet from '../../components/OrderPartnerSheet';

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { allDishes, allRestaurants, preferences, updatePreferences } = useApp();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [showPartnerSheet, setShowPartnerSheet] = useState(false);

  const dish = allDishes.find(d => d.id === id);
  const restaurant = dish ? allRestaurants.find(r => r.id === dish.restaurantId) : null;

  const preferredPartnerId = preferences.preferredPartnerApp || null;
  const preferredPartner = preferredPartnerId ? getPartnerById(preferredPartnerId) : null;

  const handleOrderViaPreferred = useCallback(async () => {
    if (!dish) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!preferredPartner) {
      setShowPartnerSheet(true);
      return;
    }

    if (user?.id) {
      recordPartnerRedirect(user.id, preferredPartner.id).catch(() => {});
    }
    updatePreferences({ lastPartnerUsed: preferredPartner.id });

    const success = await openPartnerWithSearch(
      preferredPartner,
      dish.restaurant,
      dish.name,
    );
    if (!success) {
      showAlert('Could not open app', 'Please install the app or try the web version.');
    }
  }, [dish, preferredPartner, user?.id, updatePreferences, showAlert]);

  if (!dish) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <MaterialIcons name="search-off" size={48} color={theme.textMuted} />
          <Text style={styles.notFoundText}>Dish not found</Text>
          <Pressable onPress={() => router.back()} style={styles.notFoundBtn}>
            <Text style={styles.notFoundBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

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
        {dish.tags[0] ? (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{dish.tags[0]}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Price */}
        <View style={styles.titleSection}>
          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.restaurantName}>{dish.restaurant}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{dish.price}</Text>
            {dish.originalPrice > dish.price ? (
              <Text style={styles.originalPrice}>₹{dish.originalPrice}</Text>
            ) : null}
            {dish.originalPrice > dish.price ? (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>
                  Save ₹{dish.originalPrice - dish.price}
                </Text>
              </View>
            ) : null}
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

        {/* Transparent Pricing */}
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

        {/* More order options */}
        <Pressable
          style={({ pressed }) => [styles.moreOptionsLink, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.selectionAsync();
            setShowPartnerSheet(true);
          }}
        >
          <MaterialIcons name="storefront" size={18} color={theme.primary} />
          <Text style={styles.moreOptionsText}>See all partner apps</Text>
          <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
        </Pressable>
      </ScrollView>

      {/* Sticky Order CTA */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Est. total</Text>
          <Text style={styles.footerPriceValue}>₹{dish.price}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.orderButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={handleOrderViaPreferred}
        >
          <LinearGradient
            colors={theme.gradients.genie}
            style={styles.orderGradient}
          >
            <MaterialIcons
              name={preferredPartner ? 'open-in-new' : 'storefront'}
              size={18}
              color={theme.textOnPrimary}
            />
            <Text style={styles.orderText}>
              {preferredPartner
                ? `Order via ${preferredPartner.name}`
                : 'Choose partner to order'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <OrderPartnerSheet
        visible={showPartnerSheet}
        onClose={() => setShowPartnerSheet(false)}
        restaurantName={dish.restaurant}
        dishName={dish.name}
        dishPrice={dish.price}
        preferredPartnerId={preferredPartnerId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: theme.textSecondary },
  notFoundBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.backgroundSecondary },
  notFoundBtnText: { fontSize: 14, fontWeight: '600', color: theme.primary },

  imageContainer: { position: 'relative', height: 320 },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8 },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  tagBadge: {
    position: 'absolute', bottom: 16, left: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  tagText: { fontSize: 13, fontWeight: '600', color: theme.textOnPrimary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  titleSection: { marginBottom: 24 },
  dishName: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
  restaurantName: { fontSize: 16, color: theme.textSecondary, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  price: { fontSize: 32, fontWeight: '700', color: theme.primary },
  originalPrice: { fontSize: 20, color: theme.textMuted, textDecorationLine: 'line-through' },
  savingsBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.full },
  savingsText: { fontSize: 12, fontWeight: '600', color: theme.success },

  trustSection: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  trustCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.md,
    padding: 12, gap: 8,
  },
  trustIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.background,
    alignItems: 'center', justifyContent: 'center',
  },
  trustInfo: { flex: 1 },
  trustLabel: { fontSize: 11, color: theme.textSecondary },
  trustValue: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },

  reasonSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 },
  reasonBox: { backgroundColor: theme.backgroundTertiary, borderRadius: theme.borderRadius.md, padding: 16 },
  reasonText: { fontSize: 15, color: theme.textPrimary, lineHeight: 22 },

  nutritionSection: { marginBottom: 24 },
  nutritionGrid: { flexDirection: 'row', gap: 12 },
  nutritionItem: {
    flex: 1, backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md, padding: 16, alignItems: 'center',
  },
  nutritionValue: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  nutritionLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 4 },

  comparisonSection: { marginBottom: 24 },
  comparisonCard: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: theme.borderRadius.lg, padding: 20 },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  comparisonItem: { alignItems: 'center' },
  comparisonLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  comparisonValueOther: { fontSize: 20, fontWeight: '600', color: theme.textMuted, textDecorationLine: 'line-through' },
  comparisonValueGenie: { fontSize: 24, fontWeight: '700', color: theme.success },
  comparisonDivider: { width: 1, backgroundColor: theme.border },
  comparisonNote: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', fontStyle: 'italic' },

  moreOptionsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    backgroundColor: 'rgba(251,191,36,0.04)',
  },
  moreOptionsText: { fontSize: 14, fontWeight: '600', color: theme.primary },

  // Sticky footer
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  footerPrice: { alignItems: 'center' },
  footerPriceLabel: { fontSize: 11, color: theme.textMuted },
  footerPriceValue: { fontSize: 22, fontWeight: '700', color: theme.primary },
  orderButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  orderGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, paddingHorizontal: 20,
  },
  orderText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
