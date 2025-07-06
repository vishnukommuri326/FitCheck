 1 # StyleMate: Your AI Outfit Planner
    2 
    3 StyleMate is a cross-platform mobile application built with React Native (Expo) that functions as a weekly AI outfit planner. It aims to help users manage their
      wardrobe and plan outfits efficiently, leveraging AI for smart suggestions.
    4 
    5 ## Features
    6 
    7 *   **User Management:** Secure user authentication (Login, Sign Up).
    8 *   **Outfit Planning:** Plan outfits for specific dates.
    9 *   **Garment Management:** Upload and tag your clothing items.
   10 *   **AI-Powered Suggestions (Future):** Intelligent outfit recommendations based on user preferences and weather (planned).
   11 *   **Amazon Product Advertising API Integration (Planned):** For affiliate listings of missing items.
   12 
   13 ## Data Models
   14 
   15 The application utilizes the following core data models:
   16 
   17 *   **User:**
   18     *   `uid`: Unique user identifier.
   19     *   `email`: User's email address.
   20     *   `location`: User's geographical location.
   21     *   `fcmToken`: Firebase Cloud Messaging token for notifications.
   22     *   `workdays`: Array of numbers [0-6] representing working days.
   23     *   `styleProfile`: String describing the user's style preferences.
   24 *   **Garment:**
   25     *   `id`: Unique garment identifier.
   26     *   `ownerUid`: User ID of the garment owner.
   27     *   `imageUrl`: URL to the garment's image.
   28     *   `tags`: Array of strings for garment categorization (e.g., "casual", "summer", "shirt").
   29     *   `uploadedAt`: Timestamp of when the garment was uploaded.
   30 *   **OutfitPlan:**
   31     *   `id`: Unique outfit plan identifier.
   32     *   `ownerUid`: User ID of the outfit plan owner.
   33     *   `date`: Date of the planned outfit (YYYY-MM-DD).
   34     *   `items`: Array of garment IDs included in the outfit.
   35     *   `description`: Text description of the outfit.
   36     *   `generatedAt`: Timestamp of when the outfit plan was generated.
   37 
   38 ## Getting Started
   39 
   40 ### Prerequisites
   41 
   42 Before you begin, ensure you have the following installed:
   43 
   44 *   Node.js (LTS version recommended)
   45 *   npm or Yarn
   46 *   Expo CLI: `npm install -g expo-cli`
   47 
   48 ### Installation
   49 
   50 1.  **Clone the repository:**

      git clone https://github.com/your-username/StyleMate.git
      cd StyleMate

   1 2.  **Install dependencies:**

      npm install
  or
      yarn install

   1 
   2 ### Running the Application
   3 
   4 To run the application in development mode:

  expo start


   1 
   2 This will open a new tab in your browser with Expo Dev Tools. You can then:
   3 *   Scan the QR code with the Expo Go app on your physical device (iOS or Android).
   4 *   Run on an Android emulator.
   5 *   Run on an iOS simulator (macOS only).
   6 *   Run in a web browser.
   7 
   8 ## Project Structure

  .
  ├── App.js              # Main application entry point
  ├── app.json            # Expo configuration
  ├── index.js            # Entry point for React Native
  ├── package.json        # Project dependencies and scripts
  ├── assets/             # Static assets (images, fonts)
  ├── src/
  │   ├── components/     # Reusable UI components
  │   ├── navigation/     # Navigation setup (e.g., AppNavigator.js)
  │   │   └── AppNavigator.js
  │   ├── screens/        # Main application screens
  │   │   ├── HomeScreen.js
  │   │   ├── LoginScreen.js
  │   │   └── SignUpScreen.js
  │   └── styles/         # Externalized stylesheets
  │       ├── HomeScreenStyles.js
  │       ├── LoginScreenStyles.js
  │       └── SignUpScreenStyles.js
  └── README.md           # Project README (this file)


    1 
    2 ## Contributing
    3 
    4 Contributions are welcome! Please follow these steps:
    5 
    6 1.  Fork the repository.
    7 2.  Create a new branch (`git checkout -b feature/your-feature-name`).
    8 3.  Make your changes.
    9 4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
   10 5.  Push to the branch (`git push origin feature/your-feature-name`).
   11 6.  Open a Pull Request.
   12 
   13 ## License
   14 
   15 This project is licensed under the MIT License - see the LICENSE file for details. (Note: You might need to create a LICENSE file if you don't have one.)
   16 
   17 ## Contact
   18 
   19 For any questions or inquiries, please contact [Your Name/Email/GitHub Profile].
