import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface ClarificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reason: string) => void;
  onBudgetConfirm?: () => void;
}

const REASONS = [
  { id: 'expensive', label: 'Too expensive', icon: 'attach-money' },
  { id: 'not_right', label: 'Not what I had in mind', icon: 'sentiment-dissatisfied' },
  { id: 'cuisine', label: 'Prefer different cuisine', icon: 'restaurant' },
  { id: 'exploring', label: 'Just exploring', icon: 'explore' },
];

export default function ClarificationModal({ visible, onClose, onSelect, onBudgetConfirm }: ClarificationModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showBudgetConfirm, setShowBudgetConfirm] = useState(false);

  const handleSelect = (reason: string) => {
    Haptics.selectionAsync();
    setSelected(reason);
    
    if (reason === 'expensive') {
      setShowBudgetConfirm(true);
    } else {
      onSelect(reason);
      setSelected(null);
      onClose();
    }
  };

  const handleBudgetYes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBudgetConfirm(false);
    setSelected(null);
    onBudgetConfirm?.();
    onClose();
  };

  const handleBudgetNo = () => {
    Haptics.selectionAsync();
    setShowBudgetConfirm(false);
    setSelected(null);
    onSelect('expensive');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {showBudgetConfirm ? (
            <>
              <MaterialIcons name="attach-money" size={32} color={theme.primary} />
              <Text style={styles.title}>Adjust Budget?</Text>
              <Text style={styles.subtitle}>
                Would you like me to lower your budget range so I can find more affordable options?
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable style={styles.cancelButton} onPress={handleBudgetNo}>
                  <Text style={styles.cancelText}>No, keep it</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleBudgetYes}>
                  <LinearGradient colors={theme.gradients.genie} style={styles.confirmGradient}>
                    <Text style={styles.confirmText}>Yes, adjust</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>🤔</Text>
              <Text style={styles.title}>Help me understand your preference</Text>
              <Text style={styles.subtitle}>
                You have been skipping my top picks. What can I improve?
              </Text>
              <View style={styles.options}>
                {REASONS.map((r) => (
                  <Pressable
                    key={r.id}
                    style={[styles.option, selected === r.id && styles.optionSelected]}
                    onPress={() => handleSelect(r.id)}
                  >
                    <MaterialIcons name={r.icon as any} size={22} color={selected === r.id ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.optionText, selected === r.id && styles.optionTextSelected]}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.dismissLink} onPress={onClose}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  options: {
    width: '100%',
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  optionTextSelected: {
    color: theme.primary,
    fontWeight: '700',
  },
  dismissLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  confirmButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
});
