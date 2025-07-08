import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to StyleMate!</Text>
      <Text style={styles.subtitle}>Your AI Outfit Planner</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Wardrobe')}
      >
        <Text style={styles.buttonText}>Go to My Wardrobe</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddItem')}
      >
        <Text style={styles.buttonText}>Add a New Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',  // gray-100
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,                // text-3xl
    fontWeight: '700',           // font-bold
    color: '#1F2937',            // gray-800
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,                // text-lg
    color: '#4B5563',            // gray-600
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#6D28D9',  // purple-700
    paddingVertical: 12,         // py-3
    paddingHorizontal: 24,       // px-6
    borderRadius: 12,            // rounded-lg
    width: '80%',
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,                // text-base
    fontWeight: '700',           // font-bold
  },
});

export default HomeScreen;
