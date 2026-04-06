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
  const translateY = useSharedValue(-130);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const coinScale = useSharedValue(0.3);
  const amountScale = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 11, stiffness: 180 });

    coinScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    );

    amountScale.value = withDelay(200, withSequence(
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10 }),
    ));

    const exitDelay = 2200;
    translateY.value = withDelay(exitDelay, withTiming(-130, { duration: 350, easing: Easing.in(Easing.cubic) }));
    opacity.value = withDelay(exitDelay, withTiming(0, { duration: 350 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  const displayReason = reason
    .replace('post_food', 'Posted a meal')
    .replace('share_post', 'Shared a post')
    .replace('like_post', 'Liked a post')
    .replace('watch_reel', 'Watched a reel')
    .replace('follow_creator', 'Followed a creator')
    .replace('daily_login', 'Daily Login Bonus')
    .replace(/streak_bonus_\d+/, 'Streak Bonus')
    .replace('Daily Login + ', '')
    .replace('-day Streak Bonus', '-day Streak');

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View style={[styles.container, containerStyle]}>
        <LinearGradient
          colors={['#FFF8E1', '#FFECB3', '#FFF3E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.coinWrap}>
            <View style={styles.coinGlow} />
            <Animated.View style={coinStyle}>
              <Image
                source={require('../assets/images/genie-coin.png')}
                style={styles.coinImage}
                contentFit="contain"
              />
            </Animated.View>
          </View>

          <View style={styles.textBlock}>
            <Animated.View style={amountStyle}>
              <Text style={styles.amountText}>+{amount} Genie Coins</Text>
            </Animated.View>
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: SCREEN_W - 40,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.30)',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  coinWrap: {
    position: 'relative',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,215,0,0.25)',
    top: -7,
    left: -7,
  },
  coinImage: {
    width: 46,
    height: 46,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#8B6914',
    letterSpacing: -0.3,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(139,105,20,0.60)',
  },
  sparkle: {
    fontSize: 22,
  },
});
