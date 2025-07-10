import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// TODO: Install expo-image-picker with: expo install expo-image-picker
// import * as ImagePicker from 'expo-image-picker';

const AddItemScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImagePicker = async () => {
    // Temporary placeholder
    setImageUri('https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop');
  };

  const handleCamera = async () => {
    // Temporary placeholder
    setImageUri('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop');
  };

  const handleGetRecommendations = () => {
    if (!imageUri) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Recommendations', {
        imageUri,
        itemName,
        itemType,
        itemColor,
      });
    }, 1000);
  };

  const handleAddItem = () => {
    if (!imageUri || !itemName.trim()) {
      alert('Please add a photo and enter an item name.');
      return;
    }
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      // TODO: save to backend / Firestore
      navigation.goBack();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add to Wardrobe</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Upload Card */}
          <View style={styles.uploadCard}>
            {!imageUri ? (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                <Text style={styles.uploadTitle}>Add a photo</Text>
                <Text style={styles.uploadSubtitle}>
                  Take a picture or choose from gallery
                </Text>
                
                <View style={styles.uploadButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={handleCamera}
                    accessibilityLabel="Take a photo"
                    accessibilityRole="button"
                  >
                    <Ionicons name="camera" size={20} color="#F97316" />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={handleImagePicker}
                    accessibilityLabel="Choose from gallery"
                    accessibilityRole="button"
                  >
                    <Ionicons name="images" size={20} color="#F97316" />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                <TouchableOpacity 
                  style={styles.changePhotoButton}
                  onPress={handleImagePicker}
                  accessibilityLabel="Change photo"
                  accessibilityRole="button"
                >
                  <Ionicons name="camera" size={16} color="#F97316" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Item Details Card */}
          {imageUri && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Item Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g., Blue Denim Jacket"
                  placeholderTextColor="#9CA3AF"
                  accessibilityLabel="Item name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Type</Text>
                <TextInput
                  style={styles.input}
                  value={itemType}
                  onChangeText={setItemType}
                  placeholder="e.g., Jacket, Shirt, Pants"
                  placeholderTextColor="#9CA3AF"
                  accessibilityLabel="Item type"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={itemColor}
                  onChangeText={setItemColor}
                  placeholder="e.g., Blue, Black, White"
                  placeholderTextColor="#9CA3AF"
                  accessibilityLabel="Item color"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {imageUri && (
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={handleAddItem}
              activeOpacity={0.8}
              accessibilityLabel="Add item"
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.addItemText}>Add Item</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fab}
              onPress={handleGetRecommendations}
              activeOpacity={0.8}
              accessibilityLabel="Get AI recommendations"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={styles.fabText}>Get Recommendations</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
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
  uploadCard: {
    margin: 24,
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
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
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F97316',
  },
  imageContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  detailsCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
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
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E2E5EA',
  },
   actionBar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addItemButton: {
    flex: 0.48,
    marginRight: 16,            // <-- extra space to the right
    backgroundColor: '#8B5CF6',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  fab: {
    flex: 0.8,
    // marginLeft: 16,          // you can also use this instead of marginRight above
    backgroundColor: '#10B981',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginLeft: 8,
  },
});

export default AddItemScreen;
