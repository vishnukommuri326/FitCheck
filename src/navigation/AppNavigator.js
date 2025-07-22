import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import AddItemScreen from '../screens/AddItemScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import WeeklyPlannerScreen from '../screens/WeeklyPlannerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangeEmailScreen from '../screens/ChangeEmailScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ScannerScreen from '../screens/ScannerScreen';
import OutfitSwiper from '../screens/OutfitSwiperScreen.js';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator initialRouteName="Home">
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Wardrobe" component={WardrobeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
    <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'AI Recommendations' }} />
    <Stack.Screen name="WeeklyPlanner" component={WeeklyPlannerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="OutfitSwiper" component={OutfitSwiper} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
