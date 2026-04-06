import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.62;
const CARD_H = CARD_W * 1.28;
const SMALL_CARD_W = SCREEN_W * 0.42;
const SMALL_CARD_H = SMALL_CARD_W * 1.15;
const RESTAURANT_CARD_W = SCREEN_W * 0.72;
const OFFER_CARD_W = SCREEN_W * 0.78;

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

// ── Food Card interface ──
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
  restaurant?: string;
  price?: string;
}

interface RestaurantCard {
  id: string;
  name: string;
  area: string;
  cuisines: string[];
  rating: number;
  deliveryTime: string;
  imageUri: string;
  priceRange: string;
  isPromoted: boolean;
  discount?: string;
}

interface OfferCard {
  id: string;
  title: string;
  description: string;
  provider: string;
  providerLogo: string;
  discount: string;
  code: string;
  imageUri: string;
  gradient: readonly [string, string];
  validUntil: string;
}

// ── SECTION DATA ──

const TRENDING_DISHES: FoodCard[] = [
  {
    id: 'td_1', dishName: 'Paneer Tikka Masala', creator: 'chef_aarav',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/5494998/5494998-uhd_2560_1440_30fps.mp4',
    description: 'Smoky, spiced paneer cubes grilled to perfection in rich tomato-cream gravy.',
    recipe: ['Marinate paneer in yogurt + spices', 'Grill until charred', 'Simmer in tomato-cream sauce', 'Garnish with cream + cilantro'],
    emotions: { craving: 342, must_try: 189, loved: 267 }, tags: ['north-indian', 'paneer'],
    cookTime: '25 min', difficulty: 'Easy', restaurant: 'Punjab Grill', price: '₹280',
  },
  {
    id: 'td_2', dishName: 'Butter Chicken', creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3296396/3296396-uhd_2560_1440_25fps.mp4',
    description: 'Creamy, buttery tomato gravy with tender chicken pieces.',
    recipe: ['Marinate chicken overnight', 'Grill in tandoor', 'Prepare makhani gravy', 'Simmer together'],
    emotions: { craving: 567, must_try: 398, loved: 445 }, tags: ['mughlai', 'chicken'],
    cookTime: '35 min', difficulty: 'Medium', restaurant: 'Moti Mahal', price: '₹320',
  },
  {
    id: 'td_3', dishName: 'Masala Dosa', creator: 'priya_vegan',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/4921967/4921967-hd_1920_1080_25fps.mp4',
    description: 'Crispy crepe filled with spiced potato filling, served with sambar and chutney.',
    recipe: ['Prepare dosa batter', 'Make potato masala', 'Spread on hot griddle', 'Serve with chutneys'],
    emotions: { craving: 412, must_try: 234, loved: 356 }, tags: ['south-indian', 'veg'],
    cookTime: '20 min', difficulty: 'Medium', restaurant: 'Sagar Ratna', price: '₹160',
  },
  {
    id: 'td_4', dishName: 'Chicken Biryani', creator: 'chef_aarav',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4',
    description: 'Fragrant basmati rice layered with spiced chicken and saffron.',
    recipe: ['Marinate chicken', 'Parboil rice', 'Layer and seal', 'Slow cook on dum'],
    emotions: { craving: 723, must_try: 512, loved: 634 }, tags: ['biryani', 'hyderabadi'],
    cookTime: '45 min', difficulty: 'Hard', restaurant: 'Paradise', price: '₹350',
  },
  {
    id: 'td_5', dishName: 'Pav Bhaji', creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    description: 'Mumbai street-style spiced vegetable mash with buttery toasted buns.',
    recipe: ['Boil and mash vegetables', 'Cook with pav bhaji masala', 'Toast pav in butter', 'Serve hot'],
    emotions: { craving: 534, must_try: 312, loved: 287 }, tags: ['street-food', 'mumbai'],
    cookTime: '30 min', difficulty: 'Easy', restaurant: 'Sardar Pav Bhaji', price: '₹180',
  },
];

