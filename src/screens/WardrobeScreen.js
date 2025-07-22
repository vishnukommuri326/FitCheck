import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import styles from '../styles/WardrobeScreenStyles.js';

const categories = ['All', 'Favorites', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Sets', 'Activewear', 'Swimwear', 'Sleepwear', 'Underwear', 'Bags', 'Jewelry', 'Headwear', 'Eyewear', 'Belts', 'Scarves', 'Gloves', 'Socks', 'Ties', 'Other'];

// Separate component for animated items
const AnimatedWardrobeItem = ({ item, index, onPress, onEdit, onDelete, selectMode, onToggleFavorite }) => {
  const itemAnim = useRef(new Animated.Value(0)).current;
  const itemSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(itemSlideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <Animated.View
          style={[
            styles.swipeAction,
            styles.editAction,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(item)}
          >
            <Ionicons name="pencil" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.swipeAction,
            styles.deleteAction,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(item)}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.swipeableContainer,
        {
          opacity: itemAnim,
          transform: [{ translateY: itemSlideAnim }],
        },
      ]}
    >
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity 
          style={styles.itemContainer} 
          activeOpacity={0.8}
          onPress={() => onPress(item, selectMode)}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          <TouchableOpacity style={styles.favoriteButton} onPress={() => onToggleFavorite(item.id)} testID={`favorite-button-${item.id}`}>
            <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={20} color="#FFFFFF" testID={`favorite-icon-${item.id}`} />
          </TouchableOpacity>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.tags.name || ''}</Text>
            <Text style={styles.itemDetails}>{item.tags.type}</Text>
            <View style={styles.colorRow}>
              <View style={[styles.colorDot, { backgroundColor: (item.tags.color || '#000000').toLowerCase() }]} />
              <Text style={styles.colorText}>{item.tags.color || ''}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

import { useAuth } from '../context/AuthContext';
import { getWardrobe, deleteGarment, updateGarment } from '../services/firebase';

const WardrobeScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { selectMode, selectedDayIndex } = route.params || {};
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editColor, setEditColor] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalSlideAnim = useRef(new Animated.Value(300)).current;

  const loadWardrobeItems = useCallback(async () => {
    try {
      const items = await getWardrobe(user.uid);
      setWardrobeItems(items);
    } catch (error) {
      console.error('Failed to load wardrobe items:', error);
    }
  }, [user.uid]);

  const toggleFavorite = async (itemId) => {
    try {
      const itemToUpdate = wardrobeItems.find(item => item.id === itemId);
      if (itemToUpdate) {
        const updatedItem = { ...itemToUpdate, isFavorite: !itemToUpdate.isFavorite };
        await updateGarment(user.uid, itemId, { isFavorite: updatedItem.isFavorite });
        setWardrobeItems(wardrobeItems.map(item => item.id === itemId ? updatedItem : item));
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(updatedItem);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWardrobeItems();
      if (route.params?.newItemAdded) {
        navigation.setParams({ newItemAdded: false }); // Reset the param
      }
    }, [route.params?.newItemAdded, loadWardrobeItems])
  );

  // Animate on mount
  useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredItems = wardrobeItems.filter(item => {
    const matchesSearch = (item.tags.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.tags.color || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'All') {
      return matchesSearch;
    } else if (selectedCategory === 'Favorites') {
      return item.isFavorite && matchesSearch;
    } else { // Specific category like 'Tops', 'Bottoms', etc.
      return item.tags.type === selectedCategory && matchesSearch;
    }
  });

  const handleEdit = (item) => {
    console.log('Edit item:', item.tags.name);
    setSelectedItem(item);
    setEditName(item.tags.name);
    setEditType(item.tags.type);
    setEditColor(item.tags.color);
    setModalVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editType || !editColor) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const updatedTags = {
        name: editName,
        type: editType,
        color: editColor,
      };
      await updateGarment(user.uid, selectedItem.id, { tags: updatedTags });
      loadWardrobeItems();
      setEditModalVisible(false);
      console.log('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const handleDelete = async (itemToDelete) => {
    console.log('Delete item:', itemToDelete.tags.name);
    try {
      await deleteGarment(user.uid, itemToDelete.id);
      loadWardrobeItems();
      console.log('Item deleted from Firestore:', itemToDelete.tags.name);
      closeModal(); // Close modal if item was deleted from detail view
    } catch (error) {
      console.error('Error deleting item from Firestore:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const openItemDetail = (item) => {
    if (selectMode) {
      navigation.navigate('WeeklyPlanner', { selectedItem: item, selectedDayIndex: selectedDayIndex });
    } else {
      setSelectedItem(item);
      setModalVisible(true);
      // Animate modal in
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        friction: 9,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeModal = () => {
    // Animate modal out
    Animated.timing(modalSlideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedItem(null);
    });
  };

  const renderItem = ({ item, index }) => (
    <AnimatedWardrobeItem
      item={item}
      index={index}
      onPress={openItemDetail}
      onEdit={handleEdit}
      onDelete={handleDelete}
      selectMode={selectMode}
      onToggleFavorite={toggleFavorite}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
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
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
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
      </Animated.View>

      {/* Categories */}
      <Animated.ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
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
      </Animated.ScrollView>

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
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Recommendations')}
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Item Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            {selectedItem && (
              <>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeModal}
                    >
                      <Ionicons name="close" size={24} color="#333333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Item Details</Text>
                    <TouchableOpacity
                      style={styles.favoriteButtonModal}
                      onPress={() => toggleFavorite(selectedItem.id)}
                    >
                      <Ionicons name={selectedItem.isFavorite ? "heart" : "heart-outline"} size={24} color="#EC4899" />
                    </TouchableOpacity>
                  </View>

                  {/* Item Image */}
                  <Image 
                    source={{ uri: selectedItem.imageUrl }} 
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  {/* Item Info */}
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalItemName}>{selectedItem.tags.name}</Text>
                    
                    <View style={styles.modalDetailsRow}>
                      <View style={styles.modalDetailItem}>
                        <Text style={styles.modalDetailLabel}>Type</Text>
                        <Text style={styles.modalDetailValue}>{selectedItem.tags.type}</Text>
                      </View>
                      <View style={styles.modalDetailItem}>
                        <Text style={styles.modalDetailLabel}>Color</Text>
                        <View style={styles.modalColorRow}>
                          <View style={[styles.modalColorDot, { backgroundColor: (selectedItem.tags.color || '#000000').toLowerCase() }]} />
                          <Text style={styles.modalDetailValue}>{selectedItem.tags.color || ''}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Additional Details */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Additional Details</Text>
                      <View style={styles.modalTagsContainer}>
                        <View style={styles.modalTag}>
                          <Text style={styles.modalTagText}>Casual</Text>
                        </View>
                        <View style={styles.modalTag}>
                          <Text style={styles.modalTagText}>Summer</Text>
                        </View>
                        <View style={styles.modalTag}>
                          <Text style={styles.modalTagText}>Everyday</Text>
                        </View>
                      </View>
                    </View>

                    {/* Notes Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Notes</Text>
                      <Text style={styles.modalNotes}>
                        Perfect for casual outings. Goes well with denim or khakis.
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      {selectMode && (
                        <TouchableOpacity
                          style={[styles.modalActionButton, styles.addToPlannerButton]}
                          onPress={() => {
                            closeModal();
                            navigation.navigate('WeeklyPlanner', { selectedItem: selectedItem, selectedDayIndex: selectedDayIndex });
                          }}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                          <Text style={styles.modalActionText}>Add to Planner</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.modalActionButton}
                        onPress={() => {
                          closeModal();
                          setTimeout(() => {
                            navigation.navigate('Recommendations', { item: selectedItem });
                          }, 300);
                        }}
                      >
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <Text style={styles.modalActionText}>Style This</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.modalEditButton]}
                        onPress={() => handleEdit(selectedItem)}
                      >
                        <Ionicons name="pencil" size={20} color="#F97316" />
                        <Text style={[styles.modalActionText, { color: '#F97316' }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  {/* Item Image Preview */}
                  <Image 
                    source={{ uri: selectedItem.imageUri }} 
                    style={styles.editImagePreview}
                    resizeMode="cover"
                  />

                  {/* Edit Form */}
                  <View style={styles.editForm}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Item Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter item name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Type</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.typeSelector}
                      >
                        {categories.filter(cat => cat !== 'All').map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.typeChip,
                              editType === type && styles.typeChipActive
                            ]}
                            onPress={() => setEditType(type)}
                          >
                            <Text style={[
                              styles.typeChipText,
                              editType === type && styles.typeChipTextActive
                            ]}>
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Color</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editColor}
                        onChangeText={setEditColor}
                        placeholder="Enter color"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        setEditModalVisible(false);
                        handleDelete(selectedItem);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      <Text style={styles.deleteButtonText}>Delete Item</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WardrobeScreen;