import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '@/template';
import {
  partnerApps,
  getSortedPartners,
  openPartnerApp,
  savePartnerPreference,
  recordPartnerRedirect,
  PartnerApp,
} from '../services/partnerApps';

export default function PartnerAppsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences, syncPreferencesToDB } = useApp();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PartnerApp | null>(null);

  const preferredId = preferences.preferredPartnerApp || null;
  const sorted = getSortedPartners(preferredId);

  const handleOpenApp = useCallback((app: PartnerApp) => {
    Haptics.selectionAsync();
    setSelectedApp(app);
    setShowConfirm(true);
  }, []);

  const handleConfirmRedirect = useCallback(async () => {
    if (!selectedApp) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirm(false);

    // Track redirect
    if (user?.id) {
      await recordPartnerRedirect(user.id, selectedApp.id);
    }
    updatePreferences({ lastPartnerUsed: selectedApp.id });

    // Open the app
    await openPartnerApp(selectedApp);
    setSelectedApp(null);
  }, [selectedApp, user?.id]);

  const handleToggleDefault = useCallback(async (app: PartnerApp) => {
    Haptics.selectionAsync();
    const newDefault = preferredId === app.id ? null : app.id;
    updatePreferences({ preferredPartnerApp: newDefault });
    if (user?.id) {
      await savePartnerPreference(user.id, newDefault);
    }
  }, [preferredId, user?.id]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order via Partner Apps</Text>
          <Text style={styles.headerSubtitle}>Choose where to order</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.infoBanner}>
          <MaterialIcons name="info" size={18} color={theme.primary} />
          <Text style={styles.infoText}>
            FoodGenie helps you decide. Complete your order on your preferred delivery app.
          </Text>
        </Animated.View>

        {/* Partner app cards */}
        {sorted.map((app, index) => {
          const isDefault = preferredId === app.id;
          return (
            <Animated.View
              key={app.id}
              entering={FadeInDown.delay(100 + index * 80).duration(400)}
            >
              <View style={[styles.appCard, isDefault && styles.appCardDefault]}>
                {/* Recommended badge */}
                {isDefault ? (
                  <View style={styles.recommendedBadge}>
                    <MaterialIcons name="star" size={12} color={theme.textOnPrimary} />
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                ) : null}

                <View style={styles.appRow}>
                  {/* Icon */}
                  <View style={[styles.appIcon, { backgroundColor: `${app.color}20` }]}>
                    <Text style={styles.appEmoji}>{app.iconEmoji}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appDescription}>{app.description}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.appActions}>
                  {/* Default toggle */}
                  <Pressable
                    style={styles.toggleRow}
                    onPress={() => handleToggleDefault(app)}
                  >
                    <Text style={styles.toggleLabel}>Prefer by default</Text>
                    <Switch
                      value={isDefault}
                      onValueChange={() => handleToggleDefault(app)}
                      trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                      thumbColor={isDefault ? theme.primary : theme.textMuted}
                    />
                  </Pressable>

                  {/* Open button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.openButton,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => handleOpenApp(app)}
                  >
                    <LinearGradient
                      colors={[app.color, `${app.color}CC`]}
                      style={styles.openGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <MaterialIcons name="open-in-new" size={16} color="#FFF" />
                      <Text style={styles.openText}>Open App</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <MaterialIcons name="security" size={16} color={theme.textMuted} />
          <Text style={styles.disclaimerText}>
            FoodGenie does not place orders or process payments. You will complete checkout directly in the selected app.
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowConfirm(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalContent}>
              {selectedApp ? (
                <>
                  <View style={[styles.modalAppIcon, { backgroundColor: `${selectedApp.color}20` }]}>
                    <Text style={{ fontSize: 32 }}>{selectedApp.iconEmoji}</Text>
                  </View>
                  <Text style={styles.modalTitle}>Opening {selectedApp.name}</Text>
                  <Text style={styles.modalMessage}>
                    You will complete checkout in the selected app. FoodGenie does not process orders or payments.
                  </Text>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => { Haptics.selectionAsync(); setShowConfirm(false); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalContinueButton,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleConfirmRedirect}
                >
                  <LinearGradient colors={theme.gradients.genie} style={styles.modalContinueGradient}>
                    <MaterialIcons name="open-in-new" size={18} color={theme.textOnPrimary} />
                    <Text style={styles.modalContinueText}>Continue</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundSecondary },
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },

  scrollContent: { padding: 16, gap: 12 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 14, color: theme.textPrimary, lineHeight: 20 },

  // App card
  appCard: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadows.card,
  },
  appCardDefault: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    ...theme.shadows.cardElevated,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginBottom: 12,
  },
  recommendedText: { fontSize: 11, fontWeight: '700', color: theme.textOnPrimary },

  appRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appEmoji: { fontSize: 24 },
  appInfo: { flex: 1 },
  appName: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
  appDescription: { fontSize: 13, color: theme.textSecondary, marginTop: 3, lineHeight: 18 },

  appActions: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight, gap: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },

  openButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  openGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  openText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.md,
    marginTop: 4,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: theme.textMuted, lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalContent: { paddingHorizontal: 24, alignItems: 'center' },
  modalAppIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
  modalMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
  modalContinueButton: { flex: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  modalContinueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  modalContinueText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
