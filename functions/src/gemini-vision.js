// functions/src/gemini-vision.js
const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

// Gemini-based clothing analysis function
exports.analyzeClothingItem = functions.https.onRequest(async (req, res) => {
  // CORS headers
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
    
    console.log('🚀 Gemini analyzeClothingItem called with:', data);
    
    if (!imageUrl) {
      res.status(400).json({
        error: 'imageUrl is required'
      });
      return;
    }
    
    // Initialize Gemini with your API key
    // Priority: 1. Environment variable, 2. Firebase config
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Set GEMINI_API_KEY in .env or Firebase config.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp" // Fastest model - 8B parameter version
    });
    
    // Fetch the image from URL
    console.log('📸 Fetching image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    console.log('🖼️ Image fetched and converted to base64');
    
    // Create a detailed prompt for accurate clothing analysis
    const prompt = `You are an expert fashion analyst specializing in clothing identification and color analysis.

Analyze this clothing item and provide a JSON response. Follow these rules:
1. Focus ONLY on the main clothing item, ignore background/person
2. For colors, be very specific (e.g., "Navy Blue" not just "Blue", "Chocolate Brown" not "Brown")
3. If lighting affects the color, still give your best assessment
4. Use common fashion terms that users would understand

Respond with ONLY a JSON object in this exact format:
{
  "itemName": "Color + Type (e.g., 'Navy Blue Dress', 'Brown Leather Jacket')",
  "category": "One of: Tops/Bottoms/Dresses/Outerwear/Footwear/Accessories",
  "color": {
    "primary": "Specific color name (e.g., 'Forest Green', 'Burgundy', 'Charcoal Gray')",
    "secondary": "Secondary color if applicable, otherwise null",
    "pattern": "solid/striped/floral/plaid/other pattern, or null"
  },
  "type": "Specific item type (e.g., 'T-Shirt', 'Jeans', 'Sneakers')",
  "style": "casual/formal/athletic/business/evening",
  "material": "cotton/denim/leather/polyester/silk/unknown",
  "season": "summer/winter/fall/spring/all-season",
  "occasion": "work/casual/party/exercise/formal/everyday",
  "confidence": {
    "overall": 0.95,
    "color": 0.90,
    "notes": "Any relevant notes about the analysis"
  }
}`;
    
    // Call Gemini Vision API
    console.log('🤖 Calling Gemini Vision API...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Gemini raw response:', text);
    
    // Parse JSON from response
    let analysis;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      // Fallback analysis if parsing fails
      analysis = {
        itemName: "Clothing Item",
        category: "Other",
        color: {
          primary: "Unknown",
          secondary: null,
          pattern: "solid"
        },
        type: "Unknown",
        style: "casual",
        material: "unknown",
        season: "all-season",
        occasion: "everyday",
        confidence: {
          overall: 0.5,
          color: 0.5,
          notes: "Failed to parse AI response"
        }
      };
    }
    
    // Build the response
    const finalResponse = {
      success: true,
      source: 'gemini-vision',
      analysis: analysis,
      metadata: {
        processedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
        imageUrl: imageUrl,
        model: 'gemini-2.0-flash-exp'
      }
    };
    
    console.log('✅ Sending response:', JSON.stringify(finalResponse, null, 2));
    res.json(finalResponse);
    
  } catch (error) {
    console.error('❌ Error in analyzeClothingItem:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});