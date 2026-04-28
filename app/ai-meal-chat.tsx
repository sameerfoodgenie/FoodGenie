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
import { useCoin } from '../hooks/useCoin';
import { loadPreferences, loadAdvancedPreferences } from '../services/preferencesService';
import { sendMealChat } from '../services/mealPlannerService';
import { COIN_RULES } from '../services/coinService';

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
  { emoji: '👨‍🍳', label: 'Book a cook', message: 'I want to book an expert cook. Help me choose the right plan (daily, weekly, or monthly) based on my preferences and budget.' },
];

// ── Inline Bold Text Renderer ──
function RichInlineText({ text, baseStyle }: { text: string; baseStyle: any }) {
  // Parse **bold** segments
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <Text key={i} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ── Markdown Content Renderer ──
function MarkdownContent({ content, colors, isDark }: {
  content: string; colors: any; isDark: boolean;
}) {
  const blocks = parseMarkdown(content);

  return (
    <View style={md.container}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'header':
            return (
              <View key={i} style={md.headerWrap}>
                <RichInlineText
                  text={block.text}
                  baseStyle={[
                    md.headerText,
                    block.level === 1 && { fontSize: 17, fontWeight: '900' },
                    block.level === 2 && { fontSize: 15, fontWeight: '800' },
                    block.level === 3 && { fontSize: 14, fontWeight: '800' },
                    { color: colors.textPrimary },
                  ]}
                />
              </View>
            );

          case 'table':
            return <TableCard key={i} table={block} colors={colors} isDark={isDark} />;

          case 'bullet':
            return (
              <View key={i} style={md.bulletRow}>
                <Text style={[md.bulletDot, { color: '#D4AF37' }]}>•</Text>
                <RichInlineText text={block.text} baseStyle={[md.bulletText, { color: colors.textPrimary }]} />
              </View>
            );

          case 'numbered':
            return (
              <View key={i} style={md.bulletRow}>
                <Text style={[md.numberLabel, { color: '#D4AF37' }]}>{block.number}.</Text>
                <RichInlineText text={block.text} baseStyle={[md.bulletText, { color: colors.textPrimary }]} />
              </View>
            );

          case 'divider':
            return <View key={i} style={[md.divider, { backgroundColor: colors.border }]} />;

          case 'text':
          default:
            if (!block.text.trim()) return null;
            return (
              <RichInlineText key={i} text={block.text} baseStyle={[md.paragraph, { color: colors.textPrimary }]} />
            );
        }
      })}
    </View>
  );
}

