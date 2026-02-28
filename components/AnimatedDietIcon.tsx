import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

interface AnimatedDietIconProps {
  type: 'veg' | 'egg' | 'nonveg';
  isSelected: boolean;
  size?: number;
}

export default function AnimatedDietIcon({ type, isSelected, size = 64 }: AnimatedDietIconProps) {
  // Shared animation values
  const bounce = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const particle1 = useSharedValue(0);
  const particle2 = useSharedValue(0);
  const particle3 = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const wobble = useSharedValue(0);
  const popScale = useSharedValue(0.8);

  // Entrance animation
  useEffect(() => {
    popScale.value = withSpring(1, { damping: 8, stiffness: 120 });
  }, []);

  // Idle animation
  useEffect(() => {
    // Gentle bounce
    bounce.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Subtle rotation
    wobble.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Shimmer effect
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Selection celebration
  useEffect(() => {
    if (isSelected) {
      // Pop scale
      scale.value = withSequence(
        withSpring(1.25, { damping: 4, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 100 })
      );

      // Spin
      rotate.value = withSequence(
        withTiming(360, { duration: 500, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      );

      // Burst particles
      particle1.value = 0;
      particle2.value = 0;
      particle3.value = 0;
      particle1.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      particle2.value = withDelay(100, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
      particle3.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    } else {
      scale.value = withTiming(1, { duration: 200 });
      rotate.value = withTiming(0, { duration: 200 });
    }
  }, [isSelected]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: popScale.value * scale.value },
      { translateY: bounce.value },
      { rotate: `${rotate.value + wobble.value}deg` },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: isSelected ? interpolate(shimmer.value, [0, 1], [0.2, 0.6]) : 0,
    transform: [{ scale: interpolate(shimmer.value, [0, 1], [0.9, 1.1]) }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle1.value, [0, 0.3, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(particle1.value, [0, 1], [0, -28]) },
      { translateY: interpolate(particle1.value, [0, 1], [0, -32]) },
      { scale: interpolate(particle1.value, [0, 0.5, 1], [0.3, 1.2, 0]) },
    ],
  }));

  const particle2Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle2.value, [0, 0.3, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(particle2.value, [0, 1], [0, 24]) },
      { translateY: interpolate(particle2.value, [0, 1], [0, -28]) },
      { scale: interpolate(particle2.value, [0, 0.5, 1], [0.3, 1, 0]) },
    ],
  }));

  const particle3Style = useAnimatedStyle(() => ({
    opacity: interpolate(particle3.value, [0, 0.3, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(particle3.value, [0, 1], [0, 18]) },
      { translateY: interpolate(particle3.value, [0, 1], [0, 26]) },
      { scale: interpolate(particle3.value, [0, 0.5, 1], [0.3, 1.1, 0]) },
    ],
  }));

  const getContent = () => {
    switch (type) {
      case 'veg':
        return <VegIllustration size={size} isSelected={isSelected} />;
      case 'egg':
        return <EggIllustration size={size} isSelected={isSelected} />;
      case 'nonveg':
        return <NonVegIllustration size={size} isSelected={isSelected} />;
    }
  };

  const getParticles = () => {
    switch (type) {
      case 'veg':
        return ['🌿', '🍃', '✨'];
      case 'egg':
        return ['🥚', '⭐', '✨'];
      case 'nonveg':
        return ['🔥', '✨', '💫'];
    }
  };

  const particles = getParticles();

  return (
    <View style={[styles.wrapper, { width: size + 20, height: size + 20 }]}>
      {/* Shimmer ring */}
      <Animated.View style={[styles.shimmerRing, shimmerStyle, {
        width: size + 16,
        height: size + 16,
        borderRadius: (size + 16) / 2,
        borderColor: type === 'veg' ? '#10B981' : type === 'egg' ? '#F59E0B' : '#EF4444',
      }]} />

      {/* Particles */}
      <Animated.Text style={[styles.particle, particle1Style]}>{particles[0]}</Animated.Text>
      <Animated.Text style={[styles.particle, particle2Style]}>{particles[1]}</Animated.Text>
      <Animated.Text style={[styles.particle, particle3Style]}>{particles[2]}</Animated.Text>

      {/* Main icon */}
      <Animated.View style={containerStyle}>
        {getContent()}
      </Animated.View>
    </View>
  );
}

// Vegetarian illustration - animated leafy bowl
function VegIllustration({ size, isSelected }: { size: number; isSelected: boolean }) {
  const leaf1Rotate = useSharedValue(0);
  const leaf2Rotate = useSharedValue(0);
  const stemGrow = useSharedValue(0);

  useEffect(() => {
    leaf1Rotate.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    leaf2Rotate.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    stemGrow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const leaf1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leaf1Rotate.value}deg` }],
  }));

  const leaf2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${leaf2Rotate.value}deg` }],
  }));

  const stemStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: stemGrow.value }],
  }));

  return (
    <View style={[styles.illustrationContainer, { width: size, height: size }]}>
      <View style={[styles.vegBowl, isSelected && styles.vegBowlActive]}>
        {/* Bowl emoji base */}
        <Text style={{ fontSize: size * 0.45 }}>🥗</Text>
        {/* Animated leaf accents */}
        <Animated.Text style={[styles.vegLeaf1, leaf1Style, { fontSize: size * 0.22 }]}>🌿</Animated.Text>
        <Animated.Text style={[styles.vegLeaf2, leaf2Style, { fontSize: size * 0.18 }]}>🍃</Animated.Text>
        <Animated.View style={[styles.vegStem, stemStyle]}>
          <Text style={{ fontSize: size * 0.15 }}>🌱</Text>
        </Animated.View>
      </View>
    </View>
  );
}

