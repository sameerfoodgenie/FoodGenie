import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { theme } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Types ───

type AspectOption = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  ratio: number | null;
  desc: string;
};

type FilterOption = {
  id: string;
  label: string;
  overlay: string | null;
  brightness: number;
};

type OverlayItem = {
  id: string;
  type: 'emoji' | 'text' | 'location';
  content: string;
  x: number;
  y: number;
  scale: number;
  color: string;
};

// ─── Constants ───

const ASPECT_OPTIONS: AspectOption[] = [
  { id: 'feed', label: 'Feed', icon: 'crop-portrait', ratio: 4 / 5, desc: '4:5' },
  { id: 'square', label: 'Square', icon: 'crop-square', ratio: 1, desc: '1:1' },
  { id: 'story', label: 'Story', icon: 'stay-current-portrait', ratio: 9 / 16, desc: '9:16' },
  { id: 'wide', label: 'Wide', icon: 'crop-landscape', ratio: 16 / 9, desc: '16:9' },
  { id: 'original', label: 'Original', icon: 'crop-free', ratio: null, desc: 'Free' },
];

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'none', label: 'Original', overlay: null, brightness: 0 },
  { id: 'warm', label: 'Warm', overlay: 'rgba(255,160,60,0.12)', brightness: 0.03 },
  { id: 'cool', label: 'Cool', overlay: 'rgba(80,140,220,0.10)', brightness: 0 },
  { id: 'vivid', label: 'Vivid', overlay: 'rgba(255,215,0,0.08)', brightness: 0.05 },
  { id: 'moody', label: 'Moody', overlay: 'rgba(30,20,60,0.18)', brightness: -0.05 },
  { id: 'fade', label: 'Fade', overlay: 'rgba(230,225,215,0.22)', brightness: 0.08 },
  { id: 'noir', label: 'B&W', overlay: null, brightness: 0 },
];

const FOOD_EMOJIS = ['🍕', '🍔', '🍣', '🌮', '🥗', '🍰', '🍩', '🍦', '🧁', '🥘', '🍲', '🍛', '🥐', '🥑', '🍇', '🍎', '🍜', '🥟', '🍤', '🧀'];
const MOOD_EMOJIS = ['❤️', '🔥', '😋', '🤤', '👨‍🍳', '👩‍🍳', '💯', '✨', '⭐', '🏆', '👑', '💛', '🎉', '😍', '💪', '🙌'];
const TAG_EMOJIS = ['📍', '🏠', '🍽', '📦', '☀️', '🌙', '🍿', '🎬', '📸', '🎵'];

const TEXT_COLORS = ['#FFFFFF', '#FFD700', '#FF3B30', '#4ADE80', '#3B82F6', '#A855F7', '#F97316', '#EC4899', '#1A1A2E'];

// ─── Helper ───

function calculateCrop(
  imageWidth: number,
  imageHeight: number,
  targetRatio: number,
) {
  const imageRatio = imageWidth / imageHeight;
  let cropWidth: number, cropHeight: number, originX: number, originY: number;

  if (imageRatio > targetRatio) {
    cropHeight = imageHeight;
    cropWidth = Math.round(imageHeight * targetRatio);
    originX = Math.round((imageWidth - cropWidth) / 2);
    originY = 0;
  } else {
    cropWidth = imageWidth;
    cropHeight = Math.round(imageWidth / targetRatio);
    originX = 0;
    originY = Math.round((imageHeight - cropHeight) / 2);
  }

  return { originX, originY, width: cropWidth, height: cropHeight };
}

let overlayIdCounter = 0;

// ─── Draggable Overlay Component ───