const HIGHLY_ORDERED: FoodCard[] = [
  {
    id: 'ho_1', dishName: 'Veg Thali', creator: 'meera_kitchen',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/5494998/5494998-uhd_2560_1440_30fps.mp4',
    description: 'Complete Indian meal with dal, sabzi, roti, rice, and dessert.',
    recipe: ['Prepare dal tadka', 'Cook seasonal sabzi', 'Make fresh rotis', 'Assemble thali'],
    emotions: { craving: 298, must_try: 187, loved: 345 }, tags: ['thali', 'complete-meal'],
    cookTime: '40 min', difficulty: 'Medium', restaurant: 'Rajdhani', price: '₹250',
  },
  {
    id: 'ho_2', dishName: 'Chole Bhature', creator: 'chef_aarav',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/4921967/4921967-hd_1920_1080_25fps.mp4',
    description: 'Spicy chickpea curry served with deep-fried fluffy bread.',
    recipe: ['Soak chickpeas overnight', 'Pressure cook with spices', 'Knead bhatura dough', 'Deep fry and serve'],
    emotions: { craving: 489, must_try: 267, loved: 356 }, tags: ['punjabi', 'heavy'],
    cookTime: '50 min', difficulty: 'Medium', restaurant: 'Bikanervala', price: '₹200',
  },
  {
    id: 'ho_3', dishName: 'Hakka Noodles', creator: 'priya_vegan',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3296396/3296396-uhd_2560_1440_25fps.mp4',
    description: 'Indo-Chinese stir-fried noodles with crunchy veggies and soy sauce.',
    recipe: ['Boil noodles al dente', 'Stir fry vegetables', 'Toss with sauces', 'Serve hot'],
    emotions: { craving: 367, must_try: 198, loved: 278 }, tags: ['indo-chinese', 'quick'],
    cookTime: '15 min', difficulty: 'Easy', restaurant: 'Mainland China', price: '₹220',
  },
  {
    id: 'ho_4', dishName: 'Margherita Pizza', creator: 'ananya_desserts',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4',
    description: 'Classic thin-crust pizza with fresh mozzarella, basil, and tomato sauce.',
    recipe: ['Prepare pizza dough', 'Spread tomato sauce', 'Add fresh mozzarella', 'Bake at 250C'],
    emotions: { craving: 534, must_try: 312, loved: 445 }, tags: ['italian', 'pizza'],
    cookTime: '20 min', difficulty: 'Easy', restaurant: 'La Pinoz', price: '₹299',
  },
];

const TRENDING_RESTAURANTS: RestaurantCard[] = [
  {
    id: 'tr_1', name: 'Punjab Grill', area: 'Andheri West', cuisines: ['North Indian', 'Mughlai'],
    rating: 4.5, deliveryTime: '30 min', priceRange: '₹300-600',
    imageUri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    isPromoted: true, discount: '40% OFF up to ₹100',
  },
  {
    id: 'tr_2', name: 'The Bowl Company', area: 'Bandra', cuisines: ['Healthy', 'Bowls'],
    rating: 4.3, deliveryTime: '25 min', priceRange: '₹200-400',
    imageUri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    isPromoted: false, discount: 'Free delivery',
  },
  {
    id: 'tr_3', name: 'Wok Express', area: 'Lower Parel', cuisines: ['Chinese', 'Thai'],
    rating: 4.2, deliveryTime: '35 min', priceRange: '₹250-500',
    imageUri: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80',
    isPromoted: true, discount: '20% OFF',
  },
  {
    id: 'tr_4', name: 'Dosa Plaza', area: 'Malad', cuisines: ['South Indian', 'Dosa'],
    rating: 4.6, deliveryTime: '20 min', priceRange: '₹150-300',
    imageUri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80',
    isPromoted: false,
  },
];

const OFFERS: OfferCard[] = [
  {
    id: 'of_1', title: 'Flat 60% OFF', description: 'On your first order above ₹199',
    provider: 'Swiggy', providerLogo: '🟠', discount: '60% OFF', code: 'FIRST60',
    imageUri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    gradient: ['#FF6B35', '#FF9147'] as const, validUntil: 'Valid till Apr 15',
  },
  {
    id: 'of_2', title: 'Buy 1 Get 1 Free', description: 'On select restaurant meals',
    provider: 'Zomato', providerLogo: '🔴', discount: 'BOGO', code: 'ZOMATO2X',
    imageUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    gradient: ['#E23744', '#FF4757'] as const, validUntil: 'Limited time',
  },
  {
    id: 'of_3', title: '₹125 OFF', description: 'On orders above ₹499 from ONDC',
    provider: 'ONDC', providerLogo: '🟢', discount: '₹125 OFF', code: 'ONDC125',
    imageUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    gradient: ['#10B981', '#34D399'] as const, validUntil: 'Ends this week',
  },
];

