// functions/index.js - Main entry point

// Import all function modules
const testFunctions = require('./src/test-functions');
const visionFunctions = require('./src/vision-functions');

// Export all functions for deployment
module.exports = {
  // Test functions
  ...testFunctions,
  
  // Vision AI functions
  ...visionFunctions
};