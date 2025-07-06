 1 # StyleMate: Your AI Outfit Planner
 2 
 3 ## Deployment
 4 Live demo: (not deployed – running locally via Expo)
 5 
 6 ## Product Vision Statement
 7 StyleMate is a mobile-first, AI-driven wardrobe assistant that helps busy individuals plan a full week of outfits tailored to their personal style, work schedule, and local weather. By digitizing your closet, auto-tagging garments, and leveraging GPT-4 and real-time forecasts, StyleMate removes the daily decision fatigue of “what to wear,” while learning your preferences through simple swipe feedback. Missing items are linked directly to Amazon for seamless shopping.
 8 
 9 ## Team Members
10 * Vishnu Kommuri (https://github.com/vishnukommuri326)
11 
12 ## History of the Project
13 StyleMate began as a solution to the everyday struggle of selecting outfits in advance. Early wireframes focused on a single “Tomorrow’s Look,” but user feedback demanded a full weekly planner. Over several design sprints, we added workday selectors, a Tinder-style feedback loop, and affiliate shopping integration. Today, StyleMate unites AI, Weather APIs, and Google Vision in a cohesive, secure Firebase-backed app.
14 
15 ## How to Contribute
16 We welcome community contributions!  
17 1. Review our [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines.  
18 2. Fork this repository.  
19 3. Create a feature branch (`git checkout -b feature/your-feature`).  
20 4. Commit changes (`git commit -m "feat: description"`).  
21 5. Push and open a Pull Request.
22 
23 ## Building & Testing
24 ### Prerequisites
25 * Node.js (LTS) & npm or Yarn  
26 * Expo CLI (`npm install -g expo-cli`)  
27 * Firebase CLI (`npm install -g firebase-tools`)
28 
29 ### Getting Started
30 1. Clone & install dependencies:
31    ```bash
32    git clone https://github.com/vishnukommuri326/StyleMate.git
33    cd StyleMate
34    npm install
35    ```
36 2. Configure Firebase:
37    - Create a Firebase project; enable Auth, Firestore, Storage, Functions, Messaging.  
38    - Copy your config into `app.json` or `src/firebaseConfig.js`.  
39    - Set Cloud Function secrets:
40      ```bash
41      firebase functions:config:set openai.key="YOUR_OPENAI_KEY"
42      firebase functions:config:set weather.key="YOUR_OWM_KEY"
43      ```
44 3. Run the mobile app:
45    ```bash
46    npx expo start
47    ```
48    - Scan QR with Expo Go or press `w` for web preview.
49 4. Deploy backend functions:
50    ```bash
51    cd functions
52    npm install
53    firebase deploy --only functions
54    ```
55 
56 ## API Endpoints
57 ### Garments
58 - **GET** `/api/garments` – List all garments for the authenticated user  
59 - **POST** `/api/garments` – Upload a new garment (image URL + metadata)  
60 
61 ### Outfit Plans
62 - **POST** `/api/plans/weekly` – Generate or regenerate the 7-day outfit plan  
63 - **GET** `/api/plans/weekly/:weekStart` – Retrieve a saved WeekPlan  
64 
65 ### Feedback
66 - **POST** `/api/preferences` – Record like/dislike feedback for an OutfitPlan  
67 
68 ### Notifications
69 - **POST** `/api/notifications` – Trigger push notifications for ready plans  
70 
71 ## License
72 This project is licensed under the MIT License. See `LICENSE` for details.
