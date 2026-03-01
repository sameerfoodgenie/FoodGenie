import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface ModePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'quick' | 'guided') => void;
}

export default function ModePromptModal({ visible, onClose, onSelectMode }: ModePromptModalProps) {
  const handleSelect = (mode: 'quick' | 'guided') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectMode(mode);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>⚡</Text>
          <Text style={styles.title}>How should I recommend?</Text>
          <Text style={styles.subtitle}>
            After several sessions, I know your taste. Would you like faster recommendations or keep the guided experience?
          </Text>

          <View style={styles.options}>
            <Pressable
              style={styles.optionCard}
              onPress={() => handleSelect('quick')}
            >
              <LinearGradient
                colors={theme.gradients.genie}
                style={styles.optionGradient}
              >
                <MaterialIcons name="flash-on" size={28} color={theme.textOnPrimary} />
                <Text style={styles.optionTitle}>Quick Mode</Text>
                <Text style={styles.optionDesc}>Instant best match, no questions</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.optionCardOutlined}
              onPress={() => handleSelect('guided')}
            >
              <MaterialIcons name="chat" size={28} color={theme.primary} />
              <Text style={styles.optionTitleDark}>Guided Mode</Text>
              <Text style={styles.optionDescDark}>Refine with questions like{"\n"}"Feeling adventurous or safe?"</Text>
            </Pressable>
          </View>

          <Pressable style={styles.dismissLink} onPress={onClose}>
            <Text style={styles.dismissText}>Decide later</Text>
          </Pressable>
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
    gap: 12,
  },
  optionCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  optionDesc: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  optionCardOutlined: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionTitleDark: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  optionDescDark: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
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
});
