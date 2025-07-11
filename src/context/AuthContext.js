import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // In a real app, you'd call an API here to authenticate
    console.log(`Attempting to log in user: ${email}`);
    setUser({ uid: '123', email: email, location: 'New York, USA', fcmToken: 'someFCMToken123' }); // Simulate successful login
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};