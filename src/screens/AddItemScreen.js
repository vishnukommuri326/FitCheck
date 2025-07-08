
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

const AddItemScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);

  const handleTakePicture = () => {
    // In a real app, this would open the camera.
    // For now, we'll use a placeholder image.
    setImageUri('https://via.placeholder.com/150'); // Placeholder image
  };

  const handleGetRecommendations = () => {
    // This would involve sending the actual image to AI.
    navigation.navigate('Recommendations');
  };

  return (
    <View className="flex-1 justify-center items-center p-5 bg-gray-100">
      <Text className="text-2xl font-bold mb-5 text-gray-800">Add New Item</Text>
      <TouchableOpacity
        className="bg-blue-500 py-3 px-6 rounded-lg my-2 w-4/5 items-center"
        onPress={handleTakePicture}
      >
        <Text className="text-white text-base font-bold">Take Picture</Text>
      </TouchableOpacity>
      {imageUri && (
        <View className="mt-5 items-center">
          <Image source={{ uri: imageUri }} className="w-40 h-40 resize-contain mb-3 border border-gray-300" />
          <TouchableOpacity
            className="bg-green-500 py-3 px-6 rounded-lg my-2 w-4/5 items-center"
            onPress={handleGetRecommendations}
          >
            <Text className="text-white text-base font-bold">Get AI Recommendations</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AddItemScreen;
