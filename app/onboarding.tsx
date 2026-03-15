import React, { useState, useEffect } from 'react';
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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeInUp,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { CustomSlider, AnimatedDietIcon } from '../components';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';

function getSafeWidth() {
  try {
    const w = Dimensions.get('window').width;
    return w > 0 ? w : 375;
  } catch {
    return 375;
  }
}

type OnboardingStep = 'welcome' | 'diet' | 'budget' | 'spice';

const GENIE_MESSAGES: Record<OnboardingStep, string> = {
  welcome: "Hello! I am your FoodGenie chef. Let me learn your taste in 30 seconds!",
  diet: "What is your diet preference? I will respect it in every recommendation.",
  budget: "Great! What is your comfortable meal budget range?",
  spice: "Almost done! How do you handle spice?",
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences, syncPreferencesToDB } = useApp();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [diet, setDiet] = useState<'veg' | 'egg' | 'nonveg' | null>(preferences.diet);
  const [budgetMin, setBudgetMin] = useState(preferences.budgetMin);
  const [budgetMax, setBudgetMax] = useState(preferences.budgetMax);
  const [spiceLevel, setSpiceLevel] = useState(preferences.spiceLevel);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [screenWidth, setScreenWidth] = useState(getSafeWidth);

  useEffect(() => {
    const update = () => {
      const w = Dimensions.get('window').width;
      if (w > 0) setScreenWidth(w);
    };
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  // Animations
  const genieScale = useSharedValue(0.8);
  const genieFloat = useSharedValue(0);
  const genieRotate = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const bubbleScale = useSharedValue(0);
  const glowPulse = useSharedValue(0.5);

  // Typing effect
  useEffect(() => {
    setIsTyping(true);
    setDisplayedMessage('');
    let index = 0;
    const message = GENIE_MESSAGES[step];
    const interval = setInterval(() => {
      if (index < message.length) {
        setDisplayedMessage(message.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    genieScale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    genieFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    genieRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ), -1, true
    );
    bubbleScale.value = withDelay(500, withSpring(1, { damping: 10 }));
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);

  useEffect(() => {
    const stepProgress: Record<OnboardingStep, number> = { welcome: 0, diet: 25, budget: 50, spice: 75 };
    progressWidth.value = withTiming(stepProgress[step], { duration: 400 });
  }, [step]);

  const genieAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: genieScale.value }, { translateY: genieFloat.value }, { rotate: `${genieRotate.value}deg` }],
  }));
  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: interpolate(sparkleOpacity.value, [0.3, 1], [0.8, 1.2]) }],
  }));
  const progressAnimatedStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));
  const bubbleAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: bubbleScale.value }], opacity: bubbleScale.value }));
  const glowAnimatedStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value, transform: [{ scale: 1 + glowPulse.value * 0.1 }] }));

  const goToNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bubbleScale.value = 0;
    const stepOrder: OnboardingStep[] = ['welcome', 'diet', 'budget', 'spice'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
      setTimeout(() => { bubbleScale.value = withSpring(1, { damping: 10 }); }, 200);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newPrefs = {
      diet,
      budgetMin,
      budgetMax,
      spiceLevel,
      onboardingComplete: true,
    };
    updatePreferences(newPrefs);
    // Pass values directly to avoid stale closure issue
    await syncPreferencesToDB(newPrefs);
    router.replace('/(tabs)');
  };

  const canProceed = () => {
    if (step === 'diet') return diet !== null;
    return true;
  };

  const renderStepContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.appTitle}>FoodGenie</Text>
            <Text style={styles.welcomeSubtitle}>Your AI food decision engine</Text>
            <View style={styles.featureList}>
              {[
                { icon: 'auto-awesome', text: 'AI-powered meal recommendations' },
                { icon: 'verified', text: 'Chef-verified kitchens only' },
                { icon: 'trending-up', text: 'Learns your taste over time' },
              ].map((feature, index) => (
                <Animated.View key={feature.icon} entering={SlideInRight.delay(600 + index * 150).duration(400)} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <MaterialIcons name={feature.icon as any} size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 'diet':
        return (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Diet Preference</Text>
            <View style={styles.dietGrid}>
              {config.dietOptions.map((option, index) => (
                <Animated.View key={option.id} entering={FadeInDown.delay(300 + index * 100).duration(400)}>
                  <Pressable
                    style={[styles.dietCard, diet === option.id && styles.dietCardActive, diet === option.id && { borderColor: option.color }]}
                    onPress={() => { Haptics.selectionAsync(); setDiet(option.id as any); genieScale.value = withSequence(withSpring(1.2, { damping: 5 }), withSpring(1, { damping: 8 })); }}
                  >
                    <AnimatedDietIcon type={option.id as 'veg' | 'egg' | 'nonveg'} isSelected={diet === option.id} size={56} />
                    <Text style={styles.dietLabel}>{option.label}</Text>
                    {diet === option.id ? (
                      <Animated.View entering={FadeIn.duration(200)} style={[styles.checkmark, { backgroundColor: option.color }]}>
                        <MaterialIcons name="check" size={16} color="#FFF" />
                      </Animated.View>
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 'budget':
        return (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Budget Comfort Range</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetDisplay}>
                <Text style={styles.budgetRange}>₹{budgetMin} — ₹{budgetMax}</Text>
                <Text style={styles.budgetLabel}>per meal</Text>
              </View>
              <View style={styles.sliderWrapper}>
                <Text style={styles.sliderLabel}>Minimum</Text>
                <CustomSlider
                  style={styles.slider}
                  minimumValue={50}
                  maximumValue={500}
                  step={50}
                  value={budgetMin}
                  onValueChange={(v) => { setBudgetMin(v); if (v > budgetMax) setBudgetMax(v + 100); }}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                />
              </View>
              <View style={styles.sliderWrapper}>
                <Text style={styles.sliderLabel}>Maximum</Text>
                <CustomSlider
                  style={styles.slider}
                  minimumValue={100}
                  maximumValue={1000}
                  step={50}
                  value={budgetMax}
                  onValueChange={(v) => { setBudgetMax(v); if (v < budgetMin) setBudgetMin(Math.max(50, v - 100)); }}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                />
              </View>
              <View style={styles.budgetTips}>
                <View style={[styles.budgetTip, budgetMax <= 250 && styles.budgetTipActive]}>
                  <Text style={styles.budgetTipEmoji}>🍜</Text>
                  <Text style={styles.budgetTipText}>Budget</Text>
                </View>
                <View style={[styles.budgetTip, budgetMax > 250 && budgetMax <= 500 && styles.budgetTipActive]}>
                  <Text style={styles.budgetTipEmoji}>🍛</Text>
                  <Text style={styles.budgetTipText}>Regular</Text>
                </View>
                <View style={[styles.budgetTip, budgetMax > 500 && styles.budgetTipActive]}>
                  <Text style={styles.budgetTipEmoji}>🍱</Text>
                  <Text style={styles.budgetTipText}>Premium</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );

      case 'spice':
        return (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Spice Tolerance</Text>
            <View style={styles.spiceGrid}>
              {config.spiceLevels.map((option, index) => (
                <Animated.View key={option.id} entering={FadeInDown.delay(300 + index * 100).duration(400)}>
                  <Pressable
                    style={[styles.spiceCard, { width: (screenWidth - 52) / 2 }, spiceLevel === option.level && styles.spiceCardActive]}
                    onPress={() => { Haptics.selectionAsync(); setSpiceLevel(option.level); }}
                  >
                    <Text style={styles.spiceEmoji}>{option.emoji}</Text>
                    <Text style={styles.spiceLabel}>{option.label}</Text>
                    {spiceLevel === option.level ? (
                      <Animated.View entering={FadeIn.duration(200)} style={styles.spiceIndicator}>
                        <LinearGradient colors={theme.gradients.genie} style={styles.spiceIndicatorGradient} />
                      </Animated.View>
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]}>
            <LinearGradient colors={theme.gradients.gold} style={styles.progressGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          </Animated.View>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <MaterialIcons name="close" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.genieSection}>
          <Animated.View style={[styles.genieGlow, glowAnimatedStyle]}>
            <LinearGradient colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0)', 'transparent']} style={styles.genieGlowGradient} />
          </Animated.View>
          <Animated.Text style={[styles.sparkle, { top: 20, left: screenWidth * 0.15 }, sparkleAnimatedStyle]}>✨</Animated.Text>
          <Animated.Text style={[styles.sparkle, { top: 50, right: screenWidth * 0.12 }, sparkleAnimatedStyle]}>⭐</Animated.Text>
          <Animated.View style={[styles.genieContainer, genieAnimatedStyle]}>
            <LinearGradient colors={theme.gradients.goldShine} style={styles.genieRing}>
              <View style={styles.genieInner}>
                <Image source={require('../assets/images/genie-mascot.png')} style={styles.genieMascot} contentFit="contain" />
              </View>
            </LinearGradient>
          </Animated.View>
          <Animated.View style={[styles.speechBubble, { maxWidth: screenWidth - 60 }, bubbleAnimatedStyle]}>
            <View style={styles.speechBubbleArrow} />
            <Text style={styles.speechText}>
              {displayedMessage}
              {isTyping ? <Text style={styles.typingCursor}>|</Text> : null}
            </Text>
          </Animated.View>
        </View>
        {renderStepContent()}
      </ScrollView>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
          onPress={goToNextStep}
          disabled={!canProceed()}
        >
          <LinearGradient
            colors={canProceed() ? theme.gradients.genie : [theme.border, theme.border]}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>
              {step === 'welcome' ? "Let's Go!" : step === 'spice' ? 'Start Exploring' : 'Continue'}
            </Text>
            <MaterialIcons name={step === 'welcome' ? 'auto-awesome' : 'arrow-forward'} size={20} color={canProceed() ? theme.textOnPrimary : theme.textMuted} />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 16 },
  progressTrack: { flex: 1, height: 4, backgroundColor: theme.backgroundSecondary, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressGradient: { flex: 1 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },

  // Genie section
  genieSection: { alignItems: 'center', paddingTop: 10, paddingBottom: 20, position: 'relative' },
  genieGlow: { position: 'absolute', width: 200, height: 200, top: 0 },
  genieGlowGradient: { width: '100%', height: '100%', borderRadius: 100 },
  sparkle: { position: 'absolute', fontSize: 20 },
  genieContainer: { marginBottom: 16 },
  genieRing: { width: 120, height: 120, borderRadius: 60, padding: 4, alignItems: 'center', justifyContent: 'center', ...theme.shadows.genie },
  genieInner: { width: 112, height: 112, borderRadius: 56, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(200,135,90,0.15)' },
  genieMascot: { width: 72, height: 72 },
  speechBubble: { backgroundColor: theme.surface, borderRadius: 20, padding: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(200,135,90,0.12)', position: 'relative', ...theme.shadows.card },
  speechBubbleArrow: { position: 'absolute', top: -10, alignSelf: 'center', width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: theme.surface },
  speechText: { fontSize: 15, color: theme.textPrimary, lineHeight: 22, textAlign: 'center' },
  typingCursor: { color: theme.primary, fontWeight: '700' },

  // Steps
  stepContent: { marginTop: 16 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginBottom: 20, textAlign: 'center' },
  welcomeContent: { alignItems: 'center', paddingTop: 20 },
  welcomeTitle: { fontSize: 16, color: theme.textSecondary, marginBottom: 4 },
  appTitle: { fontSize: 42, fontWeight: '700', color: theme.primary, marginBottom: 8 },
  welcomeSubtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 32 },
  featureList: { gap: 12, width: '100%' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.backgroundSecondary, padding: 16, borderRadius: theme.borderRadius.lg },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(200,135,90,0.08)' },
  featureText: { fontSize: 15, color: theme.textPrimary, fontWeight: '500' },

  // Diet
  dietGrid: { gap: 12 },
  dietCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.lg, padding: 18, borderWidth: 2, borderColor: 'transparent', position: 'relative', gap: 16 },
  dietCardActive: { backgroundColor: theme.background, ...theme.shadows.card },
  dietLabel: { fontSize: 17, fontWeight: '600', color: theme.textPrimary, flex: 1 },
  checkmark: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Budget
  budgetContainer: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.xl, padding: 24 },
  budgetDisplay: { alignItems: 'center', marginBottom: 24 },
  budgetRange: { fontSize: 36, fontWeight: '700', color: theme.primary, lineHeight: 44 },
  budgetLabel: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  sliderWrapper: { marginBottom: 16 },
  sliderLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 },
  slider: { width: '100%', height: 44 },
  budgetTips: { flexDirection: 'row', gap: 8 },
  budgetTip: { flex: 1, alignItems: 'center', padding: 12, borderRadius: theme.borderRadius.md, backgroundColor: theme.backgroundTertiary, opacity: 0.5 },
  budgetTipActive: { opacity: 1, backgroundColor: 'rgba(200,135,90,0.12)' },
  budgetTipEmoji: { fontSize: 20, marginBottom: 4 },
  budgetTipText: { fontSize: 11, color: theme.textSecondary, fontWeight: '500' },

  // Spice
  spiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  spiceCard: { backgroundColor: theme.backgroundSecondary, borderRadius: theme.borderRadius.lg, padding: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  spiceCardActive: { backgroundColor: 'rgba(200,135,90,0.1)' },
  spiceEmoji: { fontSize: 32, marginBottom: 8 },
  spiceLabel: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  spiceIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, overflow: 'hidden' },
  spiceIndicatorGradient: { flex: 1 },

  // Bottom
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border },
  continueButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  continueButtonDisabled: { opacity: 0.5 },
  continueGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  continueText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
});
