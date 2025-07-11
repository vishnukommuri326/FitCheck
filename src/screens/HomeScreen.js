import React from 'react';
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

const HomeScreen = ({ navigation }) => {
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
              <Ionicons name="person-circle-outline" size={32} color="#333333" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                // Add logout logic here
                navigation.navigate('Login');
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

        {/* Recent Items */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Wardrobe')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="arrow-forward" size={16} color="#0066FF" />
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
            <TouchableOpacity style={styles.seeAllButton}>
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
                  
                  {index < 3 ? (
                    <View style={styles.outfitPreview}>
                      <Image 
                        source={{ uri: `https://images.unsplash.com/photo-${index === 0 ? '1490481651871-ab68de25d43a' : index === 1 ? '1487222477894-25f985cf4f1a' : '1539109395156-45b86144a7fe'}?w=150&h=150&fit=crop` }} 
                        style={styles.outfitImage}
                      />
                      <Text style={styles.outfitLabel}>
                        {index === 0 ? 'Casual' : index === 1 ? 'Business' : 'Smart'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5', // Warm cream background
  },
  scrollContent: {
    paddingBottom: 24,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Quick Actions Styles
  quickActionsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF1E6', // Warm peach
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F97316', // Warm orange
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Recent Items Styles
  recentSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316', // Warm orange
  },
  recentItemsScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  recentItem: {
    width: 100,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  recentItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  addMoreItem: {
    width: 100,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E5EA',
    borderStyle: 'dashed',
  },
  
  // Weekly Planner Styles
  weeklyPlannerSection: {
    marginBottom: 24,
  },
  weeklyPlannerScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: 110,
    marginRight: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  outfitPreview: {
    alignItems: 'center',
  },
  outfitImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFE4EC',
  },
  outfitLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  addOutfitButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  addOutfitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addOutfitText: {
    fontSize: 12,
    color: '#F97316',
    marginTop: 4,
    fontWeight: '500',
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: '#F97316',
  },
  dayLabelToday: {
    color: '#333333',
    fontWeight: '700',
  },
});

export default HomeScreen;