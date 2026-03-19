import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 64,
      android: insets.bottom + 64,
      default: 72,
    }),
    paddingTop: 6,
    paddingBottom: Platform.select({
      ios: insets.bottom + 6,
      android: insets.bottom + 6,
      default: 6,
    }),
    paddingHorizontal: 24,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
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
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home-filled" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <View style={styles.cameraTabIcon}>
              <LinearGradient
                colors={focused ? theme.gradients.cameraBtn : ['#2A2A35', '#2A2A35']}
                style={styles.cameraTabGradient}
              >
                <MaterialIcons
                  name="camera-alt"
                  size={28}
                  color={focused ? theme.textOnPrimary : theme.textMuted}
                />
              </LinearGradient>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: -4,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
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
  );
}

const styles = StyleSheet.create({
  cameraTabIcon: {
    marginTop: -16,
    ...theme.shadows.neonGreen,
  },
  cameraTabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74,222,128,0.3)',
  },
});
