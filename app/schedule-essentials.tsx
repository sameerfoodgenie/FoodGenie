import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '@/template';
import { useAlert } from '@/template';
import { saveGrocerySchedules, ScheduleItem } from '../services/groceryPlannerService';

const { width: SCREEN_W } = Dimensions.get('window');

const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily', emoji: '📅' },
  { id: 'alternate', label: 'Alternate Days', emoji: '🔄' },
  { id: 'weekly', label: 'Weekly', emoji: '🗓️' },
  { id: 'custom', label: 'Custom Days', emoji: '⚙️' },
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (6-10am)', emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon (12-3pm)', emoji: '☀️' },
  { id: 'evening', label: 'Evening (5-8pm)', emoji: '🌆' },
];

const PROVIDERS = [
  { id: 'any', label: 'Best Available', emoji: '🔄', color: '#7B2FA0' },
  { id: 'Local Kirana', label: 'Local Kirana', emoji: '🏪', color: '#FF8C42' },
  { id: 'Zepto', label: 'Zepto', emoji: '⚡', color: '#7B2D8E' },
  { id: 'Blinkit', label: 'Blinkit', emoji: '🟡', color: '#F8CB2E' },
  { id: 'BigBasket', label: 'BigBasket', emoji: '🟢', color: '#84C225' },
  { id: 'Instamart', label: 'Instamart', emoji: '🟠', color: '#FC8019' },
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

interface EssentialItem {
  id: string;
  name: string;
  emoji: string;
  defaultQty: string;
  unit: string;
}

export default function ScheduleEssentialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams<{ items?: string }>();

  const [items, setItems] = useState<EssentialItem[]>([]);
  const [frequency, setFrequency] = useState('daily');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [provider, setProvider] = useState('any');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(['mon', 'wed', 'fri']));
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.items) {
      try {
        const parsed = JSON.parse(params.items);
        setItems(parsed);
      } catch {}
    }
  }, [params.items]);

  const toggleDay = useCallback((day: string) => {
    Haptics.selectionAsync();
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day); else next.add(day);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      showAlert('Login Required', 'Please login to schedule grocery orders');
      return;
    }
    if (items.length === 0) {
      showAlert('No Items', 'Please select items to schedule');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const today = new Date().toISOString().split('T')[0];
    const scheduleItems: ScheduleItem[] = items.map(item => ({
      item_name: item.name,
      quantity: item.defaultQty,
      unit: item.unit,
      frequency,
      days_of_week: frequency === 'custom' ? Array.from(selectedDays) : [],
      time_slot: timeSlot,
      provider_preference: provider,
      budget_limit: 0,
      start_date: today,
      notification_enabled: notifications,
    }));

    const { success, error } = await saveGrocerySchedules(user.id, scheduleItems);
    setSaving(false);

    if (success) {
      showAlert('Schedule Created', `${items.length} items scheduled successfully. You will receive reminders before each delivery.`);
      setTimeout(() => router.back(), 1500);
    } else {
      showAlert('Error', error || 'Failed to create schedule');
    }
  }, [user?.id, items, frequency, timeSlot, provider, selectedDays, notifications, showAlert, router]);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#1E1456', '#7B2FA0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
          <View style={st.headerRow}>
            <Pressable style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Schedule Essentials 📅</Text>
              <Text style={st.headerSub}>{items.length} items selected</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          {/* Selected Items */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Items to Schedule</Text>
            <View style={st.itemsGrid}>
              {items.map((item, i) => (
                <View key={item.id} style={[st.itemChip, { backgroundColor: isDark ? 'rgba(123,47,160,0.08)' : 'rgba(123,47,160,0.03)', borderColor: 'rgba(123,47,160,0.15)' }]}>
                  <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[st.itemQty, { color: colors.textMuted }]}>{item.defaultQty} {item.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Frequency */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Delivery Frequency</Text>
            <View style={st.freqGrid}>
              {FREQUENCY_OPTIONS.map(opt => (
                <Pressable
                  key={opt.id}
                  style={({ pressed }) => [
                    st.freqChip,
                    {
                      backgroundColor: frequency === opt.id ? (isDark ? 'rgba(245,183,49,0.10)' : 'rgba(245,183,49,0.05)') : colors.surface,
                      borderColor: frequency === opt.id ? '#F5B731' : colors.border,
                      borderWidth: frequency === opt.id ? 2 : 1,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setFrequency(opt.id); }}
                >
                  <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                  <Text style={[st.freqLabel, { color: frequency === opt.id ? '#D9A020' : colors.textPrimary }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Custom Days (shown only for custom frequency) */}
          {frequency === 'custom' ? (
            <Animated.View entering={FadeInDown.duration(250)} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Text style={[st.subLabel, { color: colors.textMuted }]}>Select days of week</Text>
              <View style={st.daysRow}>
                {DAYS_OF_WEEK.map(day => (
                  <Pressable
                    key={day.id}
                    style={[
                      st.dayChip,
                      {
                        backgroundColor: selectedDays.has(day.id) ? '#7B2FA0' : colors.surface,
                        borderColor: selectedDays.has(day.id) ? '#7B2FA0' : colors.border,
                      },
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={[st.dayText, { color: selectedDays.has(day.id) ? '#FFF' : colors.textPrimary }]}>{day.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* Time Slot */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Preferred Time Slot</Text>
            <View style={st.timeGrid}>
              {TIME_SLOTS.map(slot => (
                <Pressable
                  key={slot.id}
                  style={({ pressed }) => [
                    st.timeChip,
                    {
                      backgroundColor: timeSlot === slot.id ? (isDark ? 'rgba(123,47,160,0.10)' : 'rgba(123,47,160,0.04)') : colors.surface,
                      borderColor: timeSlot === slot.id ? '#7B2FA0' : colors.border,
                      borderWidth: timeSlot === slot.id ? 2 : 1,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setTimeSlot(slot.id); }}
                >
                  <Text style={{ fontSize: 18 }}>{slot.emoji}</Text>
                  <Text style={[st.timeLabel, { color: timeSlot === slot.id ? '#7B2FA0' : colors.textPrimary }]}>{slot.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Provider */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Preferred Provider</Text>
            <View style={st.providerGrid}>
              {PROVIDERS.map(p => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [
                    st.providerChip,
                    {
                      backgroundColor: provider === p.id ? `${p.color}12` : colors.surface,
                      borderColor: provider === p.id ? p.color : colors.border,
                      borderWidth: provider === p.id ? 2 : 1,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setProvider(p.id); }}
                >
                  <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
                  <Text style={[st.providerLabel, { color: provider === p.id ? p.color : colors.textPrimary }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Notifications Toggle */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Pressable
              style={[st.notifRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { Haptics.selectionAsync(); setNotifications(!notifications); }}
            >
              <MaterialIcons name="notifications-active" size={20} color="#F5B731" />
              <View style={{ flex: 1 }}>
                <Text style={[st.notifTitle, { color: colors.textPrimary }]}>Delivery Reminders</Text>
                <Text style={[st.notifSub, { color: colors.textMuted }]}>Get notified before scheduled delivery time</Text>
              </View>
              <View style={[st.toggle, { backgroundColor: notifications ? '#7B2FA0' : colors.border }]}>
                <View style={[st.toggleDot, { alignSelf: notifications ? 'flex-end' : 'flex-start' }]} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Schedule Preview */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <View style={[st.previewCard, { backgroundColor: isDark ? 'rgba(74,222,128,0.04)' : 'rgba(74,222,128,0.02)', borderColor: 'rgba(74,222,128,0.15)' }]}>
              <MaterialIcons name="event-available" size={18} color="#4ADE80" />
              <View style={{ flex: 1 }}>
                <Text style={[st.previewTitle, { color: colors.textPrimary }]}>Schedule Preview</Text>
                <Text style={[st.previewText, { color: colors.textMuted }]}>
                  {items.length} items • {frequency === 'custom' ? `${selectedDays.size} days/week` : frequency} • {TIME_SLOTS.find(t => t.id === timeSlot)?.label || 'Morning'} • {PROVIDERS.find(p => p.id === provider)?.label || 'Best Available'}
                </Text>
                {notifications ? (
                  <Text style={[st.previewNote, { color: '#4ADE80' }]}>Reminders enabled</Text>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[st.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 10 }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleSave}
            disabled={saving || items.length === 0}
          >
            <LinearGradient
              colors={items.length > 0 ? ['#7B2FA0', '#1E1456'] : ['#9A9AB0', '#9A9AB0']}
              style={st.saveBtn}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="event-repeat" size={18} color="#FFF" />
                  <Text style={st.saveBtnText}>Create Schedule</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  subLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },

  // Items
  itemsGrid: { gap: 6 },
  itemChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  itemName: { fontSize: 13, fontWeight: '700' },
  itemQty: { fontSize: 10, fontWeight: '500', marginTop: 1 },

  // Frequency
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  freqLabel: { fontSize: 13, fontWeight: '700' },

  // Days
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dayText: { fontSize: 11, fontWeight: '700' },

  // Time
  timeGrid: { gap: 8 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  timeLabel: { fontSize: 13, fontWeight: '700' },

  // Provider
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  providerLabel: { fontSize: 12, fontWeight: '700' },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700' },
  notifSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 3 },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFF' },

  // Preview
  previewCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  previewTitle: { fontSize: 13, fontWeight: '800' },
  previewText: { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 16 },
  previewNote: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  // Bottom
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
