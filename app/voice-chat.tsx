import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
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

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [suggestedDishes, setSuggestedDishes] = useState<any[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple pulse animation using RN Animated
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
    const timer = setTimeout(() => {
      speakText(welcomeMessage.text);
    }, 500);

    return () => {
      clearTimeout(timer);
      try { Speech.stop(); } catch (e) { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing]);

  const speakText = (text: string) => {
    try {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en-IN',
        pitch: 1.1,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    try { Speech.stop(); } catch (e) { /* ignore */ }
    setIsSpeaking(false);
  };

  const handleSendText = () => {
    if (!textInput.trim() || isProcessing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userText = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    setSuggestedDishes([]);

    // Add user message
    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Process with AI after short delay
    setTimeout(() => {
      try {
        const aiResponse = processUserMessage(userText);

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
      } catch (e) {
        const errorMessage: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          type: 'genie',
          text: 'Let me try again. Could you describe what you want to eat?',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsProcessing(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800);
  };

  const handleQuickPrompt = (prompt: string) => {
    setTextInput(prompt);
    setTimeout(() => {
      handleSendTextDirect(prompt);
    }, 100);
  };

  const handleSendTextDirect = (text: string) => {
    if (!text.trim() || isProcessing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTextInput('');
    setIsProcessing(true);
    setSuggestedDishes([]);

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      try {
        const aiResponse = processUserMessage(text.trim());
        const genieMessage: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          type: 'genie',
          text: aiResponse.responseText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, genieMessage]);
        setSuggestedDishes(aiResponse.suggestedDishes);
        speakText(genieMessage.text);
      } catch (e) {
        const errorMessage: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          type: 'genie',
          text: 'Let me try again. Could you tell me what you are craving?',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsProcessing(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800);
  };

  const handleAddToCart = (dish: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(dish);

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
    try { Speech.stop(); } catch (e) { /* ignore */ }
    router.back();
  };

  const quickPrompts = [
    'Something spicy and filling',
    'Healthy vegetarian options',
    'Quick meal under 200 rupees',
    'Best biryani nearby',
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Chat with Genie</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.type === 'user' ? styles.userBubble : styles.genieBubble,
              ]}
            >
              {message.type === 'genie' ? (
                <Text style={styles.bubbleEmoji}>🧞‍♂️</Text>
              ) : null}
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

          {/* Processing indicator */}
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <Animated.View style={[styles.processingDot, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.processingEmoji}>🧞‍♂️</Text>
              </Animated.View>
              <Text style={styles.processingText}>Thinking...</Text>
            </View>
          ) : null}

          {/* Dish Suggestions */}
          {suggestedDishes.length > 0 ? (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Tap to add to cart:</Text>
              {suggestedDishes.slice(0, 4).map((dish) => (
                <DishSuggestionCard
                  key={dish.id}
                  dish={dish}
                  onAdd={() => handleAddToCart(dish)}
                />
              ))}
            </View>
          ) : null}

          {/* Quick prompts (show when no messages beyond welcome) */}
          {messages.length <= 1 && !isProcessing ? (
            <View style={styles.quickPromptsContainer}>
              <Text style={styles.quickPromptsLabel}>Try saying:</Text>
              {quickPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  style={({ pressed }) => [
                    styles.quickPrompt,
                    pressed && styles.quickPromptPressed,
                  ]}
                  onPress={() => handleQuickPrompt(prompt)}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={theme.primary} />
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          {/* Speaking Indicator */}
          {isSpeaking ? (
            <View style={styles.speakingIndicator}>
              <MaterialIcons name="volume-up" size={18} color={theme.accent} />
              <Text style={styles.speakingText}>Genie is speaking...</Text>
              <Pressable onPress={stopSpeaking} style={styles.stopButton}>
                <Text style={styles.stopButtonText}>Stop</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type what you want to eat..."
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={200}
              editable={!isProcessing}
              onSubmitEditing={handleSendText}
              returnKeyType="send"
            />
            <Pressable
              style={[
                styles.sendButton,
                (!textInput.trim() || isProcessing) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendText}
              disabled={!textInput.trim() || isProcessing}
            >
              <LinearGradient
                colors={textInput.trim() && !isProcessing ? theme.gradients.genie : [theme.border, theme.border]}
                style={styles.sendButtonGradient}
              >
                <MaterialIcons
                  name="send"
                  size={22}
                  color={textInput.trim() && !isProcessing ? theme.textOnPrimary : theme.textMuted}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  placeholder: { width: 40 },
  keyboardView: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, gap: 16 },
  messageBubble: { maxWidth: '85%', padding: 16, borderRadius: theme.borderRadius.lg },
  genieBubble: { alignSelf: 'flex-start', backgroundColor: theme.backgroundSecondary, borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  bubbleEmoji: { fontSize: 20, marginBottom: 8 },
  messageText: { fontSize: 15, lineHeight: 22 },
  genieText: { color: theme.textPrimary },
  userText: { color: theme.textOnPrimary },

  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    backgroundColor: theme.backgroundSecondary,
    padding: 12,
    borderRadius: theme.borderRadius.lg,
  },
  processingDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.15)', alignItems: 'center', justifyContent: 'center' },
  processingEmoji: { fontSize: 18 },
  processingText: { fontSize: 14, color: theme.textSecondary, fontStyle: 'italic' },

  suggestionsContainer: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight },
  suggestionsLabel: { fontSize: 13, fontWeight: '600', color: theme.primary, marginBottom: 12 },

  quickPromptsContainer: { marginTop: 8, gap: 8 },
  quickPromptsLabel: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', marginBottom: 4 },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.backgroundSecondary,
    padding: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.1)',
  },
  quickPromptPressed: { backgroundColor: theme.backgroundTertiary, borderColor: 'rgba(251, 191, 36, 0.3)' },
  quickPromptText: { fontSize: 14, color: theme.textPrimary, fontWeight: '500' },

  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 10,
  },
  speakingText: { fontSize: 13, color: theme.accent, fontWeight: '600', flex: 1 },
  stopButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  stopButtonText: { fontSize: 12, fontWeight: '600', color: '#FFF' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  textInput: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sendButton: { borderRadius: 24, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
