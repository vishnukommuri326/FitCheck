import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/ProfileScreenStyles';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.profileCard}>
          <Ionicons name="person-circle-outline" size={100} color="#F97316" style={styles.profileIcon} />
          <Text style={styles.userName}>{user ? user.email.split('@')[0] : 'Guest'}</Text>
          <Text style={styles.userEmail}>{user ? user.email : 'guest@example.com'}</Text>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangeEmail')}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Change Email</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.settingArrow} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangePassword')}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.settingArrow} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.settingArrow} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Location</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="color-palette-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Style Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.settingArrow} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.settingText}>Workday Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.settingArrow} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
