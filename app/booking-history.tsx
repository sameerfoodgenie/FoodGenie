import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useAuth, useAlert } from '../template';
import { Booking, fetchUserBookings, updateBookingStatus, createBooking } from '../services/bookingService';

type TabId = 'upcoming' | 'past' | 'cancelled';

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'upcoming', label: 'Upcoming', emoji: '📅' },
  { id: 'past', label: 'Completed', emoji: '✅' },
  { id: 'cancelled', label: 'Cancelled', emoji: '❌' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', icon: 'schedule', label: 'Pending' },
  confirmed: { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)', icon: 'check-circle', label: 'Confirmed' },
  completed: { color: '#7B2FA0', bg: 'rgba(123,47,160,0.10)', icon: 'verified', label: 'Completed' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)', icon: 'cancel', label: 'Cancelled' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getPlanLabel(plan: string): string {
  switch (plan) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    default: return plan;
  }
}

function getPlanDuration(plan: string): string {
  switch (plan) {
    case 'daily': return '1 day, 3 meals';
    case 'weekly': return '7 days, 3 meals/day';
    case 'monthly': return '30 days, 3 meals/day';
    default: return '';
  }
}

// ── Booking Card ──
function BookingCard({
  booking,
  index,
  onCancel,
  onRebook,
  colors,
  isDark,
}: {
  booking: Booking;
  index: number;
  onCancel: (b: Booking) => void;
  onRebook: (b: Booking) => void;
  colors: any;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const isUpcoming = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 50).duration(300)}>
      <Pressable
        style={[
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#B8960C',
          },
        ]}
        onPress={() => { Haptics.selectionAsync(); setExpanded(!expanded); }}
      >
        {/* Top Row: Cook info + Status */}
        <View style={s.cardTop}>
          <Image source={{ uri: booking.cookPhoto }} style={s.cardAvatar} contentFit="cover" transition={200} />
          <View style={{ flex: 1 }}>
            <Text style={[s.cardCookName, { color: colors.textPrimary }]}>{booking.cookName}</Text>
            <Text style={[s.cardSpec, { color: colors.textMuted }]}>{booking.cookSpeciality} Specialist</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <MaterialIcons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
            <Text style={[s.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Booking Info Row */}
        <View style={[s.infoRow, { borderColor: colors.border }]}>
          <View style={s.infoItem}>
            <MaterialIcons name="event" size={14} color="#F5B731" />
            <Text style={[s.infoLabel, { color: colors.textMuted }]}>
              {formatDateShort(booking.startDate)} – {formatDateShort(booking.endDate)}
            </Text>
          </View>
          <View style={s.infoItem}>
            <MaterialIcons name="calendar-today" size={14} color="#F5B731" />
            <Text style={[s.infoLabel, { color: colors.textMuted }]}>{getPlanLabel(booking.plan)}</Text>
          </View>
          <View style={s.infoItem}>
            <Text style={s.infoAmount}>₹{booking.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Booking Ref */}
        <View style={s.refRow}>
          <Text style={[s.refLabel, { color: colors.textMuted }]}>Ref:</Text>
          <Text style={[s.refValue, { color: colors.textPrimary }]}>{booking.bookingRef}</Text>
          <MaterialIcons
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
            color={colors.textMuted}
            style={{ marginLeft: 'auto' }}
          />
        </View>

        {/* Expanded Receipt Details */}
        {expanded ? (
          <Animated.View entering={FadeIn.duration(250)} style={[s.receipt, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
            <Text style={[s.receiptTitle, { color: colors.textPrimary }]}>Receipt Details</Text>
            <View style={s.receiptRow}>
              <Text style={[s.receiptLabel, { color: colors.textMuted }]}>Plan</Text>
              <Text style={[s.receiptValue, { color: colors.textPrimary }]}>{getPlanLabel(booking.plan)} — {getPlanDuration(booking.plan)}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={[s.receiptLabel, { color: colors.textMuted }]}>Per Meal Rate</Text>
              <Text style={[s.receiptValue, { color: colors.textPrimary }]}>₹{booking.perMealRate}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={[s.receiptLabel, { color: colors.textMuted }]}>Meals/Day</Text>
              <Text style={[s.receiptValue, { color: colors.textPrimary }]}>{booking.mealsPerDay}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={[s.receiptLabel, { color: colors.textMuted }]}>Start Date</Text>
              <Text style={[s.receiptValue, { color: colors.textPrimary }]}>{formatDate(booking.startDate)}</Text>
            </View>
            <View style={s.receiptRow}>
              <Text style={[s.receiptLabel, { color: colors.textMuted }]}>End Date</Text>
              <Text style={[s.receiptValue, { color: colors.textPrimary }]}>{formatDate(booking.endDate)}</Text>
            </View>
            <View style={[s.receiptDivider, { borderColor: colors.border }]} />
            <View style={s.receiptRow}>
              <Text style={[s.receiptLabel, { color: colors.textPrimary, fontWeight: '800' }]}>Total Amount</Text>
              <Text style={[s.receiptTotal]}>₹{booking.totalAmount.toLocaleString()}</Text>
            </View>
            {booking.notes ? (
              <View style={[s.notesBox, { backgroundColor: isDark ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.04)', borderColor: 'rgba(212,175,55,0.15)' }]}>
                <MaterialIcons name="sticky-note-2" size={14} color="#F5B731" />
                <Text style={[s.notesText, { color: colors.textSecondary }]}>{booking.notes}</Text>
              </View>
            ) : null}
            <Text style={[s.receiptBooked, { color: colors.textMuted }]}>
              Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Animated.View>
        ) : null}

        {/* Action Buttons */}
        <View style={s.actionRow}>
          {isUpcoming ? (
            <Pressable
              style={({ pressed }) => [s.cancelBtn, { borderColor: '#EF4444' }, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCancel(booking); }}
            >
              <MaterialIcons name="close" size={14} color="#EF4444" />
              <Text style={s.cancelBtnText}>Cancel</Text>
            </Pressable>
          ) : null}
          {booking.status === 'completed' || booking.status === 'cancelled' ? (
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onRebook(booking); }}
            >
              <LinearGradient colors={['#F5B731', '#FDD85D']} style={s.rebookBtn}>
                <MaterialIcons name="replay" size={14} color="#FFF" />
                <Text style={s.rebookBtnText}>Rebook</Text>
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Empty State ──
function EmptyState({ tab, colors, isDark }: { tab: TabId; colors: any; isDark: boolean }) {
  const config = {
    upcoming: { emoji: '📅', title: 'No upcoming bookings', sub: 'Book a cook to get started with home-cooked meals' },
    past: { emoji: '✅', title: 'No completed bookings', sub: 'Your completed bookings will appear here' },
    cancelled: { emoji: '🚫', title: 'No cancelled bookings', sub: 'Good news! Nothing cancelled yet' },
  };
  const c = config[tab];
  return (
    <View style={[s.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ fontSize: 40 }}>{c.emoji}</Text>
      <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>{c.title}</Text>
      <Text style={[s.emptySub, { color: colors.textMuted }]}>{c.sub}</Text>
    </View>
  );
}

// ── Main Screen ──
export default function BookingHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');

  const loadBookings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await fetchUserBookings(user.id);
    if (!error) setBookings(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
      case 'past':
        return bookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  const tabCounts = useMemo(() => ({
    upcoming: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    past: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  const handleCancel = useCallback((booking: Booking) => {
    showAlert(
      'Cancel Booking',
      `Cancel booking with ${booking.cookName}? This action cannot be undone.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            const { error } = await updateBookingStatus(booking.id, 'cancelled');
            if (error) {
              showAlert('Error', error);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadBookings();
            }
          },
        },
      ],
    );
  }, [showAlert, loadBookings]);

  const handleRebook = useCallback(async (booking: Booking) => {
    if (!user) return;
    showAlert(
      'Rebook Cook',
      `Book ${booking.cookName} again with the same ${getPlanLabel(booking.plan)} plan for ₹${booking.totalAmount.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rebook Now',
          style: 'default',
          onPress: async () => {
            const { error } = await createBooking({
              userId: user.id,
              cookId: booking.cookId,
              cookName: booking.cookName,
              cookPhoto: booking.cookPhoto,
              cookSpeciality: booking.cookSpeciality,
              plan: booking.plan,
              totalAmount: booking.totalAmount,
              perMealRate: booking.perMealRate,
              notes: booking.notes,
            });
            if (error) {
              showAlert('Error', error);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setActiveTab('upcoming');
              loadBookings();
            }
          },
        },
      ],
    );
  }, [user, showAlert, loadBookings]);

  const totalSpent = useMemo(() =>
    bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalAmount, 0),
  [bookings]);

  const renderItem = useCallback(({ item, index }: { item: Booking; index: number }) => (
    <BookingCard
      booking={item}
      index={index}
      onCancel={handleCancel}
      onRebook={handleRebook}
      colors={colors}
      isDark={isDark}
    />
  ), [handleCancel, handleRebook, colors, isDark]);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#14141C', '#1A1510'] : ['#FDF8F0', '#FFF8E1']}
          style={s.header}
        >
          <View style={s.headerRow}>
            <Pressable
              style={({ pressed }) => [s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.7 }]}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, { color: colors.textPrimary }]}>My Bookings</Text>
              <Text style={[s.headerSub, { color: colors.textMuted }]}>
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} | Total ₹{totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const count = tabCounts[tab.id];
              return (
                <Pressable
                  key={tab.id}
                  style={[
                    s.tab,
                    {
                      backgroundColor: isActive
                        ? isDark ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.10)'
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderColor: isActive ? '#F5B731' : 'transparent',
                      borderWidth: isActive ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                >
                  <Text style={{ fontSize: 13 }}>{tab.emoji}</Text>
                  <Text style={[s.tabLabel, { color: isActive ? '#F5B731' : colors.textSecondary }]}>{tab.label}</Text>
                  {count > 0 ? (
                    <View style={[s.tabCount, { backgroundColor: isActive ? '#F5B731' : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
                      <Text style={[s.tabCountText, { color: isActive ? '#FFF' : colors.textMuted }]}>{count}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        {/* Bookings List */}
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#F5B731" />
            <Text style={[s.loadingText, { color: colors.textMuted }]}>Loading bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100, gap: 14 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5B731" colors={['#F5B731']} />
            }
            ListEmptyComponent={<EmptyState tab={activeTab} colors={colors} isDark={isDark} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 14,
  },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  tabCount: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabCountText: { fontSize: 10, fontWeight: '800' },

  // Card
  card: {
    padding: 16, borderRadius: 20, borderWidth: 1, gap: 12,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardAvatar: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: '#F5B731' },
  cardCookName: { fontSize: 16, fontWeight: '800' },
  cardSpec: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: '800' },

  // Info Row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoAmount: { fontSize: 16, fontWeight: '900', color: '#F5B731' },

  // Ref
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refLabel: { fontSize: 11, fontWeight: '500' },
  refValue: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Receipt
  receipt: {
    padding: 14, borderRadius: 14, borderWidth: 1, gap: 8,
  },
  receiptTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: 12, fontWeight: '500' },
  receiptValue: { fontSize: 12, fontWeight: '600' },
  receiptDivider: { borderTopWidth: 1, marginVertical: 4, borderStyle: 'dashed' as any },
  receiptTotal: { fontSize: 16, fontWeight: '900', color: '#F5B731' },
  notesBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  notesText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  receiptBooked: { fontSize: 10, fontWeight: '500', textAlign: 'right', marginTop: 4 },

  // Actions
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  rebookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
  },
  rebookBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },

  // Empty
  empty: {
    padding: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', gap: 8, marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '500' },
});
