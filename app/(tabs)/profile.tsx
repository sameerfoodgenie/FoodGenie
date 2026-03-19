import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { usePosts } from '../../contexts/PostContext';
import { useMeals } from '../../hooks/useMeals';
import { useAlert, useAuth } from '@/template';
import { useRouter } from 'expo-router';
import { config } from '../../constants/config';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { myPosts, posts, streak, totalPosts } = usePosts();
  const { todayMeals } = useMeals();
  const { showAlert } = useAlert();
  const { user, logout } = useAuth();

  const name = user?.username || 'Food Lover';
  const email = user?.email || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // Use all posts for the grid display (in a real app, filter by user)
  const gridPosts = posts;

  const handleLogout = () => {
    Haptics.selectionAsync();
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) showAlert('Error', error);
        },
      },
    ]);
  };

  const renderGridItem = ({ item, index }: { item: typeof posts[0]; index: number }) => (
    <Pressable
      style={[
        styles.gridItem,
        { marginRight: (index + 1) % GRID_COLS === 0 ? 0 : GRID_GAP },
      ]}
      onPress={() => { Haptics.selectionAsync(); }}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.gridImage} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.gridNoImage}>
          <Text style={{ fontSize: 28 }}>🍽</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <FlatList
        data={gridPosts}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={renderGridItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        columnWrapperStyle={{ marginBottom: GRID_GAP }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{name}</Text>
              <View style={styles.headerActions}>
                <Pressable
                  style={styles.headerIconBtn}
                  onPress={() => router.push('/(tabs)/camera')}
                >
                  <MaterialIcons name="add-box" size={26} color={theme.textPrimary} />
                </Pressable>
                <Pressable
                  style={styles.headerIconBtn}
                  onPress={() => router.push('/explore')}
                >
                  <MaterialIcons name="menu" size={26} color={theme.textPrimary} />
                </Pressable>
              </View>
            </View>

            {/* Profile info */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.profileSection}>
              <LinearGradient colors={['#4ADE80', '#22C55E']} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{gridPosts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todayMeals.length}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#FB923C' }]}>🔥 {streak}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
              </View>
            </Animated.View>

            {/* Bio */}
            <View style={styles.bioSection}>
              <Text style={styles.bioName}>{name}</Text>
              {email ? <Text style={styles.bioEmail}>{email}</Text> : null}
              <Text style={styles.bioText}>Food lover sharing my meals on FoodGenie 🍽✨</Text>
            </View>

            {/* Action buttons */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/(tabs)/preferences')}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/snap-share')}
              >
                <Text style={styles.editProfileText}>Share</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.8 }]}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={18} color={theme.textSecondary} />
              </Pressable>
            </Animated.View>

            {/* Grid header */}
            <View style={styles.gridHeader}>
              <View style={styles.gridTab}>
                <MaterialIcons name="grid-on" size={22} color={theme.textPrimary} />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <MaterialIcons name="camera-alt" size={48} color={theme.textMuted} />
            <Text style={styles.emptyGridTitle}>No Posts Yet</Text>
            <Text style={styles.emptyGridSub}>Share your first meal!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerIconBtn: { padding: 4 },

  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: theme.textOnPrimary },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  statLabel: { fontSize: 12, fontWeight: '500', color: theme.textMuted },

  // Bio
  bioSection: { paddingHorizontal: 20, paddingBottom: 12, gap: 2 },
  bioName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  bioEmail: { fontSize: 13, color: theme.textMuted },
  bioText: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },

  // Actions
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  editProfileBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editProfileText: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  settingsBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Grid header
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  gridTab: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderBottomWidth: 2,
    borderBottomColor: theme.textPrimary,
  },

  // Grid
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    overflow: 'hidden',
  },
  gridImage: { width: '100%', height: '100%' },
  gridNoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyGrid: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyGridTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  emptyGridSub: { fontSize: 14, color: theme.textMuted },
});
