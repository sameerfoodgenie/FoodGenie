import React, { useState, useRef } from 'react';
import { View, StyleSheet, Platform, Pressable, Animated } from 'react-native';
import { theme } from '../constants/theme';

interface CustomSliderProps {
  style?: any;
  minimumValue: number;
  maximumValue: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

export default function CustomSlider({
  minimumValue,
  maximumValue,
  step,
  value,
  onValueChange,
  minimumTrackTintColor = theme.primary,
  maximumTrackTintColor = theme.border,
  thumbTintColor = theme.primary,
}: CustomSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const thumbScale = useRef(new Animated.Value(1)).current;

  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  const handlePress = (event: any) => {
    if (!sliderWidth) return;

    const { locationX } = event.nativeEvent;
    const newPercentage = Math.max(0, Math.min(100, (locationX / sliderWidth) * 100));
    const rawValue = minimumValue + (newPercentage / 100) * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, steppedValue));
    
    onValueChange(clampedValue);
  };

  const handlePressIn = () => {
    setIsDragging(true);
    Animated.spring(thumbScale, {
      toValue: 1.3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsDragging(false);
    Animated.spring(thumbScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.track}>
        {/* Maximum track (background) */}
        <View
          style={[
            styles.trackBackground,
            { backgroundColor: maximumTrackTintColor },
          ]}
        />
        {/* Minimum track (progress) */}
        <View
          style={[
            styles.trackProgress,
            {
              backgroundColor: minimumTrackTintColor,
              width: `${percentage}%`,
            },
          ]}
        />
        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbTintColor,
              left: `${percentage}%`,
              transform: [
                { translateX: -12 },
                { scale: thumbScale },
              ],
            },
            isDragging && styles.thumbActive,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  track: {
    height: 4,
    position: 'relative',
    borderRadius: 2,
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  trackProgress: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: -10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  thumbActive: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
});
