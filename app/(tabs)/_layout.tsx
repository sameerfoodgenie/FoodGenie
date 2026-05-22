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
        colors={focused ? ['#F5B731', '#D9A020'] : ['#FFFDF8', '#FFF9F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.postTabBtn}
      >
        <MaterialIcons
          name="add"
          size={30}
          color={focused ? '#FFFFFF' : '#F5B731'}
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
      ios: insets.bottom + 68,
      android: insets.bottom + 68,
      default: 74,
    }),
    paddingTop: 10,
    paddingBottom: Platform.select({
      ios: insets.bottom + 10,
      android: insets.bottom + 10,
      default: 10,
    }),
    paddingHorizontal: 4,
    backgroundColor: colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    shadowColor: '#1E1456',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  };

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#F5B731',
        tabBarInactiveTintColor: '#9A9AB0',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'home-filled' : 'home'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="foodies"
        options={{
          title: 'Foodies',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="local-fire-department" size={25} color={color} />
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
      <Tabs.Screen name="master-chefs" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'person' : 'person-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="grocery" options={{ href: null }} />
      <Tabs.Screen name="cook" options={{ href: null }} />
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
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(245,183,49,0.18)',
  },
  postTabBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245,183,49,0.35)',
    shadowColor: '#F5B731',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
});
