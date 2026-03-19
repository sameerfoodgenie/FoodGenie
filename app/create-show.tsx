import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { useCreator } from '../contexts/CreatorContext';
import { useAlert } from '@/template';

export default function CreateShowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ showId?: string }>();
  const { shows, addShow, addEpisode } = useCreator();
  const { showAlert } = useAlert();

  const existingShow = useMemo(() =>
    params.showId ? shows.find(s => s.id === params.showId) : null,
    [params.showId, shows]
  );

  const isEditing = Boolean(existingShow);

  const [title, setTitle] = useState(existingShow?.title || '');
  const [description, setDescription] = useState(existingShow?.description || '');
  const [coverUri, setCoverUri] = useState<string | null>(existingShow?.coverUri || null);

  // Episode form
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epImageUri, setEpImageUri] = useState<string | null>(null);

  const handlePickCover = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [16, 9],
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setCoverUri(result.assets[0].uri);
      }
    } catch { /* ignore */ }
  }, []);

  const handlePickEpImage = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setEpImageUri(result.assets[0].uri);
      }
    } catch { /* ignore */ }
  }, []);

  const canCreate = title.trim().length > 0;

  const handleCreateShow = useCallback(() => {
    if (!canCreate) {
      showAlert('Missing Title', 'Give your show a name');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const showId = addShow({
      title: title.trim(),
      description: description.trim(),
      coverUri,
    });
    showAlert('Show Created', `"${title.trim()}" is ready for episodes`);
    router.replace({ pathname: '/create-show', params: { showId } });
  }, [canCreate, title, description, coverUri, addShow, router, showAlert]);

  const handleAddEpisode = useCallback(() => {
    if (!epTitle.trim()) {
      showAlert('Missing Title', 'Give the episode a name');
      return;
    }
    if (!existingShow) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEpisode(existingShow.id, {
      title: epTitle.trim(),
      description: epDesc.trim(),
      imageUri: epImageUri,
    });
    setEpTitle('');
    setEpDesc('');
    setEpImageUri(null);
    setShowEpisodeForm(false);
    showAlert('Episode Added', `Added to "${existingShow.title}"`);
  }, [epTitle, epDesc, epImageUri, existingShow, addEpisode, showAlert]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { Haptics.selectionAsync(); router.back(); }}
              >
                <MaterialIcons name="arrow-back" size={22} color={theme.textPrimary} />
              </Pressable>
              <Text style={styles.headerTitle}>{isEditing ? 'Manage Show' : 'Create Show'}</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Cover Image */}
            <Animated.View entering={FadeIn.duration(350)}>
              <Pressable
                style={({ pressed }) => [styles.coverSection, pressed && { opacity: 0.9 }]}
                onPress={handlePickCover}
              >
                {coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" transition={200} />
                ) : (
                  <LinearGradient colors={['#1E1E26', '#2A2A35']} style={styles.coverPlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={36} color={theme.textMuted} />
                    <Text style={styles.coverPlaceholderText}>Add Cover Photo</Text>
                  </LinearGradient>
                )}
              </Pressable>
            </Animated.View>

            {/* Show details */}
            <Animated.View entering={FadeInDown.delay(100).duration(350)}>
              <Text style={styles.sectionLabel}>Show Title *</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="movie-creation" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="My Food Journey"
                  placeholderTextColor={theme.textMuted}
                  maxLength={60}
                  editable={!isEditing}
                />
              </View>

              <Text style={styles.sectionLabel}>Description</Text>
              <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                <MaterialIcons name="notes" size={18} color={theme.textMuted} style={{ marginTop: 2 }} />
                <TextInput
                  style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What is this show about?"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  maxLength={200}
                  editable={!isEditing}
                />
              </View>
            </Animated.View>

            {/* Episodes section (only for existing show) */}
            {isEditing && existingShow ? (
              <Animated.View entering={FadeInUp.delay(200).duration(350)}>
                <View style={styles.episodeHeader}>
                  <Text style={styles.sectionLabel}>Episodes ({existingShow.episodes.length})</Text>
                  <Pressable
                    style={({ pressed }) => [styles.addEpBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => { Haptics.selectionAsync(); setShowEpisodeForm(!showEpisodeForm); }}
                  >
                    <MaterialIcons name={showEpisodeForm ? 'close' : 'add'} size={18} color={theme.primary} />
                    <Text style={styles.addEpText}>{showEpisodeForm ? 'Cancel' : 'Add Episode'}</Text>
                  </Pressable>
                </View>

                {/* Add episode form */}
                {showEpisodeForm ? (
                  <Animated.View entering={FadeInDown.duration(250)} style={styles.epForm}>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="play-circle-outline" size={18} color={theme.textMuted} />
                      <TextInput
                        style={styles.textInput}
                        value={epTitle}
                        onChangeText={setEpTitle}
                        placeholder="Episode title"
                        placeholderTextColor={theme.textMuted}
                        maxLength={60}
                      />
                    </View>
                    <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                      <MaterialIcons name="notes" size={18} color={theme.textMuted} style={{ marginTop: 2 }} />
                      <TextInput
                        style={[styles.textInput, { minHeight: 48, textAlignVertical: 'top' }]}
                        value={epDesc}
                        onChangeText={setEpDesc}
                        placeholder="Episode description (optional)"
                        placeholderTextColor={theme.textMuted}
                        multiline
                        maxLength={150}
                      />
                    </View>

                    <Pressable
                      style={({ pressed }) => [styles.epImagePicker, pressed && { opacity: 0.8 }]}
                      onPress={handlePickEpImage}
                    >
                      {epImageUri ? (
                        <Image source={{ uri: epImageUri }} style={styles.epImagePreview} contentFit="cover" />
                      ) : (
                        <>
                          <MaterialIcons name="image" size={20} color={theme.textMuted} />
                          <Text style={styles.epImageText}>Add Image</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.epSubmitBtn,
                        !epTitle.trim() && { opacity: 0.5 },
                        pressed && epTitle.trim() ? { opacity: 0.8 } : {},
                      ]}
                      onPress={handleAddEpisode}
                      disabled={!epTitle.trim()}
                    >
                      <Text style={styles.epSubmitText}>Add Episode</Text>
                    </Pressable>
                  </Animated.View>
                ) : null}

                {/* Episode list */}
                {existingShow.episodes.length > 0 ? (
                  <View style={styles.epList}>
                    {existingShow.episodes.map((ep, idx) => (
                      <View key={ep.id} style={styles.epCard}>
                        <View style={styles.epNumber}>
                          <Text style={styles.epNumberText}>{idx + 1}</Text>
                        </View>
                        {ep.imageUri ? (
                          <Image source={{ uri: ep.imageUri }} style={styles.epThumb} contentFit="cover" transition={150} />
                        ) : (
                          <View style={[styles.epThumb, styles.epThumbPlaceholder]}>
                            <MaterialIcons name="play-circle-outline" size={20} color={theme.textMuted} />
                          </View>
                        )}
                        <View style={styles.epInfo}>
                          <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                          {ep.description ? (
                            <Text style={styles.epDesc} numberOfLines={1}>{ep.description}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : !showEpisodeForm ? (
                  <View style={styles.noEpisodes}>
                    <MaterialIcons name="playlist-add" size={32} color={theme.textMuted} />
                    <Text style={styles.noEpText}>No episodes yet. Add your first one!</Text>
                  </View>
                ) : null}
              </Animated.View>
            ) : null}
          </ScrollView>

          {/* Bottom CTA (only for new show) */}
          {!isEditing ? (
            <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.createBtn,
                  !canCreate && { opacity: 0.5 },
                  pressed && canCreate && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleCreateShow}
                disabled={!canCreate}
              >
                <LinearGradient
                  colors={canCreate ? ['#4ADE80', '#22C55E'] : [theme.backgroundTertiary, theme.backgroundTertiary]}
                  style={styles.createBtnGradient}
                >
                  <MaterialIcons name="movie-creation" size={22} color={canCreate ? theme.textOnPrimary : theme.textMuted} />
                  <Text style={[styles.createBtnText, !canCreate && { color: theme.textMuted }]}>Create Show</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  coverSection: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 20,
  },
  coverPlaceholderText: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textInput: { flex: 1, fontSize: 16, color: theme.textPrimary, padding: 0 },

  episodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
    marginTop: 24,
  },
  addEpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  addEpText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  epForm: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.backgroundTertiary,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  epImagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  epImagePreview: { width: '100%', height: '100%' },
  epImageText: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
  epSubmitBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  epSubmitText: { fontSize: 15, fontWeight: '700', color: theme.textOnPrimary },

  epList: { paddingHorizontal: 20, marginTop: 12, gap: 8 },
  epCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  epNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epNumberText: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
  epThumb: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
  epThumbPlaceholder: {
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epInfo: { flex: 1, gap: 2 },
  epTitle: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  epDesc: { fontSize: 12, color: theme.textMuted },

  noEpisodes: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    marginHorizontal: 20,
  },
  noEpText: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },

  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  createBtn: { borderRadius: 16, overflow: 'hidden' },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  createBtnText: { fontSize: 17, fontWeight: '700', color: theme.textOnPrimary },
});
