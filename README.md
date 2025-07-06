 1 # StyleMate: Your AI Outfit Planner
 2 
 3 StyleMate is a cross-platform mobile application built with React Native (Expo) that functions as a weekly AI outfit planner. It helps you digitize your wardrobe, select workdays, and receive a full week of weather-aware outfit suggestions—complete with swipe feedback and affiliate “shop missing items” links.
 4 
 5 ## Features
 6 
 7 * **User Management:** Secure authentication (Email/Password and Google SSO via Firebase Auth)
 8 * **Wardrobe Upload & Tagging:** Snap or select photos, upload to Firebase Storage, automatic tagging via Google Cloud Vision
 9 * **Weekly Outfit Planner:** Select workdays and generate a 7-day outfit plan based on local weather (OpenWeatherMap)
10 * **Swipe Feedback:** Like/dislike outfits in a Tinder-style deck to refine your style profile (OpenAI Embeddings)
11 * **Push Notifications:** Receive reminders when your plan is ready (Firebase Cloud Messaging)
12 * **Affiliate Shopping:** “Shop missing items” via Amazon Product Advertising API
13 
14 ## Data Models
15 
16 **User**  
17 - `uid` (string): Unique user identifier  
18 - `email` (string): Email address  
19 - `location` (string): City or GPS coordinates  
20 - `fcmToken` (string): Firebase Cloud Messaging token  
21 - `workdays` (number[]): Array indices 0–6 for Mon–Sun  
22 - `styleProfile` (string): Summarized style preferences  
23 
24 **Garment**  
25 - `id` (string): Unique garment identifier  
26 - `ownerUid` (string): Reference to user `uid`  
27 - `imageUrl` (string): URL of uploaded image  
28 - `tags` (string[]): Auto-generated labels (e.g. “denim”, “shirt”)  
29 - `uploadedAt` (timestamp): Upload time  
30 
31 **OutfitPlan**  
32 - `id` (string): Unique plan identifier  
33 - `ownerUid` (string): Reference to user `uid`  
34 - `date` (string): ISO date (YYYY-MM-DD)  
35 - `items` (string[]): Array of `Garment.id`  
36 - `description` (string): Outfit summary  
37 - `generatedAt` (timestamp): AI generation time  
38 - `shoppingSuggestions` (object[]): Optional affiliate listings  
39 
40 **WeekPlan**  
41 ```
42 users/{uid}/plans/weekly/{weekStart}
43   weekStart: Date
44   createdAt: Timestamp
45   outfitPlans/{day} → OutfitPlan
46 ```
47 
48 **Preference**  
49 - `planId` (string): Associated `OutfitPlan.id`  
50 - `tags` (string[]): Tags from that outfit  
51 - `liked` (boolean): true = like, false = dislike  
52 - `timestamp` (timestamp): When feedback recorded  
53 
54 ## Installation & Setup
55 
56 1. **Clone & install dependencies**  
57    ```bash
58    git clone https://github.com/YOUR_USERNAME/StyleMate.git
59    cd StyleMate
60    npm install
61    ```
62 
63 2. **Configure Firebase**  
64    - Create a Firebase project; enable Auth, Firestore, Storage, Functions, Messaging  
65    - Add your Firebase config to `app.json` or `src/firebaseConfig.js`  
66    - Set function secrets:
67      ```bash
68      firebase functions:config:set openai.key="YOUR_OPENAI_KEY"
69      firebase functions:config:set weather.key="YOUR_OWM_KEY"
70      ```
71 
72 3. **Run the app**  
73    ```bash
74    npx expo start
75    ```
76    - Scan QR with Expo Go or press `w` for web  
77 
78 4. **Deploy Cloud Functions**  
79    ```bash
80    cd functions
81    npm install
82    firebase deploy --only functions
83    ```
84 
85 ## Project Structure
86 
87 ```
88 StyleMate/
89 ├── App.js
90 ├── index.js
91 ├── app.json
92 ├── package.json
93 ├── assets/
94 ├── src/
95 │   ├── navigation/
96 │   │   └── AppNavigator.js
97 │   ├── screens/
98 │   │   ├── LoginScreen.js
99 │   │   ├── SignUpScreen.js
100│   │   ├── HomeScreen.js
101│   │   └── WardrobeScreen.js
102│   └── firebaseConfig.js
103└── functions/
104
105LICENSE
106README.md
107```
108
109## Security & Best Practices
110
111* Store API keys in environment variables or GCP Secret Manager
112* Firestore Rules:
113  ```js
114  rules_version = '2';
115  service cloud.firestore {
116    match /databases/{db}/documents {
117      match /users/{uid}/{doc=**} {
118        allow read, write: if request.auth.uid == uid;
119      }
120    }
121  }
122  ```
123* Use least-privilege IAM for service accounts
124* Rotate keys regularly
125* Run `npm audit` and configure Dependabot for dependencies
126
127## Contributing
128
1291. Fork the repository
1302. Clone and `npm install`
1313. Create a feature branch (`git checkout -b feature/name`)
1324. Code, test, and commit
1335. Push and open a Pull Request
134
135## License
136
137This project is licensed under the MIT License. See the `LICENSE` file for details.
