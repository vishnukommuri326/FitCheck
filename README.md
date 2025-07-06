
# 🎨 StyleMate

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Expo](https://img.shields.io/badge/Expo-SDK%2046-6E6E6E.svg)](https://expo.dev/)  
[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-61DAFB.svg)](https://reactnative.dev/)  

> **Your AI-powered personal stylist** — digitize your closet, pick your work days, and receive a **7-day, weather-aware outfit plan** with swipe feedback and “shop missing items” links.

---

## 📖 Table of Contents

1. [🚀 Key Features](#-key-features)  
2. [🎯 Why StyleMate?](#-why-stylemate)  
3. [🛠 Tech Stack](#-tech-stack)  
4. [📐 Architecture & Data Model](#-architecture--data-model)  
5. [💻 Installation & Local Development](#-installation--local-development)  
6. [📱 Usage Guide](#-usage-guide)  
7. [🔧 Code Snippets & Configuration](#-code-snippets--configuration)  
8. [🔒 Security & Best Practices](#-security--best-practices)  
9. [🤝 Contributing](#-contributing)  
10. [📄 License](#-license)  

---

## 🚀 Key Features

- **🔐 Authentication**  
  Email/password & Google SSO via Firebase Auth  
- **📸 Wardrobe Upload & Tagging**  
  Snap or pick photos → Firebase Storage → auto-tag via Google Vision  
- **🗓 7-Day Outfit Planner**  
  Select workdays → Cloud Function generates daily looks using your wardrobe + local forecast  
- **💬 Swipe Feedback**  
  Like/dislike outfits in a Tinder-style deck to refine your personal style profile  
- **🔔 Push Notifications**  
  Daily or weekly reminders via Firebase Cloud Messaging  
- **🛍 Affiliate Shopping**  
  “Shop missing items” using Amazon Product Advertising API  

---

## 🎯 Why StyleMate?

- **Save Time**: Plan your outfits for the entire week in seconds.  
- **Stay Stylish**: Suggestions adapt to rain, heat, or wind.  
- **Learn Your Taste**: Simple swipes personalize recommendations.  
- **Shop Effortlessly**: Buy any piece you don’t own directly from the app.  

---

## 🛠 Tech Stack

| Layer               | Technology                                           |
|---------------------|-------------------------------------------------------|
| **Mobile**          | Expo-managed React Native, React Navigation           |
| **Backend**         | Firebase (Auth, Firestore, Storage, Functions, FCM)   |
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
users/{uid}/plans/weekly/{weekStart} {
  weekStart:Date, createdAt:Timestamp
}
users/{uid}/plans/weekly/{weekStart}/outfitPlans/{day} {
  date, items:[garmentId], description, shoppingSuggestions:[{title,image,price,affiliateUrl}], generatedAt
}
users/{uid}/preferences/{prefId} {
  planId, tags:[String], liked:Boolean, timestamp
}
````

**Flow:**

1. **Upload →** Firestore metadata → Cloud Function tags via Vision API.
2. **Generate →** Cloud Function fetches forecast, loads tags & styleProfile, prompts OpenAI → writes WeekPlan + OutfitPlans + shopping suggestions.
3. **Feedback →** swipe writes Preference → CF aggregates into styleProfile.
4. **Notify →** CF sends FCM push with deep-link to Week’s Looks.

---

## 💻 Installation & Local Development

1. **Clone & install dependencies**

   ```bash
   git clone https://github.com/vishnukommuri326/StyleMate.git
   cd StyleMate
   npm install
   ```
2. **Configure Firebase**

   * Create a Firebase project; enable Auth, Firestore, Storage, Functions, Messaging.
   * Copy your `firebaseConfig` into `src/firebaseConfig.js` or `app.json`.
   * Set Cloud Function secrets:

     ```bash
     firebase functions:config:set openai.key="YOUR_OPENAI_KEY"
     firebase functions:config:set weather.key="YOUR_OWM_KEY"
     ```
3. **Run your app**

   ```bash
   npx expo start
   ```

   * Scan the QR code with Expo Go (mobile) or press `w` to run in browser.
4. **Deploy Cloud Functions**

   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

---

## 📱 Usage Guide

1. **Sign Up / Sign In** with email or Google.
2. **Onboarding**: enter city & select workday checkboxes.
3. **Upload** at least 5 garment photos.
4. **Plan Your Week**: tap “Generate Weekly Plan.”
5. **View Week’s Looks**: scroll daily outfit cards (weather + images).
6. **Swipe** to refine your taste.
7. **Shop** any missing item via affiliate carousel.
8. **Receive Notifications** when new plans are ready.

---

## 🔧 Code Snippets & Configuration

### Firestore Security Rule

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid}/{doc=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### Sample OpenAI Prompt

```js
const prompt = `
You are a stylist. Wardrobe tags:
- ${tags.join('\n- ')}

7-day forecast for ${location}:
${forecast.map(d=>`${d.day}: High ${d.temp.max}°C, ${d.weather[0].description}`).join('\n')}

Workdays: ${workdays.join(', ')}  
Style profile: ${styleProfile}

Respond with JSON: [{"day":"Mon","items":["..."],"explanation":"..."}, …]
`;
```

---

## 🔒 Security & Best Practices

* **Secrets** in env or Secret Manager
* **Least Privilege** for service accounts
* **Key Rotation** quarterly
* **Dependency Audits** with `npm audit` & Dependabot
* **Crash Reporting**: Firebase Crashlytics & CF Logging

---

## 🤝 Contributing

1. Fork & clone
2. `npm install` → create branch
3. Code & test
4. `git push origin your-branch` → open PR
5. We’ll review & merge

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

```
```
