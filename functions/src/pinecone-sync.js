// functions/src/pinecone-sync.js
// Complete sync functions to keep Pinecone in sync with Firestore

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { initPinecone } = require('./pinecone-setup');

// Initialize Firestore if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ==========================================
// 1. DELETE ITEM FROM PINECONE
// ==========================================
exports.deleteFromPinecone = functions.https.onRequest(async (req, res) => {
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
    const { userId, itemId } = req.body.data || req.body;
    
    if (!itemId) {
      res.status(400).json({ 
        success: false,
        error: 'itemId is required' 
      });
      return;
    }
    
    console.log(`🗑️ Deleting item ${itemId} from Pinecone (user: ${userId})...`);
    
    // Initialize Pinecone
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    // Delete the vector by ID
    await index.deleteOne(itemId);
    
    console.log(`✅ Successfully deleted item ${itemId} from Pinecone`);
    
    res.json({
      success: true,
      message: `Item ${itemId} deleted from Pinecone`,
      itemId: itemId,
      userId: userId
    });
    
  } catch (error) {
    console.error('❌ Failed to delete from Pinecone:', error);
    
    // Don't fail if item doesn't exist in Pinecone
    if (error.message?.includes('not found')) {
      res.json({
        success: true,
        message: 'Item was not in Pinecone (already deleted or never added)',
        itemId: req.body.data?.itemId || req.body?.itemId
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// ==========================================
// 2. ADD ITEM TO PINECONE
// ==========================================
exports.addToPinecone = functions.https.onRequest(async (req, res) => {
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
    const { userId, itemId, embedding, analysis, imageUrl } = req.body.data || req.body;
    
    // Validate required fields
    if (!userId || !itemId || !embedding) {
      res.status(400).json({ 
        success: false,
        error: 'userId, itemId, and embedding are required',
        received: {
          hasUserId: !!userId,
          hasItemId: !!itemId,
          hasEmbedding: !!embedding,
          embeddingLength: embedding?.length || 0
        }
      });
      return;
    }
    
    // Validate embedding dimensions
    if (embedding.length !== 3072) {
      console.warn(`⚠️ Warning: Embedding has ${embedding.length} dimensions, expected 3072`);
      res.status(400).json({
        success: false,
        error: `Invalid embedding dimension: ${embedding.length} (expected 3072)`,
        itemId: itemId
      });
      return;
    }
    
    console.log(`📤 Adding item ${itemId} to Pinecone for user ${userId}...`);
    
    // Initialize Pinecone
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    // Prepare metadata (what we can search/filter by)
    const metadata = {
      userId: userId,
      itemName: analysis?.itemName || 'Unknown Item',
      category: analysis?.category || 'Other',
      style: analysis?.style || 'casual',
      season: analysis?.season || 'all-season',
      occasion: analysis?.occasion || 'everyday',
      primaryColor: analysis?.color?.primary || 'unknown',
      secondaryColor: analysis?.color?.secondary || '',
      pattern: analysis?.color?.pattern || 'solid',
      material: analysis?.material || 'unknown',
      type: analysis?.type || 'unknown',
      imageUrl: imageUrl || '',
      addedAt: Date.now()
    };
    
    // Upsert to Pinecone (upsert = insert or update)
    await index.upsert([{
      id: itemId,
      values: embedding,
      metadata: metadata
    }]);
    
    console.log(`✅ Successfully added item ${itemId} to Pinecone`);
    console.log(`   Item: ${metadata.itemName}`);
    console.log(`   Category: ${metadata.category}`);
    console.log(`   Color: ${metadata.primaryColor}`);
    
    res.json({
      success: true,
      message: `Item ${itemId} added to Pinecone`,
      itemId: itemId,
      userId: userId,
      metadata: metadata
    });
    
  } catch (error) {
    console.error('❌ Failed to add to Pinecone:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 3. UPDATE ITEM IN PINECONE
// ==========================================
exports.updateInPinecone = functions.https.onRequest(async (req, res) => {
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
    const { userId, itemId, updates } = req.body.data || req.body;
    
    if (!itemId) {
      res.status(400).json({ 
        success: false,
        error: 'itemId is required' 
      });
      return;
    }
    
    console.log(`📝 Updating item ${itemId} in Pinecone...`);
    console.log('   Updates:', updates);
    
    // Initialize Pinecone
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    // Fetch current vector to preserve embeddings
    const fetchResult = await index.fetch([itemId]);
    
    if (!fetchResult.vectors || !fetchResult.vectors[itemId]) {
      console.log(`⚠️ Item ${itemId} not found in Pinecone`);
      res.json({
        success: false,
        message: `Item ${itemId} not found in Pinecone (might be an old item)`,
        itemId: itemId
      });
      return;
    }
    
    const currentVector = fetchResult.vectors[itemId];
    
    // Merge metadata updates (preserve existing, override with new)
    const updatedMetadata = {
      ...currentVector.metadata,
      ...(updates.name && { itemName: updates.name }),
      ...(updates.type && { category: updates.type }),
      ...(updates.color && { primaryColor: updates.color }),
      ...(updates.style && { style: updates.style }),
      ...(updates.season && { season: updates.season }),
      ...(updates.occasion && { occasion: updates.occasion }),
      ...(updates.material && { material: updates.material }),
      updatedAt: Date.now()
    };
    
    // Update the vector with new metadata (keep same embedding values)
    await index.upsert([{
      id: itemId,
      values: currentVector.values,
      metadata: updatedMetadata
    }]);
    
    console.log(`✅ Successfully updated item ${itemId} in Pinecone`);
    console.log(`   Updated fields:`, Object.keys(updates));
    
    res.json({
      success: true,
      message: `Item ${itemId} updated in Pinecone`,
      itemId: itemId,
      updatedFields: Object.keys(updates),
      metadata: updatedMetadata
    });
    
  } catch (error) {
    console.error('❌ Failed to update in Pinecone:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 4. CHECK SYNC STATUS
// ==========================================
exports.checkSyncStatus = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ 
        success: false,
        error: 'userId query parameter is required' 
      });
      return;
    }
    
    console.log(`🔍 Checking sync status for user ${userId}...`);
    
    // Get all Firestore items for this user
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const firestoreSnapshot = await wardrobeRef.get();
    const firestoreIds = new Set(firestoreSnapshot.docs.map(doc => doc.id));
    
    console.log(`📊 Found ${firestoreIds.size} items in Firestore`);
    
    // Initialize Pinecone
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    // Query Pinecone for this user's items
    const pineconeQuery = await index.query({
      vector: Array.from({ length: 3072 }, () => 0), // Dummy vector for metadata-only query
      topK: 1000, // Get up to 1000 items
      filter: { userId: { $eq: userId } },
      includeMetadata: true
    });
    
    const pineconeItems = pineconeQuery.matches || [];
    const pineconeIds = new Set(pineconeItems.map(m => m.id));
    
    console.log(`📊 Found ${pineconeIds.size} items in Pinecone`);
    
    // Find discrepancies
    const inFirestoreOnly = [...firestoreIds].filter(id => !pineconeIds.has(id));
    const inPineconeOnly = [...pineconeIds].filter(id => !firestoreIds.has(id));
    
    // Build sync status report
    const syncStatus = {
      success: true,
      isSynced: inFirestoreOnly.length === 0 && inPineconeOnly.length === 0,
      userId: userId,
      counts: {
        firestore: firestoreIds.size,
        pinecone: pineconeIds.size,
        synced: firestoreIds.size - inFirestoreOnly.length
      },
      discrepancies: {
        missingFromPinecone: inFirestoreOnly.length,
        orphanedInPinecone: inPineconeOnly.length
      },
      details: {
        inFirestoreOnly: inFirestoreOnly.slice(0, 10), // First 10 IDs
        inPineconeOnly: inPineconeOnly.slice(0, 10)    // First 10 IDs
      },
      recommendations: []
    };
    
    // Add recommendations
    if (inFirestoreOnly.length > 0) {
      syncStatus.recommendations.push({
        action: 'ADD_TO_PINECONE',
        message: `Add ${inFirestoreOnly.length} missing items to Pinecone`,
        itemIds: inFirestoreOnly
      });
    }
    
    if (inPineconeOnly.length > 0) {
      syncStatus.recommendations.push({
        action: 'REMOVE_FROM_PINECONE',
        message: `Remove ${inPineconeOnly.length} orphaned items from Pinecone`,
        itemIds: inPineconeOnly
      });
    }
    
    // Sample items from Pinecone for verification
    if (pineconeItems.length > 0) {
      syncStatus.sampleItems = pineconeItems.slice(0, 3).map(item => ({
        id: item.id,
        name: item.metadata?.itemName,
        category: item.metadata?.category,
        color: item.metadata?.primaryColor
      }));
    }
    
    console.log(`✅ Sync check complete:`, {
      synced: syncStatus.isSynced,
      firestore: syncStatus.counts.firestore,
      pinecone: syncStatus.counts.pinecone
    });
    
    res.json(syncStatus);
    
  } catch (error) {
    console.error('❌ Sync check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 5. CLEANUP ORPHANED ITEMS (Utility function)
// ==========================================
exports.cleanupOrphanedItems = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const { userId, dryRun = true } = req.query;
    
    if (!userId) {
      res.status(400).json({ 
        success: false,
        error: 'userId query parameter is required' 
      });
      return;
    }
    
    console.log(`🧹 Cleaning up orphaned items for user ${userId} (dry run: ${dryRun})...`);
    
    // Get Firestore items
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    const firestoreSnapshot = await wardrobeRef.get();
    const firestoreIds = new Set(firestoreSnapshot.docs.map(doc => doc.id));
    
    // Get Pinecone items
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    const pineconeQuery = await index.query({
      vector: Array.from({ length: 3072 }, () => 0),
      topK: 1000,
      filter: { userId: { $eq: userId } },
      includeMetadata: false
    });
    
    const orphanedIds = [];
    for (const match of pineconeQuery.matches || []) {
      if (!firestoreIds.has(match.id)) {
        orphanedIds.push(match.id);
      }
    }
    
    let deletedCount = 0;
    if (!dryRun && orphanedIds.length > 0) {
      // Actually delete orphaned items
      for (const id of orphanedIds) {
        await index.deleteOne(id);
        deletedCount++;
        console.log(`  Deleted orphaned item: ${id}`);
      }
    }
    
    res.json({
      success: true,
      dryRun: dryRun,
      orphanedItems: orphanedIds,
      orphanedCount: orphanedIds.length,
      deletedCount: deletedCount,
      message: dryRun ? 
        `Found ${orphanedIds.length} orphaned items. Run with ?dryRun=false to delete them.` :
        `Deleted ${deletedCount} orphaned items from Pinecone.`
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});