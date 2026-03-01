import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../contexts/AppContext';
import { AlertProvider, AuthProvider } from '@/template';
import SplashScreen from '../components/SplashScreen';

function MainApp() {
  return (
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
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [appLoading, setAppLoading] = useState(true);

  // 5-second failsafe: force loading to false no matter what
  useEffect(() => {
    const failsafe = setTimeout(() => {
      setAppLoading(false);
    }, 5000);
    return () => clearTimeout(failsafe);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setAppLoading(false);
  }, []);

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <StatusBar style="light" />
            {appLoading ? (
              <SplashScreen onFinish={handleSplashFinish} />
            ) : (
              <MainApp />
            )}
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
