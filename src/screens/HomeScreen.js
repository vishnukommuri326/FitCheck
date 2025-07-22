import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/HomeScreenStyles';
import { useAuth } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('profileImage');
        if (savedImage) {
          setProfileImage(savedImage);
        }
      } catch (error) {
        console.error('Failed to load profile image from AsyncStorage:', error);
      }
    };

    loadProfileImage();

    // Add a listener for when the screen is focused to reload the image
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileImage();
    });

    return unsubscribe;
  }, [navigation]);
  // Get current date info
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDate = today.getDate();
  
  // Calculate dates for the week (starting from Monday)
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(today);
    const daysSinceMonday = (currentDayIndex === 0 ? 6 : currentDayIndex - 1);
    startOfWeek.setDate(currentDate - daysSinceMonday);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.getDate());
    }
    return dates;
  };
  
  const weekDates = getWeekDates();
  const adjustedTodayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1; // Adjust for Monday start
  
  // Same outfit data as WeeklyPlannerScreen
  const weeklyOutfits = {
    0: { 
      image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&h=400&fit=crop', 
      style: 'Casual Monday'
    },
    1: { 
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=400&fit=crop', 
      style: 'Business'
    },
    2: { 
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 
      style: 'Smart Casual'
    },
    3: { 
      image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400&h=400&fit=crop', 
      style: 'WFH'
    },
    4: { 
      image: 'https://images.unsplash.com/photo-1519406596751-0a3ccc4937fe?w=400&h=400&fit=crop', 
      style: 'Friday'
    },
    5: { 
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop', 
      style: 'Brunch'
    },
    6: { 
      image: 'https://images.unsplash.com/photo-1480264104733-84fb0b925be3?w=400&h=400&fit=crop', 
      style: 'Relaxed'
    },
  };
  // Dummy data for recent items
  const recentItems = [
    { id: 1, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&h=200&fit=crop' },
    { id: 2, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=200&fit=crop' },
    { id: 3, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&h=200&fit=crop' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.title}>Let's style your day</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle-outline" size={32} color="#333333" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={async () => {
                await logout();
              }}
            >
              <Ionicons name="log-out-outline" size={24} color="#333333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddItem')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="camera-outline" size={24} color="#F97316" />
              </View>
              <Text style={styles.actionTitle}>Add Item</Text>
              <Text style={styles.actionSubtitle}>Snap & catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('OutfitSwiper')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="heart-outline" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.actionTitle}>Swipe Outfits</Text>
              <Text style={styles.actionSubtitle}>Find your style</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Recommendations')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FFE4EC' }]}>
                <Ionicons name="sparkles" size={24} color="#EC4899" />
              </View>
              <Text style={styles.actionTitle}>Get Styled</Text>
              <Text style={styles.actionSubtitle}>AI suggestions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Outfits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
        {/* In-Store Scanner */}
        <View style={styles.scannerSection}>
          <View style={styles.scannerCard}>
            <View style={styles.scannerHeader}>
              <View style={styles.scannerIconContainer}>
                <Ionicons name="barcode-outline" size={32} color="#F97316" />
              </View>
              <View style={styles.scannerTextContainer}>
                <Text style={styles.scannerTitle}>In-Store Assistant</Text>
                <Text style={styles.scannerSubtitle}>Scan & check compatibility</Text>
              </View>
            </View>
            
            <Text style={styles.scannerDescription}>
              Shopping? Scan items to see if they match your wardrobe
            </Text>
            
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={20} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </TouchableOpacity>
            
            <View style={styles.scannerFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.featureText}>Instant match check</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.featureText}>Price comparison</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.featureText}>Style suggestions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Outfit Planner */}
        

        {/* Recent Items */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Wardrobe')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="arrow-forward" size={16} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentItemsScroll}
          >
            {recentItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.recentItem}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.recentItemImage} />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.addMoreItem}
              onPress={() => navigation.navigate('AddItem')}
            >
              <Ionicons name="add" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Weekly Outfit Planner */}
        <View style={styles.weeklyPlannerSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Outfit Planner</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => {
                console.log('Plan All button pressed');
                navigation.navigate('WeeklyPlanner');
              }}
            >
              <Text style={styles.seeAllText}>Plan All</Text>
              <Ionicons name="arrow-forward" size={16} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weeklyPlannerScroll}
          >
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const isToday = index === adjustedTodayIndex;
              return (
                <TouchableOpacity 
                  key={day} 
                  style={[styles.dayCard, isToday && styles.dayCardToday]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                  <Text style={styles.dayDate}>{weekDates[index]}</Text>
                  
                  {weeklyOutfits[index] ? (
                    <View style={styles.outfitPreview}>
                      <Image 
                        source={{ uri: weeklyOutfits[index].image }} 
                        style={styles.outfitImage}
                      />
                      <Text style={styles.outfitLabel}>
                        {weeklyOutfits[index].style}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addOutfitButton}>
                      <View style={styles.addOutfitIcon}>
                        <Ionicons name="add" size={24} color="#F97316" />
                      </View>
                      <Text style={styles.addOutfitText}>Plan</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;