
# 🎨 FitCheck

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Expo](https://img.shields.io/badge/Expo-SDK%2046-6E6E6E.svg)](https://expo.dev/)  
[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-61DAFB.svg)](https://reactnative.dev/)  

> **Your AI-powered personal stylist** — digitize your closet, refine your style through swipes, generate weather-aware weekly plans, and even test new purchases in-store before you buy.

---

## 📖 Table of Contents

1. [🚀 Key Features](#-key-features)  
2. [🎯 Why StyleMate?](#-why-stylemate)  
3. [🛠 Tech Stack](#-tech-stack)  
4. [📐 Architecture & Data Model](#-architecture--data-model)  
5. [💻 Installation & Local Development](#-installation--local-development)  
6. [📱 Usage Guide](#-usage-guide)  
7. [🔧 Fashion Methodology & Style Guides](#-fashion-methodology--style-guides)  
8. [🔒 Security & Best Practices](#-security--best-practices)  
9. [🤝 Contributing](#-contributing)  
10. [📄 License](#-license)  

---

## 🚀 Key Features

- **🔐 Authentication**  
  Email/password & Google SSO via Firebase Auth  
- **📸 Wardrobe Catalog**  
  Snap or pick photos → Firebase Storage → auto-tag via Google Vision  
- **🗓 Weekly Planner**  
  Select your workdays → AI generates a **7-day, weather-aware outfit schedule**  
- **💬 Like/Dislike Feedback**  
  Swipe through outfits “Tinder-style” and optionally explain why you disliked something to refine your style profile  
- **🛒 In-Store Matching**  
  Snap a photo of an item in a store → instantly see what it pairs with in your home closet  
- **🏬 Shop Missing Items**  
  Affiliate links via Amazon Product Advertising API for pieces you’re missing  
- **🔔 Push Notifications**  
  Daily or weekly reminders via Firebase Cloud Messaging  

---

## 🎯 Why FitCheck?

- **Plan Your Week**  
  Never scramble each morning—get a full week of outfits tailored to forecast and your taste.  
- **Learn by Doing**  
  Every swipe and text-reason you give teaches the AI *why* you like or dislike an outfit.  
- **Shop with Confidence**  
  Instantly validate store finds against your existing wardrobe before you buy.  
- **Expert-Backed Guidance**  
  Powered by color theory, silhouette balance, and occasion-appropriate styling—so suggestions feel intentional.  
- **Addictive Interaction**  
  Quick swipes, in-store matches, and daily reveals keep you engaged.

---

## 🛠 Tech Stack

| Layer               | Technology                                           |
|---------------------|-------------------------------------------------------|
| **Mobile**          | Expo-managed React Native, React Navigation           |
| **Auth & Data**     | Firebase Auth, Firestore, Storage, Functions, FCM     |
| **Vision & AI**     | Google Cloud Vision, OpenAI Embeddings & Completions |
| **Weather**         | OpenWeatherMap One Call API                           |
| **Shopping**        | Amazon Product Advertising API                        |
| **CI/CD & Hosting** | GitHub Actions, Expo Application Services (EAS)       |

---

## 📐 Architecture & Data Model

```text
users/{uid} {
  email, location, workdays:[Mon…Sun], fcmToken, styleProfile
}
users/{uid}/garments/{garmentId} {
  imageUrl, tags:[String], uploadedAt
}
users/{uid}/preferences/{prefId} {
  planId, tags:[String], liked:Boolean, reasonText?, timestamp
}
users/{uid}/plans/weekly/{weekStart}/outfitPlans/{day} {
  date, items:[garmentId], description, shoppingSuggestions:[…], generatedAt
}
````

**Data Flow**

1. **Upload** → Firestore writes + Vision tags
2. **Plan** → fetch forecast + user profile → prompt OpenAI → store weekly plan
3. **Feedback** → swipe or reasonText → update `preferences` → update `styleProfile`
4. **In-Store** → snap & match via AI → surface top home items
5. **Notify** → FCM pushes daily/weekly reminders

---

## 💻 Installation & Local Development

1. **Clone & install**

   ```bash
   git clone https://github.com/vishnukommuri326/StyleMate.git
   cd StyleMate
   npm install
   ```
2. **Configure Firebase**

   * Enable Auth, Firestore, Storage, Functions, Messaging
   * Create `src/firebaseConfig.js` with your Firebase settings
   * Set function secrets:

     ```bash
     firebase functions:config:set openai.key="YOUR_OPENAI_KEY"
     firebase functions:config:set weather.key="YOUR_OWM_KEY"
     ```
3. **Run the app**

   ```bash
   npx expo start
   ```

   *Scan the QR code with Expo Go or press `w` to run on web.*
4. **Deploy Cloud Functions**

   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

---

## 📱 Usage Guide

1. **Sign Up / Log In**
2. **Onboarding**: grant location & pick your weekly workdays
3. **Catalog** at least 5 garments in your closet
4. **Generate Weekly Plan**: tap “Generate Plan” for a full 7-day schedule
5. **Swipe Feedback**: like/dislike outfits to train your AI stylist (with optional reason text)
6. **In-Store Matching**: in a shop? tap “Match in Closet,” snap a photo, and see which home pieces pair best
7. **Shop Missing**: view affiliate links for suggested pieces you don't own
8. **Get Reminders** via push notifications for new plans or sale alerts

---

## 🔧 Fashion Methodology & Style Guides

We embed industry-proven style principles in our AI prompts to ensure recommendations feel thoughtful:

* **Color Theory**: complementary, analogous, triadic palettes
* **Silhouette & Proportion**: balancing fitted vs. relaxed, layering hierarchies
* **Texture & Contrast**: mixing fabrics and patterns for depth
* **Occasion & Function**: tailoring looks for work, casual, evening, or seasonal needs

---

## 🔒 Security & Best Practices

* **Secrets** via Firebase Functions config
* **Least Privilege** in Firestore security rules
* **Dependency Audits** with `npm audit` & Dependabot
* **Crash Reporting** via Firebase Crashlytics & Cloud Functions logs

---

## 🤝 Contributing

1. Fork & clone
2. `npm install` → create a feature branch
3. Implement & test your changes
4. `git push origin your-branch` → open a Pull Request
5. We’ll review, iterate, and merge

---

## 📄 License

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

```
::contentReference[oaicite:0]{index=0}
```
