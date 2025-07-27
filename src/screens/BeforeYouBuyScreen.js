import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase.config';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const BeforeYouBuyScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [compatibilityResults, setCompatibilityResults] = useState(null);
  const [publicImageUrl, setPublicImageUrl] = useState(null);
  const [isRagAnalyzing, setIsRagAnalyzing] = useState(false);
  const [ragResults, setRagResults] = useState(null);

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to scan items.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeItem(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select images.');
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
      analyzeItem(result.assets[0].uri);
    }
  };

  const analyzeItem = async (imageUri) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setCompatibilityResults(null);
    setPublicImageUrl(null);
    setRagResults(null);

    try {
      console.log('🔍 Starting Before You Buy analysis...');
      
      // Upload image to Firebase
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `temp-analysis/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);
      setPublicImageUrl(imageUrl);

      console.log('📤 Image uploaded, analyzing with Gemini...');

      // Get Gemini analysis with embeddings
      const analysisResponse = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeClothingItem',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { imageUrl: imageUrl, userId: user.uid }
          })
        }
      );

      if (!analysisResponse.ok) {
        throw new Error(`Analysis failed: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      setAnalysis(analysisResult);

      console.log('🧮 Analysis complete, checking wardrobe compatibility...');

      // Get wardrobe compatibility
      const compatibilityResponse = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeWardrobeCompatibility',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              newItemEmbedding: analysisResult.embedding,
              newItemAnalysis: analysisResult.analysis,
              userId: user.uid
            }
          })
        }
      );

      if (!compatibilityResponse.ok) {
        throw new Error(`Compatibility analysis failed: ${compatibilityResponse.status}`);
      }

      const compatibilityResult = await compatibilityResponse.json();
      setCompatibilityResults(compatibilityResult);

      console.log('✅ Complete analysis finished!');

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      Alert.alert(
        'Analysis Failed', 
        `${error.message}\n\nPlease try again or check your internet connection.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ UPDATED: Now passes compatibility results to RAG
  const handleRagAnalysis = async () => {
    if (!publicImageUrl) {
      Alert.alert("Error", "Image URL not found. Please try analyzing the item again.");
      return;
    }
    
    if (!compatibilityResults) {
      Alert.alert("Error", "Compatibility analysis not found. Please try analyzing the item again.");
      return;
    }

    setIsRagAnalyzing(true);
    setRagResults(null);

    try {
      console.log('🚀 Starting True Image RAG analysis...');
      console.log('📋 Using compatibility results:', compatibilityResults.compatibleItems?.length, 'items');

      const ragResponse = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeWithTrueImageRAG',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              imageUrl: publicImageUrl,
              userId: user.uid,
              itemAnalysis: analysis,
              compatibleItems: compatibilityResults.compatibleItems // ← NEW: Pass compatibility results
            }
          })
        }
      );

      if (!ragResponse.ok) {
        const errorText = await ragResponse.text();
        throw new Error(`True Image RAG analysis failed: ${ragResponse.status} ${errorText}`);
      }

      const ragResult = await ragResponse.json();
      setRagResults(ragResult.result);
      console.log('✅ True Image RAG analysis complete!');

    } catch (error) {
      console.error('❌ RAG Analysis failed:', error);
      Alert.alert(
        'Styling Advice Failed',
        `${error.message}\n\nPlease try again.`
      );
    } finally {
      setIsRagAnalyzing(false);
    }
  };

  const renderCompatibleItem = ({ item }) => (
    <View style={styles.compatibleItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.compatibleImage} />
      <View style={styles.compatibleInfo}>
        <Text style={styles.compatibleName} numberOfLines={2}>
          {item.tags?.name || 'Wardrobe Item'}
        </Text>
        <Text style={styles.compatibilityScore}>
          {Math.round(item.similarity * 100)}% match
        </Text>
      </View>
    </View>
  );

  const getRecommendationColor = () => {
    if (!compatibilityResults) return '#6B7280';
    
    // ✅ UPDATED: Check for duplicates first
    if (compatibilityResults.hasDuplicates) return '#EF4444'; // Red for duplicates
    
    const count = compatibilityResults.totalCompatibleItems;
    if (count >= 8) return '#10B981'; // Green
    if (count >= 4) return '#F59E0B'; // Yellow
    if (count >= 2) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // ✅ NEW: Render duplicate items
  const renderDuplicateItem = ({ item }) => (
    <View style={styles.duplicateItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.duplicateImage} />
      <View style={styles.duplicateInfo}>
        <Text style={styles.duplicateName} numberOfLines={2}>
          {item.tags?.name || 'Wardrobe Item'}
        </Text>
        <Text style={styles.duplicateSimilarity}>
          {Math.round(item.similarity * 100)}% similar
        </Text>
        <Text style={styles.duplicateReason} numberOfLines={1}>
          {item.duplicateReason}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Before You Buy</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Camera Section */}
        {!imageUri ? (
          <View style={styles.cameraSection}>
            <View style={styles.scanIcon}>
              <Ionicons name="scan-outline" size={64} color="#F97316" />
            </View>
            <Text style={styles.cameraTitle}>Scan an item in the store</Text>
            <Text style={styles.cameraSubtitle}>
              See how it works with your wardrobe before buying
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cameraButton} onPress={handleCamera}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.galleryButton} onPress={handleGallery}>
                <Ionicons name="images" size={20} color="#F97316" />
                <Text style={styles.galleryButtonText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageSection}>
            <Image source={{ uri: imageUri }} style={styles.analyzedImage} />
            {isAnalyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.analyzingText}>Analyzing with AI...</Text>
                <Text style={styles.analyzingSubtext}>
                  Checking compatibility with your wardrobe
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Item Analysis */}
        {analysis && !isAnalyzing && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>✨ Item Analysis</Text>
            <View style={styles.analysisGrid}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Item</Text>
                <Text style={styles.analysisValue}>{analysis.analysis.itemName}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Style</Text>
                <Text style={styles.analysisValue}>{analysis.analysis.style}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Season</Text>
                <Text style={styles.analysisValue}>{analysis.analysis.season}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Occasion</Text>
                <Text style={styles.analysisValue}>{analysis.analysis.occasion}</Text>
              </View>
            </View>
          </View>
        )}

        {/*Duplicate Warning Section */}
        {compatibilityResults && compatibilityResults.hasDuplicates && (
          <View style={styles.duplicateWarningCard}>
            <View style={styles.duplicateWarningHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.duplicateWarningTitle}>Duplicate Alert!</Text>
            </View>
            
            <Text style={styles.duplicateWarningText}>
              {compatibilityResults.duplicateWarning}
            </Text>
            
            {compatibilityResults.duplicateItems?.length > 0 && (
              <View style={styles.duplicatesSection}>
                <Text style={styles.duplicatesSectionTitle}>
                  Items you already have:
                </Text>
                <FlatList
                  data={compatibilityResults.duplicateItems}
                  renderItem={renderDuplicateItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.duplicatesList}
                />
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.viewWardrobeButton}
              onPress={() => navigation.navigate('Wardrobe')}
            >
              <Text style={styles.viewWardrobeButtonText}>
                View My Wardrobe Instead
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {compatibilityResults && (
          <View style={styles.resultsSection}>
            <View style={[styles.recommendationCard, { borderLeftColor: getRecommendationColor() }]}>
              <Text style={[styles.recommendationText, { color: getRecommendationColor() }]}>
                {compatibilityResults.recommendation}
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>
                    {compatibilityResults.totalCompatibleItems}
                  </Text>
                  <Text style={styles.statLabel}>Compatible Items</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>
                    {Math.round(compatibilityResults.versatilityScore * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Versatility Score</Text>
                </View>
              </View>

              {/* ✅ NEW: Show what it would work with even if duplicate */}
              {compatibilityResults.hasDuplicates && compatibilityResults.compatibleItems?.length > 0 && (
                <Text style={styles.wouldWorkWithText}>
                  💡 If you did buy this, it would work with {compatibilityResults.totalCompatibleItems} items in your wardrobe.
                </Text>
              )}
            </View>

            {compatibilityResults.compatibleItems?.length > 0 && (
              <View style={styles.compatibleSection}>
                <Text style={styles.sectionTitle}>
                  {compatibilityResults.hasDuplicates ? 'Would work with:' : 'Items this works with:'} ({compatibilityResults.compatibleItems.length})
                </Text>
                <FlatList
                  data={compatibilityResults.compatibleItems}
                  renderItem={renderCompatibleItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compatibleList}
                />
              </View>
            )}
          </View>
        )}

        {/* AI Styling Advice Section - Only show if there are compatible items */}
        {compatibilityResults && !ragResults && compatibilityResults.compatibleItems?.length > 0 && (
          <View style={styles.ragSection}>
            <TouchableOpacity style={styles.ragButton} onPress={handleRagAnalysis} disabled={isRagAnalyzing}>
              {isRagAnalyzing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.ragButtonText}>Get AI Styling Advice</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* RAG Loading State */}
        {isRagAnalyzing && !ragResults && (
          <View style={styles.ragLoadingCard}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.ragLoadingText}>
              🤖 Creating personalized outfits...
            </Text>
            <Text style={styles.ragLoadingSubtext}>
              Analyzing {compatibilityResults?.totalCompatibleItems || 0} compatible items
            </Text>
          </View>
        )}

        {/* RAG Results */}
        {ragResults && (
          <View style={styles.ragResultCard}>
            <Text style={styles.analysisTitle}>🤖 AI Stylist</Text>
            <Text style={styles.ragDescriptionTitle}>Item Description:</Text>
            <Text style={styles.ragDescription}>{ragResults.itemDescription}</Text>
            <Text style={styles.stylingAdviceTitle}>Styling Advice:</Text>
            <Text style={styles.stylingAdvice}>{ragResults.stylingAdvice}</Text>
            
            {ragResults.compatibleItems && ragResults.compatibleItems.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Outfit Ideas with:</Text>
                <FlatList
                  data={ragResults.compatibleItems}
                  renderItem={renderCompatibleItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compatibleList}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Bar */}
      {imageUri && !isAnalyzing && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={() => {
              setImageUri(null);
              setAnalysis(null);
              setCompatibilityResults(null);
              setPublicImageUrl(null);
              setRagResults(null);
            }}
          >
            <Ionicons name="refresh" size={20} color="#6B7280" />
            <Text style={styles.retakeText}>Scan Another</Text>
          </TouchableOpacity>
          
          {analysis && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddItem', { 
                imageUri, 
                aiResults: analysis 
              })}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add to Wardrobe</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
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
  cameraSection: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  scanIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F97316',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
  },
  imageSection: {
    margin: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  analyzedImage: {
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: '#F3F4F6',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 8,
    textAlign: 'center',
  },
  analysisCard: {
    marginHorizontal: 24,
    marginBottom: 16,
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
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analysisItem: {
    flex: 1,
    minWidth: '45%',
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textTransform: 'capitalize',
  },
  // ✅ NEW: Duplicate warning styles
  duplicateWarningCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  duplicateWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  duplicateWarningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
  },
  duplicateWarningText: {
    fontSize: 16,
    color: '#DC2626',
    lineHeight: 24,
    marginBottom: 16,
  },
  duplicatesSection: {
    marginBottom: 16,
  },
  duplicatesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F1D1D',
    marginBottom: 12,
  },
  duplicatesList: {
    paddingRight: 24,
  },
  duplicateItem: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  duplicateImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  duplicateInfo: {
    padding: 8,
  },
  duplicateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F1D1D',
    marginBottom: 2,
  },
  duplicateSimilarity: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
    marginBottom: 2,
  },
  duplicateReason: {
    fontSize: 10,
    color: '#991B1B',
    fontStyle: 'italic',
  },
  viewWardrobeButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  viewWardrobeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wouldWorkWithText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 20,
  },
  resultsSection: {
    marginHorizontal: 24,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
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
  recommendationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  compatibleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  compatibleList: {
    paddingRight: 24,
  },
  compatibleItem: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
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
  compatibleImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  compatibleInfo: {
    padding: 8,
  },
  compatibleName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  compatibilityScore: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  ragSection: {
    marginHorizontal: 24,
    marginVertical: 20,
  },
  ragButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  ragButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // ✅ NEW: RAG loading styles
  ragLoadingCard: {
    marginHorizontal: 24,
    marginVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ragLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  ragLoadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  ragResultCard: {
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
  ragDescriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  ragDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  stylingAdviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  stylingAdvice: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionBar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BeforeYouBuyScreen;