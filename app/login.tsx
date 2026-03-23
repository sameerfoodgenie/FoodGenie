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
            {stage === 'otp' ? (
            <Pressable
              style={styles.backButton}
              onPress={() => setStage('email')}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
            </Pressable>
            ) : null}

            <Animated.View entering={FadeInDown.duration(400)} style={styles.loginHeader}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.loginLogo}
                  contentFit="contain"
                  transition={200}
                />
              </View>
              <Text style={styles.brandName}>FoodGenie</Text>
              <Text style={styles.loginTitle}>
                {stage === 'otp' ? 'Enter Verification Code' : 'Sign In'}
              </Text>
              <Text style={styles.loginSubtitle}>
                {stage === 'otp'
                  ? `We sent a 4-digit code to ${email}`
                  : 'Enter your email to receive a one-time login code'}
              </Text>
            </Animated.View>

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
                    <LinearGradient colors={theme.gradients.cameraBtn} style={styles.primaryButtonGradient}>
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
                    <LinearGradient colors={theme.gradients.cameraBtn} style={styles.primaryButtonGradient}>
                      <Text style={styles.primaryButtonText}>
                        {operationLoading ? 'Sending Code...' : 'Send Login Code'}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

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
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  // Login
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  loginLogo: { width: 88, height: 88 },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: 0.5,
    marginBottom: 4,
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
    borderColor: theme.border,
  },
  loginHeader: { alignItems: 'center', marginBottom: 32 },

  loginTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
  loginSubtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginLeft: 4 },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  primaryButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: theme.textOnPrimary },
  buttonDisabled: { opacity: 0.6 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { fontSize: 13, color: theme.textMuted, marginHorizontal: 16 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  resendLink: { alignItems: 'center', paddingVertical: 12 },
  resendText: { fontSize: 14, color: theme.textSecondary },
  resendHighlight: { color: theme.primary, fontWeight: '700' },
  otpInput: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    letterSpacing: 12,
  },
  otpNote: { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
