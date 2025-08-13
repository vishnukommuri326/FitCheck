// functions/src/true-image-rag.js - UPGRADED with Pinecone Backend
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🆕 NEW: Import Pinecone
const { initPinecone } = require('./pinecone-setup');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// ===== KEEP ALL YOUR EXISTING UTILITY FUNCTIONS =====

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  
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

// Calculate hybrid similarity with multiple embeddings
const calculateHybridSimilarity = (queryEmbeddings, itemEmbeddings) => {
  const similarities = {
    attribute: 0,
    text: 0,
    clip: 0
  };
  
  if (queryEmbeddings.attributeEmbedding && itemEmbeddings.embedding) {
    similarities.attribute = cosineSimilarity(queryEmbeddings.attributeEmbedding, itemEmbeddings.embedding);
  }
  
  if (queryEmbeddings.textEmbedding && itemEmbeddings.textEmbedding) {
    similarities.text = cosineSimilarity(queryEmbeddings.textEmbedding, itemEmbeddings.textEmbedding);
  }
  
  if (queryEmbeddings.clipEmbedding && itemEmbeddings.clipEmbedding) {
    similarities.clip = cosineSimilarity(queryEmbeddings.clipEmbedding, itemEmbeddings.clipEmbedding);
  }
  
  let weights = { attribute: 0.2, text: 0.4, clip: 0.4 };
  let totalWeight = 0;
  let weightedSum = 0;
  
  if (!similarities.clip) {
    weights = { attribute: 0.3, text: 0.7, clip: 0 };
  }
  if (!similarities.text && !similarities.clip) {
    weights = { attribute: 1, text: 0, clip: 0 };
  }
  
  Object.keys(similarities).forEach(key => {
    if (similarities[key] > 0) {
      weightedSum += similarities[key] * weights[key];
      totalWeight += weights[key];
    }
  });
  
  const finalSimilarity = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return {
    overall: finalSimilarity,
    components: similarities
  };
};

const parseGeminiStylingResponse = (rawResponse) => {
  try {
    if (Array.isArray(rawResponse)) {
      return rawResponse;
    }
    
    let cleanedResponse = rawResponse.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
    
    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsed = JSON.parse(cleanedResponse);
    
    if (Array.isArray(parsed)) {
      return parsed.map(outfit => ({
        title: outfit.title || "Styling Suggestion",
        description: outfit.description || "No description available",
        items: Array.isArray(outfit.items) ? outfit.items : [],
        occasion: outfit.occasion || "Various occasions"
      }));
    }
    
    throw new Error("Response is not an array");
    
  } catch (error) {
    console.error("❌ Failed to parse Gemini styling response:", error);
    return [{
      title: "Styling Advice",
      description: typeof rawResponse === 'string' ? rawResponse : "AI styling advice available",
      items: [],
      occasion: "Various occasions"
    }];
  }
};

// ===== KEEP ALL YOUR EXISTING FASHION LOGIC =====
const garmentTypes = {
  completeOutfits: ['dress', 'jumpsuit', 'romper', 'overall', 'gown', 'frock'],
  formalPieces: ['blazer', 'suit jacket', 'dress shirt', 'dress pants', 'dress shoes', 'tie', 'bow tie'],
  casualPieces: ['hoodie', 'sweatshirt', 't-shirt', 'tee', 'jeans', 'sneakers', 'baseball cap'],
  casualLayering: ['hoodie', 'sweatshirt', 'pullover'],
  activewear: ['sports bra', 'leggings', 'running shoes', 'athletic shorts', 'yoga pants'],
  accessories: ['jewelry', 'necklace', 'earrings', 'bracelet', 'watch', 'scarf', 'belt', 'bag', 'purse'],
  outerwear: ['jacket', 'coat', 'cardigan', 'vest', 'blazer', 'sweater']
};

const incompatiblePairs = [
  ['dress', 'hoodie'],
  ['dress', 'sweatshirt'],
  ['gown', 'sneakers'],
  ['formal dress', 'baseball cap'],
  ['dress shirt', 'sweatpants'],
  ['blazer', 'athletic shorts']
];

