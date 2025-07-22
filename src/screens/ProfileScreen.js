// src/screens/ProfileScreen.js

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'react-native'
import styles from '../styles/ProfileScreenStyles'
import { useAuth } from '../context/AuthContext'

const MOCK_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060,
}

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth()
  const [location, setLocation] = useState(null)
  const [profileImage, setProfileImage] = useState(null)

  // Load any saved (mock) location on mount
  useEffect(() => {
    ;(async () => {
      try {
        const json = await AsyncStorage.getItem('userLocation')
        if (json) setLocation(JSON.parse(json))

        const savedImage = await AsyncStorage.getItem('profileImage')
        if (savedImage) setProfileImage(savedImage)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    })()
  }, [])

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }

  const handleSetMockLocation = async () => {
    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify(MOCK_LOCATION))
      setLocation(MOCK_LOCATION)
      Alert.alert(
        'Mock Location Set',
        `Latitude: ${MOCK_LOCATION.latitude}\nLongitude: ${MOCK_LOCATION.longitude}`
      )
    } catch (err) {
      console.error('Failed to save mock location:', err)
      Alert.alert('Error', 'Could not save location.')
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please grant media library permissions to select a photo.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri)
      await AsyncStorage.setItem('profileImage', result.assets[0].uri)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={100}
                color="#F97316"
                style={styles.profileIcon}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>
            {user ? user.email.split('@')[0] : 'Guest'}
          </Text>
          <Text style={styles.userEmail}>
            {user ? user.email : 'guest@example.com'}
          </Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangeEmail')}
          >
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Change Email</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.settingArrow}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.settingArrow}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.settingArrow}
            />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          {/* Location (mock) */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleSetMockLocation}
          >
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Location</Text>
            <View style={{ flex: 1 }} />
            {location ? (
              <Text style={styles.settingText}>
                {location.latitude.toFixed(3)},{' '}
                {location.longitude.toFixed(3)}
              </Text>
            ) : (
              <Text style={[styles.settingText, { color: '#9CA3AF' }]}>
                Not set
              </Text>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.settingArrow}
            />
          </TouchableOpacity>

          {/* Other preferences */}
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color="#6B7280"
            />
            <Text style={styles.settingText}>Style Profile</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.settingArrow}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Workday Preferences</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
              style={styles.settingArrow}
            />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen
