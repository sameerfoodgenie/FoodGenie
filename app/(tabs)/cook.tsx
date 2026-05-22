import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  ViewToken,
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
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth, useAlert } from '../../template';
import { useCoin } from '../../hooks/useCoin';
import { fetchCooks, Cook, CookVideoReview, uploadVideoReview, fetchCookAvailability, CookAvailability } from '../../services/cookService';
import { createBooking, fetchCookBookings, Booking as CookBookingRecord } from '../../services/bookingService';
import { COIN_RULES } from '../../services/coinService';

const { width: SCREEN_W } = Dimensions.get('window');
const DISH_IMAGE_SIZE = 80;

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

const PRICE_RANGES = [
  { id: 'all', label: 'Any Price', emoji: '💰' },
  { id: 'under500', label: 'Under ₹500/day', emoji: '🟢', max: 500 },
  { id: '500-800', label: '₹500–₹800', emoji: '🟡', min: 500, max: 800 },
  { id: 'above800', label: '₹800+/day', emoji: '🔴', min: 800 },
];

// ── Components ──

function HighlightText({ text, query, style, highlightStyle }: {
  text: string; query: string; style?: any; highlightStyle?: any;
}) {
  if (!query || query.length < 2) {
    return <Text style={style}>{text}</Text>;
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} style={[{ backgroundColor: 'rgba(212,175,55,0.30)', color: '#B8960C', borderRadius: 2 }, highlightStyle]}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

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
  review: CookVideoReview; onPlay: (review: CookVideoReview) => void; colors: any; isDark: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [st.videoThumbCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPlay(review); }}
    >
      <Image source={{ uri: review.thumbnail }} style={st.videoThumbImage} contentFit="cover" transition={200} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.80)']} style={st.videoThumbGrad} />
      <View style={st.videoPlayBtn}>
        <MaterialIcons name="play-arrow" size={28} color="#FFF" />
      </View>
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
      <View style={st.videoCommentBubble}>
        <Text style={st.videoComment} numberOfLines={2}>{review.comment}</Text>
      </View>
    </Pressable>
  );
}

