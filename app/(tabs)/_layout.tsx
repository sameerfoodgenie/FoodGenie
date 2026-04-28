import React, { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import OnboardingWalkthrough, { useOnboardingStatus } from '../../components/OnboardingWalkthrough';

function GlowingPlusButton({ focused }: { focused: boolean }) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.20);

  useEffect(() => {
    glowScale.value = withRepeat(
      withTiming(1.4, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withTiming(0.50, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.postTabWrap}>
      <Animated.View style={[styles.glowRing, glowStyle]} />
      <LinearGradient
        colors={focused ? ['#FFD700', '#D4AF37'] : ['#F4F4F8', '#ECECF0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.postTabBtn}
      >
        <MaterialIcons
          name="add"
          size={30}
          color={focused ? '#FFFFFF' : '#D4AF37'}
        />
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { hasCompleted, markComplete } = useOnboardingStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (hasCompleted === false) {
      setShowOnboarding(true);
    }
  }, [hasCompleted]);

  const handleOnboardingComplete = () => {
    markComplete();
    setShowOnboarding(false);
  };

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 64,
      android: insets.bottom + 64,
      default: 72,
    }),
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: insets.bottom + 8,
      android: insets.bottom + 8,
      default: 8,
    }),
    paddingHorizontal: 8,
    backgroundColor: colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
  };

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'home-filled' : 'home'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="foodies"
        options={{
          title: 'Foodies',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'local-fire-department' : 'local-fire-department'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <GlowingPlusButton focused={focused} />,
          tabBarLabelStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="cook"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Hide unused tabs */}
      <Tabs.Screen name="preferences" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="plans" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
    </Tabs>
    {showOnboarding ? (
      <OnboardingWalkthrough onComplete={handleOnboardingComplete} />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  postTabWrap: {
    marginTop: -26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.18)',
  },
  postTabBtn: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.25)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
});
