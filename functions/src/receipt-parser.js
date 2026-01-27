// functions/src/receipt-parser.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const busboy = require("busboy");

// Initialize Firestore if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Store parsers for different retailers
const RETAILER_PARSERS = {
  // Test parser for development
  'test': {
    detect: (from, subject) => from.includes('test@') || subject.includes('[TEST]'),
    parse: (html, text) => {
      // Simple test format: "[TEST] Item Name | Color | Category | ImageURL"
      const lines = text.split('\n').filter(l => l.trim());
      const items = [];
      
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 3) {
            items.push({
              name: parts[0].replace('[TEST]', '').trim(),
              color: parts[1] || 'Unknown',
              category: parts[2] || 'Other',
              imageUrl: parts[3] || null,
              price: parts[4] || null
            });
          }
        }
      }
      return items;
    }
  },
  
  // Zara
  'zara': {
    detect: (from, subject) => from.includes('zara.com') || from.includes('zara@'),
    parse: (html) => {
      const items = [];
      // Zara receipt pattern - look for product blocks
      const productRegex = /<td[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?(\d+\.\d{2})/gi;
      let match;
      
      while ((match = productRegex.exec(html)) !== null) {
        items.push({
          name: match[2].trim(),
          imageUrl: match[1],
          price: match[3],
          category: 'Other'
        });
      }
      
      // Fallback: simpler pattern
      if (items.length === 0) {
        const simpleRegex = /product[^>]*>[\s\S]*?([A-Z][A-Za-z\s]+(?:Dress|Shirt|Pants|Jacket|Top|Skirt|Blouse|Coat|Jeans|Shorts))/gi;
        while ((match = simpleRegex.exec(html)) !== null) {
          items.push({ name: match[1].trim(), category: 'Other' });
        }
      }
      
      return items;
    }
  },
  
  // H&M
  'hm': {
    detect: (from, subject) => from.includes('hm.com') || from.includes('h&m') || subject.toLowerCase().includes('h&m'),
    parse: (html) => {
      const items = [];
      const productRegex = /<tr[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?(\d+\.\d{2})/gi;
      let match;
      
      while ((match = productRegex.exec(html)) !== null) {
        items.push({
          name: match[2].trim(),
          imageUrl: match[1],
          price: match[3],
          category: 'Other'
        });
      }
      return items;
    }
  },
  
  // Nike
  'nike': {
    detect: (from, subject) => from.includes('nike.com') || from.includes('nike@'),
    parse: (html) => {
      const items = [];
      const productRegex = /product-name[^>]*>([^<]+)<[\s\S]*?src="([^"]+)"[\s\S]*?(\d+\.\d{2})/gi;
      let match;
      
      while ((match = productRegex.exec(html)) !== null) {
        items.push({
          name: match[1].trim(),
          imageUrl: match[2],
          price: match[3],
          category: 'Footwear' // Default for Nike
        });
      }
      return items;
    }
  },
  
  // Uniqlo
  'uniqlo': {
    detect: (from, subject) => from.includes('uniqlo') || subject.toLowerCase().includes('uniqlo'),
    parse: (html) => {
      const items = [];
      const productRegex = /<td[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?(\d+\.\d{2})/gi;
      let match;
      
      while ((match = productRegex.exec(html)) !== null) {
        items.push({
          name: match[2].trim(),
          imageUrl: match[1],
          price: match[3],
          category: 'Other'
        });
      }
      return items;
    }
  },
  
  // Amazon
  'amazon': {
    detect: (from, subject) => from.includes('amazon.com') || from.includes('amazon@'),
    parse: (html) => {
      const items = [];
      // Amazon has complex email structure
      const productRegex = /item-title[^>]*>([^<]+)<[\s\S]*?src="([^"]+)"[\s\S]*?\$(\d+\.\d{2})/gi;
      let match;
      
      while ((match = productRegex.exec(html)) !== null) {
        const name = match[1].trim();
        // Only include clothing-related items
        const clothingKeywords = ['shirt', 'pants', 'dress', 'jacket', 'shoes', 'sneakers', 'hoodie', 'sweater', 'jeans', 'shorts', 'skirt', 'coat', 'top', 'blouse'];
        if (clothingKeywords.some(kw => name.toLowerCase().includes(kw))) {
          items.push({
            name: name,
            imageUrl: match[2],
            price: match[3],
            category: 'Other'
          });
        }
      }
      return items;
    }
  },

  // ASOS
  'asos': {
    detect: (from, subject) => from.includes('asos.com') || from.includes('asos@'),
    parse: (html) => {
      const items = [];
      const productRegex = /product[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?£?(\d+\.\d{2})/gi;
      let match;
      
      while ((match = productRegex.exec(html)) !== null) {
        items.push({
          name: match[2].trim(),
          imageUrl: match[1],
          price: match[3],
          category: 'Other'
        });
      }
      return items;
    }
  },
  
  // Generic fallback parser
  'generic': {
    detect: () => true, // Always matches as fallback
    parse: (html, text) => {
      const items = [];
      
      // Try to find product images with nearby text
      const imgRegex = /<img[^>]*src="(https?:\/\/[^"]+(?:product|item|goods)[^"]*)"[^>]*>/gi;
      let match;
      
      while ((match = imgRegex.exec(html)) !== null) {
        items.push({
          imageUrl: match[1],
          name: 'Unknown Item',
          category: 'Other'
        });
      }
      
      return items;
    }
  }
};

