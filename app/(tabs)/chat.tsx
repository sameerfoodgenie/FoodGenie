import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { config } from '../../constants/config';
import { useApp } from '../../contexts/AppContext';
import { ChatMessage } from '../../services/mockData';
import { processUserMessage } from '../../services/chatAI';
// Chat now passes live dishes to AI
import { TypingIndicator } from '../../components/TypingIndicator';
import { DishSuggestionCard } from '../../components/DishSuggestionCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const app = useApp();
  const { chatMessages, addChatMessage, addToCart } = app;
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedDishes, setSuggestedDishes] = useState<any[]>([]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };
    addChatMessage(userMessage);
    const userInput = inputText.trim();
    setInputText('');
    setSuggestedDishes([]);

    // Show typing indicator
    setIsTyping(true);
    scrollViewRef.current?.scrollToEnd({ animated: true });

    // Process message with AI
    setTimeout(() => {
      const aiResponse = processUserMessage(userInput, app.allDishes);
      
      // Add analysis message
      const analysisMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'genie',
        text: aiResponse.analysis,
        timestamp: new Date(),
      };
      addChatMessage(analysisMessage);

      // Show suggestions after delay
      setTimeout(() => {
        setIsTyping(false);
        
        const responseMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'genie',
          text: aiResponse.responseText,
          timestamp: new Date(),
        };
        addChatMessage(responseMessage);
        
        // Set suggested dishes
        setSuggestedDishes(aiResponse.suggestedDishes);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1500);
    }, 800);
  };

  const handleChipPress = (chip: { id: string; text: string }) => {
    Haptics.selectionAsync();
    setInputText(chip.text.replace(/^[^\s]+\s/, '')); // Remove emoji prefix
  };

  const handleAddToCart = (dish: any) => {
    addToCart(dish);
  };

  useEffect(() => {
    // Auto-scroll when typing or messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [isTyping, chatMessages.length, suggestedDishes.length]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.genieIcon}>
            <Text style={styles.genieEmoji}>🧞‍♂️</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>FoodGenie Chat</Text>
            <Text style={styles.headerSubtitle}>Always here to help</Text>
          </View>
        </View>
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
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {chatMessages.map((message) => (
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

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}

          {/* Dish Suggestions */}
          {suggestedDishes.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Tap to view details or add to cart:</Text>
              {suggestedDishes.map((dish, index) => (
                <Animated.View
                  key={dish.id}
                  entering={FadeInDown.delay(index * 100).duration(400)}
                >
                  <DishSuggestionCard
                    dish={dish}
                    onAdd={() => handleAddToCart(dish)}
                  />
                </Animated.View>
              ))}
            </View>
          )}

          {/* Suggestion Chips */}
          {chatMessages.length <= 1 && (
            <View style={styles.chipsContainer}>
            <Text style={styles.chipsLabel}>Quick suggestions:</Text>
            <View style={styles.chipsRow}>
              {config.chatChips.map((chip) => (
                <Pressable
                  key={chip.id}
                  style={styles.chip}
                  onPress={() => handleChipPress(chip)}
                >
                  <Text style={styles.chipText}>{chip.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Tell FoodGenie what you're in the mood for..."
              placeholderTextColor={theme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
            />
            <Pressable
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={inputText.trim() ? theme.textOnPrimary : theme.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genieIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genieEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  keyboardView: {
    flex: 1,
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
  chipsContainer: {
    marginTop: 8,
  },
  chipsLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipText: {
    fontSize: 14,
    color: theme.textPrimary,
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.backgroundSecondary,
  },
});