// ── Video Player Modal ──
function VideoPlayerModal({ review, visible, onClose, colors }: {
  review: CookVideoReview | null; visible: boolean; onClose: () => void; colors: any;
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

// ── Availability Indicator ──
function AvailabilityIndicator({ availability, cook, colors, isDark }: {
  availability: CookAvailability | undefined;
  cook: Cook;
  colors: any;
  isDark: boolean;
}) {
  // Determine status
  let status: 'available' | 'partial' | 'busy' = 'available';
  let label = 'Available';
  let color = '#4ADE80';
  let bgColor = 'rgba(74,222,128,0.10)';
  let icon: 'check-circle' | 'schedule' | 'block' = 'check-circle';
  let nextDate: string | null = null;

  if (!cook.isAvailable) {
    status = 'busy';
    label = 'Unavailable';
    color = '#EF4444';
    bgColor = 'rgba(239,68,68,0.10)';
    icon = 'block';
  } else if (availability) {
    status = availability.status;
    if (status === 'partial') {
      label = `${7 - availability.bookedDaysNext7}/7 days free`;
      color = '#F59E0B';
      bgColor = 'rgba(245,158,11,0.10)';
      icon = 'schedule';
      nextDate = availability.nextAvailableDate;
    } else if (status === 'busy') {
      label = 'Fully Booked';
      color = '#EF4444';
      bgColor = 'rgba(239,68,68,0.10)';
      icon = 'block';
      nextDate = availability.nextAvailableDate;
    } else {
      label = 'Available';
      color = '#4ADE80';
      bgColor = 'rgba(74,222,128,0.10)';
      icon = 'check-circle';
    }
  }

  const formatNextDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={[avail.container, { backgroundColor: bgColor, borderColor: color + '30' }]}>
      <View style={[avail.dot, { backgroundColor: color }]} />
      <MaterialIcons name={icon} size={12} color={color} />
      <Text style={[avail.label, { color }]}>{label}</Text>
      {nextDate && status !== 'available' ? (
        <View style={[avail.nextBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <MaterialIcons name="event" size={10} color={colors.textMuted} />
          <Text style={[avail.nextText, { color: colors.textMuted }]}>Next: {formatNextDate(nextDate)}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── Cook Card ──
function CookCard({ cook, index, onBook, onViewProfile, onPlayVideo, colors, isDark, searchQuery = '', availability }: {
  cook: Cook; index: number;
  onBook: (cook: Cook) => void; onViewProfile: (cook: Cook) => void;
  onPlayVideo: (review: CookVideoReview) => void;
  colors: any; isDark: boolean; searchQuery?: string;
  availability?: CookAvailability;
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
            <View style={[ck.availBadge, {
              borderColor: !cook.isAvailable ? '#EF4444' : availability?.status === 'partial' ? '#F59E0B' : availability?.status === 'busy' ? '#EF4444' : '#4ADE80',
            }]}>
              <View style={[ck.availDot, {
                backgroundColor: !cook.isAvailable ? '#EF4444' : availability?.status === 'partial' ? '#F59E0B' : availability?.status === 'busy' ? '#EF4444' : '#4ADE80',
              }]} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={ck.nameRow}>
              <HighlightText text={cook.name} query={searchQuery} style={[ck.cookName, { color: colors.textPrimary }]} />
            </View>
            <HighlightText text={`${cook.speciality} Specialist`} query={searchQuery} style={[ck.speciality, { color: colors.textMuted }]} />
            <View style={ck.ratingRow}>
              <StarRating rating={cook.rating} />
              <Text style={ck.ratingText}>{cook.rating}</Text>
              <Text style={[ck.reviewCount, { color: colors.textMuted }]}>({cook.reviews})</Text>
            </View>
            <View style={ck.metaRow}>
              <View style={ck.metaBadge}>
                <MaterialIcons name="schedule" size={11} color="#F5B731" />
                <Text style={[ck.metaText, { color: colors.textSecondary }]}>{cook.experience}</Text>
              </View>
              <View style={ck.metaBadge}>
                <MaterialIcons name="location-on" size={11} color="#F5B731" />
                <HighlightText text={cook.location} query={searchQuery} style={[ck.metaText, { color: colors.textSecondary }]} />
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
              <MaterialIcons name="videocam" size={14} color="#F5B731" />
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

        {/* Availability Indicator */}
        <AvailabilityIndicator availability={availability} cook={cook} colors={colors} isDark={isDark} />

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
              colors={cook.isAvailable ? ['#F5B731', '#FDD85D'] : ['#9CA3AF', '#9CA3AF']}
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

// ── Video Review Upload Modal ──
function VideoReviewUploadModal({ cook, visible, onClose, onSuccess, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void;
  onSuccess: () => void; colors: any; isDark: boolean;
}) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setVideoUri(null);
    setVideoName('');
    setRating(5);
    setComment('');
    setUploading(false);
    setUploadError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setUploadError('Gallery permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      setVideoName(result.assets[0].fileName || 'video.mp4');
      setUploadError(null);
    }
  }, []);

  const recordVideo = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { setUploadError('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      setVideoName(result.assets[0].fileName || 'recorded_video.mp4');
      setUploadError(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!cook || !user || !videoUri) return;
    if (!comment.trim()) { setUploadError('Please add a comment'); return; }
    setUploading(true);
    setUploadError(null);
    const { error } = await uploadVideoReview({
      cookId: cook.id,
      userId: user.id,
      customerName: user.username || user.email?.split('@')[0] || 'Customer',
      customerPhotoUrl: '',
      videoUri,
      rating,
      comment: comment.trim(),
    });
    setUploading(false);
    if (error) {
      setUploadError(error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      onSuccess();
      onClose();
    }
  }, [cook, user, videoUri, rating, comment, resetForm, onSuccess, onClose]);

  if (!cook || !visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={rv.overlay}>
          <Animated.View entering={FadeInUp.duration(400)} style={[rv.card, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={rv.header}>
                <Text style={[rv.title, { color: colors.textPrimary }]}>Video Review</Text>
                <Pressable style={({ pressed }) => [rv.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }, pressed && { opacity: 0.6 }]} onPress={handleClose}>
                  <MaterialIcons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={[rv.cookInfo, { borderBottomColor: colors.border }]}>
                <Image source={{ uri: cook.photo }} style={rv.cookAvatar} contentFit="cover" />
                <View>
                  <Text style={[rv.cookName, { color: colors.textPrimary }]}>{cook.name}</Text>
                  <Text style={[rv.cookSpec, { color: colors.textMuted }]}>{cook.speciality} Specialist</Text>
                </View>
              </View>

              <Text style={[rv.sectionLabel, { color: colors.textSecondary }]}>Your Video</Text>
              {videoUri ? (
                <View style={[rv.videoPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                  <View style={rv.videoPreviewIcon}>
                    <MaterialIcons name="videocam" size={28} color="#F5B731" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[rv.videoFileName, { color: colors.textPrimary }]} numberOfLines={1}>{videoName}</Text>
                    <Text style={rv.videoReady}>Ready to upload</Text>
                  </View>
                  <Pressable onPress={() => { setVideoUri(null); setVideoName(''); }} style={({ pressed }) => [pressed && { opacity: 0.6 }]} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <View style={rv.videoPickerRow}>
                  <Pressable style={({ pressed }) => [rv.pickerBtn, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.25)' }, pressed && { opacity: 0.8 }]} onPress={recordVideo}>
                    <MaterialIcons name="videocam" size={28} color="#F5B731" />
                    <Text style={[rv.pickerBtnLabel, { color: colors.textPrimary }]}>Record</Text>
                    <Text style={[rv.pickerBtnHint, { color: colors.textMuted }]}>Max 60s</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [rv.pickerBtn, { backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(129,140,248,0.06)', borderColor: 'rgba(129,140,248,0.25)' }, pressed && { opacity: 0.8 }]} onPress={pickFromGallery}>
                    <MaterialIcons name="photo-library" size={28} color="#818CF8" />
                    <Text style={[rv.pickerBtnLabel, { color: colors.textPrimary }]}>Gallery</Text>
                    <Text style={[rv.pickerBtnHint, { color: colors.textMuted }]}>Choose video</Text>
                  </Pressable>
                </View>
              )}

              <Text style={[rv.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>Your Rating</Text>
              <View style={rv.starRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Pressable key={star} onPress={() => { Haptics.selectionAsync(); setRating(star); }} hitSlop={4}>
                    <MaterialIcons name={star <= rating ? 'star' : 'star-border'} size={36} color="#FFD700" />
                  </Pressable>
                ))}
                <Text style={[rv.ratingLabel, { color: colors.textMuted }]}>
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                </Text>
              </View>

              <Text style={[rv.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>Your Comment</Text>
              <TextInput
                style={[rv.commentInput, { color: colors.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5', borderColor: colors.border }]}
                placeholder="Share your experience with this cook..."
                placeholderTextColor={colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={[rv.charCount, { color: colors.textMuted }]}>{comment.length}/300</Text>

              {uploadError ? (
                <View style={rv.errorRow}>
                  <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                  <Text style={rv.errorText}>{uploadError}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [rv.submitBtn, (!videoUri || !comment.trim() || uploading) && { opacity: 0.5 }, pressed && videoUri && comment.trim() && !uploading && { opacity: 0.85 }]}
                onPress={handleSubmit}
                disabled={!videoUri || !comment.trim() || uploading}
              >
                <LinearGradient colors={['#F5B731', '#FDD85D']} style={rv.submitBtnGrad}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <MaterialIcons name="cloud-upload" size={20} color="#FFF" />
                  )}
                  <Text style={rv.submitBtnText}>{uploading ? 'Uploading...' : 'Submit Review'}</Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Cook Profile Modal ──
function CookProfileModal({ cook, visible, onClose, onBook, onPlayVideo, onWriteReview, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void;
  onBook: (cook: Cook) => void; onPlayVideo: (review: CookVideoReview) => void;
  onWriteReview: (cook: Cook) => void;
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
          <View style={[ck.modalTopBar, { paddingTop: insets.top + 8 }]}>
            <Pressable style={({ pressed }) => [ck.modalBackBtn, pressed && { opacity: 0.7 }]} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
          </View>
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
              <MaterialIcons name="location-on" size={18} color="#F5B731" />
              <Text style={[ck.modalInfoValue, { color: colors.textPrimary }]}>{cook.location}</Text>
              <Text style={[ck.modalInfoLabel, { color: colors.textMuted }]}>Location</Text>
            </View>
            <View style={[ck.modalInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="translate" size={18} color="#F5B731" />
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
                  <MaterialIcons name="videocam" size={12} color="#F5B731" />
                  <Text style={st.videoReviewBadgeText}>{cook.videoReviews.length}</Text>
                </View>
              </View>
              <View style={{ gap: 12, marginTop: 12 }}>
                {cook.videoReviews.map((review) => (
                  <VideoReviewThumb key={review.id} review={review} onPlay={onPlayVideo} colors={colors} isDark={isDark} />
                ))}
              </View>
            </>
          ) : null}

          {/* Add Review Button */}
          <Pressable
            style={({ pressed }) => [rv.addReviewBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { onClose(); setTimeout(() => onWriteReview(cook), 350); }}
          >
            <LinearGradient colors={['#818CF8', '#6366F1']} style={rv.addReviewBtnGrad}>
              <MaterialIcons name="videocam" size={18} color="#FFF" />
              <Text style={rv.addReviewBtnText}>Add Your Video Review</Text>
            </LinearGradient>
          </Pressable>

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
            <MaterialIcons name="info-outline" size={16} color="#F5B731" />
            <Text style={[st.perMealText, { color: colors.textSecondary }]}>
              Single meal also available at <Text style={{ fontWeight: '900', color: '#F5B731' }}>₹{cook.pricing.perMeal}/meal</Text>
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
              colors={cook.isAvailable ? ['#F5B731', '#FDD85D'] : ['#9CA3AF', '#9CA3AF']}
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

// ── Weekly Calendar ──
function WeeklyCalendar({ selectedDate, onSelectDate, blockedDates, loading, colors, isDark }: {
  selectedDate: Date; onSelectDate: (d: Date) => void;
  blockedDates: Set<string>; loading: boolean; colors: any; isDark: boolean;
}) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const { weeks, monthLabel } = useMemo(() => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const allDays: Date[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      allDays.push(d);
    }
    const wks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) wks.push(allDays.slice(i, i + 7));
    const months = new Set(allDays.filter(d => d >= today).map(d => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })));
    return { weeks: wks, monthLabel: Array.from(months).join(' – ') };
  }, [today]);

  const fmtKey = (d: Date) => d.toISOString().split('T')[0];
  const todayKey = fmtKey(today);
  const selKey = fmtKey(selectedDate);
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <View style={{ flex: 1 }}>
          <Text style={[cal.title, { color: colors.textPrimary }]}>Select Start Date</Text>
          <Text style={[cal.monthLabel, { color: colors.textMuted }]}>{monthLabel}</Text>
        </View>
        <View style={cal.legend}>
          <View style={cal.legendItem}>
            <View style={[cal.legendDot, { backgroundColor: '#4ADE80' }]} />
            <Text style={[cal.legendText, { color: colors.textMuted }]}>Open</Text>
          </View>
          <View style={cal.legendItem}>
            <View style={[cal.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[cal.legendText, { color: colors.textMuted }]}>Booked</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={cal.loadingWrap}>
          <ActivityIndicator size="small" color="#F5B731" />
          <Text style={[cal.loadingText, { color: colors.textMuted }]}>Checking availability...</Text>
        </View>
      ) : (
        <>
          <View style={cal.dayNamesRow}>
            {DAY_NAMES.map(n => (
              <View key={n} style={cal.dayNameCell}>
                <Text style={[cal.dayNameText, { color: colors.textMuted }]}>{n}</Text>
              </View>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={cal.weekRow}>
              {week.map((day, di) => {
                const key = fmtKey(day);
                const isPast = day < today;
                const blocked = blockedDates.has(key);
                const selected = key === selKey;
                const isToday = key === todayKey;
                const disabled = isPast || blocked;

                return (
                  <Pressable
                    key={di}
                    style={[
                      cal.dayCell,
                      selected && { backgroundColor: '#F5B731', borderColor: '#D9A020', borderWidth: 2 },
                      !selected && blocked && { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)' },
                      !selected && !blocked && !isPast && { backgroundColor: isDark ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.04)' },
                      isPast && !selected && { opacity: 0.3 },
                    ]}
                    onPress={() => { if (!disabled) { Haptics.selectionAsync(); onSelectDate(day); } }}
                    disabled={disabled}
                  >
                    <Text style={[
                      cal.dayText,
                      { color: selected ? '#FFF' : blocked ? '#EF4444' : colors.textPrimary },
                      isToday && !selected && { color: '#F5B731', fontWeight: '900' },
                    ]}>
                      {day.getDate()}
                    </Text>
                    {isToday && !selected ? <View style={cal.todayDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}

      <View style={[cal.selectedInfo, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.04)' }]}>
        <MaterialIcons name="event" size={16} color="#F5B731" />
        <Text style={[cal.selectedText, { color: colors.textSecondary }]}>
          Starting:{' '}
          <Text style={{ fontWeight: '800', color: '#F5B731' }}>
            {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </Text>
      </View>
    </View>
  );
}

// ── Booking Confirmation Modal with plan selection ──
function BookingModal({ cook, visible, onClose, onBooked, colors, isDark }: {
  cook: Cook | null; visible: boolean; onClose: () => void;
  onBooked: () => void; colors: any; isDark: boolean;
}) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { earnCoins: earnCoinsFn } = useCoin();
  const [selectedPlan, setSelectedPlan] = useState<BookingPlan>('daily');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [existingBookings, setExistingBookings] = useState<CookBookingRecord[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (cook && visible) {
      setSelectedDate(new Date());
      setLoadingAvailability(true);
      fetchCookBookings(cook.id).then(({ data }) => {
        setExistingBookings(data);
        setLoadingAvailability(false);
      });
    }
  }, [cook?.id, visible]);

  const blockedDates = useMemo(() => {
    const blocked = new Set<string>();
    existingBookings.forEach(b => {
      const start = new Date(b.startDate + 'T00:00:00');
      const end = new Date(b.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        blocked.add(d.toISOString().split('T')[0]);
      }
    });
    return blocked;
  }, [existingBookings]);

  const endDate = useMemo(() => {
    const end = new Date(selectedDate);
    if (selectedPlan === 'weekly') end.setDate(end.getDate() + 6);
    else if (selectedPlan === 'monthly') end.setDate(end.getDate() + 29);
    return end;
  }, [selectedDate, selectedPlan]);

  if (!cook || !visible) return null;

  const getPrice = (plan: BookingPlan) => {
    switch (plan) {
      case 'daily': return cook.pricing.perDay;
      case 'weekly': return cook.pricing.perWeek;
      case 'monthly': return cook.pricing.perMonth;
    }
  };

  const handleConfirm = async () => {
    if (!user || !cook) return;
    setIsBooking(true);
    const { error } = await createBooking({
      userId: user.id,
      cookId: cook.id,
      cookName: cook.name,
      cookPhoto: cook.photo,
      cookSpeciality: cook.speciality,
      plan: selectedPlan,
      totalAmount: getPrice(selectedPlan),
      perMealRate: cook.pricing.perMeal,
      notes,
      startDate: selectedDate.toISOString().split('T')[0],
    });
    setIsBooking(false);
    if (error) {
      showAlert('Booking Failed', error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Award coins for booking
    earnCoinsFn(COIN_RULES.cook_booked.amount, 'cook_booked', { cookName: cook.name, plan: selectedPlan });
    setNotes('');
    setSelectedPlan('daily');
    onClose();
    onBooked();
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
                          borderColor: isActive ? '#F5B731' : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedPlan(plan.id); }}
                    >
                      <Text style={{ fontSize: 22 }}>{plan.emoji}</Text>
                      <Text style={[st.bookingPlanItemLabel, { color: isActive ? '#F5B731' : colors.textPrimary }]}>{plan.label}</Text>
                      <Text style={st.bookingPlanItemPrice}>₹{price.toLocaleString()}</Text>
                      <Text style={[st.bookingPlanItemDesc, { color: colors.textMuted }]}>{plan.desc}</Text>
                      {plan.savings ? (
                        <View style={[st.bookingSavingsPill, { backgroundColor: `${plan.color}18` }]}>
                          <Text style={[st.bookingSavingsText, { color: plan.color }]}>{plan.savings}</Text>
                        </View>
                      ) : null}
                      {isActive ? (
                        <View style={st.bookingPlanCheck}>
                          <MaterialIcons name="check-circle" size={20} color="#F5B731" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {/* Date Picker */}
              <WeeklyCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                blockedDates={blockedDates}
                loading={loadingAvailability}
                colors={colors}
                isDark={isDark}
              />

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
                  <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Start Date</Text>
                  <Text style={[ck.bookingSummaryValue, { color: colors.textPrimary }]}>
                    {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={ck.bookingSummaryRow}>
                  <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>End Date</Text>
                  <Text style={[ck.bookingSummaryValue, { color: colors.textPrimary }]}>
                    {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={ck.bookingSummaryRow}>
                  <Text style={[ck.bookingSummaryLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[ck.bookingSummaryValue, { color: '#F5B731', fontWeight: '900' }]}>
                    ₹{getPrice(selectedPlan).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              <View style={{ width: '100%' }}>
                <TextInput
                  style={[st.bookingNotes, { color: colors.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5', borderColor: colors.border }]}
                  placeholder="Any special requests or dietary notes..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>

              {/* Confirm Button */}
              <Pressable
                style={({ pressed }) => [ck.bookingDoneBtn, isBooking && { opacity: 0.6 }, pressed && !isBooking && { opacity: 0.85 }]}
                onPress={handleConfirm}
                disabled={isBooking}
              >
                <LinearGradient colors={['#F5B731', '#FDD85D']} style={ck.bookingDoneBtnGrad}>
                  {isBooking ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#FFF" />
                  )}
                  <Text style={ck.bookingDoneBtnText}>{isBooking ? 'Booking...' : 'Confirm Booking'}</Text>
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

// ── Loading Skeleton ──
function CookSkeleton({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <View style={[ck.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={ck.cardHeader}>
        <View style={[ck.photo, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ width: '60%', height: 16, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <View style={{ width: '40%', height: 12, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
          <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ width: 80, height: 28, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ width: DISH_IMAGE_SIZE, height: DISH_IMAGE_SIZE, borderRadius: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
        ))}
      </View>
    </View>
  );
}

// ── Top Cook Banner Carousel ──
function TopCookBanner({ cooks, onBook, onViewProfile, colors, isDark }: {
  cooks: Cook[]; onBook: (cook: Cook) => void;
  onViewProfile: (cook: Cook) => void; colors: any; isDark: boolean;
}) {
  const [activeBanner, setActiveBanner] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topCooks = useMemo(() => {
    return [...cooks]
      .filter(c => c.isAvailable)
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 5);
  }, [cooks]);

  // Auto-scroll
  useEffect(() => {
    if (topCooks.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveBanner(prev => {
        const next = (prev + 1) % topCooks.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [topCooks.length]);

  const onViewableChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveBanner(viewableItems[0].index);
    }
  }).current;

  const BANNER_W = SCREEN_W - 40;

  if (topCooks.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(400)} style={banner.container}>
      <View style={banner.headerRow}>
        <View style={banner.headerLeft}>
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <Text style={[banner.headerTitle, { color: colors.textPrimary }]}>Top Rated Cooks</Text>
        </View>
        <View style={banner.dotsRow}>
          {topCooks.map((_, i) => (
            <View key={i} style={[banner.dot, i === activeBanner && banner.dotActive]} />
          ))}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={topCooks}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_W + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 0 }}
        keyExtractor={item => `banner-${item.id}`}
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item: cook, index }) => (
          <Pressable
            style={({ pressed }) => [
              banner.card,
              { width: BANNER_W, marginRight: index < topCooks.length - 1 ? 12 : 0 },
              pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] },
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onViewProfile(cook); }}
          >
            <Image source={{ uri: cook.photo }} style={banner.bgImage} contentFit="cover" transition={300} />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Featured badge */}
            <View style={banner.featuredBadge}>
              <MaterialIcons name="verified" size={12} color="#FFF" />
              <Text style={banner.featuredText}>Featured Chef</Text>
            </View>

            {/* Rating badge */}
            <View style={banner.ratingBadge}>
              <MaterialIcons name="star" size={13} color="#FFD700" />
              <Text style={banner.ratingText}>{cook.rating}</Text>
            </View>

            {/* Info overlay */}
            <View style={banner.infoOverlay}>
              <View style={banner.infoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={banner.cookName}>{cook.name}</Text>
                  <Text style={banner.cookSpec}>{cook.speciality} Specialist • {cook.experience}</Text>
                  <View style={banner.tagRow}>
                    {cook.expertise.slice(0, 3).map(tag => (
                      <View key={tag} style={banner.tag}>
                        <Text style={banner.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={banner.priceBlock}>
                  <Text style={banner.priceLabel}>from</Text>
                  <Text style={banner.priceValue}>₹{cook.pricing.perMeal}</Text>
                  <Text style={banner.priceUnit}>/meal</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [banner.bookBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onBook(cook); }}
              >
                <LinearGradient colors={['#F5B731', '#FDD85D']} style={banner.bookBtnGrad}>
                  <MaterialIcons name="event-available" size={16} color="#FFF" />
                  <Text style={banner.bookBtnText}>Book Now</Text>
                  <View style={banner.coinBadge}>
                    <Text style={{ fontSize: 9 }}>🪙</Text>
                    <Text style={banner.coinText}>+{COIN_RULES.cook_booked.amount}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </Animated.View>
  );
}

// ── Main Screen ──
export default function BookCookScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [profileCook, setProfileCook] = useState<Cook | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [bookingCook, setBookingCook] = useState<Cook | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [activeVideo, setActiveVideo] = useState<CookVideoReview | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [reviewCook, setReviewCook] = useState<Cook | null>(null);
  const [showReviewUpload, setShowReviewUpload] = useState(false);
  const [cookAvailability, setCookAvailability] = useState<Record<string, CookAvailability>>({});

  const loadCooks = useCallback(async () => {
    const { data, error: fetchError } = await fetchCooks();
    if (fetchError) {
      setError(fetchError);
    } else {
      setCooks(data);
      setError(null);
      // Fetch availability for all cooks
      const cookIds = data.map(c => c.id);
      if (cookIds.length > 0) {
        const { data: availData } = await fetchCookAvailability(cookIds);
        setCookAvailability(availData);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCooks();
  }, [loadCooks]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCooks();
    setRefreshing(false);
  }, [loadCooks]);

  const filteredCooks = useMemo(() => {
    let result = cooks;

    // Cuisine filter
    if (activeFilter !== 'all') {
      result = result.filter(c => c.speciality === activeFilter);
    }

    // Price range filter
    if (priceRange !== 'all') {
      const range = PRICE_RANGES.find(r => r.id === priceRange);
      if (range) {
        result = result.filter(c => {
          const price = c.pricing.perDay;
          if ((range as any).min && (range as any).max) return price >= (range as any).min && price <= (range as any).max;
          if ((range as any).max) return price <= (range as any).max;
          if ((range as any).min) return price >= (range as any).min;
          return true;
        });
      }
    }

    // Text search
    if (debouncedQuery.length >= 2) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.speciality.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.expertise.some(e => e.toLowerCase().includes(q)) ||
        c.dishes.some(d => d.name.toLowerCase().includes(q)) ||
        c.languages.some(l => l.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeFilter, priceRange, debouncedQuery, cooks]);

  const availableCount = useMemo(() => cooks.filter(c => c.isAvailable).length, [cooks]);
  const avgRating = useMemo(() => {
    if (cooks.length === 0) return '0.0';
    return (cooks.reduce((s, c) => s + c.rating, 0) / cooks.length).toFixed(1);
  }, [cooks]);
  const totalVideoReviews = useMemo(() => cooks.reduce((s, c) => s + c.videoReviews.length, 0), [cooks]);

  const handleBook = useCallback((cook: Cook) => {
    setBookingCook(cook);
    setShowBooking(true);
  }, []);

  const handleViewProfile = useCallback((cook: Cook) => {
    setProfileCook(cook);
    setShowProfile(true);
  }, []);

  const handlePlayVideo = useCallback((review: CookVideoReview) => {
    setActiveVideo(review);
    setShowVideoPlayer(true);
  }, []);

  const handleWriteReview = useCallback((cook: Cook) => {
    setReviewCook(cook);
    setShowReviewUpload(true);
  }, []);

  const handleReviewSuccess = useCallback(async () => {
    await loadCooks();
  }, [loadCooks]);

  return (
    <View style={[ck.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5B731" colors={['#F5B731']} />
          }
        >
          {/* ═══ Header ═══ */}
          <LinearGradient
            colors={isDark ? ['#0D0A1A', '#151030', '#0D0A1A'] : ['#FFFDF8', '#FFF9F0', '#FFFDF8']}
            style={ck.header}
          >
            <Animated.View entering={FadeIn.duration(400)} style={ck.headerContent}>
              <View style={ck.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[ck.headerTitle, { color: colors.textPrimary }]}>Book a Cook 👨‍🍳</Text>
                  <Text style={[ck.headerSub, { color: colors.textMuted }]}>Hire expert home cooks for authentic meals</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [ck.headerIcon, { backgroundColor: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.08)' }, pressed && { opacity: 0.7 }]}
                  onPress={() => router.push('/booking-history' as any)}
                >
                  <MaterialIcons name="receipt-long" size={24} color="#F5B731" />
                </Pressable>
              </View>

              {/* Stats */}
              <View style={ck.statsRow}>
                {[
                  { label: 'Cooks Available', value: availableCount.toString(), emoji: '✅' },
                  { label: 'Avg Rating', value: avgRating, emoji: '⭐' },
                  { label: 'Video Reviews', value: totalVideoReviews.toString(), emoji: '🎥' },
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

          {/* ═══ Top Cook Banner Ads ═══ */}
          {!loading && cooks.length > 0 ? (
            <TopCookBanner
              cooks={cooks}
              onBook={handleBook}
              onViewProfile={handleViewProfile}
              colors={colors}
              isDark={isDark}
            />
          ) : null}

          {/* ═══ Search Bar ═══ */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={st.searchSection}>
            <View style={[
              st.searchBar,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F5',
                borderColor: searchQuery ? '#F5B731' : (isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB'),
                borderWidth: searchQuery ? 1.5 : 1,
              },
            ]}>
              <MaterialIcons name="search" size={20} color={searchQuery ? '#F5B731' : colors.textMuted} />
              <TextInput
                style={[st.searchInput, { color: colors.textPrimary }]}
                placeholder="Search by name, cuisine, location..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  onPress={() => { setSearchQuery(''); Haptics.selectionAsync(); }}
                  style={({ pressed }) => [st.searchClear, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {/* Price Range Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.priceChipsScroll}>
              {PRICE_RANGES.map(range => {
                const isActive = priceRange === range.id;
                return (
                  <Pressable
                    key={range.id}
                    style={[
                      st.priceChip,
                      {
                        backgroundColor: isActive
                          ? isDark ? 'rgba(212,175,55,0.20)' : 'rgba(212,175,55,0.10)'
                          : colors.surface,
                        borderColor: isActive ? '#F5B731' : colors.border,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setPriceRange(range.id); }}
                  >
                    <Text style={{ fontSize: 12 }}>{range.emoji}</Text>
                    <Text style={[st.priceChipLabel, { color: isActive ? '#F5B731' : colors.textSecondary }]}>{range.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Result count when searching */}
            {debouncedQuery.length >= 2 ? (
              <View style={st.searchResultInfo}>
                <MaterialIcons name="filter-list" size={14} color="#F5B731" />
                <Text style={[st.searchResultText, { color: colors.textMuted }]}>
                  {filteredCooks.length} cook{filteredCooks.length !== 1 ? 's' : ''} found
                  {debouncedQuery ? ` for "${debouncedQuery}"` : ''}
                </Text>
              </View>
            ) : null}
          </Animated.View>

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
                        borderColor: isActive ? '#F5B731' : colors.border,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setActiveFilter(chip.id); }}
                  >
                    <Text style={{ fontSize: 14 }}>{chip.emoji}</Text>
                    <Text style={[ck.filterLabel, { color: isActive ? '#F5B731' : colors.textSecondary }]}>{chip.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ═══ Cook Cards ═══ */}
          <View style={ck.cookList}>
            {loading ? (
              <>
                <CookSkeleton colors={colors} isDark={isDark} />
                <CookSkeleton colors={colors} isDark={isDark} />
              </>
            ) : error ? (
              <View style={[ck.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>⚠️</Text>
                <Text style={[ck.emptyTitle, { color: colors.textPrimary }]}>Failed to load cooks</Text>
                <Text style={[ck.emptySub, { color: colors.textMuted }]}>{error}</Text>
                <Pressable
                  style={({ pressed }) => [ck.retryBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => { setLoading(true); loadCooks(); }}
                >
                  <LinearGradient colors={['#F5B731', '#FDD85D']} style={ck.retryBtnGrad}>
                    <MaterialIcons name="refresh" size={16} color="#FFF" />
                    <Text style={ck.retryBtnText}>Retry</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : filteredCooks.length === 0 ? (
              <View style={[ck.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 36 }}>🔍</Text>
                <Text style={[ck.emptyTitle, { color: colors.textPrimary }]}>No cooks found</Text>
                <Text style={[ck.emptySub, { color: colors.textMuted }]}>Try a different cuisine filter</Text>
              </View>
            ) : (
              filteredCooks.map((cook, i) => (
                <CookCard
                  key={cook.id}
                  cook={cook}
                  index={i}
                  onBook={handleBook}
                  onViewProfile={handleViewProfile}
                  onPlayVideo={handlePlayVideo}
                  colors={colors}
                  isDark={isDark}
                  searchQuery={debouncedQuery}
                  availability={cookAvailability[cook.id]}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CookProfileModal
        cook={profileCook}
        visible={showProfile}
        onClose={() => { setShowProfile(false); setTimeout(() => setProfileCook(null), 300); }}
        onBook={handleBook}
        onPlayVideo={handlePlayVideo}
        onWriteReview={handleWriteReview}
        colors={colors}
        isDark={isDark}
      />

      <BookingModal
        cook={bookingCook}
        visible={showBooking}
        onClose={() => { setShowBooking(false); setTimeout(() => setBookingCook(null), 300); }}
        onBooked={() => router.push('/booking-history' as any)}
        colors={colors}
        isDark={isDark}
      />

      <VideoPlayerModal
        review={activeVideo}
        visible={showVideoPlayer}
        onClose={() => { setShowVideoPlayer(false); setTimeout(() => setActiveVideo(null), 300); }}
        colors={colors}
      />

      <VideoReviewUploadModal
        cook={reviewCook}
        visible={showReviewUpload}
        onClose={() => { setShowReviewUpload(false); setTimeout(() => setReviewCook(null), 300); }}
        onSuccess={handleReviewSuccess}
        colors={colors}
        isDark={isDark}
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
    backgroundColor: 'rgba(245,183,49,0.90)',
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
  videoReviewBadgeText: { fontSize: 12, fontWeight: '800', color: '#F5B731' },

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
  videoModalAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#F5B731' },
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
  pricingPlanPrice: { fontSize: 18, fontWeight: '900', color: '#F5B731' },
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

  // Search
  searchSection: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  searchBar: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 16,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' as const, paddingVertical: 0 },
  searchClear: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  priceChipsScroll: { gap: 8 },
  priceChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
  },
  priceChipLabel: { fontSize: 12, fontWeight: '700' as const },
  searchResultInfo: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingVertical: 4,
  },
  searchResultText: { fontSize: 12, fontWeight: '600' as const },

  // Booking notes
  bookingNotes: {
    minHeight: 56, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10,
    fontSize: 13, fontWeight: '500' as const, lineHeight: 19, width: '100%' as any,
  },

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
  bookingCookPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#F5B731' },
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
  bookingPlanItemPrice: { fontSize: 15, fontWeight: '900', color: '#F5B731' },
  bookingPlanItemDesc: { fontSize: 8, fontWeight: '600', textAlign: 'center' },
  bookingSavingsPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  bookingSavingsText: { fontSize: 8, fontWeight: '800' },
  bookingPlanCheck: { position: 'absolute', top: 6, right: 6 },
});

const banner = StyleSheet.create({
  container: { paddingTop: 16, gap: 10 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(212,175,55,0.25)',
  },
  dotActive: { width: 18, backgroundColor: '#F5B731', borderRadius: 3 },
  card: {
    height: 200, borderRadius: 22, overflow: 'hidden',
    marginLeft: 20, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20, shadowRadius: 16, elevation: 8,
  },
  bgImage: { ...StyleSheet.absoluteFillObject },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(245,183,49,0.90)',
  },
  featuredText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
  ratingBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ratingText: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  infoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8, gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  cookName: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  cookSpec: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.80)', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tagText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  priceBlock: { alignItems: 'center' },
  priceLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.60)' },
  priceValue: { fontSize: 22, fontWeight: '900', color: '#FDD85D' },
  priceUnit: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.60)' },
  bookBtn: { borderRadius: 14, overflow: 'hidden' },
  bookBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 11, paddingHorizontal: 16,
  },
  bookBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginLeft: 4,
  },
  coinText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
});

const cal = StyleSheet.create({
  container: { width: '100%', gap: 6 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '800' },
  monthLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  legend: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600' },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 8 },
  loadingText: { fontSize: 12, fontWeight: '500' },
  dayNamesRow: { flexDirection: 'row', marginBottom: 2 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayNameText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  weekRow: { flexDirection: 'row', marginBottom: 3 },
  dayCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    height: 36, borderRadius: 10, marginHorizontal: 1.5, position: 'relative',
  },
  dayText: { fontSize: 13, fontWeight: '600' },
  todayDot: {
    position: 'absolute', bottom: 3,
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#F5B731',
  },
  selectedInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginTop: 4,
  },
  selectedText: { fontSize: 13, fontWeight: '500' },
});

const rv = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end' as const,
  },
  card: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '900' as const },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  cookInfo: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  cookAvatar: { width: 48, height: 48, borderRadius: 16, borderWidth: 2, borderColor: '#F5B731' },
  cookName: { fontSize: 16, fontWeight: '800' as const },
  cookSpec: { fontSize: 12, fontWeight: '500' as const },
  sectionLabel: { fontSize: 13, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 },
  videoPickerRow: { flexDirection: 'row' as const, gap: 12 },
  pickerBtn: {
    flex: 1, alignItems: 'center' as const, gap: 6,
    paddingVertical: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed' as const,
  },
  pickerBtnLabel: { fontSize: 14, fontWeight: '700' as const },
  pickerBtnHint: { fontSize: 10, fontWeight: '500' as const },
  videoPreview: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  videoPreviewIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.10)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  videoFileName: { fontSize: 14, fontWeight: '700' as const },
  videoReady: { fontSize: 11, fontWeight: '600' as const, marginTop: 2, color: '#4ADE80' },
  starRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  ratingLabel: { fontSize: 13, fontWeight: '600' as const, marginLeft: 8 },
  commentInput: {
    minHeight: 80, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12,
    fontSize: 14, fontWeight: '500' as const, lineHeight: 21,
  },
  charCount: { fontSize: 11, fontWeight: '500' as const, textAlign: 'right' as const, marginTop: 4 },
  errorRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 8 },
  errorText: { fontSize: 13, fontWeight: '600' as const, color: '#EF4444' },
  submitBtn: { marginTop: 16, marginBottom: 8 },
  submitBtnGrad: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    paddingVertical: 15, borderRadius: 16,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800' as const, color: '#FFF' },
  addReviewBtn: { marginTop: 16 },
  addReviewBtnGrad: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    paddingVertical: 13, borderRadius: 14,
  },
  addReviewBtnText: { fontSize: 14, fontWeight: '800' as const, color: '#FFF' },
});

const avail = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextText: {
    fontSize: 10,
    fontWeight: '600',
  },
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
    borderWidth: 2,
  },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cookName: { fontSize: 17, fontWeight: '800' },
  unavailTag: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.10)',
  },
  unavailText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  speciality: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: '800', color: '#F5B731' },
  reviewCount: { fontSize: 11, fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontWeight: '600' },
  expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expertiseTag: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  expertiseText: { fontSize: 11, fontWeight: '700', color: '#F5B731' },

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
  videoCountText: { fontSize: 10, fontWeight: '800', color: '#F5B731' },
  videoMiniThumb: {
    width: 100, height: 70, borderRadius: 10, overflow: 'hidden', position: 'relative',
  },
  videoMiniImg: { width: '100%', height: '100%' },
  videoMiniPlay: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -12, marginLeft: -12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(245,183,49,0.85)',
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
  priceValue: { fontSize: 17, fontWeight: '900', color: '#F5B731' },
  priceDivider: { width: 1, height: 28 },
  bookBtn: {},
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14,
  },
  bookBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Empty / Error
  emptyState: {
    padding: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  retryBtn: { marginTop: 8 },
  retryBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

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
  modalBottomPrice: { fontSize: 18, fontWeight: '900', color: '#F5B731' },
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
