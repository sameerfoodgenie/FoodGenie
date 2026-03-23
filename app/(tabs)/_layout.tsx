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
import OnboardingWalkthrough, { useOnboardingStatus } from '../../components/OnboardingWalkthrough';

function GlowingPlusButton({ focused }: { focused: boolean }) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.25);

  useEffect(() => {
    glowScale.value = withRepeat(
      withTiming(1.35, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    glowOpacity.value = withRepeat(
      withTiming(0.55, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
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
        colors={focused ? ['#FFD700', '#D4AF37'] : ['#1A1A1A', '#151515']}
        style={styles.postTabBtn}
      >
        <MaterialIcons
          name="add"
          size={32}
          color={focused ? '#0A0A0A' : '#A0A0A0'}
        />
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
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
      ios: insets.bottom + 60,
      android: insets.bottom + 60,
      default: 68,
    }),
    paddingTop: 6,
    paddingBottom: Platform.select({
      ios: insets.bottom + 6,
      android: insets.bottom + 6,
      default: 6,
    }),
    paddingHorizontal: 32,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.08)',
  };

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#6B6B6B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
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
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'school' : 'school'} size={26} color={color} />
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'person' : 'person-outline'} size={26} color={color} />
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
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.25)',
  },
  postTabBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.35)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
