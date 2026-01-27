import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  useEffect(() => {
    console.log('Redirect URI:', makeRedirectUri());
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;