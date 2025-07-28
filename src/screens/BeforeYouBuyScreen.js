// Updated BeforeYouBuyScreen.js - Single API call to consolidated Image RAG
import { styles } from '../styles/BeforeYouBuyScreenStyles.js';
import { BlurView } from 'expo-blur';
import AnalyzingAnimation from '../components/AnalyzingAnimation';
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
  const [publicImageUrl, setPublicImageUrl] = useState(null);
  
  // ✅ SIMPLIFIED: Single state for all results
  const [ragResults, setRagResults] = useState(null);
  
  // Item selection states (for styling customization)
  const [selectedItems, setSelectedItems] = useState([]);
  const [showItemSelection, setShowItemSelection] = useState(false);

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

  // ✅ SIMPLIFIED: Single analysis function
  const analyzeItem = async (imageUri) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setRagResults(null);
    setSelectedItems([]);
    setShowItemSelection(false);

    try {
      console.log('🔍 Starting comprehensive AI analysis...');
      
      // Step 1: Upload image to Firebase
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `temp-analysis/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);
      setPublicImageUrl(imageUrl);

      console.log('📤 Image uploaded, analyzing with Gemini...');

      // Step 2: Get Gemini analysis (for structured data + embeddings)
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
        throw new Error(`Gemini analysis failed: ${analysisResponse.status}`);
      }

      const analysisResult = await analysisResponse.json();
      setAnalysis(analysisResult);

      console.log('🧮 Gemini analysis complete, running comprehensive Image RAG...');

      // ✅ Step 3: ONE API call for everything (compatibility + duplicates + styling)
      const ragResponse = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeWithTrueImageRAG',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              imageUrl: imageUrl,
              userId: user.uid,
              itemAnalysis: analysisResult // Pass Gemini results
            }
          })
        }
      );

      if (!ragResponse.ok) {
        const errorText = await ragResponse.text();
        throw new Error(`Image RAG analysis failed: ${ragResponse.status} ${errorText}`);
      }

      const ragResult = await ragResponse.json();
      setRagResults(ragResult.result);

      // ✅ Auto-select all compatible items initially
      if (ragResult.result.compatibleItems?.length > 0) {
        setSelectedItems(ragResult.result.compatibleItems.map(item => item.id));
      }

      console.log('✅ Complete Image RAG analysis finished!');

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

  // ✅ SIMPLIFIED: Generate custom styling with selected items
  const handleCustomStyling = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item to generate custom styling advice.");
      return;
    }

    if (selectedItems.length === ragResults?.compatibleItems?.length) {
      Alert.alert("Same Selection", "You've selected all items - this is the same as the current styling advice.");
      return;
    }

    try {
      console.log('🎨 Generating custom styling advice...');

      // Filter to only selected items
      const selectedCompatibleItems = ragResults.compatibleItems.filter(
        item => selectedItems.includes(item.id)
      );

      const customRagResponse = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeWithTrueImageRAG',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              imageUrl: publicImageUrl,
              userId: user.uid,
              itemAnalysis: analysis,
              compatibleItems: selectedCompatibleItems // Pass only selected items
            }
          })
        }
      );

      if (!customRagResponse.ok) {
        throw new Error(`Custom styling failed: ${customRagResponse.status}`);
      }

      const customResult = await customRagResponse.json();
      
      // Update styling advice with custom results
      setRagResults(prev => ({
        ...prev,
        stylingAdvice: customResult.result.stylingAdvice,
        customStyling: true,
        selectedItemCount: selectedItems.length
      }));

      console.log('✅ Custom styling advice generated!');

    } catch (error) {
      console.error('❌ Custom styling failed:', error);
      Alert.alert('Custom Styling Failed', error.message);
    }
  };

  // Item selection functions
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const selectAllItems = () => {
    if (ragResults?.compatibleItems) {
      setSelectedItems(ragResults.compatibleItems.map(item => item.id));
    }
  };

  const clearAllSelections = () => {
    setSelectedItems([]);
  };

  // Render functions
  const renderCompatibleItem = ({ item, showSelection = false }) => (
    <TouchableOpacity 
      style={[
        styles.compatibleItem,
        showSelection && selectedItems.includes(item.id) && styles.selectedItem
      ]}
      onPress={showSelection ? () => toggleItemSelection(item.id) : undefined}
      activeOpacity={showSelection ? 0.7 : 1}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.compatibleImage} />
      <View style={styles.compatibleInfo}>
        <Text style={styles.compatibleName} numberOfLines={2}>
          {item.name || 'Wardrobe Item'}
        </Text>
        <Text style={styles.compatibilityScore}>
          {Math.round(item.similarity * 100)}% match
        </Text>
      </View>
      {showSelection && (
        <View style={styles.selectionIndicator}>
          <Ionicons 
            name={selectedItems.includes(item.id) ? "checkmark-circle" : "ellipse-outline"} 
            size={20} 
            color={selectedItems.includes(item.id) ? "#10B981" : "#9CA3AF"} 
          />
        </View>
      )}
    </TouchableOpacity>
  );

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

  const getRecommendationColor = () => {
    if (!ragResults) return '#6B7280';
    
    if (ragResults.hasDuplicates) return '#EF4444';
    
    const count = ragResults.totalCompatibleItems;
    if (count >= 8) return '#10B981';
    if (count >= 4) return '#F59E0B';
    if (count >= 2) return '#F97316';
    return '#EF4444';
  };

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
              AI will analyze compatibility, detect duplicates, and provide styling advice
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
                <BlurView intensity={10} style={styles.blurContainer} />
                <AnalyzingAnimation />
                <Text style={styles.analyzingText}>Analyzing Your Item...</Text>
                <Text style={styles.analyzingSubtext}>
                  Our AI is checking for matches in your wardrobe.
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

        {/* ✅ Duplicate Warning Section */}
        {ragResults && ragResults.hasDuplicates && (
          <View style={styles.duplicateWarningCard}>
            <View style={styles.duplicateWarningHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.duplicateWarningTitle}>Duplicate Alert!</Text>
            </View>
            
            <Text style={styles.duplicateWarningText}>
              {ragResults.duplicateWarning}
            </Text>
            
            {ragResults.duplicateItems?.length > 0 && (
              <View style={styles.duplicatesSection}>
                <Text style={styles.duplicatesSectionTitle}>
                  Items you already have:
                </Text>
                <FlatList
                  data={ragResults.duplicateItems}
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

        {/* ✅ Results Section */}
        {ragResults && (
          <View style={styles.resultsSection}>
            <View style={[styles.recommendationCard, { borderLeftColor: getRecommendationColor() }]}>
              <Text style={[styles.recommendationText, { color: getRecommendationColor() }]}>
                {ragResults.recommendation}
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>
                    {ragResults.totalCompatibleItems}
                  </Text>
                  <Text style={styles.statLabel}>Compatible Items</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>
                    {Math.round(ragResults.versatilityScore * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Versatility Score</Text>
                </View>
              </View>
            </View>

            {ragResults.compatibleItems?.length > 0 && (
              <View style={styles.compatibleSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Items this works with ({ragResults.compatibleItems.length}):
                  </Text>
                  <TouchableOpacity 
                    style={styles.selectModeButton}
                    onPress={() => setShowItemSelection(!showItemSelection)}
                  >
                    <Ionicons 
                      name={showItemSelection ? "checkmark-done" : "options"} 
                      size={16} 
                      color="#8B5CF6" 
                    />
                    <Text style={styles.selectModeText}>
                      {showItemSelection ? 'Done' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showItemSelection && (
                  <View style={styles.selectionControls}>
                    <TouchableOpacity style={styles.selectionControlButton} onPress={selectAllItems}>
                      <Text style={styles.selectionControlText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.selectionControlButton} onPress={clearAllSelections}>
                      <Text style={styles.selectionControlText}>Clear All</Text>
                    </TouchableOpacity>
                    <Text style={styles.selectedCountText}>
                      {selectedItems.length} of {ragResults.compatibleItems.length} selected
                    </Text>
                  </View>
                )}

                <FlatList
                  data={ragResults.compatibleItems}
                  renderItem={({ item }) => renderCompatibleItem({ item, showSelection: showItemSelection })}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.compatibleList}
                />

                {/* ✅ Custom styling button */}
                {showItemSelection && selectedItems.length > 0 && selectedItems.length < ragResults.compatibleItems.length && (
                  <TouchableOpacity 
                    style={styles.customStylingButton}
                    onPress={handleCustomStyling}
                  >
                    <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                    <Text style={styles.customStylingText}>
                      Get Custom Styling ({selectedItems.length} items)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* ✅ AI Styling Advice */}
        {ragResults && ragResults.stylingAdvice && (
          <View style={styles.ragResultCard}>
            <Text style={styles.analysisTitle}>
              🤖 AI Stylist {ragResults.customStyling ? '(Custom Selection)' : ''}
            </Text>
            <Text style={styles.ragDescriptionTitle}>Item Description:</Text>
            <Text style={styles.ragDescription}>{ragResults.itemDescription}</Text>
            <Text style={styles.stylingAdviceTitle}>Styling Advice:</Text>
            <Text style={styles.stylingAdvice}>{ragResults.stylingAdvice}</Text>
            
            {ragResults.customStyling && (
              <Text style={styles.customNote}>
                💡 Based on {ragResults.selectedItemCount} selected items from your wardrobe
              </Text>
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
              setRagResults(null);
              setSelectedItems([]);
              setShowItemSelection(false);
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



export default BeforeYouBuyScreen;