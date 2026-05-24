import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

// This tab now redirects to the Genie Rewards Hub
export default function ChatScreen() {
  const router = useRouter();

  useEffect(() => {
    router.push('/genie-rewards' as any);
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#0D0B1A' }} />;
}
