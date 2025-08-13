// HomeScreen.js - Premium Minimalist Design
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { logout, user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [firstName, setFirstName] = useState('');
  
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('profileImage');
        const savedName = await AsyncStorage.getItem('userName');
        if (savedImage) setProfileImage(savedImage);
        if (savedName) {
          const name = savedName.split(' ')[0];
          setFirstName(name);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };

    loadProfileData();
    const unsubscribe = navigation.addListener('focus', loadProfileData);
    return unsubscribe;
  }, [navigation]);

  // Premium wardrobe preview
  const wardrobePreview = [
    { id: 1, image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop', name: 'Classic White Shirt' },
    { id: 2, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop', name: 'Essential Tee' },
    { id: 3, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop', name: 'Black Jacket' },
    { id: 4, image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&h=400&fit=crop', name: 'Premium Denim' },
  ];

  const styles = {
    container: {
      flex: 1,
      backgroundColor: '#FAFBFC', // Subtle premium gray-white
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    
    // Premium header with subtle depth
    header: {
      paddingHorizontal: 28,
      paddingTop: StatusBar.currentHeight || 20,
      paddingBottom: 12,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 28,
    },
    greetingContainer: {
      flex: 1,
    },
    greetingTime: {
      fontSize: 13,
      fontWeight: '500',
      color: '#8A8F99',
      letterSpacing: 0.3,
      marginBottom: 6,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '300',
      color: '#1A1D26',
      letterSpacing: -0.5,
    },
    greetingBold: {
      fontWeight: '600',
      color: '#000000',
    },
    profileButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: '#F5F6F8',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(0, 0, 0, 0.04)',
    },
    profileImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    
    // Premium hero card with gradient accent
    heroSection: {
      paddingHorizontal: 28,
      marginTop: 24,
      marginBottom: 32,
    },
    heroCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    heroGradientStrip: {
      height: 4,
      background: 'linear-gradient(90deg, #F97316 0%, #EC4899 100%)',
    },
    heroContent: {
      padding: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroLeft: {
      flex: 1,
      marginRight: 20,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: 20,
    },
    heroButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F97316',
      alignSelf: 'flex-start',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
    },
    heroButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginRight: 6,
    },
    heroIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: '#FFF5F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // Premium action cards with subtle animations
    actionSection: {
      paddingHorizontal: 28,
      marginBottom: 32,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 16,
    },
    actionCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      minHeight: 120,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    wardrobeActionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    wardrobeActionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    wardrobeActionLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    wardrobeIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    wardrobeTextContainer: {
      flex: 1,
    },
    wardrobeActionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    wardrobeActionSubtitle: {
      fontSize: 14,
      color: '#6B7280',
    },
    wardrobeActionButton: {
      backgroundColor: '#F97316',
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    wardrobeActionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginRight: 4,
    },
    actionIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    actionDescription: {
      fontSize: 13,
      color: '#8A8F99',
      lineHeight: 18,
    },
    
    // Premium stats display
    statsSection: {
      marginHorizontal: 28,
      marginBottom: 32,
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 32,
      fontWeight: '200',
      color: '#000000',
      marginBottom: 4,
    },
    statValueBold: {
      fontWeight: '600',
    },
    statLabel: {
      fontSize: 12,
      color: '#8A8F99',
      fontWeight: '500',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    statDivider: {
      width: 0.5,
      height: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      alignSelf: 'center',
    },
    
    // Section headers - premium style
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 28,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#000000',
      letterSpacing: -0.3,
    },
    sectionLink: {
      fontSize: 14,
      color: '#F97316',
      fontWeight: '500',
    },
    
    // Premium wardrobe grid
    wardrobeSection: {
      marginBottom: 32,
    },
    wardrobeScroll: {
      paddingLeft: 28,
    },
    wardrobeCard: {
      width: 140,
      marginRight: 16,
    },
    wardrobeImageContainer: {
      width: 140,
      height: 140,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#F5F6F8',
      marginBottom: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    wardrobeImage: {
      width: '100%',
      height: '100%',
    },
    wardrobeName: {
      fontSize: 13,
      fontWeight: '500',
      color: '#000000',
      marginBottom: 2,
    },
    wardrobeCategory: {
      fontSize: 11,
      color: '#8A8F99',
    },
    addItemCard: {
      width: 140,
      height: 140,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      borderStyle: 'dashed',
      marginRight: 28,
    },
    addItemIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#F5F6F8',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    addItemText: {
      fontSize: 13,
      color: '#8A8F99',
      fontWeight: '500',
    },
    
    // Today's outfit - premium minimal with empty state
    todaySection: {
      marginHorizontal: 28,
      marginBottom: 32,
    },
    todayCard: {
      backgroundColor: '#FFF5F0',
      borderRadius: 20,
      padding: 24,
      borderWidth: 2,
      borderColor: '#F97316',
      borderStyle: 'dashed',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    todayEmptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    todayEmptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000000',
      marginBottom: 8,
      textAlign: 'center',
    },
    todayEmptySubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: 20,
    },
    todayCreateButton: {
      backgroundColor: '#F97316',
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    todayCreateButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginRight: 6,
    },
    
    // Premium floating action button
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 28,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        android: {
          elevation: 10,
        },
      }),
    },
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = firstName || 'there';
    let timeOfDay;
    
    if (hour < 12) timeOfDay = 'Good morning';
    else if (hour < 18) timeOfDay = 'Good afternoon';
    else timeOfDay = 'Good evening';
    
    return { timeOfDay, name };
  };

  const formatTime = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const greetingData = getGreeting();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTime}>{formatTime()}</Text>
              <Text style={styles.greeting}>
                {greetingData.timeOfDay},{' '}
                <Text style={styles.greetingBold}>{greetingData.name}</Text>
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-outline" size={20} color="#8A8F99" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card with Gradient Strip */}
        <View style={styles.heroSection}>
          <TouchableOpacity 
            style={styles.heroCard}
            onPress={() => navigation.navigate('BeforeYouBuy')}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={['#F97316', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 4 }}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>Smart Shopping Assistant</Text>
                <Text style={styles.heroSubtitle}>
                  AI-powered analysis before you buy
                </Text>
                <TouchableOpacity 
                  style={styles.heroButton}
                  onPress={() => navigation.navigate('BeforeYouBuy')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroButtonText}>Start Scanning</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.heroIconContainer}>
                <Ionicons name="scan" size={28} color="#F97316" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Premium Action Cards */}
        <View style={styles.actionSection}>
          {/* Wardrobe CTA - Clean White Card with Gradient Icon */}
          <View style={styles.wardrobeActionCard}>
            <TouchableOpacity 
              style={styles.wardrobeActionContent}
              onPress={() => navigation.navigate('Wardrobe')}
              activeOpacity={0.95}
            >
              <View style={styles.wardrobeActionLeft}>
                <LinearGradient
                  colors={['#F97316', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.wardrobeIconContainer}
                >
                  <Ionicons name="grid" size={28} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.wardrobeTextContainer}>
                  <Text style={styles.wardrobeActionTitle}>Your Wardrobe</Text>
                  <Text style={styles.wardrobeActionSubtitle}>
                    24 items in your collection
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.wardrobeActionButton}
                onPress={() => navigation.navigate('Wardrobe')}
                activeOpacity={0.8}
              >
                <Text style={styles.wardrobeActionButtonText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Other Action Cards */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Recommendations')}
              activeOpacity={0.95}
            >
              <LinearGradient
                colors={['#F97316', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconWrapper}
              >
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionTitle}>AI Stylist</Text>
              <Text style={styles.actionDescription}>
                Personalized outfit recommendations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('WeeklyPlanner')}
              activeOpacity={0.95}
            >
              <LinearGradient
                colors={['#818CF8', '#C084FC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconWrapper}
              >
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionTitle}>Weekly Planner</Text>
              <Text style={styles.actionDescription}>
                Organize your week in style
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Outfit - Empty State */}
        <View style={styles.todaySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Look</Text>
          </View>
          <TouchableOpacity 
            style={styles.todayCard}
            onPress={() => navigation.navigate('WeeklyPlanner')}
            activeOpacity={0.95}
          >
            <View style={styles.todayEmptyIcon}>
              <Ionicons name="sparkles" size={28} color="#F97316" />
            </View>
            <Text style={styles.todayEmptyTitle}>No Outfit Created for Today</Text>
            <Text style={styles.todayEmptySubtitle}>
              Let's put together something amazing!{'\n'}
              Create your perfect outfit in seconds
            </Text>
            <View style={styles.todayCreateButton}>
              <Text style={styles.todayCreateButtonText}>Create Outfit</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Premium Wardrobe Preview */}
        <View style={styles.wardrobeSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wardrobe')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wardrobeScroll}
          >
            {wardrobePreview.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.wardrobeCard}
                onPress={() => navigation.navigate('Wardrobe')}
                activeOpacity={0.95}
              >
                <View style={styles.wardrobeImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.wardrobeImage} />
                </View>
                <Text style={styles.wardrobeName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.wardrobeCategory}>Recently added</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.addItemCard}
              onPress={() => navigation.navigate('AddItem')}
              activeOpacity={0.95}
            >
              <View style={styles.addItemIcon}>
                <Ionicons name="add" size={24} color="#8A8F99" />
              </View>
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Premium Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem')}
        activeOpacity={0.95}
      >
        <Ionicons name="camera" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;