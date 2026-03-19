import React, { useState, useCallback } from 'react';
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
import { useCreator, MilestoneCategory, CREATOR_LEVELS } from '../contexts/CreatorContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    currentLevel, nextLevel, levelProgress, allLevels,
    milestones, unlockedMilestones, badges, unlockedBadges,
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
          <Text style={styles.headerTitle}>Creator Dashboard</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* ─── Level Card ─── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.levelSection}>
            <LinearGradient
              colors={[`${currentLevel.color}18`, `${currentLevel.color}06`]}
              style={styles.levelCard}
            >
              <View style={styles.levelTop}>
                <View style={[styles.levelEmoji, { backgroundColor: `${currentLevel.color}20`, borderColor: `${currentLevel.color}40` }]}>
                  <Text style={styles.levelEmojiText}>{currentLevel.emoji}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelName}>{currentLevel.name}</Text>
                  {nextLevel ? (
                    <Text style={styles.levelNext}>
                      {nextLevel.minPosts - postCount} posts to {nextLevel.name}
                    </Text>
                  ) : (
                    <Text style={[styles.levelNext, { color: currentLevel.color }]}>Max level reached!</Text>
                  )}
                </View>
              </View>

              {/* Level progress bar */}
              {nextLevel ? (
                <View style={styles.levelProgressWrap}>
                  <View style={styles.levelProgressBg}>
                    <Animated.View
                      style={[styles.levelProgressFill, { width: `${levelProgress * 100}%`, backgroundColor: currentLevel.color }]}
                    />
                  </View>
                  <Text style={styles.levelProgressText}>{Math.round(levelProgress * 100)}%</Text>
                </View>
              ) : null}

              {/* Level timeline */}
              <View style={styles.levelTimeline}>
                {allLevels.map((lvl, i) => {
                  const isActive = postCount >= lvl.minPosts;
                  const isCurrent = lvl.id === currentLevel.id;
                  return (
                    <View key={lvl.id} style={styles.timelineItem}>
                      <View style={[
                        styles.timelineDot,
                        isActive && { backgroundColor: lvl.color, borderColor: lvl.color },
                        isCurrent && { transform: [{ scale: 1.2 }] },
                      ]}>
                        <Text style={{ fontSize: isCurrent ? 14 : 10 }}>{lvl.emoji}</Text>
                      </View>
                      <Text style={[
                        styles.timelineLabel,
                        isCurrent && { color: lvl.color, fontWeight: '700' },
                      ]} numberOfLines={1}>{lvl.name.split(' ')[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── Stats Row ─── */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.statsRow}>
            {[
              { label: 'Posts', value: String(postCount), emoji: '📸', color: '#4ADE80' },
              { label: 'Streak', value: `${streakCount}d`, emoji: '🔥', color: '#FB923C' },
              { label: 'Likes', value: String(totalLikes), emoji: '❤️', color: '#F87171' },
              { label: 'Badges', value: String(unlockedBadges.length), emoji: '🏅', color: '#FBBF24' },
            ].map((s, i) => (
              <View key={s.label} style={[styles.statCard, { borderColor: `${s.color}25` }]}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ─── Badges ─── */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <Text style={styles.sectionCount}>{unlockedBadges.length}/{badges.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgeScroll}
            >
              {badges.map((badge, i) => (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    badge.isUnlocked
                      ? { borderColor: `${badge.color}40`, backgroundColor: `${badge.color}10` }
                      : { opacity: 0.45 },
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
          <Animated.View entering={FadeInDown.delay(300).duration(350)}>
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
                    entering={FadeInUp.delay(i * 60).duration(300)}
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
                    {/* Reward tag */}
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

          {/* ─── Motivational footer ─── */}
          <Animated.View entering={FadeInDown.delay(400).duration(350)} style={styles.footerCard}>
            <Text style={styles.footerEmoji}>✨</Text>
            <Text style={styles.footerText}>
              Keep posting, stay consistent, and watch your creator journey grow!
            </Text>
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

  // Level
  levelSection: { paddingHorizontal: 16, paddingTop: 20 },
  levelCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 16,
  },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  levelEmojiText: { fontSize: 28 },
  levelInfo: { flex: 1, gap: 4 },
  levelName: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  levelNext: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },

  levelProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelProgressBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  levelProgressFill: { height: '100%', borderRadius: 4 },
  levelProgressText: { fontSize: 13, fontWeight: '700', color: theme.textSecondary, width: 40, textAlign: 'right' },

  levelTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  timelineItem: { alignItems: 'center', gap: 4, flex: 1 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: { fontSize: 10, fontWeight: '500', color: theme.textMuted },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
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
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', color: theme.textMuted },

  // Badges
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
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
  milestoneTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  milestoneDesc: { fontSize: 13, color: theme.textSecondary },
  milestoneProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneProgressBg: {
    flex: 1,
    height: 6,
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

  // Footer
  footerCard: {
    marginHorizontal: 16,
    marginTop: 28,
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    gap: 8,
  },
  footerEmoji: { fontSize: 28 },
  footerText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
});
