
import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/HomeScreenStyles';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to StyleMate!</Text>
      <Text style={styles.subtitle}>Your AI Outfit Planner</Text>
    </View>
  );
};

export default HomeScreen;
