

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import styles from '../styles/WardrobeScreenStyles.js';

const dummyWardrobeItems = [
  { id: '1', name: 'Blue Jeans', type: 'Bottom', color: 'Blue' },
  { id: '2', name: 'White T-Shirt', type: 'Top', color: 'White' },
  { id: '3', name: 'Leather Jacket', type: 'Outerwear', color: 'Black' },
  { id: '4', name: 'Running Shoes', type: 'Footwear', color: 'Grey' },
  { id: '5', name: 'Summer Dress', type: 'Dress', color: 'Floral' },
  { id: '6', name: 'Black Trousers', type: 'Bottom', color: 'Black' },
];

const WardrobeScreen = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Image source={{ uri: `https://picsum.photos/seed/${item.id}/150` }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>{item.type} - {item.color}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Wardrobe</Text>
      <FlatList
        data={dummyWardrobeItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        key={2} // Add key to force re-render on numColumns change
        contentContainerStyle={{ alignItems: 'center' }}
      />
    </View>
  );
};

export default WardrobeScreen;

