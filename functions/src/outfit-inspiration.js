// functions/src/outfit-inspiration.js
const functions = require("firebase-functions");

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
}

exports.getOutfitInspiration = functions.https.onRequest(async (req, res) => {
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
    const { itemAnalysis } = req.body.data || req.body;
    
    if (!itemAnalysis?.analysis) {
      res.status(400).json({ 
        error: 'Item analysis required',
        received: req.body 
      });
      return;
    }
    
    const item = itemAnalysis.analysis;
    console.log('🎨 Getting outfit inspiration for:', item.itemName);
    
    // Get Unsplash API key from environment
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || 
                        functions.config().unsplash?.access_key;
    
    if (!UNSPLASH_KEY) {
      console.error('❌ No Unsplash API key found');
      // Return platform links even without API key
      res.json({
        success: true,
        inspiration: {
          images: [],
          exploreMore: generatePlatformLinks(item),
          message: 'API key not configured. Click links below to explore outfit ideas.'
        }
      });
      return;
    }
    
    // Build search query for complete outfits (not just product shots)
    const searchQuery = `${item.itemName} outfit full body fashion style look`;
    console.log('🔍 Searching Unsplash for:', searchQuery);
    
    // Call Unsplash API
    const fetch = require('node-fetch');
    const response = await fetch(
      `https://api.unsplash.com/search/photos?` +
      `query=${encodeURIComponent(searchQuery)}&` +
      `per_page=15&` +  // Get 15 outfit images
      `orientation=portrait`,  // Fashion photos are usually portrait
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('❌ Unsplash API error:', response.status);
      if (response.status === 401) {
        throw new Error('Invalid Unsplash API key');
      } else if (response.status === 403) {
        throw new Error('Unsplash rate limit exceeded (50/hour)');
      }
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the results for the app
    const outfitImages = (data.results || []).map(photo => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      title: photo.description || photo.alt_description || `${item.itemName} outfit inspiration`,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      unsplashUrl: photo.links.html,
      downloadUrl: `${photo.links.download}&client_id=${UNSPLASH_KEY}`,
      width: photo.width,
      height: photo.height,
      color: photo.color
    }));
    
    console.log(`✅ Found ${outfitImages.length} outfit ideas from Unsplash`);
    
    // Return results with platform links
    res.json({
      success: true,
      item: {
        name: item.itemName,
        color: item.color.primary,
        style: item.style,
        type: item.type
      },
      inspiration: {
        images: outfitImages,
        totalFound: outfitImages.length,
        exploreMore: generatePlatformLinks(item),
        searchQuery: searchQuery
      }
    });
    
  } catch (error) {
    console.error('❌ Error in getOutfitInspiration:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Generate links to explore on other platforms (no API needed)
function generatePlatformLinks(item) {
  const itemName = encodeURIComponent(item.itemName);
  const style = encodeURIComponent(item.style || '');
  
  return {
    pinterest: {
      url: `https://pinterest.com/search/pins/?q=${itemName}+outfit+ideas`,
      label: 'Pinterest',
      icon: 'logo-pinterest'
    },
    instagram: {
      url: `https://www.instagram.com/explore/tags/${itemName.replace(/%20/g, '')}outfit/`,
      label: 'Instagram',
      icon: 'logo-instagram'
    },
    youtube: {
      url: `https://www.youtube.com/results?search_query=${itemName}+outfit+ideas+${style}`,
      label: 'YouTube',
      icon: 'logo-youtube'
    },
    google: {
      url: `https://www.google.com/search?q=${itemName}+outfit+inspiration&tbm=isch`,
      label: 'Google Images',
      icon: 'search'
    },
    tiktok: {
      url: `https://www.tiktok.com/search?q=${itemName}%20outfit%20ideas`,
      label: 'TikTok',
      icon: 'logo-tiktok'
    }
  };
}