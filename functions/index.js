// functions/index.js
const admin = require('firebase-admin');
admin.initializeApp();

// Import all function modules
const testFunctions = require('./src/test-functions');
const geminiFunctions = require('./src/gemini-vision');
const trueImageRAG = require('./src/true-image-rag');
const pineconeSetup = require('./src/pinecone-setup');
const migration = require('./src/migration');
const pineconeSync = require('./src/pinecone-sync');  

module.exports = {
  // Existing functions
  ...testFunctions,
  ...geminiFunctions,
  ...trueImageRAG,
  ...pineconeSetup,
  ...migration,
  ...pineconeSync,  
};