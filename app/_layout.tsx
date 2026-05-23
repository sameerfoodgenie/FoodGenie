import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../contexts/AppContext';
import { MealProvider } from '../contexts/MealContext';
import { PostProvider } from '../contexts/PostContext';
import { CreatorProvider } from '../contexts/CreatorContext';
import { CoinProvider } from '../contexts/CoinContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../hooks/useTheme';
import CoinEarnedPopup from '../components/CoinEarnedPopup';
import { AlertProvider, AuthProvider } from '@/template';

function RootInner() {
  const { colors } = useTheme();
  return (
    <>
      <CoinEarnedPopup />
      <StatusBar style={colors.statusBarStyle} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
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
          <Stack.Screen name="admin/analytics" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="privacy-policy" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="app-info" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="investor-deck" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="photo-editor" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="coin-wallet" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="coin-redeem" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="coin-leaderboard" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="episode-player" options={{ headerShown: false, animation: 'slide_from_bottom' }} />

          <Stack.Screen name="app-demo" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="ai-meal-chat" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="grocery-cart" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="smart-split" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="smart-grocery" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="grocery-planner" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="genie-rewards" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="booking-history" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="meal-preferences" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="recipe-videos" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="subscription" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        </Stack>
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
          <AppProvider>
            <MealProvider>
              <PostProvider>
                <CreatorProvider>
                <CoinProvider>
                <RootInner />
                </CoinProvider>
                </CreatorProvider>
              </PostProvider>
            </MealProvider>
          </AppProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }
});
