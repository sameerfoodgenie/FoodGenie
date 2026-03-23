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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { fetchRecentPosts, RecentPost } from '../../services/adminService';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await fetchRecentPosts(30);
    setPosts(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderPost = useCallback(({ item, index }: { item: RecentPost; index: number }) => {
    const creatorName = (item.profiles as any)?.full_name || 'Unknown';
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <View style={styles.postCard}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.postImage} contentFit="cover" transition={150} />
          ) : (
            <View style={styles.postNoImage}>
              <Text style={{ fontSize: 24 }}>🍽</Text>
            </View>
          )}
          <View style={styles.postInfo}>
            <Text style={styles.postDish} numberOfLines={1}>{item.dish_name}</Text>
            <Text style={styles.postCreator} numberOfLines={1}>by {creatorName}</Text>
            <View style={styles.postStats}>
              <View style={styles.postStatItem}>
                <MaterialIcons name="favorite" size={13} color="#FB7185" />
                <Text style={styles.postStatText}>{item.likes_count}</Text>
              </View>
              <View style={styles.postStatItem}>
                <MaterialIcons name="chat-bubble" size={12} color="#38BDF8" />
                <Text style={styles.postStatText}>{item.comments_count}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
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
          <Text style={styles.headerTitle}>Posts</Text>
          <Text style={styles.headerSub}>{posts.length} recent posts</Text>
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
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="dynamic-feed" size={48} color="#6B6B6B" />
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
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

  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  postImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  postNoImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postInfo: { flex: 1, gap: 3 },
  postDish: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  postCreator: { fontSize: 12, fontWeight: '500', color: '#6B6B6B' },
  postStats: { flexDirection: 'row', gap: 12, marginTop: 2 },
  postStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 12, fontWeight: '600', color: '#A0A0A0' },
  postTime: { fontSize: 11, fontWeight: '500', color: '#6B6B6B' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B6B6B' },
});
