import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { useCreator } from '../contexts/CreatorContext';
import { useAlert } from '@/template';

const { width: SCREEN_W } = Dimensions.get('window');

export default function UploadRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ showId?: string }>();
  const { shows, addEpisode, addShow } = useCreator();
  const { showAlert } = useAlert();

  // Video
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Recipe info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Ingredients
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [ingredientInput, setIngredientInput] = useState('');

  // Steps
  const [steps, setSteps] = useState<string[]>(['']);

  // Show selector
  const [selectedShowId, setSelectedShowId] = useState<string | null>(params.showId || null);
  const [showPickerOpen, setShowPickerOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const selectedShow = shows.find(s => s.id === selectedShowId);

  // ─── Video Picker ───
  const pickVideo = useCallback(async () => {
    Haptics.selectionAsync();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your gallery to select a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 600,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      setVideoDuration(result.assets[0].duration || 0);
    }
  }, [showAlert]);

  // ─── Ingredients Management ───
  const addIngredient = useCallback(() => {
    const trimmed = ingredientInput.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients(prev => [...prev.filter(i => i.trim()), trimmed]);
    setIngredientInput('');
  }, [ingredientInput]);

  const removeIngredient = useCallback((index: number) => {
    Haptics.selectionAsync();
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Steps Management ───
  const updateStep = useCallback((index: number, text: string) => {
    setSteps(prev => prev.map((s, i) => (i === index ? text : s)));
  }, []);

  const addStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps(prev => [...prev, '']);
  }, []);

  const removeStep = useCallback((index: number) => {
    Haptics.selectionAsync();
    setSteps(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Publish ───
  const handlePublish = useCallback(() => {
    if (!title.trim()) {
      showAlert('Missing Title', 'Please add a recipe title');
      return;
    }
    const validIngredients = ingredients.filter(i => i.trim());
    if (validIngredients.length === 0) {
      showAlert('Missing Ingredients', 'Please add at least one ingredient');
      return;
    }
    const validSteps = steps.filter(s => s.trim());
    if (validSteps.length === 0) {
      showAlert('Missing Steps', 'Please add at least one step');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsPublishing(true);

    // If no show selected, create a new show
    let targetShowId = selectedShowId;
    if (!targetShowId) {
      targetShowId = addShow({
        title: `${title.trim()} Recipes`,
        description: 'Recipe collection',
        coverUri: null,
      });
    }

    // Build description with recipe data
    const recipeDescription = [
      description.trim(),
      '',
      '🧾 Ingredients:',
      ...validIngredients.map(ing => `• ${ing}`),
      '',
      '📝 Steps:',
      ...validSteps.map((step, i) => `${i + 1}. ${step}`),
    ].filter(line => line !== undefined).join('\n');

    addEpisode(targetShowId, {
      title: title.trim(),
      description: recipeDescription,
      imageUri: videoUri,
      videoUri: videoUri,
      ingredients: validIngredients,
      steps: validSteps,
    });

    setTimeout(() => {
      setIsPublishing(false);
      showAlert('Recipe Published', 'Your recipe has been added to your show.');
      router.back();
    }, 800);
  }, [title, ingredients, steps, description, selectedShowId, videoUri, addEpisode, addShow, showAlert, router]);

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => { Haptics.selectionAsync(); router.back(); }}>
            <MaterialIcons name="close" size={22} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Upload Recipe</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Video Picker ─── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe Video</Text>
            {videoUri ? (
              <View style={styles.videoPreview}>
                <Video
                  source={{ uri: videoUri }}
                  style={styles.videoPlayer}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                  isMuted
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.videoOverlay}
                >
                  <View style={styles.videoDuration}>
                    <MaterialIcons name="videocam" size={14} color="#FFF" />
                    <Text style={styles.videoDurationText}>
                      {videoDuration > 0 ? formatDuration(videoDuration) : 'Video'}
                    </Text>
                  </View>
                </LinearGradient>
                <Pressable
                  style={styles.videoChangeBtn}
                  onPress={pickVideo}
                >
                  <MaterialIcons name="edit" size={16} color="#FFF" />
                </Pressable>
                <Pressable
                  style={styles.videoRemoveBtn}
                  onPress={() => { Haptics.selectionAsync(); setVideoUri(null); }}
                >
                  <MaterialIcons name="close" size={16} color="#FFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.videoPicker, pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}
                onPress={pickVideo}
              >
                <View style={styles.videoPickerIcon}>
                  <MaterialIcons name="video-library" size={36} color={theme.primary} />
                </View>
                <Text style={styles.videoPickerTitle}>Select from Gallery</Text>
                <Text style={styles.videoPickerHint}>MP4, MOV · Up to 10 min</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* ─── Recipe Title ─── */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Creamy Butter Chicken"
              placeholderTextColor={theme.textMuted}
              maxLength={80}
            />
            <Text style={styles.charCount}>{title.length}/80</Text>
          </Animated.View>

          {/* ─── Description ─── */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Description <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the dish..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* ─── Ingredients ─── */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🧾 Ingredients</Text>
              <Text style={styles.sectionCount}>{ingredients.filter(i => i.trim()).length} items</Text>
            </View>

            {/* Existing ingredients */}
            {ingredients.filter(i => i.trim()).map((ing, index) => (
              <Animated.View key={`ing-${index}`} entering={FadeIn.duration(200)} style={styles.listItem}>
                <View style={styles.listBullet}>
                  <Text style={styles.listBulletText}>•</Text>
                </View>
                <Text style={styles.listItemText}>{ing}</Text>
                <Pressable
                  style={styles.listItemRemove}
                  onPress={() => removeIngredient(index)}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={16} color={theme.textMuted} />
                </Pressable>
              </Animated.View>
            ))}

            {/* Add ingredient input */}
            <View style={styles.addItemRow}>
              <TextInput
                style={styles.addItemInput}
                value={ingredientInput}
                onChangeText={setIngredientInput}
                placeholder="e.g. 2 cups basmati rice"
                placeholderTextColor={theme.textMuted}
                returnKeyType="done"
                onSubmitEditing={addIngredient}
              />
              <Pressable
                style={[styles.addItemBtn, !ingredientInput.trim() && { opacity: 0.4 }]}
                onPress={addIngredient}
                disabled={!ingredientInput.trim()}
              >
                <MaterialIcons name="add" size={20} color={theme.textOnPrimary} />
              </Pressable>
            </View>
          </Animated.View>

          {/* ─── Steps ─── */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📝 Steps</Text>
              <Text style={styles.sectionCount}>{steps.filter(s => s.trim()).length} steps</Text>
            </View>

            {steps.map((step, index) => (
              <Animated.View key={`step-${index}`} entering={FadeIn.duration(200)} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.stepInput}
                  value={step}
                  onChangeText={(text) => updateStep(index, text)}
                  placeholder={`Step ${index + 1}...`}
                  placeholderTextColor={theme.textMuted}
                  multiline
                  textAlignVertical="top"
                />
                {steps.length > 1 ? (
                  <Pressable
                    style={styles.stepRemove}
                    onPress={() => removeStep(index)}
                    hitSlop={8}
                  >
                    <MaterialIcons name="close" size={16} color={theme.textMuted} />
                  </Pressable>
                ) : null}
              </Animated.View>
            ))}

            <Pressable
              style={({ pressed }) => [styles.addStepBtn, pressed && { opacity: 0.8 }]}
              onPress={addStep}
            >
              <MaterialIcons name="add-circle-outline" size={20} color={theme.primary} />
              <Text style={styles.addStepText}>Add Step</Text>
            </Pressable>
          </Animated.View>

          {/* ─── Show Selector ─── */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Publish to Show</Text>
            <Pressable
              style={({ pressed }) => [styles.showSelector, pressed && { opacity: 0.9 }]}
              onPress={() => { Haptics.selectionAsync(); setShowPickerOpen(prev => !prev); }}
            >
              {selectedShow ? (
                <View style={styles.showSelectorContent}>
                  <View style={styles.showSelectorIcon}>
                    <MaterialIcons name="movie-creation" size={20} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.showSelectorName}>{selectedShow.title}</Text>
                    <Text style={styles.showSelectorMeta}>{selectedShow.episodes.length} episodes</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
                </View>
              ) : (
                <View style={styles.showSelectorContent}>
                  <View style={[styles.showSelectorIcon, { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
                    <MaterialIcons name="auto-awesome" size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.showSelectorName}>Auto-create new show</Text>
                    <Text style={styles.showSelectorMeta}>A new show will be created for this recipe</Text>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
                </View>
              )}
            </Pressable>

            {/* Show picker dropdown */}
            {showPickerOpen ? (
              <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.showPickerDropdown}>
                <Pressable
                  style={[styles.showPickerItem, !selectedShowId && styles.showPickerItemActive]}
                  onPress={() => { setSelectedShowId(null); setShowPickerOpen(false); Haptics.selectionAsync(); }}
                >
                  <MaterialIcons name="auto-awesome" size={18} color={theme.accent} />
                  <Text style={[styles.showPickerItemText, !selectedShowId && { color: theme.accent }]}>
                    Create new show
                  </Text>
                </Pressable>
                {shows.map(show => (
                  <Pressable
                    key={show.id}
                    style={[styles.showPickerItem, selectedShowId === show.id && styles.showPickerItemActive]}
                    onPress={() => { setSelectedShowId(show.id); setShowPickerOpen(false); Haptics.selectionAsync(); }}
                  >
                    <MaterialIcons name="movie-creation" size={18} color={selectedShowId === show.id ? theme.primary : theme.textMuted} />
                    <Text style={[styles.showPickerItemText, selectedShowId === show.id && { color: theme.primary }]}>
                      {show.title}
                    </Text>
                    <Text style={styles.showPickerItemMeta}>{show.episodes.length} eps</Text>
                  </Pressable>
                ))}
              </Animated.View>
            ) : null}
          </Animated.View>
        </ScrollView>

        {/* ─── Bottom Publish CTA ─── */}
        <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handlePublish}
            disabled={isPublishing}
          >
            <LinearGradient
              colors={isPublishing ? [theme.backgroundTertiary, theme.backgroundTertiary] : [theme.primary, theme.primaryDark]}
              style={styles.publishBtn}
            >
              {isPublishing ? (
                <Text style={[styles.publishBtnText, { color: theme.textMuted }]}>Publishing...</Text>
              ) : (
                <>
                  <MaterialIcons name="publish" size={22} color={theme.textOnPrimary} />
                  <Text style={styles.publishBtnText}>Publish Recipe</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.textPrimary },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCount: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  optional: { fontSize: 13, fontWeight: '500', color: theme.textMuted },

  // Video picker
  videoPicker: {
    height: 180,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoPickerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74,222,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPickerTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  videoPickerHint: { fontSize: 13, fontWeight: '500', color: theme.textMuted },

  // Video preview
  videoPreview: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.backgroundTertiary,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  videoDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  videoDurationText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  videoChangeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 52,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoRemoveBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239,68,68,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Inputs
  input: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  charCount: { fontSize: 12, fontWeight: '500', color: theme.textMuted, alignSelf: 'flex-end' },

  // List items (ingredients)
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBulletText: { fontSize: 16, fontWeight: '800', color: theme.primary },
  listItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  listItemRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add item row
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  addItemBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Steps
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  stepNumberText: { fontSize: 14, fontWeight: '800', color: theme.primary },
  stepInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 48,
  },
  stepRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(74,222,128,0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(74,222,128,0.04)',
  },
  addStepText: { fontSize: 15, fontWeight: '600', color: theme.primary },

  // Show selector
  showSelector: {
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  showSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  showSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(74,222,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showSelectorName: { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  showSelectorMeta: { fontSize: 12, fontWeight: '500', color: theme.textMuted, marginTop: 2 },

  // Show picker dropdown
  showPickerDropdown: {
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  showPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  showPickerItemActive: {
    backgroundColor: 'rgba(74,222,128,0.06)',
  },
  showPickerItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  showPickerItemMeta: { fontSize: 12, fontWeight: '500', color: theme.textMuted },

  // Bottom CTA
  bottomCTA: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  publishBtnText: { fontSize: 17, fontWeight: '800', color: theme.textOnPrimary },
});