function DraggableOverlay({
  item,
  onMove,
  onSelect,
  isSelected,
  containerWidth,
  containerHeight,
}: {
  item: OverlayItem;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  containerWidth: number;
  containerHeight: number;
}) {
  const posRef = useRef({ x: item.x, y: item.y });

  useEffect(() => {
    posRef.current = { x: item.x, y: item.y };
  }, [item.x, item.y]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Haptics.selectionAsync();
      onSelect(item.id);
    },
    onPanResponderMove: (_, gesture) => {
      const newX = Math.max(0, Math.min(containerWidth - 40, posRef.current.x + gesture.dx));
      const newY = Math.max(0, Math.min(containerHeight - 40, posRef.current.y + gesture.dy));
      onMove(item.id, newX, newY);
    },
    onPanResponderRelease: (_, gesture) => {
      posRef.current = {
        x: Math.max(0, Math.min(containerWidth - 40, posRef.current.x + gesture.dx)),
        y: Math.max(0, Math.min(containerHeight - 40, posRef.current.y + gesture.dy)),
      };
    },
  }), [item.id, containerWidth, containerHeight, onMove, onSelect]);

  const fontSize = item.type === 'emoji' ? 32 * item.scale : 16 * item.scale;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        overlayStyles.item,
        {
          left: item.x,
          top: item.y,
          transform: [{ scale: item.scale }],
        },
        isSelected && overlayStyles.itemSelected,
      ]}
    >
      {item.type === 'emoji' ? (
        <Text style={{ fontSize: 32 }}>{item.content}</Text>
      ) : item.type === 'location' ? (
        <View style={overlayStyles.locationTag}>
          <MaterialIcons name="place" size={14} color="#FFD700" />
          <Text style={[overlayStyles.locationText, { color: item.color }]}>{item.content}</Text>
        </View>
      ) : (
        <Text style={[
          overlayStyles.textLabel,
          { color: item.color, fontSize },
        ]}>
          {item.content}
        </Text>
      )}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  item: {
    position: 'absolute',
    zIndex: 50,
    padding: 4,
  },
  itemSelected: {
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.70)',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderStyle: 'dashed',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textLabel: {
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.70)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

// ─── Main Component ───

