````markdown
# 🎨 StyleMate

**Your AI-powered personal stylist**  
Upload your wardrobe, select workdays, and get a **7-day, weather-aware outfit plan** with simple swipe feedback and “shop missing items” links.

---

## 🚀 Key Features

- **Authentication**: Email/password & Google SSO (Firebase Auth)  
- **Wardrobe Upload**: Snap or pick photos → Firebase Storage → auto-tag via Google Cloud Vision  
- **Weekly Planner**: 7-day outfit calendar based on your workdays + local weather (OpenWeatherMap)  
- **Swipe Feedback**: Like/dislike to refine your style profile (OpenAI Embeddings)  
- **Push Notifications**: Reminders when your plan is ready (Firebase Cloud Messaging)  
- **Affiliate Shopping**: “Shop missing items” via Amazon Product Advertising API  

---

## 🛠 Tech Stack

- **Mobile**: Expo-managed React Native, React Navigation  
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, FCM)  
- **AI & Vision**: Google Cloud Vision API, OpenAI GPT-4 (Chat & Embeddings)  
- **Weather**: OpenWeatherMap One Call API  
- **Shopping**: Amazon Product Advertising API  

---

## 📦 Installation & Setup

1. **Clone & install**  
   ```bash
   git clone https://github.com/YOUR_USERNAME/StyleMate.git
   cd StyleMate
   npm install
````

2. **Configure Firebase**

   * Create a Firebase project, enable Auth/Firestore/Storage/Functions/Messaging
   * Copy your config into `app.json` or `src/firebaseConfig.js`
   * Set Cloud Function secrets:

     ```bash
     firebase functions:config:set openai.key="YOUR_OPENAI_KEY"
     firebase functions:config:set weather.key="YOUR_OWM_KEY"
     ```
3. **Run the app**

   ```bash
   npx expo start
   ```

   * Scan the QR code with **Expo Go** (mobile) or press `w` for web preview
4. **Deploy Functions**

   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

---

## 📱 Usage

1. Sign up / Sign in.
2. Enter your location & workdays.
3. Upload at least 5 garment photos.
4. Tap **“Generate Weekly Plan”**.
5. Browse Day-by-Day outfits.
6. Swipe to refine your style.
7. Tap “Shop Missing Items” for affiliate links.
8. Receive push notifications when new plans are ready.

---

## 🔒 Security

* Store API keys in environment variables or Secret Manager.
* Firestore rules:

  ```js
  match /users/{uid}/{doc=**} {
    allow read, write: if request.auth.uid == uid;
  }
  ```
* Use least-privilege for service accounts, rotate keys regularly.

---

## 🤝 Contributing

1. Fork & clone this repo
2. `npm install` → create a feature branch
3. Code, test & commit
4. Push & open a Pull Request

---

## 📄 License

This project is licensed under MIT. See `LICENSE` for details.

```
```
