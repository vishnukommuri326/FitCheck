// styles/OutfitInspirationModalStyles.js
import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  modalCloseButton: {
    padding: 4,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: -0.5,
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  
  activeTab: {
    backgroundColor: '#F3E8FF',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  activeTabText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Scanned Item Reminder
  scannedItemReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  reminderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  reminderTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  
  reminderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Quick Ideas Tab Styles (existing)
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  
  inspirationSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  
  inspirationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  
  outfitImageCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  
  outfitInspirationImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F4F6',
  },
  
  outfitImageInfo: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  
  photographerCredit: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  noImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  
  noImagesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  platformLinksContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  
  platformButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    marginLeft: 12,
  },
  
  // Chat Tab Styles
  chatContainer: {
    flex: 1,
  },
  
  quickPromptsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 60,
  },
  
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  
  quickPromptEmoji: {
    fontSize: 16,
  },
  
  quickPromptText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  messagesContent: {
    paddingVertical: 16,
  },
  
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  
  botMessage: {
    justifyContent: 'flex-start',
  },
  
  userMessage: {
    justifyContent: 'flex-end',
  },
  
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  userBubble: {
    backgroundColor: '#8B5CF6',
  },
  
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  
  botText: {
    color: '#333333',
  },
  
  userText: {
    color: '#FFFFFF',
  },
  
  // Enhanced message content styles
  generatedImageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  generatedImageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  
  generatedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  wardrobeMatchesContainer: {
    marginTop: 12,
  },
  
  wardrobeMatchesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  
  wardrobeMatchCard: {
    width: 80,
    marginRight: 8,
    alignItems: 'center',
  },
  
  wardrobeMatchImage: {
    width: 70,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginBottom: 4,
  },
  
  wardrobeMatchName: {
    fontSize: 11,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  wardrobeMatchReason: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  messageImagesContainer: {
    marginTop: 12,
  },
  
  messageImagesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  
  messageImages: {
    marginTop: 8,
    flexDirection: 'row',
  },
  
  messageImageWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  
  messageImage: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },
  
  relevanceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  relevanceText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  styleTipsContainer: {
    marginTop: 12,
    gap: 6,
  },
  
  styleTip: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  
  styleTipText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  
  suggestionsContainer: {
    marginTop: 12,
    gap: 6,
  },
  
  suggestionsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
    gap: 4,
  },
  
  suggestionText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  
  shoppingListContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  
  shoppingListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  shoppingListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  
  shopAllButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  shopAllButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  shoppingListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  
  shoppingListItemText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});