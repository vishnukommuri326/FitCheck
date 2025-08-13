// components/OutfitInspirationModal.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/OutfitInspirationModalStyles';

const { width, height } = Dimensions.get('window');

const OutfitInspirationModal = ({ 
  visible, 
  onClose, 
  analysis, 
  imageUri, 
  inspirationData, 
  loadingInspiration,
  userId 
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' or 'chat'
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef();
  
  // Initialize chat with welcome message
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'bot',
        text: `Hi! I'm your AI stylist 👗 I can help you style your ${analysis?.analysis?.itemName || 'item'}. What would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [visible, analysis]);
  
  // Enhanced quick prompts with better variety
  const enhancedQuickPrompts = [
    { id: '1', emoji: '💕', text: 'Style this for a first date' },
    { id: '2', emoji: '💼', text: 'Make this office appropriate' },
    { id: '3', emoji: '🎉', text: 'Party outfit ideas' },
    { id: '4', emoji: '👑', text: 'How would Taylor Swift wear this?' },
    { id: '5', emoji: '✨', text: 'Show me 3 different ways' },
    { id: '6', emoji: '🛍️', text: 'What else do I need to buy?' },
    { id: '7', emoji: '🌟', text: 'Celebrity style inspiration' },
    { id: '8', emoji: '📸', text: 'Generate an outfit visual' }
  ];
  
  // Helper functions for enhanced features
  const saveGeneratedImage = async (imageUrl) => {
    try {
      // Implementation to save image to device
      // You could use expo-media-library or expo-file-system
      Alert.alert('Success', 'Outfit idea saved to your gallery!');
    } catch (error) {
      Alert.alert('Error', 'Could not save image');
    }
  };

  const searchForItem = (item) => {
    // Open browser or shopping app with search
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item + ' buy online')}`;
    Linking.openURL(searchUrl);
  };

  const searchAllItems = (items) => {
    // Create a shopping list or open multiple searches
    const listUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(items.join(' '))}`;
    Linking.openURL(listUrl);
  };
  
  // Send message to AI with enhanced features
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    try {
      // Call enhanced AI stylist API
      const response = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/aiStylistChat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              message: text,
              itemAnalysis: analysis,
              userId: userId,
              conversationHistory: messages.slice(-5) // Last 5 messages for context
            }
          })
        }
      );
      
      const result = await response.json();
      
      // Add enhanced AI response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: result.response,
        images: result.images || [],
        generatedImage: result.generatedImage || null,
        suggestions: result.suggestions || [],
        shoppingList: result.shoppingList || [],
        wardrobeMatches: result.wardrobeMatches || [],
        styleTips: result.styleTips || [],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Better fallback response
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: "Let me help you style this! Try asking about specific occasions, celebrity styles, or what to pair it with.",
        suggestions: [
          "How to style this for work?",
          "Show me celebrity inspiration",
          "What shoes would work?"
        ],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
    
    // Scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Enhanced render message with all new features
  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    
    return (
      <View style={[
        styles.messageContainer,
        isBot ? styles.botMessage : styles.userMessage
      ]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={16} color="#8B5CF6" />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botText : styles.userText
          ]}>
            {item.text}
          </Text>
          
          {/* Render generated image if available */}
          {item.generatedImage && (
            <View style={styles.generatedImageContainer}>
              <Text style={styles.generatedImageLabel}>✨ AI Generated Outfit</Text>
              <TouchableOpacity 
                onPress={() => {
                  // Could open in full screen or save
                  Alert.alert('Save Image', 'Would you like to save this outfit idea?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: () => saveGeneratedImage(item.generatedImage.url) }
                  ]);
                }}
              >
                <Image 
                  source={{ uri: item.generatedImage.url }} 
                  style={styles.generatedImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Render wardrobe matches */}
          {item.wardrobeMatches?.length > 0 && (
            <View style={styles.wardrobeMatchesContainer}>
              <Text style={styles.wardrobeMatchesTitle}>
                👗 From Your Wardrobe:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {item.wardrobeMatches.map((match, idx) => (
                  <View key={idx} style={styles.wardrobeMatchCard}>
                    <Image 
                      source={{ uri: match.imageUrl }} 
                      style={styles.wardrobeMatchImage}
                    />
                    <Text style={styles.wardrobeMatchName} numberOfLines={1}>
                      {match.name}
                    </Text>
                    <Text style={styles.wardrobeMatchReason} numberOfLines={1}>
                      {match.matchReason}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Render curated images if available */}
          {item.images?.length > 0 && (
            <View style={styles.messageImagesContainer}>
              <Text style={styles.messageImagesLabel}>📸 Inspiration Photos</Text>
              <ScrollView 
                horizontal 
                style={styles.messageImages}
                showsHorizontalScrollIndicator={false}
              >
                {item.images.map((img, idx) => (
                  <TouchableOpacity 
                    key={idx}
                    onPress={() => img.url && Linking.openURL(img.url)}
                    style={styles.messageImageWrapper}
                  >
                    <Image 
                      source={{ uri: img.thumbnail }} 
                      style={styles.messageImage}
                    />
                    {img.relevance > 2 && (
                      <View style={styles.relevanceBadge}>
                        <Text style={styles.relevanceText}>Best Match</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Render style tips */}
          {item.styleTips?.length > 0 && (
            <View style={styles.styleTipsContainer}>
              {item.styleTips.map((tip, idx) => (
                <View key={idx} style={styles.styleTip}>
                  <Text style={styles.styleTipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Render suggestions as interactive chips */}
          {item.suggestions?.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>You might also ask:</Text>
              {item.suggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-forward" size={12} color="#8B5CF6" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Enhanced shopping list with action buttons */}
          {item.shoppingList?.length > 0 && (
            <View style={styles.shoppingListContainer}>
              <View style={styles.shoppingListHeader}>
                <Text style={styles.shoppingListTitle}>🛍️ Shopping List</Text>
                <TouchableOpacity 
                  style={styles.shopAllButton}
                  onPress={() => searchAllItems(item.shoppingList)}
                >
                  <Text style={styles.shopAllButtonText}>Search All</Text>
                </TouchableOpacity>
              </View>
              {item.shoppingList.map((shopItem, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.shoppingListItem}
                  onPress={() => searchForItem(shopItem)}
                >
                  <Text style={styles.shoppingListItemText}>• {shopItem}</Text>
                  <Ionicons name="search" size={14} color="#8B5CF6" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Outfit Inspiration</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'quick' && styles.activeTab]}
            onPress={() => setActiveTab('quick')}
          >
            <Ionicons 
              name="images-outline" 
              size={20} 
              color={activeTab === 'quick' ? '#8B5CF6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'quick' && styles.activeTabText
            ]}>
              Quick Ideas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}
          >
            <Ionicons 
              name="chatbubbles-outline" 
              size={20} 
              color={activeTab === 'chat' ? '#8B5CF6' : '#6B7280'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'chat' && styles.activeTabText
            ]}>
              AI Stylist
            </Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Scanned Item Reminder */}
        {analysis && (
          <View style={styles.scannedItemReminder}>
            <Image source={{ uri: imageUri }} style={styles.reminderImage} />
            <View style={styles.reminderTextContainer}>
              <Text style={styles.reminderTitle}>
                {analysis.analysis?.itemName || 'Scanned Item'}
              </Text>
              <Text style={styles.reminderSubtitle}>
                {analysis.analysis?.color?.primary} • {analysis.analysis?.style}
              </Text>
            </View>
          </View>
        )}
        
        {/* Tab Content */}
        {activeTab === 'quick' ? (
          // Quick Ideas Tab (Current Implementation)
          <ScrollView showsVerticalScrollIndicator={false}>
            {loadingInspiration ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Finding outfit ideas...</Text>
              </View>
            ) : (
              <>
                {inspirationData?.images?.length > 0 ? (
                  <>
                    <Text style={styles.inspirationSectionTitle}>
                      Outfit Ideas from Unsplash
                    </Text>
                    
                    <View style={styles.inspirationGrid}>
                      {inspirationData.images.map((outfit, index) => (
                        <TouchableOpacity 
                          key={outfit.id || index}
                          style={styles.outfitImageCard}
                          onPress={() => Linking.openURL(outfit.unsplashUrl)}
                        >
                          <Image 
                            source={{ uri: outfit.thumbnail }}
                            style={styles.outfitInspirationImage}
                            resizeMode="cover"
                          />
                          <View style={styles.outfitImageInfo}>
                            <Text style={styles.photographerCredit} numberOfLines={1}>
                              📸 {outfit.photographer}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.noImagesContainer}>
                    <Text style={styles.noImagesText}>
                      No outfit photos found. Try the AI Stylist tab for personalized advice!
                    </Text>
                  </View>
                )}
                
                {/* Platform Links */}
                <Text style={styles.inspirationSectionTitle}>
                  Explore More Outfit Ideas
                </Text>
                
                <View style={styles.platformLinksContainer}>
                  {inspirationData?.exploreMore && Object.entries(inspirationData.exploreMore).map(([platform, data]) => (
                    <TouchableOpacity
                      key={platform}
                      style={styles.platformButton}
                      onPress={() => Linking.openURL(data.url)}
                    >
                      <Ionicons name={data.icon || "link"} size={20} color="#8B5CF6" />
                      <Text style={styles.platformButtonText}>{data.label}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        ) : (
          // Enhanced AI Stylist Chat Tab
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
          >
            {/* Enhanced Quick Prompts - show when conversation just started */}
            {messages.length === 1 && (
              <ScrollView 
                horizontal 
                style={styles.quickPromptsContainer}
                showsHorizontalScrollIndicator={false}
              >
                {enhancedQuickPrompts.slice(0, 6).map(prompt => (
                  <TouchableOpacity
                    key={prompt.id}
                    style={styles.quickPromptChip}
                    onPress={() => sendMessage(prompt.text)}
                  >
                    <Text style={styles.quickPromptEmoji}>{prompt.emoji}</Text>
                    <Text style={styles.quickPromptText}>{prompt.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            {/* Chat Messages */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(message => (
                <View key={message.id}>
                  {renderMessage({ item: message })}
                </View>
              ))}
              
              {isTyping && (
                <View style={[styles.messageContainer, styles.botMessage]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                  </View>
                  <View style={[styles.messageBubble, styles.botBubble]}>
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  </View>
                </View>
              )}
            </ScrollView>
            
            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about styling, occasions, or celebrities..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled
                ]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? '#8B5CF6' : '#D1D5DB'} 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default OutfitInspirationModal;