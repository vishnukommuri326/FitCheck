// functions/src/gemini-vision.js
const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

// Initialize Gemini
const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
};

// Enhanced embedding generation function (KEEP EXISTING)
const generateEmbedding = (analysis) => {
  const embedding = [];
  
  // === COLOR ENCODING (0-12) ===
  const colorMap = {
    'red': [1, 0, 0], 'blue': [0, 0, 1], 'green': [0, 1, 0],
    'black': [0, 0, 0], 'white': [1, 1, 1], 'gray': [0.5, 0.5, 0.5], 'grey': [0.5, 0.5, 0.5],
    'navy': [0, 0, 0.5], 'royal': [0, 0, 0.8], 'teal': [0, 0.5, 0.5], 'turquoise': [0, 0.8, 0.8],
    'burgundy': [0.5, 0, 0.1], 'maroon': [0.5, 0, 0], 'crimson': [0.9, 0.1, 0.2], 'pink': [1, 0.7, 0.8],
    'forest': [0, 0.5, 0], 'olive': [0.5, 0.5, 0], 'lime': [0.5, 1, 0], 'mint': [0.6, 1, 0.6],
    'brown': [0.6, 0.3, 0.1], 'tan': [0.8, 0.7, 0.5], 'beige': [0.9, 0.9, 0.7], 'cream': [1, 0.9, 0.8],
    'purple': [0.5, 0, 0.5], 'violet': [0.9, 0.5, 0.9], 'indigo': [0.3, 0, 0.5],
    'yellow': [1, 1, 0], 'orange': [1, 0.5, 0], 'coral': [1, 0.5, 0.3], 'magenta': [1, 0, 1],
    'gold': [1, 0.8, 0], 'silver': [0.7, 0.7, 0.7], 'bronze': [0.8, 0.5, 0.2]
  };
  
  // Smart color matching
  const primaryColor = analysis.color.primary.toLowerCase();
  let matchedColor = 'gray';
  let maxMatch = 0;
  
  Object.keys(colorMap).forEach(color => {
    if (primaryColor.includes(color) && color.length > maxMatch) {
      matchedColor = color;
      maxMatch = color.length;
    }
  });
  
  embedding.push(...colorMap[matchedColor]);
  
  // Secondary color
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
    embedding.push(0, 0, 0);
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
  const normalizedPattern = patterns.includes(pattern) ? pattern : 'other';
  const patternVector = patterns.map(p => p === normalizedPattern ? 1 : 0);
  embedding.push(...patternVector);
  
  // === OCCASION ENCODING (34-39) ===
  const occasions = ['work', 'casual', 'party', 'exercise', 'formal', 'everyday'];
  const occasionVector = occasions.map(occ => occ === analysis.occasion ? 1 : 0);
  embedding.push(...occasionVector);
  
  // === COMPUTED FEATURES (40-44) ===
  // Formality score
  const formalityScore = analysis.style === 'formal' ? 1 : 
                        analysis.style === 'business' ? 0.8 : 
                        analysis.style === 'evening' ? 0.9 :
                        analysis.style === 'casual' ? 0.2 : 
                        analysis.style === 'athletic' ? 0.1 : 0.5;
  embedding.push(formalityScore);
  
  // Versatility score
  let versatilityScore = 0;
  if (analysis.season === 'all-season') versatilityScore += 0.4;
  if (analysis.occasion === 'everyday') versatilityScore += 0.3;
  if (analysis.occasion === 'casual') versatilityScore += 0.2;
  if (analysis.style === 'casual') versatilityScore += 0.1;
  versatilityScore = Math.min(versatilityScore, 1);
  embedding.push(versatilityScore);
  
  // Color brightness
  const colorRGB = colorMap[matchedColor];
  const brightness = (colorRGB[0] + colorRGB[1] + colorRGB[2]) / 3;
  embedding.push(brightness);
  
  // Pattern complexity
  const patternComplexity = pattern === 'solid' ? 0 :
                           pattern === 'striped' ? 0.3 :
                           pattern === 'plaid' ? 0.7 :
                           pattern === 'floral' ? 0.9 : 0.5;
  embedding.push(patternComplexity);
  
  // Confidence score
  embedding.push(analysis.confidence.overall || 0.5);
  
  console.log(`🧮 Generated attribute embedding vector (${embedding.length} dimensions)`);
  
  return embedding;
};

