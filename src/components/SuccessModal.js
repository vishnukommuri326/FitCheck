
import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { styles } from '../styles/SuccessModalStyles.js';

const AnimatedIcon = Animated.createAnimatedComponent(View);

const SuccessModal = ({ visible, onClose, title, message, primaryButton, secondaryButton }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="light" style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <AnimatedIcon style={[styles.iconContainer, animatedIconStyle]}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
          </AnimatedIcon>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {primaryButton && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={primaryButton.onPress}
              >
                <Text style={styles.primaryButtonText}>{primaryButton.text}</Text>
              </TouchableOpacity>
            )}
            {secondaryButton && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryButton.onPress}
              >
                <Text style={styles.secondaryButtonText}>{secondaryButton.text}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default SuccessModal;
