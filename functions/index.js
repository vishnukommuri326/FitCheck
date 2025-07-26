// functions/index.js - Main entry point

// Import all function modules
const testFunctions = require('./src/test-functions');
const geminiFunctions = require('./src/gemini-vision');
const wardrobeFunctions = require('./src/wardrobe-compatibility'); 

// Export all functions for deployment
module.exports = {
  // Test functions
  ...testFunctions,
  
  // Gemini Vision functions
  ...geminiFunctions,

  ...wardrobeFunctions
};