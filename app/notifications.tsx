import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/template';
import { useNotifications, AppNotification } from '../hooks/useNotifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
  like: { icon: 'favorite', color: '#D4AF37' },
  comment: { icon: 'chat-bubble', color: '#FFD700' },
  follow: { icon: 'person-add', color: '#4ADE80' },
  live_reminder: { icon: 'live-tv', color: '#FF3B30' },
};

function NotificationItem({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const typeInfo = TYPE_ICONS[item.type] || { icon: 'notifications' as const, color: '#A0A0A0' };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.notifItem,
        !item.is_read && styles.notifUnread,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.notifIcon, { backgroundColor: `${typeInfo.color}15` }]}>
        <MaterialIcons name={typeInfo.icon} size={20} color={typeInfo.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications(user?.id || null);

  const handleNotifPress = useCallback((item: AppNotification) => {
    Haptics.selectionAsync();
    if (!item.is_read) markRead(item.id);
    if (item.post_id) {
      router.push({ pathname: '/food-detail', params: { postId: item.post_id } });
    }
  }, [markRead, router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); markAllRead(); }}
          >
            <Text style={styles.markAllText}>Read All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handleNotifPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="notifications-none" size={48} color="#6B6B6B" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              When someone likes your post or follows you, it will show up here
            </Text>
          </Animated.View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  markAllText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },

  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  notifUnread: {
    backgroundColor: 'rgba(212,175,55,0.04)',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1, gap: 3 },
  notifMessage: { fontSize: 14, fontWeight: '500', color: '#FFF', lineHeight: 20 },
  notifTime: { fontSize: 12, color: '#6B6B6B' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
