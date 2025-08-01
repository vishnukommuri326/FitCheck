const admin = require('firebase-admin');
admin.initializeApp();

// Import all function modules
const testFunctions = require('./src/test-functions');
const geminiFunctions = require('./src/gemini-vision');
const trueImageRAG = require('./src/true-image-rag');


// Export all functions for deployment
module.exports = {
  // Test functions
  ...testFunctions,
  
  // Gemini Vision functions
  ...geminiFunctions,
  
  // True Image RAG functions
  ...trueImageRAG,
};