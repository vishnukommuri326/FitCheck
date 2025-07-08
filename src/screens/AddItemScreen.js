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
// import styles from '../styles/AddItemScreenStyles';

const AddItemScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImagePicker = async () => {
    // Placeholder until expo-image-picker is installed
    // const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // 
    // if (permissionResult.granted === false) {
    //   alert("Permission to access camera roll is required!");
    //   return;
    // }
    // 
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [3, 4],
    //   quality: 0.8,
    // });
    // 
    // if (!result.canceled) {
    //   setImageUri(result.assets[0].uri);
    // }
    
    // Temporary placeholder
    setImageUri('https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop');
  };

  const handleCamera = async () => {
    // Placeholder until expo-image-picker is installed
    // const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    // 
    // if (permissionResult.granted === false) {
    //   alert("Permission to access camera is required!");
    //   return;
    // }
    // 
    // const result = await ImagePicker.launchCameraAsync({
    //   allowsEditing: true,
    //   aspect: [3, 4],
    //   quality: 0.8,
    // });
    // 
    // if (!result.canceled) {
    //   setImageUri(result.assets[0].uri);
    // }
    
    // Temporary placeholder
    setImageUri('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop');
  };

  const handleGetRecommendations = () => {
    if (!imageUri) return;
    
    navigation.navigate('Recommendations', {
      imageUri,
      itemName,
      itemType,
      itemColor,
    });
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
                    <Ionicons name="camera" size={20} color="#0066FF" />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={handleImagePicker}
                    accessibilityLabel="Choose from gallery"
                    accessibilityRole="button"
                  >
                    <Ionicons name="images" size={20} color="#0066FF" />
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
                  <Ionicons name="camera" size={16} color="#0066FF" />
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

        {/* Floating Action Button */}
        {imageUri && (
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    color: '#0066FF',
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
    color: '#0066FF',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#10B981',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});

export default AddItemScreen;