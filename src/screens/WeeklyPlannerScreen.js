import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WeeklyPlannerScreen = ({ navigation }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [editingOutfit, setEditingOutfit] = useState(null);
  
  // Get current date info
  const today = new Date();
  const currentDayIndex = today.getDay();
  const currentDate = today.getDate();
  
  // Calculate dates for the week
  const getWeekDates = () => {
    const dates = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startOfWeek = new Date(today);
    const daysSinceMonday = (currentDayIndex === 0 ? 6 : currentDayIndex - 1);
    startOfWeek.setDate(currentDate - daysSinceMonday);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push({
        day: days[i],
        date: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' }),
        isToday: i === (currentDayIndex === 0 ? 6 : currentDayIndex - 1),
      });
    }
    return dates;
  };
  
  const weekDates = getWeekDates();
  
  // Dummy outfit data - expanded with more outfits
  const outfits = {
    0: { 
      image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&h=400&fit=crop', 
      style: 'Casual Monday', 
      items: ['Blue Jeans', 'White Tee', 'Sneakers'] 
    },
    1: { 
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=400&fit=crop', 
      style: 'Business Meeting', 
      items: ['Navy Suit', 'White Shirt', 'Oxford Shoes'] 
    },
    2: { 
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 
      style: 'Smart Casual', 
      items: ['Chinos', 'Button-up Shirt', 'Loafers'] 
    },
    3: { 
      image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400&h=400&fit=crop', 
      style: 'Work From Home', 
      items: ['Comfort Joggers', 'Henley Shirt', 'Slides'] 
    },
    4: { 
      image: 'https://images.unsplash.com/photo-1519406596751-0a3ccc4937fe?w=400&h=400&fit=crop', 
      style: 'Friday Vibes', 
      items: ['Denim Jacket', 'Graphic Tee', 'Canvas Shoes'] 
    },
    5: { 
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop', 
      style: 'Weekend Brunch', 
      items: ['Linen Shirt', 'Shorts', 'White Sneakers'] 
    },
    6: { 
      image: 'https://images.unsplash.com/photo-1480264104733-84fb0b925be3?w=400&h=400&fit=crop', 
      style: 'Sunday Relaxed', 
      items: ['Hoodie', 'Sweatpants', 'Comfortable Shoes'] 
    },
  };
  
  const handleDayPress = (index) => {
    setSelectedDay(index);
    if (outfits[index]) {
      // If outfit exists, show edit options
      setSelectedOutfit(outfits[index]);
      setEditingOutfit({ ...outfits[index], dayIndex: index });
      setEditModalVisible(true);
    } else {
      // If no outfit, show add options
      setModalVisible(true);
    }
  };
  
  const handleEditPress = (index) => {
    setSelectedDay(index);
    setSelectedOutfit(outfits[index]);
    setEditingOutfit({ ...outfits[index], dayIndex: index });
    setEditModalVisible(true);
  };
  
  const renderDayCard = (dayInfo, index) => {
    const hasOutfit = outfits[index];
    
    return (
      <TouchableOpacity
        key={index}
        style={[styles.dayCard, dayInfo.isToday && styles.todayCard]}
        onPress={() => handleDayPress(index)}
        activeOpacity={0.8}
      >
        <View style={styles.dayHeader}>
          <Text style={[styles.dayText, dayInfo.isToday && styles.todayText]}>
            {dayInfo.day}
          </Text>
          <Text style={styles.dateText}>
            {dayInfo.date} {dayInfo.month}
          </Text>
        </View>
        
        {hasOutfit ? (
          <>
            <Image source={{ uri: hasOutfit.image }} style={styles.outfitImage} />
            <Text style={styles.outfitStyle}>{hasOutfit.style}</Text>
            <View style={styles.itemsList}>
              {hasOutfit.items.map((item, idx) => (
                <Text key={idx} style={styles.itemText} numberOfLines={1}>
                  • {item}
                </Text>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEditPress(index);
              }}
            >
              <Ionicons name="pencil" size={16} color="#F97316" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyDay}>
            <TouchableOpacity style={styles.addOutfitButton}>
              <View style={styles.addIcon}>
                <Ionicons name="add" size={28} color="#F97316" />
              </View>
              <Text style={styles.addText}>Plan Outfit</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Outfit Planner</Text>
        <TouchableOpacity style={styles.aiButton}>
          <Ionicons name="sparkles" size={20} color="#EC4899" />
        </TouchableOpacity>
      </View>
      
      {/* Week Overview */}
      <View style={styles.weekOverview}>
        <Text style={styles.weekTitle}>This Week</Text>
        <Text style={styles.plannedCount}>7 outfits planned</Text>
      </View>
      
      {/* Days Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.daysGrid}>
          {weekDates.map((dayInfo, index) => renderDayCard(dayInfo, index))}
        </View>
        
        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color="#F97316" />
            <Text style={styles.tipText}>
              Plan your outfits based on weather and activities for a stress-free week!
            </Text>
          </View>
        </View>
        
        {/* Generate Week Button */}
        <TouchableOpacity style={styles.generateButton} activeOpacity={0.8}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          <Text style={styles.generateText}>Generate Full Week with AI</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Day Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay !== null ? weekDates[selectedDay].day : ''} Outfit
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.planOutfitModalButton}>
              <Ionicons name="add-circle-outline" size={24} color="#F97316" />
              <Text style={styles.planOutfitModalText}>Create New Outfit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.chooseExistingButton}>
              <Ionicons name="shirt-outline" size={24} color="#EC4899" />
              <Text style={styles.chooseExistingText}>Choose from Wardrobe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Edit Outfit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Outfit</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            {editingOutfit && (
              <>
                <Image 
                  source={{ uri: editingOutfit.image }} 
                  style={styles.editOutfitImage}
                />
                
                <View style={styles.editOutfitInfo}>
                  <Text style={styles.editOutfitStyle}>{editingOutfit.style}</Text>
                  <Text style={styles.editOutfitItems}>
                    {editingOutfit.items.join(' • ')}
                  </Text>
                </View>
                
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.editActionButton}
                    onPress={() => {
                      setEditModalVisible(false);
                      // Navigate to change outfit items
                      navigation.navigate('Wardrobe', { selectMode: true });
                    }}
                  >
                    <Ionicons name="shirt-outline" size={20} color="#F97316" />
                    <Text style={styles.editActionText}>Change Items</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.editActionButton, styles.editStyleButton]}
                    onPress={() => {
                      setEditModalVisible(false);
                      // Navigate to AI recommendations for this day
                      navigation.navigate('Recommendations');
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color="#EC4899" />
                    <Text style={[styles.editActionText, { color: '#EC4899' }]}>
                      Get AI Suggestions
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.editActionButton, styles.removeButton]}
                    onPress={() => {
                      // Remove outfit logic here
                      setEditModalVisible(false);
                      console.log('Remove outfit for day:', selectedDay);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={[styles.editActionText, { color: '#EF4444' }]}>
                      Remove Outfit
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    letterSpacing: -0.3,
  },
  aiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4EC',
    borderRadius: 22,
  },
  
  // Week Overview
  weekOverview: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  weekTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  plannedCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Content
  scrollContent: {
    paddingBottom: 24,
  },
  daysGrid: {
    paddingHorizontal: 24,
    gap: 16,
  },
  
  // Day Card
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  todayCard: {
    borderWidth: 2,
    borderColor: '#F97316',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  todayText: {
    color: '#F97316',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Outfit Content
  outfitImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  outfitStyle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  itemsList: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF1E6',
    paddingVertical: 8,
    borderRadius: 8,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  
  // Empty Day
  emptyDay: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  addOutfitButton: {
    alignItems: 'center',
  },
  addIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF1E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  
  // Tips Section
  tipsSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  // Generate Button
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  generateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  planOutfitModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFF1E6',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  planOutfitModalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F97316',
  },
  chooseExistingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFE4EC',
    paddingVertical: 16,
    borderRadius: 12,
  },
  chooseExistingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EC4899',
  },
  
  // Edit Modal Styles
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  editOutfitImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  editOutfitInfo: {
    marginBottom: 24,
  },
  editOutfitStyle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  editOutfitItems: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  editActions: {
    gap: 12,
  },
  editActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFF1E6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  editStyleButton: {
    backgroundColor: '#FFE4EC',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  editActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F97316',
  },
});

export default WeeklyPlannerScreen;