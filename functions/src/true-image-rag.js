// functions/src/true-image-rag.js - CONSOLIDATED: All functionality in one file
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// ===== UTILITY FUNCTIONS =====

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

// ✅ IMPROVED: Robust JSON parsing for styling advice
const parseGPTStylingResponse = (rawResponse) => {
  try {
    // Handle case where response is already parsed
    if (Array.isArray(rawResponse)) {
      return rawResponse;
    }
    
    // Clean the response first
    let cleanedResponse = rawResponse.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '');
    
    // Remove any leading text before the JSON array
    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
    }
    
    // Try to parse
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate structure
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
    console.error("❌ Failed to parse GPT styling response:", error);
    console.error("Raw response:", rawResponse);
    
    // Fallback: Create a simple structure from the raw text
    return [{
      title: "Styling Advice",
      description: typeof rawResponse === 'string' ? rawResponse : "AI styling advice available",
      items: [],
      occasion: "Various occasions"
    }];
  }
};

// ===== FASHION LOGIC SYSTEM =====

// Define garment type hierarchies for proper fashion logic
const garmentTypes = {
  completeOutfits: ['dress', 'jumpsuit', 'romper', 'overall', 'gown', 'frock'],
  formalPieces: ['blazer', 'suit jacket', 'dress shirt', 'dress pants', 'dress shoes', 'tie', 'bow tie'],
  casualPieces: ['hoodie', 'sweatshirt', 't-shirt', 'tee', 'jeans', 'sneakers', 'baseball cap'],
  casualLayering: ['hoodie', 'sweatshirt', 'pullover'], // NEW: Separate category for casual layering
  activewear: ['sports bra', 'leggings', 'running shoes', 'athletic shorts', 'yoga pants'],
  accessories: ['jewelry', 'necklace', 'earrings', 'bracelet', 'watch', 'scarf', 'belt', 'bag', 'purse'],
  outerwear: ['jacket', 'coat', 'cardigan', 'vest', 'blazer', 'sweater'] // Note: removed hoodie/sweatshirt
};

// Fashion no-no pairs that should never match
const incompatiblePairs = [
  ['dress', 'hoodie'],
  ['dress', 'sweatshirt'],
  ['gown', 'sneakers'],
  ['formal dress', 'baseball cap'],
  ['dress shirt', 'sweatpants'],
  ['blazer', 'athletic shorts']
];

// Check if item is a complete outfit
const isCompleteOutfit = (analysis) => {
  const type = analysis.type?.toLowerCase() || '';
  const category = analysis.category?.toLowerCase() || '';
  return category === 'dresses' || garmentTypes.completeOutfits.some(item => type.includes(item));
};

