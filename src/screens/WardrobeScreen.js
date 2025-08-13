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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
          activeOpacity={0.95}
          onPress={() => onPress(item, selectMode)}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={() => onToggleFavorite(item.id)} 
            testID={`favorite-button-${item.id}`}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={item.isFavorite ? "heart" : "heart-outline"} 
              size={18} 
              color="#FFFFFF" 
              testID={`favorite-icon-${item.id}`} 
            />
          </TouchableOpacity>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.tags?.name || item.name || 'Unnamed Item'}
            </Text>
            <Text style={styles.itemDetails}>
              {item.tags?.type || item.type || 'Unknown Type'}
            </Text>
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
        navigation.setParams({ newItemAdded: false });
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
    const itemName = item.tags?.name || item.name || '';
    const itemColor = item.tags?.color || item.color || '';
    
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         itemColor.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'All') {
      return matchesSearch;
    } else if (selectedCategory === 'Favorites') {
      return item.isFavorite && matchesSearch;
    } else {
      const itemType = item.tags?.type || item.type || '';
      return itemType === selectedCategory && matchesSearch;
    }
  });

  const handleEdit = (item) => {
    console.log('Edit item:', item.tags?.name || item.name || 'Unnamed');
    setSelectedItem(item);
    setEditName(item.tags?.name || item.name || '');
    setEditType(item.tags?.type || item.type || '');
    setEditColor(item.tags?.color || item.color || '');
    setModalVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editType || !editColor) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const updatedData = {
        tags: {
          name: editName,
          type: editType,
          color: editColor,
          ...(selectedItem.tags?.aiResults && { aiResults: selectedItem.tags.aiResults })
        },
        name: editName,
        type: editType,
        color: editColor
      };
      
      await updateGarment(user.uid, selectedItem.id, updatedData);
      loadWardrobeItems();
      setEditModalVisible(false);
      console.log('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const handleDelete = async (itemToDelete) => {
    const itemName = itemToDelete.tags?.name || itemToDelete.name || 'Unnamed Item';
    console.log('Delete item:', itemName);
    try {
      await deleteGarment(user.uid, itemToDelete.id);
      loadWardrobeItems();
      console.log('Item deleted from Firestore:', itemName);
      closeModal();
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
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        friction: 9,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeModal = () => {
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Wardrobe</Text>
        <TouchableOpacity 
          style={styles.addIconButton}
          onPress={() => navigation.navigate('AddItem')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F97316', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Bar - Premium Style */}
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
          <Ionicons name="search-outline" size={20} color="#8A8F99" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#8A8F99"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={20} color="#8A8F99" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Categories - Premium Style */}
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
            activeOpacity={0.8}
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

      {/* Stats Bar - Premium Style */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          <Text style={styles.statsNumber}>{filteredItems.length}</Text> items
        </Text>
        <TouchableOpacity style={styles.sortButton} activeOpacity={0.8}>
          <Text style={styles.sortText}>Recently added</Text>
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
          <View style={styles.emptyIconContainer}>
            <Ionicons name="shirt-outline" size={48} color="#8A8F99" />
          </View>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first item to get started
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddItem')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add Your First Item</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Floating Action Button */}
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
          activeOpacity={0.95}
          onPress={() => navigation.navigate('Recommendations')}
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Item Detail Modal - Premium Style */}
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
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={24} color="#000000" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Item Details</Text>
                    <TouchableOpacity
                      style={styles.favoriteButtonModal}
                      onPress={() => toggleFavorite(selectedItem.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={selectedItem.isFavorite ? "heart" : "heart-outline"} 
                        size={24} 
                        color={selectedItem.isFavorite ? "#F97316" : "#8A8F99"} 
                      />
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
                    <Text style={styles.modalItemName}>
                      {selectedItem.tags?.name || selectedItem.name || 'Unnamed Item'}
                    </Text>
                    
                    <View style={styles.modalDetailsRow}>
                      <View style={styles.modalDetailItem}>
                        <Text style={styles.modalDetailLabel}>TYPE</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedItem.tags?.type || selectedItem.type || 'Unknown'}
                        </Text>
                      </View>
                      <View style={styles.modalDetailDivider} />
                      <View style={styles.modalDetailItem}>
                        <Text style={styles.modalDetailLabel}>COLOR</Text>
                        <View style={styles.modalColorRow}>
                          <View style={[styles.modalColorDot, { 
                            backgroundColor: (selectedItem.tags?.color || selectedItem.color || '#000000').toLowerCase() 
                          }]} />
                          <Text style={styles.modalDetailValue}>
                            {selectedItem.tags?.color || selectedItem.color || 'Unknown'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* AI Analysis Section */}
                    {(selectedItem.tags?.aiResults || selectedItem.trueImageEmbedding) && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>AI Analysis</Text>
                        <View style={styles.modalTagsContainer}>
                          {selectedItem.tags?.aiResults?.analysis?.style && (
                            <View style={styles.modalTag}>
                              <Text style={styles.modalTagText}>
                                {selectedItem.tags.aiResults.analysis.style}
                              </Text>
                            </View>
                          )}
                          {selectedItem.tags?.aiResults?.analysis?.season && (
                            <View style={styles.modalTag}>
                              <Text style={styles.modalTagText}>
                                {selectedItem.tags.aiResults.analysis.season}
                              </Text>
                            </View>
                          )}
                          {selectedItem.tags?.aiResults?.analysis?.occasion && (
                            <View style={styles.modalTag}>
                              <Text style={styles.modalTagText}>
                                {selectedItem.tags.aiResults.analysis.occasion}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.modalActionButton}
                        onPress={() => {
                          closeModal();
                          setTimeout(() => {
                            navigation.navigate('Recommendations', { item: selectedItem });
                          }, 300);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <Text style={styles.modalActionText}>Style This</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.modalEditButton]}
                        onPress={() => handleEdit(selectedItem)}
                        activeOpacity={0.8}
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

      {/* Edit Item Modal - Premium Style */}
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
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  <Image 
                    source={{ uri: selectedItem.imageUrl }} 
                    style={styles.editImagePreview}
                    resizeMode="cover"
                  />

                  <View style={styles.editForm}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>ITEM NAME</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter item name"
                        placeholderTextColor="#8A8F99"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>TYPE</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.typeSelector}
                      >
                        {categories.filter(cat => cat !== 'All' && cat !== 'Favorites').map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.typeChip,
                              editType === type && styles.typeChipActive
                            ]}
                            onPress={() => setEditType(type)}
                            activeOpacity={0.8}
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
                      <Text style={styles.inputLabel}>COLOR</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editColor}
                        onChangeText={setEditColor}
                        placeholder="Enter color"
                        placeholderTextColor="#8A8F99"
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        setEditModalVisible(false);
                        handleDelete(selectedItem);
                      }}
                      activeOpacity={0.8}
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