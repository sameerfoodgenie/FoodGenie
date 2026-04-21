import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
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
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const DISH_IMAGE_SIZE = 80;

// ── Cook Data ──
interface DishPhoto {
  name: string;
  image: string;
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
  pricePerMeal: number;
  pricePerDay: number;
  isAvailable: boolean;
  bio: string;
  dishes: DishPhoto[];
  languages: string[];
  location: string;
}

const COOKS: Cook[] = [
  {
    id: '1',
    name: 'Sunita Devi',
    photo: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&q=80',
    rating: 4.9,
    reviews: 234,
    experience: '12 years',
    expertise: ['North Indian', 'Mughlai', 'Tandoor'],
    speciality: 'North Indian',
    pricePerMeal: 350,
    pricePerDay: 800,
    isAvailable: true,
    bio: 'Expert in authentic Punjabi and Mughlai cuisine. Known for her rich gravies and fresh rotis.',
    dishes: [
      { name: 'Dal Makhani', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80' },
      { name: 'Butter Naan', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80' },
      { name: 'Paneer Tikka', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80' },
      { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
    ],
    languages: ['Hindi', 'Punjabi'],
    location: 'Andheri West',
  },
  {
    id: '2',
    name: 'Lakshmi Iyer',
    photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80',
    rating: 4.8,
    reviews: 187,
    experience: '8 years',
    expertise: ['South Indian', 'Kerala', 'Chettinad'],
    speciality: 'South Indian',
    pricePerMeal: 300,
    pricePerDay: 700,
    isAvailable: true,
    bio: 'Specialist in traditional South Indian breakfast and meals. Authentic dosa, idli, and sambar.',
    dishes: [
      { name: 'Masala Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
      { name: 'Idli Sambar', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80' },
      { name: 'Kerala Fish Curry', image: 'https://images.unsplash.com/photo-1626508035297-ab8ee8abe5d5?w=300&q=80' },
      { name: 'Appam', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&q=80' },
    ],
    languages: ['Tamil', 'Hindi', 'Malayalam'],
    location: 'Powai',
  },
  {
    id: '3',
    name: 'Raju Sharma',
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80',
    rating: 4.7,
    reviews: 312,
    experience: '15 years',
    expertise: ['Chinese', 'Thai', 'Continental'],
    speciality: 'Chinese',
    pricePerMeal: 450,
    pricePerDay: 1000,
    isAvailable: true,
    bio: 'Professional chef with hotel experience. Expert in Indo-Chinese, Thai curries, and Continental dishes.',
    dishes: [
      { name: 'Hakka Noodles', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80' },
      { name: 'Manchurian', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300&q=80' },
      { name: 'Thai Green Curry', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&q=80' },
      { name: 'Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&q=80' },
    ],
    languages: ['Hindi', 'English'],
    location: 'Bandra',
  },
  {
    id: '4',
    name: 'Meenakshi Patel',
    photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80',
    rating: 4.9,
    reviews: 156,
    experience: '10 years',
    expertise: ['Gujarati', 'Rajasthani', 'Jain'],
    speciality: 'Gujarati',
    pricePerMeal: 280,
    pricePerDay: 650,
    isAvailable: false,
    bio: 'Pure vegetarian cook specializing in Gujarati thali, Rajasthani dal bati, and Jain food.',
    dishes: [
      { name: 'Gujarati Thali', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&q=80' },
      { name: 'Dhokla', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
      { name: 'Undhiyu', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=80' },
      { name: 'Dal Bati', image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=300&q=80' },
    ],
    languages: ['Gujarati', 'Hindi'],
    location: 'Ghatkopar',
  },
  {
    id: '5',
    name: 'Ahmed Khan',
    photo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
    rating: 4.8,
    reviews: 278,
    experience: '14 years',
    expertise: ['Mughlai', 'Kebabs', 'Biryani'],
    speciality: 'Mughlai',
    pricePerMeal: 400,
    pricePerDay: 900,
    isAvailable: true,
    bio: 'Master of Mughlai cuisine. Signature kebabs, biryanis, and kormas that taste like Old Delhi.',
    dishes: [
      { name: 'Lucknowi Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80' },
      { name: 'Seekh Kebab', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&q=80' },
      { name: 'Nihari', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=300&q=80' },
      { name: 'Shahi Tukda', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80' },
    ],
    languages: ['Hindi', 'Urdu'],
    location: 'Mohammed Ali Road',
  },
  {
    id: '6',
    name: 'Priya Nair',
    photo: 'https://images.unsplash.com/photo-1614644147724-2d4785d69962?w=400&q=80',
    rating: 4.6,
    reviews: 98,
    experience: '5 years',
    expertise: ['Healthy', 'Keto', 'Salads'],
    speciality: 'Healthy',
    pricePerMeal: 500,
    pricePerDay: 1100,
    isAvailable: true,
    bio: 'Nutrition-certified cook. Specializes in keto, low-carb, high-protein meals and meal prep.',
    dishes: [
      { name: 'Quinoa Bowl', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
      { name: 'Grilled Chicken', image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&q=80' },
      { name: 'Smoothie Bowl', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300&q=80' },
      { name: 'Greek Salad', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80' },
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

function CookCard({ cook, index, onBook, onViewProfile, colors, isDark }: {
  cook: Cook; index: number;
  onBook: (cook: Cook) => void; onViewProfile: (cook: Cook) => void;
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

        {/* Price & Book */}
        <View style={ck.bottomRow}>
          <View style={ck.priceSection}>
            <View style={ck.priceItem}>
              <Text style={[ck.priceLabel, { color: colors.textMuted }]}>Per Meal</Text>
              <Text style={ck.priceValue}>₹{cook.pricePerMeal}</Text>
            </View>
            <View style={[ck.priceDivider, { backgroundColor: colors.border }]} />
            <View style={ck.priceItem}>
              <Text style={[ck.priceLabel, { color: colors.textMuted }]}>Per Day</Text>
              <Text style={ck.priceValue}>₹{cook.pricePerDay}</Text>
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
function CookProfileModal({ cook, visible, onClose, onBook, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void;
  onBook: (cook: Cook) => void; colors: any; isDark: boolean;
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
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.70)']}
                  style={ck.modalDishOverlay}
                />
                <Text style={ck.modalDishName}>{dish.name}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Pricing */}
          <Text style={[ck.modalSectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>Pricing</Text>
          <View style={[ck.modalPriceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={ck.modalPriceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[ck.modalPriceLabel, { color: colors.textMuted }]}>Per Meal</Text>
                <Text style={ck.modalPriceValue}>₹{cook.pricePerMeal}</Text>
              </View>
              <View style={[ck.modalPriceDivider, { backgroundColor: colors.border }]} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[ck.modalPriceLabel, { color: colors.textMuted }]}>Full Day (3 meals)</Text>
                <Text style={ck.modalPriceValue}>₹{cook.pricePerDay}</Text>
              </View>
            </View>
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
            <Text style={ck.modalBottomPrice}>₹{cook.pricePerMeal}/meal</Text>
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

// ── Booking Confirmation Modal ──
function BookingModal({ cook, visible, onClose, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void; colors: any; isDark: boolean;
}) {
  if (!cook || !visible) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={ck.bookingOverlay}>
        <Animated.View entering={FadeInUp.duration(400)} style={[ck.bookingCard, { backgroundColor: colors.surface }]}>
          <View style={ck.bookingCheck}>
            <LinearGradient colors={['#4ADE80', '#22C55E']} style={ck.bookingCheckCircle}>
              <MaterialIcons name="check" size={36} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={[ck.bookingTitle, { color: colors.textPrimary }]}>Booking Request Sent!</Text>
          <Text style={[ck.bookingSub, { color: colors.textMuted }]}>
            Your request to book {cook.name} has been sent. You will receive a confirmation shortly.
          </Text>
          <View style={[ck.bookingSummary, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: colors.border,
          }]}>
            <View style={ck.bookingSummaryRow}>
              <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Cook</Text>
              <Text style={[ck.bookingSummaryValue, { color: colors.textPrimary }]}>{cook.name}</Text>
            </View>
            <View style={ck.bookingSummaryRow}>
              <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Specialty</Text>
              <Text style={[ck.bookingSummaryValue, { color: colors.textPrimary }]}>{cook.speciality}</Text>
            </View>
            <View style={ck.bookingSummaryRow}>
              <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Price</Text>
              <Text style={[ck.bookingSummaryValue, { color: '#D4AF37' }]}>₹{cook.pricePerMeal}/meal</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [ck.bookingDoneBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { Haptics.selectionAsync(); onClose(); }}
          >
            <LinearGradient colors={['#D4AF37', '#FFD700']} style={ck.bookingDoneBtnGrad}>
              <Text style={ck.bookingDoneBtnText}>Done</Text>
            </LinearGradient>
          </Pressable>
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
                  { label: 'Cuisines', value: '6+', emoji: '🍽️' },
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
    </View>
  );
}

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
  modalDishGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  modalDishItem: {
    width: (SCREEN_W - 50) / 2, height: 120, borderRadius: 16, overflow: 'hidden', position: 'relative',
  },
  modalDishImage: { width: '100%', height: '100%' },
  modalDishOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
  },
  modalDishName: {
    position: 'absolute', bottom: 8, left: 10, right: 10,
    fontSize: 13, fontWeight: '700', color: '#FFF',
  },
  modalPriceCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center' },
  modalPriceLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  modalPriceValue: { fontSize: 22, fontWeight: '900', color: '#D4AF37', marginTop: 2 },
  modalPriceDivider: { width: 1, height: 36, marginHorizontal: 16 },
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
    padding: 24,
  },
  bookingCard: {
    width: '100%', maxWidth: 360, padding: 28, borderRadius: 24,
    alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  bookingCheck: { marginBottom: 4 },
  bookingCheckCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  bookingTitle: { fontSize: 20, fontWeight: '900' },
  bookingSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 21 },
  bookingSummary: { width: '100%', padding: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  bookingSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingSummaryLabel: { fontSize: 12, fontWeight: '500' },
  bookingSummaryValue: { fontSize: 13, fontWeight: '700' },
  bookingDoneBtn: { width: '100%', marginTop: 4 },
  bookingDoneBtnGrad: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14,
  },
  bookingDoneBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
