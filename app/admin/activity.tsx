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
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { fetchRecentOpsActions, OpsAction } from '../../services/adminService';

const ACTION_ICONS: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; color: string }> = {
  create: { icon: 'add-circle', color: '#4ADE80' },
  update: { icon: 'edit', color: '#60A5FA' },
  delete: { icon: 'delete', color: '#FB7185' },
  verify: { icon: 'verified', color: '#FBBF24' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminActivityScreen() {
  const router = useRouter();
  const [actions, setActions] = useState<OpsAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await fetchRecentOpsActions(30);
    setActions(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderAction = useCallback(({ item, index }: { item: OpsAction; index: number }) => {
    const actionConfig = ACTION_ICONS[item.action_type] || { icon: 'info' as const, color: '#6B6B6B' };
    const actorName = (item.actor as any)?.full_name || 'System';

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <View style={styles.actionCard}>
          <View style={[styles.actionIconWrap, { backgroundColor: `${actionConfig.color}12` }]}>
            <MaterialIcons name={actionConfig.icon} size={20} color={actionConfig.color} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionType}>
              {item.action_type}
              {item.target_table ? (
                <Text style={styles.actionTarget}> on {item.target_table}</Text>
              ) : null}
            </Text>
            <Text style={styles.actionActor}>{actorName}</Text>
          </View>
          <Text style={styles.actionTime}>{formatDate(item.created_at)}</Text>
        </View>
      </Animated.View>
    );
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Activity Log</Text>
          <Text style={styles.headerSub}>{actions.length} recent actions</Text>
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
          data={actions}
          keyExtractor={(item) => item.id}
          renderItem={renderAction}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color="#6B6B6B" />
              <Text style={styles.emptyTitle}>No Activity Yet</Text>
              <Text style={styles.emptySub}>Operations actions will appear here</Text>
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

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: { flex: 1, gap: 2 },
  actionType: { fontSize: 14, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },
  actionTarget: { fontSize: 13, fontWeight: '500', color: '#6B6B6B' },
  actionActor: { fontSize: 12, fontWeight: '500', color: '#A0A0A0' },
  actionTime: { fontSize: 11, fontWeight: '500', color: '#6B6B6B', maxWidth: 90, textAlign: 'right' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B6B6B' },
  emptySub: { fontSize: 13, color: '#6B6B6B' },
});
