import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAPTURE_BUTTON_SIZE = 80;
const CAPTURE_BUTTON_RING_SIZE = 95;

const CustomCameraScreen = ({ navigation, route }) => {
  const { source } = route.params || {};
  
  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  
  // Camera settings
  const [facing, setFacing] = useState('back');
  const [enableTorch, setEnableTorch] = useState(false);
  
  // UI states
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  
  const cameraRef = useRef(null);
  const scaleAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);
  const flashAnim = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(mediaLibraryStatus.status === 'granted');
    })();
  }, []);

  // Animations
  const captureButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const flipButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateAnim.value}deg` }],
    };
  });

  const flashOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: flashAnim.value,
    };
  });

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // Animate capture button
        scaleAnim.value = withSequence(
          withTiming(0.9, { duration: 100 }),
          withSpring(1, { damping: 15, stiffness: 400 })
        );
        
        // Flash animation
        flashAnim.value = withSequence(
          withTiming(0.7, { duration: 50 }),
          withTiming(0, { duration: 200 })
        );
        
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
          exif: true,
        });
        
        setCapturedPhoto(photo);
        setIsPreviewVisible(true);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const savePhoto = async () => {
    if (capturedPhoto) {
      try {
        // Navigate back with the photo based on source
        if (source === 'AddItem') {
          navigation.navigate('AddItem', { imageUri: capturedPhoto.uri });
        } else if (source === 'BeforeYouBuy') {
          navigation.navigate('BeforeYouBuy', { imageUri: capturedPhoto.uri });
        } else {
          navigation.goBack();
        }
        
        // Optional: Save to media library
        if (mediaLibraryPermission) {
          try {
            await MediaLibrary.saveToLibraryAsync(capturedPhoto.uri);
          } catch (err) {
            console.log('Could not save to library:', err);
          }
        }
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Error saving photo:', error);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setIsPreviewVisible(false);
  };

  const flipCamera = () => {
    rotateAnim.value = withSequence(
      withTiming(180, { duration: 200 }),
      withTiming(360, { duration: 200 })
    );
    setTimeout(() => {
      rotateAnim.value = 0;
    }, 400);
    
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setEnableTorch(!enableTorch);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderGrid = () => {
    if (!showGrid) return null;
    
    return (
      <View style={styles.gridContainer} pointerEvents="none">
        <View style={styles.gridRow}>
          <View style={styles.gridColumn} />
          <View style={[styles.gridColumn, styles.gridColumnCenter]} />
          <View style={styles.gridColumn} />
        </View>
        <View style={[styles.gridRow, styles.gridRowCenter]}>
          <View style={styles.gridColumn} />
          <View style={[styles.gridColumn, styles.gridColumnCenter]} />
          <View style={styles.gridColumn} />
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridColumn} />
          <View style={[styles.gridColumn, styles.gridColumnCenter]} />
          <View style={styles.gridColumn} />
        </View>
      </View>
    );
  };

  // Permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#F97316" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To scan items and add to your wardrobe, we need camera access
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <LinearGradient
              colors={['#F97316', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permissionGradient}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Preview Screen
  if (isPreviewVisible && capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
        
        {/* Flash overlay for animation */}
        <Animated.View style={[styles.flashOverlay, flashOverlayStyle]} pointerEvents="none" />
        
        <View style={styles.previewTopControls}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topButton}>
            <BlurView intensity={80} style={styles.blurButton}>
              <Ionicons name="close" size={28} color="white" />
            </BlurView>
          </TouchableOpacity>
        </View>
        
        <View style={styles.previewBottomControls}>
          <TouchableOpacity onPress={retakePhoto} style={styles.previewButton}>
            <BlurView intensity={80} style={styles.previewButtonBlur}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.previewButtonText}>Retake</Text>
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={savePhoto} style={styles.previewButton}>
            <LinearGradient
              colors={['#F97316', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.previewButtonText}>Use Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera Screen
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={enableTorch}
      >
        {/* Flash overlay for animation */}
        <Animated.View style={[styles.flashOverlay, flashOverlayStyle]} pointerEvents="none" />
        
        {renderGrid()}
        
        {/* Top Controls */}
        <SafeAreaView style={styles.topControlsContainer}>
          <View style={styles.topControls}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topButton}>
              <BlurView intensity={80} style={styles.blurButton}>
                <Ionicons name="close" size={28} color="white" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.topRightControls}>
              <TouchableOpacity onPress={toggleFlash} style={styles.topButton}>
                <BlurView intensity={80} style={styles.blurButton}>
                  <Ionicons
                    name={enableTorch ? 'flash' : 'flash-off'}
                    size={24}
                    color={enableTorch ? '#F97316' : 'white'}
                  />
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={toggleGrid} style={styles.topButton}>
                <BlurView intensity={80} style={styles.blurButton}>
                  <Ionicons
                    name="grid-outline"
                    size={24}
                    color={showGrid ? '#F97316' : 'white'}
                  />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        
        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.sideButton}>
            <View style={styles.placeholder} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={takePicture} activeOpacity={0.8}>
            <View style={styles.captureButtonOuter}>
              <Animated.View style={[styles.captureButton, captureButtonAnimatedStyle]}>
                <View style={styles.captureButtonInner} />
              </Animated.View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={flipCamera} style={styles.sideButton}>
            <Animated.View style={flipButtonAnimatedStyle}>
              <Ionicons name="camera-reverse-outline" size={32} color="white" />
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Tip at the bottom */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            {source === 'BeforeYouBuy' 
              ? 'Center the item in frame for best analysis' 
              : 'Take a clear photo of your clothing item'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  
  // Flash overlay
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  
  // Top controls
  topControlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  topButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  blurButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  captureButtonOuter: {
    width: CAPTURE_BUTTON_RING_SIZE,
    height: CAPTURE_BUTTON_RING_SIZE,
    borderRadius: CAPTURE_BUTTON_RING_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: CAPTURE_BUTTON_SIZE - 8,
    height: CAPTURE_BUTTON_SIZE - 8,
    borderRadius: (CAPTURE_BUTTON_SIZE - 8) / 2,
    backgroundColor: 'white',
  },
  sideButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 32,
    height: 32,
  },
  
  // Grid
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridRowCenter: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridColumn: {
    flex: 1,
  },
  gridColumnCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Preview screen
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewTopControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
  },
  previewBottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewButton: {
    borderRadius: 30,
    overflow: 'hidden',
    minWidth: 140,
  },
  previewButtonBlur: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  
  // Permission screen
  permissionContainer: {
    padding: 40,
    alignItems: 'center',
  },
  permissionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
  },
  permissionGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  
  // Tip container
  tipContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tipText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default CustomCameraScreen;