// Parse multipart form data from SendGrid
const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    
    bb.on('field', (name, val) => {
      fields[name] = val;
    });
    
    bb.on('finish', () => {
      resolve(fields);
    });
    
    bb.on('error', reject);
    
    if (req.rawBody) {
      bb.end(req.rawBody);
    } else {
      req.pipe(bb);
    }
  });
};

// Extract user ID from email address
// Format: receipts+{userId}@fitcheck.ink
const extractUserId = (toEmail) => {
  const match = toEmail.match(/receipts\+([^@]+)@(?:receipts\.)?fitcheck\.ink/i);
  return match ? match[1] : null;
};

// Main webhook handler
exports.receiveReceipt = functions.https.onRequest(async (req, res) => {
  console.log('📧 Received email webhook from SendGrid');
  
  try {
    // Debug: log raw request info
    console.log('📨 Full request body:', JSON.stringify(req.body || {}).substring(0, 1000));
    console.log('📨 Body keys:', Object.keys(req.body || {}));
    console.log('📨 Headers:', JSON.stringify(req.headers).substring(0, 500));
    
    // Parse the incoming email data
    const fields = await parseFormData(req);
    
    const from = fields.from || '';
    const to = fields.to || '';
    const subject = fields.subject || '';
    const html = fields.html || '';
    const text = fields.text || '';
    
    console.log('📬 Email details:', {
      from: from.substring(0, 50),
      to: to,
      subject: subject.substring(0, 50)
    });
    
    // Extract user ID from the "to" address
    const userId = extractUserId(to);
    
    if (!userId) {
      console.log('⚠️ No user ID found in email address:', to);
      console.log('   Expected format: receipts+{userId}@fitcheck.ink');
      res.status(200).send('OK - No user ID');
      return;
    }
    
    console.log('👤 User ID:', userId);
    
    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('⚠️ User not found:', userId);
      res.status(200).send('OK - User not found');
      return;
    }
    
    // Find matching parser
    let parser = null;
    let retailerName = 'unknown';
    
    for (const [name, p] of Object.entries(RETAILER_PARSERS)) {
      if (name !== 'generic' && p.detect(from, subject)) {
        parser = p;
        retailerName = name;
        break;
      }
    }
    
    // Fall back to generic parser
    if (!parser) {
      parser = RETAILER_PARSERS.generic;
      retailerName = 'generic';
    }
    
    console.log(`🏪 Detected retailer: ${retailerName}`);
    
    // Parse items from the email
    const items = parser.parse(html, text);
    
    console.log(`📦 Found ${items.length} items in receipt`);
    
    if (items.length === 0) {
      // Store the raw email for manual review/improvement
      await db.collection('unparsed_receipts').add({
        userId,
        from,
        subject,
        html: html.substring(0, 10000), // Limit size
        text: text.substring(0, 5000),
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        retailerAttempted: retailerName
      });
      
      console.log('📝 Stored unparsed receipt for review');
      res.status(200).send('OK - No items found, stored for review');
      return;
    }
    
    // Process each item
    const results = [];
    
    for (const item of items) {
      try {
        console.log(`👕 Processing item: ${item.name}`);
        
        // If we have an image URL, analyze it with Gemini
        if (item.imageUrl) {
          // Call your existing analyzeClothingItem function
          const analysisResponse = await fetch(
            'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeClothingItem',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: { 
                  imageUrl: item.imageUrl, 
                  userId: userId 
                }
              })
            }
          );
          
          if (analysisResponse.ok) {
            const analysis = await analysisResponse.json();
            
            // Merge parsed data with AI analysis
            item.aiAnalysis = analysis.analysis;
            item.textEmbedding = analysis.textEmbedding;
            item.clipEmbedding = analysis.clipEmbedding;
          }
        }
        
        // Add to user's wardrobe
        const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
        const docRef = await wardrobeRef.add({
          name: item.name,
          imageUrl: item.imageUrl || null,
          type: item.aiAnalysis?.category || item.category || 'Other',
          color: item.aiAnalysis?.color?.primary || item.color || 'Unknown',
          style: item.aiAnalysis?.style || 'casual',
          season: item.aiAnalysis?.season || 'all-season',
          occasion: item.aiAnalysis?.occasion || 'everyday',
          material: item.aiAnalysis?.material || 'unknown',
          price: item.price || null,
          source: 'email-receipt',
          retailer: retailerName,
          addedAt: admin.firestore.FieldValue.serverTimestamp(),
          aiResults: item.aiAnalysis || null
        });
        
        console.log(`✅ Added item to wardrobe: ${docRef.id}`);
        
        // Add to Pinecone if we have embeddings
        if (item.textEmbedding) {
          try {
            await fetch(
              'https://us-central1-fitcheck-1c224.cloudfunctions.net/addToPinecone',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  data: {
                    userId: userId,
                    itemId: docRef.id,
                    embedding: item.textEmbedding,
                    analysis: item.aiAnalysis,
                    imageUrl: item.imageUrl
                  }
                })
              }
            );
            console.log(`📍 Added to Pinecone: ${docRef.id}`);
          } catch (pineconeError) {
            console.error('⚠️ Pinecone sync failed:', pineconeError.message);
          }
        }
        
        results.push({
          success: true,
          itemId: docRef.id,
          name: item.name
        });
        
      } catch (itemError) {
        console.error(`❌ Failed to process item: ${item.name}`, itemError);
        results.push({
          success: false,
          name: item.name,
          error: itemError.message
        });
      }
    }
    
    // Log the receipt processing
    await db.collection('receipt_logs').add({
      userId,
      from,
      subject,
      retailer: retailerName,
      itemsFound: items.length,
      itemsProcessed: results.filter(r => r.success).length,
      results,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Receipt processed: ${results.filter(r => r.success).length}/${items.length} items added`);
    
    // SendGrid expects 200 OK
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Receipt processing failed:', error);
    // Still return 200 to prevent SendGrid retries
    res.status(200).send('OK - Error logged');
  }
});

// Test endpoint to simulate a receipt
exports.testReceiptParser = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const { userId, testItems } = req.body.data || req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    
    // Default test items
    const items = testItems || [
      {
        name: 'Blue Denim Jacket',
        color: 'Blue',
        category: 'Outerwear',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        price: '89.99'
      },
      {
        name: 'White Cotton T-Shirt',
        color: 'White',
        category: 'Tops',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        price: '29.99'
      }
    ];
    
    console.log(`🧪 Testing receipt parser for user ${userId} with ${items.length} items`);
    
    const results = [];
    
    for (const item of items) {
      // Call analyzeClothingItem if we have an image
      let aiAnalysis = null;
      let textEmbedding = null;
      
      if (item.imageUrl) {
        try {
          const analysisResponse = await fetch(
            'https://us-central1-fitcheck-1c224.cloudfunctions.net/analyzeClothingItem',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: { imageUrl: item.imageUrl, userId }
              })
            }
          );
          
          if (analysisResponse.ok) {
            const result = await analysisResponse.json();
            aiAnalysis = result.analysis;
            textEmbedding = result.textEmbedding;
          }
        } catch (e) {
          console.error('AI analysis failed:', e.message);
        }
      }
      
      // Add to Firestore
      const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
      const docRef = await wardrobeRef.add({
        name: item.name,
        imageUrl: item.imageUrl,
        type: aiAnalysis?.category || item.category || 'Other',
        color: aiAnalysis?.color?.primary || item.color || 'Unknown',
        style: aiAnalysis?.style || 'casual',
        price: item.price,
        source: 'test-receipt',
        retailer: 'test',
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        aiResults: aiAnalysis
      });
      
      // Add to Pinecone
      if (textEmbedding) {
        try {
          await fetch(
            'https://us-central1-fitcheck-1c224.cloudfunctions.net/addToPinecone',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: {
                  userId,
                  itemId: docRef.id,
                  embedding: textEmbedding,
                  analysis: aiAnalysis,
                  imageUrl: item.imageUrl
                }
              })
            }
          );
        } catch (e) {
          console.error('Pinecone sync failed:', e.message);
        }
      }
      
      results.push({
        success: true,
        itemId: docRef.id,
        name: item.name,
        analyzed: !!aiAnalysis
      });
    }
    
    res.json({
      success: true,
      message: `Added ${results.length} test items to wardrobe`,
      results
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ error: error.message });
  }
});