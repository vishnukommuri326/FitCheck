// functions/src/ai-stylist-chat.js
const functions = require("firebase-functions");
const OpenAI = require("openai");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firestore if needed
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

// 🆕 REPLICATE CONFIGURATION
const REPLICATE_MODELS = {
  // Primary model - Fast and cheap
  flux_schnell: {
    version: "black-forest-labs/flux-schnell",
    avgTime: 3, // seconds
    cost: 0.003, // per image
    quality: "good"
  },
  // Premium model - Better quality for special requests
  flux_dev: {
    version: "black-forest-labs/flux-dev", 
    avgTime: 8,
    cost: 0.012,
    quality: "excellent"
  },
  // Fallback - Stable Diffusion XL
  sdxl_turbo: {
    version: "stability-ai/sdxl",
    avgTime: 1,
    cost: 0.001,
    quality: "decent"
  }
};

// 🆕 Initialize Replicate
const initReplicate = async () => {
  const apiToken = process.env.REPLICATE_API_TOKEN || 
                   functions.config().replicate?.api_token;
  
  if (!apiToken) {
    console.error('❌ Replicate API token not configured');
    return null;
  }
  
  return apiToken;
};

// 🆕 REPLICATE: Generate outfit image
async function generateOutfitImageWithReplicate(message, item, aiResponse, intent) {
  try {
    const apiToken = await initReplicate();
    if (!apiToken) {
      console.log('⚠️ Replicate not configured, skipping image generation');
      return null;
    }
    
    // Choose model based on intent
    let selectedModel = 'flux_schnell'; // Default
    
    if (intent.celebrityName || message.toLowerCase().includes('premium') || 
        message.toLowerCase().includes('high quality')) {
      selectedModel = 'flux_dev'; // Premium for celebrity styles
      console.log('🌟 Using premium model for celebrity/high-quality request');
    } else if (message.toLowerCase().includes('quick') || 
               message.toLowerCase().includes('fast')) {
      selectedModel = 'sdxl_turbo'; // Fastest option
      console.log('⚡ Using turbo model for speed');
    }
    
    const model = REPLICATE_MODELS[selectedModel];
    
    // Build optimized prompt for fashion
    let imagePrompt = buildFashionPrompt(item, intent, message);
    
    console.log(`🎨 Generating with Replicate ${selectedModel}...`);
    console.log('📝 Prompt:', imagePrompt);
    
    // Create prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model.version,
        input: {
          prompt: imagePrompt,
          ...(selectedModel === 'flux_schnell' && {
            num_outputs: 1,
            aspect_ratio: "3:4", // Portrait for fashion
            output_format: "webp",
            output_quality: 90,
            num_inference_steps: 4,
            disable_safety_checker: false
          }),
          ...(selectedModel === 'flux_dev' && {
            num_outputs: 1,
            aspect_ratio: "3:4",
            output_format: "jpg",
            output_quality: 95,
            num_inference_steps: 28, // More steps = better quality
            guidance_scale: 3.5,
            prompt_strength: 0.8
          }),
          ...(selectedModel === 'sdxl_turbo' && {
            num_outputs: 1,
            width: 768,
            height: 1024,
            num_inference_steps: 1, // Turbo mode
            guidance_scale: 0.0, // Required for turbo
            disable_safety_checker: false
          })
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
    const maxAttempts = selectedModel === 'sdxl_turbo' ? 10 : 30; // Adjust timeout by model
    
    while (!result && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${apiToken}`,
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
        
        // Try fallback model if premium failed
        if (selectedModel === 'flux_dev') {
          console.log('🔄 Retrying with flux_schnell...');
          return generateOutfitImageWithReplicate(message, item, aiResponse, {
            ...intent,
            _retry: true
          });
        }
        
        throw new Error(`Image generation failed: ${status.error}`);
      }
      
      attempts++;
      if (attempts % 5 === 0) {
        console.log(`⏳ Still processing... (${attempts}s)`);
      }
    }
    
    if (!result) {
      throw new Error('Timeout waiting for image generation');
    }
    
    // Extract image URL from result
    let imageUrl;
    if (Array.isArray(result) && result.length > 0) {
      imageUrl = result[0];
    } else if (typeof result === 'string') {
      imageUrl = result;
    } else {
      console.error('❌ Unexpected result format:', result);
      throw new Error('Unexpected image result format');
    }
    
    console.log(`✅ Image generated successfully with ${selectedModel}`);
    console.log(`💰 Estimated cost: $${model.cost}`);
    
    return {
      url: imageUrl,
      prompt: imagePrompt,
      model: selectedModel,
      cost: model.cost,
      generationTime: attempts
    };
    
  } catch (error) {
    console.error('❌ Replicate image generation error:', error);
    
    // Return null instead of throwing to not break the chat
    return null;
  }
}

// 🆕 Build optimized fashion prompt for Replicate
function buildFashionPrompt(item, intent, message) {
  let prompt = "";
  
  // Start with the base item
  prompt += `Fashion photography featuring a ${item.color.primary} ${item.type}. `;
  
  // Add celebrity style if requested
  if (intent.celebrityName) {
    const celebrityStyles = {
      'taylor swift': 'Romantic feminine aesthetic, vintage-inspired, high-waisted bottoms, flowing fabrics, pearls and delicate jewelry',
      'beyonce': 'Glamorous power dressing, structured silhouettes, metallic accents, statement accessories',
      'beyoncé': 'Glamorous power dressing, structured silhouettes, metallic accents, statement accessories',
      'zendaya': 'High fashion editorial style, bold colors, avant-garde shapes, mix of textures',
      'rihanna': 'Edgy streetwear luxury, oversized fits, bold prints, chunky accessories',
      'kardashian': 'Minimalist luxury, neutral palette, body-conscious fits, monochrome looks',
      'jenner': 'Model off-duty chic, designer streetwear, crop tops, sleek sunglasses',
      'hadid': 'Effortless model style, vintage denim, leather jackets, designer bags'
    };
    
    const styleGuide = celebrityStyles[intent.celebrityName] || 'celebrity-inspired luxury fashion';
    prompt += `Styled with ${styleGuide}. `;
  }
  
  // Add occasion/style context
  if (intent.occasion) {
    const occasionStyles = {
      'date': 'romantic and elegant styling',
      'work': 'professional business casual styling',
      'party': 'glamorous night-out styling',
      'casual': 'relaxed everyday styling',
      'formal': 'sophisticated formal event styling'
    };
    prompt += `${occasionStyles[intent.occasion] || intent.occasion}. `;
  }
  
  // Add specific styling based on item type
  if (item.category === 'Dresses') {
    prompt += 'Full length outfit photo showing dress with coordinated accessories and shoes. ';
  } else if (item.category === 'Tops') {
    prompt += 'Styled with matching bottoms and accessories for complete outfit. ';
  } else if (item.category === 'Bottoms') {
    prompt += 'Paired with complementary top and accessories. ';
  }
  
  // Technical specifications for better results
  prompt += 'Professional fashion photography, editorial style, clean white background, ';
  prompt += 'full outfit visible, high-end catalog photography, perfect lighting, ';
  prompt += 'no people or mannequins, flat lay or ghost mannequin style, ultra detailed, 8k quality';
  
  // Add negative prompt concepts (what to avoid)
  // Note: Replicate models handle this differently, but we can hint at quality
  prompt += '. Fashion catalog style, Vogue quality, luxury brand presentation';
  
  return prompt;
}

exports.aiStylistChat = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    try {
      const { message, itemAnalysis, userId, conversationHistory = [] } = req.body.data || req.body;
      
      if (!message || !itemAnalysis?.analysis) {
        res.status(400).json({ 
          error: 'Message and item analysis required'
        });
        return;
      }
      
      const item = itemAnalysis.analysis;
      console.log('💬 Enhanced AI Stylist Chat:', message);
      console.log('👔 Item:', item.itemName);
      
      // Initialize OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.api_key
      });
      
      if (!openai.apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      
      // Build detailed context about the item
      const itemContext = `
Item: ${item.itemName}
Color: ${item.color.primary}${item.color.secondary ? ` with ${item.color.secondary} accents` : ''}
Style: ${item.style}
Material: ${item.material}
Season: ${item.season}
Occasion: ${item.occasion}
Pattern: ${item.color.pattern || 'solid'}
Type: ${item.type}
Category: ${item.category}
Additional Details: ${item.confidence?.notes || 'None'}`;
      
      // Enhanced intent parsing
      const intent = parseEnhancedIntent(message);
      console.log('🎯 Detected intent:', intent);
      
      // Get user's wardrobe context if asking about matching
      let wardrobeContext = '';
      if (intent.wantsMatching && userId) {
        wardrobeContext = await getUserWardrobeContext(userId);
      }
      
      // Build conversation with enhanced system prompt
      const messages = [
        {
          role: "system",
          content: `You are an elite fashion stylist with expertise in celebrity fashion, runway trends, and personal styling. 
You have deep knowledge of:
- Celebrity signature styles (Taylor Swift's romantic prep, Beyoncé's glamorous power dressing, Zendaya's avant-garde choices, etc.)
- Fashion history and current trends
- Color theory and pattern mixing
- Body styling and fit optimization
- Seasonal transitions and layering techniques
- Occasion-appropriate dressing
- Budget-friendly alternatives to high-end looks

Current item being styled:
${itemContext}

${wardrobeContext ? `User's wardrobe context:\n${wardrobeContext}\n` : ''}

Guidelines:
- Be specific with recommendations (brands, exact colors, specific styles)
- When discussing celebrities, reference their actual documented outfits and signature looks
- Consider the item's specific attributes when giving advice
- If asked about a celebrity, mention 2-3 specific outfits they've worn with similar items
- For image generation, provide detailed visual descriptions
- Be enthusiastic but professional
- Use fashion terminology correctly
- Consider practicality alongside style
- If the user's request doesn't make sense with the item (e.g., "style this dress like a man would"), gently redirect to better alternatives`
        },
        // Add conversation history for context
        ...conversationHistory.slice(-4).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        // Add current message
        {
          role: "user",
          content: message
        }
      ];
      
      // Get AI response with higher quality settings
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Or "gpt-4o" for even better quality
        messages: messages,
        temperature: 0.7, // Slightly lower for more consistent advice
        max_tokens: 600,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      const aiResponse = completion.choices[0].message.content;
      
      // Generate supplementary content based on intent
      let images = [];
      let generatedImage = null;
      let suggestions = [];
      let shoppingList = [];
      let wardrobeMatches = [];
      
      // Smart image search with better queries
      if (intent.needsImages || intent.wantsCelebrity) {
        images = await searchBetterOutfitImages(message, item, intent);
      }
      
      // 🆕 UPDATED: Use Replicate instead of DALL-E
      if (intent.wantsGenerated || intent.wantsCelebrity || message.toLowerCase().includes('show me')) {
        generatedImage = await generateOutfitImageWithReplicate(message, item, aiResponse, intent);
      }
      
      // Get wardrobe matches if relevant
      if (intent.wantsMatching && userId) {
        wardrobeMatches = await findWardrobeMatches(userId, item, message);
      }
      
      // Generate smart follow-up suggestions
      suggestions = generateSmartSuggestions(intent, item, aiResponse);
      
      // Generate shopping list if relevant
      if (intent.wantsShopping || aiResponse.includes('you could add') || aiResponse.includes('pair with')) {
        shoppingList = extractShoppingList(aiResponse, item);
      }
      
      // Add style tips based on the response
      const styleTips = generateStyleTips(item, intent, aiResponse);
      
      res.json({
        success: true,
        response: aiResponse,
        images: images,
        generatedImage: generatedImage,
        suggestions: suggestions,
        shoppingList: shoppingList,
        wardrobeMatches: wardrobeMatches,
        styleTips: styleTips,
        intent: intent
      });
      
    } catch (error) {
      console.error('❌ Enhanced AI Stylist Chat error:', error);
      
      // Fallback response
      const fallbackResponse = generateFallbackResponse(error.message);
      
      res.json({ 
        success: false,
        response: fallbackResponse,
        suggestions: [
          "Show me casual styling ideas",
          "How would celebrities wear this?",
          "What should I buy to complete this look?"
        ]
      });
    }
  });

// Enhanced intent parsing
function parseEnhancedIntent(message) {
  const lower = message.toLowerCase();
  
  // Celebrity detection with specific names
  const celebrities = [
    'taylor swift', 'beyonce', 'beyoncé', 'rihanna', 'zendaya', 
    'kardashian', 'jenner', 'hadid', 'bieber', 'styles', 'gomez',
    'blake lively', 'emma stone', 'margot robbie', 'timothée chalamet'
  ];
  
  const detectedCelebrity = celebrities.find(celeb => lower.includes(celeb));
  
  return {
    wantsOccasion: /date|work|party|wedding|interview|casual|formal|beach|dinner|brunch|club/.test(lower),
    wantsCelebrity: !!detectedCelebrity,
    celebrityName: detectedCelebrity,
    wantsSeason: /summer|winter|spring|fall|autumn|cold|warm|weather/.test(lower),
    wantsTrend: /trend|fashion|style|aesthetic|vibe|look|outfit|core/.test(lower),
    wantsShopping: /buy|shop|need|missing|complete|purchase|get|add/.test(lower),
    wantsAlternative: /instead|alternative|swap|change|different|other/.test(lower),
    wantsMatching: /match|coordinate|pair|combine|wear with|style with/.test(lower),
    wantsGenerated: /generate|create|show me|visualize|imagine|design/.test(lower),
    needsImages: /show|picture|photo|see|look|example|inspiration/.test(lower) || 
                 /celebrity|outfit|inspiration/.test(lower),
    occasion: extractOccasion(lower),
    style: extractStyle(lower),
    gender: extractGender(lower)
  };
}

// Extract occasion from message
function extractOccasion(message) {
  const occasions = {
    'date': ['date', 'romantic', 'dinner', 'dating'],
    'work': ['work', 'office', 'professional', 'business', 'meeting'],
    'party': ['party', 'club', 'night out', 'dancing'],
    'casual': ['casual', 'everyday', 'relaxed', 'comfortable'],
    'formal': ['formal', 'gala', 'wedding', 'black tie'],
    'athletic': ['gym', 'workout', 'athletic', 'sports']
  };
  
  for (const [key, keywords] of Object.entries(occasions)) {
    if (keywords.some(word => message.includes(word))) {
      return key;
    }
  }
  return null;
}

// Extract style aesthetic
function extractStyle(message) {
  const styles = {
    'preppy': ['preppy', 'prep', 'ivy league', 'academic'],
    'streetwear': ['street', 'urban', 'hype', 'sneaker'],
    'minimalist': ['minimal', 'simple', 'clean', 'basic'],
    'bohemian': ['boho', 'bohemian', 'hippie', 'free spirit'],
    'vintage': ['vintage', 'retro', '90s', '80s', '70s', 'throwback'],
    'edgy': ['edgy', 'punk', 'rock', 'grunge', 'alternative']
  };
  
  for (const [key, keywords] of Object.entries(styles)) {
    if (keywords.some(word => message.includes(word))) {
      return key;
    }
  }
  return null;
}

// Extract gender preference for styling
function extractGender(message) {
  if (/\b(mens?|male|masculine|guys?|boys?)\b/.test(message)) return 'male';
  if (/\b(womens?|female|feminine|girls?|ladies)\b/.test(message)) return 'female';
  if (/\b(unisex|gender.?neutral|androgynous)\b/.test(message)) return 'neutral';
  return null; // Will use item context to determine
}

// Better image search with enhanced queries
async function searchBetterOutfitImages(query, item, intent) {
  try {
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || 
                        functions.config().unsplash?.access_key;
    
    if (!UNSPLASH_KEY) {
      return [];
    }
    
    // Build smarter search query based on intent
    let searchQuery = '';
    
    if (intent.celebrityName) {
      // For celebrity searches, be specific
      searchQuery = `${intent.celebrityName} fashion style ${item.category} outfit`;
      
      // Add gender context to avoid mismatches
      if (intent.celebrityName.includes('taylor') || intent.celebrityName.includes('beyonce')) {
        searchQuery += ' women female';
      }
    } else if (intent.occasion) {
      searchQuery = `${intent.occasion} ${item.style} ${item.category} outfit fashion`;
      
      // Add gender if specified
      if (intent.gender) {
        searchQuery += ` ${intent.gender}`;
      }
    } else if (intent.style) {
      searchQuery = `${intent.style} ${item.itemName} outfit fashion style`;
    } else {
      // Default query with better specificity
      searchQuery = `${item.itemName} ${item.style} outfit fashion styled look`;
      
      // Add context based on item type
      if (item.category === 'Dresses') {
        searchQuery += ' women female dress outfit';
      } else if (item.category === 'Tops') {
        searchQuery += ' styled outfit complete look';
      }
    }
    
    console.log('🔍 Enhanced search query:', searchQuery);
    
    const fetch = require('node-fetch');
    const response = await fetch(
      `https://api.unsplash.com/search/photos?` +
      `query=${encodeURIComponent(searchQuery)}&` +
      `per_page=6&` +  // Get more to filter
      `orientation=portrait`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    // Filter and rank results for relevance
    const rankedResults = (data.results || [])
      .map(photo => {
        // Score based on relevance
        let score = 0;
        const desc = (photo.description || photo.alt_description || '').toLowerCase();
        
        // Check if description matches intent
        if (intent.celebrityName && desc.includes(intent.celebrityName)) score += 3;
        if (intent.occasion && desc.includes(intent.occasion)) score += 2;
        if (desc.includes(item.category.toLowerCase())) score += 2;
        if (desc.includes('outfit') || desc.includes('fashion')) score += 1;
        
        return { ...photo, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Take top 3 most relevant
    
    return rankedResults.map(photo => ({
      thumbnail: photo.urls.small,
      url: photo.links.html,
      description: photo.description || photo.alt_description,
      relevance: photo.relevanceScore
    }));
    
  } catch (error) {
    console.error('Image search error:', error);
    return [];
  }
}

// Get user's wardrobe context
async function getUserWardrobeContext(userId) {
  try {
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const snapshot = await wardrobeRef.limit(20).get();
    
    if (snapshot.empty) {
      return '';
    }
    
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.tags?.name) {
        items.push(data.tags.name);
      }
    });
    
    return `User's wardrobe includes: ${items.join(', ')}`;
    
  } catch (error) {
    console.error('Error fetching wardrobe:', error);
    return '';
  }
}

// Find matching items in user's wardrobe
async function findWardrobeMatches(userId, item, message) {
  try {
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const snapshot = await wardrobeRef.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    const matches = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const wardrobeItem = data.tags?.aiResults?.analysis;
      
      if (wardrobeItem && isGoodMatch(item, wardrobeItem)) {
        matches.push({
          id: doc.id,
          name: data.tags.name || wardrobeItem.itemName,
          category: wardrobeItem.category,
          color: wardrobeItem.color?.primary,
          imageUrl: data.imageUrl,
          matchReason: getMatchReason(item, wardrobeItem)
        });
      }
    });
    
    return matches.slice(0, 5); // Return top 5 matches
    
  } catch (error) {
    console.error('Error finding wardrobe matches:', error);
    return [];
  }
}

// Check if items match well
function isGoodMatch(item1, item2) {
  // Don't match same category (except accessories)
  if (item1.category === item2.category && item1.category !== 'Accessories') {
    return false;
  }
  
  // Check style compatibility
  const compatibleStyles = {
    'casual': ['casual', 'athletic', 'streetwear'],
    'formal': ['formal', 'business', 'evening'],
    'business': ['business', 'formal', 'smart casual']
  };
  
  const style1 = item1.style?.toLowerCase();
  const style2 = item2.style?.toLowerCase();
  
  if (compatibleStyles[style1] && !compatibleStyles[style1].includes(style2)) {
    return false;
  }
  
  return true;
}

// Get reason why items match
function getMatchReason(item1, item2) {
  const reasons = [];
  
  if (item1.style === item2.style) {
    reasons.push(`Same ${item1.style} style`);
  }
  
  if (item1.season === item2.season) {
    reasons.push(`Both ${item1.season} appropriate`);
  }
  
  // Color matching logic
  const neutralColors = ['black', 'white', 'gray', 'grey', 'beige', 'navy', 'brown'];
  if (neutralColors.includes(item2.color?.primary?.toLowerCase())) {
    reasons.push('Neutral color matches everything');
  }
  
  return reasons.join(', ') || 'Good style match';
}

// Generate smart suggestions based on context
function generateSmartSuggestions(intent, item, aiResponse) {
  const suggestions = [];
  
  // Context-aware suggestions
  if (intent.celebrityName) {
    suggestions.push(`Show me more ${intent.celebrityName} inspired looks`);
    suggestions.push(`How would other celebrities style this?`);
  }
  
  if (!intent.wantsOccasion) {
    suggestions.push(`How to style this for a date night?`);
    suggestions.push(`Make this work appropriate`);
  }
  
  if (!intent.wantsShopping) {
    suggestions.push(`What accessories would complete this look?`);
  }
  
  if (item.season !== 'all-season') {
    const oppositeSeason = item.season === 'summer' ? 'winter' : 'summer';
    suggestions.push(`How to transition this for ${oppositeSeason}?`);
  }
  
  if (!intent.wantsAlternative) {
    suggestions.push(`Show me 3 completely different styling options`);
  }
  
  // Add trending suggestions
  const trendingSuggestions = [
    `Make this "old money" aesthetic`,
    `Style this with a streetwear twist`,
    `Create a minimalist look with this`
  ];
  
  // Add one trending suggestion if space
  if (suggestions.length < 3) {
    suggestions.push(trendingSuggestions[Math.floor(Math.random() * trendingSuggestions.length)]);
  }
  
  return suggestions.slice(0, 4);
}

// Extract shopping list from AI response
function extractShoppingList(aiResponse, item) {
  const shoppingItems = new Set();
  
  // Common fashion items to look for
  const fashionItems = [
    // Footwear
    /\b(sneakers?|boots?|heels?|loafers?|sandals?|flats?|oxfords?|pumps?|mules?)\b/gi,
    // Bags
    /\b(bag|purse|clutch|tote|backpack|crossbody|handbag)\b/gi,
    // Outerwear
    /\b(jacket|blazer|coat|cardigan|vest|bomber|denim jacket|leather jacket)\b/gi,
    // Bottoms
    /\b(jeans|pants?|trousers?|shorts?|skirt|leggings?|chinos?)\b/gi,
    // Tops
    /\b(shirt|blouse|top|tee|t-shirt|sweater|hoodie|tank top)\b/gi,
    // Accessories
    /\b(belt|watch|jewelry|necklace|bracelet|earrings?|scarf|hat|cap)\b/gi,
    // Specific items with descriptors
    /\b(white\s+\w+|black\s+\w+|leather\s+\w+|denim\s+\w+|silk\s+\w+)\b/gi
  ];
  
  fashionItems.forEach(pattern => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up and add to set (avoids duplicates)
        const cleanItem = match.trim().toLowerCase();
        if (!cleanItem.includes(item.type?.toLowerCase())) {
          shoppingItems.add(match.trim());
        }
      });
    }
  });
  
  // Convert to array and format nicely
  return Array.from(shoppingItems)
    .map(item => item.charAt(0).toUpperCase() + item.slice(1))
    .slice(0, 6); // Limit to 6 items
}

