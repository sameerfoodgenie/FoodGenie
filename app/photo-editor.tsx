import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type AspectOption = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  ratio: number | null; // null = original
  desc: string;
};

const ASPECT_OPTIONS: AspectOption[] = [
  { id: 'feed', label: 'Feed', icon: 'crop-portrait', ratio: 4 / 5, desc: '4:5' },
  { id: 'square', label: 'Square', icon: 'crop-square', ratio: 1, desc: '1:1' },
  { id: 'story', label: 'Story', icon: 'stay-current-portrait', ratio: 9 / 16, desc: '9:16' },
  { id: 'wide', label: 'Wide', icon: 'crop-landscape', ratio: 16 / 9, desc: '16:9' },
  { id: 'original', label: 'Original', icon: 'crop-free', ratio: null, desc: 'Free' },
];

type FilterOption = {
  id: string;
  label: string;
  overlay: string | null; // rgba overlay color
  brightness: number; // 0 = normal, positive = brighter, negative = darker
};

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'none', label: 'Original', overlay: null, brightness: 0 },
  { id: 'warm', label: 'Warm', overlay: 'rgba(255,160,60,0.12)', brightness: 0.03 },
  { id: 'cool', label: 'Cool', overlay: 'rgba(80,140,220,0.10)', brightness: 0 },
  { id: 'vivid', label: 'Vivid', overlay: 'rgba(255,215,0,0.08)', brightness: 0.05 },
  { id: 'moody', label: 'Moody', overlay: 'rgba(30,20,60,0.18)', brightness: -0.05 },
  { id: 'fade', label: 'Fade', overlay: 'rgba(230,225,215,0.22)', brightness: 0.08 },
  { id: 'noir', label: 'B&W', overlay: null, brightness: 0 },
];

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

