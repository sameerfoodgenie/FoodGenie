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
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { theme } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_WEB = Platform.OS === 'web';
const MAX_RECORD_SEC = 120;

type CameraMode = 'photo' | 'video' | 'live';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Mode toggle
  const [mode, setMode] = useState<CameraMode>('photo');

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video preview state
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);

  // Record progress animation
  const recordProgress = useSharedValue(0);
  const recDotOpacity = useSharedValue(1);

  useEffect(() => {
    if (!IS_WEB) {
      const requestPerms = async () => {
        if (!permission?.granted) {
          const camResult = await requestPermission();
          if (!camResult.granted) { setPermissionDenied(true); return; }
        }
        if (!micPermission?.granted) {
          await requestMicPermission();
        }
      };
      requestPerms();
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Pulsing REC dot when recording
  useEffect(() => {
    if (isRecording) {
      recDotOpacity.value = withRepeat(
        withTiming(0.2, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(recDotOpacity);
      recDotOpacity.value = 1;
    }
  }, [isRecording]);

  // ─── Photo Capture ───
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

  // ─── Video Recording (tap to start / tap to stop) ───
  const toggleRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Stop recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current.stopRecording();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      cancelAnimation(recordProgress);
      recordProgress.value = 0;
    } else {
      // Ensure mic permission on Android before recording
      if (Platform.OS === 'android' && !micPermission?.granted) {
        const micResult = await requestMicPermission();
        if (!micResult.granted) {
          console.log('Microphone permission denied');
          return;
        }
      }

      // Start recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      setRecordSeconds(0);
      recordProgress.value = 0;

      // Progress bar animation
      recordProgress.value = withTiming(1, {
        duration: MAX_RECORD_SEC * 1000,
        easing: Easing.linear,
      });

      // Timer
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= MAX_RECORD_SEC - 1) {
            // Auto-stop at max
            cameraRef.current?.stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: MAX_RECORD_SEC });
        // Recording finished (either stopped manually or max duration)
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        cancelAnimation(recordProgress);
        recordProgress.value = 0;

        if (video?.uri) {
          setRecordedVideoUri(video.uri);
        }
      } catch (e) {
        console.log('Record error:', e);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, [isRecording]);

  // ─── Gallery Picker ───
  const handlePickImage = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mode === 'video' ? ['videos'] : ['images'],
        quality: 0.85,
        allowsEditing: true,
        ...(mode === 'photo' ? { aspect: [4, 5] } : { videoMaxDuration: 600 }),
      });
      if (!result.canceled && result.assets[0]?.uri) {
        if (mode === 'video') {
          setRecordedVideoUri(result.assets[0].uri);
        } else {
          router.push({ pathname: '/create-post', params: { imageUri: result.assets[0].uri } });
        }
      }
    } catch (e) {
      console.log('Gallery error:', e);
    }
  }, [router, mode]);

  const handleFlip = useCallback(() => {
    Haptics.selectionAsync();
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handleFlash = useCallback(() => {
    Haptics.selectionAsync();
    setFlash(prev => !prev);
  }, []);

  const switchMode = useCallback((newMode: CameraMode) => {
    if (newMode === mode) return;
    if (newMode === 'live') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return; // Future-ready, no action
    }
    Haptics.selectionAsync();
    setMode(newMode);
  }, [mode]);

  // ─── Use Recorded Video ───
  const handleUseVideo = useCallback(() => {
    if (!recordedVideoUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/upload-recipe', params: { videoUri: recordedVideoUri } });
    setTimeout(() => setRecordedVideoUri(null), 500);
  }, [recordedVideoUri, router]);

  const handleRetake = useCallback(() => {
    Haptics.selectionAsync();
    setRecordedVideoUri(null);
    setRecordSeconds(0);
  }, []);

  // ─── Animated Styles ───
  const progressStyle = useAnimatedStyle(() => ({
    width: `${recordProgress.value * 100}%`,
  }));

  const recDotStyle = useAnimatedStyle(() => ({
    opacity: recDotOpacity.value,
  }));

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─── Video Player ───
  const videoPlayer = useVideoPlayer(recordedVideoUri || '', (player) => {
    player.loop = true;
    if (recordedVideoUri) player.play();
  });

  // ─── Video Preview ───
  if (recordedVideoUri) {
    return (
      <View style={styles.container}>
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.2, 0.65, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
          {/* Top bar */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.previewTopBar}>
            <Pressable
              style={({ pressed }) => [styles.previewBackBtn, pressed && { opacity: 0.7 }]}
              onPress={handleRetake}
            >
              <MaterialIcons name="close" size={22} color="#FFF" />
            </Pressable>
            <View style={styles.previewBadge}>
              <MaterialIcons name="videocam" size={16} color={theme.primary} />
              <Text style={styles.previewBadgeText}>{formatTime(recordSeconds)}</Text>
            </View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          {/* Bottom actions */}
          <Animated.View entering={FadeInUp.duration(350)} style={styles.previewBottom}>
            <Text style={styles.previewTitle}>Recipe Video Ready</Text>
            <Text style={styles.previewDesc}>
              Use this video for your recipe or retake
            </Text>
            <View style={styles.previewActions}>
              <Pressable
                style={({ pressed }) => [styles.retakeBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                onPress={handleRetake}
              >
                <MaterialIcons name="replay" size={20} color="#FFF" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.useVideoBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
                onPress={handleUseVideo}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.useVideoBtnInner}>
                  <MaterialIcons name="restaurant-menu" size={20} color={theme.textOnPrimary} />
                  <Text style={styles.useVideoBtnText}>Use for Recipe</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Web Fallback ───
  if (IS_WEB) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.webFallback}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.webContent}>
            <View style={styles.webIconWrap}>
              <MaterialIcons name="camera-alt" size={48} color={theme.primary} />
            </View>
            <Text style={styles.webTitle}>Capture a Meal</Text>
            <Text style={styles.webDesc}>
              Camera works on mobile. Use gallery to upload a photo or video.
            </Text>
            <View style={styles.webBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.webGalleryBtn, pressed && { opacity: 0.8 }]}
                onPress={() => { setMode('photo'); handlePickImage(); }}
              >
                <MaterialIcons name="photo-library" size={20} color={theme.primary} />
                <Text style={styles.webGalleryText}>Photo</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.webGalleryBtn, styles.webVideoBtn, pressed && { opacity: 0.8 }]}
                onPress={() => { setMode('video'); handlePickImage(); }}
              >
                <MaterialIcons name="video-library" size={20} color={theme.accent} />
                <Text style={[styles.webGalleryText, { color: theme.accent }]}>Video</Text>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Permission Denied ───
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

  // ─── Main Camera ───
  return (
    <View style={styles.container}>
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash ? 'on' : 'off'}
          mode={mode === 'video' ? 'video' : 'picture'}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}>
          <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
        </View>
      )}

      {/* Recording progress bar at top */}
      {isRecording ? (
        <View style={styles.recordProgressBar}>
          <Animated.View style={[styles.recordProgressFill, progressStyle]} />
        </View>
      ) : null}

      <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            {isRecording ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.recordingIndicator}>
                <Animated.View style={[styles.recDot, recDotStyle]} />
                <Text style={styles.recLabel}>REC</Text>
                <View style={styles.recTimerWrap}>
                  <Text style={styles.recTimerText}>{formatTime(recordSeconds)}</Text>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={styles.topLabel}>
                  {mode === 'photo' ? 'New Post' : mode === 'video' ? 'Record Recipe' : 'Go Live'}
                </Text>
              </Animated.View>
            )}
          </View>
          <View style={styles.topActions}>
            {!isRecording ? (
              <Pressable
                style={({ pressed }) => [styles.topBtn, flash && styles.topBtnActive, pressed && { opacity: 0.7 }]}
                onPress={handleFlash}
              >
                <MaterialIcons name={flash ? 'flash-on' : 'flash-off'} size={22} color={flash ? theme.textOnPrimary : '#FFF'} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Mode selector — Photo / Video / Live */}
        {!isRecording ? (
          <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.modeSwitcher}>
            {(['photo', 'video', 'live'] as CameraMode[]).map((m) => {
              const isActive = mode === m;
              const isLive = m === 'live';
              return (
                <Pressable
                  key={m}
                  style={[styles.modeTab, isActive && styles.modeTabActive]}
                  onPress={() => switchMode(m)}
                >
                  {isActive ? (
                    <View style={styles.modeTabDot} />
                  ) : null}
                  <Text style={[
                    styles.modeTabText,
                    isActive && styles.modeTabTextActive,
                    isLive && !isActive && styles.modeTabTextLive,
                  ]}>
                    {m === 'photo' ? 'PHOTO' : m === 'video' ? 'VIDEO' : 'LIVE'}
                  </Text>
                  {isLive ? (
                    <View style={styles.comingSoonDot}>
                      <Text style={styles.comingSoonText}>SOON</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          {/* Gallery */}
          <Pressable
            style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }, isRecording && { opacity: 0.3 }]}
            onPress={!isRecording ? handlePickImage : undefined}
            disabled={isRecording}
          >
            <MaterialIcons name={mode === 'video' ? 'video-library' : 'photo-library'} size={26} color="#FFF" />
            <Text style={styles.sideBtnLabel}>Gallery</Text>
          </Pressable>

          {/* Capture / Record button — single tap for both */}
          {mode === 'photo' ? (
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
          ) : mode === 'video' ? (
            <Pressable
              onPress={toggleRecording}
              style={({ pressed }) => [pressed && !isRecording && { transform: [{ scale: 0.92 }] }]}
            >
              {isRecording ? (
                /* Recording active — show red ring + stop square */
                <Animated.View entering={FadeIn.duration(150)} style={styles.recordOuterActive}>
                  <View style={styles.recordOuterRingActive} />
                  <View style={styles.recordStopIcon} />
                </Animated.View>
              ) : (
                /* Idle — show white ring + red circle */
                <View style={styles.recordOuter}>
                  <View style={styles.recordOuterRing} />
                  <View style={styles.recordInnerCircle} />
                </View>
              )}
            </Pressable>
          ) : (
            /* Live mode (future) — disabled button */
            <View style={[styles.captureOuter, { opacity: 0.35 }]}>
              <LinearGradient colors={['#FF3B30', '#CC2D25']} style={styles.liveCapture}>
                <MaterialIcons name="cell-tower" size={28} color="#FFF" />
              </LinearGradient>
            </View>
          )}

          {/* Flip */}
          <Pressable
            style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }, isRecording && { opacity: 0.3 }]}
            onPress={!isRecording ? handleFlip : undefined}
            disabled={isRecording}
          >
            <MaterialIcons name="flip-camera-ios" size={26} color="#FFF" />
            <Text style={styles.sideBtnLabel}>Flip</Text>
          </Pressable>
        </View>

        {/* Hint text */}
        {!isRecording ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.holdHint}>
            <Text style={styles.holdHintText}>
              {mode === 'photo'
                ? 'Tap to capture'
                : mode === 'video'
                  ? 'Tap to start recording · Tap again to stop'
                  : 'Live streaming coming soon'}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(200)} style={styles.holdHint}>
            <Text style={styles.holdHintText}>Tap the stop button to finish recording</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  // Top bar
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

  // Recording indicator — REC badge + timer
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 1,
  },
  recTimerWrap: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 2,
  },
  recTimerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },

  // Record progress bar
  recordProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 100,
  },
  recordProgressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },

  // Mode switcher — 3 tabs
  modeSwitcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.50)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modeTab: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modeTabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4AF37',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
  modeTabTextActive: {
    color: '#FFF',
  },
  modeTabTextLive: {
    color: 'rgba(255,255,255,0.25)',
  },
  comingSoonDot: {
    backgroundColor: 'rgba(255,59,48,0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FF3B30',
    letterSpacing: 0.5,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 28,
    paddingHorizontal: 40,
  },
  sideBtn: { alignItems: 'center', gap: 6, width: 60 },
  sideBtnLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  // Photo capture button
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

  // Video record button (idle)
  recordOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordOuterRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  recordInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
  },

  // Video record button (recording active)
  recordOuterActive: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordOuterRingActive: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#EF4444',
  },
  recordStopIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },

  // Live capture (future)
  liveCapture: {
    flex: 1,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hint
  holdHint: {
    alignSelf: 'center',
    paddingBottom: 12,
  },
  holdHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.40)',
    textAlign: 'center',
  },

  // ─── Video Preview ───
  previewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  previewBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  previewBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  previewBottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  previewDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retakeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  useVideoBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  useVideoBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  useVideoBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textOnPrimary,
  },

  // ─── Web Fallback ───
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
  webBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  webGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  webVideoBtn: {
    borderColor: 'rgba(255,193,7,0.2)',
  },
  webGalleryText: { fontSize: 15, fontWeight: '600', color: '#D4AF37' },
});
