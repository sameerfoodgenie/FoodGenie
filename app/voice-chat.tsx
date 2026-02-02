import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { processUserMessage } from '../services/chatAI';
import { DishSuggestionCard } from '../components';

interface VoiceMessage {
  id: string;
  type: 'user' | 'genie';
  text: string;
  timestamp: Date;
}

export default function VoiceChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { addToCart } = useApp();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [suggestedDishes, setSuggestedDishes] = useState<any[]>([]);
  const [transcript, setTranscript] = useState('');
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Real-time speech recognition event listeners
  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const results = event.results;
    if (results && results.length > 0) {
      const transcriptText = results[0]?.transcript || '';
      setTranscript(transcriptText);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    if (transcript) {
      finishListening();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
  });

  useEffect(() => {
    // Welcome message
    const welcomeMessage: VoiceMessage = {
      id: '0',
      type: 'genie',
      text: 'Your wish is my command! What would you like to eat today?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message
    setTimeout(() => {
      speakText(welcomeMessage.text);
    }, 500);

    return () => {
      Speech.stop();
      ExpoSpeechRecognitionModule.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      // Pulse animation for listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    await Speech.speak(text, {
      language: 'en-IN',
      pitch: 1.1,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      // Stop listening and process
      finishListening();
    } else {
      // Start listening
      startListening();
    }
  };

  const startListening = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);
    setTranscript('');
    
    try {
      // Request permissions
      const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Speech recognition permission denied');
        // Fallback to simulated input
        const prompts = [
          'I want something spicy',
          'Show me healthy vegetarian options',
          'I am craving biryani',
          'Something quick under 200 rupees',
          'What is good for protein',
          'Light meal for dinner',
        ];
        setTimeout(() => {
          const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
          setTranscript(randomPrompt);
        }, 2000);
        return;
      }

      // Start real-time speech recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
      });
    } catch (error) {
      console.error('Speech recognition error:', error);
      // Fallback to simulated input
      const prompts = [
        'I want something spicy',
        'Show me healthy vegetarian options',
        'I am craving biryani',
      ];
      setTimeout(() => {
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        setTranscript(randomPrompt);
      }, 2000);
    }
  };

  const finishListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.log('Stop recognition error:', error);
    }
    
    if (!transcript) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsListening(false);

    // Add user message
    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: transcript,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');
    setSuggestedDishes([]);

    // Process with AI
    setTimeout(() => {
      const aiResponse = processUserMessage(userMessage.text);
      
      // Add genie response
      const genieMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'genie',
        text: aiResponse.responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, genieMessage]);
      setSuggestedDishes(aiResponse.suggestedDishes);

      // Speak response
      speakText(genieMessage.text);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);
  };

  const handleAddToCart = (dish: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(dish);
    
    // Genie confirmation
    const confirmText = `Added ${dish.name} to your cart!`;
    const confirmMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'genie',
      text: confirmText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
    speakText(confirmText);
  };

  const handleClose = () => {
    Haptics.selectionAsync();
    Speech.stop();
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Chat with Genie</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.type === 'user' ? styles.userBubble : styles.genieBubble,
            ]}
          >
            {message.type === 'genie' && (
              <Text style={styles.bubbleEmoji}>🧞‍♂️</Text>
            )}
            <Text
              style={[
                styles.messageText,
                message.type === 'user' ? styles.userText : styles.genieText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}

        {/* Dish Suggestions */}
        {suggestedDishes.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Tap to add to cart:</Text>
            {suggestedDishes.map((dish) => (
              <DishSuggestionCard
                key={dish.id}
                dish={dish}
                onAdd={() => handleAddToCart(dish)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Voice Control Area */}
      <View style={[styles.voiceControlArea, { paddingBottom: insets.bottom + 16 }]}>
        {/* Transcript Display */}
        {(isListening || transcript) && (
          <View style={styles.transcriptContainer}>
            <MaterialIcons name="mic" size={16} color={theme.primary} />
            <Text style={styles.transcriptText}>
              {transcript || 'Listening...'}
            </Text>
          </View>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <View style={styles.speakingIndicator}>
            <MaterialIcons name="volume-up" size={20} color={theme.accent} />
            <Text style={styles.speakingText}>Genie is speaking...</Text>
            <Pressable onPress={stopSpeaking} style={styles.stopButton}>
              <Text style={styles.stopButtonText}>Stop</Text>
            </Pressable>
          </View>
        )}

        {/* Voice Button */}
        <Pressable
          onPress={handleVoiceInput}
          disabled={isSpeaking}
          style={styles.voiceButtonWrapper}
        >
          <Animated.View
            style={[
              styles.voiceButtonContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={
                isListening
                  ? ['#EF4444', '#DC2626']
                  : isSpeaking
                  ? theme.gradients.accent
                  : theme.gradients.genie
              }
              style={styles.voiceButton}
            >
              <MaterialIcons
                name={isListening ? 'stop' : 'mic'}
                size={48}
                color="#FFF"
              />
            </LinearGradient>
          </Animated.View>

          {/* Wave circles */}
          {isListening && (
            <>
              <Animated.View
                style={[
                  styles.waveCircle,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.6, 0.3, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveCircle,
                  styles.waveCircle2,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.4, 0.2, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.8],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          )}
        </Pressable>

        <Text style={styles.voiceHint}>
          {isListening
            ? 'Tap to stop and process'
            : isSpeaking
            ? 'Listening to Genie...'
            : 'Tap to speak your wish'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
  },
  genieBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  bubbleEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  genieText: {
    color: theme.textPrimary,
  },
  userText: {
    color: theme.textOnPrimary,
  },
  suggestionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 12,
  },
  voiceControlArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    alignItems: 'center',
  },
  transcriptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 16,
    maxWidth: '100%',
  },
  transcriptText: {
    fontSize: 15,
    color: theme.textPrimary,
    flex: 1,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 16,
  },
  speakingText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
    flex: 1,
  },
  stopButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  stopButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  voiceButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.heavy,
  },
  waveCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  waveCircle2: {
    borderWidth: 1,
  },
  voiceHint: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
