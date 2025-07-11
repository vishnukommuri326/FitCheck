import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/EditProfileScreenStyles';
import { useAuth } from '../context/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="John Doe" value={user ? user.email.split('@')[0] : ''} />

          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="New York, USA" value={user ? user.location : ''} />

          

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;