import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  FlatList,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Demo Slides Data ──
interface DemoSlide {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  detailedPoints: string[];
  image: any;
  gradient: [string, string];
  emoji: string;
  metrics: { label: string; value: string; icon: string }[];
  userStory?: string;
  techStack?: string[];
}

const DEMO_SLIDES: DemoSlide[] = [
  {
    id: 'intro',
    category: 'OVERVIEW',
    title: 'FoodGenie',
    subtitle: 'The Social Food Platform',
    description: 'A creator-centric food platform combining social discovery, AI meal planning, home cook booking, and gamified rewards into one seamless experience.',
    detailedPoints: [
      'Instagram/TikTok-style vertical food feed',
      'AI-powered personalized meal planning',
      'Direct home chef booking marketplace',
      'Gamified engagement with coin rewards',
      'Smart grocery budget optimization',
      'Creator economy with video content',
    ],
    image: require('../assets/images/demo-home.png'),
    gradient: ['#D4AF37', '#FFD700'],
    emoji: '🍽️',
    metrics: [
      { label: 'Daily Active Users', value: '12K+', icon: 'people' },
      { label: 'Food Cards', value: '500+', icon: 'restaurant' },
      { label: 'AI Plans Generated', value: '8K+', icon: 'auto-awesome' },
      { label: 'Cooks Available', value: '50+', icon: 'person' },
    ],
    techStack: ['React Native', 'Expo', 'Supabase', 'Gemini AI', 'PostgreSQL'],
  },
  {
    id: 'feed',
    category: 'CORE FEATURE',
    title: 'Foodies Feed',
    subtitle: 'TikTok-Style Food Discovery',
    description: 'A full-screen vertical swipe feed where users discover mouthwatering food content from creators, restaurants, and home cooks. Each card features immersive visuals with emoji-based emotional reactions.',
    detailedPoints: [
      'Full-screen vertical swipe cards with smooth animations',
      'Three unique emoji reactions: Craving 🤤, Must Try 🔥, Loved It ❤️',
      'Per-user atomic emotion tracking in PostgreSQL',
      'Creator profiles with follow system',
      'Dynamic content from 500+ food cards database',
      'Recipe steps, cook time, and difficulty badges',
      'Video autoplay support with thumbnail fallback',
      'Category filtering (Trending, Healthy, Street Food, Homemade)',
    ],
    image: require('../assets/images/demo-feed.png'),
    gradient: ['#FF6B6B', '#FF8E53'],
    emoji: '🔥',
    metrics: [
      { label: 'Reactions/Day', value: '12K', icon: 'favorite' },
      { label: 'Avg. Session', value: '8 min', icon: 'timer' },
      { label: 'Creators', value: '150+', icon: 'person' },
      { label: 'Retention', value: '68%', icon: 'trending-up' },
    ],
    userStory: 'Riya discovers a new street food recipe every morning on her commute, reacts with "Must Try 🔥" and saves it for the weekend.',
  },
  {
    id: 'meal-planner',
    category: 'AI FEATURE',
    title: 'Aaj Khane Me Kya Hai?',
    subtitle: 'AI Daily Meal Planning',
    description: 'Powered by Gemini AI, this feature auto-generates personalized daily, weekly, and monthly meal plans based on user preferences, dietary needs, budget, and health goals with complete nutrition tracking.',
    detailedPoints: [
      'Daily meal suggestions (Breakfast, Lunch, Snack, Dinner)',
      'Weekly calendar view with swappable meals',
      'Monthly budget-optimized planning',
      'Nutrition rings: Calories, Protein, Carbs, Fat',
      'Dietary filters: Veg, Vegan, Keto, Low-Carb, Gluten-Free',
      'Spice level personalization (1-5 scale)',
      'Health goal integration (Weight Loss, Muscle Gain, Maintenance)',
      'Auto-links to grocery lists for ingredients',
    ],
    image: require('../assets/images/demo-meal-planner.png'),
    gradient: ['#818CF8', '#6366F1'],
    emoji: '🤖',
    metrics: [
      { label: 'Plans Generated', value: '8K+', icon: 'auto-awesome' },
      { label: 'Accuracy', value: '94%', icon: 'check-circle' },
      { label: 'Cuisines', value: '25+', icon: 'public' },
      { label: 'User Satisfaction', value: '4.7★', icon: 'star' },
    ],
    userStory: 'Arjun opens the app at 7 AM and instantly sees today\'s personalized meal plan with calorie targets matched to his fitness goals.',
    techStack: ['Gemini 3 Flash', 'OnSpace AI', 'Edge Functions'],
  },
  {
    id: 'ai-chat',
    category: 'AI FEATURE',
    title: 'Let AI Plan Your Meals',
    subtitle: 'Conversational Meal Planning',
    description: 'A ChatGPT-style conversational interface where users can ask complex meal planning questions, get grocery lists with budget breakdowns, and receive personalized nutritional advice — all rendered in beautifully formatted cards.',
    detailedPoints: [
      'Natural language meal planning queries',
      'Structured markdown responses (tables, lists, headers)',
      'Budget-categorized grocery lists with estimated costs',
      'Week-long meal plan generation in single query',
      'Dietary restriction awareness and allergy handling',
      'Recipe suggestions with step-by-step instructions',
      'Integration with Book a Cook for outsourced meals',
      'Coin rewards: +5 per AI plan generated',
    ],
    image: require('../assets/images/demo-ai-chat.png'),
    gradient: ['#A855F7', '#7C3AED'],
    emoji: '💬',
    metrics: [
      { label: 'Conversations', value: '15K+', icon: 'chat' },
      { label: 'Avg. Messages', value: '6.3', icon: 'message' },
      { label: 'Budget Savings', value: '22%', icon: 'savings' },
      { label: 'Response Time', value: '<3s', icon: 'speed' },
    ],
    userStory: 'Priya types "Plan healthy vegetarian meals under ₹200/day for my family of 4" and gets a complete weekly plan with grocery list in seconds.',
  },
  {
    id: 'cook-booking',
    category: 'MARKETPLACE',
    title: 'Book a Cook',
    subtitle: 'Home Chef Marketplace',
    description: 'A curated marketplace of verified home cooks available for daily, weekly, or monthly hiring. Features video reviews from real customers, calendar-based booking, and transparent pricing.',
    detailedPoints: [
      'Verified cook profiles with expertise tags',
      'Video customer reviews (recorded & uploaded in-app)',
      'Per-meal, daily, weekly, monthly pricing tiers',
      'Interactive 5-week calendar for date selection',
      'Real-time search by name, cuisine, location, price',
      'Booking status lifecycle (Pending → Confirmed → Active → Completed)',
      'Booking reference numbers for tracking',
      'Premium banner carousel featuring top-rated cooks',
    ],
    image: require('../assets/images/demo-cook-booking.png'),
    gradient: ['#D4AF37', '#B8960C'],
    emoji: '👨‍🍳',
    metrics: [
      { label: 'Verified Cooks', value: '50+', icon: 'verified' },
      { label: 'Avg Rating', value: '4.8★', icon: 'star' },
      { label: 'Bookings', value: '2K+', icon: 'event' },
      { label: 'Repeat Rate', value: '73%', icon: 'repeat' },
    ],
    userStory: 'After relocating to a new city, Rahul finds and books a South Indian cook for weekday lunches within 5 minutes using the app.',
    techStack: ['Supabase DB', 'Video Upload', 'Calendar Picker'],
  },
  {
    id: 'coins',
    category: 'ENGAGEMENT',
    title: 'Genie Coins',
    subtitle: 'Gamified Reward System',
    description: 'A comprehensive gamification layer that rewards every meaningful action — from posting food content to booking cooks. Includes daily streaks, leaderboards, referrals, and redeemable rewards.',
    detailedPoints: [
      'Post food content: +20 coins',
      'Like/react to posts: +1 coin (max 20/day)',
      'Share content: +10 coins',
      'Follow creators: +5 coins',
      'Daily login streak: +5 coins (increasing)',
      'Generate AI meal plan: +10 coins',
      'AI chat plan: +5 coins',
      'Book a cook: +15 coins',
      'Referral system with unique codes',
      'Leaderboard with weekly/all-time rankings',
    ],
    image: require('../assets/images/demo-coins.png'),
    gradient: ['#4ADE80', '#22C55E'],
    emoji: '🪙',
    metrics: [
      { label: 'Coins Distributed', value: '1.2M', icon: 'monetization-on' },
      { label: 'Active Earners', value: '5K+', icon: 'people' },
      { label: 'Avg Streak', value: '12 days', icon: 'local-fire-department' },
      { label: 'Redemptions', value: '800+', icon: 'redeem' },
    ],
    userStory: 'Sneha maintains a 30-day streak by posting her breakfast every morning, earning enough coins to redeem a free cook trial.',
  },
  {
    id: 'grocery',
    category: 'UTILITY',
    title: 'Smart Grocery',
    subtitle: 'Budget-Optimized Shopping',
    description: 'AI-powered grocery list management that bundles ingredients by budget, compares prices across delivery partners (Zepto, Blinkit, Swiggy Instamart), and auto-generates lists from meal plans.',
    detailedPoints: [
      'Auto-generate grocery list from AI meal plans',
      'Budget-based category bundling (₹ ranges)',
      'Partner app deep-linking (Zepto, Blinkit, Instamart)',
      'Price comparison across partners',
      'Weekly and monthly supply calculations',
      'Smart quantity suggestions for family size',
      'Category grouping (Vegetables, Dairy, Grains, Spices)',
      'Share lists with family members',
    ],
    image: require('../assets/images/demo-grocery.png'),
    gradient: ['#F59E0B', '#D97706'],
    emoji: '🛒',
    metrics: [
      { label: 'Avg Savings', value: '18%', icon: 'savings' },
      { label: 'Partner Apps', value: '3+', icon: 'store' },
      { label: 'Lists Created', value: '4K+', icon: 'list-alt' },
      { label: 'Families Served', value: '2K+', icon: 'family-restroom' },
    ],
    userStory: 'Meera generates her weekly grocery list from the AI meal plan, sees that Zepto has the best deal for vegetables, and orders with one tap.',
  },
  {
    id: 'creator',
    category: 'SOCIAL',
    title: 'Creator Economy',
    subtitle: 'Food Content Creators',
    description: 'A full creator ecosystem with profile tiers, content shows, episode-based series, photo editing tools, and engagement analytics. Creators build audiences around their food journey.',
    detailedPoints: [
      'Creator tier system (Newbie → Explorer → Creator → Legend)',
      'Show creation with episodes (like YouTube series)',
      'In-app photo editor with food stickers and text',
      'Post creation with meal type tags and location',
      'Follower/following social graph',
      'Engagement analytics dashboard',
      'Content calendar and scheduling',
      'Cross-platform sharing with branded cards',
    ],
    image: require('../assets/images/demo-creator.png'),
    gradient: ['#EC4899', '#DB2777'],
    emoji: '⭐',
    metrics: [
      { label: 'Creators', value: '150+', icon: 'person' },
      { label: 'Shows Created', value: '45', icon: 'slideshow' },
      { label: 'Avg Followers', value: '340', icon: 'people' },
      { label: 'Content/Week', value: '800+', icon: 'photo-library' },
    ],
    userStory: 'Chef Ananya built a following of 2,000+ by posting her grandmother\'s recipes as a weekly show series.',
    techStack: ['Expo Camera', 'Image Editor', 'Video Player'],
  },
];

