import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { theme } from '../constants/theme';
import { generateInvestorDeckHTML } from '../services/investorDeckPdf';

function getSafeWidth() {
  try {
    const w = Dimensions.get('window').width;
    return w > 0 ? w : 375;
  } catch { return 375; }
}

// Unsplash food images for showcase
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80',
];

const CREATOR_AVATARS = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
];

const KEY_METRICS = [
  { label: 'Daily Active', value: '50K+', icon: 'people', color: '#4ADE80' },
  { label: 'Posts / Day', value: '12K+', icon: 'camera-alt', color: '#FFD700' },
  { label: 'Creators', value: '2.5K', icon: 'auto-awesome', color: '#D4AF37' },
  { label: 'Retention', value: '68%', icon: 'trending-up', color: '#4ADE80' },
];

const FEATURES = [
  {
    id: 'feed',
    title: 'Share What You Eat',
    subtitle: 'Your food journey, beautifully captured',
    description: 'Instagram-style vertical reels feed with progressive image loading, real-time engagement, and social discovery.',
    icon: 'dynamic-feed',
    color: '#FFD700',
    highlights: ['Full-screen vertical reels', 'Progressive image loading', 'Like, comment, save, share', 'Story highlights bar'],
  },
  {
    id: 'camera',
    title: 'Capture & Create',
    subtitle: 'Photo and video with one tap',
    description: 'Built-in camera with photo and video modes, flash control, gallery import, and instant post creation flow.',
    icon: 'camera-alt',
    color: '#D4AF37',
    highlights: ['Photo & video modes', 'Recipe video recording', 'Gallery import', 'Smart meal tagging'],
  },
  {
    id: 'discover',
    title: 'Discover & Learn',
    subtitle: 'Trending chefs, live sessions & shows',
    description: 'Explore top creators, join live cooking sessions, watch popular shows, and discover new food creators.',
    icon: 'explore',
    color: '#FFC107',
    highlights: ['Trending home chefs', 'Live cooking sessions', 'Popular food shows', 'New creator spotlight'],
  },
  {
    id: 'creator',
    title: 'Creator Economy',
    subtitle: 'Unlock tiers, earn badges & grow',
    description: '3-tier creator system with 5 levels, 10+ achievement badges, shows, live sessions, and follower growth tracking.',
    icon: 'auto-awesome',
    color: '#FFD700',
    highlights: ['3 creator tiers', '10+ achievement badges', 'Creator studio & shows', 'Follower analytics'],
  },
];

const MONETIZATION = [
  { title: 'Creator Subscriptions', desc: 'Premium content access tiers', icon: 'card-membership', value: '15%' },
  { title: 'Live Session Tickets', desc: 'Paid cooking masterclasses', icon: 'live-tv', value: '20%' },
  { title: 'Restaurant Partnerships', desc: 'Featured placements & orders', icon: 'storefront', value: '40%' },
  { title: 'Brand Collaborations', desc: 'Sponsored creator content', icon: 'campaign', value: '25%' },
];

const TECH_STACK = [
  { name: 'React Native', desc: 'Cross-platform', icon: 'phone-iphone' },
  { name: 'Expo', desc: 'Managed workflow', icon: 'rocket-launch' },
  { name: 'Supabase', desc: 'Auth + DB + Storage', icon: 'cloud' },
  { name: 'Edge Functions', desc: 'Serverless', icon: 'bolt' },
  { name: 'Push Notifications', desc: 'Expo Push API', icon: 'notifications' },
  { name: 'AI Integration', desc: 'Food analysis', icon: 'psychology' },
];

// ─── Video Showcase Data ───
const SHOWCASE_VIDEOS = [
  {
    id: 'feed',
    title: 'Social Feed',
    subtitle: 'Vertical reels experience with real-time engagement',
    icon: 'dynamic-feed' as const,
    color: '#FFD700',
    uri: 'https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    stats: [{ label: 'Avg Session', value: '8.5 min' }, { label: 'Scroll Depth', value: '92%' }],
  },
  {
    id: 'camera',
    title: 'Capture & Create',
    subtitle: 'Photo and video with instant post flow',
    icon: 'camera-alt' as const,
    color: '#D4AF37',
    uri: 'https://videos.pexels.com/video-files/3327312/3327312-sd_640_360_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80',
    stats: [{ label: 'Posts / Day', value: '12K+' }, { label: 'Avg Upload', value: '< 3s' }],
  },
  {
    id: 'creator',
    title: 'Creator Dashboard',
    subtitle: 'Tiers, badges, analytics and growth tracking',
    icon: 'auto-awesome' as const,
    color: '#FFC107',
    uri: 'https://videos.pexels.com/video-files/3298572/3298572-sd_640_360_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    stats: [{ label: 'Creators', value: '2.5K' }, { label: 'Badges Earned', value: '10K+' }],
  },
];

