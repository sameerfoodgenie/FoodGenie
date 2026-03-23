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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth, useAlert } from '@/template';
import { theme } from '../constants/theme';
import { uploadImage } from '../services/storageService';
import { upsertProfile } from '../services/profileService';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickAvatar = useCallback(async () => {
    Haptics.selectionAsync();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, [showAlert]);

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      showAlert('Name Required', 'Please enter your display name');
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (avatarUri) {
        const { url, error: uploadError } = await uploadImage('avatars', avatarUri, user.id);
        if (uploadError) {
          console.warn('Avatar upload failed:', uploadError);
        } else {
          avatarUrl = url;
        }
      }

      // Save profile
      const { error } = await upsertProfile({
        user_id: user.id,
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      });

      if (error) {
        showAlert('Error', error);
        setSaving(false);
        return;
      }

      showAlert('Welcome!', 'Your profile is all set');
      router.replace('/(tabs)');
    } catch (e: any) {
      showAlert('Error', e?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [fullName, bio, avatarUri, user, router, showAlert]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    if (!user?.id) {
      router.replace('/(tabs)');
      return;
    }
    // Save minimal profile
    upsertProfile({
      user_id: user.id,
      full_name: user.username || user.email?.split('@')[0] || 'Food Lover',
    }).then(() => {
      router.replace('/(tabs)');
    });
  }, [user, router]);

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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
            {/* Skip */}
            <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.skipRow}>
              <Pressable
                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>Skip for now</Text>
                <MaterialIcons name="chevron-right" size={18} color="#6B6B6B" />
              </Pressable>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headerSection}>
              <View style={styles.headerEmoji}>
                <Text style={{ fontSize: 40 }}>✨</Text>
              </View>
              <Text style={styles.headerTitle}>Set Up Your Profile</Text>
              <Text style={styles.headerSubtitle}>
                Let others know who you are in the food community
              </Text>
            </Animated.View>

            {/* Avatar */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.avatarSection}>
              <Pressable
                style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
                onPress={handlePickAvatar}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" transition={200} />
                ) : (
                  <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </LinearGradient>
                )}
                <View style={styles.avatarEditBadge}>
                  <MaterialIcons name="camera-alt" size={16} color="#FFF" />
                </View>
              </Pressable>
              <Text style={styles.avatarHint}>Tap to add profile photo</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name *</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={18} color="#6B6B6B" />
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your name or alias"
                    placeholderTextColor="#6B6B6B"
                    maxLength={50}
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                  <MaterialIcons name="edit" size={18} color="#6B6B6B" style={{ marginTop: 2 }} />
                  <TextInput
                    style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell the world about your food journey..."
                    placeholderTextColor="#6B6B6B"
                    multiline
                    maxLength={200}
                  />
                </View>
                <Text style={styles.charCount}>{bio.length}/200</Text>
              </View>
            </Animated.View>

            {/* Save */}
            <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.ctaSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  (!fullName.trim() || saving) && { opacity: 0.5 },
                  pressed && fullName.trim() && !saving && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleSave}
                disabled={!fullName.trim() || saving}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.saveBtnGrad}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#0A0A0A" />
                  ) : (
                    <>
                      <Text style={styles.saveBtnText}>Complete Setup</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#0A0A0A" />
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

  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skipText: { fontSize: 14, fontWeight: '600', color: '#6B6B6B' },

  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  headerEmoji: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 22,
  },

  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 10,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  avatarHint: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },

  formSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 20,
  },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A0A0A0',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.10)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'right',
    marginTop: 2,
  },

  ctaSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  saveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
  },
});
