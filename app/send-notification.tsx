import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAlert } from '@/template';
import { theme } from '../constants/theme';
import { sendBroadcastPushNotification } from '../services/notificationService';

const QUICK_TEMPLATES = [
  {
    label: 'App Update',
    title: 'FoodGenie Just Got Better!',
    body: 'We have a fresh new update with exciting features. Open the app to check it out!',
  },
  {
    label: 'New Feature',
    title: 'New Feature Alert',
    body: 'A brand new feature is live on FoodGenie. Come explore what is new!',
  },
  {
    label: 'Community',
    title: 'Your Food Community Misses You',
    body: 'New dishes and creators are trending. Jump back in and discover something delicious!',
  },
];

export default function SendNotificationScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);

  const handleSend = useCallback(async () => {
    if (!title.trim() || !body.trim()) {
      showAlert('Missing Fields', 'Both title and message are required');
      return;
    }

    showAlert('Confirm Send', 'This will send a push notification to ALL registered users.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Now',
        style: 'default',
        onPress: async () => {
          setSending(true);
          setResult(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

          const res = await sendBroadcastPushNotification({
            title: title.trim(),
            body: body.trim(),
          });

          setSending(false);

          if (res.success) {
            setResult({ sent: res.sent, failed: res.failed });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert('Sent!', `Delivered to ${res.sent} device${res.sent !== 1 ? 's' : ''}${res.failed ? ` (${res.failed} failed)` : ''}`);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert('Send Failed', res.error || 'Something went wrong');
          }
        },
      },
    ]);
  }, [title, body, showAlert]);

  const applyTemplate = useCallback((template: typeof QUICK_TEMPLATES[0]) => {
    Haptics.selectionAsync();
    setTitle(template.title);
    setBody(template.body);
    setResult(null);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
              <Pressable
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                onPress={() => router.back()}
              >
                <MaterialIcons name="arrow-back" size={22} color="#FFF" />
              </Pressable>
              <Text style={styles.headerTitle}>Send Notification</Text>
              <View style={{ width: 44 }} />
            </Animated.View>

            {/* Info banner */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoBanner}>
              <MaterialIcons name="campaign" size={22} color="#D4AF37" />
              <Text style={styles.infoBannerText}>
                This will send a push notification to all users who have the app installed and notifications enabled.
              </Text>
            </Animated.View>

            {/* Quick templates */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.templateSection}>
              <Text style={styles.sectionLabel}>Quick Templates</Text>
              <View style={styles.templateGrid}>
                {QUICK_TEMPLATES.map((tpl) => (
                  <Pressable
                    key={tpl.label}
                    style={({ pressed }) => [
                      styles.templateCard,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => applyTemplate(tpl)}
                  >
                    <Text style={styles.templateLabel}>{tpl.label}</Text>
                    <Text style={styles.templatePreview} numberOfLines={1}>
                      {tpl.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notification Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={(t) => { setTitle(t); setResult(null); }}
                  placeholder="e.g. FoodGenie Just Got Better!"
                  placeholderTextColor="#6B6B6B"
                  maxLength={100}
                />
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={body}
                  onChangeText={(t) => { setBody(t); setResult(null); }}
                  placeholder="Describe the update or announcement..."
                  placeholderTextColor="#6B6B6B"
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{body.length}/300</Text>
              </View>
            </Animated.View>

            {/* Preview */}
            {title.trim() || body.trim() ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.previewSection}>
                <Text style={styles.sectionLabel}>Preview</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewIcon}>
                    <MaterialIcons name="notifications" size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.previewContent}>
                    <Text style={styles.previewTitle} numberOfLines={1}>
                      {title.trim() || 'Notification Title'}
                    </Text>
                    <Text style={styles.previewBody} numberOfLines={2}>
                      {body.trim() || 'Notification message...'}
                    </Text>
                  </View>
                  <Text style={styles.previewTime}>now</Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Result */}
            {result ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.resultBanner}>
                <MaterialIcons name="check-circle" size={20} color="#4ADE80" />
                <Text style={styles.resultText}>
                  Sent to {result.sent} device{result.sent !== 1 ? 's' : ''}
                  {result.failed ? ` · ${result.failed} failed` : ''}
                </Text>
              </Animated.View>
            ) : null}

            {/* Send button */}
            <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.ctaSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!title.trim() || !body.trim() || sending) && { opacity: 0.5 },
                  pressed && title.trim() && body.trim() && !sending && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleSend}
                disabled={!title.trim() || !body.trim() || sending}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.sendBtnGrad}>
                  {sending ? (
                    <ActivityIndicator size="small" color="#0A0A0A" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={20} color="#0A0A0A" />
                      <Text style={styles.sendBtnText}>Send to All Users</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#A0A0A0',
    lineHeight: 20,
  },

  // Templates
  templateSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A0A0A0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  templateGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  templateCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
    gap: 6,
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  templatePreview: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B6B6B',
  },

  // Form
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A0A0A0',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#151515',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'right',
    marginTop: 2,
  },

  // Preview
  previewSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: { flex: 1, gap: 2 },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  previewBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A0A0A0',
    lineHeight: 18,
  },
  previewTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B6B6B',
  },

  // Result
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ADE80',
  },

  // Send button
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sendBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
  },
  sendBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
  },
});
