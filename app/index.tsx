import { useEffect, useState } from 'react';
import { AuthRouter, useAuth } from '@/template';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { checkProfileComplete } from '../services/profileService';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#D4AF37" />
    </View>
  );
}

function AuthenticatedRedirect() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setChecking(false);
      return;
    }
    checkProfileComplete(user.id).then((complete) => {
      setProfileComplete(complete);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [user?.id]);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!profileComplete) {
    return <Redirect href="/profile-setup" />;
  }

  return <Redirect href="/(tabs)" />;
}

export default function RootScreen() {
  return (
    <AuthRouter loginRoute="/login" loadingComponent={LoadingScreen}>
      <AuthenticatedRedirect />
    </AuthRouter>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
