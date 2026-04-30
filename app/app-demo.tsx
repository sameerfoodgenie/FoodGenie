import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';
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
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Demo Steps ──
interface DemoStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  gradient: [string, string];
  features: string[];
  stats?: { label: string; value: string }[];
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'feed',
    title: 'Discover Food',
    subtitle: 'TikTok-style Feed',
    description: 'Swipe through mouthwatering food cards. React with emotions, save favorites, and discover new dishes daily.',
    emoji: '🍽️',
    gradient: ['#FF6B6B', '#FF8E53'],
    features: ['Vertical swipe feed', 'Emoji reactions (Craving, Must Try, Loved)', 'Double-tap to react', 'Creator profiles & follow'],
    stats: [
      { label: 'Food Cards', value: '500+' },
      { label: 'Reactions/Day', value: '12K' },
      { label: 'Creators', value: '150+' },
    ],
  },
  {
    id: 'ai-meal',
    title: 'AI Meal Planner',
    subtitle: 'Powered by Gemini AI',
    description: 'Get personalized daily, weekly, and monthly meal plans with nutrition tracking and calorie goals.',
    emoji: '🤖',
    gradient: ['#818CF8', '#6366F1'],
    features: ['Daily meal suggestions', 'Weekly & monthly plans', 'Nutrition rings & macros', 'ChatGPT-style meal planning'],
    stats: [
      { label: 'Plans Generated', value: '8K+' },
      { label: 'Accuracy', value: '94%' },
      { label: 'Cuisines', value: '25+' },
    ],
  },
  {
    id: 'cook',
    title: 'Book a Cook',
    subtitle: 'Expert Home Chefs',
    description: 'Hire verified home cooks for daily, weekly, or monthly plans. Video reviews, calendar booking, and direct chat.',
    emoji: '👨‍🍳',
    gradient: ['#D4AF37', '#FFD700'],
    features: ['Verified cook profiles', 'Video customer reviews', 'Weekly calendar booking', 'Daily/Weekly/Monthly plans'],
    stats: [
      { label: 'Cooks', value: '50+' },
      { label: 'Avg Rating', value: '4.8' },
      { label: 'Bookings', value: '2K+' },
    ],
  },
  {
    id: 'coins',
    title: 'Earn & Reward',
    subtitle: 'Gamified Engagement',
    description: 'Earn Genie Coins for every action — posting, liking, sharing, booking cooks, and generating meal plans.',
    emoji: '🪙',
    gradient: ['#4ADE80', '#22C55E'],
    features: ['Post food +20 coins', 'Like & share +1-10 coins', 'Book a cook +15 coins', 'Daily login streaks'],
    stats: [
      { label: 'Coins Distributed', value: '1.2M' },
      { label: 'Active Earners', value: '5K+' },
      { label: 'Redemptions', value: '800+' },
    ],
  },
  {
    id: 'grocery',
    title: 'Smart Grocery',
    subtitle: 'Budget-Optimized Shopping',
    description: 'AI bundles your grocery list by budget. Integrates with Zepto, Blinkit, and Swiggy Instamart for one-tap ordering.',
    emoji: '🛒',
    gradient: ['#F59E0B', '#D97706'],
    features: ['Budget-based bundling', 'Partner app integration', 'Weekly/monthly planning', 'Price comparison'],
    stats: [
      { label: 'Avg Savings', value: '18%' },
      { label: 'Partner Apps', value: '3' },
      { label: 'Lists Created', value: '4K+' },
    ],
  },
];

const AUTO_ADVANCE_MS = 6000;
const PRESENTATION_ADVANCE_MS = 4000;

