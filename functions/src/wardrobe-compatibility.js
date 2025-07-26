// functions/src/wardrobe-compatibility.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize admin only if it hasn't been initialized already
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

// Check if two colors form a classic pairing
const isClassicColorPairing = (color1, color2) => {
  const normalize = (color) => color.toLowerCase().trim();
  const c1 = normalize(color1);
  const c2 = normalize(color2);
  
  const classicPairs = [
    ['white', 'black'], ['black', 'white'],
    ['white', 'navy'], ['navy', 'white'],
    ['white', 'blue'], ['blue', 'white'],
    ['white', 'gray'], ['gray', 'white'], ['white', 'grey'], ['grey', 'white'],
    ['black', 'gray'], ['gray', 'black'], ['black', 'grey'], ['grey', 'black'],
    ['navy', 'gray'], ['gray', 'navy'], ['navy', 'grey'], ['grey', 'navy'],
    ['navy', 'khaki'], ['khaki', 'navy'],
    ['white', 'khaki'], ['khaki', 'white'],
    ['black', 'beige'], ['beige', 'black'],
    ['navy', 'beige'], ['beige', 'navy']
  ];
  
  return classicPairs.some(pair => 
    (c1.includes(pair[0]) && c2.includes(pair[1])) ||
    (c1.includes(pair[1]) && c2.includes(pair[0]))
  );
};

// Enhanced similarity calculation with style and color weighting
const calculateEnhancedSimilarity = (newItemEmbedding, existingItemEmbedding, newItemAnalysis, existingItemAnalysis) => {
  // Base cosine similarity
  let similarity = cosineSimilarity(newItemEmbedding, existingItemEmbedding);
  
  // Style/formality boost
  if (newItemAnalysis && existingItemAnalysis) {
    // Same style gets a significant boost
    if (newItemAnalysis.style === existingItemAnalysis.style) {
      similarity += 0.15; // +15% for same style
    }
    
    // Business/formal compatibility boost
    const businessFormalStyles = ['business', 'formal'];
    if (businessFormalStyles.includes(newItemAnalysis.style) && 
        businessFormalStyles.includes(existingItemAnalysis.style)) {
      similarity += 0.1; // +10% for business/formal compatibility
    }
    
    // Classic color pairing boost
    if (isClassicColorPairing(newItemAnalysis.color?.primary, existingItemAnalysis.color?.primary)) {
      similarity += 0.2; // +20% for classic color pairings like white+black
      console.log(`🎨 Classic color pairing detected: ${newItemAnalysis.color?.primary} + ${existingItemAnalysis.color?.primary}`);
    }
    
    // Same season boost
    if (newItemAnalysis.season === existingItemAnalysis.season || 
        newItemAnalysis.season === 'all-season' || 
        existingItemAnalysis.season === 'all-season') {
      similarity += 0.05; // +5% for season compatibility
    }
    
    // Same occasion boost
    if (newItemAnalysis.occasion === existingItemAnalysis.occasion) {
      similarity += 0.05; // +5% for same occasion
    }
  }
  
  // Cap at 1.0
  return Math.min(similarity, 1.0);
};

// Check if two items are compatible for outfits
const areItemsCompatible = (item1Analysis, item2Analysis) => {
  // Don't match items from same category (except accessories)
  if (item1Analysis.category === item2Analysis.category && 
      item1Analysis.category !== 'Accessories') {
    return false;
  }
  
  // Style compatibility
  const styleCompatibility = {
    'casual': ['casual', 'athletic'],
    'formal': ['formal', 'business'],
    'business': ['business', 'formal', 'casual'],
    'athletic': ['athletic', 'casual'],
    'evening': ['evening', 'formal']
  };
  
  const style1Compatible = styleCompatibility[item1Analysis.style] || [];
  if (!style1Compatible.includes(item2Analysis.style)) {
    return false;
  }
  
  // Season compatibility
  if (item1Analysis.season !== 'all-season' && 
      item2Analysis.season !== 'all-season' && 
      item1Analysis.season !== item2Analysis.season) {
    return false;
  }
  
  return true;
};

