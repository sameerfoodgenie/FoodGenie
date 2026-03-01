import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import {
  PartnerApp,
  getSortedPartners,
  openPartnerWithSearch,
  copyDishInfo,
  recordPartnerRedirect,
} from '../services/partnerApps';
import { useAuth, useAlert } from '@/template';
import { useApp } from '../contexts/AppContext';

interface OrderPartnerSheetProps {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  dishName: string;
  dishPrice?: number;
  preferredPartnerId: string | null;
}

export default function OrderPartnerSheet({
  visible,
  onClose,
  restaurantName,
  dishName,
  dishPrice,
  preferredPartnerId,
}: OrderPartnerSheetProps) {
  const sorted = getSortedPartners(preferredPartnerId);
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { updatePreferences } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPartner, setPendingPartner] = useState<PartnerApp | null>(null);

  const handleOpenApp = useCallback((app: PartnerApp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingPartner(app);
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingPartner) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirm(false);

    if (user?.id) {
      recordPartnerRedirect(user.id, pendingPartner.id).catch(() => {});
    }
    updatePreferences({ lastPartnerUsed: pendingPartner.id });

    const success = await openPartnerWithSearch(
      pendingPartner,
      restaurantName,
      dishName,
    );
    if (!success) {
      showAlert('Could not open app', 'Please install the app or try the web version.');
    }
    setPendingPartner(null);
    onClose();
  }, [pendingPartner, restaurantName, dishName, user?.id, updatePreferences, showAlert, onClose]);

  const handleCopy = useCallback(async (app: PartnerApp) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await copyDishInfo(restaurantName, dishName, dishPrice);
    showAlert('Copied', `"${dishName} from ${restaurantName}" copied to clipboard. Paste in ${app.name} to search.`);
  }, [restaurantName, dishName, dishPrice, showAlert]);

  return (
    <>
      <Modal
        visible={visible && !showConfirm}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <Text style={styles.title}>Order options</Text>
            <Text style={styles.subtitle}>
              Choose a partner app to order{dishName ? ` "${dishName}"` : ''}
            </Text>

            <View style={styles.disclaimerRow}>
              <MaterialIcons name="info-outline" size={14} color={theme.textMuted} />
              <Text style={styles.disclaimerText}>
                You will complete checkout in the selected partner app.
              </Text>
            </View>

            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.appsList}>
                {sorted.map((app, index) => {
                  const isPreferred = preferredPartnerId === app.id;
                  return (
                    <Animated.View
                      key={app.id}
                      entering={FadeInDown.delay(index * 50).duration(280)}
                    >
                      <View style={[styles.appRow, isPreferred && styles.appRowPreferred]}>
                        <View style={[styles.appIcon, { backgroundColor: `${app.color}20` }]}>
                          <Text style={styles.appEmoji}>{app.iconEmoji}</Text>
                        </View>
                        <View style={styles.appInfo}>
                          <View style={styles.appNameRow}>
                            <Text style={styles.appName}>{app.name}</Text>
                            {isPreferred ? (
                              <View style={styles.preferredBadge}>
                                <Text style={styles.preferredText}>Preferred</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.appDesc} numberOfLines={1}>{app.description}</Text>
                          <View style={styles.appActions}>
                            <Pressable
                              style={({ pressed }) => [styles.openBtn, pressed && { opacity: 0.8 }]}
                              onPress={() => handleOpenApp(app)}
                            >
                              <MaterialIcons name="open-in-new" size={14} color={theme.textOnPrimary} />
                              <Text style={styles.openBtnText}>Open App</Text>
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}
                              onPress={() => handleCopy(app)}
                            >
                              <MaterialIcons name="content-copy" size={14} color={theme.primary} />
                              <Text style={styles.copyBtnText}>Copy dish info</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable
              style={styles.cancelButton}
              onPress={() => { Haptics.selectionAsync(); onClose(); }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable style={styles.confirmOverlay} onPress={() => setShowConfirm(false)}>
          <Pressable style={styles.confirmSheet} onPress={() => {}}>
            <View style={styles.confirmHandle} />
            {pendingPartner ? (
              <Animated.View entering={FadeIn.duration(250)} style={styles.confirmContent}>
                <Text style={styles.confirmEmoji}>{pendingPartner.iconEmoji}</Text>
                <Text style={styles.confirmTitle}>Opening {pendingPartner.name}</Text>
                <Text style={styles.confirmMessage}>
                  You will complete checkout in {pendingPartner.name}.{'\n'}
                  Searching for: "{restaurantName} {dishName}"
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    style={styles.confirmCancelBtn}
                    onPress={() => { Haptics.selectionAsync(); setShowConfirm(false); }}
                  >
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.confirmContinueBtn} onPress={handleConfirm}>
                    <LinearGradient colors={theme.gradients.genie} style={styles.confirmGradient}>
                      <MaterialIcons name="open-in-new" size={16} color={theme.textOnPrimary} />
                      <Text style={styles.confirmContinueText}>Continue</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4, marginBottom: 12 },

  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.12)',
  },
  disclaimerText: { fontSize: 12, color: theme.textMuted, flex: 1, lineHeight: 17 },

  scrollArea: { maxHeight: 400 },
  appsList: { gap: 10 },
  appRow: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  appRowPreferred: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appEmoji: { fontSize: 20 },
  appInfo: { flex: 1 },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  appName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  preferredBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  preferredText: { fontSize: 10, fontWeight: '700', color: theme.textOnPrimary },
  appDesc: { fontSize: 12, color: theme.textSecondary, marginBottom: 12 },

  appActions: {
    flexDirection: 'row',
    gap: 10,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  openBtnText: { fontSize: 13, fontWeight: '600', color: theme.textOnPrimary },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  cancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },

  // Confirmation
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  confirmSheet: { backgroundColor: theme.background, borderRadius: 24, paddingTop: 12, paddingBottom: 28 },
  confirmHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 20 },
  confirmContent: { paddingHorizontal: 24, alignItems: 'center' },
  confirmEmoji: { fontSize: 40 },
  confirmTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginTop: 12, marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  confirmCancelText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
  confirmContinueBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  confirmContinueText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