// ── Animated Phone Mockup ──
function PhoneMockup({ step, isActive }: { step: DemoStep; isActive: boolean }) {
  const cardY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isActive) {
      cardY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500 }),
          withTiming(-40, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        ),
        -1,
        false,
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(cardY);
      cancelAnimation(pulseScale);
      cancelAnimation(dotOpacity);
      cardY.value = 0;
      pulseScale.value = 1;
      dotOpacity.value = 0.3;
    }
  }, [isActive]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const dotAnimStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={mock.container}>
      <View style={mock.phone}>
        <LinearGradient
          colors={[step.gradient[0] + '20', step.gradient[1] + '10']}
          style={mock.phoneScreen}
        >
          <View style={mock.notch} />
          <Animated.View style={[mock.cardStack, cardAnimStyle]}>
            <Animated.View style={[mock.emojiCircle, pulseAnimStyle, { backgroundColor: step.gradient[0] + '25' }]}>
              <Text style={mock.emojiText}>{step.emoji}</Text>
            </Animated.View>
            {step.features.slice(0, 3).map((feat, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.delay(300 + i * 150).duration(400)}
                style={[mock.featureLine, { backgroundColor: step.gradient[0] + '12' }]}
              >
                <View style={[mock.featureDot, { backgroundColor: step.gradient[0] }]} />
                <Text style={[mock.featureText, { color: step.gradient[0] }]} numberOfLines={1}>{feat}</Text>
              </Animated.View>
            ))}
          </Animated.View>
          <Animated.View style={[mock.dotsRow, dotAnimStyle]}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[mock.dot, { backgroundColor: step.gradient[0] }]} />
            ))}
          </Animated.View>
        </LinearGradient>
      </View>
      <View style={[mock.glow, { backgroundColor: step.gradient[0], shadowColor: step.gradient[0] }]} />
    </View>
  );
}

