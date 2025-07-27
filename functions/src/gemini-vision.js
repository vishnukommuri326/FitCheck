// functions/src/gemini-vision.js
const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

// Helper function to generate a detailed description using Gemini Vision Pro
const generateDetailedDescription = async (imageUrl) => {
  try {
    console.log('📝 Generating detailed description with Gemini Vision Pro...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const prompt = "Describe this clothing item in detail for fashion search. Include: exact style, colors, materials, patterns, fit, silhouette, and distinctive features. Use specific fashion terminology.";

    const result = await model.generateContent([prompt, { inlineData: { data: base64Image, mimeType: "image/jpeg" } }]);
    const description = result.response.text();
    console.log('✅ Generated description:', description);
    return description;
  } catch (error) {
    console.error('❌ Error generating detailed description:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate image description.', error.message);
  }
};

// Helper function to generate a RAG embedding using OpenAI
const generateRAGEmbedding = async (description) => {
  try {
    console.log('🖼️ Generating RAG embedding with OpenAI...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!openai.apiKey) {
      throw new Error('OpenAI API key not found.');
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: description,
      encoding_format: "float"
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log(`✅ Generated RAG embedding: ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error('❌ Error generating RAG embedding:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate RAG embedding.', error.message);
  }
};


// Enhanced embedding generation function (KEEP EXISTING)
const generateEmbedding = (analysis) => {
  const embedding = [];
  
  // === COLOR ENCODING (0-12) ===
  // More comprehensive color mapping with better RGB values
  const colorMap = {
    // Primary colors
    'red': [1, 0, 0], 'blue': [0, 0, 1], 'green': [0, 1, 0],
    // Neutrals
    'black': [0, 0, 0], 'white': [1, 1, 1], 'gray': [0.5, 0.5, 0.5], 'grey': [0.5, 0.5, 0.5],
    // Blues
    'navy': [0, 0, 0.5], 'royal': [0, 0, 0.8], 'teal': [0, 0.5, 0.5], 'turquoise': [0, 0.8, 0.8],
    // Reds
    'burgundy': [0.5, 0, 0.1], 'maroon': [0.5, 0, 0], 'crimson': [0.9, 0.1, 0.2], 'pink': [1, 0.7, 0.8],
    // Greens
    'forest': [0, 0.5, 0], 'olive': [0.5, 0.5, 0], 'lime': [0.5, 1, 0], 'mint': [0.6, 1, 0.6],
    // Earth tones
    'brown': [0.6, 0.3, 0.1], 'tan': [0.8, 0.7, 0.5], 'beige': [0.9, 0.9, 0.7], 'cream': [1, 0.9, 0.8],
    // Jewel tones
    'purple': [0.5, 0, 0.5], 'violet': [0.9, 0.5, 0.9], 'indigo': [0.3, 0, 0.5],
    // Bright colors
    'yellow': [1, 1, 0], 'orange': [1, 0.5, 0], 'coral': [1, 0.5, 0.3], 'magenta': [1, 0, 1],
    // Metallics
    'gold': [1, 0.8, 0], 'silver': [0.7, 0.7, 0.7], 'bronze': [0.8, 0.5, 0.2]
  };
  
  // Smart color matching - check if color name contains any known colors
  const primaryColor = analysis.color.primary.toLowerCase();
  let matchedColor = 'gray'; // default
  let maxMatch = 0;
  
  Object.keys(colorMap).forEach(color => {
    if (primaryColor.includes(color) && color.length > maxMatch) {
      matchedColor = color;
      maxMatch = color.length;
    }
  });
  
  embedding.push(...colorMap[matchedColor]);
  
  // Secondary color (if exists)
  if (analysis.color.secondary) {
    const secondaryColor = analysis.color.secondary.toLowerCase();
    let secondaryMatch = 'gray';
    let secondaryMaxMatch = 0;
    
    Object.keys(colorMap).forEach(color => {
      if (secondaryColor.includes(color) && color.length > secondaryMaxMatch) {
        secondaryMatch = color;
        secondaryMaxMatch = color.length;
      }
    });
    
    embedding.push(...colorMap[secondaryMatch]);
  } else {
    embedding.push(0, 0, 0); // No secondary color
  }
  
  // === CATEGORY ENCODING (6-11) ===
  const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories'];
  const categoryVector = categories.map(cat => cat === analysis.category ? 1 : 0);
  embedding.push(...categoryVector);
  
  // === STYLE ENCODING (12-16) ===
  const styles = ['casual', 'formal', 'athletic', 'business', 'evening'];
  const styleVector = styles.map(style => style === analysis.style ? 1 : 0);
  embedding.push(...styleVector);
  
  // === SEASON ENCODING (17-21) ===
  const seasons = ['summer', 'winter', 'fall', 'spring', 'all-season'];
  const seasonVector = seasons.map(season => season === analysis.season ? 1 : 0);
  embedding.push(...seasonVector);
  
  // === MATERIAL ENCODING (22-28) ===
  const materials = ['cotton', 'denim', 'leather', 'polyester', 'silk', 'wool', 'unknown'];
  const materialVector = materials.map(material => material === analysis.material ? 1 : 0);
  embedding.push(...materialVector);
  
  // === PATTERN ENCODING (29-33) ===
  const patterns = ['solid', 'striped', 'floral', 'plaid', 'other'];
  const pattern = analysis.color.pattern || 'solid';
  // Handle 'other pattern' case
  const normalizedPattern = patterns.includes(pattern) ? pattern : 'other';
  const patternVector = patterns.map(p => p === normalizedPattern ? 1 : 0);
  embedding.push(...patternVector);
  
  // === OCCASION ENCODING (34-39) ===
  const occasions = ['work', 'casual', 'party', 'exercise', 'formal', 'everyday'];
  const occasionVector = occasions.map(occ => occ === analysis.occasion ? 1 : 0);
  embedding.push(...occasionVector);
  
  // === COMPUTED FEATURES (40-44) ===
  
  // Formality score (0-1)
  const formalityScore = analysis.style === 'formal' ? 1 : 
                        analysis.style === 'business' ? 0.8 : 
                        analysis.style === 'evening' ? 0.9 :
                        analysis.style === 'casual' ? 0.2 : 
                        analysis.style === 'athletic' ? 0.1 : 0.5;
  embedding.push(formalityScore);
  
  // Versatility score (how many occasions/seasons it works for)
  let versatilityScore = 0;
  if (analysis.season === 'all-season') versatilityScore += 0.4;
  if (analysis.occasion === 'everyday') versatilityScore += 0.3;
  if (analysis.occasion === 'casual') versatilityScore += 0.2;
  if (analysis.style === 'casual') versatilityScore += 0.1;
  versatilityScore = Math.min(versatilityScore, 1); // Cap at 1
  embedding.push(versatilityScore);
  
  // Color brightness (0-1) - based on RGB values
  const colorRGB = colorMap[matchedColor];
  const brightness = (colorRGB[0] + colorRGB[1] + colorRGB[2]) / 3;
  embedding.push(brightness);
  
  // Pattern complexity (0-1)
  const patternComplexity = pattern === 'solid' ? 0 :
                           pattern === 'striped' ? 0.3 :
                           pattern === 'plaid' ? 0.7 :
                           pattern === 'floral' ? 0.9 : 0.5;
  embedding.push(patternComplexity);
  
  // Confidence score
  embedding.push(analysis.confidence.overall || 0.5);
  
  console.log(`🧮 Generated attribute embedding vector (${embedding.length} dimensions):`, 
    embedding.map(v => Math.round(v * 100) / 100));
  
  return embedding;
};

// NEW: Generate true image embedding using OpenAI
const generateTrueImageEmbedding = async (imageUrl) => {
  try {
    console.log('🖼️ Generating true image embedding...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!openai.apiKey) {
      console.warn('⚠️ OpenAI API key not found, skipping image embedding');
      return null;
    }
    
    // Generate detailed description first
    const descriptionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this clothing item in detail for fashion search. Include: exact style, colors, materials, patterns, fit, silhouette, and distinctive features. Use specific fashion terminology."
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }],
      max_tokens: 150
    });
    
    const description = descriptionResponse.choices[0].message.content;
    console.log('📝 Generated description:', description);
    
    // Generate text embedding from description
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: description,
      encoding_format: "float"
    });
    
    const imageEmbedding = embeddingResponse.data[0].embedding;
    console.log(`✅ Generated true image embedding: ${imageEmbedding.length} dimensions`);
    
    return {
      embedding: imageEmbedding,
      description: description
    };
    
  } catch (error) {
    console.error('❌ Failed to generate true image embedding:', error);
    return null;
  }
};


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
    const apiKey = process.env.GEMINI_API_KEY;
    
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
  "material": "cotton/denim/leather/polyester/silk/wool/unknown",
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
    
    // Generate attribute embedding from analysis
    console.log('🧮 Generating attribute embedding vector...');
    const attributeEmbedding = generateEmbedding(analysis);
    
    // Generate true image embedding (NEW!)
    console.log('🖼️ Generating true image embedding...');
    const trueImageResult = await generateTrueImageEmbedding(imageUrl);
    
    // Build the response
    const finalResponse = {
      success: true,
      source: 'gemini-vision',
      analysis: analysis,
      embedding: attributeEmbedding, // Keep for backward compatibility
      trueImageEmbedding: trueImageResult?.embedding || null, // NEW!
      imageDescription: trueImageResult?.description || null, // NEW!
      metadata: {
        processedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
        imageUrl: imageUrl,
        model: 'gemini-2.0-flash-exp',
        embeddingVersion: 'v2-hybrid', // Updated version
        attributeEmbeddingDimensions: attributeEmbedding.length,
        trueImageEmbeddingDimensions: trueImageResult?.embedding?.length || 0
      }
    };
    
    console.log('✅ Sending response with both embeddings:', {
      analysis: analysis.itemName,
      attributeEmbeddingLength: attributeEmbedding.length,
      trueImageEmbeddingLength: trueImageResult?.embedding?.length || 0,
      hasDescription: !!trueImageResult?.description
    });
    
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

// New, dedicated RAG analysis function
exports.analyzeImageForRAG = functions.https.onCall(async (data, context) => {
  try {
    const { imageUrl } = data;
    const userId = context.auth?.uid;

    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to analyze an image.');
    }
    
    if (!imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing "imageUrl" in request data.');
    }

    console.log(`🚀 RAG analysis started for user ${userId} with image:`, imageUrl);

    // 1. Generate detailed description with Gemini Vision
    const description = await generateDetailedDescription(imageUrl);

    // 2. Generate high-quality embedding from the description
    const embedding = await generateRAGEmbedding(description);

    console.log(`✅ RAG analysis successful for user ${userId}`);

    return {
      success: true,
      description: description,
      embedding: embedding,
    };

  } catch (error) {
    console.error('❌ Error in analyzeImageForRAG:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred during RAG analysis.', error.message);
  }
});