const CREATOR_PICKS: FoodCard[] = [
  {
    id: 'cp_1', dishName: 'Avocado Toast', creator: 'priya_vegan',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/4921967/4921967-hd_1920_1080_25fps.mp4',
    description: 'Creamy avocado on sourdough with cherry tomatoes and microgreens.',
    recipe: ['Toast sourdough bread', 'Mash avocado with lime', 'Top with tomatoes', 'Season and serve'],
    emotions: { craving: 234, must_try: 312, loved: 198 }, tags: ['healthy', 'breakfast'],
    cookTime: '10 min', difficulty: 'Easy',
  },
  {
    id: 'cp_2', dishName: 'Tandoori Momos', creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3296396/3296396-uhd_2560_1440_25fps.mp4',
    description: 'Steamed momos grilled in tandoori masala with spicy mayo.',
    recipe: ['Prepare momo filling', 'Wrap and steam', 'Coat in tandoori paste', 'Grill until charred'],
    emotions: { craving: 456, must_try: 378, loved: 289 }, tags: ['fusion', 'street-food'],
    cookTime: '30 min', difficulty: 'Medium',
  },
  {
    id: 'cp_3', dishName: 'Mango Lassi', creator: 'meera_kitchen',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    description: 'Thick and creamy mango yogurt smoothie with cardamom.',
    recipe: ['Blend ripe mangoes', 'Add chilled yogurt', 'Sweeten with sugar', 'Top with pistachios'],
    emotions: { craving: 345, must_try: 198, loved: 423 }, tags: ['drink', 'summer'],
    cookTime: '5 min', difficulty: 'Easy',
  },
  {
    id: 'cp_4', dishName: 'Paneer Wrap', creator: 'chef_aarav',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1600335895229-6bf07138acba?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/5494998/5494998-uhd_2560_1440_30fps.mp4',
    description: 'Grilled paneer with fresh veggies and mint chutney in a whole wheat wrap.',
    recipe: ['Marinate and grill paneer', 'Chop fresh veggies', 'Spread mint chutney', 'Roll and serve'],
    emotions: { craving: 287, must_try: 234, loved: 312 }, tags: ['wrap', 'protein'],
    cookTime: '15 min', difficulty: 'Easy',
  },
];

