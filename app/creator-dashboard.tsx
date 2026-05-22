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
import { useTheme } from '../hooks/useTheme';
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
  const { colors, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <LinearGradient
          colors={['#1E1456', '#7B2FA0', '#C41E7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={{ width: 44 }} />
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* ─── Level Hero (top) ─── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.levelHero}>
            <LinearGradient
              colors={isDark ? ['rgba(123,47,160,0.15)', 'rgba(30,20,86,0.10)'] : ['rgba(123,47,160,0.08)', 'rgba(245,183,49,0.04)']}
              style={[styles.levelCard, { borderColor: colors.border }]}
            >
              <View style={[styles.levelEmoji, { backgroundColor: 'rgba(123,47,160,0.12)', borderColor: 'rgba(123,47,160,0.30)' }]}>
                <Text style={{ fontSize: 36 }}>{currentLevel.emoji}</Text>
              </View>
              <Text style={[styles.levelName, { color: '#7B2FA0' }]}>{currentLevel.name}</Text>
              {nextLevel ? (
                <View style={styles.levelProgressWrap}>
                  <View style={[styles.levelProgressBg, { backgroundColor: isDark ? 'rgba(123,47,160,0.15)' : 'rgba(123,47,160,0.10)' }]}>
                    <Animated.View
                      style={[styles.levelProgressFill, { width: `${levelProgress * 100}%`, backgroundColor: '#7B2FA0' }]}
                    />
                  </View>
                  <Text style={[styles.levelProgressText, { color: colors.textSecondary }]}>
                    {nextLevel.minPosts - postCount} posts to {nextLevel.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.levelProgressText, { color: '#F5B731', fontWeight: '700' }]}>
                  Max level reached! 👑
                </Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ─── Next Milestone Highlight ─── */}
          {nextMilestone ? (
            <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.nextMilestoneWrap}>
              <View style={[styles.nextMilestoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.nextMilestoneHeader}>
                  <Text style={[styles.nextMilestoneLabel, { color: '#7B2FA0' }]}>NEXT MILESTONE</Text>
                  <MaterialIcons name="trending-up" size={16} color="#C41E7A" />
                </View>
                <View style={styles.nextMilestoneRow}>
                  <View style={[styles.nextMilestoneIcon, { backgroundColor: 'rgba(245,183,49,0.10)', borderColor: 'rgba(245,183,49,0.30)' }]}>
                    <Text style={{ fontSize: 24 }}>{nextMilestone.icon}</Text>
                  </View>
                  <View style={styles.nextMilestoneInfo}>
                    <Text style={[styles.nextMilestoneTitle, { color: colors.textPrimary }]}>{nextMilestone.title}</Text>
                    <Text style={[styles.nextMilestoneDesc, { color: colors.textSecondary }]}>{nextMilestone.description}</Text>
                    <View style={styles.nextMilestoneProgress}>
                      <View style={[styles.nextMilestoneBarBg, { backgroundColor: isDark ? 'rgba(123,47,160,0.15)' : 'rgba(123,47,160,0.10)' }]}>
                        <View style={[
                          styles.nextMilestoneBarFill,
                          { width: `${Math.min(nextMilestone.current / nextMilestone.target, 1) * 100}%`, backgroundColor: '#F5B731' },
                        ]} />
                      </View>
                      <Text style={[styles.nextMilestoneCount, { color: '#F5B731' }]}>
                        {nextMilestone.current}/{nextMilestone.target}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.nextMilestoneReward, { backgroundColor: 'rgba(123,47,160,0.08)', borderColor: 'rgba(123,47,160,0.20)' }]}>
                  <MaterialIcons name="emoji-events" size={14} color="#7B2FA0" />
                  <Text style={[styles.nextMilestoneRewardText, { color: '#7B2FA0' }]}>
                    {nextMilestone.reward}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* ─── Stats (secondary) ─── */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.statsRow}>
            {[
              { label: 'Posts', value: String(postCount), emoji: '📸', color: '#7B2FA0' },
              { label: 'Streak', value: `${streakCount}d`, emoji: '🔥', color: '#F04E50' },
              { label: 'Likes', value: String(totalLikes), emoji: '❤️', color: '#C41E7A' },
              { label: 'Badges', value: String(unlockedBadges.length), emoji: '🏅', color: '#F5B731' },
            ].map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ─── Badges (horizontal scroll) ─── */}
          <Animated.View entering={FadeInDown.delay(300).duration(350)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Badges</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{unlockedBadges.length}/{badges.length}</Text>
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
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    badge.isUnlocked
                      ? { borderColor: 'rgba(245,183,49,0.30)', backgroundColor: isDark ? 'rgba(245,183,49,0.06)' : 'rgba(245,183,49,0.05)' }
                      : { opacity: 0.4 },
                  ]}
                >
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={[styles.badgeName, { color: colors.textSecondary }, badge.isUnlocked && { color: '#F5B731' }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                  {badge.isUnlocked ? (
                    <MaterialIcons name="verified" size={14} color="#F5B731" />
                  ) : (
                    <MaterialIcons name="lock-outline" size={14} color={colors.textMuted} />
                  )}
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ─── Milestones ─── */}
          <Animated.View entering={FadeInDown.delay(400).duration(350)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Milestones</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{unlockedMilestones.length}/{milestones.length}</Text>
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
                    style={[styles.catTab, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && styles.catTabActive]}
                    onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                  >
                    <Text style={styles.catTabEmoji}>{tab.emoji}</Text>
                    <Text style={[styles.catTabText, { color: colors.textMuted }, isActive && styles.catTabTextActive]}>{tab.label}</Text>
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
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      m.isUnlocked && { borderColor: 'rgba(245,183,49,0.25)', backgroundColor: isDark ? 'rgba(245,183,49,0.04)' : 'rgba(245,183,49,0.03)' },
                    ]}
                  >
                    <View style={styles.milestoneRow}>
                      <View style={[
                        styles.milestoneIcon,
                        { backgroundColor: isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.08)', borderColor: colors.border },
                        m.isUnlocked
                          ? { backgroundColor: 'rgba(245,183,49,0.10)', borderColor: 'rgba(245,183,49,0.30)' }
                          : {},
                      ]}>
                        <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                      </View>
                      <View style={styles.milestoneInfo}>
                        <View style={styles.milestoneTitleRow}>
                          <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]}>{m.title}</Text>
                          {m.isUnlocked ? (
                            <MaterialIcons name="check-circle" size={16} color="#F5B731" />
                          ) : null}
                        </View>
                        <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>{m.description}</Text>
                        <View style={styles.milestoneProgressWrap}>
                          <View style={[styles.milestoneProgressBg, { backgroundColor: isDark ? 'rgba(123,47,160,0.15)' : 'rgba(123,47,160,0.08)' }]}>
                            <View style={[
                              styles.milestoneProgressFill,
                              { width: `${progress * 100}%`, backgroundColor: m.isUnlocked ? '#F5B731' : '#7B2FA0' },
                            ]} />
                          </View>
                          <Text style={[styles.milestoneProgressText, { color: colors.textMuted }]}>
                            {m.current}/{m.target}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[
                      styles.rewardTag,
                      { backgroundColor: isDark ? 'rgba(123,47,160,0.10)' : 'rgba(123,47,160,0.06)', borderColor: 'rgba(123,47,160,0.20)' },
                      m.isUnlocked
                        ? { backgroundColor: 'rgba(245,183,49,0.08)', borderColor: 'rgba(245,183,49,0.20)' }
                        : {},
                    ]}>
                      <MaterialIcons
                        name={m.isUnlocked ? 'emoji-events' : 'lock-outline'}
                        size={13}
                        color={m.isUnlocked ? '#F5B731' : colors.textMuted}
                      />
                      <Text style={[
                        styles.rewardText,
                        { color: colors.textMuted },
                        m.isUnlocked && { color: '#D9A020' },
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
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  // Level Hero
  levelHero: { paddingHorizontal: 16, paddingTop: 20 },
  levelCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
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
  levelName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  levelProgressWrap: { width: '100%', gap: 8, marginTop: 4 },
  levelProgressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: { height: '100%', borderRadius: 4 },
  levelProgressText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  // Next Milestone
  nextMilestoneWrap: { paddingHorizontal: 16, paddingTop: 16 },
  nextMilestoneCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  nextMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextMilestoneLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
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
  nextMilestoneTitle: { fontSize: 17, fontWeight: '800' },
  nextMilestoneDesc: { fontSize: 13 },
  nextMilestoneProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nextMilestoneBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  nextMilestoneBarFill: { height: '100%', borderRadius: 3 },
  nextMilestoneCount: { fontSize: 13, fontWeight: '800', width: 50, textAlign: 'right' },
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
  nextMilestoneRewardText: { fontSize: 12, fontWeight: '700' },

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
    borderWidth: 1,
  },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  // Badges
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCount: { fontSize: 14, fontWeight: '600' },

  badgeScroll: { paddingHorizontal: 16, gap: 10 },
  badgeCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 90,
  },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 12, fontWeight: '600' },

  // Milestones
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  catTabActive: {
    backgroundColor: 'rgba(245,183,49,0.08)',
    borderColor: 'rgba(245,183,49,0.30)',
  },
  catTabEmoji: { fontSize: 14 },
  catTabText: { fontSize: 13, fontWeight: '600' },
  catTabTextActive: { color: '#F5B731', fontWeight: '700' },

  milestoneList: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  milestoneCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  milestoneRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: { flex: 1, gap: 6 },
  milestoneTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestoneTitle: { fontSize: 15, fontWeight: '800' },
  milestoneDesc: { fontSize: 13 },
  milestoneProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneProgressBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneProgressFill: { height: '100%', borderRadius: 3 },
  milestoneProgressText: { fontSize: 12, fontWeight: '700', width: 50, textAlign: 'right' },

  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 58,
  },
  rewardText: { fontSize: 12, fontWeight: '600' },
});
