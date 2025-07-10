import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dummy data for recommendations
const fromYourCloset = [
  { id: '1', name: 'White Sneakers', type: 'Footwear', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop' },
  { id: '2', name: 'Blue Jeans', type: 'Bottom', image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop' },
  { id: '3', name: 'Brown Belt', type: 'Accessory', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
];

const shopRecommendations = [
  { id: '1', name: 'Striped Cotton Shirt', brand: 'ZARA', price: '$49.99', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop' },
  { id: '2', name: 'Canvas Tote Bag', brand: 'H&M', price: '$29.99', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop' },
  { id: '3', name: 'Minimalist Watch', brand: 'UNIQLO', price: '$89.99', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&h=400&fit=crop' },
  { id: '4', name: 'Linen Blazer', brand: 'COS', price: '$149.99', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
];

const RecommendationsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('closet');
  const [isLoading, setIsLoading] = useState(true);
  const selectedItem = route.params?.item || null;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);

    // Loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderClosetItem = ({ item }) => (
    <TouchableOpacity style={styles.closetItem} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.closetItemImage} />
      <Text style={styles.closetItemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.closetItemType}>{item.type}</Text>
    </TouchableOpacity>
  );

  const renderShopItem = ({ item }) => (
    <TouchableOpacity style={styles.shopItem} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.shopItemImage} />
      <View style={styles.shopItemInfo}>
        <Text style={styles.shopItemBrand}>{item.brand}</Text>
        <Text style={styles.shopItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.shopItemPrice}>{item.price}</Text>
        <TouchableOpacity style={styles.shopButton}>
          <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          <Text style={styles.shopButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingIcon,
              {
                transform: [
                  {
                    rotate: loadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="sparkles" size={48} color="#EC4899" />
          </Animated.View>
          <Text style={styles.loadingText}>Creating your perfect outfit...</Text>
          <Text style={styles.loadingSubtext}>Our AI is analyzing your style</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Style Recommendations</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Selected Item Preview */}
        {selectedItem && (
          <Animated.View
            style={[
              styles.selectedItemContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionLabel}>Styling with</Text>
            <View style={styles.selectedItem}>
              <Image source={{ uri: selectedItem.image }} style={styles.selectedItemImage} />
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                <Text style={styles.selectedItemType}>{selectedItem.type} • {selectedItem.color}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* AI Insight Card */}
        <Animated.View
          style={[
            styles.insightCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={20} color="#F97316" />
            <Text style={styles.insightTitle}>AI Style Insight</Text>
          </View>
          <Text style={styles.insightText}>
            This {selectedItem?.name || 'item'} pairs beautifully with neutral tones and casual pieces. 
            Try combining with denim for a relaxed look, or dress it up with tailored pieces for smart-casual occasions.
          </Text>
        </Animated.View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closet' && styles.activeTab]}
            onPress={() => setActiveTab('closet')}
          >
            <Ionicons 
              name="shirt-outline" 
              size={20} 
              color={activeTab === 'closet' ? '#F97316' : '#9CA3AF'} 
            />
            <Text style={[styles.tabText, activeTab === 'closet' && styles.activeTabText]}>
              From Your Closet
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
            onPress={() => setActiveTab('shop')}
          >
            <Ionicons 
              name="bag-outline" 
              size={20} 
              color={activeTab === 'shop' ? '#F97316' : '#9CA3AF'} 
            />
            <Text style={[styles.tabText, activeTab === 'shop' && styles.activeTabText]}>
              Shop New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
          }}
        >
          {activeTab === 'closet' ? (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Complete the Look</Text>
              <FlatList
                data={fromYourCloset}
                renderItem={renderClosetItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          ) : (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <View style={styles.shopGrid}>
                {shopRecommendations.map(item => (
                  <View key={item.id} style={styles.shopItemWrapper}>
                    {renderShopItem({ item })}
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Create Outfit Button */}
        <TouchableOpacity style={styles.createOutfitButton} activeOpacity={0.8}>
          <Ionicons name="color-palette-outline" size={20} color="#FFFFFF" />
          <Text style={styles.createOutfitText}>Create Full Outfit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5EA',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },
  
  // Selected Item Styles
  selectedItemContainer: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
  selectedItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  selectedItemType: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // AI Insight Styles
  insightCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFF1E6',
    borderRadius: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  insightText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
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
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FFF1E6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#F97316',
  },
  
  // Content Section
  contentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  
  // Closet Items Styles
  horizontalList: {
    paddingRight: 24,
  },
  closetItem: {
    width: 120,
    marginRight: 12,
  },
  closetItemImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  closetItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  closetItemType: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Shop Items Styles
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  shopItemWrapper: {
    width: '50%',
    padding: 6,
  },
  shopItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
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
  shopItemImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  shopItemInfo: {
    padding: 12,
  },
  shopItemBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  shopItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
    height: 36,
  },
  shopItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 8,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Create Outfit Button
  createOutfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  createOutfitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RecommendationsScreen;