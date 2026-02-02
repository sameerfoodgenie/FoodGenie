import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomSlider } from '../components';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { config } from '../constants/config';
import { useApp } from '../contexts/AppContext';

type OnboardingStep = 'basics' | 'optional';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences } = useApp();
  
  const [step, setStep] = useState<OnboardingStep>('basics');
  const [diet, setDiet] = useState<'veg' | 'egg' | 'nonveg' | null>(preferences.diet);
  const [budget, setBudget] = useState(preferences.budget);
  const [spiceLevel, setSpiceLevel] = useState(preferences.spiceLevel);
  
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

  const handleDietSelect = (selectedDiet: 'veg' | 'egg' | 'nonveg') => {
    Haptics.selectionAsync();
    setDiet(selectedDiet);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 'basics') {
      updatePreferences({ diet, budget, spiceLevel });
      setStep('optional');
    } else {
      // Save optional health data
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);
      updatePreferences({ 
        onboardingComplete: true,
        height: heightNum || undefined,
        weight: weightNum || undefined,
        dateOfBirth: dateOfBirth || undefined,
        allergies,
      });
      router.replace('/ai-thinking');
    }
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <View style={styles.progressDots}>
            <View style={[styles.dot, step === 'basics' && styles.dotActive]} />
            <View style={[styles.dot, step === 'optional' && styles.dotActive]} />
          </View>
          <View style={{ width: 44 }} />
        </View>

        {step === 'basics' ? (
          <>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Let's personalize your experience</Text>
              <Text style={styles.subtitle}>
                Help FoodGenie understand your food preferences
              </Text>
            </View>

            {/* Diet Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's your diet preference?</Text>
              <View style={styles.dietOptions}>
                {config.dietOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.dietCard,
                      diet === option.id && styles.dietCardActive,
                      diet === option.id && { borderColor: option.color },
                    ]}
                    onPress={() => handleDietSelect(option.id as 'veg' | 'egg' | 'nonveg')}
                  >
                    <Text style={styles.dietEmoji}>{option.emoji}</Text>
                    <Text style={styles.dietLabel}>{option.label}</Text>
                    {diet === option.id && (
                      <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                        <MaterialIcons name="check" size={14} color="#FFF" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Budget Slider */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's your typical budget per meal?</Text>
              <View style={styles.sliderContainer}>
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
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderMin}>₹100</Text>
                  <Text style={styles.sliderValue}>₹{budget}</Text>
                  <Text style={styles.sliderMax}>₹800</Text>
                </View>
              </View>
            </View>

            {/* Spice Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How spicy do you like it?</Text>
              <View style={styles.spiceOptions}>
                {config.spiceLevels.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.spiceCard,
                      spiceLevel === option.level && styles.spiceCardActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSpiceLevel(option.level);
                    }}
                  >
                    <Text style={styles.spiceEmoji}>{option.emoji}</Text>
                    <Text style={styles.spiceLabel}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Optional Intelligence */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Help us suggest safer food</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>OPTIONAL</Text>
              </View>
              <Text style={styles.subtitle}>
                This helps us recommend meals that fit your health profile
              </Text>
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyBanner}>
              <MaterialIcons name="lock" size={20} color={theme.success} />
              <Text style={styles.privacyText}>
                We never sell your data or run ads. Your health info is encrypted and used only for personalization.
              </Text>
            </View>

            {/* Optional Fields */}
            <View style={styles.optionalFields}>
              <Pressable style={styles.optionalField} onPress={() => {
                Haptics.selectionAsync();
                setTempHeight(height);
                setShowHeightModal(true);
              }}>
                <MaterialIcons name="height" size={24} color={theme.textSecondary} />
                <View style={styles.optionalFieldText}>
                  <Text style={styles.optionalFieldLabel}>Height</Text>
                  <Text style={[styles.optionalFieldValue, height && styles.optionalFieldValueFilled]}>
                    {height ? `${height} cm` : 'Tap to add'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
              </Pressable>

              <Pressable style={styles.optionalField} onPress={() => {
                Haptics.selectionAsync();
                setTempWeight(weight);
                setShowWeightModal(true);
              }}>
                <MaterialIcons name="monitor-weight" size={24} color={theme.textSecondary} />
                <View style={styles.optionalFieldText}>
                  <Text style={styles.optionalFieldLabel}>Weight</Text>
                  <Text style={[styles.optionalFieldValue, weight && styles.optionalFieldValueFilled]}>
                    {weight ? `${weight} kg` : 'Tap to add'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
              </Pressable>

              <Pressable style={styles.optionalField} onPress={() => {
                Haptics.selectionAsync();
                setTempDOB(dateOfBirth);
                setShowDOBModal(true);
              }}>
                <MaterialIcons name="cake" size={24} color={theme.textSecondary} />
                <View style={styles.optionalFieldText}>
                  <Text style={styles.optionalFieldLabel}>Date of Birth</Text>
                  <Text style={[styles.optionalFieldValue, dateOfBirth && styles.optionalFieldValueFilled]}>
                    {dateOfBirth || 'Tap to add'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
              </Pressable>

              <Pressable style={styles.optionalField} onPress={() => {
                Haptics.selectionAsync();
                setShowAllergiesModal(true);
              }}>
                <MaterialIcons name="warning" size={24} color={theme.textSecondary} />
                <View style={styles.optionalFieldText}>
                  <Text style={styles.optionalFieldLabel}>Food Allergies</Text>
                  <Text style={[styles.optionalFieldValue, allergies.length > 0 && styles.optionalFieldValueFilled]}>
                    {allergies.length > 0 ? `${allergies.length} selected` : 'None selected'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.textMuted} />
              </Pressable>
            </View>
            
            {/* BMI Calculation */}
            {calculateBMI() && (
              <View style={styles.bmiContainer}>
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
                  💡 This helps us suggest balanced meals for your health goals
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Height Modal */}
      <Modal visible={showHeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Height</Text>
            <TextInput
              style={styles.modalInput}
              value={tempHeight}
              onChangeText={setTempHeight}
              placeholder="e.g., 170"
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

      {/* Weight Modal */}
      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Weight</Text>
            <TextInput
              style={styles.modalInput}
              value={tempWeight}
              onChangeText={setTempWeight}
              placeholder="e.g., 65"
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

      {/* DOB Modal */}
      <Modal visible={showDOBModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Date of Birth</Text>
            <TextInput
              style={styles.modalInput}
              value={tempDOB}
              onChangeText={setTempDOB}
              placeholder="DD/MM/YYYY"
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

      {/* Allergies Modal */}
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
            <Pressable style={styles.modalButtonSave} onPress={() => {
              Haptics.selectionAsync();
              setShowAllergiesModal(false);
            }}>
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
          style={[styles.continueButton, !diet && step === 'basics' && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!diet && step === 'basics'}
        >
          <LinearGradient
            colors={(!diet && step === 'basics') ? [theme.border, theme.border] : theme.gradients.genie}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>
              {step === 'basics' ? 'Continue' : 'Finish'}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  dotActive: {
    backgroundColor: theme.primary,
    width: 24,
  },
  titleContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  optionalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginTop: 12,
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  dietOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  dietCard: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  dietCardActive: {
    backgroundColor: theme.background,
    ...theme.shadows.card,
  },
  dietEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderMin: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
  },
  sliderMax: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  spiceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  spiceCard: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  spiceCardActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  spiceEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  spiceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: theme.borderRadius.md,
    marginBottom: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: theme.textPrimary,
    lineHeight: 20,
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
    gap: 16,
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
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
    fontSize: 48,
    fontWeight: '700',
    color: theme.primary,
  },
  bmiCategory: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  bmiCategoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bmiDisclaimer: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  modalContentLarge: {
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
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
