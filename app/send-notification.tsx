import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAlert, useAuth } from '@/template';
import {
  sendBroadcastPushNotification,
  createScheduledNotification,
  fetchScheduledNotifications,
  cancelScheduledNotification,
  ScheduledNotification,
} from '../services/notificationService';

// ─── Constants ───
const QUICK_TEMPLATES = [
  {
    label: 'App Update',
    title: 'FoodGenie Just Got Better!',
    body: 'We have a fresh new update with exciting features. Open the app to check it out!',
  },
  {
    label: 'New Feature',
    title: 'New Feature Alert',
    body: 'A brand new feature is live on FoodGenie. Come explore what is new!',
  },
  {
    label: 'Community',
    title: 'Your Food Community Misses You',
    body: 'New dishes and creators are trending. Jump back in and discover something delicious!',
  },
];

type AudienceType = 'all' | 'creators' | 'roles';

const AUDIENCE_OPTIONS: { key: AudienceType; label: string; icon: keyof typeof MaterialIcons.glyphMap; desc: string }[] = [
  { key: 'all', label: 'All Users', icon: 'people', desc: 'Every registered user' },
  { key: 'creators', label: 'Creators Only', icon: 'auto-awesome', desc: 'Users with 5+ posts' },
  { key: 'roles', label: 'Specific Roles', icon: 'admin-panel-settings', desc: 'Select by role' },
];

const ROLE_OPTIONS = [
  { key: 'customer', label: 'Customers', color: '#6B6B6B' },
  { key: 'admin_ops', label: 'Admins', color: '#FB7185' },
  { key: 'restaurant_partner', label: 'Partners', color: '#60A5FA' },
  { key: 'chef_auditor', label: 'Auditors', color: '#FBBF24' },
];

type TabType = 'compose' | 'scheduled';

// ─── Date/Time Picker (Custom inline) ───
function InlineDateTimePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const now = new Date();

  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setSeconds(0, 0);
    return d;
  };

  const presets = [
    { label: 'In 30 min', date: new Date(now.getTime() + 30 * 60000) },
    { label: 'In 1 hour', date: new Date(now.getTime() + 60 * 60000) },
    { label: 'In 3 hours', date: new Date(now.getTime() + 180 * 60000) },
    { label: 'Tomorrow 9am', date: (() => { const d = addDays(1); d.setHours(9, 0, 0, 0); return d; })() },
    { label: 'Tomorrow 6pm', date: (() => { const d = addDays(1); d.setHours(18, 0, 0, 0); return d; })() },
  ];

  // Manual time adjustment
  const adjustHours = (delta: number) => {
    const d = new Date(value);
    d.setHours(d.getHours() + delta);
    if (d.getTime() > now.getTime()) onChange(d);
  };

  const adjustMinutes = (delta: number) => {
    const d = new Date(value);
    d.setMinutes(d.getMinutes() + delta);
    if (d.getTime() > now.getTime()) onChange(d);
  };

  const adjustDays = (delta: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + delta);
    if (d.getTime() > now.getTime()) onChange(d);
  };

  const formatDatePart = (d: Date) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const formatTimePart = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <View style={dtStyles.container}>
      <Text style={dtStyles.label}>Schedule For</Text>

      {/* Quick presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dtStyles.presetsRow}>
        {presets.map((p) => {
          const isActive = Math.abs(value.getTime() - p.date.getTime()) < 60000;
          return (
            <Pressable
              key={p.label}
              style={[dtStyles.presetChip, isActive && dtStyles.presetChipActive]}
              onPress={() => { Haptics.selectionAsync(); onChange(p.date); }}
            >
              <Text style={[dtStyles.presetText, isActive && dtStyles.presetTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Manual adjuster */}
      <View style={dtStyles.adjusterRow}>
        {/* Date */}
        <View style={dtStyles.adjusterBlock}>
          <Pressable style={dtStyles.adjusterBtn} onPress={() => adjustDays(-1)}>
            <MaterialIcons name="chevron-left" size={20} color="#A0A0A0" />
          </Pressable>
          <View style={dtStyles.adjusterValue}>
            <MaterialIcons name="calendar-today" size={14} color="#D4AF37" />
            <Text style={dtStyles.adjusterText}>{formatDatePart(value)}</Text>
          </View>
          <Pressable style={dtStyles.adjusterBtn} onPress={() => adjustDays(1)}>
            <MaterialIcons name="chevron-right" size={20} color="#A0A0A0" />
          </Pressable>
        </View>

        {/* Hour */}
        <View style={dtStyles.adjusterBlock}>
          <Pressable style={dtStyles.adjusterBtn} onPress={() => adjustHours(-1)}>
            <MaterialIcons name="remove" size={18} color="#A0A0A0" />
          </Pressable>
          <View style={dtStyles.adjusterValue}>
            <MaterialIcons name="schedule" size={14} color="#D4AF37" />
            <Text style={dtStyles.adjusterText}>{formatTimePart(value)}</Text>
          </View>
          <Pressable style={dtStyles.adjusterBtn} onPress={() => adjustHours(1)}>
            <MaterialIcons name="add" size={18} color="#A0A0A0" />
          </Pressable>
        </View>

        {/* Fine-tune minutes */}
        <View style={dtStyles.minuteRow}>
          <Pressable style={dtStyles.minBtn} onPress={() => adjustMinutes(-15)}>
            <Text style={dtStyles.minBtnText}>-15m</Text>
          </Pressable>
          <Pressable style={dtStyles.minBtn} onPress={() => adjustMinutes(-5)}>
            <Text style={dtStyles.minBtnText}>-5m</Text>
          </Pressable>
          <Pressable style={dtStyles.minBtn} onPress={() => adjustMinutes(5)}>
            <Text style={dtStyles.minBtnText}>+5m</Text>
          </Pressable>
          <Pressable style={dtStyles.minBtn} onPress={() => adjustMinutes(15)}>
            <Text style={dtStyles.minBtnText}>+15m</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const dtStyles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#A0A0A0', letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 4 },
  presetsRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  presetChipActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.35)' },
  presetText: { fontSize: 13, fontWeight: '600', color: '#6B6B6B' },
  presetTextActive: { color: '#D4AF37' },
  adjusterRow: { gap: 10 },
  adjusterBlock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#151515', borderRadius: 14, padding: 4, gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  adjusterBtn: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  adjusterValue: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  adjusterText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  minuteRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  minBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  minBtnText: { fontSize: 12, fontWeight: '700', color: '#A0A0A0' },
});