// Egg illustration - animated egg with sunny-side effect
function EggIllustration({ size, isSelected }: { size: number; isSelected: boolean }) {
  const yolkPulse = useSharedValue(1);
  const steamOpacity = useSharedValue(0);
  const steamY = useSharedValue(0);
  const crackRotate = useSharedValue(0);

  useEffect(() => {
    // Yolk breathing
    yolkPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Steam rising
    steamOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      true
    );

    steamY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    crackRotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const yolkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: yolkPulse.value }],
  }));

  const steamStyle = useAnimatedStyle(() => ({
    opacity: steamOpacity.value,
    transform: [{ translateY: steamY.value }],
  }));

  const crackStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crackRotate.value}deg` }],
  }));

  return (
    <View style={[styles.illustrationContainer, { width: size, height: size }]}>
      <View style={[styles.eggContainer, isSelected && styles.eggContainerActive]}>
        {/* Steam wisps */}
        <Animated.Text style={[styles.steam, steamStyle, { fontSize: size * 0.12 }]}>
          ~
        </Animated.Text>
        {/* Main egg */}
        <Animated.View style={yolkStyle}>
          <Text style={{ fontSize: size * 0.45 }}>🍳</Text>
        </Animated.View>
        {/* Decorative elements */}
        <Animated.Text style={[styles.eggCrack, crackStyle, { fontSize: size * 0.18 }]}>🥚</Animated.Text>
      </View>
    </View>
  );
}

// Non-veg illustration - animated drumstick with sizzle
function NonVegIllustration({ size, isSelected }: { size: number; isSelected: boolean }) {
  const flameDance = useSharedValue(0);
  const sizzle1 = useSharedValue(0);
  const sizzle2 = useSharedValue(0);
  const drumstickWobble = useSharedValue(0);

  useEffect(() => {
    // Flame dance
    flameDance.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Sizzle effects
    sizzle1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );

    sizzle2.value = withDelay(250,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        true
      )
    );

    // Wobble
    drumstickWobble.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flameDance.value, [0, 1], [0.6, 1]),
    transform: [
      { scaleY: interpolate(flameDance.value, [0, 1], [0.85, 1.15]) },
      { translateY: interpolate(flameDance.value, [0, 1], [0, -3]) },
    ],
  }));

  const sizzle1Style = useAnimatedStyle(() => ({
    opacity: interpolate(sizzle1.value, [0, 0.5, 1], [0, 0.8, 0]),
    transform: [
      { translateY: interpolate(sizzle1.value, [0, 1], [0, -12]) },
      { translateX: -8 },
    ],
  }));

  const sizzle2Style = useAnimatedStyle(() => ({
    opacity: interpolate(sizzle2.value, [0, 0.5, 1], [0, 0.7, 0]),
    transform: [
      { translateY: interpolate(sizzle2.value, [0, 1], [0, -10]) },
      { translateX: 10 },
    ],
  }));

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${drumstickWobble.value}deg` }],
  }));

  return (
    <View style={[styles.illustrationContainer, { width: size, height: size }]}>
      <View style={[styles.nonvegContainer, isSelected && styles.nonvegContainerActive]}>
        {/* Sizzle sparks */}
        <Animated.Text style={[styles.sizzle, sizzle1Style, { fontSize: size * 0.1 }]}>💨</Animated.Text>
        <Animated.Text style={[styles.sizzle, sizzle2Style, { fontSize: size * 0.09 }]}>💨</Animated.Text>
        {/* Flame */}
        <Animated.Text style={[styles.flame, flameStyle, { fontSize: size * 0.2 }]}>🔥</Animated.Text>
        {/* Drumstick */}
        <Animated.View style={wobbleStyle}>
          <Text style={{ fontSize: size * 0.45 }}>🍗</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shimmerRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  particle: {
    position: 'absolute',
    fontSize: 16,
    zIndex: 10,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Veg styles
  vegBowl: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vegBowlActive: {},
  vegLeaf1: {
    position: 'absolute',
    top: -4,
    left: -2,
  },
  vegLeaf2: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  vegStem: {
    position: 'absolute',
    bottom: -2,
    right: 4,
  },
  // Egg styles
  eggContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eggContainerActive: {},
  steam: {
    position: 'absolute',
    top: -6,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
  eggCrack: {
    position: 'absolute',
    bottom: -2,
    right: -6,
  },
  // Non-veg styles
  nonvegContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  nonvegContainerActive: {},
  flame: {
    position: 'absolute',
    top: -8,
    left: 2,
  },
  sizzle: {
    position: 'absolute',
    top: 0,
  },
});