// Generate style tips based on the conversation
function generateStyleTips(item, intent, aiResponse) {
  const tips = [];
  
  // Color-based tips
  if (item.color?.primary) {
    const colorTips = {
      'black': '🖤 Black goes with everything - experiment with textures',
      'white': '⚪ Keep whites crisp - layer with colors or patterns',
      'red': '❤️ Red is a statement - keep accessories minimal',
      'blue': '💙 Blue is versatile - try different shades together',
      'green': '💚 Green pairs beautifully with earth tones',
      'pink': '💗 Pink can be edgy or sweet - it\'s all in the styling'
    };
    
    const primaryColor = item.color.primary.toLowerCase();
    Object.keys(colorTips).forEach(color => {
      if (primaryColor.includes(color)) {
        tips.push(colorTips[color]);
      }
    });
  }
  
  // Style-based tips
  if (item.style) {
    const styleTips = {
      'casual': '👟 Elevate casual with one dressy element',
      'formal': '👔 Formal doesn\'t mean boring - add personality with accessories',
      'athletic': '🏃 Athletic wear can be streetwear with the right styling',
      'business': '💼 Business attire + trendy accessories = modern professional'
    };
    
    if (styleTips[item.style]) {
      tips.push(styleTips[item.style]);
    }
  }
  
  // Intent-based tips
  if (intent.wantsCelebrity) {
    tips.push('⭐ Celebrity style is about confidence - own your look!');
  }
  
  if (intent.occasion === 'date') {
    tips.push('💕 For dates: comfortable confidence is key');
  }
  
  return tips.slice(0, 3);
}

// Generate fallback response
function generateFallbackResponse(errorMessage) {
  if (errorMessage.includes('API key')) {
    return "I'm having trouble connecting to my styling database. Let me give you some general advice: " +
           "This piece is versatile and can be styled many ways. Try pairing it with basics for a casual look, " +
           "or dress it up with accessories for special occasions.";
  }
  
  return "Let me help you style this piece! While I couldn't fetch specific images, I can suggest: " +
         "1) Pair with neutral basics for everyday wear, 2) Add statement accessories for impact, " +
         "3) Layer with different textures for visual interest. What specific styling challenge can I help with?";
}