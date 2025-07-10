import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/WardrobeScreenStyles.js';

const dummyWardrobeItems = [
  { id: '1', name: 'Blue Denim Jacket', type: 'Jacket', color: 'Blue', image: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=400&h=400&fit=crop' },
  { id: '2', name: 'White Cotton Tee', type: 'Top', color: 'White', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
  { id: '3', name: 'Black Leather Jacket', type: 'Outerwear', color: 'Black', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop' },
  { id: '4', name: 'Classic Sneakers', type: 'Footwear', color: 'White', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop' },
  { id: '5', name: 'Floral Summer Dress', type: 'Dress', color: 'Floral', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop' },
  { id: '6', name: 'Black Chinos', type: 'Bottom', color: 'Black', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop' },
];

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories'];

const WardrobeScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = dummyWardrobeItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.type === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.color.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <TouchableOpacity style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemDetails}>{item.type}</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorDot, { backgroundColor: item.color.toLowerCase() }]} />
          <Text style={styles.colorText}>{item.color}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="filter-outline" size={24} color="#333333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Ionicons name="add" size={24} color="#333333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your wardrobe..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{filteredItems.length} items</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort by</Text>
          <Ionicons name="chevron-down" size={16} color="#F97316" />
        </TouchableOpacity>
      </View>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={64} color="#E2E5EA" />
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your filters or add new items
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Recommendations')}
      >
        <Ionicons name="sparkles" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default WardrobeScreen;