const isCompleteOutfit = (analysis) => {
  const type = analysis.type?.toLowerCase() || '';
  const category = analysis.category?.toLowerCase() || '';
  return category === 'dresses' || garmentTypes.completeOutfits.some(item => type.includes(item));
};

const getFormalityLevel = (analysis) => {
  const type = analysis.type?.toLowerCase() || '';
  const style = analysis.style?.toLowerCase() || '';
  const color = analysis.color?.primary?.toLowerCase() || '';
  
  if (style === 'casual') return 'casual';
  if (style === 'formal' || style === 'business') return 'formal';
  if (style === 'athletic') return 'athletic';
  
  if (type.includes('shirt') && !type.includes('dress shirt') && !type.includes('t-shirt')) {
    if (['green', 'olive', 'khaki', 'navy', 'gray', 'grey', 'blue'].some(c => color.includes(c))) {
      return 'casual';
    }
    if (style.includes('smart') || style.includes('casual')) {
      return 'casual';
    }
  }
  
  if (garmentTypes.formalPieces.some(item => type.includes(item))) {
    return 'formal';
  }
  if (garmentTypes.casualPieces.some(item => type.includes(item))) {
    return 'casual';
  }
  if (garmentTypes.activewear.some(item => type.includes(item))) {
    return 'athletic';
  }
  
  return 'neutral';
};

const isAccessory = (analysis) => {
  const category = analysis.category?.toLowerCase() || '';
  const type = analysis.type?.toLowerCase() || '';
  return category === 'accessories' || garmentTypes.accessories.some(item => type.includes(item));
};

const isOuterwear = (analysis) => {
  const category = analysis.category?.toLowerCase() || '';
  const type = analysis.type?.toLowerCase() || '';
  return category === 'outerwear' || garmentTypes.outerwear.some(item => type.includes(item));
};

const isCasualLayering = (analysis) => {
  const type = analysis.type?.toLowerCase() || '';
  return garmentTypes.casualLayering.some(item => type.includes(item));
};

const isIncompatiblePair = (type1, type2) => {
  const t1 = type1.toLowerCase();
  const t2 = type2.toLowerCase();
  
  return incompatiblePairs.some(([item1, item2]) => 
    (t1.includes(item1) && t2.includes(item2)) ||
    (t2.includes(item1) && t1.includes(item2))
  );
};

