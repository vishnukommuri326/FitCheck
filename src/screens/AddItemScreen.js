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
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase.config';
import { useAuth } from '../context/AuthContext';
import { addGarment } from '../services/firebase';

const { width } = Dimensions.get('window');

const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Sets', 'Activewear', 'Swimwear', 'Sleepwear', 'Underwear', 'Bags', 'Jewelry', 'Headwear', 'Eyewear', 'Belts', 'Scarves', 'Gloves', 'Socks', 'Ties', 'Other'];

const AddItemScreen = ({ navigation }) => {
  const route = useRoute();
  const { user } = useAuth();
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

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

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

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
      console.log('🤖 Starting analysis...');
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `temp-analysis/${user.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const publicImageUrl = await getDownloadURL(storageRef);
      
      console.log('✅ Image uploaded:', publicImageUrl);
      
      const analysisResponse = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeClothingItem',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { imageUrl: publicImageUrl, userId: user.uid }
          })
        }
      );

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }

      const result = await analysisResponse.json();
      console.log('✅ Full result:', result);
      
      setAiResults(result);
      
      if (result.analysis) {
        const analysis = result.analysis;
        if (analysis.itemName && !itemName) setItemName(analysis.itemName);
        if (analysis.category && !itemType) setItemType(analysis.category);
        if (analysis.color?.primary && !itemColor) setItemColor(analysis.color.primary);
      }
      
      Alert.alert('✨ AI Analysis Complete', 'Your item has been analyzed successfully!');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      Alert.alert('Analysis Failed', error.message);
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
        aiResults,
      });
    }, 1000);
  };

  const handleAddItem = async () => {
    if (!imageUri || !itemName.trim()) {
      Alert.alert('Missing Information', 'Please add a name and select an image.');
      return;
    }
    setIsSaving(true);

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `wardrobe/${user.uid}/${Date.now()}-${uuidv4()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addGarment(user.uid, downloadURL, {
        name: itemName,
        type: itemType,
        color: itemColor,
        aiResults: aiResults,
      });

      Alert.alert(
        'Item Added!',
        `${itemName} has been added to your wardrobe.`,
        [{ text: 'Great!', onPress: () => navigation.navigate('Wardrobe', { newItemAdded: true }) }]
      );

    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Failed to Save', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Item</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Upload Section - Premium Style */}
          <View style={styles.uploadSection}>
            {!imageUri ? (
              <View style={styles.uploadCard}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="camera-outline" size={40} color="#8A8F99" />
                </View>
                <Text style={styles.uploadTitle}>Add a photo</Text>
                <Text style={styles.uploadSubtitle}>
                  Capture or select from your gallery
                </Text>
                
                <View style={styles.uploadButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={handleCamera}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F97316', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      <Ionicons name="camera" size={20} color="#FFFFFF" />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={handleImagePicker}
                    activeOpacity={0.8}
                  >
                    <View style={styles.outlineButton}>
                      <Ionicons name="images-outline" size={20} color="#F97316" />
                      <Text style={styles.outlineButtonText}>Gallery</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.imagePreviewCard}>
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                
                <View style={styles.imageActions}>
                  <TouchableOpacity 
                    style={styles.changePhotoButton}
                    onPress={handleImagePicker}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={16} color="#F97316" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.changePhotoButton, styles.aiAnalyzeButton]}
                    onPress={handleTestAI}
                    disabled={isTestingAI}
                    activeOpacity={0.8}
                  >
                    {isTestingAI ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    )}
                    <Text style={styles.aiAnalyzeButtonText}>
                      {isTestingAI ? 'Analyzing...' : 'AI Analysis'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* AI Results - Premium Style */}
          {aiResults && aiResults.analysis && (
            <View style={styles.aiResultsCard}>
              <View style={styles.aiResultsHeader}>
                <View style={styles.aiIconContainer}>
                  <Ionicons name="sparkles" size={20} color="#F97316" />
                </View>
                <Text style={styles.aiResultsTitle}>AI Analysis</Text>
              </View>
              
              <View style={styles.aiResultsGrid}>
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>ITEM</Text>
                  <Text style={styles.aiResultValue}>
                    {aiResults.analysis.itemName || 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.aiResultDivider} />
                
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>COLOR</Text>
                  <Text style={styles.aiResultValue}>
                    {aiResults.analysis.color?.primary || 'Unknown'}
                  </Text>
                </View>
                
                <View style={styles.aiResultDivider} />
                
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>STYLE</Text>
                  <Text style={styles.aiResultValue}>
                    {aiResults.analysis.style || 'Unknown'}
                  </Text>
                </View>
              </View>
              
              {aiResults.trueImageEmbedding && (
                <View style={styles.aiStatusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.aiStatusText}>Full AI Analysis Complete</Text>
                </View>
              )}
            </View>
          )}

          {/* Item Details - Premium Style */}
          {imageUri && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Item Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput
                  style={styles.input}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g., White Cotton Shirt"
                  placeholderTextColor="#8A8F99"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>TYPE</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.categoryChipsContainer}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        itemType === category && styles.categoryChipActive,
                      ]}
                      onPress={() => setItemType(category)}
                      activeOpacity={0.8}
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
                <Text style={styles.inputLabel}>COLOR</Text>
                <TextInput
                  style={styles.input}
                  value={itemColor}
                  onChangeText={setItemColor}
                  placeholder="e.g., White, Blue, Black"
                  placeholderTextColor="#8A8F99"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Premium Action Buttons */}
        {imageUri && (
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleAddItem}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Add to Wardrobe</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleGetRecommendations}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#F97316" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={20} color="#F97316" />
                  <Text style={styles.secondaryButtonText}>Style This</Text>
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
    backgroundColor: '#FAFBFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  
  // Premium Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },
  
  // Upload Section - Premium
  uploadSection: {
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
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
        elevation: 3,
      },
    }),
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F6F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#8A8F99',
    marginBottom: 28,
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    minWidth: 120,
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlineButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F97316',
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316',
  },
  
  // Image Preview - Premium
  imagePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
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
        elevation: 3,
      },
    }),
  },
  uploadedImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    backgroundColor: '#F5F6F8',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF5F0',
    borderRadius: 12,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  aiAnalyzeButton: {
    backgroundColor: '#F97316',
  },
  aiAnalyzeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // AI Results - Premium
  aiResultsCard: {
    marginHorizontal: 28,
    marginTop: 20,
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
        elevation: 3,
      },
    }),
  },
  aiResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  aiResultsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  aiResultItem: {
    alignItems: 'center',
    flex: 1,
  },
  aiResultDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignSelf: 'center',
  },
  aiResultLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8F99',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  aiResultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  aiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  aiStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#10B981',
  },
  
  // Details Card - Premium
  detailsCard: {
    marginHorizontal: 28,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
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
        elevation: 3,
      },
    }),
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8A8F99',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  categoryChipsContainer: {
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  
  // Action Bar - Premium
  actionBar: {
    position: 'absolute',
    bottom: 24,
    left: 28,
    right: 28,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#F97316',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316',
  },
});

export default AddItemScreen;