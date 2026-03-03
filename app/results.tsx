import React, { useState, useCallback } from 'react';
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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

import ClarificationModal from '../components/ClarificationModal';
import OrderPartnerSheet from '../components/OrderPartnerSheet';
import { getPartnerById, openPartnerWithSearch, recordPartnerRedirect, PartnerApp } from '../services/partnerApps';
import { useAuth, useAlert } from '@/template';

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { aiResults, recordIgnoredBestMatch, recordSpiceChoice, preferences, updatePreferences, syncPreferencesToDB, allRestaurants } = useApp();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [showClarification, setShowClarification] = useState(false);

  // Order sheet state
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderDish, setOrderDish] = useState<{ name: string; restaurant: string; price: number } | null>(null);

  const preferredPartnerId = preferences.preferredPartnerApp || null;
  const preferredPartner = preferredPartnerId ? getPartnerById(preferredPartnerId) : null;

  const handleOrderDish = useCallback((dishName: string, restaurantName: string, price: number) => {
    Haptics.selectionAsync();
    setOrderDish({ name: dishName, restaurant: restaurantName, price });
    if (preferredPartner) {
      // Direct redirect with preferred partner
      handleDirectOrder(preferredPartner, restaurantName, dishName);
    } else {
      setShowOrderSheet(true);
    }
  }, [preferredPartner]);

  const handleDirectOrder = useCallback(async (partner: PartnerApp, restaurantName: string, dishName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user?.id) {
      recordPartnerRedirect(user.id, partner.id).catch(() => {});
    }
    updatePreferences({ lastPartnerUsed: partner.id });
    const success = await openPartnerWithSearch(partner, restaurantName, dishName);
    if (!success) {
      showAlert('Could not open app', 'Please install the app or try the web version.');
    }
  }, [user?.id, updatePreferences, showAlert]);

  const handleDishPress = (dishId: string) => {
    Haptics.selectionAsync();
    router.push(`/dish/${dishId}`);
  };

  const handleBudgetAdjust = async () => {
    const newMax = Math.max(preferences.budgetMin + 100, preferences.budgetMax - 100);
    updatePreferences({ budgetMax: newMax });
    await syncPreferencesToDB();
  };

  const handleClarificationSelect = (reason: string) => {
    console.log('Clarification reason:', reason);
  };

  const toggleReason = (dishId: string) => {
    Haptics.selectionAsync();
    setExpandedReason(prev => prev === dishId ? null : dishId);
  };

  const getRankLabel = (rank: string) => {
    switch (rank) {
      case 'best': return '🥇 Best Match';
      case 'strong': return '⭐ Strong Match';
      case 'good': return '⭐ Good Alternative';
      default: return '⭐ Match';
    }
  };

  const estimatedTotal = aiResults.reduce((sum, r) => sum + r.estimatedTotal, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.selectionAsync(); router.back(); }} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FoodGenie Picks</Text>
          <Text style={styles.headerSubtitle}>Top 3 matches for you</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {aiResults.map((result, index) => {
          const isBest = result.rank === 'best';
          const restaurant = allRestaurants.find(r => r.id === result.dish.restaurantId);
          const isExpanded = expandedReason === result.dish.id;

          return (
            <Animated.View
              key={result.dish.id}
              entering={FadeInDown.delay(index * 150).duration(400)}
            >
              <Pressable
                style={[styles.resultCard, isBest && styles.bestCard]}
                onPress={() => handleDishPress(result.dish.id)}
              >
                {/* Rank badge */}
                <View style={[styles.rankBadge, isBest && styles.rankBadgeBest]}>
                  <Text style={[styles.rankText, isBest && styles.rankTextBest]}>
                    {getRankLabel(result.rank)}
                  </Text>
                </View>

                {/* Image */}
                <View style={[styles.imageContainer, isBest && styles.bestImageContainer]}>
                  <Image
                    source={result.dish.image}
                    style={[styles.dishImage, isBest && styles.bestDishImage]}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.imageOverlay}
                  />
                </View>

                {/* Info */}
                <View style={styles.cardContent}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.dishName, isBest && styles.bestDishName]}>{result.dish.name}</Text>
                    {result.isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <MaterialIcons name="verified" size={14} color={theme.success} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.restaurantName}>{result.dish.restaurant}</Text>

                  {/* Trust row */}
                  <View style={styles.trustRow}>
                    <View style={styles.trustItem}>
                      <MaterialIcons name="star" size={14} color={theme.accent} />
                      <Text style={styles.trustText}>{result.dish.rating}</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <MaterialIcons name="schedule" size={14} color={theme.textSecondary} />
                      <Text style={styles.trustText}>{result.dish.deliveryTime}</Text>
                    </View>
                    <View style={styles.trustItem}>
                      <Text style={styles.spiceIndicator}>
                        {'🌶️'.repeat(result.dish.spiceLevel)}
                      </Text>
                    </View>
                  </View>

                  {/* Why this? */}
                  <Pressable style={styles.whyButton} onPress={() => toggleReason(result.dish.id)}>
                    <MaterialIcons name="lightbulb" size={16} color={theme.primary} />
                    <Text style={styles.whyButtonText}>Why this?</Text>
                    <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={18} color={theme.primary} />
                  </Pressable>

                  {isExpanded ? (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.reasonsBox}>
                      {result.reasons.map((reason, ri) => (
                        <View key={ri} style={styles.reasonItem}>
                          <MaterialIcons name="check-circle" size={14} color={theme.success} />
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                    </Animated.View>
                  ) : null}

                  {/* Price & Order */}
                  <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.price, isBest && styles.bestPrice]}>₹{result.dish.price}</Text>
                      {result.dish.originalPrice > result.dish.price ? (
                        <Text style={styles.originalPrice}>₹{result.dish.originalPrice}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                      onPress={() => handleOrderDish(result.dish.name, result.dish.restaurant, result.dish.price)}
                    >
                      <LinearGradient colors={theme.gradients.genie} style={styles.orderGradient}>
                        <MaterialIcons name="open-in-new" size={15} color={theme.textOnPrimary} />
                        <Text style={styles.orderBtnText}>
                          {preferredPartner ? `Order on ${preferredPartner.name}` : 'Order via partner'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Estimated Total */}
        {aiResults.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total (all 3)</Text>
              <Text style={styles.totalValue}>₹{estimatedTotal}</Text>
            </View>
            <Text style={styles.totalNote}>Includes estimated delivery. No hidden charges.</Text>
          </Animated.View>
        ) : null}

        {/* Manage partner apps link */}
        {aiResults.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(550).duration(400)}>
            <Pressable
              style={styles.managePartnersLink}
              onPress={() => { Haptics.selectionAsync(); router.push('/partner-apps'); }}
            >
              <MaterialIcons name="settings" size={16} color={theme.textMuted} />
              <Text style={styles.managePartnersText}>Manage partner apps & preferences</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.textMuted} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Trust footer */}
        <View style={styles.trustFooter}>
          <MaterialIcons name="info" size={16} color={theme.primary} />
          <Text style={styles.trustFooterText}>
            All restaurants shown. Verified kitchens earn the badge through audits, not payments.
          </Text>
        </View>
      </ScrollView>

      <ClarificationModal
        visible={showClarification}
        onClose={() => setShowClarification(false)}
        onSelect={handleClarificationSelect}
        onBudgetConfirm={handleBudgetAdjust}
      />

      <OrderPartnerSheet
        visible={showOrderSheet}
        onClose={() => setShowOrderSheet(false)}
        restaurantName={orderDish?.restaurant || ''}
        dishName={orderDish?.name || ''}
        dishPrice={orderDish?.price}
        preferredPartnerId={preferredPartnerId}
      />
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

  // Result card
  resultCard: { backgroundColor: theme.background, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.1)', ...theme.shadows.card },
  bestCard: { borderColor: 'rgba(251, 191, 36, 0.35)', ...theme.shadows.cardElevated },
  rankBadge: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.backgroundTertiary },
  rankBadgeBest: { backgroundColor: 'rgba(251, 191, 36, 0.15)' },
  rankText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  rankTextBest: { color: theme.primary, fontWeight: '700' },
  imageContainer: { height: 160 },
  bestImageContainer: { height: 200 },
  dishImage: { width: '100%', height: '100%' },
  bestDishImage: {},
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  cardContent: { padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dishName: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  bestDishName: { fontSize: 20 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  verifiedText: { fontSize: 10, fontWeight: '600', color: theme.success },
  restaurantName: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  trustRow: { flexDirection: 'row', gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  spiceIndicator: { fontSize: 12 },

  // Why this
  whyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  whyButtonText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  reasonsBox: { backgroundColor: theme.backgroundTertiary, borderRadius: theme.borderRadius.md, padding: 12, gap: 8, marginBottom: 4 },
  reasonItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reasonText: { fontSize: 13, color: theme.textPrimary, lineHeight: 18, flex: 1 },

  // Price + Order
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  bestPrice: { fontSize: 26 },
  originalPrice: { fontSize: 15, color: theme.textMuted, textDecorationLine: 'line-through' },
  orderBtn: { borderRadius: 12, overflow: 'hidden' },
  orderGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 11 },
  orderBtnText: { fontSize: 13, fontWeight: '700', color: theme.textOnPrimary },

  // Total
  totalCard: { backgroundColor: theme.background, borderRadius: theme.borderRadius.lg, padding: 20, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  totalValue: { fontSize: 24, fontWeight: '700', color: theme.primary },
  totalNote: { fontSize: 12, color: theme.textMuted, marginTop: 8 },

  // Trust footer
  trustFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: theme.backgroundTertiary, padding: 14, borderRadius: theme.borderRadius.md },
  trustFooterText: { flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 18 },

  // Partner links
  managePartnersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  managePartnersText: { fontSize: 13, color: theme.textMuted },
});
