import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../contexts/AppContext';
import { AlertProvider, AuthProvider } from '@/template';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <StatusBar style="light" />
            <View style={styles.root}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="ai-thinking" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                <Stack.Screen name="results" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="decision-lens" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="recommendations" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="dish/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="trust-profile" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="voice-chat" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="daily-meals" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="partner-apps" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="explore" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="snap-share" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="ops/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="ops/onboard-restaurant" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="ops/restaurants" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="ops/restaurant-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="ops/add-dish" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="ops/add-dish-tags" options={{ headerShown: false, animation: 'slide_from_right' }} />
              </Stack>
            </View>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
});
