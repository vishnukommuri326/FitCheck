import 'react-native-get-random-values';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { functions, storage } from '../../firebase.config';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

const { width } = Dimensions.get('window');

const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Sets', 'Activewear', 'Swimwear', 'Sleepwear', 'Underwear', 'Bags', 'Jewelry', 'Headwear', 'Eyewear', 'Belts', 'Scarves', 'Gloves', 'Socks', 'Ties', 'Other'];

const AddItemScreen = ({ navigation }) => {
  const route = useRoute();
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Testing states
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  const handleImagePicker = async () => {
    // 1. Ask for gallery permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    // 2. Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    // 3. If user didn't cancel, save URI
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAiResults(null);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return;
    }

    // 2. Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    // 3. If user didn't cancel, save URI
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAiResults(null);
    }
  };

  const handleTestAI = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please select an image first to test AI analysis.');
      return;
    }

    setIsTestingAI(true);
    setAiResults(null);
    
    try {
      console.log('🤖 Starting Gemini AI analysis...');
      console.log('📱 Local image URI:', imageUri);
      
      // Step 1: Upload your image to Firebase Storage
      console.log('📤 Uploading image to Firebase Storage...');
      
      // Convert local image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create unique filename
      const filename = `temp-analysis/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const publicImageUrl = await getDownloadURL(storageRef);
      
      console.log('✅ Image uploaded! Public URL:', publicImageUrl);
      
      // Step 2: Analyze with Gemini Vision API
      console.log('🔍 Analyzing with Gemini AI...');
      
      // Use the Gemini endpoint
      const geminiUrl = 'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeClothingItem';
      
      const analysisResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            imageUrl: publicImageUrl,
            userId: 'test-user-123'
          }
        })
      });
      
      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('Analysis response error:', errorText);
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }
      
      const result = await analysisResponse.json();
      console.log('✅ Gemini AI analysis complete:', result);
      
      setAiResults(result);
      
      // Auto-fill form with Gemini results
      if (result.analysis) {
        const analysis = result.analysis;
        if (analysis.itemName && !itemName) setItemName(analysis.itemName);
        if (analysis.category && !itemType) setItemType(analysis.category);
        if (analysis.color?.primary && !itemColor) setItemColor(analysis.color.primary);
      }
      
      // Create detailed alert message
      const analysis = result.analysis;
      let alertMessage = `✨ Item: ${analysis.itemName}\n`;
      alertMessage += `🎨 Color: ${analysis.color.primary}`;
      if (analysis.color.secondary) {
        alertMessage += ` & ${analysis.color.secondary}`;
      }
      alertMessage += `\n👔 Type: ${analysis.type}\n`;
      alertMessage += `💫 Style: ${analysis.style}\n`;
      alertMessage += `🧵 Material: ${analysis.material}\n`;
      alertMessage += `☀️ Season: ${analysis.season}\n`;
      alertMessage += `\n📊 Confidence: ${Math.round(analysis.confidence.overall * 100)}%`;
      if (analysis.confidence.notes) {
        alertMessage += `\n📝 ${analysis.confidence.notes}`;
      }
      
      Alert.alert(
        '🎉 Gemini AI Analysis Complete!', 
        alertMessage,
        [{ text: 'Awesome!', style: 'default' }]
      );
      
    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      
      Alert.alert(
        '❌ Analysis Failed', 
        `${error.message}\n\nMake sure:\n1. Gemini API key is set\n2. Function is deployed\n3. Internet connection is stable`,
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setIsTestingAI(false);
    }
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

  const handleAddItem = async () => {
    if (!imageUri || !itemName.trim()) {
      alert('Please add a name, color, and item name.');
      return;
    }
    setIsSaving(true);

    const newItem = {
      id: uuidv4(),
      imageUri,
      itemName,
      itemType,
      itemColor,
      uploadedAt: new Date().toISOString(),
      aiResults: aiResults, // Save AI results if available
    };

    try {
      const existingItems = await AsyncStorage.getItem('wardrobeItems');
      const items = existingItems ? JSON.parse(existingItems) : [];
      items.push(newItem);
      await AsyncStorage.setItem('wardrobeItems', JSON.stringify(items));
      console.log('Item saved to AsyncStorage:', newItem);
      navigation.navigate('Wardrobe', { newItemAdded: true, newItem });
    } catch (error) {
      console.error('Error saving item to AsyncStorage:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
                
                {/* AI Test Button */}
                <TouchableOpacity 
                  style={styles.aiTestButton}
                  onPress={handleTestAI}
                  disabled={isTestingAI}
                  accessibilityLabel="Test AI analysis"
                  accessibilityRole="button"
                >
                  {isTestingAI ? (
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                  )}
                  <Text style={styles.aiTestButtonText}>
                    {isTestingAI ? 'Analyzing with Gemini...' : 'Analyze with AI'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* AI Results Card - Updated for Gemini */}
          {aiResults && aiResults.analysis && (
            <View style={styles.aiResultsCard}>
              <Text style={styles.aiResultsTitle}>✨ Gemini AI Analysis</Text>
              
              <View style={styles.aiResultSection}>
                <Text style={styles.aiResultLabel}>Detected Item:</Text>
                <Text style={styles.aiResultValue}>
                  {aiResults.analysis.itemName}
                </Text>
              </View>
              
              <View style={styles.aiResultSection}>
                <Text style={styles.aiResultLabel}>Colors:</Text>
                <Text style={styles.aiResultValue}>
                  {aiResults.analysis.color.primary}
                  {aiResults.analysis.color.secondary && ` & ${aiResults.analysis.color.secondary}`}
                </Text>
              </View>
              
              <View style={styles.aiResultSection}>
                <Text style={styles.aiResultLabel}>Style & Material:</Text>
                <Text style={styles.aiResultValue}>
                  {aiResults.analysis.style} • {aiResults.analysis.material}
                </Text>
              </View>
              
              {aiResults.analysis.confidence.notes && (
                <View style={styles.aiResultSection}>
                  <Text style={styles.aiResultLabel}>Notes:</Text>
                  <Text style={styles.aiResultValue}>
                    {aiResults.analysis.confidence.notes}
                  </Text>
                </View>
              )}
            </View>
          )}

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        itemType === category && styles.categoryChipActive,
                      ]}
                      onPress={() => setItemType(category)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          itemType === category && styles.categoryChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
  aiTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    gap: 6,
  },
  aiTestButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  aiResultsCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  aiResultSection: {
    marginBottom: 12,
  },
  aiResultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  aiResultValue: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
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
  categoryChipsContainer: {
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E5EA',
    marginRight: 8,
    backgroundColor: '#F7F8FA',
  },
  categoryChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
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
    marginRight: 16,
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