export default function PhotoEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const imageUri = params.imageUri || '';
  const viewShotRef = useRef<ViewShot>(null);

  const [selectedAspect, setSelectedAspect] = useState<string>('feed');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'crop' | 'filter' | 'sticker'>('crop');

  // Overlay state
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [stickerSubTab, setStickerSubTab] = useState<'emoji' | 'text' | 'location'>('emoji');
  const [emojiCategory, setEmojiCategory] = useState<'food' | 'mood' | 'tags'>('food');
  const [customText, setCustomText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [locationText, setLocationText] = useState('');

  // Get image dimensions
  useEffect(() => {
    if (imageUri && Platform.OS !== 'web') {
      const RNImage = require('react-native').Image;
      RNImage.getSize(
        imageUri,
        (w: number, h: number) => setImageDims({ w, h }),
        () => setImageDims({ w: 1080, h: 1350 }),
      );
    } else {
      setImageDims({ w: 1080, h: 1350 });
    }
  }, [imageUri]);

  const currentAspect = ASPECT_OPTIONS.find(a => a.id === selectedAspect);
  const currentFilter = FILTER_OPTIONS.find(f => f.id === selectedFilter);

  // Calculate preview dimensions
  const previewPadding = 24;
  const maxPreviewW = SCREEN_W - previewPadding * 2;
  const maxPreviewH = SCREEN_H * 0.42;

  const previewDims = useCallback(() => {
    const ratio = currentAspect?.ratio;
    if (!ratio) {
      if (imageDims) {
        const imgRatio = imageDims.w / imageDims.h;
        if (imgRatio > maxPreviewW / maxPreviewH) {
          return { width: maxPreviewW, height: maxPreviewW / imgRatio };
        }
        return { height: maxPreviewH, width: maxPreviewH * imgRatio };
      }
      return { width: maxPreviewW, height: maxPreviewW * 1.25 };
    }
    const targetW = maxPreviewW;
    const targetH = targetW / ratio;
    if (targetH > maxPreviewH) {
      return { width: maxPreviewH * ratio, height: maxPreviewH };
    }
    return { width: targetW, height: targetH };
  }, [currentAspect, imageDims, maxPreviewW, maxPreviewH]);

  const dims = previewDims();

  // ─── Overlay actions ───
  const addEmoji = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = `overlay_${++overlayIdCounter}`;
    setOverlays(prev => [...prev, {
      id,
      type: 'emoji',
      content: emoji,
      x: dims.width / 2 - 20,
      y: dims.height / 2 - 20,
      scale: 1,
      color: '#FFFFFF',
    }]);
    setSelectedOverlayId(id);
  }, [dims]);

  const addText = useCallback(() => {
    if (!customText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = `overlay_${++overlayIdCounter}`;
    setOverlays(prev => [...prev, {
      id,
      type: 'text',
      content: customText.trim(),
      x: dims.width / 2 - 40,
      y: dims.height / 2 - 12,
      scale: 1,
      color: textColor,
    }]);
    setSelectedOverlayId(id);
    setCustomText('');
  }, [customText, textColor, dims]);

  const addLocation = useCallback(() => {
    if (!locationText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = `overlay_${++overlayIdCounter}`;
    setOverlays(prev => [...prev, {
      id,
      type: 'location',
      content: locationText.trim(),
      x: dims.width / 2 - 50,
      y: dims.height * 0.75,
      scale: 1,
      color: '#FFFFFF',
    }]);
    setSelectedOverlayId(id);
    setLocationText('');
  }, [locationText, dims]);

  const moveOverlay = useCallback((id: string, x: number, y: number) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, x, y } : o));
  }, []);

  const deleteSelectedOverlay = useCallback(() => {
    if (!selectedOverlayId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOverlays(prev => prev.filter(o => o.id !== selectedOverlayId));
    setSelectedOverlayId(null);
  }, [selectedOverlayId]);

  const scaleSelectedOverlay = useCallback((delta: number) => {
    if (!selectedOverlayId) return;
    Haptics.selectionAsync();
    setOverlays(prev => prev.map(o =>
      o.id === selectedOverlayId
        ? { ...o, scale: Math.max(0.5, Math.min(3, o.scale + delta)) }
        : o
    ));
  }, [selectedOverlayId]);

  const handleRotate = useCallback(() => {
    Haptics.selectionAsync();
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleFlip = useCallback(() => {
    Haptics.selectionAsync();
    setFlipped(prev => !prev);
  }, []);

  const handleApply = useCallback(async () => {
    if (!imageUri || processing) return;
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Deselect overlays so dashed border is hidden during capture
    setSelectedOverlayId(null);

    // Small delay to let deselect render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      let finalUri = imageUri;

      // If overlays exist, capture the composited view
      if (overlays.length > 0 && viewShotRef.current) {
        try {
          const capturedUri = await (viewShotRef.current as any).capture();
          if (capturedUri) {
            finalUri = capturedUri;
            // Apply manipulations on the captured image
            const actions: ImageManipulator.Action[] = [];
            actions.push({ resize: { width: 1080 } });
            const result = await ImageManipulator.manipulateAsync(
              finalUri,
              actions,
              { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
            );
            router.replace({ pathname: '/create-post', params: { imageUri: result.uri } });
            return;
          }
        } catch (captureErr) {
          console.log('ViewShot capture error, falling back:', captureErr);
        }
      }

      // No overlays or capture failed: use image manipulator
      const actions: ImageManipulator.Action[] = [];

      if (rotation > 0) {
        actions.push({ rotate: rotation });
      }
      if (flipped) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
      if (currentAspect?.ratio && imageDims) {
        let effW = imageDims.w;
        let effH = imageDims.h;
        if (rotation === 90 || rotation === 270) {
          effW = imageDims.h;
          effH = imageDims.w;
        }
        const crop = calculateCrop(effW, effH, currentAspect.ratio);
        actions.push({ crop });
      }
      actions.push({ resize: { width: 1080 } });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
      );
      router.replace({ pathname: '/create-post', params: { imageUri: result.uri } });
    } catch (e: any) {
      console.log('Photo editor error:', e);
      router.replace({ pathname: '/create-post', params: { imageUri } });
    } finally {
      setProcessing(false);
    }
  }, [imageUri, processing, rotation, flipped, currentAspect, imageDims, router, overlays]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    router.replace({ pathname: '/create-post', params: { imageUri } });
  }, [imageUri, router]);

  const hasOverlays = overlays.length > 0;

  if (!imageUri) {
    router.back();
    return null;
  }

  const emojiList = emojiCategory === 'food' ? FOOD_EMOJIS : emojiCategory === 'mood' ? MOOD_EMOJIS : TAG_EMOJIS;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); router.back(); }}
            >
              <MaterialIcons name="close" size={22} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Photo</Text>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          {/* Image Preview */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.previewArea}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'jpg', quality: 0.92 }}
              style={{
                width: dims.width,
                height: dims.height,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <View style={[styles.previewFrame, { width: dims.width, height: dims.height }]}>
                {/* Image */}
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.previewImage,
                    {
                      transform: [
                        { rotate: `${rotation}deg` },
                        { scaleX: flipped ? -1 : 1 },
                      ],
                    },
                  ]}
                  contentFit="cover"
                  transition={200}
                />

                {/* Filter overlay */}
                {currentFilter?.overlay ? (
                  <View
                    style={[StyleSheet.absoluteFillObject, { backgroundColor: currentFilter.overlay }]}
                    pointerEvents="none"
                  />
                ) : null}

                {selectedFilter === 'noir' ? (
                  <View
                    style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(128,128,128,0.45)' }]}
                    pointerEvents="none"
                  />
                ) : null}

                {currentFilter && currentFilter.brightness !== 0 ? (
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        backgroundColor:
                          currentFilter.brightness > 0
                            ? `rgba(255,255,255,${Math.abs(currentFilter.brightness)})`
                            : `rgba(0,0,0,${Math.abs(currentFilter.brightness)})`,
                      },
                    ]}
                    pointerEvents="none"
                  />
                ) : null}

                {/* Sticker / Text overlays */}
                {overlays.map(item => (
                  <DraggableOverlay
                    key={item.id}
                    item={item}
                    onMove={moveOverlay}
                    onSelect={setSelectedOverlayId}
                    isSelected={selectedOverlayId === item.id}
                    containerWidth={dims.width}
                    containerHeight={dims.height}
                  />
                ))}

                {/* Grid overlay (non-captured visual aid only when no stickers selected) */}
                {showGrid && activeTab === 'crop' ? (
                  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                    <View style={[styles.gridLineV, { left: '33.33%' }]} />
                    <View style={[styles.gridLineV, { left: '66.66%' }]} />
                    <View style={[styles.gridLineH, { top: '33.33%' }]} />
                    <View style={[styles.gridLineH, { top: '66.66%' }]} />
                    <View style={styles.gridCenter}>
                      <View style={styles.gridCenterDot} />
                    </View>
                  </View>
                ) : null}

                {/* Corner marks */}
                <View style={[styles.cornerMark, styles.cornerTL]} pointerEvents="none" />
                <View style={[styles.cornerMark, styles.cornerTR]} pointerEvents="none" />
                <View style={[styles.cornerMark, styles.cornerBL]} pointerEvents="none" />
                <View style={[styles.cornerMark, styles.cornerBR]} pointerEvents="none" />
              </View>
            </ViewShot>

            {/* Overlay count + selected actions */}
            <View style={styles.overlayBar}>
              {hasOverlays ? (
                <View style={styles.overlayCountBadge}>
                  <MaterialIcons name="layers" size={13} color="#D4AF37" />
                  <Text style={styles.overlayCountText}>{overlays.length} sticker{overlays.length > 1 ? 's' : ''}</Text>
                </View>
              ) : (
                <View style={styles.aspectLabel}>
                  <Text style={styles.aspectLabelText}>
                    {currentAspect?.desc || 'Free'} {currentAspect?.label === 'Feed' ? '· Best for Feed' : ''}
                  </Text>
                </View>
              )}
              {selectedOverlayId ? (
                <View style={styles.selectedActions}>
                  <Pressable
                    style={({ pressed }) => [styles.selActionBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => scaleSelectedOverlay(-0.15)}
                  >
                    <MaterialIcons name="remove" size={18} color={theme.textSecondary} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.selActionBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => scaleSelectedOverlay(0.15)}
                  >
                    <MaterialIcons name="add" size={18} color={theme.textSecondary} />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.selActionBtn, styles.selDeleteBtn, pressed && { opacity: 0.7 }]}
                    onPress={deleteSelectedOverlay}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.selActionBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => setSelectedOverlayId(null)}
                  >
                    <MaterialIcons name="check" size={18} color="#4ADE80" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* Quick Actions Row */}
          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
              onPress={handleRotate}
            >
              <MaterialIcons name="rotate-right" size={20} color={theme.textPrimary} />
              <Text style={styles.quickBtnText}>Rotate</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
              onPress={handleFlip}
            >
              <MaterialIcons name="flip" size={20} color={flipped ? '#D4AF37' : theme.textPrimary} />
              <Text style={[styles.quickBtnText, flipped && { color: '#D4AF37' }]}>Flip</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { Haptics.selectionAsync(); setShowGrid(g => !g); }}
            >
              <MaterialIcons name="grid-on" size={20} color={showGrid ? '#D4AF37' : theme.textPrimary} />
              <Text style={[styles.quickBtnText, showGrid && { color: '#D4AF37' }]}>Grid</Text>
            </Pressable>
          </View>

          {/* Tab Switcher — 3 tabs */}
          <View style={styles.tabRow}>
            {(['crop', 'filter', 'sticker'] as const).map(tab => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
              >
                <MaterialIcons
                  name={tab === 'crop' ? 'crop' : tab === 'filter' ? 'auto-fix-high' : 'emoji-emotions'}
                  size={17}
                  color={activeTab === tab ? '#D4AF37' : theme.textMuted}
                />
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'crop' ? 'Frame' : tab === 'filter' ? 'Filters' : 'Stickers'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Options Area */}
          <Animated.View entering={FadeInUp.duration(250)} style={styles.optionsArea}>
            {activeTab === 'crop' ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.aspectRow}
              >
                {ASPECT_OPTIONS.map(opt => {
                  const isActive = selectedAspect === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={({ pressed }) => [
                        styles.aspectChip,
                        isActive && styles.aspectChipActive,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedAspect(opt.id); }}
                    >
                      <View style={[styles.aspectIconWrap, isActive && styles.aspectIconWrapActive]}>
                        <MaterialIcons name={opt.icon} size={22} color={isActive ? '#D4AF37' : theme.textMuted} />
                      </View>
                      <Text style={[styles.aspectChipLabel, isActive && styles.aspectChipLabelActive]}>{opt.label}</Text>
                      <Text style={[styles.aspectChipDesc, isActive && { color: '#D4AF37' }]}>{opt.desc}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : activeTab === 'filter' ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {FILTER_OPTIONS.map(flt => {
                  const isActive = selectedFilter === flt.id;
                  return (
                    <Pressable
                      key={flt.id}
                      style={({ pressed }) => [styles.filterChip, pressed && { opacity: 0.8 }]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedFilter(flt.id); }}
                    >
                      <View style={styles.filterPreview}>
                        <Image source={{ uri: imageUri }} style={styles.filterPreviewImg} contentFit="cover" />
                        {flt.overlay ? (
                          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: flt.overlay, borderRadius: 12 }]} />
                        ) : null}
                        {flt.id === 'noir' ? (
                          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(128,128,128,0.45)', borderRadius: 12 }]} />
                        ) : null}
                        {isActive ? (
                          <View style={styles.filterCheckWrap}>
                            <MaterialIcons name="check" size={14} color="#FFF" />
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{flt.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              /* ─── Sticker Tab ─── */
              <View style={styles.stickerArea}>
                {/* Sub-tab switcher */}
                <View style={styles.stickerSubTabs}>
                  {([
                    { id: 'emoji' as const, label: 'Emoji', icon: 'emoji-emotions' as const },
                    { id: 'text' as const, label: 'Text', icon: 'text-fields' as const },
                    { id: 'location' as const, label: 'Location', icon: 'place' as const },
                  ]).map(st => (
                    <Pressable
                      key={st.id}
                      style={[styles.stickerSubTab, stickerSubTab === st.id && styles.stickerSubTabActive]}
                      onPress={() => { Haptics.selectionAsync(); setStickerSubTab(st.id); }}
                    >
                      <MaterialIcons
                        name={st.icon}
                        size={15}
                        color={stickerSubTab === st.id ? '#D4AF37' : '#9CA3AF'}
                      />
                      <Text style={[
                        styles.stickerSubTabText,
                        stickerSubTab === st.id && styles.stickerSubTabTextActive,
                      ]}>{st.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {stickerSubTab === 'emoji' ? (
                  <View>
                    {/* Emoji category pills */}
                    <View style={styles.emojiCatRow}>
                      {([
                        { id: 'food' as const, label: 'Food' },
                        { id: 'mood' as const, label: 'Mood' },
                        { id: 'tags' as const, label: 'Tags' },
                      ]).map(cat => (
                        <Pressable
                          key={cat.id}
                          style={[styles.emojiCatPill, emojiCategory === cat.id && styles.emojiCatPillActive]}
                          onPress={() => { Haptics.selectionAsync(); setEmojiCategory(cat.id); }}
                        >
                          <Text style={[
                            styles.emojiCatText,
                            emojiCategory === cat.id && styles.emojiCatTextActive,
                          ]}>{cat.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {/* Emoji grid */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.emojiGrid}
                    >
                      {emojiList.map((emoji, i) => (
                        <Pressable
                          key={`${emoji}_${i}`}
                          style={({ pressed }) => [styles.emojiBtn, pressed && { opacity: 0.6, transform: [{ scale: 0.85 }] }]}
                          onPress={() => addEmoji(emoji)}
                        >
                          <Text style={styles.emojiBtnText}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : stickerSubTab === 'text' ? (
                  <View style={styles.textInputArea}>
                    <View style={styles.textInputRow}>
                      <TextInput
                        style={styles.stickerTextInput}
                        value={customText}
                        onChangeText={setCustomText}
                        placeholder="Type your text..."
                        placeholderTextColor="#9CA3AF"
                        maxLength={50}
                        returnKeyType="done"
                        onSubmitEditing={addText}
                      />
                      <Pressable
                        style={({ pressed }) => [
                          styles.stickerAddBtn,
                          !customText.trim() && { opacity: 0.4 },
                          pressed && customText.trim() ? { opacity: 0.8 } : {},
                        ]}
                        onPress={addText}
                        disabled={!customText.trim()}
                      >
                        <MaterialIcons name="add" size={20} color="#FFF" />
                      </Pressable>
                    </View>
                    {/* Color picker */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.colorRow}
                    >
                      {TEXT_COLORS.map(color => (
                        <Pressable
                          key={color}
                          style={[
                            styles.colorDot,
                            { backgroundColor: color },
                            textColor === color && styles.colorDotActive,
                            color === '#FFFFFF' && { borderWidth: 1.5, borderColor: '#E5E7EB' },
                          ]}
                          onPress={() => { Haptics.selectionAsync(); setTextColor(color); }}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.textInputArea}>
                    <View style={styles.textInputRow}>
                      <View style={styles.locationInputIcon}>
                        <MaterialIcons name="place" size={18} color="#D4AF37" />
                      </View>
                      <TextInput
                        style={[styles.stickerTextInput, { paddingLeft: 36 }]}
                        value={locationText}
                        onChangeText={setLocationText}
                        placeholder="Add location tag..."
                        placeholderTextColor="#9CA3AF"
                        maxLength={40}
                        returnKeyType="done"
                        onSubmitEditing={addLocation}
                      />
                      <Pressable
                        style={({ pressed }) => [
                          styles.stickerAddBtn,
                          !locationText.trim() && { opacity: 0.4 },
                          pressed && locationText.trim() ? { opacity: 0.8 } : {},
                        ]}
                        onPress={addLocation}
                        disabled={!locationText.trim()}
                      >
                        <MaterialIcons name="add" size={20} color="#FFF" />
                      </Pressable>
                    </View>
                    <Text style={styles.locationHint}>Drag the tag on the photo to reposition</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Bottom CTA */}
          <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.applyBtn,
                processing && { opacity: 0.6 },
                pressed && !processing && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleApply}
              disabled={processing}
            >
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={styles.applyBtnGrad}>
                {processing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#FFF" />
                    <Text style={styles.applyBtnText}>Apply & Continue</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  skipText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },

  // Preview
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
    minHeight: 180,
  },
  previewFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  previewImage: { width: '100%', height: '100%' },

  // Grid
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.30)' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.30)' },
  gridCenter: { position: 'absolute', top: '50%', left: '50%', marginTop: -4, marginLeft: -4 },
  gridCenterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(212,175,55,0.60)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.40)' },

  // Corner marks
  cornerMark: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(212,175,55,0.70)' },
  cornerTL: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },

  // Overlay bar
  overlayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    minHeight: 28,
  },
  overlayCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  overlayCountText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },
  aspectLabel: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  aspectLabelText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },
  selectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  selDeleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.15)',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  quickBtn: { alignItems: 'center', gap: 3 },
  quickBtnText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderColor: 'rgba(212,175,55,0.20)',
  },
  tabText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  tabTextActive: { color: '#D4AF37' },

  // Options area
  optionsArea: { minHeight: 100 },

  // Aspect chips
  aspectRow: { paddingHorizontal: 20, gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  aspectChip: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8F8FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    minWidth: 68,
  },
  aspectChipActive: { borderColor: 'rgba(212,175,55,0.40)', backgroundColor: 'rgba(212,175,55,0.06)' },
  aspectIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDEDF0', alignItems: 'center', justifyContent: 'center' },
  aspectIconWrapActive: { backgroundColor: 'rgba(212,175,55,0.12)' },
  aspectChipLabel: { fontSize: 11, fontWeight: '700', color: '#1A1A2E' },
  aspectChipLabelActive: { color: '#D4AF37' },
  aspectChipDesc: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },

  // Filter chips
  filterRow: { paddingHorizontal: 20, gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  filterChip: { alignItems: 'center', gap: 5 },
  filterPreview: {
    width: 58,
    height: 58,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
  },
  filterPreviewImg: { width: '100%', height: '100%' },
  filterCheckWrap: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  filterLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  filterLabelActive: { color: '#D4AF37', fontWeight: '700' },

  // ─── Sticker Tab ───
  stickerArea: { paddingHorizontal: 0 },
  stickerSubTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 10,
  },
  stickerSubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  stickerSubTabActive: {
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderColor: 'rgba(212,175,55,0.18)',
  },
  stickerSubTabText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  stickerSubTabTextActive: { color: '#D4AF37' },

  // Emoji category
  emojiCatRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 8,
  },
  emojiCatPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  emojiCatPillActive: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderColor: 'rgba(212,175,55,0.20)',
  },
  emojiCatText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  emojiCatTextActive: { color: '#D4AF37' },

  // Emoji grid
  emojiGrid: {
    paddingHorizontal: 20,
    gap: 6,
    paddingVertical: 4,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  emojiBtnText: { fontSize: 26 },

  // Text input area
  textInputArea: {
    paddingHorizontal: 20,
    gap: 10,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  stickerTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F4F4F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  locationInputIcon: {
    position: 'absolute',
    left: 10,
    zIndex: 5,
  },
  stickerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Color picker
  colorRow: {
    gap: 8,
    paddingVertical: 4,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotActive: {
    borderWidth: 2.5,
    borderColor: '#D4AF37',
  },

  // Location hint
  locationHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },

  // Bottom CTA
  bottomCTA: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  applyBtn: { borderRadius: 18, overflow: 'hidden' },
  applyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  applyBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
