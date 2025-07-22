// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import * as Google from 'expo-auth-session/providers/google'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth } from '../../firebase.config' // Assuming firebase.config.js exports 'auth'
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

  // build a redirect URI that matches what you whitelisted in Firebase
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    projectNameForProxy: '@vk326/FitCheck',
  })

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '768571758877-8qt1jki1pgtnrrj5nho8jv3o7srr9fd4.apps.googleusercontent.com',
    iosClientId: '68571758877-d36760meuro60sinvvdqdmtc473ms9dl.apps.googleusercontent.com',
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  })

  // listen for auth state changes (Firebase)
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

  // handle the response from Google auth
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication
      const credential = GoogleAuthProvider.credential(id_token)
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const usr = userCredential.user
          setUser(usr)
          await AsyncStorage.setItem('user', JSON.stringify(usr))
          console.log('Google Sign-In successful', usr)
        })
        .catch((error) => {
          console.error('Firebase authentication error:', error)
        })
    }
  }, [response])

  // email/password login
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // email/password signup
  const signUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  // trigger Google OAuth flow
  const googleSignIn = async () => {
    try {
      await promptAsync({ useProxy: true })
    } catch (error) {
      console.error('Error with Google Sign-In prompt:', error)
    }
  }

  // sign out
  const logout = async () => {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, googleSignIn, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
