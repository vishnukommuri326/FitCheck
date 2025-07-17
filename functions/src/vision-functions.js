// functions/src/vision-functions.js - Vision API functions (from your existing code)

const functions = require("firebase-functions");
const { generateSmartAnalysis } = require('./helpers/analysis-helpers');

// HTTP version that works (your existing working function)
exports.processWardrobeItemHTTP = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const data = req.body.data || req.body;
    const { imageUrl, userId } = data;
    
    console.log('🚀 HTTP processWardrobeItem called with:', data);
    
    if (!imageUrl) {
      res.status(400).json({
        error: 'imageUrl is required'
      });
      return;
    }
    
    // Try to use Vision API if available
    let visionData = null;
    
    try {
      // Set up Vision API with explicit credentials
      const vision = require('@google-cloud/vision');
      const path = require('path');
      
      // Point to the credentials file in the functions folder
      const keyPath = path.join(__dirname, '../fitcheck-vision.json');
      console.log('🔍 Looking for credentials at:', keyPath);
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Credentials file not found at ${keyPath}`);
      }
      
      const client = new vision.ImageAnnotatorClient({
        keyFilename: keyPath
      });
      
      console.log('🔍 Vision API: Client created with credentials');
      console.log('🔍 Vision API: Attempting to analyze image:', imageUrl);
      
      // Test with a simple operation first
      console.log('🔍 Vision API: Starting label detection...');
      const [labelResult] = await client.labelDetection(imageUrl);
      console.log('🔍 Vision API: Label detection completed');
      
      console.log('🔍 Vision API: Starting object detection...');
      const [objectResult] = await client.objectLocalization(imageUrl);
      console.log('🔍 Vision API: Object detection completed');
      
      console.log('🔍 Vision API: Starting color analysis...');
      const [colorResult] = await client.imageProperties(imageUrl);
      console.log('🔍 Vision API: Color analysis completed');
      
      // Extract labels (tags)
      const labels = labelResult.labelAnnotations || [];
      console.log('🔍 Vision API: Found', labels.length, 'labels');
      
      const tags = labels
        .filter(label => label.score > 0.7) // Only high-confidence labels
        .map(label => label.description.toLowerCase())
        .slice(0, 10); // Top 10 labels
      
      // Extract objects
      const objects = objectResult.localizedObjectAnnotations || [];
      console.log('🔍 Vision API: Found', objects.length, 'objects');
      
      const detectedObjects = objects
        .filter(obj => obj.score > 0.6)
        .map(obj => ({
          name: obj.name.toLowerCase(),
          confidence: Math.round(obj.score * 100) / 100
        }));
      
      // Extract dominant colors
      const colors = colorResult.imagePropertiesAnnotation?.dominantColors?.colors || [];
      console.log('🔍 Vision API: Found', colors.length, 'colors');
      
      const dominantColors = colors
        .slice(0, 5) // Top 5 colors
        .map(color => {
          const rgb = color.color;
          const hex = `#${Math.round(rgb.red || 0).toString(16).padStart(2, '0')}${Math.round(rgb.green || 0).toString(16).padStart(2, '0')}${Math.round(rgb.blue || 0).toString(16).padStart(2, '0')}`;
          return {
            hex: hex,
            score: Math.round(color.score * 100) / 100
          };
        });
      
      visionData = {
        tags: tags,
        objects: detectedObjects,
        colors: dominantColors,
        confidence: labels.length > 0 ? labels[0].score : 0,
        processed: true,
        debug: {
          totalLabels: labels.length,
          totalObjects: objects.length,
          totalColors: colors.length
        }
      };
      
      console.log('✅ Vision API analysis complete:', JSON.stringify(visionData, null, 2));
      
    } catch (visionError) {
      console.error('❌ Vision API Error Details:', {
        message: visionError.message,
        code: visionError.code,
        details: visionError.details,
        stack: visionError.stack
      });
      
      // Fallback to mock data if Vision API fails
      visionData = {
        tags: ['clothing', 'shirt', 'casual', 'blue', 'cotton'],
        objects: [
          { name: 'shirt', confidence: 0.95 },
          { name: 'clothing', confidence: 0.89 }
        ],
        colors: [
          { hex: '#4169E1', score: 0.8 },
          { hex: '#FFFFFF', score: 0.6 }
        ],
        confidence: 0.92,
        processed: false,
        error: visionError.message,
        errorCode: visionError.code
      };
    }
    
    // Generate smart analysis based on Vision data
    const smartAnalysis = generateSmartAnalysis(visionData);
    
    const results = {
      success: true,
      step: 1,
      visionData: visionData,
      geminiAnalysis: smartAnalysis,
      metadata: {
        processedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
        imageUrl: imageUrl,
        step: 'vision-api-integration',
        method: 'HTTP'
      }
    };
    
    console.log('Returning Step 1 results via HTTP');
    res.json(results);
    
  } catch (error) {
    console.error('Error in processWardrobeItemHTTP:', error);
    res.status(500).json({
      error: error.message,
      step: 1,
      success: false
    });
  }
});