// ─── Audience Selector ───
function AudienceSelector({
  audience,
  setAudience,
  selectedRoles,
  toggleRole,
}: {
  audience: AudienceType;
  setAudience: (a: AudienceType) => void;
  selectedRoles: string[];
  toggleRole: (r: string) => void;
}) {
  return (
    <View style={audStyles.container}>
      <Text style={audStyles.label}>Target Audience</Text>
      <View style={audStyles.optionsCol}>
        {AUDIENCE_OPTIONS.map((opt) => {
          const isActive = audience === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[audStyles.optionCard, isActive && audStyles.optionCardActive]}
              onPress={() => { Haptics.selectionAsync(); setAudience(opt.key); }}
            >
              <View style={[audStyles.optionIcon, isActive && audStyles.optionIconActive]}>
                <MaterialIcons name={opt.icon} size={20} color={isActive ? '#D4AF37' : '#6B6B6B'} />
              </View>
              <View style={audStyles.optionText}>
                <Text style={[audStyles.optionTitle, isActive && audStyles.optionTitleActive]}>{opt.label}</Text>
                <Text style={audStyles.optionDesc}>{opt.desc}</Text>
              </View>
              <View style={[audStyles.radio, isActive && audStyles.radioActive]}>
                {isActive ? <View style={audStyles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Role chips when 'roles' audience is selected */}
      {audience === 'roles' ? (
        <Animated.View entering={FadeIn.duration(200)} style={audStyles.rolesSection}>
          <Text style={audStyles.rolesLabel}>Select Roles</Text>
          <View style={audStyles.rolesRow}>
            {ROLE_OPTIONS.map((role) => {
              const isSelected = selectedRoles.includes(role.key);
              return (
                <Pressable
                  key={role.key}
                  style={[
                    audStyles.roleChip,
                    isSelected && { backgroundColor: `${role.color}18`, borderColor: `${role.color}40` },
                  ]}
                  onPress={() => toggleRole(role.key)}
                >
                  <MaterialIcons
                    name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                    size={16}
                    color={isSelected ? role.color : '#6B6B6B'}
                  />
                  <Text style={[audStyles.roleLabel, isSelected && { color: role.color }]}>{role.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const audStyles = StyleSheet.create({
  container: { gap: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#A0A0A0', letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 4 },
  optionsCol: { gap: 8 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  optionCardActive: { backgroundColor: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.20)' },
  optionIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  optionIconActive: { backgroundColor: 'rgba(212,175,55,0.12)' },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#A0A0A0' },
  optionTitleActive: { color: '#FFF' },
  optionDesc: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6B6B6B',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: '#D4AF37' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4AF37' },
  rolesSection: { gap: 8, paddingTop: 4 },
  rolesLabel: { fontSize: 12, fontWeight: '600', color: '#6B6B6B', marginLeft: 4 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  roleLabel: { fontSize: 13, fontWeight: '700', color: '#6B6B6B' },
});

// ─── Scheduled List ───
function ScheduledList({
  items,
  loading,
  onCancel,
  onRefresh,
}: {
  items: ScheduledNotification[];
  loading: boolean;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}) {
  const statusColors: Record<string, string> = {
    pending: '#FBBF24',
    sent: '#4ADE80',
    cancelled: '#FB7185',
    failed: '#FB7185',
  };

  if (loading) {
    return (
      <View style={schStyles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={schStyles.center}>
        <MaterialIcons name="schedule" size={48} color="#6B6B6B" />
        <Text style={schStyles.emptyTitle}>No Scheduled Notifications</Text>
        <Text style={schStyles.emptySub}>Schedule one from the Compose tab</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={schStyles.list}>
      <Pressable style={schStyles.refreshRow} onPress={onRefresh}>
        <MaterialIcons name="refresh" size={18} color="#D4AF37" />
        <Text style={schStyles.refreshText}>Refresh</Text>
      </Pressable>
      {items.map((item, idx) => {
        const statusColor = statusColors[item.status] || '#6B6B6B';
        const scheduledDate = new Date(item.scheduled_at);
        const isPast = scheduledDate.getTime() < Date.now();
        const isPending = item.status === 'pending';

        return (
          <Animated.View key={item.id} entering={FadeInDown.delay(idx * 50).duration(300)}>
            <View style={schStyles.card}>
              <View style={schStyles.cardHeader}>
                <View style={[schStyles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
                  <View style={[schStyles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[schStyles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
                <Text style={schStyles.cardAudience}>
                  {item.target_audience === 'all' ? 'All Users' : item.target_audience === 'creators' ? 'Creators' : item.target_roles.join(', ')}
                </Text>
              </View>
              <Text style={schStyles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={schStyles.cardBody} numberOfLines={2}>{item.body}</Text>
              <View style={schStyles.cardFooter}>
                <View style={schStyles.cardDateRow}>
                  <MaterialIcons name="schedule" size={14} color="#6B6B6B" />
                  <Text style={schStyles.cardDate}>
                    {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at{' '}
                    {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
                {isPending && !isPast ? (
                  <Pressable
                    style={({ pressed }) => [schStyles.cancelBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => onCancel(item.id)}
                  >
                    <MaterialIcons name="close" size={14} color="#FB7185" />
                    <Text style={schStyles.cancelText}>Cancel</Text>
                  </Pressable>
                ) : null}
                {item.status === 'sent' ? (
                  <Text style={schStyles.sentCount}>
                    {item.sent_count} sent{item.failed_count > 0 ? ` · ${item.failed_count} failed` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const schStyles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B6B6B' },
  emptySub: { fontSize: 13, color: '#6B6B6B' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  refreshRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingBottom: 4 },
  refreshText: { fontSize: 13, fontWeight: '600', color: '#D4AF37' },
  card: {
    backgroundColor: '#121212', borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardAudience: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cardBody: { fontSize: 13, fontWeight: '400', color: '#A0A0A0', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDate: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 8, backgroundColor: 'rgba(251,113,133,0.08)' },
  cancelText: { fontSize: 12, fontWeight: '700', color: '#FB7185' },
  sentCount: { fontSize: 12, fontWeight: '600', color: '#4ADE80' },
});

// ─── Main Screen ───
export default function SendNotificationScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const [tab, setTab] = useState<TabType>('compose');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);

  // Audience
  const [audience, setAudience] = useState<AudienceType>('all');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Schedule
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return d;
  });

  // Scheduled list
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const loadScheduled = useCallback(async () => {
    setLoadingScheduled(true);
    const { data } = await fetchScheduledNotifications();
    setScheduled(data);
    setLoadingScheduled(false);
  }, []);

  useEffect(() => {
    if (tab === 'scheduled') loadScheduled();
  }, [tab, loadScheduled]);

  const toggleRole = useCallback((role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }, []);

  const getAudienceLabel = () => {
    if (audience === 'all') return 'All Users';
    if (audience === 'creators') return 'Creators Only';
    if (audience === 'roles' && selectedRoles.length > 0) return selectedRoles.join(', ');
    return 'No audience selected';
  };

  const isFormValid = title.trim() && body.trim() && (audience !== 'roles' || selectedRoles.length > 0);

  const handleSendNow = useCallback(async () => {
    if (!isFormValid) return;

    const audienceLabel = getAudienceLabel();
    showAlert('Confirm Send', `Send push notification to ${audienceLabel} now?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Now',
        style: 'default',
        onPress: async () => {
          setSending(true);
          setResult(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

          const res = await sendBroadcastPushNotification({
            title: title.trim(),
            body: body.trim(),
            target_audience: audience,
            target_roles: audience === 'roles' ? selectedRoles : undefined,
          });

          setSending(false);
          if (res.success) {
            setResult({ sent: res.sent, failed: res.failed });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert('Sent!', `Delivered to ${res.sent} device${res.sent !== 1 ? 's' : ''}${res.failed ? ` (${res.failed} failed)` : ''}`);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert('Send Failed', res.error || 'Something went wrong');
          }
        },
      },
    ]);
  }, [title, body, audience, selectedRoles, showAlert, isFormValid]);

  const handleSchedule = useCallback(async () => {
    if (!isFormValid) return;
    if (scheduleDate.getTime() <= Date.now()) {
      showAlert('Invalid Time', 'Schedule time must be in the future');
      return;
    }

    const audienceLabel = getAudienceLabel();
    const dateStr = scheduleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const timeStr = scheduleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    showAlert('Confirm Schedule', `Schedule notification for ${audienceLabel} on ${dateStr} at ${timeStr}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Schedule',
        style: 'default',
        onPress: async () => {
          setSending(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          const { data, error } = await createScheduledNotification({
            title: title.trim(),
            body: body.trim(),
            target_audience: audience,
            target_roles: audience === 'roles' ? selectedRoles : [],
            scheduled_at: scheduleDate.toISOString(),
            created_by: user?.id || '',
          });

          setSending(false);
          if (error) {
            showAlert('Error', error);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert('Scheduled!', `Notification will be sent on ${dateStr} at ${timeStr}`);
            setTitle('');
            setBody('');
            setIsScheduled(false);
            setTab('scheduled');
            loadScheduled();
          }
        },
      },
    ]);
  }, [title, body, audience, selectedRoles, scheduleDate, showAlert, user?.id, isFormValid, loadScheduled]);

  const handleCancelScheduled = useCallback((id: string) => {
    showAlert('Cancel Notification', 'This scheduled notification will not be sent.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel It',
        style: 'destructive',
        onPress: async () => {
          const { error } = await cancelScheduledNotification(id);
          if (error) {
            showAlert('Error', error);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadScheduled();
          }
        },
      },
    ]);
  }, [showAlert, loadScheduled]);

  const applyTemplate = useCallback((template: typeof QUICK_TEMPLATES[0]) => {
    Haptics.selectionAsync();
    setTitle(template.title);
    setBody(template.body);
    setResult(null);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, tab === 'compose' && styles.tabBtnActive]}
            onPress={() => setTab('compose')}
          >
            <MaterialIcons name="edit" size={18} color={tab === 'compose' ? '#D4AF37' : '#6B6B6B'} />
            <Text style={[styles.tabText, tab === 'compose' && styles.tabTextActive]}>Compose</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === 'scheduled' && styles.tabBtnActive]}
            onPress={() => setTab('scheduled')}
          >
            <MaterialIcons name="schedule" size={18} color={tab === 'scheduled' ? '#D4AF37' : '#6B6B6B'} />
            <Text style={[styles.tabText, tab === 'scheduled' && styles.tabTextActive]}>Scheduled</Text>
            {scheduled.filter((s) => s.status === 'pending').length > 0 ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{scheduled.filter((s) => s.status === 'pending').length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {tab === 'scheduled' ? (
          <ScheduledList items={scheduled} loading={loadingScheduled} onCancel={handleCancelScheduled} onRefresh={loadScheduled} />
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Quick templates */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.templateSection}>
                <Text style={styles.sectionLabel}>Quick Templates</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateGrid}>
                  {QUICK_TEMPLATES.map((tpl) => (
                    <Pressable
                      key={tpl.label}
                      style={({ pressed }) => [styles.templateCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                      onPress={() => applyTemplate(tpl)}
                    >
                      <Text style={styles.templateLabel}>{tpl.label}</Text>
                      <Text style={styles.templatePreview} numberOfLines={1}>{tpl.title}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>

              {/* Form */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notification Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={(t) => { setTitle(t); setResult(null); }}
                    placeholder="e.g. FoodGenie Just Got Better!"
                    placeholderTextColor="#6B6B6B"
                    maxLength={100}
                  />
                  <Text style={styles.charCount}>{title.length}/100</Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message *</Text>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={body}
                    onChangeText={(t) => { setBody(t); setResult(null); }}
                    placeholder="Describe the update or announcement..."
                    placeholderTextColor="#6B6B6B"
                    multiline
                    maxLength={300}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{body.length}/300</Text>
                </View>
              </Animated.View>

              {/* Audience */}
              <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.audienceSection}>
                <AudienceSelector
                  audience={audience}
                  setAudience={setAudience}
                  selectedRoles={selectedRoles}
                  toggleRole={toggleRole}
                />
              </Animated.View>

              {/* Schedule Toggle */}
              <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.scheduleToggleSection}>
                <Pressable
                  style={[styles.scheduleToggle, isScheduled && styles.scheduleToggleActive]}
                  onPress={() => { Haptics.selectionAsync(); setIsScheduled(!isScheduled); }}
                >
                  <View style={[styles.scheduleToggleIcon, isScheduled && styles.scheduleToggleIconActive]}>
                    <MaterialIcons name={isScheduled ? 'schedule' : 'send'} size={20} color={isScheduled ? '#D4AF37' : '#6B6B6B'} />
                  </View>
                  <View style={styles.scheduleToggleText}>
                    <Text style={[styles.scheduleToggleTitle, isScheduled && { color: '#FFF' }]}>
                      {isScheduled ? 'Schedule for Later' : 'Send Immediately'}
                    </Text>
                    <Text style={styles.scheduleToggleDesc}>
                      {isScheduled ? 'Pick a date and time' : 'Tap to schedule instead'}
                    </Text>
                  </View>
                  <View style={[styles.toggleSwitch, isScheduled && styles.toggleSwitchActive]}>
                    <Animated.View style={[styles.toggleThumb, isScheduled && styles.toggleThumbActive]} />
                  </View>
                </Pressable>
              </Animated.View>

              {/* Date/Time Picker */}
              {isScheduled ? (
                <Animated.View entering={FadeIn.duration(250)} style={styles.datePickerSection}>
                  <InlineDateTimePicker value={scheduleDate} onChange={setScheduleDate} />
                </Animated.View>
              ) : null}

              {/* Preview */}
              {title.trim() || body.trim() ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.previewSection}>
                  <Text style={styles.sectionLabel}>Preview</Text>
                  <View style={styles.previewCard}>
                    <View style={styles.previewIcon}>
                      <MaterialIcons name="notifications" size={20} color="#D4AF37" />
                    </View>
                    <View style={styles.previewContent}>
                      <Text style={styles.previewTitle} numberOfLines={1}>{title.trim() || 'Notification Title'}</Text>
                      <Text style={styles.previewBody} numberOfLines={2}>{body.trim() || 'Notification message...'}</Text>
                    </View>
                    <View style={styles.previewMeta}>
                      <Text style={styles.previewTime}>{isScheduled ? 'scheduled' : 'now'}</Text>
                      <Text style={styles.previewAudience}>{getAudienceLabel()}</Text>
                    </View>
                  </View>
                </Animated.View>
              ) : null}

              {/* Result */}
              {result ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.resultBanner}>
                  <MaterialIcons name="check-circle" size={20} color="#4ADE80" />
                  <Text style={styles.resultText}>
                    Sent to {result.sent} device{result.sent !== 1 ? 's' : ''}
                    {result.failed ? ` \u00B7 ${result.failed} failed` : ''}
                  </Text>
                </Animated.View>
              ) : null}

              {/* CTA */}
              <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.ctaSection}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sendBtn,
                    (!isFormValid || sending) && { opacity: 0.5 },
                    pressed && isFormValid && !sending && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={isScheduled ? handleSchedule : handleSendNow}
                  disabled={!isFormValid || sending}
                >
                  <LinearGradient colors={isScheduled ? ['#60A5FA', '#3B82F6'] : ['#D4AF37', '#FFD700']} style={styles.sendBtnGrad}>
                    {sending ? (
                      <ActivityIndicator size="small" color={isScheduled ? '#FFF' : '#0A0A0A'} />
                    ) : (
                      <>
                        <MaterialIcons name={isScheduled ? 'schedule-send' : 'send'} size={20} color={isScheduled ? '#FFF' : '#0A0A0A'} />
                        <Text style={[styles.sendBtnText, isScheduled && { color: '#FFF' }]}>
                          {isScheduled ? 'Schedule Notification' : 'Send Now'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  // Tabs
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#151515', borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: 'rgba(212,175,55,0.10)' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#6B6B6B' },
  tabTextActive: { color: '#D4AF37' },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#0A0A0A' },

  // Templates
  templateSection: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#A0A0A0', letterSpacing: 0.5, textTransform: 'uppercase' },
  templateGrid: { flexDirection: 'row', gap: 10 },
  templateCard: {
    width: 140, padding: 14, borderRadius: 14,
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(212,175,55,0.10)', gap: 6,
  },
  templateLabel: { fontSize: 12, fontWeight: '800', color: '#D4AF37', letterSpacing: 0.3 },
  templatePreview: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },

  // Form
  formSection: { paddingHorizontal: 20, paddingTop: 20, gap: 18 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#A0A0A0', marginLeft: 4 },
  input: {
    backgroundColor: '#151515', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#FFF',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.10)',
  },
  inputMultiline: { minHeight: 90, paddingTop: 14 },
  charCount: { fontSize: 12, color: '#6B6B6B', textAlign: 'right', marginTop: 2 },

  // Audience
  audienceSection: { paddingHorizontal: 20, paddingTop: 20 },

  // Schedule toggle
  scheduleToggleSection: { paddingHorizontal: 20, paddingTop: 20 },
  scheduleToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, backgroundColor: '#151515',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  scheduleToggleActive: { backgroundColor: 'rgba(96,165,250,0.06)', borderColor: 'rgba(96,165,250,0.20)' },
  scheduleToggleIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scheduleToggleIconActive: { backgroundColor: 'rgba(212,175,55,0.12)' },
  scheduleToggleText: { flex: 1, gap: 2 },
  scheduleToggleTitle: { fontSize: 15, fontWeight: '700', color: '#A0A0A0' },
  scheduleToggleDesc: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },
  toggleSwitch: {
    width: 48, height: 28, borderRadius: 14, padding: 3,
    backgroundColor: '#2A2A2A', justifyContent: 'center',
  },
  toggleSwitchActive: { backgroundColor: 'rgba(96,165,250,0.35)' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#6B6B6B',
  },
  toggleThumbActive: { backgroundColor: '#60A5FA', alignSelf: 'flex-end' },

  // Date picker
  datePickerSection: { paddingHorizontal: 20, paddingTop: 16 },

  // Preview
  previewSection: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  previewIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  previewContent: { flex: 1, gap: 2 },
  previewTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  previewBody: { fontSize: 13, fontWeight: '400', color: '#A0A0A0', lineHeight: 18 },
  previewMeta: { alignItems: 'flex-end', gap: 2 },
  previewTime: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },
  previewAudience: { fontSize: 10, fontWeight: '600', color: '#D4AF37' },

  // Result
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(74,222,128,0.06)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.15)',
  },
  resultText: { fontSize: 14, fontWeight: '600', color: '#4ADE80' },

  // CTA
  ctaSection: { paddingHorizontal: 20, paddingTop: 24 },
  sendBtn: { borderRadius: 18, overflow: 'hidden' },
  sendBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 18,
  },
  sendBtnText: { fontSize: 17, fontWeight: '800', color: '#0A0A0A' },
});
