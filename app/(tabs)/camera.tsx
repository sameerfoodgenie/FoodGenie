import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_WEB = Platform.OS === 'web';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!IS_WEB && !permission?.granted) {
      requestPermission().then((result) => {
        if (!result.granted) setPermissionDenied(true);
      });
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        router.push({ pathname: '/create-post', params: { imageUri: photo.uri } });
      }
    } catch (e) {
      console.log('Capture error:', e);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, router]);

  const handlePickImage = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 5],
      });
      if (!result.canceled && result.assets[0]?.uri) {
        router.push({ pathname: '/create-post', params: { imageUri: result.assets[0].uri } });
      }
    } catch (e) {
      console.log('Gallery error:', e);
    }
  }, [router]);

  const handleFlip = useCallback(() => {
    Haptics.selectionAsync();
    setFacing(prev => prev === 'back' ? 'front' : 'back');
  }, []);

  const handleFlash = useCallback(() => {
    Haptics.selectionAsync();
    setFlash(prev => !prev);
  }, []);

  // Web fallback
  if (IS_WEB) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.webFallback}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.webContent}>
            <View style={styles.webIconWrap}>
              <MaterialIcons name="camera-alt" size={48} color={theme.primary} />
            </View>
            <Text style={styles.webTitle}>Take a Photo</Text>
            <Text style={styles.webDesc}>
              Camera works on mobile. Use gallery to upload a photo of your meal.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.webGalleryBtn, pressed && { opacity: 0.8 }]}
              onPress={handlePickImage}
            >
              <MaterialIcons name="photo-library" size={20} color={theme.primary} />
              <Text style={styles.webGalleryText}>Pick from Gallery</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // Permission denied
  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.webFallback}>
          <View style={styles.webContent}>
            <View style={styles.webIconWrap}>
              <MaterialIcons name="no-photography" size={48} color={theme.error} />
            </View>
            <Text style={styles.webTitle}>Camera Access Required</Text>
            <Text style={styles.webDesc}>Enable camera in your device settings to post meals.</Text>
            <Pressable
              style={({ pressed }) => [styles.webGalleryBtn, pressed && { opacity: 0.8 }]}
              onPress={() => requestPermission()}
            >
              <Text style={styles.webGalleryText}>Try Again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash ? 'on' : 'off'}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}>
          <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
        </View>
      )}

      {/* Overlay */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.topLabel}>New Post</Text>
          </Animated.View>
          <View style={styles.topActions}>
            <Pressable
              style={({ pressed }) => [styles.topBtn, flash && styles.topBtnActive, pressed && { opacity: 0.7 }]}
              onPress={handleFlash}
            >
              <MaterialIcons name={flash ? 'flash-on' : 'flash-off'} size={22} color={flash ? theme.textOnPrimary : '#FFF'} />
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
            onPress={handlePickImage}
          >
            <MaterialIcons name="photo-library" size={26} color="#FFF" />
            <Text style={styles.sideBtnLabel}>Gallery</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.captureOuter,
              pressed && { transform: [{ scale: 0.92 }] },
              isCapturing && { opacity: 0.5 },
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.captureInner}>
              {isCapturing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null}
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
            onPress={handleFlip}
          >
            <MaterialIcons name="flip-camera-ios" size={26} color="#FFF" />
            <Text style={styles.sideBtnLabel}>Flip</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  topActions: { flexDirection: 'row', gap: 12 },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  topBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 28,
    paddingHorizontal: 40,
  },
  sideBtn: { alignItems: 'center', gap: 6, width: 60 },
  sideBtnLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: 4,
  },
  captureInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webContent: { alignItems: 'center', paddingHorizontal: 40, gap: 16 },
  webIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    marginBottom: 8,
  },
  webTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, textAlign: 'center' },
  webDesc: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
  webGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  webGalleryText: { fontSize: 15, fontWeight: '600', color: theme.primary },
});
