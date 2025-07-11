import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/ChangeEmailScreenStyles';
import { useAuth } from '../context/AuthContext';

const ChangeEmailScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Email</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Current Email</Text>
          <TextInput style={styles.input} value={user ? user.email : ''} editable={false} />

          <Text style={styles.label}>New Email</Text>
          <TextInput style={styles.input} placeholder="new.email@example.com" keyboardType="email-address" />

          <Text style={styles.label}>Confirm New Email</Text>
          <TextInput style={styles.input} placeholder="new.email@example.com" keyboardType="email-address" />

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Update Email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangeEmailScreen;