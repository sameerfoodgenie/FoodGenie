import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  ViewToken,
  ActivityIndicator,
  RefreshControl,
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
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '@/template';
import {
  fetchFoodCards,
  fetchUserEmotions,
  toggleEmotion,
  FoodCardDB,
  EmotionType,
} from '../../services/foodCardService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Types ──
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

interface FoodieCard {
  id: string;
  dishName: string;
  creator: string;
  creatorAvatar: string;
  imageUri: string;
  description: string;
  recipe: string[];
  emotions: Record<EmotionType, number>;
  tags: string[];
  cookTime: string;
  difficulty: string;
  restaurant?: string;
  price?: string;
  category: string;
}

function mapDBtoUI(card: FoodCardDB): FoodieCard {
  return {
    id: card.id,
    dishName: card.dish_name,
    creator: card.creator_handle,
    creatorAvatar: card.creator_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
    imageUri: card.image_url,
    description: card.description || '',
    recipe: Array.isArray(card.recipe_steps) ? card.recipe_steps : [],
    emotions: {
      craving: card.craving_count,
      must_try: card.must_try_count,
      loved: card.loved_count,
    },
    tags: card.tags || [],
    cookTime: card.cook_time || '—',
    difficulty: card.difficulty || 'Easy',
    restaurant: card.restaurant_name || undefined,
    price: card.price || undefined,
    category: card.category || 'trending',
  };
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

const CATEGORY_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  trending: { emoji: '🔥', label: 'Trending', color: '#FF6B6B' },
  nearby: { emoji: '📍', label: 'Near You', color: '#4ADE80' },
  creator: { emoji: '👨‍🍳', label: 'Chef Pick', color: '#D4AF37' },
  offer: { emoji: '🎟️', label: 'Deal', color: '#818CF8' },
};

// ── Heart Animation Overlay ──
function HeartOverlay({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 1;
      scale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10 }),
        withDelay(400, withTiming(1.5, { duration: 300 })),
      );
      opacity.value = withDelay(600, withTiming(0, { duration: 300 }, () => {
        runOnJS(onDone)();
      }));
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[sty.heartOverlay, animStyle]} pointerEvents="none">
      <Text style={{ fontSize: 80 }}>🤤</Text>
    </Animated.View>
  );
}

// ── Save Toast ──
function SaveToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOut.duration(300)} style={sty.saveToast}>
      <MaterialIcons name="bookmark" size={18} color="#FFD700" />
      <Text style={sty.saveToastText}>Saved!</Text>
    </Animated.View>
  );
}

