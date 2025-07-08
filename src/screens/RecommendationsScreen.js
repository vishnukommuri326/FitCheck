
import React from 'react';
import { View, Text, FlatList, Image } from 'react-native';

const dummyRecommendations = [
  { id: '1', name: 'Matching Scarf', imageUrl: 'https://via.placeholder.com/100/FF0000/FFFFFF?text=Scarf' },
  { id: '2', name: 'Complementary Shoes', imageUrl: 'https://via.placeholder.com/100/0000FF/FFFFFF?text=Shoes' },
  { id: '3', name: 'Accessory Bag', imageUrl: 'https://via.placeholder.com/100/00FF00/FFFFFF?text=Bag' },
  { id: '4', name: 'Different Top', imageUrl: 'https://via.placeholder.com/100/FFFF00/000000?text=Top' },
];

const RecommendationsScreen = () => {
  const renderItem = ({ item }) => (
    <View className="bg-white p-3 m-2 rounded-lg shadow-md items-center w-2/5">
      <Image source={{ uri: item.imageUrl }} className="w-24 h-24 rounded-full mb-2 border border-gray-300" />
      <Text className="text-base font-semibold text-center text-gray-700">{item.name}</Text>
    </View>
  );

  return (
    <View className="flex-1 pt-5 items-center bg-gray-100">
      <Text className="text-2xl font-bold mb-2 text-gray-800">AI Recommendations</Text>
      <Text className="text-base text-center mb-5 text-gray-600">Here are some items that go well with your new addition:</Text>
      <FlatList
        data={dummyRecommendations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2} // Display in 2 columns
        columnWrapperStyle={{ justifyContent: 'space-around' }}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </View>
  );
};

export default RecommendationsScreen;
