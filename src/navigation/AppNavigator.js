
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import AddItemScreen from '../screens/AddItemScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'StyleMate' }} />
        <Stack.Screen name="Wardrobe" component={WardrobeScreen} options={{ title: 'My Wardrobe' }} />
        <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
        <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'AI Recommendations' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
