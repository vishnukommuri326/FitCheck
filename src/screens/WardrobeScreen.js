
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const dummyWardrobeItems = [
  { id: '1', name: 'Blue Jeans', type: 'Bottom', color: 'Blue' },
  { id: '2', name: 'White T-Shirt', type: 'Top', color: 'White' },
  { id: '3', name: 'Leather Jacket', type: 'Outerwear', color: 'Black' },
  { id: '4', name: 'Running Shoes', type: 'Footwear', color: 'Grey' },
  { id: '5', name: 'Summer Dress', type: 'Dress', color: 'Floral' },
];

const WardrobeScreen = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity className="bg-white p-4 my-2 rounded-lg shadow-md w-full">
      <Text className="text-lg font-semibold text-gray-700">{item.name}</Text>
      <Text className="text-sm text-gray-500 mt-1">{item.type} - {item.color}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 pt-5 items-center bg-gray-100">
      <Text className="text-2xl font-bold mb-5 text-gray-800">Your Wardrobe</Text>
      <FlatList
        data={dummyWardrobeItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ width: '100%', paddingHorizontal: 10 }}
      />
    </View>
  );
};

export default WardrobeScreen;
