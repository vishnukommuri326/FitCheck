// functions/src/true-image-rag.js - Updated with compatibility integration
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Generate image embedding by first describing the image
const generateImageEmbedding = async (imageUrl, openai) => {
  try {
    console.log('🖼️ Generating image embedding via description...');
    
    // Step 1: Use GPT-4o to describe the image
    const descriptionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this clothing item in detail for fashion similarity analysis. Include: exact colors, materials, style, fit, patterns, and distinctive visual features."
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }],
      max_tokens: 150
    });
    
    const imageDescription = descriptionResponse.choices[0].message.content;
    console.log('📝 Generated image description:', imageDescription);
    
    // Step 2: Create embedding from the description
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: imageDescription,
      encoding_format: "float"
    });
    
    const imageEmbedding = embeddingResponse.data[0].embedding;
    console.log(`✅ Generated image embedding: ${imageEmbedding.length} dimensions`);
    
    return {
      embedding: imageEmbedding,
      description: imageDescription
    };
    
  } catch (error) {
    console.error('❌ Failed to generate image embedding:', error);
    throw error;
  }
};

// Generate text embedding for the description
const generateTextEmbedding = async (description, openai) => {
  try {
    console.log('📝 Generating text embedding for description...');
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: description,
      encoding_format: "float"
    });
    
    const textEmbedding = response.data[0].embedding;
    console.log(`✅ Generated text embedding: ${textEmbedding.length} dimensions`);
    
    return textEmbedding;
    
  } catch (error) {
    console.error('❌ Failed to generate text embedding:', error);
    throw error;
  }
};

// Create hybrid embedding by combining image + text + attributes
const createHybridEmbedding = (imageEmbedding, textEmbedding, attributeEmbedding, weights = { image: 0.6, text: 0.3, attributes: 0.1 }) => {
  console.log('🔄 Creating hybrid embedding...');
  
  // Normalize embeddings to same length (use shortest)
  const minLength = Math.min(
    imageEmbedding.length, 
    textEmbedding.length, 
    attributeEmbedding ? attributeEmbedding.length : Infinity
  );
  
  const hybridEmbedding = [];
  
  for (let i = 0; i < minLength; i++) {
    let value = 0;
    value += imageEmbedding[i] * weights.image;
    value += textEmbedding[i] * weights.text;
    
    if (attributeEmbedding && i < attributeEmbedding.length) {
      value += attributeEmbedding[i] * weights.attributes;
    }
    
    hybridEmbedding.push(value);
  }
  
  console.log(`✅ Created hybrid embedding: ${hybridEmbedding.length} dimensions`);
  return hybridEmbedding;
};

