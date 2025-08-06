// functions/src/pinecone-setup.js
const functions = require("firebase-functions");
const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize Pinecone
const initPinecone = () => {
  const apiKey = process.env.PINECONE_API_KEY || functions.config().pinecone?.api_key;
  
  if (!apiKey) {
    throw new Error('Pinecone API key not found. Set PINECONE_API_KEY in .env or Firebase config.');
  }
  
  return new Pinecone({ apiKey });
};

// Setup function - creates the main index
exports.setupPineconeForFitcheck = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    console.log('🚀 Setting up Pinecone for FitCheck...');
    
    const pc = initPinecone();
    const indexName = 'fitcheck-main';
    
    // Check if index already exists
    const existingIndexes = await pc.listIndexes();
    const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);
    
    if (indexExists) {
      console.log('✅ Index already exists');
      res.json({
        success: true,
        message: 'Pinecone index already exists and ready to use!',
        indexName: indexName
      });
      return;
    }
    
    // Create the index
    await pc.createIndex({
      name: indexName,
      dimension: 3072, // OpenAI text-embedding-3-large dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    
    console.log('✅ Pinecone index created successfully');
    
    // Wait for index to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    res.json({
      success: true,
      message: 'Pinecone setup complete! Ready to migrate data.',
      indexName: indexName,
      dimension: 3072,
      metric: 'cosine'
    });
    
  } catch (error) {
    console.error('❌ Pinecone setup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test connection
exports.testPineconeConnection = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const pc = initPinecone();
    const indexes = await pc.listIndexes();
    
    res.json({
      success: true,
      message: 'Pinecone connection successful!',
      indexes: indexes.indexes || [],
      totalIndexes: indexes.indexes?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = { initPinecone };