// Check garment formality level
const getFormalityLevel = (analysis) => {
  const type = analysis.type?.toLowerCase() || '';
  const style = analysis.style?.toLowerCase() || '';
  const color = analysis.color?.primary?.toLowerCase() || '';
  
  // Check style first - it's more reliable than type
  if (style === 'casual') return 'casual';
  if (style === 'formal' || style === 'business') return 'formal';
  if (style === 'athletic') return 'athletic';
  
  // Special handling for shirts - not all button-downs are formal
  if (type.includes('shirt') && !type.includes('dress shirt') && !type.includes('t-shirt')) {
    // Regular shirts in casual colors are casual
    if (['green', 'olive', 'khaki', 'navy', 'gray', 'grey', 'blue'].some(c => color.includes(c))) {
      return 'casual';
    }
    // White/light shirts could be either - check other context
    if (style.includes('smart') || style.includes('casual')) {
      return 'casual';
    }
  }
  
  // Then check specific item types
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

// Check if item is an accessory
const isAccessory = (analysis) => {
  const category = analysis.category?.toLowerCase() || '';
  const type = analysis.type?.toLowerCase() || '';
  return category === 'accessories' || garmentTypes.accessories.some(item => type.includes(item));
};

// Check if item is outerwear
const isOuterwear = (analysis) => {
  const category = analysis.category?.toLowerCase() || '';
  const type = analysis.type?.toLowerCase() || '';
  return category === 'outerwear' || garmentTypes.outerwear.some(item => type.includes(item));
};

// NEW: Check if item is casual layering (hoodie, sweatshirt)
const isCasualLayering = (analysis) => {
  const type = analysis.type?.toLowerCase() || '';
  return garmentTypes.casualLayering.some(item => type.includes(item));
};

// NEW: Check if two items form an incompatible pair
const isIncompatiblePair = (type1, type2) => {
  const t1 = type1.toLowerCase();
  const t2 = type2.toLowerCase();
  
  return incompatiblePairs.some(([item1, item2]) => 
    (t1.includes(item1) && t2.includes(item2)) ||
    (t2.includes(item1) && t1.includes(item2))
  );
};

// Fashion compatibility logic
const areItemsCompatible = (item1Analysis, item2Analysis) => {
  const type1 = item1Analysis.type?.toLowerCase() || '';
  const type2 = item2Analysis.type?.toLowerCase() || '';
  const category1 = item1Analysis.category?.toLowerCase() || '';
  const category2 = item2Analysis.category?.toLowerCase() || '';
  
  console.log(`🔍 Checking compatibility: ${type1} (${category1}) vs ${type2} (${category2})`);
  
  // NEW Rule 0: Check for explicit incompatible pairs
  if (isIncompatiblePair(type1, type2)) {
    console.log(`❌ Fashion no-no: ${type1} + ${type2}`);
    return false;
  }
  
  // Rule 1: Don't match items from same category (except accessories and outerwear)
  if (category1 === category2 && !['accessories', 'outerwear'].includes(category1)) {
    console.log(`❌ Same category (${category1}) - not compatible`);
    return false;
  }
  
  // Get formality levels for both items
  const formality1 = getFormalityLevel(item1Analysis);
  const formality2 = getFormalityLevel(item2Analysis);
  
  // SPECIAL RULE: Belts have unique compatibility rules
  if (type1.includes('belt') || type2.includes('belt')) {
    const beltItem = type1.includes('belt') ? item1Analysis : item2Analysis;
    const otherItem = type1.includes('belt') ? item2Analysis : item1Analysis;
    const otherType = type1.includes('belt') ? type2 : type1;
    const otherFormality = type1.includes('belt') ? formality2 : formality1;
    
    // Belts match with pants and formal items
    if (otherType.includes('pants') || otherType.includes('trousers') || 
        otherType.includes('jeans') || otherType.includes('chinos') ||
        otherType.includes('shorts')) {
      console.log(`✅ Belt matches with bottoms`);
      return true;
    }
    
    // Belts DON'T match with tops (except formal outfits)
    if (otherType.includes('hoodie') || otherType.includes('sweatshirt') || 
        otherType.includes('t-shirt') || (otherType.includes('shirt') && otherFormality === 'casual')) {
      console.log(`❌ Belt doesn't match with casual tops`);
      return false;
    }
    
    // Formal belts match with formal attire
    if (otherFormality === 'formal') {
      console.log(`✅ Belt matches with formal attire`);
      return true;
    }
  }
  
  // SPECIAL RULE: Formal items of same formality level are usually compatible
  if (formality1 === 'formal' && formality2 === 'formal' && category1 !== category2) {
    console.log(`✅ Both formal items from different categories - compatible!`);
    return true;
  }
  
  // Rule 2: Complete outfits (dresses) logic - UPDATED!
  const isCompleteOutfit1 = isCompleteOutfit(item1Analysis);
  const isCompleteOutfit2 = isCompleteOutfit(item2Analysis);
  
  if (isCompleteOutfit1 || isCompleteOutfit2) {
    // NEW: Only allow accessories or FORMAL outerwear with dresses
    const canPairWithDress = (item) => {
      if (isAccessory(item)) return true;
      if (!isOuterwear(item)) return false;
      
      // Outerwear must be formal/neutral AND not casual layering
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
  
  // Rule 3: Formality level compatibility
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
  
  // NEW: Casual and neutral items are always compatible
  if ((formality1 === 'casual' && formality2 === 'neutral') || 
      (formality1 === 'neutral' && formality2 === 'casual') ||
      (formality1 === 'casual' && formality2 === 'casual')) {
    console.log(`✅ Casual/neutral items are compatible`);
    return true;
  }
  
  // Rule 4: Athletic wear compatibility
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
  
  // NEW Rule 5: Special case - casual layering with formal items
  if ((isCasualLayering(item1Analysis) && formality2 === 'formal') ||
      (isCasualLayering(item2Analysis) && formality1 === 'formal')) {
    console.log(`❌ Casual layering cannot mix with formal items`);
    return false;
  }
  
  console.log(`✅ Items are compatible!`);
  return true;
};

// ===== DUPLICATE DETECTION =====

// Check if two colors are similar
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

// Check if two items are duplicates
const isDuplicate = (newItemAnalysis, existingItemAnalysis, similarity) => {
  if (similarity < 0.85) return false;
  if (newItemAnalysis?.category !== existingItemAnalysis?.category) return false;
  
  if (similarity >= 0.90) return true;
  
  const colorSimilar = isColorSimilar(
    newItemAnalysis?.color?.primary, 
    existingItemAnalysis?.color?.primary
  );
  
  return similarity >= 0.85 && colorSimilar;
};

// ===== IMAGE ANALYSIS FUNCTIONS =====

// Generate image embedding by using Gemini's analysis (no GPT-4o vision needed)
const generateImageEmbedding = async (geminiAnalysis, openai) => {
  try {
    console.log('🖼️ Generating image embedding from Gemini analysis...');
    
    // Create a rich description from Gemini's structured analysis
    const imageDescription = `${geminiAnalysis.itemName}: A ${geminiAnalysis.style} ${geminiAnalysis.type} made of ${geminiAnalysis.material}. 
Primary color is ${geminiAnalysis.color.primary}${geminiAnalysis.color.secondary ? ` with ${geminiAnalysis.color.secondary} accents` : ''}. 
Pattern: ${geminiAnalysis.color.pattern || 'solid'}. 
Best suited for ${geminiAnalysis.occasion} occasions during ${geminiAnalysis.season} season.
${geminiAnalysis.confidence.notes ? `Additional details: ${geminiAnalysis.confidence.notes}` : ''}`;
    
    console.log('📝 Generated description from Gemini:', imageDescription);
    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: imageDescription,
      encoding_format: "float"
    });
    
    const imageEmbedding = embeddingResponse.data[0].embedding;
    console.log(`✅ Generated image embedding: ${imageEmbedding.length} dimensions`);
    
    return { embedding: imageEmbedding, description: imageDescription };
    
  } catch (error) {
    console.error('❌ Failed to generate image embedding:', error);
    throw error;
  }
};

// ===== MAIN FUNCTIONS =====

// 🎯 MAIN FUNCTION: Complete Image RAG Analysis
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
    
    console.log('🚀 Starting Complete Image RAG analysis...');
    console.log('📸 Image URL:', imageUrl);
    console.log('👤 User ID:', userId);
    console.log('🔧 Custom compatible items:', compatibleItems ? compatibleItems.length : 'none');
    
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
    
    // Step 1: Generate detailed description from Gemini analysis
    console.log('📝 Step 1: Using Gemini analysis for description...');
    let itemDescription = '';
    
    if (itemAnalysis?.analysis) {
      // Use Gemini's analysis to create description
      const analysis = itemAnalysis.analysis;
      itemDescription = `${analysis.itemName}: A ${analysis.style} ${analysis.type} made of ${analysis.material}. 
Primary color is ${analysis.color.primary}${analysis.color.secondary ? ` with ${analysis.color.secondary} accents` : ''}. 
Pattern: ${analysis.color.pattern || 'solid'}. 
Best suited for ${analysis.occasion} occasions during ${analysis.season} season.
${analysis.confidence.notes ? `Additional details: ${analysis.confidence.notes}` : ''}`;
    } else {
      // Fallback - this shouldn't happen if itemAnalysis is provided
      itemDescription = "A clothing item being analyzed for wardrobe compatibility.";
    }
    
    console.log('📋 Item description:', itemDescription);
    
    // Step 2: Search user's wardrobe with fashion logic (if not using custom items)
    let finalCompatibleItems = [];
    let duplicateItems = [];
    let allSimilarItems = [];
    
    if (compatibleItems) {
      // Use provided compatible items (for custom styling)
      console.log('🎨 Using provided compatible items for custom styling...');
      finalCompatibleItems = compatibleItems;
    } else {
      // Search full wardrobe
      console.log('🔍 Step 2: Searching wardrobe with fashion logic...');
      const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
      const wardrobeSnapshot = await wardrobeRef.get();
      
      const compatibleItemsFound = [];
      
      // Use existing embeddings from itemAnalysis if available, otherwise generate new
      let queryEmbedding;
      if (itemAnalysis?.embedding) {
        queryEmbedding = itemAnalysis.embedding;
        console.log('📊 Using existing attribute embedding for comparison');
      } else if (itemAnalysis?.analysis) {
        // Generate embedding from Gemini analysis
        const imageResult = await generateImageEmbedding(itemAnalysis.analysis, openai);
        queryEmbedding = imageResult.embedding;
        console.log('📊 Generated new image embedding from Gemini analysis');
      } else {
        // This shouldn't happen if itemAnalysis is provided
        throw new Error('No analysis data available for embedding generation');
      }
      
      wardrobeSnapshot.forEach(doc => {
        const item = { id: doc.id, ...doc.data() };
        
        if (!item.embedding || !Array.isArray(item.embedding)) {
          return;
        }
        
        // Use attribute embeddings for compatibility (more reliable for fashion rules)
        const itemEmbedding = item.embedding; // 45D attribute embedding
        const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
        
        console.log(`📊 ${item.tags?.name || 'Item'}: ${Math.round(similarity * 100)}% similarity`);
        
        // Check for duplicates
        if (itemAnalysis?.analysis && item.tags?.aiResults?.analysis) {
          const isItemDuplicate = isDuplicate(
            itemAnalysis.analysis,
            item.tags.aiResults.analysis,
            similarity
          );
          
          if (isItemDuplicate) {
            duplicateItems.push({
              ...item,
              similarity: Math.round(similarity * 100) / 100,
              duplicateReason: similarity >= 0.90 ? 'Very high similarity' : 'High similarity + similar color'
            });
          }
        }
        
        // Add to similar items if high similarity
        if (similarity > 0.7) {
          allSimilarItems.push({
            ...item,
            similarity: Math.round(similarity * 100) / 100
          });
        }
        
        // Check fashion compatibility
        let canWearTogether = false;
        if (itemAnalysis?.analysis && item.tags?.aiResults?.analysis) {
          canWearTogether = areItemsCompatible(
            itemAnalysis.analysis,
            item.tags.aiResults.analysis
          );
        }
        
        // Get formality levels for threshold adjustment
        const formality1 = itemAnalysis?.analysis ? getFormalityLevel(itemAnalysis.analysis) : 'neutral';
        const formality2 = item.tags?.aiResults?.analysis ? getFormalityLevel(item.tags.aiResults.analysis) : 'neutral';
        
        // Get types for accessory boost logic
        const type1 = itemAnalysis?.analysis?.type?.toLowerCase() || '';
        const type2 = item.tags?.aiResults?.analysis?.type?.toLowerCase() || '';
        
        // Check if either item is an accessory
        const isAccessory1 = itemAnalysis?.analysis ? isAccessory(itemAnalysis.analysis) : false;
        const isAccessory2 = item.tags?.aiResults?.analysis ? isAccessory(item.tags.aiResults.analysis) : false;
        
        // Add to compatible items if passes fashion logic
        // LOWERED threshold for formal items and accessories
        let similarityThreshold = 0.3;
        if ((formality1 === 'formal' && formality2 === 'formal')) {
          similarityThreshold = 0.1;
        } else if (isAccessory1 || isAccessory2) {
          // Accessories need even lower threshold as they work with many items
          similarityThreshold = 0.05;
        }
        
        // Boost similarity for fashion-rule based matches
        let adjustedSimilarity = similarity;
        if (canWearTogether) {
          // Belt with pants/formal items gets a boost
          if ((type1.includes('belt') && (type2.includes('pants') || formality2 === 'formal')) ||
              (type2.includes('belt') && (type1.includes('pants') || formality1 === 'formal'))) {
            adjustedSimilarity = Math.min(similarity + 0.5, 0.95); // Major boost for belt+pants
            console.log(`🎯 Belt+Pants boost: ${Math.round(similarity * 100)}% → ${Math.round(adjustedSimilarity * 100)}%`);
          }
          // Other accessories get smaller boost
          else if (isAccessory1 || isAccessory2) {
            adjustedSimilarity = Math.min(similarity + 0.3, 0.9);
          }
        }
        
        if (canWearTogether && adjustedSimilarity > similarityThreshold) {
          compatibleItemsFound.push({
            ...item,
            similarity: Math.round(adjustedSimilarity * 100) / 100,
            compatibilityReason: 'Passes fashion logic + similarity'
          });
        } else if (canWearTogether && similarity > 0.01) {
          // Still add items that pass fashion logic even with very low similarity
          console.log(`📊 Item passes fashion logic but low similarity: ${item.tags?.name} (${Math.round(similarity * 100)}%)`);
          compatibleItemsFound.push({
            ...item,
            similarity: Math.round(adjustedSimilarity * 100) / 100,
            compatibilityReason: 'Fashion compatible (low similarity)'
          });
        }
      });
      
      // Sort by similarity
      compatibleItemsFound.sort((a, b) => b.similarity - a.similarity);
      duplicateItems.sort((a, b) => b.similarity - a.similarity);
      allSimilarItems.sort((a, b) => b.similarity - a.similarity);
      
      finalCompatibleItems = compatibleItemsFound;
      console.log(`📊 Found: ${finalCompatibleItems.length} compatible, ${duplicateItems.length} duplicates`);
    }
    
    // Step 3: Generate styling advice if there are compatible items
    let stylingAdvice = '';
    if (finalCompatibleItems.length > 0) {
      console.log('🤖 Step 3: Generating AI styling advice...');
      
      const topItems = finalCompatibleItems.slice(0, 8);
      const wardrobeContext = topItems.map(item => {
        const name = item.tags?.name || item.name || 'Item';
        const analysis = item.tags?.aiResults?.analysis;
        const similarity = `${Math.round(item.similarity * 100)}% match`;
        return `- ${name} (${similarity}${analysis ? `, ${analysis.style} style, ${analysis.color?.primary}` : ''})`;
      }).join('\n');
      
      // ✅ IMPROVED: Better GPT-4o prompt with clearer instructions
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

      const stylingResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: stylingPrompt }],
        max_tokens: 600, // ✅ INCREASED: More tokens to prevent truncation
        temperature: 0.7
      });
      
      stylingAdvice = stylingResponse.choices[0].message.content;
      console.log('🤖 Raw GPT-4o styling response:', stylingAdvice);
    } else {
      stylingAdvice = JSON.stringify([{
        title: "Build Around This Piece",
        description: "This item appears to be quite unique! While it doesn't closely match items in your current wardrobe based on fashion compatibility rules, it could be a great statement piece to build new outfits around.",
        items: [],
        occasion: "Consider adding complementary basics to style this unique piece"
      }]);
    }
    
    // ✅ IMPROVED: Parse styling advice with robust error handling
    const parsedStylingAdvice = parseGPTStylingResponse(stylingAdvice);
    
    // Generate recommendations (only for full wardrobe analysis, not custom styling)
    let recommendation = '';
    if (!compatibleItems) {
      const isDressItem = isCompleteOutfit(itemAnalysis?.analysis);
      
      if (duplicateItems.length > 0) {
        recommendation = '🛑 Consider skipping this purchase - you already have similar items.';
      } else if (isDressItem) {
        const accessoryCount = finalCompatibleItems.filter(item => 
          isAccessory(item.tags?.aiResults?.analysis)
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
    
    console.log('✅ Complete Image RAG analysis finished!');
    
    res.json({
      success: true,
      result: {
        // Image RAG results
        itemDescription: itemDescription,
        stylingAdvice: parsedStylingAdvice, // ✅ Now properly parsed
        
        // Compatibility results  
        compatibleItems: finalCompatibleItems.slice(0, 10).map(item => ({
          id: item.id,
          name: item.tags?.name || item.name || 'Wardrobe Item',
          imageUrl: item.imageUrl,
          similarity: item.similarity,
          embeddingType: 'fashion-logic-compatible'
        })),
        
        // Duplicate detection (only for full analysis)
        duplicateItems: duplicateItems.slice(0, 3),
        duplicateWarning: duplicateItems.length > 0 ? 
          `⚠️ **Duplicate Alert!** You already have ${duplicateItems.length} similar item${duplicateItems.length > 1 ? 's' : ''} in your wardrobe.` : null,
        hasDuplicates: duplicateItems.length > 0,
        
        // Summary metrics
        totalCompatibleItems: finalCompatibleItems.length,
        versatilityScore: Math.round(Math.min(finalCompatibleItems.length / 5, 1) * 100) / 100,
        recommendation: recommendation,
        
        metadata: {
          processedAt: new Date().toISOString(),
          ragType: 'complete-image-rag',
          version: 'v3.1-improved-parsing', // ✅ Updated version
          wardrobeSize: compatibleItems ? 'custom' : 'full-analysis',
          fashionLogicEnabled: true,
          duplicatesFound: duplicateItems.length,
          customStyling: !!compatibleItems
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in Complete Image RAG:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔧 UTILITY FUNCTION: Upgrade wardrobe items (legacy support)
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
    
    res.json({
      success: true,
      result: {
        message: "Upgrade not needed - using consolidated Image RAG system",
        approach: "complete-image-rag-v3.1-improved-parsing"
      }
    });
    
  } catch (error) {
    console.error('❌ Error in upgrade function:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});