const AUTO_ADVANCE_MS = 8000; // Longer for detailed slides

export default function AppDemoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressWidth = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const slide = DEMO_SLIDES[currentSlide];

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying) {
      cancelAnimation(progressWidth);
      return;
    }

    progressWidth.value = 0;
    progressWidth.value = withTiming(1, { duration: AUTO_ADVANCE_MS, easing: Easing.linear });

    timerRef.current = setTimeout(() => {
      const next = (currentSlide + 1) % DEMO_SLIDES.length;
      setCurrentSlide(next);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSlide, isAutoPlaying]);

  const goToSlide = useCallback((idx: number) => {
    if (idx === currentSlide) return;
    Haptics.selectionAsync();
    setCurrentSlide(idx);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, [currentSlide]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoPlaying(false);
    setCurrentSlide((currentSlide + 1) % DEMO_SLIDES.length);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, [currentSlide]);

  const handlePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoPlaying(false);
    setCurrentSlide(currentSlide === 0 ? DEMO_SLIDES.length - 1 : currentSlide - 1);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, [currentSlide]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `🍽️ FoodGenie — The Social Food Platform\n\n` +
          `Key Features:\n` +
          `🔥 TikTok-style food discovery feed\n` +
          `🤖 AI Meal Planner (Gemini-powered)\n` +
          `💬 Conversational meal planning chat\n` +
          `👨‍🍳 Book verified home cooks\n` +
          `🪙 Gamified coin reward system\n` +
          `🛒 Smart grocery budget optimization\n` +
          `⭐ Creator economy with shows\n\n` +
          `📊 Key Metrics:\n` +
          `• 12K+ DAU • 500+ Food Cards\n` +
          `• 8K+ AI Plans • 50+ Verified Cooks\n` +
          `• 1.2M Coins Distributed\n\n` +
          `Tech Stack: React Native, Expo, Supabase, Gemini AI\n\n` +
          `Download FoodGenie today! 🚀`,
      });
    } catch { /* ignore */ }
  }, []);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0F' : '#FAFAF8' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{slide.category}</Text>
          </View>
          <Text style={[styles.headerCount, { color: colors.textMuted }]}>
            {currentSlide + 1} / {DEMO_SLIDES.length}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.headerBtn, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); setIsAutoPlaying(!isAutoPlaying); }}
          >
            <MaterialIcons
              name={isAutoPlaying ? 'pause' : 'play-arrow'}
              size={20}
              color={isAutoPlaying ? '#D4AF37' : colors.textMuted}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Progress Segments */}
      <View style={styles.progressRow}>
        {DEMO_SLIDES.map((ds, i) => (
          <Pressable key={ds.id} style={styles.progressSegment} onPress={() => goToSlide(i)}>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              {i < currentSlide ? (
                <View style={[styles.progressFill, { backgroundColor: ds.gradient[0], width: '100%' }]} />
              ) : i === currentSlide ? (
                <Animated.View style={[styles.progressFill, { backgroundColor: ds.gradient[0] }, progressAnimStyle]} />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Main Content - Scrollable slide */}
      <ScrollView
        key={slide.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        style={{ flex: 1 }}
      >
        {/* App Screenshot Image */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.imageSection}>
          <View style={[styles.imageContainer, { borderColor: slide.gradient[0] + '25' }]}>
            <Image
              source={slide.image}
              style={styles.appImage}
              contentFit="cover"
              transition={300}
            />
            {/* Overlay gradient */}
            <LinearGradient
              colors={['transparent', isDark ? '#0A0A0F' : '#FAFAF8']}
              style={styles.imageOverlay}
            />
            {/* Floating emoji badge */}
            <View style={[styles.emojiFloater, { backgroundColor: slide.gradient[0] + '20', borderColor: slide.gradient[0] + '40' }]}>
              <Text style={{ fontSize: 28 }}>{slide.emoji}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.titleSection}>
          <LinearGradient colors={slide.gradient} style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{slide.subtitle}</Text>
          </LinearGradient>
          <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{slide.title}</Text>
          <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>{slide.description}</Text>
        </Animated.View>

        {/* Metrics Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.metricsGrid}>
          {slide.metrics.map((metric, i) => (
            <Animated.View
              key={metric.label}
              entering={FadeInUp.delay(250 + i * 80).duration(350)}
              style={[styles.metricCard, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : slide.gradient[0] + '15',
              }]}
            >
              <View style={[styles.metricIcon, { backgroundColor: slide.gradient[0] + '15' }]}>
                <MaterialIcons name={metric.icon as any} size={18} color={slide.gradient[0]} />
              </View>
              <Text style={[styles.metricValue, { color: slide.gradient[0] }]}>{metric.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{metric.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Detailed Features */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Key Features</Text>
          <View style={styles.featuresList}>
            {slide.detailedPoints.map((point, i) => (
              <Animated.View
                key={i}
                entering={FadeInLeft.delay(350 + i * 60).duration(300)}
                style={[styles.featureItem, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }]}
              >
                <View style={[styles.featureBullet, { backgroundColor: slide.gradient[0] }]} />
                <Text style={[styles.featureItemText, { color: colors.textSecondary }]}>{point}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* User Story */}
        {slide.userStory ? (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.storySection}>
            <View style={[styles.storyCard, {
              backgroundColor: isDark ? slide.gradient[0] + '08' : slide.gradient[0] + '06',
              borderColor: slide.gradient[0] + '20',
            }]}>
              <View style={styles.storyHeader}>
                <MaterialIcons name="format-quote" size={20} color={slide.gradient[0]} />
                <Text style={[styles.storyLabel, { color: slide.gradient[0] }]}>User Story</Text>
              </View>
              <Text style={[styles.storyText, { color: colors.textSecondary }]}>{slide.userStory}</Text>
            </View>
          </Animated.View>
        ) : null}

        {/* Tech Stack */}
        {slide.techStack ? (
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.techSection}>
            <Text style={[styles.techLabel, { color: colors.textMuted }]}>Built With</Text>
            <View style={styles.techRow}>
              {slide.techStack.map((tech) => (
                <View key={tech} style={[styles.techPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <Text style={[styles.techPillText, { color: colors.textSecondary }]}>{tech}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? '#0A0A0F' : '#FAFAF8' }]}>
        <Pressable
          style={({ pressed }) => [styles.navArrow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
          onPress={handlePrev}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Slide dots */}
        <View style={styles.dotsRow}>
          {DEMO_SLIDES.map((ds, i) => (
            <Pressable key={ds.id} onPress={() => goToSlide(i)} hitSlop={6}>
              <View style={[
                styles.dot,
                i === currentSlide && { width: 20, backgroundColor: ds.gradient[0] },
                i !== currentSlide && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
              ]} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.navArrow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
          onPress={handleNext}
        >
          <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  headerBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  headerCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 16,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Image Section
  imageSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  imageContainer: {
    height: SCREEN_H * 0.35,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  appImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  emojiFloater: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Title Section
  titleSection: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    width: (SCREEN_W - 42) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Features
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureItemText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // User Story
  storySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  storyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  storyText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Tech Stack
  techSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  techLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  techPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
