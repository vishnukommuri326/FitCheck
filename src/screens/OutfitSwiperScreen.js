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
import styles from '../styles/OutfitSwiperScreenStyles';

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


