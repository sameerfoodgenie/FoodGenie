import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useCreator, CreatorShow } from '../contexts/CreatorContext';
import { useAlert } from '@/template';

const SCREEN_WIDTH = Dimensions.get('window').width;

function ShowCard({ show, onPress, onDelete }: { show: CreatorShow; onPress: () => void; onDelete: () => void }) {
  const episodeCount = show.episodes.length;
  const timeAgo = getTimeAgo(show.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.showCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      {/* Cover */}
      <View style={styles.showCover}>
        {show.coverUri ? (
          <Image source={{ uri: show.coverUri }} style={styles.showCoverImage} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={['#1A1A1A', '#121212']} style={styles.showCoverPlaceholder}>
            <MaterialIcons name="movie-creation" size={32} color={theme.textMuted} />
          </LinearGradient>
        )}
        <View style={styles.episodeBadge}>
          <Text style={styles.episodeBadgeText}>{episodeCount} ep{episodeCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.showInfo}>
        <Text style={styles.showTitle} numberOfLines={1}>{show.title}</Text>
        {show.description ? (
          <Text style={styles.showDesc} numberOfLines={2}>{show.description}</Text>
        ) : null}
        <Text style={styles.showMeta}>{timeAgo}</Text>
      </View>

      {/* Actions */}
      <View style={styles.showActions}>
        <Pressable
          style={({ pressed }) => [styles.showActionBtn, pressed && { opacity: 0.7 }]}
          onPress={(e) => { e.stopPropagation(); Haptics.selectionAsync(); onDelete(); }}
        >
          <MaterialIcons name="delete-outline" size={18} color={theme.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CreatorStudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { shows, removeShow } = useCreator();
  const { showAlert } = useAlert();

  const handleCreateShow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-show');
  }, [router]);

  const handleShowPress = useCallback((show: CreatorShow) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/create-show', params: { showId: show.id } });
  }, [router]);

  const handleDeleteShow = useCallback((show: CreatorShow) => {
    Haptics.selectionAsync();
    showAlert('Delete Show', `Remove "${show.title}" and all its episodes?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeShow(show.id) },
    ]);
  }, [removeShow, showAlert]);

  const renderShow = useCallback(({ item, index }: { item: CreatorShow; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(350)}>
      <ShowCard
        show={item}
        onPress={() => handleShowPress(item)}
        onDelete={() => handleDeleteShow(item)}
      />
    </Animated.View>
  ), [handleShowPress, handleDeleteShow]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Creator Studio</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Stats banner */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.statsBanner}>
          <LinearGradient
            colors={['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)']}
            style={styles.statsBannerInner}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{shows.length}</Text>
              <Text style={styles.statLabel}>Shows</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {shows.reduce((sum, s) => sum + s.episodes.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Episodes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.creatorBadge}>
                <MaterialIcons name="auto-awesome" size={14} color="#D4AF37" />
                <Text style={styles.creatorBadgeText}>Creator</Text>
              </View>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Shows list */}
        <FlatList
          data={shows}
          keyExtractor={item => item.id}
          renderItem={renderShow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          ListEmptyComponent={
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="movie-creation" size={48} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Shows Yet</Text>
              <Text style={styles.emptyDesc}>
                Create your first show and start sharing your food journey with episodes.
              </Text>
            </Animated.View>
          }
        />

        {/* Create buttons */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}
        >
          <View style={styles.fabRow}>
            <Pressable
              style={({ pressed }) => [styles.fab, styles.fabSecondary, pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/upload-recipe'); }}
            >
              <View style={styles.fabSecondaryInner}>
                <MaterialIcons name="videocam" size={20} color="#D4AF37" />
                <Text style={styles.fabSecondaryText}>Upload Recipe</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.fab, { flex: 1 }, pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}
              onPress={handleCreateShow}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.fabGradient}>
                <MaterialIcons name="add" size={24} color={theme.textOnPrimary} />
                <Text style={styles.fabText}>New Show</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  statsBanner: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  statsBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  statLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted },
  statDivider: { width: 1, height: 32, backgroundColor: theme.border },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  creatorBadgeText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },

  listContent: { paddingHorizontal: 16, paddingTop: 16 },

  showCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  showCover: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  showCoverImage: { width: '100%', height: '100%' },
  showCoverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  episodeBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  showInfo: { flex: 1, gap: 4 },
  showTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  showDesc: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
  showMeta: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  showActions: {},
  showActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  emptyDesc: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  fabWrap: { position: 'absolute', left: 20, right: 20 },
  fabRow: { flexDirection: 'row', gap: 10 },
  fab: { borderRadius: 16, overflow: 'hidden', ...theme.shadows.colored },
  fabSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  fabSecondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  fabSecondaryText: { fontSize: 14, fontWeight: '700', color: '#D4AF37' },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  fabText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
});
