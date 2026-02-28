import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
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
  runOnJS,
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

const { width } = Dimensions.get('window');

type OnboardingStep = 'welcome' | 'diet' | 'budget' | 'spice' | 'optional';

const GENIE_MESSAGES = {
  welcome: "Hello! I'm your FoodGenie chef. Let me help you find the perfect meals!",
  diet: "First things first — what's your diet preference? I'll make sure to respect it!",
  budget: "Great choice! Now, how much do you usually spend on a meal?",
  spice: "Almost there! How adventurous are you with spice levels?",
  optional: "One last thing — some health details help me suggest even better meals. Totally optional though!",
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences } = useApp();
  
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [diet, setDiet] = useState<'veg' | 'egg' | 'nonveg' | null>(preferences.diet);
  const [budget, setBudget] = useState(preferences.budget);
  const [spiceLevel, setSpiceLevel] = useState(preferences.spiceLevel);
  const [genieMessage, setGenieMessage] = useState(GENIE_MESSAGES.welcome);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedMessage, setDisplayedMessage] = useState('');
  
  // Optional health data
  const [height, setHeight] = useState<string>(preferences.height?.toString() || '');
  const [weight, setWeight] = useState<string>(preferences.weight?.toString() || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>(preferences.dateOfBirth || '');
  const [allergies, setAllergies] = useState<string[]>(preferences.allergies || []);
  
  // Modal states
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDOBModal, setShowDOBModal] = useState(false);
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  
  // Temp input values
  const [tempHeight, setTempHeight] = useState(height);
  const [tempWeight, setTempWeight] = useState(weight);
  const [tempDOB, setTempDOB] = useState(dateOfBirth);

  // Animation values
  const genieScale = useSharedValue(0.8);
  const genieFloat = useSharedValue(0);
  const genieRotate = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const bubbleScale = useSharedValue(0);
  const waveHand = useSharedValue(0);
  const glowPulse = useSharedValue(0.5);

  // Typing effect for genie messages
  useEffect(() => {
    setIsTyping(true);
    setDisplayedMessage('');
    let index = 0;
    const message = GENIE_MESSAGES[step];
    
    const typingInterval = setInterval(() => {
      if (index < message.length) {
        setDisplayedMessage(message.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [step]);

  // Initialize animations
  useEffect(() => {
    // Genie entrance
    genieScale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );

    // Floating animation
    genieFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Gentle rotation
    genieRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Sparkles
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );

    // Speech bubble
    bubbleScale.value = withDelay(500, withSpring(1, { damping: 10 }));

    // Wave animation for welcome
    waveHand.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 200 }),
        withTiming(-15, { duration: 200 }),
        withTiming(10, { duration: 150 }),
        withTiming(-10, { duration: 150 }),
        withTiming(0, { duration: 200 })
      ),
      2,
      false
    );

    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Update progress bar
  useEffect(() => {
    const stepProgress = {
      welcome: 0,
      diet: 20,
      budget: 40,
      spice: 60,
      optional: 80,
    };
    progressWidth.value = withTiming(stepProgress[step], { duration: 400 });
  }, [step]);

  const genieAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: genieScale.value },
      { translateY: genieFloat.value },
      { rotate: `${genieRotate.value}deg` },
    ],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: interpolate(sparkleOpacity.value, [0.3, 1], [0.8, 1.2]) }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: bubbleScale.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
    transform: [{ scale: 1 + glowPulse.value * 0.1 }],
  }));

  const handleDietSelect = (selectedDiet: 'veg' | 'egg' | 'nonveg') => {
    Haptics.selectionAsync();
    setDiet(selectedDiet);
    
    // Genie celebrates
    genieScale.value = withSequence(
      withSpring(1.2, { damping: 5 }),
      withSpring(1, { damping: 8 })
    );
  };

  const goToNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Reset bubble for new message
    bubbleScale.value = 0;
    
    const stepOrder: OnboardingStep[] = ['welcome', 'diet', 'budget', 'spice', 'optional'];
    const currentIndex = stepOrder.indexOf(step);
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setStep(nextStep);
      
      // Animate bubble back in
      setTimeout(() => {
        bubbleScale.value = withSpring(1, { damping: 10 });
      }, 200);
    } else {
      // Finish onboarding
      handleFinish();
    }
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    updatePreferences({ 
      diet, 
      budget, 
      spiceLevel,
      onboardingComplete: true,
      height: heightNum || undefined,
      weight: weightNum || undefined,
      dateOfBirth: dateOfBirth || undefined,
      allergies,
    });
    router.replace('/ai-thinking');
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    updatePreferences({ diet, budget, spiceLevel, onboardingComplete: true });
    router.replace('/ai-thinking');
  };

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const bmi = w / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };
  
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: theme.accent };
    if (bmi < 25) return { label: 'Normal', color: theme.success };
    if (bmi < 30) return { label: 'Overweight', color: theme.accent };
    return { label: 'Obese', color: theme.error };
  };

  const saveHeight = () => {
    Haptics.selectionAsync();
    setHeight(tempHeight);
    setShowHeightModal(false);
  };
  
  const saveWeight = () => {
    Haptics.selectionAsync();
    setWeight(tempWeight);
    setShowWeightModal(false);
  };
  
  const saveDOB = () => {
    Haptics.selectionAsync();
    setDateOfBirth(tempDOB);
    setShowDOBModal(false);
  };
  
  const commonAllergies = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 
    'Wheat/Gluten', 'Fish', 'Shellfish', 'Sesame'
  ];
  
  const toggleAllergy = (allergy: string) => {
    Haptics.selectionAsync();
    setAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 'welcome': return true;
      case 'diet': return diet !== null;
      case 'budget': return true;
      case 'spice': return true;
      case 'optional': return true;
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.appTitle}>FoodGenie</Text>
            <Text style={styles.welcomeSubtitle}>Your personal AI chef assistant</Text>
            
            <View style={styles.featureList}>
              {[
                { icon: 'restaurant', text: 'Personalized dish recommendations' },
                { icon: 'verified', text: 'Chef-verified kitchens only' },
                { icon: 'local-offer', text: 'Transparent pricing always' },
              ].map((feature, index) => (
                <Animated.View 
                  key={feature.icon} 
                  entering={SlideInRight.delay(600 + index * 150).duration(400)}
                  style={styles.featureItem}
                >
                  <LinearGradient
                    colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.05)']}
                    style={styles.featureIcon}
                  >
                    <MaterialIcons name={feature.icon as any} size={20} color={theme.primary} />
                  </LinearGradient>
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
                <Animated.View 
                  key={option.id} 
                  entering={FadeInDown.delay(300 + index * 100).duration(400)}
                >
                  <Pressable
                    style={[
                      styles.dietCard,
                      diet === option.id && styles.dietCardActive,
                      diet === option.id && { borderColor: option.color },
                    ]}
                    onPress={() => handleDietSelect(option.id as 'veg' | 'egg' | 'nonveg')}
                  >
                    <AnimatedDietIcon
                      type={option.id as 'veg' | 'egg' | 'nonveg'}
                      isSelected={diet === option.id}
                      size={56}
                    />
                    <Text style={styles.dietLabel}>{option.label}</Text>
                    {diet === option.id && (
                      <Animated.View entering={FadeIn.duration(200)} style={[styles.checkmark, { backgroundColor: option.color }]}>
                        <MaterialIcons name="check" size={16} color="#FFF" />
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 'budget':
        return (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Meal Budget</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetDisplay}>
                <Text style={styles.budgetCurrency}>₹</Text>
                <Text style={styles.budgetValue}>{budget}</Text>
                <Text style={styles.budgetLabel}>per meal</Text>
              </View>
              
              <View style={styles.sliderWrapper}>
                <CustomSlider
                  style={styles.slider}
                  minimumValue={100}
                  maximumValue={800}
                  step={50}
                  value={budget}
                  onValueChange={(value) => setBudget(value)}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                />
                <View style={styles.sliderMarks}>
                  <Text style={styles.sliderMarkText}>₹100</Text>
                  <Text style={styles.sliderMarkText}>₹450</Text>
                  <Text style={styles.sliderMarkText}>₹800</Text>
                </View>
              </View>
              
              <View style={styles.budgetTips}>
                <View style={[styles.budgetTip, budget < 250 && styles.budgetTipActive]}>
                  <Text style={styles.budgetTipEmoji}>🍜</Text>
                  <Text style={styles.budgetTipText}>Budget Friendly</Text>
                </View>
                <View style={[styles.budgetTip, budget >= 250 && budget < 500 && styles.budgetTipActive]}>
                  <Text style={styles.budgetTipEmoji}>🍛</Text>
                  <Text style={styles.budgetTipText}>Regular</Text>
                </View>
                <View style={[styles.budgetTip, budget >= 500 && styles.budgetTipActive]}>
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
                <Animated.View 
                  key={option.id} 
                  entering={FadeInDown.delay(300 + index * 100).duration(400)}
                >
                  <Pressable
                    style={[
                      styles.spiceCard,
                      spiceLevel === option.level && styles.spiceCardActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSpiceLevel(option.level);
                      genieScale.value = withSequence(
                        withSpring(1.15, { damping: 5 }),
                        withSpring(1, { damping: 8 })
                      );
                    }}
                  >
                    <Text style={styles.spiceEmoji}>{option.emoji}</Text>
                    <Text style={styles.spiceLabel}>{option.label}</Text>
                    {spiceLevel === option.level && (
                      <Animated.View entering={FadeIn.duration(200)} style={styles.spiceIndicator}>
                        <LinearGradient
                          colors={theme.gradients.genie}
                          style={styles.spiceIndicatorGradient}
                        />
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 'optional':
        return (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.stepContent}>
            <View style={styles.optionalHeader}>
              <Text style={styles.stepTitle}>Health Profile</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
              </View>
            </View>
            
            <View style={styles.optionalFields}>
              {[
                { icon: 'height', label: 'Height', value: height ? `${height} cm` : 'Add', onPress: () => { setTempHeight(height); setShowHeightModal(true); } },
                { icon: 'monitor-weight', label: 'Weight', value: weight ? `${weight} kg` : 'Add', onPress: () => { setTempWeight(weight); setShowWeightModal(true); } },
                { icon: 'cake', label: 'Date of Birth', value: dateOfBirth || 'Add', onPress: () => { setTempDOB(dateOfBirth); setShowDOBModal(true); } },
                { icon: 'warning', label: 'Allergies', value: allergies.length > 0 ? `${allergies.length} selected` : 'None', onPress: () => setShowAllergiesModal(true) },
              ].map((field, index) => (
                <Animated.View key={field.icon} entering={SlideInRight.delay(300 + index * 100).duration(400)}>
                  <Pressable style={styles.optionalField} onPress={() => { Haptics.selectionAsync(); field.onPress(); }}>
                    <LinearGradient
                      colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
                      style={styles.optionalFieldIcon}
                    >
                      <MaterialIcons name={field.icon as any} size={22} color={theme.primary} />
                    </LinearGradient>
                    <View style={styles.optionalFieldText}>
                      <Text style={styles.optionalFieldLabel}>{field.label}</Text>
                      <Text style={[styles.optionalFieldValue, (field.value !== 'Add' && field.value !== 'None') && styles.optionalFieldValueFilled]}>
                        {field.value}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            
            {/* BMI Calculation */}
            {calculateBMI() && (
              <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.bmiContainer}>
                <View style={styles.bmiHeader}>
                  <MaterialIcons name="analytics" size={20} color={theme.primary} />
                  <Text style={styles.bmiTitle}>Your BMI</Text>
                </View>
                <View style={styles.bmiContent}>
                  <Text style={styles.bmiValue}>{calculateBMI()}</Text>
                  <View style={[styles.bmiCategory, { backgroundColor: `${getBMICategory(parseFloat(calculateBMI()!)).color}20` }]}>
                    <Text style={[styles.bmiCategoryText, { color: getBMICategory(parseFloat(calculateBMI()!)).color }]}>
                      {getBMICategory(parseFloat(calculateBMI()!)).label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bmiDisclaimer}>
                  💡 This helps suggest balanced meals for your goals
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]}>
            <LinearGradient
              colors={theme.gradients.gold}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <MaterialIcons name="close" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Genie Guide Section */}
        <View style={styles.genieSection}>
          {/* Glow effect */}
          <Animated.View style={[styles.genieGlow, glowAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0)', 'transparent']}
              style={styles.genieGlowGradient}
            />
          </Animated.View>

          {/* Sparkles */}
          <Animated.Text style={[styles.sparkle, styles.sparkle1, sparkleAnimatedStyle]}>✨</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.sparkle2, sparkleAnimatedStyle]}>⭐</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.sparkle3, sparkleAnimatedStyle]}>💫</Animated.Text>

          {/* Genie Mascot */}
          <Animated.View style={[styles.genieContainer, genieAnimatedStyle]}>
            <LinearGradient
              colors={theme.gradients.goldShine}
              style={styles.genieRing}
            >
              <View style={styles.genieInner}>
                <Image
                  source={require('../assets/images/genie-mascot.png')}
                  style={styles.genieMascot}
                  contentFit="contain"
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Speech Bubble */}
          <Animated.View style={[styles.speechBubble, bubbleAnimatedStyle]}>
            <View style={styles.speechBubbleArrow} />
            <Text style={styles.speechText}>
              {displayedMessage}
              {isTyping && <Text style={styles.typingCursor}>|</Text>}
            </Text>
          </Animated.View>
        </View>

        {/* Step Content */}
        {renderStepContent()}
      </ScrollView>

      {/* Modals */}
      <Modal visible={showHeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Height</Text>
            <TextInput
              style={styles.modalInput}
              value={tempHeight}
              onChangeText={setTempHeight}
              placeholder="e.g., 170"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.modalHint}>in centimeters (cm)</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowHeightModal(false)}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonSave} onPress={saveHeight}>
                <LinearGradient colors={theme.gradients.genie} style={styles.modalButtonSaveGradient}>
                  <Text style={styles.modalButtonSaveText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Weight</Text>
            <TextInput
              style={styles.modalInput}
              value={tempWeight}
              onChangeText={setTempWeight}
              placeholder="e.g., 65"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              autoFocus
            />
            <Text style={styles.modalHint}>in kilograms (kg)</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowWeightModal(false)}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonSave} onPress={saveWeight}>
                <LinearGradient colors={theme.gradients.genie} style={styles.modalButtonSaveGradient}>
                  <Text style={styles.modalButtonSaveText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDOBModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Date of Birth</Text>
            <TextInput
              style={styles.modalInput}
              value={tempDOB}
              onChangeText={setTempDOB}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <Text style={styles.modalHint}>e.g., 15/03/1995</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowDOBModal(false)}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonSave} onPress={saveDOB}>
                <LinearGradient colors={theme.gradients.genie} style={styles.modalButtonSaveGradient}>
                  <Text style={styles.modalButtonSaveText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAllergiesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Select Food Allergies</Text>
            <ScrollView style={styles.allergiesList} showsVerticalScrollIndicator={false}>
              {commonAllergies.map((allergy) => (
                <Pressable
                  key={allergy}
                  style={[
                    styles.allergyItem,
                    allergies.includes(allergy) && styles.allergyItemSelected,
                  ]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text style={[
                    styles.allergyItemText,
                    allergies.includes(allergy) && styles.allergyItemTextSelected,
                  ]}>
                    {allergy}
                  </Text>
                  {allergies.includes(allergy) && (
                    <MaterialIcons name="check-circle" size={20} color={theme.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalButtonSave} onPress={() => { Haptics.selectionAsync(); setShowAllergiesModal(false); }}>
              <LinearGradient colors={theme.gradients.genie} style={styles.modalButtonSaveGradient}>
                <Text style={styles.modalButtonSaveText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        {step === 'optional' && (
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
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
              {step === 'welcome' ? "Let's Go!" : step === 'optional' ? 'Finish' : 'Continue'}
            </Text>
            <MaterialIcons name={step === 'welcome' ? 'auto-awesome' : 'arrow-forward'} size={20} color={canProceed() ? theme.textOnPrimary : theme.textMuted} />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 16,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  genieSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  genieGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: 0,
  },
  genieGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkle1: {
    top: 20,
    left: width * 0.15,
  },
  sparkle2: {
    top: 50,
    right: width * 0.12,
  },
  sparkle3: {
    bottom: 80,
    left: width * 0.2,
  },
  genieContainer: {
    marginBottom: 16,
  },
  genieRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.genie,
  },
  genieInner: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  genieMascot: {
    width: 80,
    height: 80,
  },
  speechBubble: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    paddingHorizontal: 20,
    maxWidth: width - 60,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
    position: 'relative',
  },
  speechBubbleArrow: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.backgroundSecondary,
  },
  speechText: {
    fontSize: 15,
    color: theme.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
  },
  typingCursor: {
    color: theme.primary,
    fontWeight: '700',
  },
  stepContent: {
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  welcomeTitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    marginBottom: 32,
  },
  featureList: {
    gap: 12,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  dietGrid: {
    gap: 12,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    gap: 16,
  },
  dietCardActive: {
    backgroundColor: theme.background,
    ...theme.shadows.card,
  },

  dietLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    flex: 1,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetContainer: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
  },
  budgetDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  budgetCurrency: {
    fontSize: 18,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.primary,
    lineHeight: 64,
  },
  budgetLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  sliderWrapper: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sliderMarkText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  budgetTips: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetTip: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.backgroundTertiary,
    opacity: 0.5,
  },
  budgetTipActive: {
    opacity: 1,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  budgetTipEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  budgetTipText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  spiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spiceCard: {
    width: (width - 52) / 2,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  spiceCardActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  spiceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  spiceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  spiceIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    overflow: 'hidden',
  },
  spiceIndicatorGradient: {
    flex: 1,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  optionalBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.5,
  },
  optionalFields: {
    gap: 12,
  },
  optionalField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    gap: 14,
  },
  optionalFieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalFieldText: {
    flex: 1,
  },
  optionalFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  optionalFieldValue: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  optionalFieldValueFilled: {
    color: theme.primary,
    fontWeight: '600',
  },
  bmiContainer: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  bmiValue: {
    fontSize: 42,
    fontWeight: '700',
    color: theme.primary,
  },
  bmiCategory: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  bmiCategoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bmiDisclaimer: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalContentLarge: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  modalButtonSave: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  modalButtonSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  allergiesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.backgroundSecondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  allergyItemSelected: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  allergyItemText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  allergyItemTextSelected: {
    color: theme.primary,
    fontWeight: '700',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  skipButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  skipText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  continueButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
});
