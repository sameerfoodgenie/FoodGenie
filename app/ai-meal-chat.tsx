import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../template';
import { loadPreferences, loadAdvancedPreferences } from '../services/preferencesService';
import { sendMealChat } from '../services/mealPlannerService';

const { width: SCREEN_W } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { emoji: '☀️', label: 'Plan today meals', message: 'Plan my meals for today with breakfast, lunch, snack, and dinner. Include calorie counts.' },
  { emoji: '📅', label: 'Weekly plan', message: 'Create a complete 7-day meal plan for this week with variety and nutrition balance.' },
  { emoji: '🗓️', label: 'Monthly plan', message: 'Create a monthly meal plan overview with weekly themes, estimated grocery budget, and nutrition goals.' },
  { emoji: '🛒', label: 'Grocery budget', message: 'Calculate my weekly grocery budget based on healthy Indian meals. Break down by category: vegetables, grains, dairy, protein, and spices.' },
  { emoji: '💪', label: 'High protein', message: 'Suggest high-protein Indian meals for the week that are easy to prepare. Include protein grams for each meal.' },
  { emoji: '🥗', label: 'Low calorie', message: 'Plan low-calorie meals for this week under 1500 calories per day. Include calorie breakdown.' },
];

// ── Chat Bubble ──
function ChatBubble({ message, colors, isDark }: {
  message: ChatMessage; colors: any; isDark: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <Animated.View entering={FadeInUp.duration(250)} style={[cb.wrap, isUser && cb.wrapUser]}>
      {!isUser ? (
        <View style={cb.avatarWrap}>
          <LinearGradient colors={['#FF6B6B', '#FFB347']} style={cb.avatar}>
            <Text style={{ fontSize: 14 }}>🧞</Text>
          </LinearGradient>
        </View>
      ) : null}
      <View style={[
        cb.bubble,
        isUser ? {
          backgroundColor: '#D4AF37',
          borderBottomRightRadius: 4,
        } : {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderBottomLeftRadius: 4,
        },
      ]}>
        <Text style={[
          cb.text,
          { color: isUser ? '#FFF' : colors.textPrimary },
        ]}>
          {message.content}
        </Text>
        <Text style={[
          cb.time,
          { color: isUser ? 'rgba(255,255,255,0.60)' : colors.textMuted },
        ]}>
          {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Typing Indicator ──
function TypingBubble({ colors }: { colors: any }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={cb.wrap}>
      <View style={cb.avatarWrap}>
        <LinearGradient colors={['#FF6B6B', '#FFB347']} style={cb.avatar}>
          <Text style={{ fontSize: 14 }}>🧞</Text>
        </LinearGradient>
      </View>
      <View style={[cb.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }]}>
        <View style={cb.typingRow}>
          <View style={[cb.typingDot, { backgroundColor: colors.textMuted }]} />
          <View style={[cb.typingDot, { backgroundColor: colors.textMuted, opacity: 0.6 }]} />
          <View style={[cb.typingDot, { backgroundColor: colors.textMuted, opacity: 0.3 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function AIMealChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prefs, setPrefs] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadPreferences(user.id),
      loadAdvancedPreferences(user.id),
    ]).then(([basic, advanced]) => {
      setPrefs({
        diet: basic?.diet || 'veg',
        budgetMin: basic?.budget_min || 100,
        budgetMax: basic?.budget_max || 500,
        spiceLevel: basic?.spice_level || 2,
        healthGoal: advanced?.health_goal || 'balanced',
        cuisineBias: advanced?.cuisine_bias || [],
        avoidTags: advanced?.avoid_tags || [],
      });
    });

    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am FoodGenie AI 🧞‍♂️\n\nI can help you plan your daily, weekly, or monthly meals, calculate grocery budgets, and suggest healthy alternatives.\n\nWhat would you like to plan today?',
      timestamp: new Date(),
    }]);
  }, [user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Build history for context
    const history = messages.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      content: m.content,
    }));

    const { data, error } = await sendMealChat(text.trim(), prefs || {}, history);

    const assistantMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: error
        ? `Sorry, I encountered an error: ${error}. Please try again.`
        : data || 'I could not generate a response. Please try again.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [isLoading, messages, prefs]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(prompt);
  }, [sendMessage]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <ChatBubble message={item} colors={colors} isDark={isDark} />
  ), [colors, isDark]);

  const showQuickPrompts = messages.length <= 1;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={['#6C3CE0', '#8B5CF6', '#B794F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={s.headerRow}>
            <Pressable style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>AI Meal Planner 🧠</Text>
              <Text style={s.headerSub}>Chat to plan meals and grocery budgets</Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.todayBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); router.push('/decision-lens' as any); }}
            >
              <MaterialIcons name="today" size={20} color="#FFF" />
            </Pressable>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[s.messageList, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={isLoading ? <TypingBubble colors={colors} /> : null}
          />

          {/* Quick Prompts */}
          {showQuickPrompts ? (
            <Animated.View entering={FadeInDown.duration(400)} style={s.quickSection}>
              <Text style={[s.quickTitle, { color: colors.textMuted }]}>Quick Actions</Text>
              <View style={s.quickGrid}>
                {QUICK_PROMPTS.map((prompt, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      s.quickBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => handleQuickPrompt(prompt.message)}
                  >
                    <Text style={{ fontSize: 18 }}>{prompt.emoji}</Text>
                    <Text style={[s.quickLabel, { color: colors.textPrimary }]}>{prompt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {/* Input Bar */}
          <View style={[s.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <View style={[s.inputWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F5', borderColor: inputText ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB') }]}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                placeholder="Ask about meals, nutrition, grocery budget..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="send"
                editable={!isLoading}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                s.sendBtn,
                (!inputText.trim() || isLoading) && { opacity: 0.4 },
                pressed && inputText.trim() && !isLoading && { opacity: 0.85, transform: [{ scale: 0.95 }] },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient colors={['#8B5CF6', '#6C3CE0']} style={s.sendBtnGrad}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialIcons name="send" size={20} color="#FFF" />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  todayBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: 16, gap: 12 },
  quickSection: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  quickTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
  },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  inputWrap: { flex: 1, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 6, maxHeight: 120 },
  input: { fontSize: 15, fontWeight: '500', lineHeight: 21, paddingVertical: 0 },
  sendBtn: {},
  sendBtnGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

const cb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  wrapUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatarWrap: {},
  avatar: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bubble: { flex: 1, padding: 14, borderRadius: 18, gap: 6, maxWidth: SCREEN_W * 0.72 },
  text: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  time: { fontSize: 10, fontWeight: '500', alignSelf: 'flex-end' },
  typingRow: { flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
});