// ── Stat Card ──
function StatCard({ label, value, delay, gradient }: { label: string; value: string; delay: number; gradient: [string, string] }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={[stat.card, { borderColor: gradient[0] + '30' }]}>
      <Text style={[stat.value, { color: gradient[0] }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </Animated.View>
  );
}

// ── Export Options Modal ──
function ExportModal({ visible, onClose, onCaptureSlides, onPresentationMode, onShareLink, capturing, capturedCount, colors, isDark }: {
  visible: boolean; onClose: () => void;
  onCaptureSlides: () => void; onPresentationMode: () => void; onShareLink: () => void;
  capturing: boolean; capturedCount: number; colors: any; isDark: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={exp.overlay}>
        <Animated.View entering={FadeInUp.duration(350)} style={[exp.card, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}>
          <View style={exp.header}>
            <Text style={[exp.title, { color: colors.textPrimary }]}>Export Demo</Text>
            <Pressable style={({ pressed }) => [exp.closeBtn, pressed && { opacity: 0.6 }]} onPress={onClose}>
              <MaterialIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[exp.subtitle, { color: colors.textMuted }]}>
            Choose how to export your FoodGenie demo walkthrough
          </Text>

          {/* Option 1: Capture All Slides */}
          <Pressable
            style={({ pressed }) => [exp.optionCard, { backgroundColor: isDark ? 'rgba(129,140,248,0.10)' : 'rgba(129,140,248,0.05)', borderColor: 'rgba(129,140,248,0.25)' }, pressed && { opacity: 0.85 }]}
            onPress={onCaptureSlides}
            disabled={capturing}
          >
            <View style={[exp.optionIcon, { backgroundColor: 'rgba(129,140,248,0.15)' }]}>
              {capturing ? (
                <ActivityIndicator size="small" color="#818CF8" />
              ) : (
                <MaterialIcons name="photo-library" size={26} color="#818CF8" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[exp.optionTitle, { color: colors.textPrimary }]}>
                {capturing ? `Capturing... (${capturedCount}/${DEMO_STEPS.length})` : 'Capture All Slides'}
              </Text>
              <Text style={[exp.optionDesc, { color: colors.textMuted }]}>
                Save each feature slide as a high-quality PNG image for pitch decks
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>

          {/* Option 2: Presentation Mode */}
          <Pressable
            style={({ pressed }) => [exp.optionCard, { backgroundColor: isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.25)' }, pressed && { opacity: 0.85 }]}
            onPress={onPresentationMode}
          >
            <View style={[exp.optionIcon, { backgroundColor: 'rgba(212,175,55,0.15)' }]}>
              <MaterialIcons name="slideshow" size={26} color="#D4AF37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[exp.optionTitle, { color: colors.textPrimary }]}>Presentation Mode</Text>
              <Text style={[exp.optionDesc, { color: colors.textMuted }]}>
                Full-screen auto-play with 3s countdown — use device screen recorder to capture MP4
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>

          {/* Option 3: Share Demo Link */}
          <Pressable
            style={({ pressed }) => [exp.optionCard, { backgroundColor: isDark ? 'rgba(74,222,128,0.10)' : 'rgba(74,222,128,0.05)', borderColor: 'rgba(74,222,128,0.25)' }, pressed && { opacity: 0.85 }]}
            onPress={onShareLink}
          >
            <View style={[exp.optionIcon, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
              <MaterialIcons name="share" size={26} color="#4ADE80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[exp.optionTitle, { color: colors.textPrimary }]}>Share Demo Info</Text>
              <Text style={[exp.optionDesc, { color: colors.textMuted }]}>
                Share feature summary text for investors and social media
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>

          {/* Pro tip */}
          <View style={[exp.tipCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
            <MaterialIcons name="lightbulb-outline" size={18} color="#D4AF37" />
            <Text style={[exp.tipText, { color: colors.textSecondary }]}>
              Tip: For best MP4 quality, use iOS Control Center or Android Quick Settings to start screen recording before entering Presentation Mode.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Presentation Mode Overlay (full screen, no chrome) ──
function PresentationMode({ visible, onExit, colors, isDark }: {
  visible: boolean; onExit: () => void; colors: any; isDark: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [finished, setFinished] = useState(false);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      setCountdown(3);
      setStarted(false);
      setCurrentSlide(0);
      setFinished(false);
      return;
    }

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [visible]);

  // Auto-advance slides
  useEffect(() => {
    if (!started || finished) return;

    progressWidth.value = 0;
    progressWidth.value = withTiming(1, { duration: PRESENTATION_ADVANCE_MS, easing: Easing.linear });

    const timer = setTimeout(() => {
      if (currentSlide >= DEMO_STEPS.length - 1) {
        setFinished(true);
      } else {
        setCurrentSlide(prev => prev + 1);
      }
    }, PRESENTATION_ADVANCE_MS);

    return () => { clearTimeout(timer); cancelAnimation(progressWidth); };
  }, [started, currentSlide, finished]);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  if (!visible) return null;

  const step = DEMO_STEPS[currentSlide];

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onExit}>
      <View style={[pres.container, { backgroundColor: isDark ? '#0A0A12' : '#FAFAFA' }]}>
        {/* Countdown */}
        {!started ? (
          <View style={pres.countdownWrap}>
            <Text style={pres.countdownLabel}>Recording starts in</Text>
            <Animated.Text
              key={countdown}
              entering={FadeIn.duration(200)}
              style={pres.countdownNumber}
            >
              {countdown}
            </Animated.Text>
            <Text style={pres.countdownHint}>Start your screen recorder now</Text>
            <Pressable
              style={({ pressed }) => [pres.skipBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { setCountdown(0); setStarted(true); }}
            >
              <Text style={pres.skipBtnText}>Skip countdown</Text>
            </Pressable>
          </View>
        ) : finished ? (
          // Finished state
          <View style={pres.finishedWrap}>
            <Text style={{ fontSize: 64 }}>✅</Text>
            <Text style={[pres.finishedTitle, { color: colors.textPrimary }]}>Demo Complete!</Text>
            <Text style={[pres.finishedSub, { color: colors.textMuted }]}>
              You can stop screen recording now
            </Text>
            <Pressable
              style={({ pressed }) => [pres.exitBtn, pressed && { opacity: 0.85 }]}
              onPress={onExit}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={pres.exitBtnGrad}>
                <MaterialIcons name="check" size={20} color="#FFF" />
                <Text style={pres.exitBtnText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          // Slide content
          <Animated.View key={step.id} entering={FadeIn.duration(400)} style={pres.slideWrap}>
            {/* Progress bar */}
            <View style={[pres.progressRow, { paddingTop: insets.top + 8 }]}>
              {DEMO_STEPS.map((ds, i) => (
                <View key={ds.id} style={pres.progressSegment}>
                  <View style={[pres.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    {i < currentSlide ? (
                      <View style={[pres.progressFill, { backgroundColor: ds.gradient[0], width: '100%' }]} />
                    ) : i === currentSlide ? (
                      <Animated.View style={[pres.progressFill, { backgroundColor: ds.gradient[0] }, progressAnimStyle]} />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Watermark */}
            <View style={pres.watermark}>
              <Text style={pres.watermarkText}>FoodGenie</Text>
            </View>

            {/* Phone Mockup */}
            <PhoneMockup step={step} isActive={true} />

            {/* Info */}
            <View style={pres.infoSection}>
              <LinearGradient colors={step.gradient} style={pres.badge}>
                <Text style={pres.badgeText}>{step.subtitle}</Text>
              </LinearGradient>

              <Text style={[pres.slideTitle, { color: colors.textPrimary }]}>{step.title}</Text>
              <Text style={[pres.slideDesc, { color: colors.textSecondary }]}>{step.description}</Text>

              {step.stats ? (
                <View style={pres.statsRow}>
                  {step.stats.map((st) => (
                    <View key={st.label} style={[pres.statCard, { borderColor: step.gradient[0] + '30' }]}>
                      <Text style={[pres.statValue, { color: step.gradient[0] }]}>{st.value}</Text>
                      <Text style={pres.statLabel}>{st.label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={pres.featuresWrap}>
                {step.features.map((feat, i) => (
                  <Animated.View key={feat} entering={FadeInDown.delay(200 + i * 100).duration(300)} style={pres.featureRow}>
                    <View style={[pres.featureCheck, { backgroundColor: step.gradient[0] + '18' }]}>
                      <MaterialIcons name="check" size={14} color={step.gradient[0]} />
                    </View>
                    <Text style={[pres.featureText, { color: colors.textSecondary }]}>{feat}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Slide indicator */}
            <View style={[pres.slideIndicator, { paddingBottom: insets.bottom + 16 }]}>
              <View style={pres.dotsRow}>
                {DEMO_STEPS.map((ds, i) => (
                  <View key={ds.id} style={[
                    pres.dot,
                    i === currentSlide && { width: 24, backgroundColor: ds.gradient[0] },
                    i !== currentSlide && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
                  ]} />
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Exit button (always visible) */}
        <Pressable
          style={[pres.exitFloating, { top: insets.top + 8 }]}
          onPress={onExit}
          hitSlop={8}
        >
          <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Capture Success Modal ──
function CaptureSuccessModal({ visible, onClose, count, onSaveAll, onShareAll, saving, colors, isDark }: {
  visible: boolean; onClose: () => void; count: number;
  onSaveAll: () => void; onShareAll: () => void;
  saving: boolean; colors: any; isDark: boolean;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={exp.overlay}>
        <Animated.View entering={FadeInUp.duration(350)} style={[exp.successCard, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}>
          <Text style={{ fontSize: 52, textAlign: 'center' }}>🎉</Text>
          <Text style={[exp.successTitle, { color: colors.textPrimary }]}>
            {count} Slides Captured!
          </Text>
          <Text style={[exp.successDesc, { color: colors.textMuted }]}>
            High-quality PNG images ready for your pitch deck
          </Text>

          <Pressable
            style={({ pressed }) => [exp.successBtn, pressed && { opacity: 0.85 }]}
            onPress={onSaveAll}
            disabled={saving}
          >
            <LinearGradient colors={['#4ADE80', '#22C55E']} style={exp.successBtnGrad}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialIcons name="save-alt" size={20} color="#FFF" />
              )}
              <Text style={exp.successBtnText}>{saving ? 'Saving...' : 'Save to Photos'}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [exp.successBtn, pressed && { opacity: 0.85 }]}
            onPress={onShareAll}
          >
            <LinearGradient colors={['#818CF8', '#6366F1']} style={exp.successBtnGrad}>
              <MaterialIcons name="share" size={20} color="#FFF" />
              <Text style={exp.successBtnText}>Share Slides</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [{ paddingVertical: 12, marginTop: 4 }, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={[{ fontSize: 14, fontWeight: '600', textAlign: 'center' }, { color: colors.textMuted }]}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──
export default function AppDemoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressWidth = useSharedValue(0);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [capturedUris, setCapturedUris] = useState<string[]>([]);
  const [showCaptureSuccess, setShowCaptureSuccess] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);

  // ViewShot ref for capturing the slide content
  const viewShotRef = useRef<any>(null);

  const step = DEMO_STEPS[currentStep];

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying || showExportModal || showPresentation) {
      cancelAnimation(progressWidth);
      return;
    }

    progressWidth.value = 0;
    progressWidth.value = withTiming(1, { duration: AUTO_ADVANCE_MS, easing: Easing.linear });

    timerRef.current = setTimeout(() => {
      goToNext();
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isAutoPlaying, showExportModal, showPresentation]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIdx = (currentStep + 1) % DEMO_STEPS.length;
    setTimeout(() => {
      setCurrentStep(nextIdx);
      setIsTransitioning(false);
    }, 150);
  }, [currentStep, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIdx = currentStep === 0 ? DEMO_STEPS.length - 1 : currentStep - 1;
    setTimeout(() => {
      setCurrentStep(prevIdx);
      setIsTransitioning(false);
    }, 150);
  }, [currentStep, isTransitioning]);

  const goToStep = useCallback((idx: number) => {
    if (idx === currentStep || isTransitioning) return;
    Haptics.selectionAsync();
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setCurrentStep(idx);
      setIsTransitioning(false);
      setTimeout(() => setIsAutoPlaying(true), 2000);
    }, 150);
  }, [currentStep, isTransitioning]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoPlaying(false);
    goToNext();
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, [goToNext]);

  const handlePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAutoPlaying(false);
    goToPrev();
    setTimeout(() => setIsAutoPlaying(true), 3000);
  }, [goToPrev]);

  const toggleAutoPlay = useCallback(() => {
    Haptics.selectionAsync();
    setIsAutoPlaying(prev => !prev);
  }, []);

  // ── Export Handlers ──
  const handleCaptureSlides = useCallback(async () => {
    if (!viewShotRef.current) return;
    setCapturing(true);
    setCapturedCount(0);
    const uris: string[] = [];

    // Pause auto-play during capture
    setIsAutoPlaying(false);

    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setCurrentStep(i);
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        uris.push(uri);
        setCapturedCount(i + 1);
      } catch (e) {
        console.log('Capture error:', e);
      }
    }

    setCapturedUris(uris);
    setCapturing(false);
    setShowExportModal(false);

    if (uris.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCaptureSuccess(true);
    }
  }, []);

  const handleSaveToPhotos = useCallback(async () => {
    if (capturedUris.length === 0) return;
    setSavingPhotos(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setSavingPhotos(false);
        return;
      }

      for (const uri of capturedUris) {
        await MediaLibrary.saveToLibraryAsync(uri);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log('Save error:', e);
    } finally {
      setSavingPhotos(false);
    }
  }, [capturedUris]);

  const handleShareSlides = useCallback(async () => {
    if (capturedUris.length === 0) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && capturedUris[0]) {
        await Sharing.shareAsync(capturedUris[0], {
          mimeType: 'image/png',
          dialogTitle: 'Share FoodGenie Demo Slide',
        });
      }
    } catch (e) {
      console.log('Share error:', e);
    }
  }, [capturedUris]);

  const handlePresentationMode = useCallback(() => {
    setShowExportModal(false);
    setIsAutoPlaying(false);
    setTimeout(() => setShowPresentation(true), 300);
  }, []);

  const handleShareLink = useCallback(async () => {
    try {
      await Share.share({
        message: `🍽️ FoodGenie — The Social Food Platform\n\n` +
          `✅ TikTok-style food feed with emoji reactions\n` +
          `✅ AI Meal Planner (Gemini-powered)\n` +
          `✅ Book verified home cooks\n` +
          `✅ Gamified coin rewards system\n` +
          `✅ Smart grocery budget bundling\n\n` +
          `📊 500+ food cards • 50+ cooks • 8K+ AI plans generated\n\n` +
          `Download FoodGenie and discover your next meal! 🚀`,
      });
    } catch { /* ignore */ }
    setShowExportModal(false);
  }, []);

  const handleExitPresentation = useCallback(() => {
    setShowPresentation(false);
    setIsAutoPlaying(true);
  }, []);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View style={[s.container, { backgroundColor: isDark ? '#0A0A12' : '#FAFAFA' }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.textPrimary }]}>FoodGenie Demo</Text>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>
            {currentStep + 1} of {DEMO_STEPS.length}
          </Text>
        </View>
        <View style={s.headerRight}>
          <Pressable
            style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.7 }]}
            onPress={toggleAutoPlay}
          >
            <MaterialIcons
              name={isAutoPlaying ? 'pause' : 'play-arrow'}
              size={22}
              color={isAutoPlaying ? step.gradient[0] : colors.textMuted}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.exportBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowExportModal(true); }}
          >
            <MaterialIcons name="ios-share" size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressRow}>
        {DEMO_STEPS.map((ds, i) => (
          <Pressable key={ds.id} style={s.progressSegment} onPress={() => goToStep(i)}>
            <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              {i < currentStep ? (
                <View style={[s.progressFill, { backgroundColor: ds.gradient[0], width: '100%' }]} />
              ) : i === currentStep ? (
                <Animated.View style={[s.progressFill, { backgroundColor: ds.gradient[0] }, progressAnimStyle]} />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Content (wrapped in ViewShot for capture) */}
      <ViewShot ref={viewShotRef} style={s.content} options={{ format: 'png', quality: 1 }}>
        <Animated.View
          key={step.id}
          entering={FadeIn.duration(350)}
          style={s.contentInner}
        >
          {/* Phone Mockup */}
          <PhoneMockup step={step} isActive={!isTransitioning} />

          {/* Info section */}
          <View style={s.infoSection}>
            <Animated.View entering={FadeInDown.delay(100).duration(350)} style={s.titleRow}>
              <LinearGradient
                colors={step.gradient}
                style={s.stepBadge}
              >
                <Text style={s.stepBadgeText}>{step.subtitle}</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.delay(200).duration(350)}
              style={[s.title, { color: colors.textPrimary }]}
            >
              {step.title}
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(300).duration(350)}
              style={[s.description, { color: colors.textSecondary }]}
            >
              {step.description}
            </Animated.Text>

            {/* Stats */}
            {step.stats ? (
              <View style={s.statsRow}>
                {step.stats.map((st, i) => (
                  <StatCard key={st.label} label={st.label} value={st.value} delay={400 + i * 100} gradient={step.gradient} />
                ))}
              </View>
            ) : null}

            {/* Features list */}
            <View style={s.featuresWrap}>
              {step.features.map((feat, i) => (
                <Animated.View
                  key={feat}
                  entering={FadeInDown.delay(500 + i * 80).duration(300)}
                  style={s.featureRow}
                >
                  <View style={[s.featureCheck, { backgroundColor: step.gradient[0] + '18' }]}>
                    <MaterialIcons name="check" size={14} color={step.gradient[0]} />
                  </View>
                  <Text style={[s.featureText, { color: colors.textSecondary }]}>{feat}</Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ViewShot>

      {/* Navigation */}
      <View style={[s.navRow, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.7 }]}
          onPress={handlePrev}
        >
          <MaterialIcons name="chevron-left" size={28} color={colors.textMuted} />
        </Pressable>

        {/* Step dots */}
        <View style={s.dotsRow}>
          {DEMO_STEPS.map((ds, i) => (
            <Pressable key={ds.id} onPress={() => goToStep(i)} hitSlop={8}>
              <View style={[
                s.stepDot,
                i === currentStep && { width: 24, backgroundColor: ds.gradient[0] },
                i !== currentStep && { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
              ]} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.7 }]}
          onPress={handleNext}
        >
          <MaterialIcons name="chevron-right" size={28} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Modals */}
      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        onCaptureSlides={handleCaptureSlides}
        onPresentationMode={handlePresentationMode}
        onShareLink={handleShareLink}
        capturing={capturing}
        capturedCount={capturedCount}
        colors={colors}
        isDark={isDark}
      />

      <PresentationMode
        visible={showPresentation}
        onExit={handleExitPresentation}
        colors={colors}
        isDark={isDark}
      />

      <CaptureSuccessModal
        visible={showCaptureSuccess}
        onClose={() => setShowCaptureSuccess(false)}
        count={capturedUris.length}
        onSaveAll={handleSaveToPhotos}
        onShareAll={handleShareSlides}
        saving={savingPhotos}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

// ── Styles ──
const mock = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_H * 0.32,
    position: 'relative',
  },
  phone: {
    width: 160,
    height: SCREEN_H * 0.28,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(100,100,100,0.25)',
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  phoneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  notch: {
    position: 'absolute',
    top: 6,
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignSelf: 'center',
  },
  cardStack: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emojiText: {
    fontSize: 30,
  },
  featureLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    width: '100%',
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 4,
    alignSelf: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.08,
    bottom: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 0,
  },
});

const stat = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(150,150,150,0.80)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

const exp = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '900' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(128,128,128,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { fontSize: 14, fontWeight: '500', lineHeight: 20, marginBottom: 4 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  optionIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  optionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  optionDesc: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 14, marginTop: 4,
  },
  tipText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },
  // Success modal
  successCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 28,
    gap: 12,
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  successTitle: { fontSize: 22, fontWeight: '900', marginTop: 8 },
  successDesc: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 8 },
  successBtn: { width: '100%' },
  successBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  successBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});

const pres = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  countdownWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  countdownLabel: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.60)' },
  countdownNumber: { fontSize: 96, fontWeight: '900', color: '#D4AF37' },
  countdownHint: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.40)', marginTop: 8 },
  skipBtn: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipBtnText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.60)' },
  finishedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  finishedTitle: { fontSize: 28, fontWeight: '900', marginTop: 8 },
  finishedSub: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  exitBtn: { width: '100%', marginTop: 20 },
  exitBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  exitBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  exitFloating: {
    position: 'absolute', right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  slideWrap: { flex: 1 },
  progressRow: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: 16, marginBottom: 8,
  },
  progressSegment: { flex: 1, height: 20, justifyContent: 'center' },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  watermark: {
    alignItems: 'center', paddingVertical: 4,
  },
  watermarkText: { fontSize: 12, fontWeight: '900', color: 'rgba(212,175,55,0.40)', letterSpacing: 1 },
  infoSection: { flex: 1, paddingHorizontal: 24, gap: 10 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  slideTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  slideDesc: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 3,
    paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(150,150,150,0.80)', textTransform: 'uppercase', letterSpacing: 0.3 },
  featuresWrap: { gap: 8, marginTop: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 13, fontWeight: '600', flex: 1 },
  slideIndicator: { alignItems: 'center', paddingTop: 12 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 20,
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
  content: {
    flex: 1,
  },
  contentInner: {
    flex: 1,
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  featuresWrap: {
    gap: 8,
    marginTop: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