export default function PhotoEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const imageUri = params.imageUri || '';

  const [selectedAspect, setSelectedAspect] = useState<string>('feed');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipped, setFlipped] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'crop' | 'filter' | 'adjust'>('crop');

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
  const maxPreviewH = SCREEN_H * 0.50;

  const previewDims = useCallback(() => {
    const ratio = currentAspect?.ratio;
    if (!ratio) {
      // Original - fit image
      if (imageDims) {
        const imgRatio = imageDims.w / imageDims.h;
        if (imgRatio > maxPreviewW / maxPreviewH) {
          return { width: maxPreviewW, height: maxPreviewW / imgRatio };
        }
        return { height: maxPreviewH, width: maxPreviewH * imgRatio };
      }
      return { width: maxPreviewW, height: maxPreviewW * 1.25 };
    }

    // Fixed aspect ratio
    const targetW = maxPreviewW;
    const targetH = targetW / ratio;

    if (targetH > maxPreviewH) {
      return { width: maxPreviewH * ratio, height: maxPreviewH };
    }
    return { width: targetW, height: targetH };
  }, [currentAspect, imageDims, maxPreviewW, maxPreviewH]);

  const dims = previewDims();

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

    try {
      const actions: ImageManipulator.Action[] = [];

      // Rotation
      if (rotation > 0) {
        actions.push({ rotate: rotation });
      }

      // Flip
      if (flipped) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      // Crop based on aspect ratio
      if (currentAspect?.ratio && imageDims) {
        let effW = imageDims.w;
        let effH = imageDims.h;
        // After rotation, dimensions swap
        if (rotation === 90 || rotation === 270) {
          effW = imageDims.h;
          effH = imageDims.w;
        }
        const crop = calculateCrop(effW, effH, currentAspect.ratio);
        actions.push({ crop });
      }

      // Resize to reasonable max for feed
      actions.push({ resize: { width: 1080 } });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
      );

      router.replace({ pathname: '/create-post', params: { imageUri: result.uri } });
    } catch (e: any) {
      console.log('Photo editor error:', e);
      // Fallback: send original
      router.replace({ pathname: '/create-post', params: { imageUri } });
    } finally {
      setProcessing(false);
    }
  }, [imageUri, processing, rotation, flipped, currentAspect, imageDims, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    router.replace({ pathname: '/create-post', params: { imageUri } });
  }, [imageUri, router]);

  if (!imageUri) {
    router.back();
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
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
          <View
            style={[
              styles.previewFrame,
              {
                width: dims.width,
                height: dims.height,
              },
            ]}
          >
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
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: currentFilter.overlay },
                ]}
                pointerEvents="none"
              />
            ) : null}

            {/* B&W filter - desaturation via overlay */}
            {selectedFilter === 'noir' ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'rgba(128,128,128,0.45)',
                    // mix-blend-mode not available in RN, use semi-transparent gray
                  },
                ]}
                pointerEvents="none"
              />
            ) : null}

            {/* Brightness overlay */}
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

            {/* Grid overlay */}
            {showGrid ? (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {/* Vertical lines */}
                <View style={[styles.gridLineV, { left: '33.33%' }]} />
                <View style={[styles.gridLineV, { left: '66.66%' }]} />
                {/* Horizontal lines */}
                <View style={[styles.gridLineH, { top: '33.33%' }]} />
                <View style={[styles.gridLineH, { top: '66.66%' }]} />
                {/* Center crosshair */}
                <View style={styles.gridCenter}>
                  <View style={styles.gridCenterDot} />
                </View>
              </View>
            ) : null}

            {/* Corner marks */}
            <View style={[styles.cornerMark, styles.cornerTL]} />
            <View style={[styles.cornerMark, styles.cornerTR]} />
            <View style={[styles.cornerMark, styles.cornerBL]} />
            <View style={[styles.cornerMark, styles.cornerBR]} />
          </View>

          {/* Aspect ratio label */}
          <View style={styles.aspectLabel}>
            <Text style={styles.aspectLabelText}>
              {currentAspect?.desc || 'Free'} {currentAspect?.label === 'Feed' ? '· Best for Feed' : ''}
            </Text>
          </View>
        </Animated.View>

        {/* Quick Actions Row */}
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
            onPress={handleRotate}
          >
            <MaterialIcons name="rotate-right" size={22} color={theme.textPrimary} />
            <Text style={styles.quickBtnText}>Rotate</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
            onPress={handleFlip}
          >
            <MaterialIcons name="flip" size={22} color={flipped ? '#D4AF37' : theme.textPrimary} />
            <Text style={[styles.quickBtnText, flipped && { color: '#D4AF37' }]}>Flip</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { Haptics.selectionAsync(); setShowGrid(g => !g); }}
          >
            <MaterialIcons name="grid-on" size={22} color={showGrid ? '#D4AF37' : theme.textPrimary} />
            <Text style={[styles.quickBtnText, showGrid && { color: '#D4AF37' }]}>Grid</Text>
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {(['crop', 'filter'] as const).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <MaterialIcons
                name={tab === 'crop' ? 'crop' : 'auto-fix-high'}
                size={18}
                color={activeTab === tab ? '#D4AF37' : theme.textMuted}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'crop' ? 'Frame' : 'Filters'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Crop / Filter Options */}
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
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedAspect(opt.id);
                    }}
                  >
                    <View style={[styles.aspectIconWrap, isActive && styles.aspectIconWrapActive]}>
                      <MaterialIcons
                        name={opt.icon}
                        size={22}
                        color={isActive ? '#D4AF37' : theme.textMuted}
                      />
                    </View>
                    <Text style={[styles.aspectChipLabel, isActive && styles.aspectChipLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.aspectChipDesc, isActive && { color: '#D4AF37' }]}>
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
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
                    style={({ pressed }) => [
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedFilter(flt.id);
                    }}
                  >
                    <View style={styles.filterPreview}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.filterPreviewImg}
                        contentFit="cover"
                      />
                      {flt.overlay ? (
                        <View
                          style={[StyleSheet.absoluteFillObject, { backgroundColor: flt.overlay, borderRadius: 12 }]}
                        />
                      ) : null}
                      {flt.id === 'noir' ? (
                        <View
                          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(128,128,128,0.45)', borderRadius: 12 }]}
                        />
                      ) : null}
                      {isActive ? (
                        <View style={styles.filterCheckWrap}>
                          <MaterialIcons name="check" size={14} color="#FFF" />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                      {flt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {/* Bottom CTA */}
        <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
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
    paddingVertical: 10,
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
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  skipText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },

  // Preview
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flex: 1,
    minHeight: 200,
  },
  previewFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },

  // Grid lines
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  gridCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  gridCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212,175,55,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
  },

  // Corner marks
  cornerMark: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(212,175,55,0.70)',
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },

  // Aspect label
  aspectLabel: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  aspectLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  quickBtn: {
    alignItems: 'center',
    gap: 4,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F4F4F8',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderColor: 'rgba(212,175,55,0.20)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#D4AF37',
  },

  // Options area
  optionsArea: {
    minHeight: 110,
  },

  // Aspect ratio chips
  aspectRow: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  aspectChip: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F8F8FA',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    minWidth: 72,
  },
  aspectChipActive: {
    borderColor: 'rgba(212,175,55,0.40)',
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  aspectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDEDF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectIconWrapActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  aspectChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  aspectChipLabelActive: {
    color: '#D4AF37',
  },
  aspectChipDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Filter chips
  filterRow: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  filterChip: {
    alignItems: 'center',
    gap: 6,
  },
  filterChipActive: {},
  filterPreview: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
  },
  filterPreviewImg: {
    width: '100%',
    height: '100%',
  },
  filterCheckWrap: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterLabelActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },

  // Bottom CTA
  bottomCTA: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  applyBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  applyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 18,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