const areItemsCompatible = (item1Analysis, item2Analysis) => {
  const type1 = item1Analysis.type?.toLowerCase() || '';
  const type2 = item2Analysis.type?.toLowerCase() || '';
  const category1 = item1Analysis.category?.toLowerCase() || '';
  const category2 = item2Analysis.category?.toLowerCase() || '';
  
  console.log(`🔍 Checking compatibility: ${type1} (${category1}) vs ${type2} (${category2})`);
  
  if (isIncompatiblePair(type1, type2)) {
    console.log(`❌ Fashion no-no: ${type1} + ${type2}`);
    return false;
  }
  
  if (category1 === category2 && !['accessories', 'outerwear'].includes(category1)) {
    console.log(`❌ Same category (${category1}) - not compatible`);
    return false;
  }
  
  const formality1 = getFormalityLevel(item1Analysis);
  const formality2 = getFormalityLevel(item2Analysis);
  
  if (type1.includes('belt') || type2.includes('belt')) {
    const beltItem = type1.includes('belt') ? item1Analysis : item2Analysis;
    const otherItem = type1.includes('belt') ? item2Analysis : item1Analysis;
    const otherType = type1.includes('belt') ? type2 : type1;
    const otherFormality = type1.includes('belt') ? formality2 : formality1;
    
    if (otherType.includes('pants') || otherType.includes('trousers') || 
        otherType.includes('jeans') || otherType.includes('chinos') ||
        otherType.includes('shorts')) {
      console.log(`✅ Belt matches with bottoms`);
      return true;
    }
    
    if (otherType.includes('hoodie') || otherType.includes('sweatshirt') || 
        otherType.includes('t-shirt') || (otherType.includes('shirt') && otherFormality === 'casual')) {
      console.log(`❌ Belt doesn't match with casual tops`);
      return false;
    }
    
    if (otherFormality === 'formal') {
      console.log(`✅ Belt matches with formal attire`);
      return true;
    }
  }
  
  if (formality1 === 'formal' && formality2 === 'formal' && category1 !== category2) {
    console.log(`✅ Both formal items from different categories - compatible!`);
    return true;
  }
  
  const isCompleteOutfit1 = isCompleteOutfit(item1Analysis);
  const isCompleteOutfit2 = isCompleteOutfit(item2Analysis);
  
  if (isCompleteOutfit1 || isCompleteOutfit2) {
    const canPairWithDress = (item) => {
      if (isAccessory(item)) return true;
      if (!isOuterwear(item)) return false;
      
      const formality = getFormalityLevel(item);
      return formality !== 'casual' && !isCasualLayering(item);
    };
    
    if (isCompleteOutfit1 && !canPairWithDress(item2Analysis)) {
      console.log(`❌ ${type1} is complete outfit, ${type2} cannot pair with it`);
      return false;
    }
    if (isCompleteOutfit2 && !canPairWithDress(item1Analysis)) {
      console.log(`❌ ${type2} is complete outfit, ${type1} cannot pair with it`);
      return false;
    }
  }
  
  if ((formality1 === 'formal' && formality2 === 'casual') || 
      (formality1 === 'casual' && formality2 === 'formal')) {
    
    const hasBlazerwithCasual = 
      (type1.includes('blazer') && formality2 === 'casual') || 
      (type2.includes('blazer') && formality1 === 'casual');
    
    const hasAccessoryOrOuterwear = isAccessory(item1Analysis) || isAccessory(item2Analysis) ||
                                   isOuterwear(item1Analysis) || isOuterwear(item2Analysis);
    
    if (!hasBlazerwithCasual && !hasAccessoryOrOuterwear) {
      console.log(`❌ Formality mismatch: ${formality1} (${type1}) + ${formality2} (${type2})`);
      return false;
    }
  }
  
  if ((formality1 === 'casual' && formality2 === 'neutral') || 
      (formality1 === 'neutral' && formality2 === 'casual') ||
      (formality1 === 'casual' && formality2 === 'casual')) {
    console.log(`✅ Casual/neutral items are compatible`);
    return true;
  }
  
  if (formality1 === 'athletic' || formality2 === 'athletic') {
    if (formality1 === 'athletic' && formality2 !== 'athletic' && !isAccessory(item2Analysis)) {
      console.log(`❌ Activewear mismatch: ${type1} (athletic) + ${type2} (not athletic/accessory)`);
      return false;
    }
    if (formality2 === 'athletic' && formality1 !== 'athletic' && !isAccessory(item1Analysis)) {
      console.log(`❌ Activewear mismatch: ${type2} (athletic) + ${type1} (not athletic/accessory)`);
      return false;
    }
  }
  
  if ((isCasualLayering(item1Analysis) && formality2 === 'formal') ||
      (isCasualLayering(item2Analysis) && formality1 === 'formal')) {
    console.log(`❌ Casual layering cannot mix with formal items`);
    return false;
  }
  
  console.log(`✅ Items are compatible!`);
  return true;
};

const isColorSimilar = (color1, color2) => {
  if (!color1 || !color2) return false;
  
  const normalize = (color) => color.toLowerCase().trim();
  const c1 = normalize(color1);
  const c2 = normalize(color2);
  
  if (c1 === c2) return true;
  
  const colorGroups = [
    ['gray', 'grey', 'charcoal', 'slate'],
    ['black', 'dark', 'jet black'],
    ['white', 'cream', 'ivory', 'off-white'],
    ['blue', 'navy', 'royal blue', 'dark blue'],
    ['red', 'crimson', 'burgundy'],
    ['green', 'forest green', 'olive'],
    ['brown', 'tan', 'beige', 'khaki']
  ];
  
  return colorGroups.some(group => 
    group.some(c => c1.includes(c)) && group.some(c => c2.includes(c))
  );
};

const isDuplicate = (newItemAnalysis, existingItemAnalysis, hybridSimilarity) => {
  const similarity = hybridSimilarity.overall;
  
  if (similarity < 0.85) return false;
  if (newItemAnalysis?.category !== existingItemAnalysis?.category) return false;
  
  if (hybridSimilarity.components.clip > 0.92) return true;
  
  if (similarity >= 0.90) return true;
  
  const colorSimilar = isColorSimilar(
    newItemAnalysis?.color?.primary, 
    existingItemAnalysis?.color?.primary
  );
  
  return similarity >= 0.85 && colorSimilar;
};

