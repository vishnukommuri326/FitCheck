// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AuthSession from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { auth } from '../../firebase.config'
import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

WebBrowser.maybeCompleteAuthSession()

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const redirectUri = 'https://auth.expo.io/@vk326/FitCheck'

  console.log('Using redirect URI:', redirectUri)

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '768571758877-8qt1jki1pgtnrrj5nho8jv3o7srr9fd4.apps.googleusercontent.com',
    webClientId: '768571758877-8qt1jki1pgtnrrj5nho8jv3o7srr9fd4.apps.googleusercontent.com',
    iosClientId: '768571758877-d36760meuro60sinvvdqdmtc473ms9dl.apps.googleusercontent.com',
    androidClientId: '768571758877-huha081jdrq9kt2ontml26ro459pulbd.apps.googleusercontent.com',
    redirectUri,
  })

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params
      const credential = GoogleAuthProvider.credential(id_token)
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log('Google Sign-In successful', userCredential.user)
        })
        .catch((error) => {
          console.error('Firebase sign-in error:', error)
        })
    }
  }, [response])

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr)
        await AsyncStorage.setItem('user', JSON.stringify(usr))
      } else {
        setUser(null)
        await AsyncStorage.removeItem('user')
      }
    })
    return () => unsubscribe()
  }, [])

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const googleSignIn = async () => {
    await promptAsync()
  }

  const logout = async () => {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, googleSignIn, signUp, request }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)