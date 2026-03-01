import { AuthRouter } from '@/template';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#F59E0B" />
    </View>
  );
}

export default function RootScreen() {
  return (
    <AuthRouter loginRoute="/login" loadingComponent={LoadingScreen}>
      <Redirect href="/(tabs)" />
    </AuthRouter>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