// Generate styling advice using Gemini
const generateGeminiStylingAdvice = async (itemDescription, wardrobeContext) => {
  try {
    console.log('🤖 Generating styling advice with Gemini...');
    
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const stylingPrompt = `You are a professional fashion stylist. A user is considering buying this item: "${itemDescription}"

Their wardrobe contains these compatible pieces:
${wardrobeContext}

Create 2-3 specific outfit combinations using the new item with their existing wardrobe pieces.

CRITICAL: You must respond with ONLY valid JSON - no extra text, explanations, or formatting.

Format your response as a JSON array with this exact structure:
[
  {
    "title": "Outfit Name",
    "description": "Explain why this combination works well together, mentioning colors and styles",
    "items": ["New item name", "Wardrobe item 1", "Wardrobe item 2"],
    "occasion": "When to wear this outfit"
  }
]

Rules:
- Reference actual item names from their wardrobe
- Include the new item in each outfit
- Focus on color harmony and style compatibility
- Be specific about occasions and styling tips
- Keep descriptions concise but helpful`;

    const result = await model.generateContent(stylingPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini styling response:', text);
    
    return text;
    
  } catch (error) {
    console.error('❌ Failed to generate Gemini styling advice:', error);
    throw error;
  }
};

// 🆕 NEW: Pinecone search function
const searchWardrobeWithPinecone = async (queryEmbeddings, userId, topK = 50) => {
  console.log('🔍 Searching wardrobe with Pinecone...');
  
  try {
    const pc = initPinecone();
    if (!pc) {
      console.log('⚠️ Pinecone not available');
      return null;
    }
    
    const index = pc.index('fitcheck-main');
    
    const textEmbedding = queryEmbeddings.textEmbedding;
    if (!textEmbedding) {
      console.log('⚠️ No text embedding available for Pinecone search');
      return null;
    }
    
    const searchResult = await index.query({
      vector: textEmbedding,
      topK: topK,
      filter: {
        userId: { $eq: userId }
      },
      includeMetadata: true
    });
    
    console.log(`📊 Pinecone found ${searchResult.matches?.length || 0} similar items`);
    
    // Convert to expected format
    const wardrobeItems = searchResult.matches?.map(match => {
      const metadata = match.metadata;
      return {
        id: match.id,
        similarity: match.score,
        tags: {
          name: metadata.itemName,
          aiResults: {
            analysis: {
              itemName: metadata.itemName,
              category: metadata.category,
              style: metadata.style,
              type: metadata.itemName,
              color: { 
                primary: metadata.primaryColor,
                secondary: metadata.secondaryColor 
              },
              season: metadata.season,
              occasion: metadata.occasion,
              material: metadata.material
            }
          }
        },
        imageUrl: metadata.imageUrl || '',
        pineconeScore: match.score
      };
    }) || [];
    
    return wardrobeItems;
    
  } catch (error) {
    console.error('❌ Pinecone search failed:', error);
    return null;
  }
};

// 🆕 NEW: Firestore fallback search
const searchWardrobeWithFirestore = async (queryEmbeddings, userId) => {
  console.log('🔍 Searching wardrobe with Firestore (fallback)...');
  
  const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
  const wardrobeSnapshot = await wardrobeRef.get();
  
  const wardrobeItems = [];
  
  wardrobeSnapshot.forEach(doc => {
    const item = { id: doc.id, ...doc.data() };
    
    const itemEmbeddings = {
      embedding: item.embedding || null,
      textEmbedding: item.textEmbedding || item.trueImageEmbedding || null,
      clipEmbedding: item.clipEmbedding || null
    };
    
    if (!itemEmbeddings.embedding && !itemEmbeddings.textEmbedding && !itemEmbeddings.clipEmbedding) {
      return;
    }
    
    const hybridSimilarity = calculateHybridSimilarity(queryEmbeddings, itemEmbeddings);
    
    wardrobeItems.push({
      ...item,
      similarity: hybridSimilarity.overall,
      similarityComponents: hybridSimilarity.components,
      firestoreScore: hybridSimilarity.overall
    });
  });
  
  return wardrobeItems;
};

// 🔄 MAIN FUNCTION - UPGRADED
exports.analyzeWithTrueImageRAG = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { imageUrl, userId, itemAnalysis, compatibleItems } = req.body.data || req.body;
    
    console.log('🚀 Starting Image RAG analysis with Pinecone backend...');
    console.log('👤 User ID:', userId);
    
    if (!imageUrl || !userId) {
      res.status(400).json({ error: 'imageUrl and userId are required' });
      return;
    }
    
    // Step 1: Prepare embeddings
    let queryEmbeddings = {
      attributeEmbedding: itemAnalysis?.embedding || null,
      textEmbedding: itemAnalysis?.textEmbedding || itemAnalysis?.trueImageEmbedding || null,
      clipEmbedding: itemAnalysis?.clipEmbedding || null
    };
    
    // Generate item description
    let itemDescription = '';
    if (itemAnalysis?.analysis) {
      const analysis = itemAnalysis.analysis;
      itemDescription = `${analysis.itemName}: A ${analysis.style} ${analysis.type} made of ${analysis.material}. 
Primary color is ${analysis.color.primary}${analysis.color.secondary ? ` with ${analysis.color.secondary} accents` : ''}. 
Pattern: ${analysis.color.pattern || 'solid'}. 
Best suited for ${analysis.occasion} occasions during ${analysis.season} season.
${analysis.confidence.notes ? `Additional details: ${analysis.confidence.notes}` : ''}`;
    }
    
    console.log('📋 Item description:', itemDescription);
    
    // Step 2: Search wardrobe
    let finalCompatibleItems = [];
    let duplicateItems = [];
    let searchMethod = 'unknown';
    
    if (compatibleItems) {
      console.log('🎨 Using provided compatible items for custom styling...');
      finalCompatibleItems = compatibleItems;
      searchMethod = 'custom';
    } else {
      
      console.log('🔍 ATTEMPTING PINECONE SEARCH...');
      let wardrobeItems = await searchWardrobeWithPinecone(queryEmbeddings, userId);
      
      if (!wardrobeItems) {
        console.log('❌ PINECONE FAILED - FALLING BACK TO FIRESTORE');
        wardrobeItems = await searchWardrobeWithFirestore(queryEmbeddings, userId);
        searchMethod = 'firestore';
      } else {
        console.log('✅ PINECONE SUCCESS - USING PINECONE RESULTS');
        searchMethod = 'pinecone';
      }
      
      console.log(`📊 Found ${wardrobeItems.length} items using ${searchMethod.toUpperCase()}`);
      
      // Apply existing fashion logic
      const compatibleItemsFound = [];
      
      wardrobeItems.forEach(item => {
        const similarity = item.similarity || 0;
        
        console.log(`📊 ${item.tags?.name || 'Item'}: ${Math.round(similarity * 100)}% similarity`);
        
        // Check for duplicates
        if (itemAnalysis?.analysis && item.tags?.aiResults?.analysis) {
          const hybridSimilarity = searchMethod === 'pinecone' ? 
            { overall: similarity, components: { clip: 0, text: similarity, attribute: 0 } } :
            { overall: similarity, components: item.similarityComponents };
            
          const isItemDuplicate = isDuplicate(
            itemAnalysis.analysis,
            item.tags.aiResults.analysis,
            hybridSimilarity
          );
          
          if (isItemDuplicate) {
            duplicateItems.push({
              ...item,
              similarity: Math.round(similarity * 100) / 100,
              duplicateReason: similarity > 0.92 ? 
                'Very high similarity detected' : 
                'High similarity + similar attributes'
            });
            return;
          }
        }
        
        // Check fashion compatibility
        let canWearTogether = false;
        if (itemAnalysis?.analysis && item.tags?.aiResults?.analysis) {
          canWearTogether = areItemsCompatible(
            itemAnalysis.analysis,
            item.tags.aiResults.analysis
          );
        }
        
        // Apply similarity thresholds
        const formality1 = itemAnalysis?.analysis ? getFormalityLevel(itemAnalysis.analysis) : 'neutral';
        const formality2 = item.tags?.aiResults?.analysis ? getFormalityLevel(item.tags.aiResults.analysis) : 'neutral';
        
        let similarityThreshold = 0.3;
        if ((formality1 === 'formal' && formality2 === 'formal')) {
          similarityThreshold = 0.1;
        } else if (isAccessory(itemAnalysis?.analysis) || isAccessory(item.tags?.aiResults?.analysis)) {
          similarityThreshold = 0.05;
        }
        
        // Boost similarity for fashion-rule based matches
        let adjustedSimilarity = similarity;
        if (canWearTogether) {
          const type1 = itemAnalysis?.analysis?.type?.toLowerCase() || '';
          const type2 = item.tags?.aiResults?.analysis?.type?.toLowerCase() || '';
          
          if ((type1.includes('belt') && (type2.includes('pants') || formality2 === 'formal')) ||
              (type2.includes('belt') && (type1.includes('pants') || formality1 === 'formal'))) {
            adjustedSimilarity = Math.min(similarity + 0.5, 0.95);
            console.log(`🎯 Belt+Pants boost: ${Math.round(similarity * 100)}% → ${Math.round(adjustedSimilarity * 100)}%`);
          } else if (isAccessory(itemAnalysis?.analysis) || isAccessory(item.tags?.aiResults?.analysis)) {
            adjustedSimilarity = Math.min(similarity + 0.3, 0.9);
          }
        }
        
        if (canWearTogether && adjustedSimilarity > similarityThreshold) {
          compatibleItemsFound.push({
            id: item.id,
            name: item.tags?.name || item.name || 'Wardrobe Item',
            imageUrl: item.imageUrl,
            similarity: Math.round(adjustedSimilarity * 100) / 100,
            compatibilityReason: 'Passes fashion logic + similarity',
            embeddingType: searchMethod
          });
        } else if (canWearTogether && similarity > 0.01) {
          compatibleItemsFound.push({
            id: item.id,
            name: item.tags?.name || item.name || 'Wardrobe Item',
            imageUrl: item.imageUrl,
            similarity: Math.round(adjustedSimilarity * 100) / 100,
            compatibilityReason: 'Fashion compatible (low similarity)',
            embeddingType: searchMethod
          });
        }
      });
      
      // Sort by similarity
      compatibleItemsFound.sort((a, b) => b.similarity - a.similarity);
      duplicateItems.sort((a, b) => b.similarity - a.similarity);
      
      finalCompatibleItems = compatibleItemsFound;
      console.log(`📊 Final results: ${finalCompatibleItems.length} compatible, ${duplicateItems.length} duplicates`);
    }
    
    // Step 3: Generate styling advice
    let stylingAdvice = '';
    if (finalCompatibleItems.length > 0) {
      console.log('🤖 Generating AI styling advice with Gemini...');
      
      const topItems = finalCompatibleItems.slice(0, 8);
      const wardrobeContext = topItems.map(item => {
        const name = item.name || 'Item';
        const similarity = `${Math.round(item.similarity * 100)}% match`;
        return `- ${name} (${similarity})`;
      }).join('\n');
      
      stylingAdvice = await generateGeminiStylingAdvice(itemDescription, wardrobeContext);
      
    } else {
      stylingAdvice = JSON.stringify([{
        title: "Build Around This Piece",
        description: "This item appears to be quite unique! While it doesn't closely match items in your current wardrobe based on fashion compatibility rules, it could be a great statement piece to build new outfits around.",
        items: [],
        occasion: "Consider adding complementary basics to style this unique piece"
      }]);
    }
    
    // Parse styling advice
    const parsedStylingAdvice = parseGeminiStylingResponse(stylingAdvice);
    
    // Generate recommendations
    let recommendation = '';
    if (!compatibleItems) {
      const isDressItem = isCompleteOutfit(itemAnalysis?.analysis);
      
      if (duplicateItems.length > 0) {
        recommendation = '🛑 Consider skipping this purchase - you already have similar items.';
      } else if (isDressItem) {
        const accessoryCount = finalCompatibleItems.filter(item => 
          item.tags?.aiResults?.analysis && isAccessory(item.tags.aiResults.analysis)
        ).length;
        
        if (accessoryCount >= 2) {
          recommendation = '🌟 Perfect dress choice! You have great accessories to style it with.';
        } else if (accessoryCount >= 1) {
          recommendation = '👍 Good choice! You can style this dress with some accessories.';
        } else {
          recommendation = '⚠️ Limited styling options. Consider adding accessories for this dress.';
        }
      } else {
        const count = finalCompatibleItems.length;
        if (count >= 8) {
          recommendation = '🌟 Excellent choice! This item works with many pieces in your wardrobe.';
        } else if (count >= 4) {
          recommendation = '👍 Good versatility! This will pair well with several items you own.';
        } else if (count >= 2) {
          recommendation = '⚠️ Limited matches. Consider if you really need this item.';
        } else {
          recommendation = '❌ This item doesn\'t match well with your current wardrobe.';
        }
      }
    } else {
      recommendation = '🎨 Custom styling based on your selected wardrobe items.';
    }
    
    console.log('✅ Image RAG analysis finished!');
    
    res.json({
      success: true,
      result: {
        itemDescription: itemDescription,
        stylingAdvice: parsedStylingAdvice,
        
        compatibleItems: finalCompatibleItems.slice(0, 10),
        
        duplicateItems: duplicateItems.slice(0, 3),
        duplicateWarning: duplicateItems.length > 0 ? 
          `⚠️ **Duplicate Alert!** You already have ${duplicateItems.length} similar item${duplicateItems.length > 1 ? 's' : ''} in your wardrobe.` : null,
        hasDuplicates: duplicateItems.length > 0,
        
        totalCompatibleItems: finalCompatibleItems.length,
        versatilityScore: Math.round(Math.min(finalCompatibleItems.length / 5, 1) * 100) / 100,
        recommendation: recommendation,
        
        metadata: {
          processedAt: new Date().toISOString(),
          ragType: 'hybrid-image-rag',
          version: 'v5.0-pinecone-backend',
          wardrobeSize: compatibleItems ? 'custom' : 'full-analysis',
          fashionLogicEnabled: true,
          duplicatesFound: duplicateItems.length,
          customStyling: !!compatibleItems,
          searchMethod: searchMethod,
          embeddingTypes: {
            hasClip: !!queryEmbeddings.clipEmbedding,
            hasText: !!queryEmbeddings.textEmbedding,
            hasAttribute: !!queryEmbeddings.attributeEmbedding
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in Image RAG:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🆕 NEW: Manual function to add items to Pinecone (called from other functions)
exports.addItemToPineconeManual = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const { userId, itemId, itemData } = req.body.data || req.body;
    
    if (!userId || !itemId || !itemData) {
      res.status(400).json({ error: 'userId, itemId, and itemData are required' });
      return;
    }
    
    console.log(`📤 Adding item ${itemId} to Pinecone for user ${userId}`);
    
    const pc = initPinecone();
    if (!pc) {
      res.status(500).json({ error: 'Pinecone not configured' });
      return;
    }
    
    const textEmbedding = itemData.textEmbedding || itemData.trueImageEmbedding;
    const analysis = itemData.tags?.aiResults?.analysis;
    
    if (!textEmbedding || !analysis) {
      res.status(400).json({ error: 'Missing embedding or analysis data' });
      return;
    }
    
    const index = pc.index('fitcheck-main');
    
    await index.upsert([{
      id: itemId,
      values: textEmbedding,
      metadata: {
        userId: userId,
        itemName: analysis.itemName || 'Unknown Item',
        category: analysis.category || 'Other',
        style: analysis.style || 'casual',
        season: analysis.season || 'all-season',
        occasion: analysis.occasion || 'everyday',
        primaryColor: analysis.color?.primary || 'unknown',
        secondaryColor: analysis.color?.secondary || '',
        pattern: analysis.color?.pattern || 'solid',
        material: analysis.material || 'unknown',
        imageUrl: itemData.imageUrl || '',
        timestamp: Date.now()
      }
    }]);
    
    console.log(`✅ Successfully added item ${itemId} to Pinecone`);
    
    res.json({
      success: true,
      message: `Item ${itemId} added to Pinecone successfully`
    });
    
  } catch (error) {
    console.error('❌ Failed to add item to Pinecone:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});