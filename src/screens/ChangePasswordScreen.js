import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/ChangePasswordScreenStyles';

const ChangePasswordScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput style={styles.input} secureTextEntry={true} />

          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} secureTextEntry={true} />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput style={styles.input} secureTextEntry={true} />

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;