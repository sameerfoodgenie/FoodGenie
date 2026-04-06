import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_H = SCREEN_W * 0.5625; // 16:9

export default function EpisodePlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    videoUri?: string;
    title?: string;
    description?: string;
    imageUri?: string;
    episodeNumber?: string;
  }>();

  const videoUri = params.videoUri || '';
  const title = params.title || 'Episode';
  const description = params.description || '';
  const imageUri = params.imageUri || '';
  const episodeNumber = params.episodeNumber || '';

  const isValidUrl = videoUri.startsWith('http://') || videoUri.startsWith('https://');
  const [hasError, setHasError] = useState(!isValidUrl);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const player = useVideoPlayer(isValidUrl ? videoUri : '', (p) => {
    p.loop = true;
    p.muted = true;
    if (isValidUrl) p.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (status === 'error') {
      setHasError(true);
    }
    if (status === 'readyToPlay' && showThumbnail) {
      // Small delay so thumbnail fades nicely
      const t = setTimeout(() => setShowThumbnail(false), 400);
      return () => clearTimeout(t);
    }
  }, [status, showThumbnail]);

  // Auto-hide controls after 4s of playback
  useEffect(() => {
    if (isPlaying && !showThumbnail) {
      const t = setTimeout(() => setShowControls(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isPlaying, showThumbnail, showControls]);

  const togglePlayPause = useCallback(() => {
    Haptics.selectionAsync();
    if (isPlaying) {
      player.pause();
      setShowControls(true);
    } else {
      player.play();
      setShowThumbnail(false);
    }
  }, [isPlaying, player]);

  const toggleMute = useCallback(() => {
    Haptics.selectionAsync();
    const newMuted = !isMuted;
    player.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted, player]);

  const handleTapVideo = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    try { player.pause(); } catch {}
    router.back();
  }, [player, router]);

  // ── Error / Unavailable state ──
  if (hasError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable
              style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { Haptics.selectionAsync(); router.back(); }}
            >
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.errorState}>
            <View style={[styles.errorIconWrap, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="videocam-off" size={56} color={colors.textMuted} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Video unavailable</Text>
            <Text style={[styles.errorSub, { color: colors.textMuted }]}>
              This video could not be loaded. It may have been removed or the URL is invalid.
            </Text>

            {/* Still show episode info */}
            {description ? (
              <View style={[styles.errorInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.errorInfoTitle, { color: colors.textPrimary }]}>{title}</Text>
                <Text style={[styles.errorInfoDesc, { color: colors.textSecondary }]}>{description}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.errorBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={[styles.errorBtnText, { color: colors.textSecondary }]}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* ── Video Area ── */}
        <Pressable style={styles.videoContainer} onPress={handleTapVideo}>
          <VideoView
            style={styles.video}
            player={player}
            contentFit="contain"
            nativeControls={false}
          />

          {/* Thumbnail overlay (visible until video is ready) */}
          {showThumbnail && imageUri ? (
            <Animated.View style={styles.thumbnailOverlay}>
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
                style={StyleSheet.absoluteFillObject}
              />
              {status === 'loading' ? (
                <View style={styles.thumbnailLoading}>
                  <ActivityIndicator size="large" color="#D4AF37" />
                  <Text style={styles.thumbnailLoadingText}>Loading video...</Text>
                </View>
              ) : (
                <Pressable style={styles.thumbnailPlayBtn} onPress={togglePlayPause}>
                  <View style={styles.playCircle}>
                    <MaterialIcons name="play-arrow" size={44} color="#FFF" />
                  </View>
                </Pressable>
              )}
            </Animated.View>
          ) : null}

          {/* Loading spinner during buffering (post-thumbnail) */}
          {status === 'loading' && !showThumbnail ? (
            <View style={styles.bufferingOverlay}>
              <ActivityIndicator size="large" color="#D4AF37" />
            </View>
          ) : null}

          {/* Overlay Controls */}
          {showControls && !showThumbnail ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.controlsOverlay}>
              {/* Top bar */}
              <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient}>
                <Pressable
                  style={({ pressed }) => [styles.overlayBtn, pressed && { opacity: 0.7 }]}
                  onPress={handleBack}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                </Pressable>
                <View style={styles.topControlsCenter}>
                  {episodeNumber ? (
                    <View style={styles.epBadge}>
                      <Text style={styles.epBadgeText}>EP {episodeNumber}</Text>
                    </View>
                  ) : null}
                </View>
                <Pressable
                  style={({ pressed }) => [styles.overlayBtn, pressed && { opacity: 0.7 }]}
                  onPress={toggleMute}
                >
                  <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="#FFF" />
                </Pressable>
              </LinearGradient>

              {/* Center play/pause */}
              {!isPlaying ? (
                <Pressable style={styles.centerPlay} onPress={togglePlayPause}>
                  <View style={styles.centerPlayCircle}>
                    <MaterialIcons name="play-arrow" size={52} color="#FFF" />
                  </View>
                </Pressable>
              ) : null}

              {/* Bottom gradient */}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.bottomGradient} />
            </Animated.View>
          ) : null}
        </Pressable>

        {/* ── Episode Info Section ── */}
        <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
          <Animated.View entering={FadeInDown.duration(350)} style={styles.infoContent}>
            {/* Episode header row */}
            <View style={styles.infoHeaderRow}>
              {episodeNumber ? (
                <View style={styles.infoEpNumber}>
                  <Text style={styles.infoEpNumberText}>{episodeNumber}</Text>
                </View>
              ) : null}
              <View style={styles.infoTitleBlock}>
                <Text style={[styles.infoTitle, { color: colors.textPrimary }]} numberOfLines={2}>{title}</Text>
              </View>
            </View>

            {description ? (
              <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{description}</Text>
            ) : null}

            {/* Playback controls bar */}
            <View style={styles.controlBar}>
              <Pressable
                style={({ pressed }) => [
                  styles.controlBarBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={togglePlayPause}
              >
                <MaterialIcons name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'} size={26} color="#D4AF37" />
                <Text style={[styles.controlBarLabel, { color: colors.textPrimary }]}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.controlBarBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={toggleMute}
              >
                <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={26} color="#D4AF37" />
                <Text style={[styles.controlBarLabel, { color: colors.textPrimary }]}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.controlBarBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  player.replay();
                  player.play();
                  setShowThumbnail(false);
                }}
              >
                <MaterialIcons name="replay" size={26} color="#D4AF37" />
                <Text style={[styles.controlBarLabel, { color: colors.textPrimary }]}>Replay</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Back button at bottom */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              style={({ pressed }) => [
                styles.backBottomBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleBack}
            >
              <MaterialIcons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={[styles.backBottomText, { color: colors.textSecondary }]}>Back to Episodes</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header (error state only) */
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },

  /* Error state */
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  errorIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: { fontSize: 22, fontWeight: '800' },
  errorSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  errorInfoCard: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  errorInfoTitle: { fontSize: 16, fontWeight: '700' },
  errorInfoDesc: { fontSize: 13, lineHeight: 18 },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorBtnText: { fontSize: 15, fontWeight: '700' },

  /* Video area */
  videoContainer: {
    width: SCREEN_W,
    height: VIDEO_H,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },

  /* Thumbnail overlay */
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  thumbnailLoading: {
    alignItems: 'center',
    gap: 10,
  },
  thumbnailLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  thumbnailPlayBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,175,55,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  /* Buffering */
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 4,
  },

  /* Controls overlay */
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    justifyContent: 'space-between',
  },
  topGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  overlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topControlsCenter: {
    flex: 1,
    alignItems: 'center',
  },
  epBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.40)',
  },
  epBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.8,
  },

  centerPlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  bottomGradient: {
    height: 32,
  },

  /* Info section */
  infoSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoEpNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    marginTop: 2,
  },
  infoEpNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#D4AF37',
  },
  infoTitleBlock: { flex: 1 },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  infoDesc: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  /* Control bar */
  controlBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  controlBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  controlBarLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Back bottom button */
  backBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  backBottomText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
