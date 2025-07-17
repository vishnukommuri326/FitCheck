// functions/src/test-functions.js - Basic test functions (from your existing code)

const functions = require("firebase-functions");

// Test function that works
exports.openTest = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.json({
    success: true,
    message: "✅ Open function working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    body: req.body
  });
});

// Keep existing working functions
exports.hello = functions.https.onCall((data, context) => {
  return {
    message: "Hello from Firebase Functions!",
    timestamp: new Date().toISOString(),
    status: "working"
  };
});

// Original function for backward compatibility
exports.processWardrobeItem = functions.https.onCall(async (data, context) => {
  // Fallback to mock data
  return {
    success: true,
    visionData: {
      tags: ['clothing', 'shirt', 'casual'],
      colors: ['#4169E1'],
      confidence: 0.8
    },
    geminiAnalysis: {
      itemName: 'Blue Cotton Shirt',
      category: 'Tops',
      styleCategory: 'casual',
      color: 'Blue',
      detailedDescription: 'A casual blue cotton shirt.'
    }
  };
});