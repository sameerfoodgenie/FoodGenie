import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useCreator, MilestoneCategory } from '../contexts/CreatorContext';

const CATEGORY_TABS: { id: MilestoneCategory | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'activity', label: 'Activity', emoji: '📸' },
  { id: 'consistency', label: 'Streak', emoji: '🔥' },
  { id: 'impact', label: 'Impact', emoji: '❤️' },
];

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentLevel, nextLevel, levelProgress,
    milestones, unlockedMilestones, nextMilestone,
    badges, unlockedBadges,
    postCount, streakCount, totalLikes,
  } = useCreator();

  const [activeTab, setActiveTab] = useState<MilestoneCategory | 'all'>('all');

  const filteredMilestones = activeTab === 'all'
    ? milestones
    : milestones.filter(m => m.category === activeTab);

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
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* ─── Level Hero (top) ─── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.levelHero}>
            <LinearGradient
              colors={[`${currentLevel.color}18`, `${currentLevel.color}04`]}
              style={styles.levelCard}
            >
              <View style={[styles.levelEmoji, { backgroundColor: `${currentLevel.color}20`, borderColor: `${currentLevel.color}40` }]}>
                <Text style={{ fontSize: 36 }}>{currentLevel.emoji}</Text>
              </View>
              <Text style={[styles.levelName, { color: currentLevel.color }]}>{currentLevel.name}</Text>
              {nextLevel ? (
                <View style={styles.levelProgressWrap}>
                  <View style={styles.levelProgressBg}>
                    <Animated.View
                      style={[styles.levelProgressFill, { width: `${levelProgress * 100}%`, backgroundColor: currentLevel.color }]}
                    />
                  </View>
                  <Text style={styles.levelProgressText}>
                    {nextLevel.minPosts - postCount} posts to {nextLevel.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.levelProgressText, { color: currentLevel.color, fontWeight: '700' }]}>
                  Max level reached! 👑
                </Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ─── Next Milestone Highlight ─── */}
          {nextMilestone ? (
            <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.nextMilestoneWrap}>
              <LinearGradient
                colors={[`${nextMilestone.color}12`, `${nextMilestone.color}04`]}
                style={styles.nextMilestoneCard}
              >
                <View style={styles.nextMilestoneHeader}>
                  <Text style={styles.nextMilestoneLabel}>NEXT MILESTONE</Text>
                  <MaterialIcons name="trending-up" size={16} color={nextMilestone.color} />
                </View>
                <View style={styles.nextMilestoneRow}>
                  <View style={[styles.nextMilestoneIcon, { backgroundColor: `${nextMilestone.color}20`, borderColor: `${nextMilestone.color}40` }]}>
                    <Text style={{ fontSize: 24 }}>{nextMilestone.icon}</Text>
                  </View>
                  <View style={styles.nextMilestoneInfo}>
                    <Text style={styles.nextMilestoneTitle}>{nextMilestone.title}</Text>
                    <Text style={styles.nextMilestoneDesc}>{nextMilestone.description}</Text>
                    <View style={styles.nextMilestoneProgress}>
                      <View style={styles.nextMilestoneBarBg}>
                        <View style={[
                          styles.nextMilestoneBarFill,
                          { width: `${Math.min(nextMilestone.current / nextMilestone.target, 1) * 100}%`, backgroundColor: nextMilestone.color },
                        ]} />
                      </View>
                      <Text style={[styles.nextMilestoneCount, { color: nextMilestone.color }]}>
                        {nextMilestone.current}/{nextMilestone.target}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.nextMilestoneReward, { backgroundColor: `${nextMilestone.color}10`, borderColor: `${nextMilestone.color}25` }]}>
                  <MaterialIcons name="emoji-events" size={14} color={nextMilestone.color} />
                  <Text style={[styles.nextMilestoneRewardText, { color: nextMilestone.color }]}>
                    {nextMilestone.reward}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : null}

          {/* ─── Stats (secondary) ─── */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.statsRow}>
            {[
              { label: 'Posts', value: String(postCount), emoji: '📸', color: '#4ADE80' },
              { label: 'Streak', value: `${streakCount}d`, emoji: '🔥', color: '#FB923C' },
              { label: 'Likes', value: String(totalLikes), emoji: '❤️', color: '#F87171' },
              { label: 'Badges', value: String(unlockedBadges.length), emoji: '🏅', color: '#FBBF24' },
            ].map(s => (
              <View key={s.label} style={[styles.statCard, { borderColor: `${s.color}20` }]}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ─── Badges (horizontal scroll) ─── */}
          <Animated.View entering={FadeInDown.delay(300).duration(350)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <Text style={styles.sectionCount}>{unlockedBadges.length}/{badges.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgeScroll}
            >
              {badges.map(badge => (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    badge.isUnlocked
                      ? { borderColor: `${badge.color}40`, backgroundColor: `${badge.color}10` }
                      : { opacity: 0.4 },
                  ]}
                >
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={[styles.badgeName, badge.isUnlocked && { color: badge.color }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  {badge.isUnlocked ? (
                    <MaterialIcons name="verified" size={14} color={badge.color} />
                  ) : (
                    <MaterialIcons name="lock-outline" size={14} color={theme.textMuted} />
                  )}
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ─── Milestones ─── */}
          <Animated.View entering={FadeInDown.delay(400).duration(350)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Milestones</Text>
              <Text style={styles.sectionCount}>{unlockedMilestones.length}/{milestones.length}</Text>
            </View>

            {/* Category tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
            >
              {CATEGORY_TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    style={[styles.catTab, isActive && styles.catTabActive]}
                    onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                  >
                    <Text style={styles.catTabEmoji}>{tab.emoji}</Text>
                    <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Milestone list */}
            <View style={styles.milestoneList}>
              {filteredMilestones.map((m, i) => {
                const progress = m.target > 0 ? Math.min(m.current / m.target, 1) : 0;
                return (
                  <Animated.View
                    key={m.id}
                    entering={FadeInUp.delay(i * 50).duration(280)}
                    style={[
                      styles.milestoneCard,
                      m.isUnlocked && { borderColor: `${m.color}30`, backgroundColor: `${m.color}08` },
                    ]}
                  >
                    <View style={styles.milestoneRow}>
                      <View style={[
                        styles.milestoneIcon,
                        m.isUnlocked
                          ? { backgroundColor: `${m.color}20`, borderColor: `${m.color}40` }
                          : {},
                      ]}>
                        <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                      </View>
                      <View style={styles.milestoneInfo}>
                        <View style={styles.milestoneTitleRow}>
                          <Text style={styles.milestoneTitle}>{m.title}</Text>
                          {m.isUnlocked ? (
                            <MaterialIcons name="check-circle" size={16} color={m.color} />
                          ) : null}
                        </View>
                        <Text style={styles.milestoneDesc}>{m.description}</Text>
                        <View style={styles.milestoneProgressWrap}>
                          <View style={styles.milestoneProgressBg}>
                            <View style={[
                              styles.milestoneProgressFill,
                              { width: `${progress * 100}%`, backgroundColor: m.isUnlocked ? m.color : theme.textMuted },
                            ]} />
                          </View>
                          <Text style={styles.milestoneProgressText}>
                            {m.current}/{m.target}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[
                      styles.rewardTag,
                      m.isUnlocked
                        ? { backgroundColor: `${m.color}15`, borderColor: `${m.color}30` }
                        : {},
                    ]}>
                      <MaterialIcons
                        name={m.isUnlocked ? 'emoji-events' : 'lock-outline'}
                        size={13}
                        color={m.isUnlocked ? m.color : theme.textMuted}
                      />
                      <Text style={[
                        styles.rewardText,
                        m.isUnlocked && { color: m.color },
                      ]}>{m.reward}</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
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

  // Level Hero
  levelHero: { paddingHorizontal: 16, paddingTop: 20 },
  levelCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  levelEmoji: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  levelName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  levelProgressWrap: { width: '100%', gap: 8, marginTop: 4 },
  levelProgressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  levelProgressFill: { height: '100%', borderRadius: 4 },
  levelProgressText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary, textAlign: 'center' },

  // Next Milestone
  nextMilestoneWrap: { paddingHorizontal: 16, paddingTop: 16 },
  nextMilestoneCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  nextMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextMilestoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 1,
  },
  nextMilestoneRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  nextMilestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  nextMilestoneInfo: { flex: 1, gap: 4 },
  nextMilestoneTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
  nextMilestoneDesc: { fontSize: 13, color: theme.textSecondary },
  nextMilestoneProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nextMilestoneBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  nextMilestoneBarFill: { height: '100%', borderRadius: 3 },
  nextMilestoneCount: { fontSize: 13, fontWeight: '700', width: 50, textAlign: 'right' },
  nextMilestoneReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  nextMilestoneRewardText: { fontSize: 12, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', color: theme.textMuted },

  // Badges
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.textPrimary },
  sectionCount: { fontSize: 14, fontWeight: '600', color: theme.textMuted },

  badgeScroll: { paddingHorizontal: 16, gap: 10 },
  badgeCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 90,
  },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },

  // Milestones
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  catTabActive: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  catTabEmoji: { fontSize: 14 },
  catTabText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  catTabTextActive: { color: theme.primary, fontWeight: '700' },

  milestoneList: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  milestoneCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  milestoneRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: { flex: 1, gap: 6 },
  milestoneTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestoneTitle: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  milestoneDesc: { fontSize: 13, color: theme.textSecondary },
  milestoneProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneProgressBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  milestoneProgressFill: { height: '100%', borderRadius: 3 },
  milestoneProgressText: { fontSize: 12, fontWeight: '700', color: theme.textMuted, width: 50, textAlign: 'right' },

  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
    marginLeft: 58,
  },
  rewardText: { fontSize: 12, fontWeight: '600', color: theme.textMuted },
});
