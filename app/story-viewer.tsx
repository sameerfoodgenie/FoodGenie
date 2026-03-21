import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { usePosts, StoryGroup } from '../contexts/PostContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PROGRESS_GAP = 3;

export default function StoryViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { storyGroups, markStorySeen } = usePosts();

  // Find starting group index
  const startIdx = storyGroups.findIndex(g => g.userId === params.userId);
  const [groupIndex, setGroupIndex] = useState(Math.max(startIdx, 0));
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const storyCount = currentGroup?.stories.length || 0;

  // Progress animation
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  const goNextStory = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < storyCount - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      router.back();
    }
  }, [storyIndex, storyCount, groupIndex, storyGroups.length, currentGroup, router]);

  const goPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup ? prevGroup.stories.length - 1 : 0);
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Mark seen when viewing
  useEffect(() => {
    if (currentGroup?.hasUnseen) {
      markStorySeen(currentGroup.userId);
    }
  }, [currentGroup?.userId]);

  // Animate progress bar + auto-advance
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const duration = currentStory.duration || 5000;
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();

    progress.value = 0;
    progress.value = withTiming(1, { duration }, (finished) => {
      if (finished) {
        runOnJS(goNextStory)();
      }
    });

    return () => {
      cancelAnimation(progress);
    };
  }, [groupIndex, storyIndex, isPaused, currentStory]);

  // Handle tap zones
  const handleTap = useCallback((x: number) => {
    Haptics.selectionAsync();
    if (x < SCREEN_W * 0.3) {
      goPrevStory();
    } else {
      goNextStory();
    }
  }, [goPrevStory, goNextStory]);

  const handleLongPressIn = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleLongPressOut = useCallback(() => {
    setIsPaused(false);
  }, []);

  if (!currentGroup || !currentStory) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <MaterialIcons name="close" size={28} color="#FFF" />
        </Pressable>
      </View>
    );
  }

  // Build progress bar segments
  const progressBarWidth = SCREEN_W - 32;
  const segmentWidth = (progressBarWidth - PROGRESS_GAP * (storyCount - 1)) / storyCount;

  return (
    <View style={styles.container}>
      {/* Story image */}
      <Image
        source={{ uri: currentStory.imageUri }}
        style={styles.storyImage}
        contentFit="cover"
        transition={150}
      />

      {/* Dark overlay for top/bottom readability */}
      <View style={styles.topGradient} />
      <View style={styles.bottomGradient} />

      {/* Tap zones */}
      <Pressable
        style={styles.tapZone}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        onLongPress={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={200}
      />

      {/* Progress bars */}
      <View style={[styles.progressRow, { top: insets.top + 8, width: progressBarWidth }]}>
        {currentGroup.stories.map((_, idx) => {
          const isActive = idx === storyIndex;
          const isPast = idx < storyIndex;

          return (
            <View
              key={idx}
              style={[
                styles.progressBg,
                { width: segmentWidth },
              ]}
            >
              {isPast ? (
                <View style={[styles.progressFill, { width: '100%' }]} />
              ) : isActive ? (
                <ProgressSegment progress={progress} />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* User info */}
      <View style={[styles.userRow, { top: insets.top + 24 }]}>
        <View style={styles.userInfo}>
          <View style={styles.storyAvatar}>
            <Text style={styles.storyAvatarText}>{currentGroup.avatarInitials}</Text>
          </View>
          <Text style={styles.storyUsername}>{currentGroup.username}</Text>
          <Text style={styles.storyTime}>{timeAgo(currentStory.timestamp)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.closeStoryBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
        >
          <MaterialIcons name="close" size={26} color="#FFF" />
        </Pressable>
      </View>

      {/* Caption */}
      {currentStory.caption ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.captionWrap, { bottom: insets.bottom + 40 }]}
        >
          <Text style={styles.captionText}>{currentStory.caption}</Text>
        </Animated.View>
      ) : null}

      {/* Paused indicator */}
      {isPaused ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.pausedOverlay}>
          <MaterialIcons name="pause" size={48} color="rgba(255,255,255,0.5)" />
        </Animated.View>
      ) : null}
    </View>
  );
}

function ProgressSegment({ progress }: { progress: Animated.SharedValue<number> }) {
  const animStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return <Animated.View style={[styles.progressFill, animStyle]} />;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'transparent',
    // Using a pseudo-gradient with opacity layers
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tapZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // Progress
  progressRow: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    gap: PROGRESS_GAP,
    zIndex: 20,
  },
  progressBg: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#FFF',
  },

  // User info
  userRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  storyAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  storyUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  closeStoryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 20,
  },

  // Caption
  captionWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  captionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    lineHeight: 22,
  },

  // Paused
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
});