exports.analyzeWardrobeCompatibility = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { newItemEmbedding, newItemAnalysis, userId } = req.body.data || req.body;
    
    console.log('🔍 Analyzing wardrobe compatibility for user:', userId);
    console.log('🎯 New item:', newItemAnalysis?.itemName, `(${newItemAnalysis?.style}, ${newItemAnalysis?.color?.primary})`);
    
    if (!newItemEmbedding || !userId) {
      res.status(400).json({ error: 'newItemEmbedding and userId are required' });
      return;
    }
    
    // Get user's wardrobe
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const wardrobeSnapshot = await wardrobeRef.get();
    
    console.log(`📚 Found ${wardrobeSnapshot.size} items in wardrobe`);
    
    const compatibleItems = [];
    const similarItems = [];
    
    wardrobeSnapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      
      if (!item.embedding || !Array.isArray(item.embedding)) {
        console.log(`⚠️ Skipping item ${item.id} - no valid embedding`);
        return;
      }
      
      // Calculate enhanced similarity
      const baseSimilarity = cosineSimilarity(newItemEmbedding, item.embedding);
      const enhancedSimilarity = calculateEnhancedSimilarity(
        newItemEmbedding, 
        item.embedding, 
        newItemAnalysis, 
        item.tags?.aiResults?.analysis
      );
      
      console.log(`📊 ${item.tags?.name || 'Item'}: Base=${Math.round(baseSimilarity * 100)}%, Enhanced=${Math.round(enhancedSimilarity * 100)}%`);
      
      // Check if they can be worn together
      let canWearTogether = false;
      if (newItemAnalysis && item.tags?.aiResults?.analysis) {
        canWearTogether = areItemsCompatible(
          newItemAnalysis, 
          item.tags.aiResults.analysis
        );
      }
      
      // Use enhanced similarity for scoring
      const finalSimilarity = enhancedSimilarity;
      
      if (finalSimilarity > 0.7) {
        similarItems.push({
          ...item,
          similarity: Math.round(finalSimilarity * 100) / 100
        });
      }
      
      if (canWearTogether && finalSimilarity > 0.3) {
        compatibleItems.push({
          ...item,
          similarity: Math.round(finalSimilarity * 100) / 100,
          compatibilityReason: 'Style and season match'
        });
      }
    });
    
    // Sort by similarity
    compatibleItems.sort((a, b) => b.similarity - a.similarity);
    similarItems.sort((a, b) => b.similarity - a.similarity);
    
    // Calculate versatility score
    const versatilityScore = Math.min(compatibleItems.length / 5, 1); // Max score at 5+ matches
    
    // Generate recommendation
    let recommendation = '';
    if (compatibleItems.length >= 8) {
      recommendation = '🌟 Excellent choice! This item works with many pieces in your wardrobe.';
    } else if (compatibleItems.length >= 4) {
      recommendation = '👍 Good versatility! This will pair well with several items you own.';
    } else if (compatibleItems.length >= 2) {
      recommendation = '⚠️ Limited matches. Consider if you really need this item.';
    } else {
      recommendation = '❌ This item doesn\'t match well with your current wardrobe.';
    }
    
    console.log(`✅ Analysis complete: ${compatibleItems.length} compatible items found`);
    
    res.json({
      success: true,
      compatibleItems: compatibleItems.slice(0, 10), // Top 10
      similarItems: similarItems.slice(0, 5), // Top 5 similar
      versatilityScore: Math.round(versatilityScore * 100) / 100,
      totalCompatibleItems: compatibleItems.length,
      recommendation: recommendation,
      metadata: {
        processedAt: new Date().toISOString(),
        wardrobeSize: wardrobeSnapshot.size
      }
    });
    
  } catch (error) {
    console.error('❌ Error in analyzeWardrobeCompatibility:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});