// ✅ UPDATED: Main function now uses compatibility results
exports.analyzeWithTrueImageRAG = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { 
      imageUrl, 
      userId, 
      itemAnalysis, 
      compatibleItems // ✅ NEW: Accept compatibility results
    } = req.body.data || req.body;
    
    console.log('🚀 Starting True Image RAG analysis...');
    console.log('📸 Image URL:', imageUrl);
    console.log('👤 User ID:', userId);
    console.log('🎯 Compatible items received:', compatibleItems?.length || 0);
    
    if (!imageUrl || !userId) {
      res.status(400).json({ error: 'imageUrl and userId are required' });
      return;
    }
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.api_key
    });
    
    if (!openai.apiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // ✅ NEW: Check if we have compatibility results to use
    if (compatibleItems && compatibleItems.length > 0) {
      console.log('🔍 Using provided compatibility results...');
      
      // Generate description for styling context
      const descriptionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this clothing item in detail for fashion styling. Include: style, colors, materials, patterns, fit, occasion suitability, and any distinctive features. Be specific and use fashion terminology."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }],
        max_tokens: 200
      });
      
      const itemDescription = descriptionResponse.choices[0].message.content;
      console.log('📋 Generated description:', itemDescription);
      
      // Use provided compatible items
      const topItems = compatibleItems.slice(0, 8);
      
      // Build context for styling advice using EXACT items from compatibility check
      const wardrobeContext = topItems.map(item => {
        const name = item.tags?.name || 'Item';
        const analysis = item.tags?.aiResults?.analysis;
        const similarity = item.similarity ? `${Math.round(item.similarity * 100)}% match` : 'Compatible';
        return `- ${name} (${similarity}${analysis ? `, ${analysis.style} style, ${analysis.color?.primary}` : ''})`;
      }).join('\n');
      
      const stylingPrompt = `You are a professional fashion stylist. A user is considering a new clothing item described as: "${itemDescription}"

Based on their wardrobe compatibility analysis, here are the items this works well with:
${wardrobeContext}

Create personalized styling advice that:
1. Suggests 2-3 specific outfit combinations using their existing pieces
2. Explains why these combinations work (colors, styles, occasions)
3. Recommends specific occasions for each outfit
4. Keep it friendly, encouraging, and actionable
5. Reference the specific item names from their wardrobe

Focus on creating complete, wearable outfits using the compatible items listed above.`;

      const stylingResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: stylingPrompt }],
        max_tokens: 400,
        temperature: 0.7
      });
      
      const stylingAdvice = stylingResponse.choices[0].message.content;
      
      console.log('✅ True Image RAG analysis complete (using compatibility results)!');
      
      return res.json({
        success: true,
        result: {
          itemDescription: itemDescription,
          stylingAdvice: stylingAdvice,
          compatibleItems: topItems.map(item => ({
            id: item.id,
            name: item.tags?.name || 'Wardrobe Item',
            imageUrl: item.imageUrl,
            similarity: item.similarity,
            embeddingType: item.embeddingType || 'compatibility-based'
          })),
          retrievedItems: topItems.length,
          metadata: {
            processedAt: new Date().toISOString(),
            ragType: 'compatibility-based-rag',
            version: 'v2-integrated',
            useComputedCompatibility: true,
            compatibilityItemsUsed: topItems.length
          }
        }
      });
    }
    
    // ✅ FALLBACK: Original logic if no compatibility results provided
    console.log('🔍 No compatibility results provided, using original RAG logic...');
    
    // Step 1: Generate image embedding via description
    console.log('🔍 Step 1: Generating image embedding...');
    const imageResult = await generateImageEmbedding(imageUrl, openai);
    const imageEmbedding = imageResult.embedding;
    const itemDescription = imageResult.description;
    
    // Step 2: Generate text embedding
    console.log('📝 Step 2: Generating text embedding...');
    const textEmbedding = await generateTextEmbedding(itemDescription, openai);
    
    // Step 3: Create hybrid embedding
    let hybridEmbedding;
    if (itemAnalysis && itemAnalysis.embedding) {
      hybridEmbedding = createHybridEmbedding(
        imageEmbedding, 
        textEmbedding, 
        itemAnalysis.embedding
      );
    } else {
      hybridEmbedding = createHybridEmbedding(
        imageEmbedding, 
        textEmbedding, 
        null, 
        { image: 0.7, text: 0.3, attributes: 0 }
      );
    }
    
    // Step 4: RAG Retrieval - Search user's wardrobe
    console.log('🔍 Step 4: Retrieving from wardrobe...');
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const wardrobeSnapshot = await wardrobeRef.get();
    
    const retrievedItems = [];
    
    wardrobeSnapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      
      // Skip items without embeddings
      if (!item.trueImageEmbedding && !item.embedding) {
        return;
      }
      
      // Use true image embedding if available, fallback to attribute embedding
      const itemEmbedding = item.trueImageEmbedding || item.embedding;
      
      // Calculate similarity
      const similarity = cosineSimilarity(hybridEmbedding, itemEmbedding);
      
      if (similarity > 0.3) { // Threshold for relevance
        retrievedItems.push({
          ...item,
          similarity: Math.round(similarity * 100) / 100,
          embeddingType: item.trueImageEmbedding ? 'image' : 'attribute'
        });
      }
    });
    
    // Sort by similarity
    retrievedItems.sort((a, b) => b.similarity - a.similarity);
    
    console.log(`📊 Retrieved ${retrievedItems.length} similar items`);
    
    // Step 5: RAG Generation - Create styling advice
    console.log('🤖 Step 5: Generating styling advice...');
    
    const topItems = retrievedItems.slice(0, 8);
    
    if (topItems.length === 0) {
      return res.json({
        success: true,
        result: {
          itemDescription: itemDescription,
          stylingAdvice: "This item appears to be quite unique! While it doesn't closely match items in your current wardrobe, it could be a great statement piece to build new outfits around. Consider adding some neutral basics that would complement this piece.",
          compatibleItems: [],
          retrievedItems: 0,
          hybridEmbedding: hybridEmbedding,
          embeddingStats: {
            imageDims: imageEmbedding.length,
            textDims: textEmbedding.length,
            hybridDims: hybridEmbedding.length
          },
          metadata: {
            processedAt: new Date().toISOString(),
            ragType: 'original-rag',
            version: 'v2-fallback'
          }
        }
      });
    }
    
    // Build context for styling advice
    const wardrobeContext = topItems.map(item => {
      const name = item.tags?.name || 'Item';
      const analysis = item.tags?.aiResults?.analysis;
      return `- ${name} (${item.similarity * 100}% match${analysis ? `, ${analysis.style} style, ${analysis.color?.primary}` : ''})`;
    }).join('\n');
    
    const stylingPrompt = `You are a professional fashion stylist. A user is considering a new clothing item described as: "${itemDescription}"

Based on their wardrobe, here are the most similar items:
${wardrobeContext}

Create personalized styling advice that:
1. Suggests 2-3 specific outfit combinations using their existing pieces
2. Explains the visual/style connections you see
3. Recommends occasions for these outfits
4. Keep it friendly and encouraging

Focus on the visual similarities and how pieces would work together aesthetically.`;

    const stylingResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: stylingPrompt }],
      max_tokens: 400,
      temperature: 0.7
    });
    
    const stylingAdvice = stylingResponse.choices[0].message.content;
    
    console.log('✅ True Image RAG analysis complete (fallback mode)!');
    
    res.json({
      success: true,
      result: {
        itemDescription: itemDescription,
        stylingAdvice: stylingAdvice,
        compatibleItems: topItems.map(item => ({
          id: item.id,
          name: item.tags?.name || 'Wardrobe Item',
          imageUrl: item.imageUrl,
          similarity: item.similarity,
          embeddingType: item.embeddingType
        })),
        retrievedItems: retrievedItems.length,
        hybridEmbedding: hybridEmbedding,
        embeddingStats: {
          imageDims: imageEmbedding.length,
          textDims: textEmbedding.length,
          hybridDims: hybridEmbedding.length
        },
        metadata: {
          processedAt: new Date().toISOString(),
          ragType: 'original-rag',
          version: 'v2-fallback'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in True Image RAG:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to update existing wardrobe items
exports.upgradeWardrobeToImageEmbeddings = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { userId } = req.body.data || req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.api_key
    });
    
    if (!openai.apiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Get user's wardrobe
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const wardrobeSnapshot = await wardrobeRef.get();
    
    console.log(`🔄 Upgrading ${wardrobeSnapshot.size} wardrobe items to image embeddings...`);
    
    let upgraded = 0;
    let skipped = 0;
    
    for (const doc of wardrobeSnapshot.docs) {
      const item = doc.data();
      
      // Skip if already has true image embedding
      if (item.trueImageEmbedding) {
        skipped++;
        continue;
      }
      
      try {
        // Generate image embedding using the fixed function
        const imageResult = await generateImageEmbedding(item.imageUrl, openai);
        const imageEmbedding = imageResult.embedding;
        const description = imageResult.description;
        
        const textEmbedding = await generateTextEmbedding(description, openai);
        
        // Create hybrid embedding
        const hybridEmbedding = createHybridEmbedding(
          imageEmbedding, 
          textEmbedding, 
          item.embedding // Use existing attribute embedding
        );
        
        // Update document
        await doc.ref.update({
          trueImageEmbedding: hybridEmbedding,
          imageDescription: description,
          embeddingVersion: 'v2-hybrid-fixed',
          upgradedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        upgraded++;
        console.log(`✅ Upgraded item ${doc.id}`);
        
        // Rate limiting - don't overwhelm OpenAI
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to upgrade item ${doc.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      result: {
        totalItems: wardrobeSnapshot.size,
        upgraded: upgraded,
        skipped: skipped,
        message: `Successfully upgraded ${upgraded} items to true image embeddings`
      }
    });
    
  } catch (error) {
    console.error('❌ Error upgrading wardrobe:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});