// 🆕 NEW: Generate CLIP embedding using Replicate
const generateCLIPEmbedding = async (imageUrl) => {
  try {
    console.log('🖼️ Generating CLIP embedding via Replicate...');
    
    const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || functions.config().replicate?.api_token;
    if (!REPLICATE_TOKEN) {
      console.warn('⚠️ Replicate API token not found, skipping CLIP embedding');
      return null;
    }
    
    // Create prediction with CLIP model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // CLIP ViT-L/14 model that outputs 768D embeddings
        version: "1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4",
        input: {
          image: imageUrl, // Pass URL directly
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Replicate API error:', errorData);
      throw new Error(`Replicate API error: ${response.status}`);
    }
    
    const prediction = await response.json();
    console.log('⏳ Prediction created:', prediction.id);
    
    // Poll for results
    let result = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (!result && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_TOKEN}`,
          }
        }
      );
      
      if (!resultResponse.ok) {
        throw new Error(`Failed to get prediction status: ${resultResponse.status}`);
      }
      
      const status = await resultResponse.json();
      
      if (status.status === 'succeeded') {
        result = status.output;
        break;
      } else if (status.status === 'failed') {
        console.error('❌ Prediction failed:', status.error);
        throw new Error(`CLIP embedding generation failed: ${status.error}`);
      }
      
      attempts++;
      if (attempts % 5 === 0) {
        console.log(`⏳ Still processing... (${attempts}s)`);
      }
    }
    
    if (!result) {
      throw new Error('Timeout waiting for CLIP embedding');
    }
    
    // Extract embedding from result
    let embedding;
    if (Array.isArray(result)) {
      embedding = result;
    } else if (result.embedding) {
      embedding = result.embedding;
    } else if (result.image_embedding) {
      embedding = result.image_embedding;
    } else {
      console.error('❌ Unexpected result format:', result);
      throw new Error('Unexpected CLIP result format');
    }
    
    console.log(`✅ Generated CLIP embedding: ${embedding.length}D`);
    return embedding;
    
  } catch (error) {
    console.error('❌ Failed to generate CLIP embedding:', error.message);
    return null;
  }
};

// 🆕 HYBRID: Generate both text and CLIP embeddings
const generateHybridEmbeddings = async (geminiAnalysis, imageUrl) => {
  try {
    console.log('🔄 Generating hybrid embeddings...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.api_key
    });
    console.log('OpenAI API Key (masked):', openai.apiKey ? `${openai.apiKey.substring(0, 5)}...${openai.apiKey.substring(openai.apiKey.length - 5)}` : 'Not found');
    
    if (!openai.apiKey) {
      console.warn('⚠️ OpenAI API key not found, skipping text embedding');
      return null;
    }
    
    // 1. Create rich description from Gemini's analysis
    const description = `${geminiAnalysis.itemName}: A ${geminiAnalysis.style} ${geminiAnalysis.type} made of ${geminiAnalysis.material}. 
Primary color is ${geminiAnalysis.color.primary}${geminiAnalysis.color.secondary ? ` with ${geminiAnalysis.color.secondary} accents` : ''}. 
Pattern: ${geminiAnalysis.color.pattern || 'solid'}. 
Best suited for ${geminiAnalysis.occasion} occasions during ${geminiAnalysis.season} season.
${geminiAnalysis.confidence.notes ? `Additional details: ${geminiAnalysis.confidence.notes}` : ''}`;
    
    console.log('📝 Generated description:', description);
    
    // 2. Generate text embedding (parallel with CLIP)
    const [textEmbeddingResponse, clipEmbedding] = await Promise.all([
      openai.embeddings.create({
        model: "text-embedding-3-large",
        input: description,
        encoding_format: "float"
      }),
      generateCLIPEmbedding(imageUrl) // 3. Generate CLIP embedding
    ]);
    
    const textEmbedding = textEmbeddingResponse.data[0].embedding;
    console.log(`✅ Text embedding: ${textEmbedding.length}D`);
    
    return {
      textEmbedding: textEmbedding,
      clipEmbedding: clipEmbedding,
      description: description,
      embeddingType: clipEmbedding ? 'hybrid-v3' : 'text-only-v2'
    };
    
  } catch (error) {
    console.error('❌ Failed to generate hybrid embeddings:', error);
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
    
    // Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Set GEMINI_API_KEY in .env or Firebase config.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"
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
    
    // Enhanced prompt
    const prompt = `You are an expert fashion analyst specializing in clothing identification and color analysis.

Analyze this clothing item and provide a JSON response. Follow these rules:
1. Focus ONLY on the main clothing item, ignore background/person
2. For colors, be very specific (e.g., "Navy Blue" not just "Blue", "Chocolate Brown" not "Brown")
3. If lighting affects the color, still give your best assessment
4. Use common fashion terms that users would understand
5. In the notes field, provide a rich description of visual features, texture, fit, and styling details

Respond with ONLY a JSON object in this exact format:
{
  "itemName": "Color + Type (e.g., 'Navy Blue Dress', 'Brown Leather Jacket')",
  "category": "One of: Tops/Bottoms/Dresses/Outerwear/Footwear/Accessories",
  "color": {
    "primary": "Specific color name (e.g., 'Forest Green', 'Burgundy', 'Charcoal Gray')",
    "secondary": "Secondary color if applicable, otherwise null",
    "pattern": "solid/striped/floral/plaid/other pattern, or null"
  },
  "type": "Specific item type (e.g., 'dress shirt', 'dress pants', 't-shirt', 'jeans')",
  "style": "casual/formal/athletic/business/evening",
  "material": "cotton/denim/leather/polyester/silk/wool/unknown",
  "season": "summer/winter/fall/spring/all-season",
  "occasion": "work/casual/party/exercise/formal/everyday",
  "confidence": {
    "overall": 0.95,
    "color": 0.90,
    "notes": "Detailed description including fit (slim/regular/loose), distinctive features, styling details, texture, and any unique visual elements"
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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      // Fallback analysis
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
    
    // 🆕 HYBRID: Generate both text and CLIP embeddings
    console.log('🔄 Generating hybrid embeddings...');
    const hybridResult = await generateHybridEmbeddings(analysis, imageUrl);
    
    // Build the response
    const finalResponse = {
      success: true,
      source: 'gemini-vision',
      analysis: analysis,
      embedding: attributeEmbedding, // Keep for backward compatibility
      
      // 🆕 Hybrid embeddings
      textEmbedding: hybridResult?.textEmbedding || null,
      clipEmbedding: hybridResult?.clipEmbedding || null,
      imageDescription: hybridResult?.description || null,
      
      // Legacy field for backward compatibility
      trueImageEmbedding: hybridResult?.textEmbedding || null,
      
      metadata: {
        processedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
        imageUrl: imageUrl,
        model: 'gemini-2.0-flash-exp',
        embeddingVersion: hybridResult?.embeddingType || 'v1',
        attributeEmbeddingDimensions: attributeEmbedding.length,
        textEmbeddingDimensions: hybridResult?.textEmbedding?.length || 0,
        clipEmbeddingDimensions: hybridResult?.clipEmbedding?.length || 0
      }
    };
    
    console.log('✅ Sending response with hybrid embeddings:', {
      analysis: analysis.itemName,
      attributeEmbeddingLength: attributeEmbedding.length,
      textEmbeddingLength: hybridResult?.textEmbedding?.length || 0,
      clipEmbeddingLength: hybridResult?.clipEmbedding?.length || 0,
      hasDescription: !!hybridResult?.description,
      embeddingType: hybridResult?.embeddingType || 'none'
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