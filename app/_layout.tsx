import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../contexts/AppContext';
import { MealProvider } from '../contexts/MealContext';
import { PostProvider } from '../contexts/PostContext';
import { CreatorProvider } from '../contexts/CreatorContext';
import { AlertProvider, AuthProvider } from '@/template';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <MealProvider>
              <PostProvider>
                <CreatorProvider>
                <StatusBar style="light" />
                <View style={styles.root}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                    <Stack.Screen name="create-post" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="edit-meal" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="meal-analysis" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="food-insight" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="ai-thinking" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="results" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="explore" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="snap-share" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="dish/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="partner-apps" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="decision-lens" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="recommendations" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="trust-profile" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="voice-chat" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="daily-meals" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="ops/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="ops/onboard-restaurant" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="ops/restaurants" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="ops/restaurant-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="ops/add-dish" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="ops/add-dish-tags" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="creator-unlock" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="creator-studio" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="create-show" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="creator-dashboard" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="story-viewer" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="food-detail" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="shows" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="live-session" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="schedule-live" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="upload-recipe" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="profile-setup" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="send-notification" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="admin/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="admin/users" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="admin/posts" options={{ headerShown: false, animation: 'slide_from_right' }} />
                    <Stack.Screen name="admin/activity" options={{ headerShown: false, animation: 'slide_from_right' }} />
                  </Stack>
                </View>
                </CreatorProvider>
              </PostProvider>
            </MealProvider>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
});
