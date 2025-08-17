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
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
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
  
  // Camera permissions using the new hook
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

  useEffect(() => {
    (async () => {
      const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(mediaLibraryStatus.status === 'granted');
    })();
  }, []);

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

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // Animate capture button
        scaleAnim.value = withSequence(
          withTiming(0.9, { duration: 100 }),
          withSpring(1, { damping: 15, stiffness: 400 })
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
        // Navigate back with the photo
        if (source === 'AddItem') {
          navigation.navigate('AddItem', { imageUri: capturedPhoto.uri });
        } else if (source === 'BeforeYouBuy') {
          navigation.navigate('BeforeYouBuy', { imageUri: capturedPhoto.uri });
        } else {
          navigation.goBack();
        }
        
        // Optional: Save to media library
        if (mediaLibraryPermission) {
          await MediaLibrary.saveToLibraryAsync(capturedPhoto.uri);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
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
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.permissionButton, { marginTop: 10 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview Screen
  if (isPreviewVisible && capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
        
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
        {renderGrid()}
        
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
                  color="white"
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
        
        {/* Optional: Add a tip at the bottom */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            {source === 'BeforeYouBuy' 
              ? 'Center the item in frame' 
              : 'Take a clear photo of your clothing'}
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
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  previewButtonBlur: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
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
  },
});

export default CustomCameraScreen;