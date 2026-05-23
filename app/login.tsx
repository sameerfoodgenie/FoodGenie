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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth, useAlert } from '@/template';
import { theme } from '../constants/theme';

type Stage = 'email' | 'otp';

export default function LoginScreen() {
  const { sendOTP, verifyOTPAndLogin, signInWithGoogle, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

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
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    showAlert('Could not send code', `${lastError}. Please check your internet connection and try again.`);
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

  return (
    <View style={styles.container}>
      {/* Background gradient orbs */}
      <View style={styles.bgOrb1} />
      <View style={styles.bgOrb2} />

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
            {stage === 'otp' ? (
            <Pressable
              style={styles.backButton}
              onPress={() => setStage('email')}
            >
              <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
            </Pressable>
            ) : null}

            <Animated.View entering={FadeInDown.duration(500)} style={styles.loginHeader}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/foodgenie-logo.png')}
                  style={styles.loginLogo}
                  contentFit="contain"
                  transition={200}
                />
              </View>
              <Text style={styles.brandName}>FoodGenie</Text>
              <Text style={styles.brandTagline}>Share What You Eat</Text>
              <Text style={styles.loginTitle}>
                {stage === 'otp' ? 'Enter Verification Code' : 'Welcome Back'}
              </Text>
              <Text style={styles.loginSubtitle}>
                {stage === 'otp'
                  ? `We sent a 4-digit code to ${email}`
                  : 'Sign in to continue your food journey'}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(250).duration(450)} style={styles.form}>
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
                    style={({ pressed }) => [styles.primaryButton, operationLoading && styles.buttonDisabled, pressed && !operationLoading && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                    onPress={handleVerifyOTP}
                    disabled={operationLoading}
                  >
                    <LinearGradient colors={['#F5B731', '#FDD85D']} style={styles.primaryButtonGradient}>
                      <Text style={styles.primaryButtonText}>
                        {operationLoading ? 'Verifying...' : 'Verify & Sign In'}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable style={styles.resendLink} onPress={handleResendOTP} disabled={operationLoading}>
                    <Text style={styles.resendText}>
                      Did not receive the code? <Text style={styles.resendHighlight}>Resend</Text>
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrap}>
                      <MaterialIcons name="email" size={18} color={theme.textMuted} />
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
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, operationLoading && styles.buttonDisabled, pressed && !operationLoading && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                    onPress={handleSendOTP}
                    disabled={operationLoading}
                  >
                    <LinearGradient
                      colors={['#F5B731', '#FDD85D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        {operationLoading ? 'Sending Code...' : 'Continue with Email'}
                      </Text>
                      {!operationLoading ? <MaterialIcons name="arrow-forward" size={18} color={theme.textOnPrimary} /> : null}
                    </LinearGradient>
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.googleButton, operationLoading && styles.buttonDisabled, pressed && !operationLoading && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
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
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  // Background orbs
  bgOrb1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(123,47,160,0.06)',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(196,30,122,0.04)',
  },

  // Login
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(123,47,160,0.25)',
    shadowColor: '#7B2FA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 10,
  },
  loginLogo: { width: 120, height: 120 },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#7B2FA0',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C41E7A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  loginScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.glass.border,
  },
  loginHeader: { alignItems: 'center', marginBottom: 36 },

  loginTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
  loginSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginLeft: 4, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: theme.glass.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.textPrimary,
    padding: 0,
  },
  primaryButton: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
  buttonDisabled: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.glass.border },
  dividerText: { fontSize: 13, color: theme.textMuted, marginHorizontal: 16 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.glass.border,
  },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  resendLink: { alignItems: 'center', paddingVertical: 12 },
  resendText: { fontSize: 14, color: theme.textSecondary },
  resendHighlight: { color: theme.primary, fontWeight: '700' },
  otpInput: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    fontSize: 30,
    fontWeight: '700',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(123,47,160,0.25)',
    letterSpacing: 14,
  },
  otpNote: { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 6 },
});
