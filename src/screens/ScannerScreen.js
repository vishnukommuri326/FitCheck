import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ScannerScreen = ({ navigation }) => {
  const [scannedImage, setScannedImage] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Mock data for matching items
  const matchingItems = [
    { id: 1, name: 'White Sneakers', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=200&h=200&fit=crop' },
    { id: 2, name: 'Blue Jeans', image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&h=200&fit=crop' },
    { id: 3, name: 'Black Belt', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop' },
  ];

  const generatedOutfit = {
    scannedItem: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    items: [
      'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop',
    ]
  };

  const handleScan = async () => {
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
      setScannedImage(result.assets[0].uri);
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setScannedImage(null);
    setShowResults(false);
  };

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
          <Text style={styles.headerTitle}>In-Store Scanner</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setShowHowItWorks(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#333333" />
          </TouchableOpacity>
        </View>

        {!showResults ? (
          <>
            {/* Instructions Card */}
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <Ionicons name="sparkles" size={24} color="#EC4899" />
                <Text style={styles.instructionsTitle}>Smart Shopping Assistant</Text>
              </View>
              
              <Text style={styles.instructionsText}>
                Found something you like while shopping? Take a photo and I'll show you:
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Items from your wardrobe that match</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Complete outfit suggestions</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.benefitText}>Style compatibility score</Text>
                </View>
              </View>
            </View>

            {/* Scan Button */}
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={handleScan}
              activeOpacity={0.8}
            >
              <View style={styles.scanIconContainer}>
                <Ionicons name="camera" size={48} color="#F97316" />
              </View>
              <Text style={styles.scanButtonText}>Tap to Scan Item</Text>
              <Text style={styles.scanButtonSubtext}>Take a photo of any clothing item</Text>
            </TouchableOpacity>

            {/* How it Works */}
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>How it works</Text>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Photograph the item</Text>
                  <Text style={styles.stepDescription}>Snap a clear photo of the clothing item you're interested in</Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>AI analyzes style</Text>
                  <Text style={styles.stepDescription}>Our AI identifies colors, patterns, and style elements</Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Get instant matches</Text>
                  <Text style={styles.stepDescription}>See items from your wardrobe that pair perfectly</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Results Section */}
            <View style={styles.resultsContainer}>
              {/* Scanned Item */}
              <View style={styles.scannedItemCard}>
                <Text style={styles.scannedItemTitle}>Scanned Item</Text>
                <Image source={{ uri: scannedImage }} style={styles.scannedItemImage} />
                <View style={styles.compatibilityBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.compatibilityText}>Great match with your style!</Text>
                </View>
              </View>

              {/* Matching Items */}
              <View style={styles.matchingSection}>
                <Text style={styles.sectionTitle}>From Your Wardrobe</Text>
                <Text style={styles.sectionSubtitle}>These items would pair perfectly</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {matchingItems.map((item) => (
                    <View key={item.id} style={styles.matchingItem}>
                      <Image source={{ uri: item.image }} style={styles.matchingItemImage} />
                      <Text style={styles.matchingItemName}>{item.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Generated Outfit */}
              <View style={styles.outfitSection}>
                <Text style={styles.sectionTitle}>Complete the Look</Text>
                <View style={styles.outfitCard}>
                  <View style={styles.outfitGrid}>
                    <Image source={{ uri: generatedOutfit.scannedItem }} style={styles.outfitMainImage} />
                    <View style={styles.outfitItems}>
                      {generatedOutfit.items.map((item, index) => (
                        <Image key={index} source={{ uri: item }} style={styles.outfitItemImage} />
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.saveOutfitButton}>
                    <Ionicons name="bookmark-outline" size={20} color="#F97316" />
                    <Text style={styles.saveOutfitText}>Save Outfit</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.scanAgainButton}
                  onPress={handleReset}
                >
                  <Ionicons name="camera-outline" size={20} color="#F97316" />
                  <Text style={styles.scanAgainText}>Scan Another</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.addToWardrobeButton}
                  onPress={() => navigation.navigate('AddItem')}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.addToWardrobeText}>Add to Wardrobe</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* How It Works Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHowItWorks}
        onRequestClose={() => setShowHowItWorks(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How Scanner Works</Text>
              <TouchableOpacity onPress={() => setShowHowItWorks(false)}>
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalText}>
              Our AI-powered scanner helps you make smart shopping decisions by instantly showing you how new items will work with your existing wardrobe.
            </Text>
            
            <Text style={styles.modalText}>
              Simply photograph any clothing item in-store, and we'll analyze its style, color, and pattern to find perfect matches from your closet.
            </Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowHowItWorks(false)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  
  // Header
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
  },
  infoButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -12,
  },
  
  // Instructions Card
  instructionsCard: {
    margin: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  instructionsText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  
  // Scan Button
  scanButton: {
    marginHorizontal: 24,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
    borderStyle: 'dashed',
  },
  scanIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF1E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Steps
  stepsContainer: {
    padding: 24,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Results
  resultsContainer: {
    padding: 24,
  },
  scannedItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
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
  scannedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  scannedItemImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  compatibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  compatibilityText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  
  // Matching Items
  matchingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  matchingItem: {
    marginRight: 12,
  },
  matchingItemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  matchingItemName: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
  },
  
  // Outfit Section
  outfitSection: {
    marginBottom: 24,
  },
  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
  outfitGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  outfitMainImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
  },
  outfitItems: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 8,
  },
  outfitItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  saveOutfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  saveOutfitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F97316',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F97316',
  },
  addToWardrobeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addToWardrobeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  modalText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ScannerScreen;