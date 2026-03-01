import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import {
  PartnerApp,
  getSortedPartners,
} from '../services/partnerApps';

interface PartnerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (app: PartnerApp) => void;
  preferredPartnerId: string | null;
}

export default function PartnerBottomSheet({
  visible,
  onClose,
  onSelect,
  preferredPartnerId,
}: PartnerBottomSheetProps) {
  const sorted = getSortedPartners(preferredPartnerId);

  const handleSelect = useCallback((app: PartnerApp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(app);
  }, [onSelect]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>Order on...</Text>
          <Text style={styles.subtitle}>Choose a delivery partner to complete your order</Text>

          <View style={styles.appsList}>
            {sorted.map((app, index) => {
              const isPreferred = preferredPartnerId === app.id;
              return (
                <Animated.View
                  key={app.id}
                  entering={FadeInDown.delay(index * 60).duration(300)}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.appRow,
                      isPreferred && styles.appRowPreferred,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handleSelect(app)}
                  >
                    <View style={[styles.appIcon, { backgroundColor: `${app.color}20` }]}>
                      <Text style={styles.appEmoji}>{app.iconEmoji}</Text>
                    </View>
                    <View style={styles.appInfo}>
                      <View style={styles.appNameRow}>
                        <Text style={styles.appName}>{app.name}</Text>
                        {isPreferred ? (
                          <View style={styles.preferredBadge}>
                            <Text style={styles.preferredText}>Default</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.appDesc}>{app.description}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <Pressable style={styles.cancelButton} onPress={() => { Haptics.selectionAsync(); onClose(); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
    maxHeight: '80%',
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
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4, marginBottom: 20 },

  appsList: { gap: 8 },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
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
  },
  appEmoji: { fontSize: 20 },
  appInfo: { flex: 1 },
  appNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  preferredBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  preferredText: { fontSize: 10, fontWeight: '700', color: theme.textOnPrimary },
  appDesc: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

  cancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
});