const QUICK_CRAVINGS: FoodCard[] = [
  {
    id: 'qc_1', dishName: 'Samosa', creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3296396/3296396-uhd_2560_1440_25fps.mp4',
    description: 'Crispy deep-fried pastry stuffed with spiced potatoes and peas.',
    recipe: ['Make potato filling', 'Prepare pastry dough', 'Shape and fill', 'Deep fry golden'],
    emotions: { craving: 612, must_try: 234, loved: 445 }, tags: ['snack', 'crispy'],
    cookTime: '5 min', difficulty: 'Easy', price: '₹30',
  },
  {
    id: 'qc_2', dishName: 'Vada Pav', creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    description: 'Mumbai street burger: spiced potato fritter in a soft bun with chutneys.',
    recipe: ['Make aloo vada', 'Toast pav', 'Apply chutneys', 'Assemble and serve'],
    emotions: { craving: 534, must_try: 312, loved: 389 }, tags: ['mumbai', 'quick'],
    cookTime: '5 min', difficulty: 'Easy', price: '₹40',
  },
  {
    id: 'qc_3', dishName: 'Chai & Biscuits', creator: 'meera_kitchen',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/4921967/4921967-hd_1920_1080_25fps.mp4',
    description: 'Strong masala chai with crunchy butter biscuits. Perfect evening snack.',
    recipe: ['Boil water with ginger', 'Add tea leaves', 'Pour in milk', 'Strain and serve'],
    emotions: { craving: 456, must_try: 178, loved: 523 }, tags: ['tea', 'comfort'],
    cookTime: '8 min', difficulty: 'Easy', price: '₹50',
  },
  {
    id: 'qc_4', dishName: 'Bhel Puri', creator: 'rohan_streetfood',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4',
    description: 'Tangy, crunchy puffed rice snack with onions, tomatoes and chutneys.',
    recipe: ['Mix puffed rice and sev', 'Add chopped onion, tomato', 'Toss with chutneys', 'Serve immediately'],
    emotions: { craving: 389, must_try: 245, loved: 267 }, tags: ['chaat', 'tangy'],
    cookTime: '5 min', difficulty: 'Easy', price: '₹60',
  },
  {
    id: 'qc_5', dishName: 'Paneer Puff', creator: 'ananya_desserts',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    imageUri: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
    videoUri: 'https://videos.pexels.com/video-files/3296396/3296396-uhd_2560_1440_25fps.mp4',
    description: 'Flaky puff pastry filled with spiced paneer and peppers.',
    recipe: ['Prepare paneer filling', 'Roll puff pastry', 'Fill and seal', 'Bake until golden'],
    emotions: { craving: 287, must_try: 198, loved: 234 }, tags: ['bakery', 'snack'],
    cookTime: '10 min', difficulty: 'Easy', price: '₹45',
  },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// ── Section Header ──
function SectionHeader({ emoji, title, subtitle, colors, onSeeAll }: {
  emoji: string; title: string; subtitle?: string; colors: any; onSeeAll?: () => void;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionTitleRow}>
        <View style={s.sectionEmojiWrap}>
          <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? <Text style={[s.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {onSeeAll ? (
        <Pressable style={({ pressed }) => [s.seeAllBtn, pressed && { opacity: 0.7 }]} onPress={onSeeAll}>
          <Text style={s.seeAllText}>See All</Text>
          <MaterialIcons name="chevron-right" size={18} color="#D4AF37" />
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Trending Dish Card ──
function TrendingDishCard({ card, index, userEmotion, onEmotion, onPress, colors }: {
  card: FoodCard; index: number; userEmotion: EmotionType | null;
  onEmotion: (id: string, e: EmotionType) => void; onPress: () => void; colors: any;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 70).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          s.trendCard, { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onPress}
      >
        <View style={s.trendCardImage}>
          <Image source={{ uri: card.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.70)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFillObject} />
          <View style={s.trendCreatorPill}>
            <Image source={{ uri: card.creatorAvatar }} style={s.trendCreatorAvatar} contentFit="cover" />
            <Text style={s.trendCreatorName}>@{card.creator}</Text>
          </View>
          {card.price ? (
            <View style={s.trendPriceBadge}>
              <Text style={s.trendPriceText}>{card.price}</Text>
            </View>
          ) : null}
          <View style={s.trendNameOverlay}>
            <Text style={s.trendDishName} numberOfLines={1}>{card.dishName}</Text>
            <View style={s.trendMetaRow}>
              <MaterialIcons name="schedule" size={10} color="#FFD700" />
              <Text style={s.trendMetaText}>{card.cookTime}</Text>
              <Text style={s.trendDot}>·</Text>
              <Text style={s.trendMetaText}>{card.difficulty}</Text>
            </View>
          </View>
        </View>
        <View style={s.trendTagsRow}>
          {card.tags.slice(0, 2).map(tag => (
            <View key={tag} style={[s.trendTag, { backgroundColor: `${colors.textMuted}12` }]}>
              <Text style={[s.trendTagText, { color: colors.textSecondary }]}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={[s.trendEmotionBar, { borderTopColor: colors.border }]}>
          {EMOTIONS.map(em => {
            const sel = userEmotion === em.id;
            const count = card.emotions[em.id] + (sel ? 1 : 0);
            return (
              <Pressable key={em.id} style={[s.trendEmotionBtn, sel && { backgroundColor: `${em.color}15` }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEmotion(card.id, em.id); }}
              >
                <Text style={{ fontSize: sel ? 15 : 13 }}>{em.emoji}</Text>
                <Text style={[s.trendEmotionCount, { color: sel ? em.color : colors.textMuted }]}>{formatCount(count)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Small Food Card (for Highly Ordered & Quick Cravings) ──
function SmallFoodCard({ card, index, onPress, colors }: {
  card: FoodCard; index: number; onPress: () => void; colors: any;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 60).duration(280)}>
      <Pressable
        style={({ pressed }) => [
          s.smallCard, { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.95, transform: [{ scale: 0.97 }] },
        ]}
        onPress={onPress}
      >
        <View style={s.smallCardImage}>
          <Image source={{ uri: card.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFillObject} />
          {card.price ? (
            <View style={s.smallPriceBadge}><Text style={s.smallPriceText}>{card.price}</Text></View>
          ) : null}
          <Text style={s.smallDishName} numberOfLines={1}>{card.dishName}</Text>
        </View>
        <View style={s.smallInfo}>
          <View style={s.smallMetaRow}>
            <MaterialIcons name="schedule" size={10} color="#D4AF37" />
            <Text style={[s.smallMetaText, { color: colors.textMuted }]}>{card.cookTime}</Text>
          </View>
          <View style={s.smallEmotionRow}>
            {EMOTIONS.map(em => (
              <Text key={em.id} style={{ fontSize: 10 }}>{em.emoji} {formatCount(card.emotions[em.id])}</Text>
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Restaurant Card ──
function RestaurantCardItem({ restaurant, index, colors }: {
  restaurant: RestaurantCard; index: number; colors: any;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 70).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          s.restCard, { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => Haptics.selectionAsync()}
      >
        <View style={s.restCardImage}>
          <Image source={{ uri: restaurant.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFillObject} />
          {restaurant.isPromoted ? (
            <View style={s.promotedBadge}><Text style={s.promotedText}>Promoted</Text></View>
          ) : null}
          {restaurant.discount ? (
            <View style={s.restDiscountBadge}><Text style={s.restDiscountText}>{restaurant.discount}</Text></View>
          ) : null}
        </View>
        <View style={s.restInfo}>
          <View style={s.restNameRow}>
            <Text style={[s.restName, { color: colors.textPrimary }]} numberOfLines={1}>{restaurant.name}</Text>
            <View style={s.restRatingBadge}>
              <MaterialIcons name="star" size={12} color="#FFD700" />
              <Text style={s.restRatingText}>{restaurant.rating}</Text>
            </View>
          </View>
          <Text style={[s.restCuisines, { color: colors.textMuted }]} numberOfLines={1}>{restaurant.cuisines.join(' · ')}</Text>
          <View style={s.restMetaRow}>
            <View style={s.restMetaItem}>
              <MaterialIcons name="location-on" size={12} color={colors.textMuted} />
              <Text style={[s.restMetaText, { color: colors.textMuted }]}>{restaurant.area}</Text>
            </View>
            <View style={s.restMetaItem}>
              <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
              <Text style={[s.restMetaText, { color: colors.textMuted }]}>{restaurant.deliveryTime}</Text>
            </View>
            <Text style={[s.restMetaText, { color: colors.textMuted }]}>{restaurant.priceRange}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Offer Card ──
function OfferCardItem({ offer, index, colors }: {
  offer: OfferCard; index: number; colors: any;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(320)}>
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
        onPress={() => Haptics.selectionAsync()}
      >
        <LinearGradient colors={offer.gradient as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }} style={s.offerCard}>
          <View style={s.offerContent}>
            <View style={s.offerProviderRow}>
              <Text style={s.offerProviderLogo}>{offer.providerLogo}</Text>
              <Text style={s.offerProvider}>{offer.provider}</Text>
            </View>
            <Text style={s.offerTitle}>{offer.title}</Text>
            <Text style={s.offerDesc}>{offer.description}</Text>
            <View style={s.offerCodeRow}>
              <View style={s.offerCodeBadge}><Text style={s.offerCodeText}>{offer.code}</Text></View>
              <Text style={s.offerValid}>{offer.validUntil}</Text>
            </View>
          </View>
          <View style={s.offerImageWrap}>
            <Image source={{ uri: offer.imageUri }} style={s.offerImage} contentFit="cover" transition={200} />
          </View>
          <View style={[s.offerCircle, s.offerCircle1]} />
          <View style={[s.offerCircle, s.offerCircle2]} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Creator Pick Card ──
function CreatorPickCard({ card, index, onPress, colors }: {
  card: FoodCard; index: number; onPress: () => void; colors: any;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 70).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          s.creatorCard, { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onPress}
      >
        <View style={s.creatorCardImage}>
          <Image source={{ uri: card.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFillObject} />
          <View style={s.creatorPickBadge}>
            <Text style={{ fontSize: 10 }}>👨‍🍳</Text>
            <Text style={s.creatorPickText}>Chef Pick</Text>
          </View>
          <Text style={s.creatorCardDish} numberOfLines={1}>{card.dishName}</Text>
        </View>
        <View style={s.creatorCardInfo}>
          <View style={s.creatorCardRow}>
            <Image source={{ uri: card.creatorAvatar }} style={s.creatorCardAvatar} contentFit="cover" />
            <Text style={[s.creatorCardHandle, { color: colors.textSecondary }]}>@{card.creator}</Text>
          </View>
          <View style={s.creatorCardMeta}>
            <MaterialIcons name="schedule" size={10} color="#D4AF37" />
            <Text style={[s.creatorCardMetaText, { color: colors.textMuted }]}>{card.cookTime}</Text>
            <Text style={[s.creatorCardMetaText, { color: colors.textMuted }]}>·</Text>
            <Text style={[s.creatorCardMetaText, { color: colors.textMuted }]}>{card.difficulty}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Fullscreen Detail Modal ──
function CardDetailModal({ card, visible, onClose, colors, isDark, userEmotion, onEmotion }: {
  card: FoodCard | null; visible: boolean; onClose: () => void;
  colors: any; isDark: boolean; userEmotion: EmotionType | null;
  onEmotion: (e: EmotionType) => void;
}) {
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = useState(true);

  const player = useVideoPlayer(visible && card ? card.videoUri : '', (p) => {
    p.loop = true; p.muted = true;
    if (visible && card) p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (visible && card) {
      try { player.muted = true; setIsMuted(true); player.play(); } catch {}
    } else {
      try { player.pause(); } catch {}
    }
  }, [visible, card]);

  const toggleMute = useCallback(() => {
    Haptics.selectionAsync();
    const m = !isMuted; player.muted = m; setIsMuted(m);
  }, [isMuted, player]);

  if (!card) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[s.detailContainer, { backgroundColor: '#000' }]}>
        <View style={s.detailVideoWrap}>
          <VideoView style={StyleSheet.absoluteFillObject} player={player} contentFit="cover" nativeControls={false} />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.2, 0.55, 1]} style={StyleSheet.absoluteFillObject} />
          <SafeAreaView edges={['top']} style={s.detailTopBar}>
            <Pressable style={({ pressed }) => [s.detailBtn, pressed && { opacity: 0.7 }]} onPress={() => { Haptics.selectionAsync(); onClose(); }}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={({ pressed }) => [s.detailBtn, pressed && { opacity: 0.7 }]} onPress={toggleMute}>
              <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="#FFF" />
            </Pressable>
          </SafeAreaView>
          <View style={s.detailBottomOverlay}>
            <View style={s.detailCreatorRow}>
              <Image source={{ uri: card.creatorAvatar }} style={s.detailCreatorAvatar} contentFit="cover" />
              <View style={{ flex: 1 }}><Text style={s.detailCreatorName}>@{card.creator}</Text></View>
            </View>
            <Text style={s.detailDishName}>{card.dishName}</Text>
            <Text style={s.detailDescription}>{card.description}</Text>
            <View style={s.detailMeta}>
              <View style={s.detailMetaBadge}><MaterialIcons name="schedule" size={12} color="#FFD700" /><Text style={s.detailMetaText}>{card.cookTime}</Text></View>
              <View style={s.detailMetaBadge}><MaterialIcons name="signal-cellular-alt" size={12} color="#FFD700" /><Text style={s.detailMetaText}>{card.difficulty}</Text></View>
              {card.tags.map(tag => (<View key={tag} style={s.detailMetaBadge}><Text style={s.detailMetaText}>{tag}</Text></View>))}
            </View>
          </View>
        </View>
        <View style={[s.detailInfoSection, { backgroundColor: colors.background }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <View style={s.detailEmotionRow}>
              {EMOTIONS.map(em => {
                const sel = userEmotion === em.id;
                const count = card.emotions[em.id] + (sel ? 1 : 0);
                return (
                  <Pressable key={em.id}
                    style={({ pressed }) => [s.detailEmotionBtn, { backgroundColor: sel ? `${em.color}20` : colors.surface, borderColor: sel ? em.color : colors.border }, pressed && { opacity: 0.8 }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onEmotion(em.id); }}
                  >
                    <Text style={{ fontSize: 22 }}>{em.emoji}</Text>
                    <Text style={[s.detailEmotionLabel, { color: sel ? em.color : colors.textSecondary }]}>{em.label}</Text>
                    <Text style={[s.detailEmotionCount, { color: sel ? em.color : colors.textMuted }]}>{formatCount(count)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.detailRecipeSection}>
              <Text style={[s.detailRecipeTitle, { color: colors.textPrimary }]}>Quick Recipe</Text>
              {card.recipe.map((step, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(100 + i * 80).duration(300)} style={s.detailStepRow}>
                  <View style={s.detailStepNumber}><Text style={s.detailStepNumberText}>{i + 1}</Text></View>
                  <Text style={[s.detailStepText, { color: colors.textSecondary }]}>{step}</Text>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── MAIN EXPLORE SCREEN ──
export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [userEmotions, setUserEmotions] = useState<Record<string, EmotionType | null>>({});
  const [selectedCard, setSelectedCard] = useState<FoodCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleEmotion = useCallback((cardId: string, emotion: EmotionType) => {
    setUserEmotions(prev => ({ ...prev, [cardId]: prev[cardId] === emotion ? null : emotion }));
  }, []);

  const handleCardPress = useCallback((card: FoodCard) => {
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(res => setTimeout(res, 800));
    setRefreshing(false);
  }, []);

  const headerGradient = isDark
    ? ['#1A1510', '#1E1A12', '#14141C'] as const
    : ['#FFF8E1', '#FFECB3', '#FDF8F0'] as const;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={headerGradient} style={s.headerGradient}>
          <Animated.View entering={FadeIn.duration(300)} style={s.header}>
            <Pressable
              style={({ pressed }) => [s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.80)', borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); router.back(); }}
            >
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={[s.headerTitle, { color: isDark ? '#FFD700' : '#8B6914' }]}>Discover</Text>
              <Text style={[s.headerSub, { color: colors.textMuted }]}>Explore endless food</Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.searchIconBtn, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.12)', borderColor: 'rgba(212,175,55,0.25)' }, pressed && { opacity: 0.7 }]}
              onPress={() => Haptics.selectionAsync()}
            >
              <MaterialIcons name="search" size={22} color="#D4AF37" />
            </Pressable>
          </Animated.View>
        </LinearGradient>

        {/* Scrollable Feed */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />}
        >

          {/* ═══ 1. Trending Dishes 🔥 ═══ */}
          <Animated.View entering={FadeInDown.delay(50).duration(350)}>
            <SectionHeader emoji="🔥" title="Trending Dishes" subtitle="What everyone is eating" colors={colors} onSeeAll={() => Haptics.selectionAsync()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {TRENDING_DISHES.map((card, i) => (
                <TrendingDishCard key={card.id} card={card} index={i} userEmotion={userEmotions[card.id] || null}
                  onEmotion={handleEmotion} onPress={() => handleCardPress(card)} colors={colors} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ 2. Highly Ordered Today 📈 ═══ */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <SectionHeader emoji="📈" title="Highly Ordered Today" subtitle="Popular right now" colors={colors} onSeeAll={() => Haptics.selectionAsync()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {HIGHLY_ORDERED.map((card, i) => (
                <SmallFoodCard key={card.id} card={card} index={i} onPress={() => handleCardPress(card)} colors={colors} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ 3. Trending Restaurants Near Me 📍 ═══ */}
          <Animated.View entering={FadeInDown.delay(150).duration(350)}>
            <SectionHeader emoji="📍" title="Trending Near You" subtitle="Popular restaurants nearby" colors={colors} onSeeAll={() => Haptics.selectionAsync()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {TRENDING_RESTAURANTS.map((rest, i) => (
                <RestaurantCardItem key={rest.id} restaurant={rest} index={i} colors={colors} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ 4. Offers & Deals 🎟 ═══ */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <SectionHeader emoji="🎟️" title="Offers & Deals" subtitle="Save on your next meal" colors={colors} onSeeAll={() => Haptics.selectionAsync()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {OFFERS.map((offer, i) => (
                <OfferCardItem key={offer.id} offer={offer} index={i} colors={colors} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ 5. Creator Picks 👨‍🍳 ═══ */}
          <Animated.View entering={FadeInDown.delay(250).duration(350)}>
            <SectionHeader emoji="👨‍🍳" title="Creator Picks" subtitle="Recommended by top chefs" colors={colors} onSeeAll={() => Haptics.selectionAsync()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {CREATOR_PICKS.map((card, i) => (
                <CreatorPickCard key={card.id} card={card} index={i} onPress={() => handleCardPress(card)} colors={colors} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ 6. Quick Cravings 🤤 ═══ */}
          <Animated.View entering={FadeInDown.delay(300).duration(350)}>
            <SectionHeader emoji="🤤" title="Quick Cravings" subtitle="Fast bites under 10 min" colors={colors} onSeeAll={() => Haptics.selectionAsync()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {QUICK_CRAVINGS.map((card, i) => (
                <SmallFoodCard key={card.id} card={card} index={i} onPress={() => handleCardPress(card)} colors={colors} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ═══ Bottom CTA ═══ */}
          <Animated.View entering={FadeInDown.delay(350).duration(350)} style={s.bottomCta}>
            <View style={[s.ctaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 36 }}>🍽</Text>
              <Text style={[s.ctaTitle, { color: colors.textPrimary }]}>That is all for now!</Text>
              <Text style={[s.ctaSub, { color: colors.textMuted }]}>Pull down to refresh and discover more</Text>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={handleRefresh}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={s.ctaBtn}>
                  <MaterialIcons name="refresh" size={20} color="#FFF" />
                  <Text style={s.ctaBtnText}>Refresh Feed</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Detail Modal */}
      <CardDetailModal card={selectedCard} visible={showDetail} onClose={handleCloseDetail}
        colors={colors} isDark={isDark} userEmotion={selectedCard ? userEmotions[selectedCard.id] || null : null}
        onEmotion={handleDetailEmotion} />
    </View>
  );
}

// ── STYLES ──
const s = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  headerGradient: { paddingBottom: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '600' },
  searchIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 28, marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionEmojiWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: '#D4AF37' },

  /* Horizontal scroll */
  hScroll: { paddingHorizontal: 20, gap: 12 },

  /* Trending Dish Card */
  trendCard: {
    width: CARD_W, borderRadius: 20, overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  trendCardImage: { width: '100%', height: CARD_H, position: 'relative' },
  trendCreatorPill: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingRight: 12, paddingLeft: 4, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.50)',
  },
  trendCreatorAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.50)' },
  trendCreatorName: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  trendPriceBadge: {
    position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.90)',
  },
  trendPriceText: { fontSize: 12, fontWeight: '900', color: '#1A1A2E' },
  trendNameOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 12 },
  trendDishName: { fontSize: 18, fontWeight: '900', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  trendMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  trendMetaText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,215,0,0.85)' },
  trendDot: { fontSize: 11, color: 'rgba(255,255,255,0.40)' },
  trendTagsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  trendTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trendTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  trendEmotionBar: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8, gap: 4, borderTopWidth: 1 },
  trendEmotionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 6, borderRadius: 10 },
  trendEmotionCount: { fontSize: 10, fontWeight: '700' },

  /* Small Food Card */
  smallCard: {
    width: SMALL_CARD_W, borderRadius: 16, overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  smallCardImage: { width: '100%', height: SMALL_CARD_H, position: 'relative', justifyContent: 'flex-end', padding: 10 },
  smallPriceBadge: {
    position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.90)',
  },
  smallPriceText: { fontSize: 10, fontWeight: '900', color: '#1A1A2E' },
  smallDishName: { fontSize: 14, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  smallInfo: { paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  smallMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallMetaText: { fontSize: 10, fontWeight: '600' },
  smallEmotionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  /* Restaurant Card */
  restCard: {
    width: RESTAURANT_CARD_W, borderRadius: 18, overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  restCardImage: { width: '100%', height: 130, position: 'relative' },
  promotedBadge: {
    position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.90)',
  },
  promotedText: { fontSize: 9, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.5, textTransform: 'uppercase' },
  restDiscountBadge: {
    position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.90)',
  },
  restDiscountText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  restInfo: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  restNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restName: { fontSize: 15, fontWeight: '800', flex: 1 },
  restRatingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
  },
  restRatingText: { fontSize: 12, fontWeight: '800', color: '#D4AF37' },
  restCuisines: { fontSize: 12, fontWeight: '500' },
  restMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  restMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  restMetaText: { fontSize: 11, fontWeight: '600' },

  /* Offer Card */
  offerCard: {
    width: OFFER_CARD_W, height: 140, borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 18, overflow: 'hidden',
  },
  offerContent: { flex: 1, gap: 4, zIndex: 2 },
  offerProviderRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  offerProviderLogo: { fontSize: 14 },
  offerProvider: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, textTransform: 'uppercase' },
  offerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  offerDesc: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.80)' },
  offerCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  offerCodeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)',
  },
  offerCodeText: { fontSize: 11, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  offerValid: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.60)' },
  offerImageWrap: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', marginLeft: 12, zIndex: 2 },
  offerImage: { width: '100%', height: '100%' },
  offerCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
  offerCircle1: { width: 100, height: 100, top: -30, right: -10 },
  offerCircle2: { width: 60, height: 60, bottom: -20, left: 40 },

  /* Creator Pick Card */
  creatorCard: {
    width: CARD_W * 0.85, borderRadius: 18, overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  creatorCardImage: { width: '100%', height: CARD_W * 0.65, position: 'relative', justifyContent: 'flex-end', padding: 12 },
  creatorPickBadge: {
    position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.90)',
  },
  creatorPickText: { fontSize: 10, fontWeight: '800', color: '#1A1A2E' },
  creatorCardDish: { fontSize: 16, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  creatorCardInfo: { paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  creatorCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorCardAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)' },
  creatorCardHandle: { fontSize: 12, fontWeight: '700' },
  creatorCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creatorCardMetaText: { fontSize: 11, fontWeight: '600' },

  /* Bottom CTA */
  bottomCta: { paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
  ctaCard: {
    padding: 28, borderRadius: 22, alignItems: 'center', gap: 10,
    borderWidth: 1,
  },
  ctaTitle: { fontSize: 18, fontWeight: '800' },
  ctaSub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18, marginTop: 8,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  /* Detail Modal */
  detailContainer: { flex: 1 },
  detailVideoWrap: { height: SCREEN_H * 0.50, position: 'relative' },
  detailTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, zIndex: 10,
  },
  detailBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.40)', alignItems: 'center', justifyContent: 'center' },
  detailBottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20, gap: 6 },
  detailCreatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  detailCreatorAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(212,175,55,0.50)' },
  detailCreatorName: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  detailDishName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  detailDescription: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.75)', lineHeight: 19 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  detailMetaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  detailMetaText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.80)', textTransform: 'capitalize' },
  detailInfoSection: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, paddingTop: 24, paddingHorizontal: 20 },
  detailEmotionRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  detailEmotionBtn: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 14, borderRadius: 18, borderWidth: 1.5 },
  detailEmotionLabel: { fontSize: 11, fontWeight: '700' },
  detailEmotionCount: { fontSize: 13, fontWeight: '800' },
  detailRecipeSection: { gap: 14 },
  detailRecipeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  detailStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailStepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)',
  },
  detailStepNumberText: { fontSize: 13, fontWeight: '800', color: '#D4AF37' },
  detailStepText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20, paddingTop: 3 },
});
