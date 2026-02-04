import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AppProvider } from '../contexts/AppContext';
import { AlertProvider } from '@/template';
import SplashScreen from '../components/SplashScreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <AlertProvider>
      <AppProvider>
        <StatusBar style="light" />
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            presentation: 'fullScreenModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="ai-thinking" 
          options={{ 
            presentation: 'fullScreenModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="decision-lens" 
          options={{ 
            presentation: 'card',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="recommendations" 
          options={{ 
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="dish/[id]" 
          options={{ 
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="trust-profile" 
          options={{ 
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="voice-chat" 
          options={{ 
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="daily-meals" 
          options={{ 
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
        </Stack>
      </AppProvider>
    </AlertProvider>
  );
}
