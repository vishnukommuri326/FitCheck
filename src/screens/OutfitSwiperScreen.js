import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Updated mock data with working image URLs
const mockOutfits = [
  {
    id: 'outfit1',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    tags: ['casual', 'summer', 'trendy'],
    description: 'Perfect summer casual look',
    brand: 'Summer Collection',
  },
  {
    id: 'outfit2',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop',
    tags: ['formal', 'business', 'elegant'],
    description: 'Professional business attire',
    brand: 'Business Elite',
  },
  {
    id: 'outfit3',
    image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=600&fit=crop',
    tags: ['party', 'evening', 'glamour'],
    description: 'Elegant evening wear',
    brand: 'Night Out',
  },
  {
    id: 'outfit4',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop',
    tags: ['sporty', 'active', 'comfort'],
    description: 'Active lifestyle outfit',
    brand: 'SportLife',
  },
  {
    id: 'outfit5',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=600&fit=crop',
    tags: ['street', 'urban', 'modern'],
    description: 'Urban street style',
    brand: 'Street Wear Co',
  },
];

export default function OutfitSwiper({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [dislikeReason, setDislikeReason] = useState('');
  const [pendingDislikeOutfit, setPendingDislikeOutfit] = useState(null);

  // Animation values for the current card
  const pan = useRef(new Animated.ValueXY()).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animation values when index changes
    pan.setValue({ x: 0, y: 0 });
    rotateValue.setValue(0);
  }, [currentIndex]);

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
    Animated.spring(rotateValue, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  const swipeCard = (direction) => {
    const x = direction === 'right' ? screenWidth + 100 : -screenWidth - 100;
    Animated.timing(pan, {
      toValue: { x, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setCurrentIndex(prevIndex => prevIndex + 1);
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        const rotation = gestureState.dx / screenWidth * 30;
        rotateValue.setValue(rotation);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = screenWidth * 0.25;
        
        if (gestureState.dx > threshold) {
          // Swipe right - Like
          handleSwipeRight();
        } else if (gestureState.dx < -threshold) {
          // Swipe left - Dislike
          swipeCard('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const handleSwipeRight = async () => {
    const outfit = mockOutfits[currentIndex];
    try {
      const existingLikes = await AsyncStorage.getItem('likedOutfits');
      const likes = existingLikes ? JSON.parse(existingLikes) : [];
      
      likes.push({
        ...outfit,
        likedAt: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem('likedOutfits', JSON.stringify(likes));
    } catch (error) {
      console.error('Error saving liked outfit:', error);
    }
    
    swipeCard('right');
  };

  const handleSwipeLeft = async () => {
    const outfit = mockOutfits[currentIndex];
    if (dislikeReason.trim() && pendingDislikeOutfit) {
      try {
        const existingDislikes = await AsyncStorage.getItem('dislikedOutfits');
        const dislikes = existingDislikes ? JSON.parse(existingDislikes) : [];
        
        dislikes.push({
          ...outfit,
          dislikedAt: new Date().toISOString(),
          reason: dislikeReason,
        });
        
        await AsyncStorage.setItem('dislikedOutfits', JSON.stringify(dislikes));
      } catch (error) {
        console.error('Error saving dislike reason:', error);
      }
    }
    
    setDislikeReason('');
    setPendingDislikeOutfit(null);
    swipeCard('left');
  };

  const handleDislikeWithReason = () => {
    setPendingDislikeOutfit(mockOutfits[currentIndex]);
    setModalVisible(true);
  };

  const submitDislikeReason = () => {
    setModalVisible(false);
    handleSwipeLeft();
  };

  const skipDislikeReason = () => {
    setModalVisible(false);
    setDislikeReason('');
    setPendingDislikeOutfit(null);
    swipeCard('left');
  };

  const rotate = rotateValue.interpolate({
    inputRange: [-30, 0, 30],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [-screenWidth / 4, 0, screenWidth / 4],
    outputRange: [0, 0, 1],
  });

  const dislikeOpacity = pan.x.interpolate({
    inputRange: [-screenWidth / 4, 0, screenWidth / 4],
    outputRange: [1, 0, 0],
  });

  const scale = pan.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [0.9, 1, 0.9],
  });

  const currentOutfit = mockOutfits[currentIndex];
  const nextOutfit = mockOutfits[currentIndex + 1];

  if (currentIndex >= mockOutfits.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discover Styles</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.noMoreCards}>
          <View style={styles.noMoreIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4F46E5" />
          </View>
          <Text style={styles.noMoreCardsTitle}>All caught up!</Text>
          <Text style={styles.noMoreCardsText}>Check your liked outfits in the wardrobe</Text>
          <TouchableOpacity style={styles.resetButton} onPress={() => setCurrentIndex(0)}>
            <Text style={styles.resetButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover Styles</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={28} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentIndex / mockOutfits.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex} of {mockOutfits.length}
        </Text>
      </View>

      {/* Swipe Deck */}
      <View style={styles.cardContainer}>
        {/* Next card (underneath) */}
        {nextOutfit && (
          <View style={[styles.card, { transform: [{ scale: 0.95 }] }]}>
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: nextOutfit.image }} style={styles.cardImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardBrand}>{nextOutfit.brand}</Text>
                  <Text style={styles.cardDescription}>{nextOutfit.description}</Text>
                </View>
              </View>
              <View style={styles.tagContainer}>
                {nextOutfit.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Current card (on top) */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { rotate: rotate },
                { scale: scale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: currentOutfit.image }} style={styles.cardImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
            />

            {/* Like/Dislike indicators */}
            <Animated.View style={[styles.likeIndicator, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            
            <Animated.View style={[styles.dislikeIndicator, { opacity: dislikeOpacity }]}>
              <Text style={styles.dislikeText}>NOPE</Text>
            </Animated.View>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardBrand}>{currentOutfit.brand}</Text>
                <Text style={styles.cardDescription}>{currentOutfit.description}</Text>
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagContainer}>
              {currentOutfit.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={handleDislikeWithReason}
        >
          <Ionicons name="close" size={32} color="#EF4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={() => {/* Handle super like */}}
        >
          <Ionicons name="star" size={28} color="#3B82F6" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleSwipeRight}
        >
          <Ionicons name="heart" size={32} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Dislike Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={skipDislikeReason}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What didn't you like?</Text>
              <TouchableOpacity onPress={skipDislikeReason} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Your feedback helps us improve recommendations
            </Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Tell us what you didn't like about this outfit..."
              placeholderTextColor="#9CA3AF"
              value={dislikeReason}
              onChangeText={setDislikeReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.skipButton]}
                onPress={skipDislikeReason}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitDislikeReason}
              >
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  card: {
    position: 'absolute',
    width: screenWidth - 40,
    height: screenHeight * 0.68,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardImageContainer: {
    flex: 1,
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  cardContent: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardBrand: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  infoButton: {
    padding: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  likeIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    transform: [{ rotate: '-20deg' }],
  },
  likeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dislikeIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    transform: [{ rotate: '20deg' }],
  },
  dislikeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 60,
    gap: 24,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dislikeButton: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  superLikeButton: {
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  noMoreCards: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noMoreIconContainer: {
    marginBottom: 24,
  },
  noMoreCardsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  noMoreCardsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  resetButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});