// ── Fullscreen Food Card ──
function FoodieCardView({
  card,
  isActive,
  cardHeight,
  userEmotion,
  isLiked,
  isSaved,
  onEmotion,
  onDoubleTap,
  onLongPress,
  onOpenDetail,
  colors,
  isDark,
}: {
  card: FoodieCard;
  isActive: boolean;
  cardHeight: number;
  userEmotion: EmotionType | null;
  isLiked: boolean;
  isSaved: boolean;
  onEmotion: (e: EmotionType) => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
  onOpenDetail: () => void;
  colors: any;
  isDark: boolean;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const lastTap = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressing = useRef(false);

  const categoryInfo = CATEGORY_LABELS[card.category] || CATEGORY_LABELS.trending;

  const handlePressIn = useCallback(() => {
    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress();
      setShowSave(true);
      setTimeout(() => setShowSave(false), 1200);
    }, 500);
  }, [onLongPress]);

  const handlePressOut = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePress = useCallback(() => {
    if (isLongPressing.current) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onDoubleTap();
      setShowHeart(true);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          onOpenDetail();
        }
      }, 320);
    }
  }, [onDoubleTap, onOpenDetail]);

  return (
    <View style={[sty.cardContainer, { height: cardHeight }]}>
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Image
          source={{ uri: card.imageUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.80)']}
          locations={[0, 0.2, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Pressable>

      <HeartOverlay visible={showHeart} onDone={() => setShowHeart(false)} />
      <SaveToast visible={showSave} />

      {/* Top badges */}
      <SafeAreaView edges={['top']} style={sty.topOverlay} pointerEvents="box-none">
        <View style={[sty.categoryBadge, { backgroundColor: `${categoryInfo.color}CC` }]}>
          <Text style={{ fontSize: 11 }}>{categoryInfo.emoji}</Text>
          <Text style={sty.categoryText}>{categoryInfo.label}</Text>
        </View>
        {card.price ? (
          <View style={sty.priceBadge}>
            <Text style={sty.priceText}>{card.price}</Text>
          </View>
        ) : null}
      </SafeAreaView>

      {/* Right actions */}
      <View style={sty.rightActions} pointerEvents="box-none">
        {EMOTIONS.map(em => {
          const sel = userEmotion === em.id;
          const count = card.emotions[em.id];
          return (
            <Pressable
              key={em.id}
              style={({ pressed }) => [sty.rightActionBtn, pressed && { transform: [{ scale: 0.9 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEmotion(em.id); }}
            >
              <Text style={[sty.rightActionEmoji, sel && { fontSize: 30 }]}>{em.emoji}</Text>
              <Text style={[sty.rightActionCount, sel && { color: em.color, fontWeight: '900' }]}>{formatCount(count)}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={({ pressed }) => [sty.rightActionBtn, pressed && { transform: [{ scale: 0.9 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLongPress();
            setShowSave(true);
            setTimeout(() => setShowSave(false), 1200);
          }}
        >
          <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={30} color={isSaved ? '#FFD700' : '#FFF'} />
          <Text style={sty.rightActionCount}>Save</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [sty.rightActionBtn, pressed && { transform: [{ scale: 0.9 }] }]}
          onPress={() => Haptics.selectionAsync()}
        >
          <MaterialIcons name="share" size={28} color="#FFF" />
          <Text style={sty.rightActionCount}>Share</Text>
        </Pressable>
      </View>

      {/* Bottom info */}
      <View style={sty.bottomInfo} pointerEvents="box-none">
        <Pressable style={sty.creatorRow} onPress={() => Haptics.selectionAsync()}>
          <Image source={{ uri: card.creatorAvatar }} style={sty.creatorAvatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={sty.creatorName}>@{card.creator}</Text>
            {card.restaurant ? <Text style={sty.restaurantName}>{card.restaurant}</Text> : null}
          </View>
          <Pressable
            style={({ pressed }) => [sty.followChip, pressed && { opacity: 0.8 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={sty.followChipText}>Follow</Text>
          </Pressable>
        </Pressable>

        <Text style={sty.dishName}>{card.dishName}</Text>
        <Text style={sty.dishDescription} numberOfLines={2}>{card.description}</Text>

        <View style={sty.metaRow}>
          <View style={sty.metaBadge}>
            <MaterialIcons name="schedule" size={12} color="#FFD700" />
            <Text style={sty.metaText}>{card.cookTime}</Text>
          </View>
          <View style={sty.metaBadge}>
            <MaterialIcons name="signal-cellular-alt" size={12} color="#FFD700" />
            <Text style={sty.metaText}>{card.difficulty}</Text>
          </View>
          {card.tags.slice(0, 2).map(tag => (
            <View key={tag} style={sty.tagBadge}>
              <Text style={sty.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={sty.swipeHint}>
          <MaterialIcons name="keyboard-arrow-up" size={18} color="rgba(255,255,255,0.40)" />
          <Text style={sty.swipeHintText}>Swipe up for more</Text>
        </View>
      </View>
    </View>
  );
}

// ── Detail Modal ──
function DetailModal({ card, visible, onClose, colors, isDark, userEmotion, onEmotion }: {
  card: FoodieCard | null; visible: boolean; onClose: () => void;
  colors: any; isDark: boolean; userEmotion: EmotionType | null;
  onEmotion: (e: EmotionType) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!card) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[sty.detailRoot, { backgroundColor: colors.background }]}>
        <View style={sty.detailHero}>
          <Image source={{ uri: card.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'transparent', 'rgba(0,0,0,0.80)']}
            locations={[0, 0.2, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[sty.detailTopBar, { paddingTop: insets.top + 8 }]}>
            <Pressable style={({ pressed }) => [sty.detailBackBtn, pressed && { opacity: 0.7 }]} onPress={() => { Haptics.selectionAsync(); onClose(); }}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
          </View>
          <View style={sty.detailHeroInfo}>
            <View style={sty.detailCreatorRow}>
              <Image source={{ uri: card.creatorAvatar }} style={sty.detailCreatorAvatar} contentFit="cover" />
              <Text style={sty.detailCreatorName}>@{card.creator}</Text>
            </View>
            <Text style={sty.detailDishName}>{card.dishName}</Text>
            {card.restaurant ? <Text style={sty.detailRestaurant}>📍 {card.restaurant}</Text> : null}
          </View>
        </View>

        <ScrollView
          style={[sty.detailContent, { backgroundColor: colors.background }]}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[sty.detailDescription, { color: colors.textSecondary }]}>{card.description}</Text>

          <View style={sty.detailMeta}>
            <View style={[sty.detailMetaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="schedule" size={18} color="#D4AF37" />
              <Text style={[sty.detailMetaValue, { color: colors.textPrimary }]}>{card.cookTime}</Text>
              <Text style={[sty.detailMetaLabel, { color: colors.textMuted }]}>Cook Time</Text>
            </View>
            <View style={[sty.detailMetaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="signal-cellular-alt" size={18} color="#D4AF37" />
              <Text style={[sty.detailMetaValue, { color: colors.textPrimary }]}>{card.difficulty}</Text>
              <Text style={[sty.detailMetaLabel, { color: colors.textMuted }]}>Difficulty</Text>
            </View>
            {card.price ? (
              <View style={[sty.detailMetaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="sell" size={18} color="#D4AF37" />
                <Text style={[sty.detailMetaValue, { color: colors.textPrimary }]}>{card.price}</Text>
                <Text style={[sty.detailMetaLabel, { color: colors.textMuted }]}>Price</Text>
              </View>
            ) : null}
          </View>

          <View style={sty.detailEmotionRow}>
            {EMOTIONS.map(em => {
              const sel = userEmotion === em.id;
              const count = card.emotions[em.id];
              return (
                <Pressable
                  key={em.id}
                  style={({ pressed }) => [
                    sty.detailEmotionBtn,
                    { backgroundColor: sel ? `${em.color}20` : colors.surface, borderColor: sel ? em.color : colors.border },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onEmotion(em.id); }}
                >
                  <Text style={{ fontSize: 24 }}>{em.emoji}</Text>
                  <Text style={[sty.detailEmotionLabel, { color: sel ? em.color : colors.textSecondary }]}>{em.label}</Text>
                  <Text style={[sty.detailEmotionCount, { color: sel ? em.color : colors.textMuted }]}>{formatCount(count)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={sty.detailTagsRow}>
            {card.tags.map(tag => (
              <View key={tag} style={[sty.detailTag, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.20)' }]}>
                <Text style={sty.detailTagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={sty.detailRecipeSection}>
            <Text style={[sty.detailRecipeTitle, { color: colors.textPrimary }]}>Quick Recipe</Text>
            {card.recipe.map((step, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(100 + i * 80).duration(300)} style={sty.detailStepRow}>
                <View style={sty.detailStepNum}><Text style={sty.detailStepNumText}>{i + 1}</Text></View>
                <Text style={[sty.detailStepText, { color: colors.textSecondary }]}>{step}</Text>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Loading Skeleton ──
function LoadingSkeleton({ cardHeight }: { cardHeight: number }) {
  return (
    <View style={[sty.cardContainer, { height: cardHeight, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color="#D4AF37" />
      <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 14, fontWeight: '600' }}>Loading food cards...</Text>
    </View>
  );
}

// ── MAIN SCREEN ──
export default function FoodiesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [dimensions, setDimensions] = useState({ width: SCREEN_W, height: SCREEN_H });
  useEffect(() => {
    const update = () => {
      const w = Dimensions.get('window');
      setDimensions({ width: w.width, height: w.height });
    };
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  const cardHeight = Math.max(1, dimensions.height - (insets.bottom + (Platform.OS === 'ios' ? 88 : 72)));

  // ── Data State ──
  const [cards, setCards] = useState<FoodieCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmotions, setUserEmotions] = useState<Record<string, EmotionType | null>>({});
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<FoodieCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // ── Fetch Data ──
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: dbCards } = await fetchFoodCards({ limit: 50 });
      const uiCards = dbCards.map(mapDBtoUI);
      setCards(uiCards);

      // Load user emotions if logged in
      if (user?.id) {
        const { data: emotions } = await fetchUserEmotions(user.id);
        const emotionMap: Record<string, EmotionType | null> = {};
        emotions.forEach(e => { emotionMap[e.card_id] = e.emotion_type; });
        setUserEmotions(emotionMap);
      }
    } catch (e) {
      console.log('FoodiesScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Emotion Toggle (writes to DB) ──
  const handleEmotion = useCallback(async (cardId: string, emotion: EmotionType) => {
    if (!user?.id) return;

    // Optimistic update
    setUserEmotions(prev => {
      const current = prev[cardId];
      return { ...prev, [cardId]: current === emotion ? null : emotion };
    });

    // Optimistic count update
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const currentEm = userEmotions[cardId];
      const newEmotions = { ...c.emotions };
      // Undo previous
      if (currentEm) newEmotions[currentEm] = Math.max(0, newEmotions[currentEm] - 1);
      // Apply new if different
      if (currentEm !== emotion) newEmotions[emotion] = newEmotions[emotion] + 1;
      return { ...c, emotions: newEmotions };
    }));

    // DB call
    const { error } = await toggleEmotion(cardId, user.id, emotion);
    if (error) {
      console.log('Toggle emotion error:', error);
      // Revert on error — refetch
      loadData(true);
    }
  }, [user?.id, userEmotions, loadData]);

  const handleDoubleTap = useCallback((cardId: string) => {
    setLikedCards(prev => { const s = new Set(prev); s.add(cardId); return s; });
    if (!userEmotions[cardId] && user?.id) {
      handleEmotion(cardId, 'craving');
    }
  }, [userEmotions, user?.id, handleEmotion]);

  const handleSave = useCallback((cardId: string) => {
    setSavedCards(prev => {
      const s = new Set(prev);
      if (s.has(cardId)) s.delete(cardId); else s.add(cardId);
      return s;
    });
  }, []);

  const handleOpenDetail = useCallback((card: FoodieCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCard(card);
    setShowDetail(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setTimeout(() => setSelectedCard(null), 300);
  }, []);

  const handleDetailEmotion = useCallback((emotion: EmotionType) => {
    if (selectedCard) handleEmotion(selectedCard.id, emotion);
  }, [selectedCard, handleEmotion]);

  // Keep detail card in sync with card state
  const detailCard = useMemo(() => {
    if (!selectedCard) return null;
    return cards.find(c => c.id === selectedCard.id) || selectedCard;
  }, [selectedCard, cards]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderCard = useCallback(({ item, index }: { item: FoodieCard; index: number }) => (
    <FoodieCardView
      card={item}
      isActive={index === activeIndex}
      cardHeight={cardHeight}
      userEmotion={userEmotions[item.id] || null}
      isLiked={likedCards.has(item.id)}
      isSaved={savedCards.has(item.id)}
      onEmotion={(e) => handleEmotion(item.id, e)}
      onDoubleTap={() => handleDoubleTap(item.id)}
      onLongPress={() => handleSave(item.id)}
      onOpenDetail={() => handleOpenDetail(item)}
      colors={colors}
      isDark={isDark}
    />
  ), [activeIndex, cardHeight, userEmotions, likedCards, savedCards, colors, isDark, handleEmotion, handleDoubleTap, handleSave, handleOpenDetail]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: cardHeight,
    offset: cardHeight * index,
    index,
  }), [cardHeight]);

  if (loading && cards.length === 0) {
    return (
      <View style={[sty.container, { backgroundColor: '#000' }]}>
        <LoadingSkeleton cardHeight={cardHeight} />
      </View>
    );
  }

  return (
    <View style={[sty.container, { backgroundColor: '#000' }]}>
      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        pagingEnabled
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
        ListEmptyComponent={
          <View style={[sty.cardContainer, { height: cardHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>No food cards yet</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 }}>Pull down to refresh</Text>
          </View>
        }
      />

      <DetailModal
        card={detailCard}
        visible={showDetail}
        onClose={handleCloseDetail}
        colors={colors}
        isDark={isDark}
        userEmotion={detailCard ? userEmotions[detailCard.id] || null : null}
        onEmotion={handleDetailEmotion}
      />
    </View>
  );
}

// ── STYLES ──
const sty = StyleSheet.create({
  container: { flex: 1 },
  cardContainer: { width: '100%', position: 'relative' },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
  saveToast: {
    position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 50,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  saveToastText: { fontSize: 15, fontWeight: '800', color: '#FFD700' },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, zIndex: 10,
  },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  categoryText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  priceBadge: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.92)',
  },
  priceText: { fontSize: 14, fontWeight: '900', color: '#1A1A2E' },
  rightActions: {
    position: 'absolute', right: 12, bottom: 200, gap: 18, alignItems: 'center', zIndex: 10,
  },
  rightActionBtn: { alignItems: 'center', gap: 3 },
  rightActionEmoji: { fontSize: 26 },
  rightActionCount: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  bottomInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 20, gap: 8, zIndex: 10,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(212,175,55,0.50)',
  },
  creatorName: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  restaurantName: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  followChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.50)',
  },
  followChipText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  dishName: {
    fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  dishDescription: {
    fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.70)', lineHeight: 20,
  },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  metaText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },
  tagBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.20)',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: '#FFD700', textTransform: 'capitalize' },
  swipeHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 4, opacity: 0.6,
  },
  swipeHintText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.40)' },
  detailRoot: { flex: 1 },
  detailHero: { height: SCREEN_H * 0.42, position: 'relative' },
  detailTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 16, zIndex: 10,
  },
  detailBackBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailHeroInfo: { position: 'absolute', bottom: 20, left: 20, right: 20, gap: 6 },
  detailCreatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  detailCreatorAvatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: 'rgba(212,175,55,0.50)',
  },
  detailCreatorName: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  detailDishName: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  detailRestaurant: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.70)' },
  detailContent: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingTop: 28, paddingHorizontal: 20 },
  detailDescription: { fontSize: 15, fontWeight: '500', lineHeight: 23, marginBottom: 20 },
  detailMeta: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  detailMetaCard: {
    flex: 1, alignItems: 'center', gap: 5,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  detailMetaValue: { fontSize: 14, fontWeight: '800' },
  detailMetaLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  detailEmotionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  detailEmotionBtn: {
    flex: 1, alignItems: 'center', gap: 5,
    paddingVertical: 14, borderRadius: 18, borderWidth: 1.5,
  },
  detailEmotionLabel: { fontSize: 11, fontWeight: '700' },
  detailEmotionCount: { fontSize: 13, fontWeight: '800' },
  detailTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  detailTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  detailTagText: { fontSize: 12, fontWeight: '700', color: '#D4AF37', textTransform: 'capitalize' },
  detailRecipeSection: { gap: 14, marginBottom: 16 },
  detailRecipeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  detailStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailStepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)',
  },
  detailStepNumText: { fontSize: 13, fontWeight: '800', color: '#D4AF37' },
  detailStepText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20, paddingTop: 3 },
});
