import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useMeals } from '../../hooks/useMeals';
import { useAlert, useAuth } from '@/template';
import { useRouter } from 'expo-router';
import { config } from '../../constants/config';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preferences } = useApp();
  const { todayMeals, dailyScore, streak, totalCalories } = useMeals();
  const { showAlert } = useAlert();
  const { user, logout } = useAuth();

  const name = user?.username || 'Food Lover';
  const email = user?.email || '';

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

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar + Info */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.profileCard}>
            <LinearGradient colors={theme.gradients.cameraBtn} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </LinearGradient>
            <Text style={styles.profileName}>{name}</Text>
            {email ? <Text style={styles.profileEmail}>{email}</Text> : null}

            {/* Quick stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{todayMeals.length}</Text>
                <Text style={styles.quickStatLabel}>Today</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{streak}</Text>
                <Text style={styles.quickStatLabel}>Streak</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatValue, { color: theme.primary }]}>
                  {dailyScore > 0 ? `${dailyScore}%` : '—'}
                </Text>
                <Text style={styles.quickStatLabel}>Score</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Preferences snapshot */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Food Preferences</Text>
          <View style={styles.card}>
            <View style={styles.prefRow}>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Diet</Text>
                <Text style={styles.prefValue}>
                  {preferences.diet === 'veg' ? '🥬 Veg' : preferences.diet === 'egg' ? '🥚 Egg' : preferences.diet === 'nonveg' ? '🍗 Non-Veg' : 'Not set'}
                </Text>
              </View>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Budget</Text>
                <Text style={styles.prefValue}>₹{preferences.budgetMin}–₹{preferences.budgetMax}</Text>
              </View>
            </View>
            <View style={styles.prefRow}>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Spice</Text>
                <Text style={styles.prefValue}>
                  {preferences.spiceLevel === 1 ? '😌 Mild' : preferences.spiceLevel === 2 ? '🌶️ Medium' : '🔥 Spicy'}
                </Text>
              </View>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Mode</Text>
                <Text style={styles.prefValue}>
                  {preferences.mode === 'quick' ? '⚡ Quick' : '💬 Guided'}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.editPrefsBtn, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/(tabs)/preferences')}
            >
              <MaterialIcons name="tune" size={16} color={theme.primary} />
              <Text style={styles.editPrefsBtnText}>Edit Preferences</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <Pressable style={styles.settingsItem} onPress={() => router.push('/explore')}>
            <MaterialIcons name="explore" size={22} color={theme.primary} />
            <Text style={styles.settingsItemText}>Explore Dishes</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <Pressable style={styles.settingsItem} onPress={() => router.push('/partner-apps')}>
            <MaterialIcons name="storefront" size={22} color={theme.textSecondary} />
            <Text style={styles.settingsItemText}>Partner Apps</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <Pressable style={styles.settingsItem} onPress={() => router.push('/snap-share')}>
            <MaterialIcons name="share" size={22} color={theme.textSecondary} />
            <Text style={styles.settingsItemText}>Snap & Share</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <Pressable style={styles.settingsItem} onPress={() => router.push('/ops' as any)}>
            <MaterialIcons name="admin-panel-settings" size={22} color={theme.textSecondary} />
            <Text style={styles.settingsItemText}>Ops Panel</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <Pressable style={[styles.settingsItem, styles.logoutItem]} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color={theme.error} />
            <Text style={[styles.settingsItemText, styles.logoutText]}>Logout</Text>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>FoodGenie v{config.app.version}</Text>
          <Text style={styles.versionSub}>Camera-first nutrition tracking</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingHorizontal: 20 },

  header: { paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: theme.textPrimary },

  // Profile card
  profileCard: {
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.shadows.neonGreen,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: theme.textOnPrimary },
  profileName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  profileEmail: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatDivider: { width: 1, height: 32, backgroundColor: theme.border },
  quickStatValue: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  quickStatLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  prefRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  prefItem: { flex: 1 },
  prefLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  prefValue: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  editPrefsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  editPrefsBtnText: { fontSize: 14, fontWeight: '600', color: theme.primary },

  // Settings
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingsItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  logoutItem: { marginTop: 8, borderColor: 'rgba(248,113,113,0.15)', backgroundColor: 'rgba(248,113,113,0.04)' },
  logoutText: { color: theme.error, fontWeight: '600' },

  versionContainer: { alignItems: 'center', paddingVertical: 24 },
  versionText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
  versionSub: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
});
