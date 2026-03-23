import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { fetchUsers, AdminUser } from '../../services/adminService';

const ROLE_COLORS: Record<string, string> = {
  admin_ops: '#FB7185',
  restaurant_partner: '#60A5FA',
  chef_auditor: '#FBBF24',
  customer: '#6B6B6B',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await fetchUsers(50);
    setUsers(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderUser = useCallback(({ item, index }: { item: AdminUser; index: number }) => {
    const initials = (item.full_name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const roleColor = ROLE_COLORS[item.role] || '#6B6B6B';

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <View style={styles.userCard}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} contentFit="cover" transition={150} />
          ) : (
            <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.full_name || 'Unknown User'}
            </Text>
            <Text style={styles.userMeta}>Joined {formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: `${roleColor}15`, borderColor: `${roleColor}30` }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{item.role}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSub}>{users.length} registered</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color="#D4AF37" />
        </Pressable>
      </Animated.View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={48} color="#6B6B6B" />
              <Text style={styles.emptyTitle}>No Users Found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, fontWeight: '500', color: '#6B6B6B', marginTop: 2 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: { padding: 16, gap: 10, paddingBottom: 40 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#0A0A0A' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  userMeta: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleText: { fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B6B6B' },
});
