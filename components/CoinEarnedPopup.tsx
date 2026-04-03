import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '../hooks/useCoin';

const SCREEN_W = Dimensions.get('window').width;

export default function CoinEarnedPopup() {
  const { coinAnimation } = useCoin();

  if (!coinAnimation?.visible) return null;

  return <CoinPopupContent amount={coinAnimation.amount} reason={coinAnimation.reason} icon={coinAnimation.icon} />;
}

function CoinPopupContent({ amount, reason, icon }: { amount: number; reason: string; icon: string }) {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const coinRotate = useSharedValue(0);

  useEffect(() => {
    // Enter animation
    translateY.value = withSpring(0, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    coinRotate.value = withSequence(
      withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 }),
    );

    // Exit animation
    const exitDelay = 2000;
    translateY.value = withDelay(exitDelay, withTiming(-120, { duration: 400, easing: Easing.in(Easing.cubic) }));
    opacity.value = withDelay(exitDelay, withTiming(0, { duration: 400 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${coinRotate.value}deg` }],
  }));

  const displayReason = reason
    .replace('post_food', 'Posted a meal')
    .replace('share_post', 'Shared a post')
    .replace('like_post', 'Liked a post')
    .replace('watch_reel', 'Watched a reel')
    .replace('follow_creator', 'Followed a creator')
    .replace('daily_login', 'Daily Login Bonus')
    .replace(/streak_bonus_\d+/, 'Streak Bonus');

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View style={[styles.container, containerStyle]}>
        <LinearGradient
          colors={['#1A1A2E', '#0A0A0F']}
          style={styles.gradient}
        >
          <Animated.View style={coinStyle}>
            <Image
              source={require('../assets/images/genie-coin.png')}
              style={styles.coinImage}
              contentFit="contain"
            />
          </Animated.View>
          <View style={styles.textBlock}>
            <Text style={styles.amountText}>+{amount} Genie Coins</Text>
            <Text style={styles.reasonText} numberOfLines={1}>{displayReason}</Text>
          </View>
          <Text style={styles.sparkle}>✨</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
    maxWidth: SCREEN_W - 48,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.35)',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  coinImage: {
    width: 40,
    height: 40,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: -0.3,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.60)',
  },
  sparkle: {
    fontSize: 20,
  },
});
