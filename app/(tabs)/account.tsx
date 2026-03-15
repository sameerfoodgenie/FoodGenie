import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { config } from '../../constants/config';
import { useAlert, useAuth } from '@/template';
import { useRouter } from 'expo-router';

interface ActiveSubscription {
  id: string;
  name: string;
  restaurant?: string;
  type: 'gym' | 'daily';
  price: number;
  status: 'active' | 'paused';
  startDate: string;
  nextBilling: string;
  meals: number;
  cuisine?: string;
}

const mockSubscriptions: ActiveSubscription[] = [
  {
    id: 'sub1',
    name: 'Muscle Gain Plan',
    type: 'gym',
    price: 4500,
    status: 'active',
    startDate: '2025-01-15',
    nextBilling: '2025-02-05',
    meals: 14,
  },
  {
    id: 'sub2',
    name: 'Punjabi Dhaba Weekly',
    restaurant: 'Punjabi Dhaba',
    type: 'daily',
    price: 2500,
    status: 'active',
    startDate: '2025-01-20',
    nextBilling: '2025-02-03',
    meals: 10,
    cuisine: 'North Indian',
  },
];

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preferences, updatePreferences } = useApp();
  const { showAlert } = useAlert();
  const { user, logout } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>(mockSubscriptions);
  
  const [name, setName] = useState(user?.username || 'Food Lover');
  const [email, setEmail] = useState(user?.email || 'user@foodgenie.com');

  const handleSaveProfile = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditingProfile(false);
    showAlert('Profile Updated', 'Your profile has been saved successfully');
  };

  const handleEditPreferences = () => {
    Haptics.selectionAsync();
    updatePreferences({ onboardingComplete: false });
  };

  const handlePauseSubscription = (subId: string) => {
    Haptics.selectionAsync();
    showAlert(
      'Pause Subscription?',
      'Your subscription will be paused from the next billing cycle',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          style: 'default',
          onPress: () => {
            setSubscriptions(prev =>
              prev.map(sub =>
                sub.id === subId ? { ...sub, status: 'paused' as const } : sub
              )
            );
            showAlert('Subscription Paused', 'You can resume anytime from here');
          },
        },
      ]
    );
  };

  const handleResumeSubscription = (subId: string) => {
    Haptics.selectionAsync();
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === subId ? { ...sub, status: 'active' as const } : sub
      )
    );
    showAlert('Subscription Resumed', 'Your meals will continue from next cycle');
  };

  const handleCancelSubscription = (subId: string) => {
    Haptics.selectionAsync();
    showAlert(
      'Cancel Subscription?',
      'Are you sure? This action cannot be undone',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            setSubscriptions(prev => prev.filter(sub => sub.id !== subId));
            showAlert('Subscription Cancelled', 'No further charges will be made');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Haptics.selectionAsync();
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) {
            showAlert('Error', error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Account</Text>
          <Text style={styles.subtitle}>Manage your profile and subscriptions</Text>
        </View>

        {/* Profile Section */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <Pressable
                style={styles.editButton}
                onPress={() => setIsEditingProfile(!isEditingProfile)}
              >
                <MaterialIcons
                  name={isEditingProfile ? 'close' : 'edit'}
                  size={18}
                  color={theme.primary}
                />
                <Text style={styles.editButtonText}>
                  {isEditingProfile ? 'Cancel' : 'Edit'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.avatarContainer}>
                <LinearGradient colors={theme.gradients.genie} style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.profileFields}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                    value={name}
                    onChangeText={setName}
                    editable={isEditingProfile}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={email}
                    editable={false}
                    placeholderTextColor={theme.textMuted}
                  />
                  <Text style={styles.fieldHint}>Email cannot be changed</Text>
                </View>
              </View>

              {isEditingProfile ? (
                <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
                  <LinearGradient colors={theme.gradients.genie} style={styles.saveGradient}>
                    <MaterialIcons name="check" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </LinearGradient>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {/* Food Preferences */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Food Preferences</Text>
              <Pressable style={styles.editButton} onPress={handleEditPreferences}>
                <MaterialIcons name="tune" size={18} color={theme.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Diet</Text>
                  <View style={styles.preferenceBadge}>
                    <Text style={styles.preferenceBadgeText}>
                      {preferences.diet
                        ? `${config.dietOptions.find(d => d.id === preferences.diet)?.emoji || ''} ${config.dietOptions.find(d => d.id === preferences.diet)?.label || ''}`
                        : 'Not set'}
                    </Text>
                  </View>
                </View>

                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Budget</Text>
                  <View style={styles.preferenceBadge}>
                    <Text style={styles.preferenceBadgeText}>
                      ₹{preferences.budgetMin} - ₹{preferences.budgetMax}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Spice Level</Text>
                  <View style={styles.preferenceBadge}>
                    <Text style={styles.preferenceBadgeText}>
                      {config.spiceLevels.find(s => s.level === preferences.spiceLevel)?.emoji || '🌶️'}{' '}
                      {config.spiceLevels.find(s => s.level === preferences.spiceLevel)?.label || ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceLabel}>Mode</Text>
                  <View style={styles.preferenceBadge}>
                    <Text style={styles.preferenceBadgeText}>
                      {preferences.mode === 'quick' ? '⚡ Quick' : '💬 Guided'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Active Subscriptions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            
            {subscriptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🍱</Text>
                <Text style={styles.emptyStateText}>No active subscriptions</Text>
                <Text style={styles.emptyStateSubtext}>
                  Subscribe to meal plans for hassle-free eating
                </Text>
              </View>
            ) : (
              subscriptions.map((sub, index) => (
                <Animated.View
                  key={sub.id}
                  entering={FadeInDown.delay(300 + index * 100).duration(400)}
                >
                  <View style={styles.subscriptionCard}>
                    <View style={[styles.statusBadge, sub.status === 'paused' && styles.statusBadgePaused]}>
                      <Text style={[styles.statusText, sub.status === 'paused' && styles.statusTextPaused]}>
                        {sub.status === 'active' ? '● Active' : '⏸ Paused'}
                      </Text>
                    </View>

                    <View style={styles.subscriptionHeader}>
                      <View style={styles.subscriptionTitleArea}>
                        <Text style={styles.subscriptionName}>{sub.name}</Text>
                        {sub.restaurant ? (
                          <Text style={styles.subscriptionRestaurant}>{sub.restaurant}</Text>
                        ) : null}
                      </View>
                      <View style={styles.subscriptionPrice}>
                        <Text style={styles.priceValue}>₹{sub.price}</Text>
                        <Text style={styles.priceLabel}>/ week</Text>
                      </View>
                    </View>

                    <View style={styles.subscriptionDetails}>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="calendar-today" size={14} color={theme.textSecondary} />
                        <Text style={styles.detailText}>Next billing: {new Date(sub.nextBilling).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="lunch-dining" size={14} color={theme.textSecondary} />
                        <Text style={styles.detailText}>{sub.meals} meals / week</Text>
                      </View>
                    </View>

                    <View style={styles.subscriptionActions}>
                      {sub.status === 'active' ? (
                        <Pressable style={styles.actionButton} onPress={() => handlePauseSubscription(sub.id)}>
                          <MaterialIcons name="pause" size={16} color={theme.accent} />
                          <Text style={styles.actionButtonText}>Pause</Text>
                        </Pressable>
                      ) : (
                        <Pressable style={styles.actionButton} onPress={() => handleResumeSubscription(sub.id)}>
                          <MaterialIcons name="play-arrow" size={16} color={theme.success} />
                          <Text style={styles.actionButtonText}>Resume</Text>
                        </Pressable>
                      )}
                      <Pressable style={[styles.actionButton, styles.cancelActionButton]} onPress={() => handleCancelSubscription(sub.id)}>
                        <MaterialIcons name="close" size={16} color={theme.error} />
                        <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        </Animated.View>

        {/* Account Actions */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/partner-apps')}
            >
              <MaterialIcons name="storefront" size={22} color={theme.primary} />
              <Text style={styles.settingsItemText}>Partner Apps</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
            </Pressable>

            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/ops' as any)}
            >
              <MaterialIcons name="admin-panel-settings" size={22} color={theme.primary} />
              <Text style={styles.settingsItemText}>Ops Panel</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
            </Pressable>

            <Pressable style={styles.settingsItem}>
              <MaterialIcons name="payment" size={22} color={theme.textSecondary} />
              <Text style={styles.settingsItemText}>Payment Methods</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
            </Pressable>

            <Pressable style={styles.settingsItem}>
              <MaterialIcons name="location-on" size={22} color={theme.textSecondary} />
              <Text style={styles.settingsItemText}>Delivery Addresses</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
            </Pressable>

            <Pressable style={styles.settingsItem}>
              <MaterialIcons name="history" size={22} color={theme.textSecondary} />
              <Text style={styles.settingsItemText}>Order History</Text>
              <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
            </Pressable>

            <Pressable style={[styles.settingsItem, styles.logoutItem]} onPress={handleLogout}>
              <MaterialIcons name="logout" size={22} color={theme.error} />
              <Text style={[styles.settingsItemText, styles.logoutText]}>Logout</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>FoodGenie v{config.app.version}</Text>
          <Text style={styles.versionSubtext}>{config.app.tagline}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: theme.textPrimary },
  subtitle: { fontSize: 15, color: theme.textSecondary, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.full },
  editButtonText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  card: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.xl, padding: 20, borderWidth: 1, borderColor: theme.border, ...theme.shadows.card },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', ...theme.shadows.card },
  avatarText: { fontSize: 32, fontWeight: '700', color: theme.textOnPrimary },
  profileFields: { gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.textPrimary, borderWidth: 1, borderColor: theme.border },
  inputDisabled: { backgroundColor: theme.backgroundTertiary, color: theme.textSecondary },
  fieldHint: { fontSize: 12, color: theme.textMuted, fontStyle: 'italic' },
  saveButton: { marginTop: 20, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
  preferenceRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  preferenceItem: { flex: 1, gap: 8 },
  preferenceLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  preferenceBadge: { backgroundColor: theme.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  preferenceBadgeText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  emptyState: { backgroundColor: theme.background, borderRadius: theme.borderRadius.xl, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' },
  emptyStateEmoji: { fontSize: 48, marginBottom: 12 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  emptyStateSubtext: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  subscriptionCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.xl, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(200,135,90,0.12)', ...theme.shadows.card },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.full, marginBottom: 12 },
  statusBadgePaused: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  statusText: { fontSize: 11, fontWeight: '700', color: theme.success, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusTextPaused: { color: theme.accent },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  subscriptionTitleArea: { flex: 1 },
  subscriptionName: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  subscriptionRestaurant: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  subscriptionPrice: { alignItems: 'flex-end' },
  priceValue: { fontSize: 24, fontWeight: '700', color: theme.primary },
  priceLabel: { fontSize: 11, color: theme.textSecondary },
  subscriptionDetails: { gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: theme.textSecondary },
  subscriptionActions: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.backgroundSecondary, paddingVertical: 12, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.border },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  cancelActionButton: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  cancelButtonText: { color: theme.error },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.background, paddingVertical: 16, paddingHorizontal: 16, borderRadius: theme.borderRadius.lg, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  settingsItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  logoutItem: { marginTop: 8, borderColor: 'rgba(209,114,114,0.2)', backgroundColor: 'rgba(209,114,114,0.03)' },
  logoutText: { color: theme.error, fontWeight: '600' },
  versionContainer: { alignItems: 'center', paddingVertical: 24 },
  versionText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
  versionSubtext: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
});
