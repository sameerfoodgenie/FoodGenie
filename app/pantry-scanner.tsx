import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '@/template';
import { useAlert } from '@/template';
import { recognizeProductFromImage, calculateExpiryDays, ScannedProduct } from '../services/pantryScanService';
import { addPantryItem } from '../services/pantryService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

type ScanMode = 'barcode' | 'photo';

export default function PantryScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [scanning, setScanning] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [barcodeScanned, setBarcodeScanned] = useState(false);

  // Editable fields from recognition
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editExpiryDays, setEditExpiryDays] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnits, setEditUnits] = useState('1');
  const [showManualAdd, setShowManualAdd] = useState(false);

  useEffect(() => {
    if (!IS_WEB && !permission?.granted) {
      requestPermission();
    }
  }, []);

  // Handle barcode scan
  const handleBarcodeScanned = useCallback(({ type, data }: { type: string; data: string }) => {
    if (barcodeScanned) return;
    setBarcodeScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // After barcode is detected, capture photo for AI recognition
    captureAndRecognize('barcode');
  }, [barcodeScanned]);

  // Capture photo and send for recognition
  const captureAndRecognize = useCallback(async (type: ScanMode) => {
    setRecognizing(true);

    try {
      let base64: string | null = null;

      // Try camera capture (wrapped in its own try-catch to handle unmount gracefully)
      if (cameraRef.current && !IS_WEB) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
          if (photo?.base64) {
            base64 = photo.base64;
          }
        } catch (cameraErr: any) {
          // Camera might be unmounted or busy - fall through to gallery picker
          console.log('Camera capture failed, falling back to gallery:', cameraErr?.message);
        }
      }

      if (!base64) {
        // Fallback: pick from gallery
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets[0]?.base64) {
          base64 = result.assets[0].base64;
        } else if (!result.canceled && result.assets[0]?.uri) {
          // Read file as base64
          const fileBase64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          base64 = fileBase64;
        }
      }

      if (!base64) {
        showAlert('Capture Failed', 'Could not capture image. Please use gallery to upload a product photo.');
        setRecognizing(false);
        setBarcodeScanned(false);
        return;
      }

      const { data, error } = await recognizeProductFromImage(base64, type);

      if (error) {
        showAlert('Recognition Failed', error);
        setRecognizing(false);
        setBarcodeScanned(false);
        return;
      }

      if (data) {
        setScannedProduct(data);
        setEditName(data.product_name || '');
        setEditQty(data.quantity || '');
        setEditMrp(data.mrp ? String(data.mrp) : '');
        setEditCategory(data.category || 'Others');

        // Calculate expiry days
        const expiryDays = calculateExpiryDays(data.expiry_date);
        setEditExpiryDays(expiryDays !== null ? String(expiryDays) : '');

        setShowResultModal(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to recognize product');
    }

    setRecognizing(false);
  }, [showAlert]);

  // Pick image from gallery
  const handlePickImage = useCallback(async () => {
    Haptics.selectionAsync();
    setRecognizing(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) {
        setRecognizing(false);
        return;
      }

      let base64 = result.assets[0]?.base64;
      if (!base64 && result.assets[0]?.uri) {
        base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (!base64) {
        showAlert('Error', 'Could not read image');
        setRecognizing(false);
        return;
      }

      const { data, error } = await recognizeProductFromImage(base64, 'photo');

      if (error) {
        showAlert('Recognition Failed', error);
        setRecognizing(false);
        return;
      }

      if (data) {
        setScannedProduct(data);
        setEditName(data.product_name || '');
        setEditQty(data.quantity || '');
        setEditMrp(data.mrp ? String(data.mrp) : '');
        setEditCategory(data.category || 'Others');

        const expiryDays = calculateExpiryDays(data.expiry_date);
        setEditExpiryDays(expiryDays !== null ? String(expiryDays) : '');

        setShowResultModal(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to process image');
    }

    setRecognizing(false);
  }, [showAlert]);

  // Save to pantry
  const handleSaveToPantry = useCallback(async () => {
    if (!user?.id || !editName.trim() || !editQty.trim()) {
      showAlert('Missing Info', 'Please ensure product name and quantity are filled');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const expiresAt = editExpiryDays
      ? new Date(Date.now() + parseInt(editExpiryDays) * 86400000).toISOString()
      : undefined;

    const units = Math.max(1, parseInt(editUnits) || 1);
    const perUnitValue = parseFloat(editMrp) || 0;

    // Add multiple units as separate or combined entry
    const totalQty = units > 1 ? `${editQty.trim()} x${units}` : editQty.trim();
    const totalValue = perUnitValue * units;

    const { success, error } = await addPantryItem(user.id, {
      ingredient_name: editName.trim(),
      remaining_quantity: totalQty,
      remaining_value: totalValue,
      expires_at: expiresAt,
    });

    setSaving(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowResultModal(false);
      setShowManualAdd(false);
      setScannedProduct(null);
      setBarcodeScanned(false);
      showAlert('Added to Pantry', `${editName}${units > 1 ? ` (x${units})` : ''} has been added to your pantry tracker`);
    } else {
      showAlert('Error', error || 'Failed to save item');
    }
  }, [user?.id, editName, editQty, editMrp, editExpiryDays, editUnits, showAlert]);

  // Reset scan
  const handleRescan = useCallback(() => {
    setShowResultModal(false);
    setShowManualAdd(false);
    setScannedProduct(null);
    setBarcodeScanned(false);
    setEditName('');
    setEditQty('');
    setEditMrp('');
    setEditExpiryDays('');
    setEditCategory('');
    setEditUnits('1');
  }, []);

  // Open manual add form
  const handleManualAdd = useCallback(() => {
    Haptics.selectionAsync();
    setEditName('');
    setEditQty('');
    setEditMrp('');
    setEditExpiryDays('');
    setEditCategory('Others');
    setEditUnits('1');
    setScannedProduct(null);
    setShowManualAdd(true);
    setShowResultModal(true);
  }, []);

  // Camera capture button
  const handleCapturePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    captureAndRecognize('photo');
  }, [captureAndRecognize]);

  // Web fallback
  if (IS_WEB) {
    return (
      <View style={[st.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={st.webHeader}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [st.backBtn, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={[st.webTitle, { color: colors.textPrimary }]}>Pantry Scanner</Text>
          </View>
          <View style={st.webContent}>
            <Text style={{ fontSize: 56 }}>📷</Text>
            <Text style={[st.webText, { color: colors.textPrimary }]}>Camera scanning works on mobile devices</Text>
            <Text style={[st.webSub, { color: colors.textMuted }]}>Use the gallery option to upload a product photo</Text>
            <Pressable style={({ pressed }) => [st.webBtn, pressed && { opacity: 0.85 }]} onPress={handlePickImage}>
              {recognizing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="photo-library" size={18} color="#FFF" />
                  <Text style={st.webBtnText}>Upload Product Photo</Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Permission not granted
  if (!permission?.granted) {
    return (
      <View style={[st.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <MaterialIcons name="no-photography" size={48} color={colors.textMuted} />
          <Text style={[st.webText, { color: colors.textPrimary }]}>Camera Permission Required</Text>
          <Pressable style={({ pressed }) => [st.webBtn, pressed && { opacity: 0.85 }]} onPress={requestPermission}>
            <Text style={st.webBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ marginTop: 8 }}>
            <Text style={{ color: '#7B2FA0', fontWeight: '700' }}>Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[st.container, { backgroundColor: '#000' }]}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={scanMode === 'barcode' ? {
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        } : undefined}
        onBarcodeScanned={scanMode === 'barcode' && !barcodeScanned ? handleBarcodeScanned : undefined}
      />

      {/* Overlay */}
      <SafeAreaView edges={['top', 'bottom']} style={st.overlay}>
        {/* Top Bar */}
        <View style={st.topBar}>
          <Pressable style={({ pressed }) => [st.topBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={st.topTitle}>
            {scanMode === 'barcode' ? 'Scan Barcode' : 'Capture Label'}
          </Text>
          <Pressable style={({ pressed }) => [st.topBtn, pressed && { opacity: 0.7 }]} onPress={handlePickImage}>
            <MaterialIcons name="photo-library" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* Scan Frame */}
        <View style={st.scanFrame}>
          {scanMode === 'barcode' ? (
            <View style={st.barcodeFrame}>
              <View style={[st.corner, st.cornerTL]} />
              <View style={[st.corner, st.cornerTR]} />
              <View style={[st.corner, st.cornerBL]} />
              <View style={[st.corner, st.cornerBR]} />
              <Animated.View entering={FadeIn.duration(400)} style={st.scanLine} />
            </View>
          ) : (
            <View style={st.photoFrame}>
              <View style={[st.corner, st.cornerTL]} />
              <View style={[st.corner, st.cornerTR]} />
              <View style={[st.corner, st.cornerBL]} />
              <View style={[st.corner, st.cornerBR]} />
              <Text style={st.photoHint}>Position product label inside frame</Text>
            </View>
          )}
        </View>

        {/* Recognizing Overlay */}
        {recognizing ? (
          <View style={st.recognizingOverlay}>
            <View style={st.recognizingCard}>
              <ActivityIndicator size="large" color="#7B2FA0" />
              <Text style={st.recognizingText}>Analyzing product...</Text>
              <Text style={st.recognizingSub}>AI is reading the label</Text>
            </View>
          </View>
        ) : null}

        {/* Bottom Controls */}
        <View style={st.bottomSection}>
          {/* Mode Switcher */}
          <View style={st.modeSwitcher}>
            <Pressable
              style={[st.modeBtn, scanMode === 'barcode' && st.modeBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setScanMode('barcode'); setBarcodeScanned(false); }}
            >
              <MaterialIcons name="qr-code-scanner" size={18} color={scanMode === 'barcode' ? '#FFF' : 'rgba(255,255,255,0.6)'} />
              <Text style={[st.modeBtnText, scanMode === 'barcode' && st.modeBtnTextActive]}>Barcode</Text>
            </Pressable>
            <Pressable
              style={[st.modeBtn, scanMode === 'photo' && st.modeBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setScanMode('photo'); setBarcodeScanned(false); }}
            >
              <MaterialIcons name="camera-alt" size={18} color={scanMode === 'photo' ? '#FFF' : 'rgba(255,255,255,0.6)'} />
              <Text style={[st.modeBtnText, scanMode === 'photo' && st.modeBtnTextActive]}>Photo</Text>
            </Pressable>
            <Pressable
              style={[st.modeBtn]}
              onPress={handleManualAdd}
            >
              <MaterialIcons name="edit" size={18} color={'rgba(255,255,255,0.6)'} />
              <Text style={[st.modeBtnText]}>Manual</Text>
            </Pressable>
          </View>

          {/* Capture Button (Photo mode) */}
          {scanMode === 'photo' ? (
            <Pressable
              style={({ pressed }) => [st.captureBtn, pressed && { transform: [{ scale: 0.92 }] }]}
              onPress={handleCapturePhoto}
              disabled={recognizing}
            >
              <View style={st.captureBtnInner} />
            </Pressable>
          ) : (
            <View style={st.barcodeHint}>
              <MaterialIcons name="info-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={st.barcodeHintText}>Point camera at barcode to scan</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ═══ Result Modal ═══ */}
      <Modal visible={showResultModal} transparent animationType="slide" onRequestClose={() => setShowResultModal(false)}>
        <View style={st.modalOverlay}>
          <View style={[st.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.7 }}>
              {/* Header */}
              <View style={st.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[st.modalTitle, { color: colors.textPrimary }]}>{showManualAdd ? 'Add Item Manually ✏️' : 'Product Detected ✅'}</Text>
                  <Text style={[st.modalSub, { color: colors.textMuted }]}>{showManualAdd ? 'Enter product details to add to pantry' : 'Review and edit details before saving'}</Text>
                </View>
                <Pressable onPress={() => { setShowResultModal(false); setShowManualAdd(false); }}>
                  <MaterialIcons name="close" size={22} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Detected Info Banner */}
              {scannedProduct?.brand ? (
                <View style={[st.detectedBanner, { backgroundColor: isDark ? 'rgba(123,47,160,0.08)' : 'rgba(123,47,160,0.03)', borderColor: 'rgba(123,47,160,0.15)' }]}>
                  <MaterialIcons name="verified" size={16} color="#7B2FA0" />
                  <Text style={[st.detectedText, { color: colors.textPrimary }]}>
                    {scannedProduct.brand} - {scannedProduct.category}
                  </Text>
                </View>
              ) : null}

              {/* Editable Fields */}
              <View style={st.formGroup}>
                <Text style={[st.formLabel, { color: colors.textSecondary }]}>Product Name *</Text>
                <TextInput
                  style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Product name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={st.formRow}>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.textSecondary }]}>Pack Size *</Text>
                  <TextInput
                    style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                    value={editQty}
                    onChangeText={setEditQty}
                    placeholder="e.g., 500g"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[st.formGroup, { flex: 0.7 }]}>
                  <Text style={[st.formLabel, { color: colors.textSecondary }]}>No. of Units</Text>
                  <View style={st.unitsStepper}>
                    <Pressable
                      style={[st.stepperBtn, { backgroundColor: isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.06)', borderColor: 'rgba(123,47,160,0.20)' }]}
                      onPress={() => { const n = Math.max(1, (parseInt(editUnits) || 1) - 1); setEditUnits(String(n)); Haptics.selectionAsync(); }}
                    >
                      <MaterialIcons name="remove" size={16} color="#7B2FA0" />
                    </Pressable>
                    <TextInput
                      style={[st.unitsInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                      value={editUnits}
                      onChangeText={(t) => { const n = t.replace(/[^0-9]/g, ''); setEditUnits(n || '1'); }}
                      keyboardType="numeric"
                      textAlign="center"
                    />
                    <Pressable
                      style={[st.stepperBtn, { backgroundColor: isDark ? 'rgba(123,47,160,0.12)' : 'rgba(123,47,160,0.06)', borderColor: 'rgba(123,47,160,0.20)' }]}
                      onPress={() => { const n = (parseInt(editUnits) || 1) + 1; setEditUnits(String(n)); Haptics.selectionAsync(); }}
                    >
                      <MaterialIcons name="add" size={16} color="#7B2FA0" />
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={st.formRow}>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.textSecondary }]}>MRP per unit (₹)</Text>
                  <TextInput
                    style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                    value={editMrp}
                    onChangeText={setEditMrp}
                    placeholder="Price"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.textSecondary }]}>Total Value</Text>
                  <View style={[st.totalValueBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(74,222,128,0.04)' : 'rgba(74,222,128,0.02)' }]}>
                    <Text style={[st.totalValueText, { color: '#4ADE80' }]}>₹{((parseFloat(editMrp) || 0) * (parseInt(editUnits) || 1)).toFixed(0)}</Text>
                  </View>
                </View>
              </View>

              <View style={st.formRow}>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.textSecondary }]}>Expires in (days)</Text>
                  <TextInput
                    style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                    value={editExpiryDays}
                    onChangeText={setEditExpiryDays}
                    placeholder="Days"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[st.formGroup, { flex: 1 }]}>
                  <Text style={[st.formLabel, { color: colors.textSecondary }]}>Category</Text>
                  <TextInput
                    style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                    value={editCategory}
                    onChangeText={setEditCategory}
                    placeholder="Category"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Extra Info */}
              {scannedProduct?.batch_number || scannedProduct?.mfg_date || scannedProduct?.expiry_date ? (
                <View style={[st.extraInfo, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor: colors.border }]}>
                  <Text style={[st.extraInfoTitle, { color: colors.textSecondary }]}>Detected Details</Text>
                  {scannedProduct.batch_number ? (
                    <View style={st.extraRow}>
                      <Text style={[st.extraLabel, { color: colors.textMuted }]}>Batch:</Text>
                      <Text style={[st.extraValue, { color: colors.textPrimary }]}>{scannedProduct.batch_number}</Text>
                    </View>
                  ) : null}
                  {scannedProduct.mfg_date ? (
                    <View style={st.extraRow}>
                      <Text style={[st.extraLabel, { color: colors.textMuted }]}>Mfg Date:</Text>
                      <Text style={[st.extraValue, { color: colors.textPrimary }]}>{scannedProduct.mfg_date}</Text>
                    </View>
                  ) : null}
                  {scannedProduct.expiry_date ? (
                    <View style={st.extraRow}>
                      <Text style={[st.extraLabel, { color: colors.textMuted }]}>Expiry:</Text>
                      <Text style={[st.extraValue, { color: colors.textPrimary }]}>{scannedProduct.expiry_date}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            {/* Action Buttons */}
            <View style={st.modalActions}>
              <Pressable style={({ pressed }) => [st.rescanBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]} onPress={handleRescan}>
                <MaterialIcons name="replay" size={16} color="#7B2FA0" />
                <Text style={[st.rescanBtnText, { color: '#7B2FA0' }]}>Rescan</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [st.saveBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={handleSaveToPantry}
                disabled={saving || !editName.trim() || !editQty.trim()}
              >
                <LinearGradient
                  colors={editName.trim() && editQty.trim() ? ['#7B2FA0', '#1E1456'] : ['#9A9AB0', '#9A9AB0']}
                  style={st.saveBtnGrad}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <MaterialIcons name="add-circle" size={16} color="#FFF" />
                      <Text style={st.saveBtnText}>Add to Pantry</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },

  // Top
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  topBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  // Scan Frame
  scanFrame: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  barcodeFrame: { width: SCREEN_W * 0.75, height: 180, position: 'relative' },
  photoFrame: { width: SCREEN_W * 0.8, height: SCREEN_W * 0.8, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#F5B731' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: { position: 'absolute', top: '50%', left: 8, right: 8, height: 2, backgroundColor: '#F5B731', borderRadius: 1, opacity: 0.7 },
  photoHint: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 12 },

  // Recognizing
  recognizingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  recognizingCard: { backgroundColor: 'rgba(30,20,86,0.95)', padding: 32, borderRadius: 20, alignItems: 'center', gap: 12 },
  recognizingText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  recognizingSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },

  // Bottom
  bottomSection: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 16 },
  modeSwitcher: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: 4, gap: 4 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 11 },
  modeBtnActive: { backgroundColor: 'rgba(123,47,160,0.7)' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  modeBtnTextActive: { color: '#FFF' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', padding: 4 },
  captureBtnInner: { flex: 1, borderRadius: 32, backgroundColor: '#FFF' },
  barcodeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  barcodeHintText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  // Web
  webHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  webTitle: { fontSize: 18, fontWeight: '800' },
  webContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  webText: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  webSub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  webBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7B2FA0', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  webBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // Detected Banner
  detectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  detectedText: { fontSize: 13, fontWeight: '700', flex: 1 },

  // Form
  formGroup: { marginBottom: 12 },
  formLabel: { fontSize: 11, fontWeight: '700', marginBottom: 5 },
  formRow: { flexDirection: 'row', gap: 10 },
  input: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, fontWeight: '600' },

  // Extra Info
  extraInfo: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 6, marginTop: 4, marginBottom: 12 },
  extraInfoTitle: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  extraRow: { flexDirection: 'row', gap: 8 },
  extraLabel: { fontSize: 11, fontWeight: '600', width: 70 },
  extraValue: { fontSize: 11, fontWeight: '700', flex: 1 },

  // Actions
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  rescanBtnText: { fontSize: 13, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Units Stepper
  unitsStepper: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42 },
  stepperBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  unitsInput: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, fontSize: 16, fontWeight: '800' },
  totalValueBox: { height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  totalValueText: { fontSize: 16, fontWeight: '900' },
});