// ─── Video Showcase Card ───
function VideoShowcaseCard({ video, index, cardWidth }: {
  video: typeof SHOWCASE_VIDEOS[0];
  index: number;
  cardWidth: number;
}) {
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const player = useVideoPlayer(video.uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Pulsing border glow
  const glowOpacity = useSharedValue(0.3);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(212,175,55,${glowOpacity.value * 0.3})`,
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 150).duration(500)}
      style={[styles.videoCard, { width: cardWidth }, glowStyle]}
    >
      {/* Video player area */}
      <View style={styles.videoPlayerWrap}>
        {!hasError ? (
          <VideoView
            player={player}
            style={styles.videoPlayer}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: video.poster }}
            style={styles.videoPlayer}
            contentFit="cover"
            transition={200}
          />
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(10,10,15,0.15)', 'rgba(10,10,15,0.0)', 'rgba(10,10,15,0.75)', 'rgba(10,10,15,0.95)']}
          locations={[0, 0.3, 0.7, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top-left badge */}
        <View style={styles.videoTopBadge}>
          <View style={[styles.videoIconCircle, { backgroundColor: `${video.color}18` }]}>
            <MaterialIcons name={video.icon} size={16} color={video.color} />
          </View>
          <View style={styles.videoLiveDot} />
          <Text style={styles.videoLiveText}>DEMO</Text>
        </View>

        {/* Play indicator (pulsing) */}
        <View style={styles.videoPlayIndicator}>
          <View style={styles.videoPlayCircle}>
            <MaterialIcons name="play-arrow" size={20} color="#FFD700" />
          </View>
        </View>

        {/* Bottom info overlay */}
        <View style={styles.videoBottomInfo}>
          <Text style={styles.videoCardTitle}>{video.title}</Text>
          <Text style={styles.videoCardSubtitle} numberOfLines={2}>{video.subtitle}</Text>
        </View>
      </View>

      {/* Stats row below video */}
      <View style={styles.videoStatsRow}>
        {video.stats.map((stat, i) => (
          <View key={stat.label} style={[
            styles.videoStatItem,
            i < video.stats.length - 1 && styles.videoStatDivider,
          ]}>
            <Text style={[styles.videoStatValue, { color: video.color }]}>{stat.value}</Text>
            <Text style={styles.videoStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Video Showcase Section ───
function VideoShowcaseSection({ screenW }: { screenW: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = Math.max(1, screenW * 0.78);
  const cardGap = 14;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (cardWidth + cardGap));
    const clamped = Math.max(0, Math.min(index, SHOWCASE_VIDEOS.length - 1));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  }, [activeIndex, cardWidth]);

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.videoSection}>
      <View style={styles.videoSectionHeader}>
        <Text style={styles.sectionLabel}>APP WALKTHROUGH</Text>
        <Text style={styles.sectionTitle}>See It in Action</Text>
        <Text style={styles.videoSectionDesc}>Auto-playing demo of the core FoodGenie experience</Text>
      </View>

      {/* Horizontal video carousel */}
      <ScrollView
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + cardGap}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: cardGap,
          paddingRight: screenW - cardWidth - 24 + cardGap,
        }}
      >
        {SHOWCASE_VIDEOS.map((video, i) => (
          <VideoShowcaseCard
            key={video.id}
            video={video}
            index={i}
            cardWidth={cardWidth}
          />
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.videoDotRow}>
        {SHOWCASE_VIDEOS.map((v, i) => (
          <View
            key={v.id}
            style={[
              styles.videoDot,
              i === activeIndex && styles.videoDotActive,
              i === activeIndex && { backgroundColor: SHOWCASE_VIDEOS[i].color },
            ]}
          />
        ))}
      </View>

      {/* Flow step labels */}
      <View style={styles.videoFlowRow}>
        {SHOWCASE_VIDEOS.map((v, i) => (
          <View key={v.id} style={styles.videoFlowItem}>
            <View style={[
              styles.videoFlowStep,
              i === activeIndex && { backgroundColor: `${v.color}20`, borderColor: `${v.color}35` },
            ]}>
              <Text style={[
                styles.videoFlowNumber,
                i === activeIndex && { color: v.color },
              ]}>{i + 1}</Text>
            </View>
            <Text style={[
              styles.videoFlowLabel,
              i === activeIndex && { color: '#FFF' },
            ]}>{v.title}</Text>
            {i < SHOWCASE_VIDEOS.length - 1 ? (
              <View style={styles.videoFlowConnector}>
                <MaterialIcons name="chevron-right" size={14} color="#3F3F46" />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Animated Counter ───
function AnimatedCounter({ value, delay = 0 }: { value: string; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.metricValue, style]}>{value}</Animated.Text>
  );
}

// ─── Pulsing Gold Ring ───
function PulsingRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ), -1, false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 }),
      ), -1, false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulsingRing, style]} />;
}

// ─── Story Avatar ───
function StoryAvatar({ uri, index }: { uri: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInRight.delay(300 + index * 100).duration(400)}
      style={styles.storyAvatarWrap}
    >
      <LinearGradient colors={['#D4AF37', '#FFD700', '#D4AF37']} style={styles.storyAvatarRing}>
        <Image source={{ uri }} style={styles.storyAvatarImg} contentFit="cover" transition={200} />
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Feed Preview Card ───
function FeedPreviewCard({ uri, index }: { uri: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 80).duration(400)}
      style={styles.feedPreviewCard}
    >
      <Image source={{ uri }} style={styles.feedPreviewImage} contentFit="cover" transition={200} />
      <LinearGradient
        colors={['transparent', 'rgba(10,10,15,0.85)']}
        style={styles.feedPreviewOverlay}
      >
        <View style={styles.feedPreviewActions}>
          <MaterialIcons name="favorite" size={16} color="#FFD700" />
          <Text style={styles.feedPreviewCount}>{Math.floor(Math.random() * 500) + 50}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Feature Section ───
function FeatureSection({ feature, index, screenW }: { feature: typeof FEATURES[0]; index: number; screenW: number }) {
  const isEven = index % 2 === 0;
  const imageIndex = index * 2;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={styles.featureSection}
    >
      {/* Feature header */}
      <View style={styles.featureHeader}>
        <View style={[styles.featureIconWrap, { backgroundColor: `${feature.color}12` }]}>
          <MaterialIcons name={feature.icon as any} size={28} color={feature.color} />
        </View>
        <View style={styles.featureTitleBlock}>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
        </View>
      </View>

      {/* Feature images — 2-image grid */}
      <View style={styles.featureImageGrid}>
        <View style={styles.featureImageLarge}>
          <Image
            source={{ uri: FOOD_IMAGES[imageIndex % FOOD_IMAGES.length] }}
            style={styles.featureImg}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.70)']}
            style={styles.featureImgOverlay}
          >
            <View style={styles.featureImgBadge}>
              <MaterialIcons name={feature.icon as any} size={14} color="#FFD700" />
            </View>
          </LinearGradient>
        </View>
        <View style={styles.featureImageSmall}>
          <Image
            source={{ uri: FOOD_IMAGES[(imageIndex + 1) % FOOD_IMAGES.length] }}
            style={styles.featureImg}
            contentFit="cover"
            transition={300}
          />
        </View>
      </View>

      {/* Description */}
      <Text style={styles.featureDesc}>{feature.description}</Text>

      {/* Highlights */}
      <View style={styles.highlightsGrid}>
        {feature.highlights.map((h, i) => (
          <View key={i} style={styles.highlightItem}>
            <View style={[styles.highlightDot, { backgroundColor: feature.color }]} />
            <Text style={styles.highlightText}>{h}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function InvestorDeckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screenW, setScreenW] = useState(getSafeWidth);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const html = generateInvestorDeckHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'FoodGenie Investor Deck',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (e: any) {
      console.log('PDF export error:', e);
    } finally {
      setExporting(false);
    }
  }, []);

  useEffect(() => {
    const update = () => {
      const w = Dimensions.get('window').width;
      if (w > 0) setScreenW(w);
    };
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  const gridSize = (screenW - 48 - 8) / 3;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Investor Deck</Text>
          <Pressable
            style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.7 }, exporting && { opacity: 0.5 }]}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <View style={styles.exportBtnInner}>
                <Text style={styles.exportBtnText}>...</Text>
              </View>
            ) : (
              <View style={styles.exportBtnInner}>
                <MaterialIcons name="file-download" size={18} color="#D4AF37" />
                <Text style={styles.exportBtnText}>PDF</Text>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        >
          {/* ═══════════════════════════════════════════
              HERO SECTION
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.heroSection}>
            <PulsingRing />
            <View style={styles.heroLogoWrap}>
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.heroLogoRing}>
                <View style={styles.heroLogoInner}>
                  <Image
                    source={require('../assets/images/icon.png')}
                    style={styles.heroLogoImg}
                    contentFit="contain"
                  />
                </View>
              </LinearGradient>
            </View>

            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.heroAppName}>
              FoodGenie
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(300).duration(500)} style={styles.heroTagline}>
              Share What You Eat
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.heroDesc}>
              The social-first food platform where creators share meals, build audiences, and monetize their food journey
            </Animated.Text>

            {/* Story avatars row */}
            <View style={styles.storyRow}>
              {CREATOR_AVATARS.map((uri, i) => (
                <StoryAvatar key={i} uri={uri} index={i} />
              ))}
              <Animated.View entering={FadeInRight.delay(800).duration(300)} style={styles.storyMoreBadge}>
                <Text style={styles.storyMoreText}>2.5K+</Text>
              </Animated.View>
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════
              KEY METRICS
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.metricsSection}>
            <Text style={styles.sectionLabel}>KEY METRICS</Text>
            <View style={styles.metricsGrid}>
              {KEY_METRICS.map((metric, i) => (
                <View key={metric.label} style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: `${metric.color}12` }]}>
                    <MaterialIcons name={metric.icon as any} size={20} color={metric.color} />
                  </View>
                  <AnimatedCounter value={metric.value} delay={400 + i * 150} />
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════
              FEED PREVIEW — Instagram-style grid
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.feedSection}>
            <Text style={styles.sectionLabel}>THE FEED</Text>
            <Text style={styles.sectionTitle}>Your Food Journey, Beautifully Captured</Text>

            {/* Mock phone frame with feed */}
            <View style={styles.phoneFrame}>
              <View style={styles.phoneNotch} />
              {/* App header mock */}
              <View style={styles.phoneFeedHeader}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.phoneLogo}
                  contentFit="contain"
                />
                <Text style={styles.phoneAppTitle}>FoodGenie</Text>
                <View style={{ flex: 1 }} />
                <MaterialIcons name="favorite-border" size={20} color="#FFF" />
                <MaterialIcons name="send" size={20} color="#FFF" style={{ marginLeft: 14 }} />
              </View>

              {/* Story bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phoneStoryBar}>
                {CREATOR_AVATARS.map((uri, i) => (
                  <View key={i} style={styles.phoneStoryItem}>
                    <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.phoneStoryRing}>
                      <Image source={{ uri }} style={styles.phoneStoryImg} contentFit="cover" />
                    </LinearGradient>
                    <Text style={styles.phoneStoryName}>chef_{i + 1}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Feed image */}
              <View style={styles.phoneFeedPost}>
                <Image
                  source={{ uri: FOOD_IMAGES[0] }}
                  style={styles.phoneFeedImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.85)']}
                  style={styles.phoneFeedOverlay}
                >
                  <Text style={styles.phoneFeedUsername}>@home_chef_priya</Text>
                  <Text style={styles.phoneFeedDish}>Tandoori Chicken</Text>
                  <View style={styles.phoneFeedTags}>
                    <View style={styles.phoneFeedTag}>
                      <Text style={styles.phoneFeedTagText}>🍽 Dinner</Text>
                    </View>
                    <View style={styles.phoneFeedTag}>
                      <Text style={styles.phoneFeedTagText}>🏠 Home</Text>
                    </View>
                  </View>
                </LinearGradient>
                {/* Right action bar */}
                <View style={styles.phoneFeedActions}>
                  <MaterialIcons name="favorite" size={22} color="#FFD700" />
                  <Text style={styles.phoneFeedActionCount}>342</Text>
                  <View style={{ height: 14 }} />
                  <MaterialIcons name="chat-bubble-outline" size={20} color="#FFF" />
                  <Text style={styles.phoneFeedActionCount}>28</Text>
                  <View style={{ height: 14 }} />
                  <MaterialIcons name="send" size={20} color="#FFF" />
                  <View style={{ height: 14 }} />
                  <MaterialIcons name="bookmark-border" size={22} color="#FFF" />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════
              VIDEO SHOWCASE — App Walkthrough
              ═══════════════════════════════════════════ */}
          <VideoShowcaseSection screenW={screenW} />

          {/* ═══════════════════════════════════════════
              FEATURE DEEP DIVES
              ═══════════════════════════════════════════ */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 24 }]}>CORE FEATURES</Text>
            {FEATURES.map((feature, i) => (
              <FeatureSection key={feature.id} feature={feature} index={i} screenW={screenW} />
            ))}
          </View>

          {/* ═══════════════════════════════════════════
              CREATOR ECONOMY SHOWCASE
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.creatorShowcase}>
            <Text style={styles.sectionLabel}>CREATOR ECONOMY</Text>
            <Text style={styles.sectionTitle}>Become a Creator</Text>
            <Text style={styles.sectionDesc}>3-tier system that rewards consistency and quality</Text>

            {/* Tier cards */}
            <View style={styles.tierCards}>
              {[
                { name: 'Home Cook', emoji: '🏠', color: '#4ADE80', req: '5 posts', followers: '0-100' },
                { name: 'Home Master Chef', emoji: '👨‍🍳', color: '#FFD700', req: '50 posts + 7-day streak', followers: '100-1K' },
                { name: 'Celebrity Chef', emoji: '⭐', color: '#FF6B6B', req: '200 posts + verified', followers: '1K+' },
              ].map((tier, i) => (
                <Animated.View
                  key={tier.name}
                  entering={FadeInRight.delay(i * 120).duration(400)}
                  style={[styles.tierCard, { borderColor: `${tier.color}25` }]}
                >
                  <View style={[styles.tierEmojiWrap, { backgroundColor: `${tier.color}12` }]}>
                    <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                  </View>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  <Text style={styles.tierReq}>{tier.req}</Text>
                  <View style={styles.tierFollowers}>
                    <MaterialIcons name="people" size={12} color="#6B7280" />
                    <Text style={styles.tierFollowersText}>{tier.followers}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Creator stats preview */}
            <View style={styles.creatorStatsPreview}>
              <View style={styles.creatorStatRow}>
                <Text style={styles.creatorStatLabel}>Active Creators</Text>
                <Text style={styles.creatorStatValue}>2,547</Text>
              </View>
              <View style={styles.creatorStatDivider} />
              <View style={styles.creatorStatRow}>
                <Text style={styles.creatorStatLabel}>Shows Created</Text>
                <Text style={styles.creatorStatValue}>1,230</Text>
              </View>
              <View style={styles.creatorStatDivider} />
              <View style={styles.creatorStatRow}>
                <Text style={styles.creatorStatLabel}>Live Sessions / Week</Text>
                <Text style={styles.creatorStatValue}>340</Text>
              </View>
              <View style={styles.creatorStatDivider} />
              <View style={styles.creatorStatRow}>
                <Text style={styles.creatorStatLabel}>Avg. Badges Earned</Text>
                <Text style={styles.creatorStatValue}>4.2</Text>
              </View>
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════
              FOOD GRID — Visual showcase
              ═══════════════════════════════════════════ */}
          <View style={styles.foodGridSection}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 24 }]}>CONTENT QUALITY</Text>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 24 }]}>Beautiful Food Content</Text>
            <View style={styles.foodGrid}>
              {FOOD_IMAGES.map((uri, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 60).duration(350)}
                  style={[styles.foodGridItem, { width: gridSize, height: gridSize }]}
                >
                  <Image source={{ uri }} style={styles.foodGridImg} contentFit="cover" transition={200} />
                  {i === 0 ? (
                    <View style={styles.foodGridFeatured}>
                      <MaterialIcons name="star" size={10} color="#FFD700" />
                      <Text style={styles.foodGridFeaturedText}>Featured</Text>
                    </View>
                  ) : null}
                </Animated.View>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              MONETIZATION
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.monetizationSection}>
            <Text style={styles.sectionLabel}>REVENUE MODEL</Text>
            <Text style={styles.sectionTitle}>Monetization Strategy</Text>

            {MONETIZATION.map((item, i) => (
              <Animated.View
                key={item.title}
                entering={FadeInDown.delay(i * 80).duration(400)}
                style={styles.monetizationCard}
              >
                <View style={styles.monetizationLeft}>
                  <View style={styles.monetizationIconWrap}>
                    <MaterialIcons name={item.icon as any} size={22} color="#D4AF37" />
                  </View>
                  <View style={styles.monetizationInfo}>
                    <Text style={styles.monetizationTitle}>{item.title}</Text>
                    <Text style={styles.monetizationDesc}>{item.desc}</Text>
                  </View>
                </View>
                <View style={styles.monetizationValueWrap}>
                  <Text style={styles.monetizationValue}>{item.value}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ═══════════════════════════════════════════
              TECH STACK
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.techSection}>
            <Text style={styles.sectionLabel}>TECHNOLOGY</Text>
            <Text style={styles.sectionTitle}>Built to Scale</Text>

            <View style={styles.techGrid}>
              {TECH_STACK.map((tech, i) => (
                <Animated.View
                  key={tech.name}
                  entering={FadeInDown.delay(i * 60).duration(350)}
                  style={styles.techCard}
                >
                  <View style={styles.techIconWrap}>
                    <MaterialIcons name={tech.icon as any} size={22} color="#D4AF37" />
                  </View>
                  <Text style={styles.techName}>{tech.name}</Text>
                  <Text style={styles.techDesc}>{tech.desc}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════
              TRACTION & GROWTH
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.growthSection}>
            <Text style={styles.sectionLabel}>TRACTION</Text>
            <Text style={styles.sectionTitle}>Growth Trajectory</Text>

            {/* Growth bars */}
            <View style={styles.growthBars}>
              {[
                { month: 'Month 1', value: 15, label: '5K users' },
                { month: 'Month 2', value: 30, label: '12K users' },
                { month: 'Month 3', value: 50, label: '25K users' },
                { month: 'Month 4', value: 70, label: '38K users' },
                { month: 'Month 5', value: 85, label: '45K users' },
                { month: 'Month 6', value: 100, label: '50K+ users' },
              ].map((bar, i) => (
                <Animated.View key={bar.month} entering={FadeInUp.delay(i * 80).duration(400)} style={styles.growthBarItem}>
                  <Text style={styles.growthBarLabel}>{bar.label}</Text>
                  <View style={styles.growthBarBg}>
                    <LinearGradient
                      colors={['#D4AF37', '#FFD700']}
                      style={[styles.growthBarFill, { height: `${bar.value}%` }]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                    />
                  </View>
                  <Text style={styles.growthBarMonth}>{bar.month.replace('Month ', 'M')}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* ═══════════════════════════════════════════
              COMPETITIVE ADVANTAGE
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.advantageSection}>
            <Text style={styles.sectionLabel}>WHY FOODGENIE</Text>
            <Text style={styles.sectionTitle}>Competitive Advantage</Text>

            {[
              { title: 'Creator-First Platform', desc: 'Unlike food delivery apps, we put creators at the center with monetization tools', icon: 'person-pin' },
              { title: 'Vertical Social Feed', desc: 'TikTok-style engagement for food content with 3x higher retention vs grid feeds', icon: 'swap-vert' },
              { title: 'AI-Powered Recommendations', desc: 'Personalized meal suggestions based on dietary preferences and behavior analysis', icon: 'psychology' },
              { title: 'Chef-Verified Trust', desc: 'Only verified kitchens and chef-audited restaurants for quality assurance', icon: 'verified-user' },
            ].map((adv, i) => (
              <Animated.View
                key={adv.title}
                entering={FadeInDown.delay(i * 80).duration(400)}
                style={styles.advantageCard}
              >
                <View style={styles.advantageIconWrap}>
                  <MaterialIcons name={adv.icon as any} size={24} color="#FFD700" />
                </View>
                <View style={styles.advantageContent}>
                  <Text style={styles.advantageTitle}>{adv.title}</Text>
                  <Text style={styles.advantageDesc}>{adv.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ═══════════════════════════════════════════
              CTA FOOTER
              ═══════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.ctaFooter}>
            <LinearGradient
              colors={['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)']}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaLogoWrap}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.ctaLogo}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.ctaTitle}>FoodGenie</Text>
              <Text style={styles.ctaTagline}>Share What You Eat</Text>
              <Text style={styles.ctaDesc}>
                Building the largest food creator community in India
              </Text>

              <View style={styles.ctaStats}>
                <View style={styles.ctaStatItem}>
                  <Text style={styles.ctaStatValue}>50K+</Text>
                  <Text style={styles.ctaStatLabel}>Users</Text>
                </View>
                <View style={styles.ctaStatDivider} />
                <View style={styles.ctaStatItem}>
                  <Text style={styles.ctaStatValue}>2.5K</Text>
                  <Text style={styles.ctaStatLabel}>Creators</Text>
                </View>
                <View style={styles.ctaStatDivider} />
                <View style={styles.ctaStatItem}>
                  <Text style={styles.ctaStatValue}>12K</Text>
                  <Text style={styles.ctaStatLabel}>Posts/Day</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)'); }}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.ctaButtonInner}>
                  <MaterialIcons name="play-arrow" size={22} color="#0A0A0F" />
                  <Text style={styles.ctaButtonText}>Experience the App</Text>
                </LinearGradient>
              </Pressable>

              <Text style={styles.ctaContact}>contact@foodgenie.in</Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.2 },
  exportBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  exportBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
  },

  // ═══ HERO ═══
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    position: 'relative',
  },
  pulsingRing: {
    position: 'absolute',
    top: 20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  heroLogoWrap: { marginBottom: 20 },
  heroLogoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.goldGlow,
  },
  heroLogoInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  heroLogoImg: { width: 60, height: 60 },
  heroAppName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: -1,
    textShadowColor: 'rgba(212,175,55,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  heroDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 320,
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 4,
  },
  storyAvatarWrap: {},
  storyAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyMoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
    marginLeft: 6,
  },
  storyMoreText: { fontSize: 13, fontWeight: '800', color: '#D4AF37' },

  // ═══ METRICS ═══
  metricsSection: { paddingHorizontal: 24, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  metricLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  // ═══ FEED PREVIEW ═══
  feedSection: { paddingHorizontal: 24, paddingBottom: 36 },
  phoneFrame: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.12)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  phoneNotch: {
    width: 120,
    height: 28,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#111116',
    alignSelf: 'center',
  },
  phoneFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  phoneLogo: { width: 24, height: 24, borderRadius: 6 },
  phoneAppTitle: { fontSize: 16, fontWeight: '800', color: '#FFD700' },
  phoneStoryBar: {
    paddingHorizontal: 12,
    gap: 12,
    paddingBottom: 12,
  },
  phoneStoryItem: { alignItems: 'center', gap: 4 },
  phoneStoryRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneStoryImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  phoneStoryName: { fontSize: 9, fontWeight: '600', color: '#6B7280' },
  phoneFeedPost: {
    height: 340,
    position: 'relative',
  },
  phoneFeedImage: {
    width: '100%',
    height: '100%',
  },
  phoneFeedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 4,
  },
  phoneFeedUsername: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  phoneFeedDish: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  phoneFeedTags: { flexDirection: 'row', gap: 6, marginTop: 4 },
  phoneFeedTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  phoneFeedTagText: { fontSize: 11, fontWeight: '600', color: '#D4AF37' },
  phoneFeedActions: {
    position: 'absolute',
    right: 12,
    bottom: 40,
    alignItems: 'center',
    gap: 4,
  },
  phoneFeedActionCount: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // ═══ FEATURES ═══
  featuresContainer: { paddingBottom: 16 },
  featureSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  featureTitleBlock: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  featureSubtitle: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  featureImageGrid: {
    flexDirection: 'row',
    gap: 8,
    height: 180,
    marginBottom: 16,
  },
  featureImageLarge: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featureImageSmall: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureImg: { width: '100%', height: '100%' },
  featureImgOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingLeft: 12,
    paddingBottom: 10,
  },
  featureImgBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(10,10,15,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.20)',
  },
  featureDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 14,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  highlightDot: { width: 6, height: 6, borderRadius: 3 },
  highlightText: { fontSize: 12, fontWeight: '600', color: '#1A1A2E' },

  // ═══ CREATOR SHOWCASE ═══
  creatorShowcase: { paddingHorizontal: 24, paddingVertical: 32 },
  tierCards: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  tierCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  tierEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierEmoji: { fontSize: 22 },
  tierName: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  tierReq: { fontSize: 10, fontWeight: '500', color: '#6B7280', textAlign: 'center' },
  tierFollowers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tierFollowersText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },

  creatorStatsPreview: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  creatorStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  creatorStatLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  creatorStatValue: { fontSize: 16, fontWeight: '800', color: '#FFD700' },
  creatorStatDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)' },

  // ═══ FOOD GRID ═══
  foodGridSection: { paddingBottom: 32 },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 24,
    marginTop: 14,
  },
  foodGridItem: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  foodGridImg: { width: '100%', height: '100%' },
  foodGridFeatured: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(10,10,15,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.20)',
  },
  foodGridFeaturedText: { fontSize: 9, fontWeight: '700', color: '#FFD700' },

  // ═══ MONETIZATION ═══
  monetizationSection: { paddingHorizontal: 24, paddingBottom: 32 },
  monetizationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  monetizationLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  monetizationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monetizationInfo: { flex: 1, gap: 2 },
  monetizationTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  monetizationDesc: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  monetizationValueWrap: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  monetizationValue: { fontSize: 16, fontWeight: '900', color: '#FFD700' },

  // ═══ TECH ═══
  techSection: { paddingHorizontal: 24, paddingBottom: 32 },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  techIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  techDesc: { fontSize: 11, fontWeight: '500', color: '#6B7280' },

  // ═══ GROWTH ═══
  growthSection: { paddingHorizontal: 24, paddingBottom: 36 },
  growthBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    marginTop: 16,
    gap: 8,
  },
  growthBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  growthBarLabel: { fontSize: 9, fontWeight: '700', color: '#D4AF37', textAlign: 'center' },
  growthBarBg: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F4F4F8',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  growthBarFill: { width: '100%', borderRadius: 8 },
  growthBarMonth: { fontSize: 10, fontWeight: '600', color: '#6B7280' },

  // ═══ ADVANTAGE ═══
  advantageSection: { paddingHorizontal: 24, paddingBottom: 32 },
  advantageCard: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  advantageIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  advantageContent: { flex: 1, gap: 4 },
  advantageTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  advantageDesc: { fontSize: 13, fontWeight: '500', color: '#6B7280', lineHeight: 19 },

  // ═══ CTA FOOTER ═══
  ctaFooter: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  ctaGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  ctaLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.20)',
    marginBottom: 8,
  },
  ctaLogo: { width: 48, height: 48 },
  ctaTitle: { fontSize: 32, fontWeight: '900', color: '#FFD700', letterSpacing: -0.5 },
  ctaTagline: { fontSize: 16, fontWeight: '600', color: '#D4AF37' },
  ctaDesc: { fontSize: 14, fontWeight: '500', color: '#6B7280', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  ctaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  ctaStatItem: { alignItems: 'center', gap: 2 },
  ctaStatValue: { fontSize: 22, fontWeight: '900', color: '#1A1A2E' },
  ctaStatLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  ctaStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.08)' },
  ctaButton: { borderRadius: 20, overflow: 'hidden' },
  ctaButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 20,
  },
  ctaButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  ctaContact: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 16 },

  // ═══ VIDEO SHOWCASE ═══
  videoSection: { paddingBottom: 32 },
  videoSectionHeader: { paddingHorizontal: 24, marginBottom: 18 },
  videoSectionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
  videoCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  videoPlayerWrap: {
    height: 320,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoTopBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,10,15,0.70)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  videoIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  videoLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 1,
  },
  videoPlayIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
  },
  videoPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,10,15,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.30)',
  },
  videoBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 24,
    gap: 4,
  },
  videoCardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  videoCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 18,
  },
  videoStatsRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  videoStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  videoStatDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  videoStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  videoStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  videoDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  videoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  videoDotActive: {
    width: 24,
    borderRadius: 4,
  },
  videoFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    gap: 4,
  },
  videoFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoFlowStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  videoFlowNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
  },
  videoFlowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  videoFlowConnector: {
    marginHorizontal: 2,
  },

  // ─── Feed Preview Grid (unused but kept for potential) ───
  feedPreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  feedPreviewImage: {
    width: '100%',
    height: '100%',
  },
  feedPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  feedPreviewActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedPreviewCount: { fontSize: 10, fontWeight: '700', color: '#FFF' },
});
