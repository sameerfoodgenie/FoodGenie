import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useCreator, CREATOR_TIERS } from '../contexts/CreatorContext';
import { useAlert, useAuth } from '@/template';

const SCHEDULE_OPTIONS = [
  { label: 'In 1 hour', ms: 3600000 },
  { label: 'In 3 hours', ms: 10800000 },
  { label: 'Tomorrow', ms: 86400000 },
  { label: 'In 2 days', ms: 172800000 },
];

export default function ScheduleLiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheduleLiveSession, myCreatorType } = useCreator();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('99');
  const [maxAttendees, setMaxAttendees] = useState('100');
  const [selectedTime, setSelectedTime] = useState(0);

  const tier = CREATOR_TIERS.find(t => t.id === myCreatorType);
  const canSchedulePaid = myCreatorType === 'home_master_chef' || myCreatorType === 'verified_chef';

  const handleSchedule = () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a session title');
      return;
    }
    if (!description.trim()) {
      showAlert('Error', 'Please add a description');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const initials = (user?.username || 'You').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    scheduleLiveSession({
      hostUserId: user?.id || 'me',
      hostUsername: user?.username || 'you',
      hostAvatarInitials: initials,
      hostCreatorType: myCreatorType,
      title: title.trim(),
      description: description.trim(),
      coverUri: null,
      scheduledAt: Date.now() + SCHEDULE_OPTIONS[selectedTime].ms,
      isPaid: isPaid && canSchedulePaid,
      price: isPaid && canSchedulePaid ? parseInt(price) || 99 : 0,
      maxAttendees: parseInt(maxAttendees) || 100,
    });

    showAlert('Session Scheduled', 'Your live session has been scheduled. Your followers will be notified.');
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => { Haptics.selectionAsync(); router.back(); }}>
            <MaterialIcons name="close" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Schedule Live</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Creator type indicator */}
          {tier ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tierIndicator}>
              <View style={[styles.tierIconWrap, { backgroundColor: `${tier.color}15` }]}>
                <Text style={{ fontSize: 20 }}>{tier.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                <Text style={styles.tierDesc}>{tier.description}</Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.tierIndicator}>
              <View style={[styles.tierIconWrap, { backgroundColor: 'rgba(74,222,128,0.1)' }]}>
                <MaterialIcons name="sensors" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierName, { color: theme.primary }]}>Live Session</Text>
                <Text style={styles.tierDesc}>Share your cooking skills live</Text>
              </View>
            </Animated.View>
          )}

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Session Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Butter Chicken Masterclass"
              placeholderTextColor={theme.textMuted}
              maxLength={60}
            />
            <Text style={styles.charCount}>{title.length}/60</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What will you teach in this session?"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </Animated.View>

          {/* Schedule time */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>When</Text>
            <View style={styles.optionsRow}>
              {SCHEDULE_OPTIONS.map((opt, i) => (
                <Pressable
                  key={i}
                  style={[styles.optionChip, selectedTime === i && styles.optionChipActive]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedTime(i); }}
                >
                  <Text style={[styles.optionText, selectedTime === i && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Max attendees */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Max Attendees</Text>
            <TextInput
              style={styles.input}
              value={maxAttendees}
              onChangeText={setMaxAttendees}
              placeholder="100"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              maxLength={4}
            />
          </Animated.View>

          {/* Paid toggle */}
          {canSchedulePaid ? (
            <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.fieldGroup}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.fieldLabel}>Paid Session</Text>
                  <Text style={styles.fieldHint}>Charge attendees to join</Text>
                </View>
                <Pressable
                  style={[styles.toggle, isPaid && styles.toggleActive]}
                  onPress={() => { Haptics.selectionAsync(); setIsPaid(prev => !prev); }}
                >
                  <View style={[styles.toggleThumb, isPaid && styles.toggleThumbActive]} />
                </Pressable>
              </View>

              {isPaid ? (
                <View style={styles.priceRow}>
                  <Text style={styles.pricePrefix}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="99"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              ) : null}
            </Animated.View>
          ) : null}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleSchedule}
          >
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.scheduleBtn}>
              <MaterialIcons name="sensors" size={22} color={theme.textOnPrimary} />
              <Text style={styles.scheduleBtnText}>Schedule Session</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },

  // Tier indicator
  tierIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: { fontSize: 15, fontWeight: '700' },
  tierDesc: { fontSize: 13, fontWeight: '500', color: theme.textMuted, marginTop: 1 },

  // Fields
  fieldGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  fieldHint: { fontSize: 12, fontWeight: '500', color: theme.textMuted, marginTop: 2 },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: { fontSize: 12, fontWeight: '500', color: theme.textMuted, alignSelf: 'flex-end' },

  // Options
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionChipActive: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  optionText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  optionTextActive: { color: theme.primary },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.backgroundTertiary,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: theme.primary },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.textMuted,
  },
  toggleThumbActive: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  pricePrefix: { fontSize: 24, fontWeight: '800', color: theme.accent },
  priceInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '800',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Bottom CTA
  bottomCTA: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  scheduleBtnText: { fontSize: 17, fontWeight: '800', color: theme.textOnPrimary },
});
