import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const itemWidth = (width - 56) / 2; // Two items per row with spacing

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC', // Premium gray-white matching home
  },
  
  // Premium Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.5,
  },
  addIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Premium Search Bar Styles
  searchContainer: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  
  // Premium Categories Styles
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  categoryChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  
  // Premium Stats Bar Styles
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#8A8F99',
  },
  statsNumber: {
    fontWeight: '600',
    color: '#000000',
    fontSize: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  
  // Premium Grid Styles
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  
  // Premium Item Card Styles
  swipeableContainer: {
    position: 'relative',
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    margin: 8,
    borderRadius: 16,
    width: itemWidth,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemImage: {
    width: '100%',
    height: itemWidth * 1.2,
    backgroundColor: '#F5F6F8',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#8A8F99',
  },
  
  // Swipe Action Styles
  swipeActionsContainer: {
    width: 150,
    flexDirection: 'row',
    height: '100%',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  editAction: {
    backgroundColor: '#F97316',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginRight: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: '100%',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Premium Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingBottom: 120,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F6F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A8F99',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Premium Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  
  // Premium Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
  },
  favoriteButtonModal: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#F5F6F8',
  },
  modalInfo: {
    padding: 28,
  },
  modalItemName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  modalDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalDetailDivider: {
    width: 0.5,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignSelf: 'center',
  },
  modalDetailLabel: {
    fontSize: 11,
    color: '#8A8F99',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  modalTagText: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalEditButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F97316',
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Edit Modal Styles
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
  },
  editImagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F6F8',
    marginBottom: 24,
  },
  editForm: {
    padding: 28,
    paddingTop: 0,
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
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  typeSelector: {
    marginTop: 8,
  },
  typeChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  typeChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
});