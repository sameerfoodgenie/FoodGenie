import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const DISH_IMAGE_SIZE = 80;

// ── Types ──
interface DishPhoto {
  name: string;
  image: string;
}

interface VideoReview {
  id: string;
  customerName: string;
  customerPhoto: string;
  thumbnail: string;
  videoUrl: string;
  rating: number;
  comment: string;
  date: string;
}

interface CookPricing {
  perMeal: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
}

interface Cook {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviews: number;
  experience: string;
  expertise: string[];
  speciality: string;
  pricing: CookPricing;
  isAvailable: boolean;
  bio: string;
  dishes: DishPhoto[];
  videoReviews: VideoReview[];
  languages: string[];
  location: string;
}

// ── Cook Data with real-looking photos ──
const COOKS: Cook[] = [
  {
    id: '1',
    name: 'Sunita Devi',
    photo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80',
    rating: 4.9,
    reviews: 234,
    experience: '12 years',
    expertise: ['North Indian', 'Mughlai', 'Tandoor'],
    speciality: 'North Indian',
    pricing: { perMeal: 350, perDay: 800, perWeek: 4800, perMonth: 16000 },
    isAvailable: true,
    bio: 'Expert in authentic Punjabi and Mughlai cuisine. Known for her rich gravies and fresh rotis. Has cooked for over 200 families across Mumbai.',
    dishes: [
      { name: 'Dal Makhani', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Butter Naan', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80' },
      { name: 'Paneer Tikka', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
    ],
    videoReviews: [
      {
        id: 'v1', customerName: 'Priya Mehta', customerPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        rating: 5, comment: 'Best dal makhani I have ever had! Sunita ji is amazing', date: '2 weeks ago',
      },
      {
        id: 'v2', customerName: 'Rajesh Kumar', customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        rating: 5, comment: 'Our family loves her cooking. Booked monthly!', date: '1 month ago',
      },
    ],
    languages: ['Hindi', 'Punjabi'],
    location: 'Andheri West',
  },
  {
    id: '2',
    name: 'Lakshmi Iyer',
    photo: 'https://images.unsplash.com/photo-1611432579699-484f7990b127?w=400&q=80',
    rating: 4.8,
    reviews: 187,
    experience: '8 years',
    expertise: ['South Indian', 'Kerala', 'Chettinad'],
    speciality: 'South Indian',
    pricing: { perMeal: 300, perDay: 700, perWeek: 4200, perMonth: 14000 },
    isAvailable: true,
    bio: 'Specialist in traditional South Indian breakfast and meals. Authentic dosa, idli, and sambar that tastes like home.',
    dishes: [
      { name: 'Masala Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Idli Sambar', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Kerala Fish Curry', image: 'https://images.unsplash.com/photo-1626508035297-ab8ee8abe5d5?w=300&q=80' },
      { name: 'Appam', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&q=80' },
    ],
    videoReviews: [
      {
        id: 'v3', customerName: 'Anitha Rao', customerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        rating: 5, comment: 'Her dosa is crispy and perfect every time!', date: '3 days ago',
      },
    ],
    languages: ['Tamil', 'Hindi', 'Malayalam'],
    location: 'Powai',
  },
  {
    id: '3',
    name: 'Raju Sharma',
    photo: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&q=80',
    rating: 4.7,
    reviews: 312,
    experience: '15 years',
    expertise: ['Chinese', 'Thai', 'Continental'],
    speciality: 'Chinese',
    pricing: { perMeal: 450, perDay: 1000, perWeek: 6000, perMonth: 20000 },
    isAvailable: true,
    bio: 'Professional chef with 5-star hotel experience. Expert in Indo-Chinese, Thai curries, and Continental dishes. Previously at Taj and ITC.',
    dishes: [
      { name: 'Hakka Noodles', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80' },
      { name: 'Manchurian', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300&q=80' },
      { name: 'Thai Green Curry', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&q=80' },
      { name: 'Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&q=80' },
    ],
    videoReviews: [
      {
        id: 'v4', customerName: 'Neha Singh', customerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        rating: 5, comment: 'Restaurant quality food at home. Kids love it!', date: '1 week ago',
      },
      {
        id: 'v5', customerName: 'Vikram Joshi', customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        rating: 4, comment: 'Great Thai curry, very authentic flavors', date: '2 weeks ago',
      },
    ],
    languages: ['Hindi', 'English'],
    location: 'Bandra',
  },
  {
    id: '4',
    name: 'Meenakshi Patel',
    photo: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&q=80',
    rating: 4.9,
    reviews: 156,
    experience: '10 years',
    expertise: ['Gujarati', 'Rajasthani', 'Jain'],
    speciality: 'Gujarati',
    pricing: { perMeal: 280, perDay: 650, perWeek: 3900, perMonth: 13000 },
    isAvailable: false,
    bio: 'Pure vegetarian cook specializing in Gujarati thali, Rajasthani dal bati, and Jain food. Perfect for families with dietary restrictions.',
    dishes: [
      { name: 'Gujarati Thali', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&q=80' },
      { name: 'Dhokla', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
      { name: 'Undhiyu', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80' },
      { name: 'Dal Bati', image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=300&q=80' },
    ],
    videoReviews: [
      {
        id: 'v6', customerName: 'Divya Shah', customerPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        rating: 5, comment: 'Feels like maa ke haath ka khana. So pure!', date: '5 days ago',
      },
    ],
    languages: ['Gujarati', 'Hindi'],
    location: 'Ghatkopar',
  },
  {
    id: '5',
    name: 'Ahmed Khan',
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80',
    rating: 4.8,
    reviews: 278,
    experience: '14 years',
    expertise: ['Mughlai', 'Kebabs', 'Biryani'],
    speciality: 'Mughlai',
    pricing: { perMeal: 400, perDay: 900, perWeek: 5400, perMonth: 18000 },
    isAvailable: true,
    bio: 'Master of Mughlai cuisine. Signature kebabs, biryanis, and kormas that taste like Old Delhi. Featured in Mumbai Foodie magazine.',
    dishes: [
      { name: 'Lucknowi Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Seekh Kebab', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&q=80' },
      { name: 'Nihari', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=300&q=80' },
      { name: 'Shahi Tukda', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80' },
    ],
    videoReviews: [
      {
        id: 'v7', customerName: 'Sanjay Gupta', customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        rating: 5, comment: 'Best biryani in Mumbai. We book him every Eid!', date: '3 weeks ago',
      },
      {
        id: 'v8', customerName: 'Fatima Shaikh', customerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        rating: 5, comment: 'His kebabs melt in your mouth. Incredible!', date: '1 month ago',
      },
    ],
    languages: ['Hindi', 'Urdu'],
    location: 'Mohammed Ali Road',
  },
  {
    id: '6',
    name: 'Priya Nair',
    photo: 'https://images.unsplash.com/photo-1583185253606-87da9df39a0e?w=400&q=80',
    rating: 4.6,
    reviews: 98,
    experience: '5 years',
    expertise: ['Healthy', 'Keto', 'Salads'],
    speciality: 'Healthy',
    pricing: { perMeal: 500, perDay: 1100, perWeek: 6500, perMonth: 22000 },
    isAvailable: true,
    bio: 'Nutrition-certified cook. Specializes in keto, low-carb, high-protein meals and meal prep. Perfect for fitness enthusiasts.',
    dishes: [
      { name: 'Quinoa Bowl', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
      { name: 'Grilled Chicken', image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&q=80' },
      { name: 'Smoothie Bowl', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300&q=80' },
      { name: 'Greek Salad', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80' },
    ],
    videoReviews: [
      {
        id: 'v9', customerName: 'Rohan Desai', customerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        rating: 5, comment: 'Lost 8 kgs in 2 months with her meal plans!', date: '4 days ago',
      },
    ],
    languages: ['English', 'Hindi', 'Malayalam'],
    location: 'Juhu',
  },
];

const FILTER_CHIPS = [
  { id: 'all', label: 'All', emoji: '👨‍🍳' },
  { id: 'North Indian', label: 'North Indian', emoji: '🍛' },
  { id: 'South Indian', label: 'South Indian', emoji: '🥘' },
  { id: 'Chinese', label: 'Chinese', emoji: '🥡' },
  { id: 'Mughlai', label: 'Mughlai', emoji: '🍖' },
  { id: 'Gujarati', label: 'Gujarati', emoji: '🫓' },
  { id: 'Healthy', label: 'Healthy', emoji: '🥗' },
];

type BookingPlan = 'daily' | 'weekly' | 'monthly';

const BOOKING_PLANS: { id: BookingPlan; label: string; emoji: string; desc: string; color: string; savings?: string }[] = [
  { id: 'daily', label: 'Daily', emoji: '☀️', desc: '3 meals/day', color: '#FF6B6B' },
  { id: 'weekly', label: 'Weekly', emoji: '📅', desc: '7 days, 3 meals/day', color: '#818CF8', savings: 'Save 10%' },
  { id: 'monthly', label: 'Monthly', emoji: '🗓️', desc: '30 days, 3 meals/day', color: '#4ADE80', savings: 'Save 25%' },
];

// ── Components ──

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialIcons
          key={i}
          name={i < full ? 'star' : (i === full && half) ? 'star-half' : 'star-border'}
          size={size}
          color="#FFD700"
        />
      ))}
    </View>
  );
}

// ── Video Review Card (thumbnail with play icon) ──
function VideoReviewThumb({ review, onPlay, colors, isDark }: {
  review: VideoReview; onPlay: (review: VideoReview) => void; colors: any; isDark: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [st.videoThumbCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPlay(review); }}
    >
      <Image source={{ uri: review.thumbnail }} style={st.videoThumbImage} contentFit="cover" transition={200} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.80)']} style={st.videoThumbGrad} />
      {/* Play button */}
      <View style={st.videoPlayBtn}>
        <MaterialIcons name="play-arrow" size={28} color="#FFF" />
      </View>
      {/* Customer info */}
      <View style={st.videoThumbInfo}>
        <Image source={{ uri: review.customerPhoto }} style={st.videoCustomerAvatar} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={st.videoCustomerName} numberOfLines={1}>{review.customerName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <StarRating rating={review.rating} size={9} />
            <Text style={st.videoDate}>{review.date}</Text>
          </View>
        </View>
      </View>
      {/* Comment bubble */}
      <View style={st.videoCommentBubble}>
        <Text style={st.videoComment} numberOfLines={2}>{review.comment}</Text>
      </View>
    </Pressable>
  );
}

// ── Video Player Modal ──
function VideoPlayerModal({ review, visible, onClose, colors }: {
  review: VideoReview | null; visible: boolean; onClose: () => void; colors: any;
}) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(review?.videoUrl || '', (p) => {
    if (visible && review) {
      p.loop = false;
      p.play();
    }
  });

  if (!review) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[st.videoModalRoot, { backgroundColor: '#000' }]}>
        <SafeAreaView edges={['top']} style={st.videoModalTopBar}>
          <Pressable style={({ pressed }) => [st.videoModalCloseBtn, pressed && { opacity: 0.7 }]} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#FFF" />
          </Pressable>
          <Text style={st.videoModalTitle}>Customer Review</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        <View style={st.videoContainer}>
          <VideoView
            player={player}
            style={st.videoPlayer}
            allowsFullscreen
            allowsPictureInPicture={false}
          />
        </View>

        <View style={[st.videoModalInfo, { paddingBottom: insets.bottom + 16 }]}>
          <View style={st.videoModalReviewer}>
            <Image source={{ uri: review.customerPhoto }} style={st.videoModalAvatar} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={st.videoModalName}>{review.customerName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StarRating rating={review.rating} size={14} />
                <Text style={st.videoModalDate}>{review.date}</Text>
              </View>
            </View>
          </View>
          <Text style={st.videoModalComment}>{review.comment}</Text>
        </View>
      </View>
    </Modal>
  );
}

// ── Cook Card ──
function CookCard({ cook, index, onBook, onViewProfile, onPlayVideo, colors, isDark }: {
  cook: Cook; index: number;
  onBook: (cook: Cook) => void; onViewProfile: (cook: Cook) => void;
  onPlayVideo: (review: VideoReview) => void;
  colors: any; isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 70).duration(350)}>
      <Pressable
        style={[ck.card, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: isDark ? '#000' : '#B8960C',
        }]}
        onPress={() => { Haptics.selectionAsync(); onViewProfile(cook); }}
      >
        {/* Header row */}
        <View style={ck.cardHeader}>
          <View style={ck.photoWrap}>
            <Image source={{ uri: cook.photo }} style={ck.photo} contentFit="cover" transition={200} />
            {cook.isAvailable ? (
              <View style={ck.availBadge}>
                <View style={ck.availDot} />
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <View style={ck.nameRow}>
              <Text style={[ck.cookName, { color: colors.textPrimary }]}>{cook.name}</Text>
              {!cook.isAvailable ? (
                <View style={ck.unavailTag}><Text style={ck.unavailText}>Busy</Text></View>
              ) : null}
            </View>
            <Text style={[ck.speciality, { color: colors.textMuted }]}>{cook.speciality} Specialist</Text>
            <View style={ck.ratingRow}>
              <StarRating rating={cook.rating} />
              <Text style={ck.ratingText}>{cook.rating}</Text>
              <Text style={[ck.reviewCount, { color: colors.textMuted }]}>({cook.reviews})</Text>
            </View>
            <View style={ck.metaRow}>
              <View style={ck.metaBadge}>
                <MaterialIcons name="schedule" size={11} color="#D4AF37" />
                <Text style={[ck.metaText, { color: colors.textSecondary }]}>{cook.experience}</Text>
              </View>
              <View style={ck.metaBadge}>
                <MaterialIcons name="location-on" size={11} color="#D4AF37" />
                <Text style={[ck.metaText, { color: colors.textSecondary }]}>{cook.location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expertise tags */}
        <View style={ck.expertiseRow}>
          {cook.expertise.map(tag => (
            <View key={tag} style={[ck.expertiseTag, {
              backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.06)',
              borderColor: 'rgba(212,175,55,0.18)',
            }]}>
              <Text style={ck.expertiseText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Dish Photos */}
        <View style={ck.dishSection}>
          <Text style={[ck.dishSectionTitle, { color: colors.textSecondary }]}>Signature Dishes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ck.dishScroll}>
            {cook.dishes.map((dish, i) => (
              <View key={i} style={ck.dishItem}>
                <Image source={{ uri: dish.image }} style={ck.dishImage} contentFit="cover" transition={150} />
                <Text style={[ck.dishName, { color: colors.textPrimary }]} numberOfLines={1}>{dish.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Video Reviews Preview */}
        {cook.videoReviews.length > 0 ? (
          <View style={ck.videoPreviewSection}>
            <View style={ck.videoPreviewHeader}>
              <MaterialIcons name="videocam" size={14} color="#D4AF37" />
              <Text style={[ck.videoPreviewTitle, { color: colors.textSecondary }]}>Video Reviews</Text>
              <View style={[ck.videoCountBadge, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)' }]}>
                <Text style={ck.videoCountText}>{cook.videoReviews.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {cook.videoReviews.slice(0, 2).map(review => (
                <Pressable
                  key={review.id}
                  style={({ pressed }) => [ck.videoMiniThumb, pressed && { opacity: 0.85 }]}
                  onPress={() => { Haptics.selectionAsync(); onPlayVideo(review); }}
                >
                  <Image source={{ uri: review.thumbnail }} style={ck.videoMiniImg} contentFit="cover" transition={150} />
                  <View style={ck.videoMiniPlay}>
                    <MaterialIcons name="play-arrow" size={16} color="#FFF" />
                  </View>
                  <Text style={ck.videoMiniName} numberOfLines={1}>{review.customerName}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Price & Book */}
        <View style={ck.bottomRow}>
          <View style={ck.priceSection}>
            <View style={ck.priceItem}>
              <Text style={[ck.priceLabel, { color: colors.textMuted }]}>Daily</Text>
              <Text style={ck.priceValue}>₹{cook.pricing.perDay}</Text>
            </View>
            <View style={[ck.priceDivider, { backgroundColor: colors.border }]} />
            <View style={ck.priceItem}>
              <Text style={[ck.priceLabel, { color: colors.textMuted }]}>Monthly</Text>
              <Text style={ck.priceValue}>₹{(cook.pricing.perMonth / 1000).toFixed(0)}K</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              ck.bookBtn,
              !cook.isAvailable && ck.bookBtnDisabled,
              pressed && cook.isAvailable && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => { if (cook.isAvailable) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onBook(cook); } }}
            disabled={!cook.isAvailable}
          >
            <LinearGradient
              colors={cook.isAvailable ? ['#D4AF37', '#FFD700'] : ['#9CA3AF', '#9CA3AF']}
              style={ck.bookBtnGrad}
            >
              <MaterialIcons name="event-available" size={16} color="#FFF" />
              <Text style={ck.bookBtnText}>{cook.isAvailable ? 'Book Now' : 'Unavailable'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Cook Profile Modal ──
function CookProfileModal({ cook, visible, onClose, onBook, onPlayVideo, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void;
  onBook: (cook: Cook) => void; onPlayVideo: (review: VideoReview) => void;
  colors: any; isDark: boolean;
}) {
  const insets = useSafeAreaInsets();
  if (!cook) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[ck.modalRoot, { backgroundColor: colors.background }]}>
        {/* Hero */}
        <View style={ck.modalHero}>
          <Image source={{ uri: cook.photo }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView edges={['top']} style={ck.modalTopBar}>
            <Pressable style={({ pressed }) => [ck.modalBackBtn, pressed && { opacity: 0.7 }]} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
          </SafeAreaView>
          <View style={ck.modalHeroInfo}>
            <Text style={ck.modalCookName}>{cook.name}</Text>
            <Text style={ck.modalCookSpec}>{cook.speciality} Specialist | {cook.experience} exp</Text>
            <View style={ck.modalRatingRow}>
              <StarRating rating={cook.rating} size={16} />
              <Text style={ck.modalRatingText}>{cook.rating} ({cook.reviews} reviews)</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Bio */}
          <Text style={[ck.modalBio, { color: colors.textSecondary }]}>{cook.bio}</Text>

          {/* Info Row */}
          <View style={ck.modalInfoRow}>
            <View style={[ck.modalInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="location-on" size={18} color="#D4AF37" />
              <Text style={[ck.modalInfoValue, { color: colors.textPrimary }]}>{cook.location}</Text>
              <Text style={[ck.modalInfoLabel, { color: colors.textMuted }]}>Location</Text>
            </View>
            <View style={[ck.modalInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="translate" size={18} color="#D4AF37" />
              <Text style={[ck.modalInfoValue, { color: colors.textPrimary }]}>{cook.languages.join(', ')}</Text>
              <Text style={[ck.modalInfoLabel, { color: colors.textMuted }]}>Languages</Text>
            </View>
          </View>

          {/* Expertise */}
          <Text style={[ck.modalSectionTitle, { color: colors.textPrimary }]}>Expertise</Text>
          <View style={ck.expertiseRow}>
            {cook.expertise.map(tag => (
              <View key={tag} style={[ck.expertiseTag, {
                backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.06)',
                borderColor: 'rgba(212,175,55,0.18)',
              }]}>
                <Text style={ck.expertiseText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Dishes */}
          <Text style={[ck.modalSectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Signature Dishes</Text>
          <View style={ck.modalDishGrid}>
            {cook.dishes.map((dish, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(300)} style={ck.modalDishItem}>
                <Image source={{ uri: dish.image }} style={ck.modalDishImage} contentFit="cover" transition={200} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.70)']} style={ck.modalDishOverlay} />
                <Text style={ck.modalDishName}>{dish.name}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Video Reviews */}
          {cook.videoReviews.length > 0 ? (
            <>
              <View style={[ck.modalSectionHeader, { marginTop: 24 }]}>
                <Text style={[ck.modalSectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                  Customer Video Reviews
                </Text>
                <View style={[st.videoReviewBadge, { backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)' }]}>
                  <MaterialIcons name="videocam" size={12} color="#D4AF37" />
                  <Text style={st.videoReviewBadgeText}>{cook.videoReviews.length}</Text>
                </View>
              </View>
              <View style={{ gap: 12, marginTop: 12 }}>
                {cook.videoReviews.map((review, i) => (
                  <VideoReviewThumb key={review.id} review={review} onPlay={onPlayVideo} colors={colors} isDark={isDark} />
                ))}
              </View>
            </>
          ) : null}

          {/* Pricing Plans */}
          <Text style={[ck.modalSectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Booking Plans</Text>
          <View style={st.pricingPlans}>
            {BOOKING_PLANS.map((plan) => {
              const price = plan.id === 'daily' ? cook.pricing.perDay
                : plan.id === 'weekly' ? cook.pricing.perWeek
                : cook.pricing.perMonth;
              return (
                <View key={plan.id} style={[st.pricingPlanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[st.pricingPlanIcon, { backgroundColor: `${plan.color}15` }]}>
                    <Text style={{ fontSize: 22 }}>{plan.emoji}</Text>
                  </View>
                  <Text style={[st.pricingPlanLabel, { color: colors.textPrimary }]}>{plan.label}</Text>
                  <Text style={st.pricingPlanPrice}>₹{price.toLocaleString()}</Text>
                  <Text style={[st.pricingPlanDesc, { color: colors.textMuted }]}>{plan.desc}</Text>
                  {plan.savings ? (
                    <View style={[st.savingsBadge, { backgroundColor: `${plan.color}15` }]}>
                      <Text style={[st.savingsText, { color: plan.color }]}>{plan.savings}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Per Meal Price */}
          <View style={[st.perMealNote, {
            backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.05)',
            borderColor: 'rgba(212,175,55,0.15)',
          }]}>
            <MaterialIcons name="info-outline" size={16} color="#D4AF37" />
            <Text style={[st.perMealText, { color: colors.textSecondary }]}>
              Single meal also available at <Text style={{ fontWeight: '900', color: '#D4AF37' }}>₹{cook.pricing.perMeal}/meal</Text>
            </Text>
          </View>
        </ScrollView>

        {/* Book CTA */}
        <View style={[ck.modalBottomBar, {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 12,
        }]}>
          <View>
            <Text style={[ck.modalBottomLabel, { color: colors.textMuted }]}>Starting from</Text>
            <Text style={ck.modalBottomPrice}>₹{cook.pricing.perMeal}/meal</Text>
          </View>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onBook(cook); onClose(); }}
            disabled={!cook.isAvailable}
          >
            <LinearGradient
              colors={cook.isAvailable ? ['#D4AF37', '#FFD700'] : ['#9CA3AF', '#9CA3AF']}
              style={ck.modalBookBtn}
            >
              <MaterialIcons name="event-available" size={20} color="#FFF" />
              <Text style={ck.modalBookBtnText}>{cook.isAvailable ? 'Book This Cook' : 'Currently Unavailable'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Booking Confirmation Modal with plan selection ──
function BookingModal({ cook, visible, onClose, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void; colors: any; isDark: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<BookingPlan>('daily');
  const insets = useSafeAreaInsets();

  if (!cook || !visible) return null;

  const getPrice = (plan: BookingPlan) => {
    switch (plan) {
      case 'daily': return cook.pricing.perDay;
      case 'weekly': return cook.pricing.perWeek;
      case 'monthly': return cook.pricing.perMonth;
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={ck.bookingOverlay}>
        <Animated.View entering={FadeInUp.duration(400)} style={[ck.bookingCard, { backgroundColor: colors.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_W * 1.4 }}>
            <View style={{ alignItems: 'center', gap: 14, paddingBottom: 8 }}>
              {/* Cook info */}
              <View style={st.bookingCookInfo}>
                <Image source={{ uri: cook.photo }} style={st.bookingCookPhoto} contentFit="cover" transition={200} />
                <Text style={[st.bookingCookName, { color: colors.textPrimary }]}>{cook.name}</Text>
                <Text style={[st.bookingCookSpec, { color: colors.textMuted }]}>{cook.speciality} Specialist</Text>
              </View>

              {/* Plan Selection */}
              <Text style={[st.bookingPlanTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>
              <View style={st.bookingPlanGrid}>
                {BOOKING_PLANS.map(plan => {
                  const isActive = selectedPlan === plan.id;
                  const price = getPrice(plan.id);
                  return (
                    <Pressable
                      key={plan.id}
                      style={[
                        st.bookingPlanItem,
                        {
                          backgroundColor: isActive
                            ? isDark ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)'
                            : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                          borderColor: isActive ? '#D4AF37' : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedPlan(plan.id); }}
                    >
                      <Text style={{ fontSize: 22 }}>{plan.emoji}</Text>
                      <Text style={[st.bookingPlanItemLabel, { color: isActive ? '#D4AF37' : colors.textPrimary }]}>{plan.label}</Text>
                      <Text style={st.bookingPlanItemPrice}>₹{price.toLocaleString()}</Text>
                      <Text style={[st.bookingPlanItemDesc, { color: colors.textMuted }]}>{plan.desc}</Text>
                      {plan.savings ? (
                        <View style={[st.bookingSavingsPill, { backgroundColor: `${plan.color}18` }]}>
                          <Text style={[st.bookingSavingsText, { color: plan.color }]}>{plan.savings}</Text>
                        </View>
                      ) : null}
                      {isActive ? (
                        <View style={st.bookingPlanCheck}>
                          <MaterialIcons name="check-circle" size={20} color="#D4AF37" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {/* Summary */}
              <View style={[ck.bookingSummary, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: colors.border,
              }]}>
                <View style={ck.bookingSummaryRow}>
                  <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Cook</Text>
                  <Text style={[ck.bookingSummaryValue, { color: colors.textPrimary }]}>{cook.name}</Text>
                </View>
                <View style={ck.bookingSummaryRow}>
                  <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Plan</Text>
                  <Text style={[ck.bookingSummaryValue, { color: colors.textPrimary }]}>
                    {BOOKING_PLANS.find(p => p.id === selectedPlan)?.label}
                  </Text>
                </View>
                <View style={ck.bookingSummaryRow}>
                  <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[ck.bookingSummaryValue, { color: '#D4AF37', fontWeight: '900' }]}>
                    ₹{getPrice(selectedPlan).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Confirm Button */}
              <Pressable
                style={({ pressed }) => [ck.bookingDoneBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); }}
              >
                <LinearGradient colors={['#D4AF37', '#FFD700']} style={ck.bookingDoneBtnGrad}>
                  <MaterialIcons name="check" size={20} color="#FFF" />
                  <Text style={ck.bookingDoneBtnText}>Confirm Booking</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [{ paddingVertical: 8 }, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <Text style={[{ fontSize: 14, fontWeight: '600' }, { color: colors.textMuted }]}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──
export default function BookCookScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [profileCook, setProfileCook] = useState<Cook | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [bookingCook, setBookingCook] = useState<Cook | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoReview | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const filteredCooks = useMemo(() => {
    if (activeFilter === 'all') return COOKS;
    return COOKS.filter(c => c.speciality === activeFilter);
  }, [activeFilter]);

  const handleBook = useCallback((cook: Cook) => {
    setBookingCook(cook);
    setShowBooking(true);
  }, []);

  const handleViewProfile = useCallback((cook: Cook) => {
    setProfileCook(cook);
    setShowProfile(true);
  }, []);

  const handlePlayVideo = useCallback((review: VideoReview) => {
    setActiveVideo(review);
    setShowVideoPlayer(true);
  }, []);

  return (
    <View style={[ck.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* ═══ Header ═══ */}
          <LinearGradient
            colors={isDark ? ['#14141C', '#1A1510', '#14141C'] : ['#FDF8F0', '#FFF8E1', '#FDF8F0']}
            style={ck.header}
          >
            <Animated.View entering={FadeIn.duration(400)} style={ck.headerContent}>
              <View style={ck.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[ck.headerTitle, { color: colors.textPrimary }]}>Book a Cook</Text>
                  <Text style={[ck.headerSub, { color: colors.textMuted }]}>Hire expert home cooks for authentic meals</Text>
                </View>
                <View style={[ck.headerIcon, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.08)' }]}>
                  <Text style={{ fontSize: 28 }}>👨‍🍳</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={ck.statsRow}>
                {[
                  { label: 'Cooks Available', value: COOKS.filter(c => c.isAvailable).length.toString(), emoji: '✅' },
                  { label: 'Avg Rating', value: '4.8', emoji: '⭐' },
                  { label: 'Video Reviews', value: COOKS.reduce((s, c) => s + c.videoReviews.length, 0).toString(), emoji: '🎥' },
                ].map((stat, i) => (
                  <View key={i} style={[ck.statCard, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.80)',
                    borderColor: colors.border,
                  }]}>
                    <Text style={{ fontSize: 16 }}>{stat.emoji}</Text>
                    <Text style={[ck.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                    <Text style={[ck.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </LinearGradient>

          {/* ═══ Booking Plans Banner ═══ */}
          <View style={st.plansBanner}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {BOOKING_PLANS.map((plan, i) => (
                <Animated.View key={plan.id} entering={FadeInRight.delay(i * 80).duration(300)}>
                  <View style={[st.planBannerCard, { backgroundColor: `${plan.color}12`, borderColor: `${plan.color}30` }]}>
                    <Text style={{ fontSize: 20 }}>{plan.emoji}</Text>
                    <View>
                      <Text style={[st.planBannerTitle, { color: colors.textPrimary }]}>{plan.label} Booking</Text>
                      <Text style={[st.planBannerDesc, { color: colors.textMuted }]}>{plan.desc}</Text>
                    </View>
                    {plan.savings ? (
                      <View style={[st.planBannerSaving, { backgroundColor: plan.color }]}>
                        <Text style={st.planBannerSavingText}>{plan.savings}</Text>
                      </View>
                    ) : null}
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* ═══ Filter Chips ═══ */}
          <View style={ck.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ck.filterScroll}>
              {FILTER_CHIPS.map(chip => {
                const isActive = activeFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    style={[
                      ck.filterChip,
                      {
                        backgroundColor: isActive
                          ? isDark ? 'rgba(212,175,55,0.20)' : 'rgba(212,175,55,0.10)'
                          : colors.surface,
                        borderColor: isActive ? '#D4AF37' : colors.border,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setActiveFilter(chip.id); }}
                  >
                    <Text style={{ fontSize: 14 }}>{chip.emoji}</Text>
                    <Text style={[ck.filterLabel, { color: isActive ? '#D4AF37' : colors.textSecondary }]}>{chip.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ═══ Cook Cards ═══ */}
          <View style={ck.cookList}>
            {filteredCooks.map((cook, i) => (
              <CookCard
                key={cook.id}
                cook={cook}
                index={i}
                onBook={handleBook}
                onViewProfile={handleViewProfile}
                onPlayVideo={handlePlayVideo}
                colors={colors}
                isDark={isDark}
              />
            ))}
            {filteredCooks.length === 0 ? (
              <View style={[ck.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>🔍</Text>
                <Text style={[ck.emptyTitle, { color: colors.textPrimary }]}>No cooks found</Text>
                <Text style={[ck.emptySub, { color: colors.textMuted }]}>Try a different cuisine filter</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CookProfileModal
        cook={profileCook}
        visible={showProfile}
        onClose={() => { setShowProfile(false); setTimeout(() => setProfileCook(null), 300); }}
        onBook={handleBook}
        onPlayVideo={handlePlayVideo}
        colors={colors}
        isDark={isDark}
      />

      <BookingModal
        cook={bookingCook}
        visible={showBooking}
        onClose={() => { setShowBooking(false); setTimeout(() => setBookingCook(null), 300); }}
        colors={colors}
        isDark={isDark}
      />

      <VideoPlayerModal
        review={activeVideo}
        visible={showVideoPlayer}
        onClose={() => { setShowVideoPlayer(false); setTimeout(() => setActiveVideo(null), 300); }}
        colors={colors}
      />
    </View>
  );
}

// ── Styles ──
const st = StyleSheet.create({
  // Video Review Thumbnails
  videoThumbCard: {
    borderRadius: 16, overflow: 'hidden', position: 'relative',
    height: 200, marginBottom: 4,
  },
  videoThumbImage: { width: '100%', height: '100%' },
  videoThumbGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  videoPlayBtn: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -24, marginLeft: -24,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.90)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  videoThumbInfo: {
    position: 'absolute', bottom: 36, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  videoCustomerAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFF' },
  videoCustomerName: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  videoDate: { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.60)' },
  videoCommentBubble: {
    position: 'absolute', bottom: 8, left: 12, right: 12,
  },
  videoComment: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.90)', lineHeight: 15 },

  // Video Review Badge
  videoReviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  videoReviewBadgeText: { fontSize: 12, fontWeight: '800', color: '#D4AF37' },

  // Video Player Modal
  videoModalRoot: { flex: 1 },
  videoModalTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  videoModalCloseBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoModalTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  videoContainer: { flex: 1, justifyContent: 'center' },
  videoPlayer: { width: '100%', height: 300 },
  videoModalInfo: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  videoModalReviewer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  videoModalAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#D4AF37' },
  videoModalName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  videoModalDate: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.60)' },
  videoModalComment: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.85)', lineHeight: 23 },

  // Pricing Plans in Profile Modal
  pricingPlans: { flexDirection: 'row', gap: 10 },
  pricingPlanCard: {
    flex: 1, alignItems: 'center', gap: 6,
    paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1,
    position: 'relative',
  },
  pricingPlanIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pricingPlanLabel: { fontSize: 13, fontWeight: '800' },
  pricingPlanPrice: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  pricingPlanDesc: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  savingsBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2,
  },
  savingsText: { fontSize: 9, fontWeight: '800' },

  perMealNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 12,
  },
  perMealText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 19 },

  // Plans Banner on main screen
  plansBanner: { paddingTop: 16 },
  planBannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  planBannerTitle: { fontSize: 13, fontWeight: '800' },
  planBannerDesc: { fontSize: 10, fontWeight: '500' },
  planBannerSaving: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto',
  },
  planBannerSavingText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  // Booking Modal - Cook Info
  bookingCookInfo: { alignItems: 'center', gap: 6 },
  bookingCookPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#D4AF37' },
  bookingCookName: { fontSize: 20, fontWeight: '900' },
  bookingCookSpec: { fontSize: 13, fontWeight: '500' },

  // Booking Modal - Plan Selection
  bookingPlanTitle: { fontSize: 16, fontWeight: '800', alignSelf: 'flex-start' },
  bookingPlanGrid: { flexDirection: 'row', gap: 10, width: '100%' },
  bookingPlanItem: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 14, paddingHorizontal: 6, borderRadius: 16, position: 'relative',
  },
  bookingPlanItemLabel: { fontSize: 12, fontWeight: '800' },
  bookingPlanItemPrice: { fontSize: 15, fontWeight: '900', color: '#D4AF37' },
  bookingPlanItemDesc: { fontSize: 8, fontWeight: '600', textAlign: 'center' },
  bookingSavingsPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  bookingSavingsText: { fontSize: 8, fontWeight: '800' },
  bookingPlanCheck: { position: 'absolute', top: 6, right: 6 },
});

const ck = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  headerContent: { gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  headerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  statValue: { fontSize: 17, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Filters
  filterSection: { paddingTop: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
  },
  filterLabel: { fontSize: 13, fontWeight: '700' },

  // Cook List
  cookList: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

  // Cook Card
  card: {
    padding: 16, borderRadius: 20, borderWidth: 1, gap: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', gap: 14 },
  photoWrap: { position: 'relative' },
  photo: { width: 72, height: 72, borderRadius: 20 },
  availBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  availDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cookName: { fontSize: 17, fontWeight: '800' },
  unavailTag: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.10)',
  },
  unavailText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  speciality: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: '800', color: '#D4AF37' },
  reviewCount: { fontSize: 11, fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontWeight: '600' },
  expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expertiseTag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  expertiseText: { fontSize: 11, fontWeight: '700', color: '#D4AF37' },

  // Dishes
  dishSection: { gap: 8 },
  dishSectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dishScroll: { gap: 10 },
  dishItem: { alignItems: 'center', gap: 4 },
  dishImage: { width: DISH_IMAGE_SIZE, height: DISH_IMAGE_SIZE, borderRadius: 14 },
  dishName: { fontSize: 10, fontWeight: '600', width: DISH_IMAGE_SIZE, textAlign: 'center' },

  // Video Preview in Card
  videoPreviewSection: { gap: 8 },
  videoPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  videoPreviewTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  videoCountBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  videoCountText: { fontSize: 10, fontWeight: '800', color: '#D4AF37' },
  videoMiniThumb: {
    width: 100, height: 70, borderRadius: 10, overflow: 'hidden', position: 'relative',
  },
  videoMiniImg: { width: '100%', height: '100%' },
  videoMiniPlay: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -12, marginLeft: -12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoMiniName: {
    position: 'absolute', bottom: 3, left: 4, right: 4,
    fontSize: 8, fontWeight: '700', color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  // Bottom
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceItem: { gap: 1 },
  priceLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  priceValue: { fontSize: 17, fontWeight: '900', color: '#D4AF37' },
  priceDivider: { width: 1, height: 28 },
  bookBtn: {},
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14,
  },
  bookBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Empty
  emptyState: {
    padding: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500' },

  // Profile Modal
  modalRoot: { flex: 1 },
  modalHero: { height: 280, position: 'relative' },
  modalTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 8, zIndex: 10,
  },
  modalBackBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalHeroInfo: { position: 'absolute', bottom: 20, left: 20, right: 20, gap: 4 },
  modalCookName: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  modalCookSpec: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.80)' },
  modalRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  modalRatingText: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  modalBio: { fontSize: 15, fontWeight: '500', lineHeight: 23, marginBottom: 20 },
  modalInfoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalInfoCard: {
    flex: 1, alignItems: 'center', gap: 5,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  modalInfoValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  modalInfoLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  modalSectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalDishGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalDishItem: {
    width: (SCREEN_W - 50) / 2, height: 120, borderRadius: 16, overflow: 'hidden', position: 'relative',
  },
  modalDishImage: { width: '100%', height: '100%' },
  modalDishOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 },
  modalDishName: {
    position: 'absolute', bottom: 8, left: 10, right: 10,
    fontSize: 13, fontWeight: '700', color: '#FFF',
  },
  modalBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  modalBottomLabel: { fontSize: 10, fontWeight: '600' },
  modalBottomPrice: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  modalBookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16,
  },
  modalBookBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  // Booking Modal
  bookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  bookingCard: {
    width: '100%', maxWidth: 380, padding: 24, borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  bookingSummary: { width: '100%', padding: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  bookingSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingSummaryLabel: { fontSize: 12, fontWeight: '500' },
  bookingSummaryValue: { fontSize: 13, fontWeight: '700' },
  bookingDoneBtn: { width: '100%', marginTop: 4 },
  bookingDoneBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  bookingDoneBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