// ── Table as Card ──
function TableCard({ table, colors, isDark }: {
  table: { headers: string[]; rows: string[][] }; colors: any; isDark: boolean;
}) {
  const hasCategory = table.headers.length >= 2;

  // Group rows by first column if it looks like categories
  let currentCategory = '';

  return (
    <View style={[md.tableCard, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      borderColor: colors.border,
    }]}>
      {table.rows.map((row, ri) => {
        const firstCol = row[0]?.trim() || '';
        const isCategoryRow = firstCol && firstCol !== currentCategory && firstCol.length > 0;
        const showCategoryHeader = isCategoryRow && firstCol !== '' && hasCategory;
        if (firstCol) currentCategory = firstCol;

        // If only first column has value and others are empty, it is a category header
        const isOnlyCategoryCol = firstCol && row.slice(1).every(c => !c.trim());
        
        // Check for total/summary rows
        const isTotal = firstCol.toLowerCase().includes('total') || row.some(c => c.toLowerCase().includes('total'));

        if (isOnlyCategoryCol && !isTotal) {
          return (
            <View key={ri} style={[md.tableCategoryRow, ri > 0 && { marginTop: 10 }]}>
              <Text style={[md.tableCategoryText, { color: '#D4AF37' }]}>{firstCol}</Text>
            </View>
          );
        }

        if (isTotal) {
          return (
            <View key={ri} style={[md.tableTotalRow, {
              backgroundColor: isDark ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.06)',
              borderTopColor: colors.border,
            }]}>
              {row.map((cell, ci) => (
                <Text key={ci} style={[md.tableTotalCell, { color: '#D4AF37' }]}>
                  {cell.trim().replace(/\*\*/g, '')}
                </Text>
              ))}
            </View>
          );
        }

        return (
          <View key={ri} style={[
            md.tableRow,
            ri < table.rows.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          ]}>
            {row.map((cell, ci) => {
              const cleaned = cell.trim().replace(/\*\*/g, '');
              if (!cleaned) return null;
              // First real data column
              const isName = ci === 0 || (ci === 1 && !row[0]?.trim());
              // Price-like column (contains ₹ or currency)
              const isPrice = cleaned.includes('₹') || cleaned.match(/^\d+$/);
              return (
                <Text
                  key={ci}
                  style={[
                    md.tableCell,
                    { color: colors.textPrimary },
                    isName && { flex: 2, fontWeight: '600' },
                    isPrice && { color: '#D4AF37', fontWeight: '800' },
                    !isName && !isPrice && { flex: 1 },
                  ]}
                  numberOfLines={2}
                >
                  {cleaned}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// ── Markdown Parser ──
interface MarkdownBlock {
  type: 'header' | 'table' | 'bullet' | 'numbered' | 'divider' | 'text';
  text: string;
  level?: number;
  number?: number;
  headers?: string[];
  rows?: string[][];
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider', text: '' });
      i++;
      continue;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      blocks.push({ type: 'header', text: headerMatch[2], level: headerMatch[1].length });
      i++;
      continue;
    }

    // Table detection: line starts with |
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const parsed = parseTable(tableLines);
      if (parsed) {
        blocks.push({ type: 'table', text: '', ...parsed });
      }
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(trimmed)) {
      blocks.push({ type: 'bullet', text: trimmed.replace(/^[-*]\s+/, '') });
      i++;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      blocks.push({ type: 'numbered', text: numMatch[2], number: parseInt(numMatch[1]) });
      i++;
      continue;
    }

    // Regular text
    blocks.push({ type: 'text', text: trimmed });
    i++;
  }

  return blocks;
}

function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;

  const parseLine = (line: string) =>
    line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());

  const headers = parseLine(lines[0]);

  // Skip separator line (|---|---|)
  let startRow = 1;
  if (lines[1] && /^[\s|:-]+$/.test(lines[1])) {
    startRow = 2;
  }

  const rows = lines.slice(startRow).map(parseLine).filter(r => r.some(c => c.length > 0));

  if (rows.length === 0) return null;
  return { headers, rows };
}

// ── Chat Bubble ──
function ChatBubble({ message, colors, isDark }: {
  message: ChatMessage; colors: any; isDark: boolean;
}) {
  const isUser = message.role === 'user';
  const hasRichContent = !isUser && (
    message.content.includes('|') ||
    message.content.includes('###') ||
    message.content.includes('**') ||
    message.content.includes('- ') ||
    /^\d+[.)]\s/m.test(message.content)
  );

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
        hasRichContent && { paddingHorizontal: 10, paddingVertical: 12 },
      ]}>
        {isUser || !hasRichContent ? (
          <Text style={[
            cb.text,
            { color: isUser ? '#FFF' : colors.textPrimary },
          ]}>
            {message.content}
          </Text>
        ) : (
          <MarkdownContent content={message.content} colors={colors} isDark={isDark} />
        )}
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
  const { earnCoins } = useCoin();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatCoinsAwarded, setChatCoinsAwarded] = useState(0);
  const [showCookBanner, setShowCookBanner] = useState(false);
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

    const aiContent = error
      ? `Sorry, I encountered an error: ${error}. Please try again.`
      : data || 'I could not generate a response. Please try again.';

    const assistantMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: aiContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);

    // Award coins for AI chat interaction (max 3 per session)
    if (!error && chatCoinsAwarded < 3) {
      earnCoins(COIN_RULES.ai_chat_plan.amount, 'ai_chat_plan', { message: text.trim().slice(0, 50) });
      setChatCoinsAwarded(prev => prev + 1);
    }

    // Show cook booking banner if meal plan discussed
    const lowerContent = aiContent.toLowerCase();
    if (lowerContent.includes('meal') || lowerContent.includes('plan') || lowerContent.includes('cook') || lowerContent.includes('dinner') || lowerContent.includes('lunch')) {
      setShowCookBanner(true);
    }

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

          {/* Cook Booking Banner */}
          {showCookBanner && !showQuickPrompts ? (
            <Animated.View entering={FadeInDown.duration(300)} style={[s.cookBanner, { backgroundColor: isDark ? 'rgba(255,107,107,0.10)' : 'rgba(255,107,107,0.06)', borderColor: 'rgba(255,107,107,0.20)' }]}>
              <View style={s.cookBannerContent}>
                <Text style={{ fontSize: 22 }}>👨‍🍳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cookBannerTitle, { color: colors.textPrimary }]}>Want a cook to prepare this?</Text>
                  <Text style={[s.cookBannerSub, { color: colors.textMuted }]}>Book an expert cook and earn 🪙 +{COIN_RULES.cook_booked.amount} coins</Text>
                </View>
              </View>
              <View style={s.cookBannerActions}>
                <Pressable
                  style={({ pressed }) => [s.cookBannerBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/cook' as any); }}
                >
                  <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={s.cookBannerBtnGrad}>
                    <MaterialIcons name="restaurant" size={14} color="#FFF" />
                    <Text style={s.cookBannerBtnText}>Book a Cook</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                  onPress={() => setShowCookBanner(false)}
                >
                  <Text style={[s.cookBannerDismiss, { color: colors.textMuted }]}>Dismiss</Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

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
  // Cook Banner
  cookBanner: {
    marginHorizontal: 16, marginBottom: 8,
    padding: 14, borderRadius: 16, borderWidth: 1, gap: 10,
  },
  cookBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cookBannerTitle: { fontSize: 14, fontWeight: '800' },
  cookBannerSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  cookBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 32 },
  cookBannerBtn: {},
  cookBannerBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
  },
  cookBannerBtnText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  cookBannerDismiss: { fontSize: 12, fontWeight: '600' },
});

const cb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '90%' },
  wrapUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse', maxWidth: '80%' },
  avatarWrap: {},
  avatar: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bubble: { flex: 1, padding: 14, borderRadius: 18, gap: 6 },
  text: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  time: { fontSize: 10, fontWeight: '500', alignSelf: 'flex-end' },
  typingRow: { flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
});

const md = StyleSheet.create({
  container: { gap: 6 },
  headerWrap: { marginTop: 4, marginBottom: 2 },
  headerText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  paragraph: { fontSize: 14, fontWeight: '500', lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: 6, paddingLeft: 2, marginVertical: 1 },
  bulletDot: { fontSize: 14, fontWeight: '800', lineHeight: 21, width: 12 },
  numberLabel: { fontSize: 13, fontWeight: '800', lineHeight: 21, width: 18, textAlign: 'right' },
  bulletText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  divider: { height: 1, marginVertical: 6 },
  // Table styles
  tableCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginVertical: 4 },
  tableCategoryRow: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(212,175,55,0.06)' },
  tableCategoryText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tableCell: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  tableTotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, marginTop: 2,
  },
  tableTotalCell: { fontSize: 14, fontWeight: '900' },
});
