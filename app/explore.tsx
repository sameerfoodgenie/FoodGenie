import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;
const CARD_H = CARD_W * 1.3;
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

// ── Emotion types ──
type EmotionType = 'craving' | 'must_try' | 'loved';

interface EmotionDef {
  id: EmotionType;
  emoji: string;
  label: string;
  color: string;
}

const EMOTIONS: EmotionDef[] = [
  { id: 'craving', emoji: '🤤', label: 'Craving', color: '#FFB347' },
  { id: 'must_try', emoji: '🔥', label: 'Must Try', color: '#FF6B6B' },
  { id: 'loved', emoji: '😍', label: 'Loved It', color: '#FF69B4' },
];

// ── Sample food cards ──
interface FoodCard {
  id: string;
  dishName: string;
  creator: string;
  creatorAvatar: string;
  imageUri: string;
  videoUri: string;
  description: string;
  recipe: string[];
  emotions: Record<EmotionType, number>;
  tags: string[];
  cookTime: string;
  difficulty: string;
}

const SAMPLE_CARDS: FoodCard[] = [
  {
    id: 'fc_1',
    dishName: 'Paneer Tikka Masala',
    creator: 'chef_aarav',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/5494998/5494998-uhd_2560_1440_30fps.mp4',
    description: 'Smoky, spiced paneer cubes grilled to perfection and tossed in rich tomato-cream gravy. A North Indian classic that melts in your mouth.',
    recipe: ['Marinate paneer in yogurt + spices', 'Grill until charred edges', 'Simmer in tomato-cream sauce', 'Garnish with cream + cilantro'],
    emotions: { craving: 342, must_try: 189, loved: 267 },
    tags: ['north-indian', 'paneer', 'protein'],
    cookTime: '25 min',
    difficulty: 'Easy',
  },
  {
    id: 'fc_2',
    dishName: 'Açaí Smoothie Bowl',
    creator: 'priya_vegan',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/4921967/4921967-hd_1920_1080_25fps.mp4',
    description: 'Thick, creamy açaí blended with frozen bananas, topped with granola, fresh berries, coconut flakes, and a drizzle of honey.',
    recipe: ['Blend açaí + frozen banana', 'Pour thick into bowl', 'Add granola, berries, coconut', 'Drizzle honey + chia seeds'],
    emotions: { craving: 198, must_try: 156, loved: 312 },
    tags: ['healthy', 'vegan', 'breakfast'],
    cookTime: '10 min',
    difficulty: 'Easy',
  },
  {
    id: 'fc_3',
    dishName: 'Masala Street Chaat',
    creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3296396/3296396-uhd_2560_1440_25fps.mp4',
    description: 'Crispy papdi, tangy tamarind, cool yogurt, and a burst of spices. The ultimate Indian street food that hits every flavor note.',
    recipe: ['Layer papdi on plate', 'Add boiled chickpeas + potato', 'Top with yogurt + chutneys', 'Finish with sev + pomegranate'],
    emotions: { craving: 456, must_try: 287, loved: 198 },
    tags: ['street-food', 'chaat', 'spicy'],
    cookTime: '15 min',
    difficulty: 'Easy',
  },
  {
    id: 'fc_4',
    dishName: 'Belgian Dessert Waffles',
    creator: 'ananya_desserts',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4',
    description: 'Crispy on the outside, fluffy inside. Loaded with Nutella, fresh strawberries, whipped cream, and a dusting of powdered sugar.',
    recipe: ['Make waffle batter', 'Cook until golden crisp', 'Spread Nutella generously', 'Top with berries + cream'],
    emotions: { craving: 523, must_try: 345, loved: 412 },
    tags: ['dessert', 'sweet', 'indulgent'],
    cookTime: '20 min',
    difficulty: 'Medium',
  },
  {
    id: 'fc_5',
    dishName: 'Rainbow Power Salad',
    creator: 'priya_vegan',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    description: 'A vibrant mix of fresh greens, roasted chickpeas, avocado, quinoa, and a zesty lemon-tahini dressing. Healthy never looked so good.',
    recipe: ['Roast chickpeas with paprika', 'Cook quinoa, let cool', 'Toss greens + veggies', 'Drizzle lemon-tahini dressing'],
    emotions: { craving: 134, must_try: 267, loved: 189 },
    tags: ['healthy', 'salad', 'protein'],
    cookTime: '20 min',
    difficulty: 'Easy',
  },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// ── Floating Card (the stacked card in the deck) ──
function FloatingCard({
  card,
  index,
  activeIndex,
  totalCards,
  onTap,
  onSwipe,
  colors,
  isDark,
  userEmotions,
  onEmotion,
}: {
  card: FoodCard;
  index: number;
  activeIndex: number;
  totalCards: number;
  onTap: () => void;
  onSwipe: (dir: 'left' | 'right') => void;
  colors: any;
  isDark: boolean;
  userEmotions: Record<string, EmotionType | null>;
  onEmotion: (cardId: string, emotion: EmotionType) => void;
}) {
  const relativeIndex = index - activeIndex;
  const isActive = relativeIndex === 0;
  const isVisible = relativeIndex >= 0 && relativeIndex <= 2;

  const translateX = useSharedValue(0);
  const cardRotation = useSharedValue(0);

  // Floating animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    if (isActive) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      floatY.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const handleSwipeComplete = useCallback((dir: 'left' | 'right') => {
    onSwipe(dir);
  }, [onSwipe]);

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      cardRotation.value = interpolate(e.translationX, [-SCREEN_W / 2, 0, SCREEN_W / 2], [-12, 0, 12]);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 'right' : 'left';
        translateX.value = withTiming(
          dir === 'right' ? SCREEN_W * 1.2 : -SCREEN_W * 1.2,
          { duration: 300 },
          () => runOnJS(handleSwipeComplete)(dir),
        );
        cardRotation.value = withTiming(dir === 'right' ? 20 : -20, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        cardRotation.value = withSpring(0, { damping: 15 });
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(isActive)
    .onEnd(() => {
      runOnJS(onTap)();
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Static rotations for stacked cards
  const stackRotations = [0, 2.5, -1.8];
  const stackScale = [1, 0.95, 0.90];
  const stackTranslateY = [0, 12, 24];

  const animStyle = useAnimatedStyle(() => {
    if (!isVisible) return { opacity: 0, transform: [{ scale: 0.8 }] };

    const baseRotation = stackRotations[Math.min(relativeIndex, 2)] || 0;
    const baseScale = stackScale[Math.min(relativeIndex, 2)] || 0.85;
    const baseY = stackTranslateY[Math.min(relativeIndex, 2)] || 30;

    return {
      opacity: isActive ? 1 : interpolate(relativeIndex, [0, 1, 2, 3], [1, 0.85, 0.65, 0]),
      zIndex: totalCards - relativeIndex,
      transform: [
        { translateX: isActive ? translateX.value : 0 },
        { translateY: isActive ? floatY.value + baseY : baseY },
        { rotate: isActive ? `${cardRotation.value + baseRotation}deg` : `${baseRotation}deg` },
        { scale: baseScale },
      ],
    };
  });

  if (!isVisible) return null;

  const userEmotion = userEmotions[card.id] || null;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.cardOuter, animStyle]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Food Image */}
          <View style={styles.cardImageWrap}>
            <Image
              source={{ uri: card.imageUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={250}
            />
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.65)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Creator pill */}
            <View style={styles.creatorPill}>
              <Image source={{ uri: card.creatorAvatar }} style={styles.creatorPillAvatar} contentFit="cover" />
              <Text style={styles.creatorPillName}>@{card.creator}</Text>
            </View>

            {/* Tags */}
            <View style={styles.cardTagsRow}>
              {card.tags.slice(0, 2).map(tag => (
                <View key={tag} style={styles.cardTag}>
                  <Text style={styles.cardTagText}>{tag}</Text>
                </View>
              ))}
              <View style={styles.cardTimeBadge}>
                <MaterialIcons name="schedule" size={10} color="#FFD700" />
                <Text style={styles.cardTimeText}>{card.cookTime}</Text>
              </View>
            </View>

            {/* Dish name overlay */}
            <View style={styles.cardNameOverlay}>
              <Text style={styles.cardDishName}>{card.dishName}</Text>
              <Text style={styles.cardDifficulty}>{card.difficulty}</Text>
            </View>
          </View>

          {/* Emotion Bar */}
          <View style={[styles.emotionBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            {EMOTIONS.map(emotion => {
              const isSelected = userEmotion === emotion.id;
              const count = card.emotions[emotion.id] + (isSelected ? 1 : 0);
              return (
                <Pressable
                  key={emotion.id}
                  style={({ pressed }) => [
                    styles.emotionBtn,
                    isSelected && { backgroundColor: `${emotion.color}18`, borderColor: `${emotion.color}40` },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onEmotion(card.id, emotion.id);
                  }}
                >
                  <Text style={[styles.emotionEmoji, isSelected && { fontSize: 20 }]}>{emotion.emoji}</Text>
                  <Text style={[
                    styles.emotionCount,
                    { color: isSelected ? emotion.color : colors.textMuted },
                    isSelected && { fontWeight: '800' },
                  ]}>{formatCount(count)}</Text>
                </Pressable>
              );
            })}

            {/* Tap hint */}
            {isActive ? (
              <View style={styles.tapHint}>
                <MaterialIcons name="touch-app" size={14} color={colors.textMuted} />
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Fullscreen Detail Modal ──
function CardDetailModal({
  card,
  visible,
  onClose,
  colors,
  isDark,
  userEmotion,
  onEmotion,
}: {
  card: FoodCard | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
  isDark: boolean;
  userEmotion: EmotionType | null;
  onEmotion: (emotion: EmotionType) => void;
}) {
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = useState(true);

  const player = useVideoPlayer(visible && card ? card.videoUri : '', (p) => {
    p.loop = true;
    p.muted = true;
    if (visible && card) p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (visible && card) {
      try {
        player.muted = true;
        setIsMuted(true);
        player.play();
      } catch {}
    } else {
      try { player.pause(); } catch {}
    }
  }, [visible, card]);

  const toggleMute = useCallback(() => {
    Haptics.selectionAsync();
    const newMuted = !isMuted;
    player.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted, player]);

  if (!card) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.detailContainer, { backgroundColor: '#000' }]}>
        {/* Video */}
        <View style={styles.detailVideoWrap}>
          <VideoView
            style={StyleSheet.absoluteFillObject}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
            locations={[0, 0.2, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top controls */}
          <SafeAreaView edges={['top']} style={styles.detailTopBar}>
            <Pressable
              style={({ pressed }) => [styles.detailBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); onClose(); }}
            >
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
            <View style={styles.detailTopCenter}>
              <View style={styles.detailLiveBadge}>
                <View style={styles.detailLiveDot} />
                <Text style={styles.detailLiveText}>Playing</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.detailBtn, pressed && { opacity: 0.7 }]}
              onPress={toggleMute}
            >
              <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="#FFF" />
            </Pressable>
          </SafeAreaView>

          {/* Bottom info overlay */}
          <View style={styles.detailBottomOverlay}>
            {/* Creator row */}
            <View style={styles.detailCreatorRow}>
              <Image source={{ uri: card.creatorAvatar }} style={styles.detailCreatorAvatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailCreatorName}>@{card.creator}</Text>
                <Text style={styles.detailCreatorSub}>Food Creator</Text>
              </View>
            </View>
            <Text style={styles.detailDishName}>{card.dishName}</Text>
            <Text style={styles.detailDescription}>{card.description}</Text>

            {/* Meta badges */}
            <View style={styles.detailMeta}>
              <View style={styles.detailMetaBadge}>
                <MaterialIcons name="schedule" size={12} color="#FFD700" />
                <Text style={styles.detailMetaText}>{card.cookTime}</Text>
              </View>
              <View style={styles.detailMetaBadge}>
                <MaterialIcons name="signal-cellular-alt" size={12} color="#FFD700" />
                <Text style={styles.detailMetaText}>{card.difficulty}</Text>
              </View>
              {card.tags.map(tag => (
                <View key={tag} style={styles.detailMetaBadge}>
                  <Text style={styles.detailMetaText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom section */}
        <View style={[styles.detailInfoSection, { backgroundColor: colors.background }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* Emotion reactions */}
            <View style={styles.detailEmotionRow}>
              {EMOTIONS.map(emotion => {
                const isSelected = userEmotion === emotion.id;
                const count = card.emotions[emotion.id] + (isSelected ? 1 : 0);
                return (
                  <Pressable
                    key={emotion.id}
                    style={({ pressed }) => [
                      styles.detailEmotionBtn,
                      { backgroundColor: isSelected ? `${emotion.color}20` : colors.surface, borderColor: isSelected ? emotion.color : colors.border },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onEmotion(emotion.id);
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{emotion.emoji}</Text>
                    <Text style={[styles.detailEmotionLabel, { color: isSelected ? emotion.color : colors.textSecondary }]}>{emotion.label}</Text>
                    <Text style={[styles.detailEmotionCount, { color: isSelected ? emotion.color : colors.textMuted }]}>{formatCount(count)}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Recipe steps */}
            <View style={styles.detailRecipeSection}>
              <Text style={[styles.detailRecipeTitle, { color: colors.textPrimary }]}>Quick Recipe</Text>
              {card.recipe.map((step, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(100 + i * 80).duration(300)} style={styles.detailStepRow}>
                  <View style={styles.detailStepNumber}>
                    <Text style={styles.detailStepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.detailStepText, { color: colors.textSecondary }]}>{step}</Text>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Explore Screen ──
export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const [cards, setCards] = useState<FoodCard[]>(SAMPLE_CARDS);
  const [selectedCard, setSelectedCard] = useState<FoodCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmotions, setUserEmotions] = useState<Record<string, EmotionType | null>>({});

  const handleTapCard = useCallback((card: FoodCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCard(card);
    setShowDetail(true);
  }, []);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    Haptics.selectionAsync();
    setActiveIndex(prev => Math.min(prev + 1, cards.length - 1));
  }, [cards.length]);

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setTimeout(() => setSelectedCard(null), 300);
  }, []);

  const handleShuffle = useCallback(async () => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Shuffle cards
    await new Promise(res => setTimeout(res, 600));
    setCards(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setActiveIndex(0);
    setRefreshing(false);
  }, []);

  const handleEmotion = useCallback((cardId: string, emotion: EmotionType) => {
    setUserEmotions(prev => ({
      ...prev,
      [cardId]: prev[cardId] === emotion ? null : emotion,
    }));
  }, []);

  const handleDetailEmotion = useCallback((emotion: EmotionType) => {
    if (selectedCard) {
      handleEmotion(selectedCard.id, emotion);
    }
  }, [selectedCard, handleEmotion]);

  const currentCard = cards[activeIndex] || null;
  const progress = cards.length > 0 ? ((activeIndex + 1) / cards.length) : 0;

  const headerGradient = isDark
    ? ['#1A1510', '#1E1A12', '#14141C'] as const
    : ['#FFF8E1', '#FFECB3', '#FDF8F0'] as const;

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <LinearGradient colors={headerGradient} style={styles.headerGradient}>
          <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.80)', borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => { Haptics.selectionAsync(); router.back(); }}
            >
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFD700' : '#8B6914' }]}>Discover</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {activeIndex + 1} / {cards.length}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.shuffleBtn,
                { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.25)' },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleShuffle}
            >
              <MaterialIcons name="shuffle" size={20} color="#D4AF37" />
            </Pressable>
          </Animated.View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </LinearGradient>

        {/* ── Card Stack ── */}
        <View style={styles.cardStack}>
          {activeIndex >= cards.length ? (
            // All cards seen
            <Animated.View entering={FadeInUp.duration(500)} style={styles.endState}>
              <Text style={styles.endEmoji}>🍽</Text>
              <Text style={[styles.endTitle, { color: colors.textPrimary }]}>You have seen it all!</Text>
              <Text style={[styles.endSub, { color: colors.textMuted }]}>Pull down or tap shuffle to rediscover</Text>
              <Pressable
                style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={handleShuffle}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.endBtnGrad}>
                  <MaterialIcons name="shuffle" size={20} color="#FFF" />
                  <Text style={styles.endBtnText}>Shuffle Again</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              {/* Render visible cards (current + next 2) */}
              {cards.map((card, index) => {
                const relIdx = index - activeIndex;
                if (relIdx < 0 || relIdx > 2) return null;
                return (
                  <FloatingCard
                    key={card.id}
                    card={card}
                    index={index}
                    activeIndex={activeIndex}
                    totalCards={cards.length}
                    onTap={() => handleTapCard(card)}
                    onSwipe={handleSwipe}
                    colors={colors}
                    isDark={isDark}
                    userEmotions={userEmotions}
                    onEmotion={handleEmotion}
                  />
                );
              })}

              {/* Swipe hints */}
              <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.swipeHints}>
                <View style={styles.swipeHint}>
                  <MaterialIcons name="swipe" size={18} color={colors.textMuted} />
                  <Text style={[styles.swipeHintText, { color: colors.textMuted }]}>Swipe to explore</Text>
                </View>
              </Animated.View>
            </>
          )}
        </View>

        {/* ── Emotion Legend ── */}
        {activeIndex < cards.length ? (
          <Animated.View entering={FadeInUp.delay(400).duration(350)} style={styles.emotionLegend}>
            {EMOTIONS.map(e => (
              <View key={e.id} style={styles.legendItem}>
                <Text style={{ fontSize: 14 }}>{e.emoji}</Text>
                <Text style={[styles.legendLabel, { color: colors.textMuted }]}>{e.label}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}
      </SafeAreaView>

      {/* ── Detail Modal ── */}
      <CardDetailModal
        card={selectedCard}
        visible={showDetail}
        onClose={handleCloseDetail}
        colors={colors}
        isDark={isDark}
        userEmotion={selectedCard ? userEmotions[selectedCard.id] || null : null}
        onEmotion={handleDetailEmotion}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Header ── */
  headerGradient: { paddingBottom: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '600' },
  shuffleBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  progressBar: {
    height: 3,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(212,175,55,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },

  /* ── Card Stack ── */
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  cardOuter: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  /* ── Card Image ── */
  cardImageWrap: {
    flex: 1,
    position: 'relative',
  },
  creatorPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingRight: 14,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  creatorPillAvatar: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.50)',
  },
  creatorPillName: {
    fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.2,
  },
  cardTagsRow: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 6,
  },
  cardTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardTagText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.3, textTransform: 'uppercase' },
  cardTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.25)',
  },
  cardTimeText: { fontSize: 10, fontWeight: '700', color: '#FFD700' },
  cardNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 40,
  },
  cardDishName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  cardDifficulty: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,215,0,0.85)',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* ── Emotion Bar ── */
  emotionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  emotionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emotionEmoji: { fontSize: 16 },
  emotionCount: { fontSize: 12, fontWeight: '700' },
  tapHint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
  },

  /* ── Swipe Hints ── */
  swipeHints: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  swipeHintText: { fontSize: 12, fontWeight: '600' },

  /* ── Emotion Legend ── */
  emotionLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 16,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendLabel: { fontSize: 11, fontWeight: '600' },

  /* ── End State ── */
  endState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  endEmoji: { fontSize: 56, marginBottom: 8 },
  endTitle: { fontSize: 22, fontWeight: '800' },
  endSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  endBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 16 },
  endBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
  },
  endBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  /* ── Detail Modal ── */
  detailContainer: { flex: 1 },
  detailVideoWrap: {
    height: SCREEN_H * 0.52,
    position: 'relative',
  },
  detailTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  detailBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailTopCenter: { flex: 1, alignItems: 'center' },
  detailLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
  },
  detailLiveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700',
  },
  detailLiveText: { fontSize: 12, fontWeight: '700', color: '#FFD700' },
  detailBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  detailCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  detailCreatorAvatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: 'rgba(212,175,55,0.50)',
  },
  detailCreatorName: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  detailCreatorSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  detailDishName: {
    fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.3,
  },
  detailDescription: {
    fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.75)', lineHeight: 19,
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  detailMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  detailMetaText: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.80)',
    textTransform: 'capitalize',
  },

  /* ── Detail Info Section ── */
  detailInfoSection: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  detailEmotionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  detailEmotionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  detailEmotionLabel: { fontSize: 11, fontWeight: '700' },
  detailEmotionCount: { fontSize: 13, fontWeight: '800' },

  /* ── Recipe Section ── */
  detailRecipeSection: {
    gap: 14,
  },
  detailRecipeTitle: {
    fontSize: 18, fontWeight: '800', marginBottom: 4,
  },
  detailStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailStepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)',
  },
  detailStepNumberText: { fontSize: 13, fontWeight: '800', color: '#D4AF37' },
  detailStepText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20, paddingTop: 3 },
});
