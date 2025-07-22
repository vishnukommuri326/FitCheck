// functions/src/test-functions.js
const functions = require("firebase-functions");

// Simple test function to verify deployment
exports.testFunction = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({
    message: "Firebase Functions are working!",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    status: "healthy",
    service: "fitcheck-functions",
    version: "1.0.0"
  });
});