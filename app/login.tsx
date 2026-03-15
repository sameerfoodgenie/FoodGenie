import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth, useAlert } from '@/template';
import { theme } from '../constants/theme';

type Stage = 'teaser' | 'email' | 'otp';

export default function LoginScreen() {
  const { sendOTP, verifyOTPAndLogin, signInWithGoogle, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [stage, setStage] = useState<Stage>('teaser');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStage('email');
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert('Error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Retry up to 2 times for transient network failures
    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await sendOTP(email.trim());
        if (!error) {
          showAlert('Code Sent', 'Check your email for the 4-digit verification code');
          setStage('otp');
          return;
        }
        lastError = error;
      } catch (e: any) {
        lastError = e?.message || 'Network error';
      }
      // Wait briefly before retry
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    showAlert(
      'Could not send code',
      `${lastError}. Please check your internet connection and try again.`,
    );
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert('Error', 'Please enter the verification code');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error, user: verifiedUser } = await verifyOTPAndLogin(email.trim(), otp.trim());
      if (error && !verifiedUser) {
        showAlert('Verification Failed', error);
        return;
      }
      // Success — AuthRouter handles navigation automatically
    } catch (e: any) {
      showAlert('Verification Failed', e?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await signInWithGoogle();
    if (error) {
      showAlert('Error', error);
    }
  };

  const handleResendOTP = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await sendOTP(email.trim());
        if (!error) {
          showAlert('Code Resent', 'A new verification code has been sent to your email');
          setOtp('');
          return;
        }
        lastError = error;
      } catch (e: any) {
        lastError = e?.message || 'Network error';
      }
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    showAlert('Could not resend', `${lastError}. Please try again in a moment.`);
  };

  // ---- Teaser Screen ----
  if (stage === 'teaser') {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.teaserContent}>
            {/* Hero */}
            <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.teaserHero}>
              <LinearGradient
                colors={theme.gradients.goldShine}
                style={styles.teaserRing}
              >
                <View style={styles.teaserInner}>
                  <Image
                    source={require('../assets/images/genie-mascot.png')}
                    style={styles.teaserMascot}
                    contentFit="contain"
                  />
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.teaserTextBlock}>
              <Text style={styles.teaserTitle}>FoodGenie</Text>
              <Text style={styles.teaserSubtitle}>Your AI-powered food decision engine</Text>
            </Animated.View>

            {/* Features */}
            <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.teaserFeatures}>
              {[
                { icon: 'auto-awesome', text: 'AI picks your perfect meal' },
                { icon: 'verified', text: 'Only chef-verified kitchens' },
                { icon: 'trending-up', text: 'Learns your taste over time' },
              ].map((f, i) => (
                <Animated.View key={f.icon} entering={SlideInRight.delay(700 + i * 120).duration(400)} style={styles.teaserFeature}>
                  <MaterialIcons name={f.icon as any} size={20} color={theme.primary} />
                  <Text style={styles.teaserFeatureText}>{f.text}</Text>
                </Animated.View>
              ))}
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInDown.delay(900).duration(400)} style={styles.teaserCTA}>
              <Pressable
                style={styles.getStartedButton}
                onPress={handleGetStarted}
              >
                <LinearGradient colors={theme.gradients.genie} style={styles.getStartedGradient}>
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={theme.textOnPrimary} />
                </LinearGradient>
              </Pressable>
              <Text style={styles.teaserNote}>Free forever. No paywalls on AI.</Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Email / OTP Screen ----
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.loginScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back */}
            <Pressable
              style={styles.backButton}
              onPress={() => stage === 'otp' ? setStage('email') : setStage('teaser')}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
            </Pressable>

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.loginHeader}>
              <Image
                source={require('../assets/images/genie-mascot.png')}
                style={styles.loginMascot}
                contentFit="contain"
              />
              <Text style={styles.loginTitle}>
                {stage === 'otp' ? 'Enter Verification Code' : 'Sign In'}
              </Text>
              <Text style={styles.loginSubtitle}>
                {stage === 'otp'
                  ? `We sent a 4-digit code to ${email}`
                  : 'Enter your email to receive a one-time login code'}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.form}>
              {stage === 'otp' ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Verification Code</Text>
                    <TextInput
                      style={styles.otpInput}
                      value={otp}
                      onChangeText={setOtp}
                      placeholder="0000"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="number-pad"
                      maxLength={4}
                      autoFocus
                      textAlign="center"
                    />
                  </View>

                  <Pressable
                    style={[styles.primaryButton, operationLoading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={operationLoading}
                  >
                    <LinearGradient colors={theme.gradients.genie} style={styles.primaryButtonGradient}>
                      <Text style={styles.primaryButtonText}>
                        {operationLoading ? 'Verifying...' : 'Verify & Sign In'}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    style={styles.resendLink}
                    onPress={handleResendOTP}
                    disabled={operationLoading}
                  >
                    <Text style={styles.resendText}>
                      Did not receive the code? <Text style={styles.resendHighlight}>Resend</Text>
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>

                  <Pressable
                    style={[styles.primaryButton, operationLoading && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={operationLoading}
                  >
                    <LinearGradient colors={theme.gradients.genie} style={styles.primaryButtonGradient}>
                      <Text style={styles.primaryButtonText}>
                        {operationLoading ? 'Sending Code...' : 'Send Login Code'}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google */}
                  <Pressable
                    style={[styles.googleButton, operationLoading && styles.buttonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={operationLoading}
                  >
                    <MaterialIcons name="login" size={20} color={theme.textPrimary} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </Pressable>

                  <Text style={styles.otpNote}>
                    No password needed. We will send a one-time code to your email.
                  </Text>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },

  // Teaser
  teaserContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaserHero: {
    marginBottom: 32,
  },
  teaserRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.genie,
  },
  teaserInner: {
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,135,90,0.15)',
  },
  teaserMascot: {
    width: 100,
    height: 100,
  },
  teaserTextBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  teaserTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.5,
  },
  teaserSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  teaserFeatures: {
    width: '100%',
    gap: 12,
    marginBottom: 40,
  },
  teaserFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
  },
  teaserFeatureText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  teaserCTA: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  teaserNote: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 12,
  },

  // Login
  loginScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginMascot: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textOnPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    fontSize: 13,
    color: theme.textMuted,
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  resendHighlight: {
    color: theme.primary,
    fontWeight: '700',
  },
  otpInput: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    letterSpacing: 12,
  },
  otpNote: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
