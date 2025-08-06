// functions/src/migration.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { initPinecone } = require('./pinecone-setup');

const db = admin.firestore();

// Migrate a single user
exports.migrateUserToPinecone = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const { userId } = req.body.data || req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    
    console.log(`🚀 Migrating user ${userId} to Pinecone...`);
    
    // 🔍 DEBUG: Add detailed logging
    console.log(`🔍 Looking for wardrobe at path: users/${userId}/wardrobe`);
    
    const wardrobeRef = db.collection('users').doc(userId).collection('wardrobe');
    console.log(`🔍 Wardrobe reference created`);
    
    const snapshot = await wardrobeRef.get();
    console.log(`🔍 Snapshot retrieved, size: ${snapshot.size}, empty: ${snapshot.empty}`);
    
    // 🔍 DEBUG: List all documents found
    if (!snapshot.empty) {
      console.log(`🔍 Documents found:`);
      snapshot.forEach(doc => {
        console.log(`  - Document ID: ${doc.id}`);
        const data = doc.data();
        console.log(`  - Has textEmbedding: ${!!data.textEmbedding}`);
        console.log(`  - Has trueImageEmbedding: ${!!data.trueImageEmbedding}`);
        console.log(`  - Has tags.aiResults.analysis: ${!!(data.tags?.aiResults?.analysis)}`);
      });
    }
    
    if (snapshot.empty) {
      console.log(`❌ No wardrobe items found for user ${userId}`);
      res.json({
        success: true,
        message: `No wardrobe items found for user ${userId}`,
        itemsMigrated: 0,
        debug: {
          snapshotSize: snapshot.size,
          snapshotEmpty: snapshot.empty,
          wardrobePath: `users/${userId}/wardrobe`
        }
      });
      return;
    }
    
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    const vectorsToUpsert = [];
    let skippedItems = 0;
    
    snapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      
      const textEmbedding = item.textEmbedding || item.trueImageEmbedding;
      const analysis = item.tags?.aiResults?.analysis;
      
      if (!textEmbedding || !analysis) {
        console.log(`⚠️ Skipping item ${item.id} - missing embedding or analysis`);
        skippedItems++;
        return;
      }
      
      const metadata = {
        userId: userId,
        itemName: analysis.itemName || item.tags?.name || 'Unknown Item',
        category: analysis.category || 'Other',
        style: analysis.style || 'casual',
        season: analysis.season || 'all-season',
        occasion: analysis.occasion || 'everyday',
        primaryColor: analysis.color?.primary || 'unknown',
        secondaryColor: analysis.color?.secondary || '',
        pattern: analysis.color?.pattern || 'solid',
        material: analysis.material || 'unknown',
        imageUrl: item.imageUrl || '',
        timestamp: Date.now()
      };
      
      vectorsToUpsert.push({
        id: item.id,
        values: textEmbedding,
        metadata: metadata
      });
    });
    
    console.log(`📦 Prepared ${vectorsToUpsert.length} items for migration (${skippedItems} skipped)`);
    
    // Upsert in batches of 100
    const batchSize = 100;
    let totalUpserted = 0;
    
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      
      await index.upsert(batch);
      totalUpserted += batch.length;
      
      console.log(`✅ Upserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items`);
      
      if (i + batchSize < vectorsToUpsert.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Migration complete for user ${userId}`);
    
    res.json({
      success: true,
      message: `Successfully migrated user ${userId} to Pinecone`,
      itemsMigrated: totalUpserted,
      itemsSkipped: skippedItems,
      totalItems: snapshot.size
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Migration dashboard
exports.migrationDashboard = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    let totalFirestoreItems = 0;
    let usersWithItems = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const wardrobeSnapshot = await userDoc.ref.collection('wardrobe').get();
      if (!wardrobeSnapshot.empty) {
        totalFirestoreItems += wardrobeSnapshot.size;
        usersWithItems++;
      }
    }
    
    let pineconeStats = { totalVectorCount: 0, dimension: 0 };
    try {
      const pc = initPinecone();
      const index = pc.index('fitcheck-main');
      pineconeStats = await index.describeIndexStats();
      
      // 🔧 FIX: Ensure we have default values if undefined
      if (!pineconeStats.totalVectorCount) {
        pineconeStats.totalVectorCount = 0;
      }
      if (!pineconeStats.dimension) {
        pineconeStats.dimension = 3072;
      }
      
    } catch (error) {
      console.log('⚠️ Could not get Pinecone stats:', error.message);
      pineconeStats = { totalVectorCount: 0, dimension: 3072 };
    }
    
    const migrationProgress = totalFirestoreItems > 0 ? 
      Math.round((pineconeStats.totalVectorCount / totalFirestoreItems) * 100) : 0;
    
    const monthlyPineconeCost = Math.ceil(pineconeStats.totalVectorCount / 1000000) * 0.095;
    
    // Calculate free vectors remaining safely
    const freeVectorsRemaining = Math.max(0, 1000000 - pineconeStats.totalVectorCount);
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>FitCheck Pinecone Migration Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; }
            .progress-fill { background: #4CAF50; height: 100%; transition: width 0.3s ease; }
            .metric { display: inline-block; margin: 10px 20px; text-align: center; }
            .metric-number { font-size: 2em; font-weight: bold; color: #333; }
            .metric-label { color: #666; }
            .status-good { color: #4CAF50; }
            .status-warning { color: #FF9800; }
            .status-info { color: #2196F3; }
            .button { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 FitCheck Migration Dashboard</h1>
            
            <div class="card">
                <h2>Migration Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${migrationProgress}%"></div>
                </div>
                <p><strong>Status:</strong> <span class="${migrationProgress >= 100 ? 'status-good' : 'status-warning'}">${migrationProgress >= 100 ? 'Complete' : 'In Progress'}</span></p>
                <p><strong>Progress:</strong> ${migrationProgress}% (${pineconeStats.totalVectorCount}/${totalFirestoreItems} items)</p>
                ${migrationProgress < 100 ? `<p><strong>Remaining:</strong> ${totalFirestoreItems - pineconeStats.totalVectorCount} items to migrate</p>` : ''}
            </div>
            
            <div class="card">
                <h2>User Statistics</h2>
                <div class="metric">
                    <div class="metric-number">${totalUsers}</div>
                    <div class="metric-label">Total Users</div>
                </div>
                <div class="metric">
                    <div class="metric-number">${usersWithItems}</div>
                    <div class="metric-label">Users with Wardrobe</div>
                </div>
                <div class="metric">
                    <div class="metric-number">${usersWithItems > 0 ? Math.round(totalFirestoreItems / usersWithItems) : 0}</div>
                    <div class="metric-label">Avg Items/User</div>
                </div>
            </div>
            
            <div class="card">
                <h2>Cost Analysis</h2>
                <p><strong>Estimated Monthly Cost:</strong> <span class="status-info">${monthlyPineconeCost.toFixed(2)}</span></p>
                <p><strong>Free Tier Status:</strong> <span class="${pineconeStats.totalVectorCount <= 1000000 ? 'status-good' : 'status-warning'}">
                    ${pineconeStats.totalVectorCount <= 1000000 ? 'Within Free Tier' : 'Exceeds Free Tier'}
                </span></p>
                ${pineconeStats.totalVectorCount <= 1000000 ? `<p><strong>Free Vectors Remaining:</strong> ${freeVectorsRemaining.toLocaleString()}</p>` : ''}
            </div>
            
            <div class="card">
                <h2>Quick Actions</h2>
                <p>Test with your own user ID:</p>
                <input type="text" id="userId" placeholder="Enter your user ID" style="padding: 10px; width: 300px;" value="ZX58NDIZuhQDOfbz9cA0brMYDZG2">
                <br><br>
                <button class="button" onclick="migrateUser()">Migrate This User</button>
                <button class="button" onclick="checkUser()">Check Migration Status</button>
            </div>
            
            <div class="card">
                <h2>Technical Details</h2>
                <p><strong>Index Dimension:</strong> ${pineconeStats.dimension || 0}</p>
                <p><strong>Total Vectors:</strong> ${pineconeStats.totalVectorCount.toLocaleString()}</p>
                <p><strong>Last Updated:</strong> ${new Date().toISOString()}</p>
            </div>
        </div>
        
        <script>
            async function migrateUser() {
                const userId = document.getElementById('userId').value;
                if (!userId) {
                    alert('Please enter a user ID');
                    return;
                }
                
                try {
                    const response = await fetch('https://us-central1-fitcheck-1c224.cloudfunctions.net/migrateUserToPinecone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: { userId } })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        alert('✅ ' + result.message + '\\nMigrated: ' + result.itemsMigrated + ' items\\nSkipped: ' + result.itemsSkipped + ' items');
                    } else {
                        alert('❌ Migration failed: ' + result.error);
                    }
                    window.location.reload();
                } catch (error) {
                    alert('Migration failed: ' + error.message);
                }
            }
            
            async function checkUser() {
                const userId = document.getElementById('userId').value;
                if (!userId) {
                    alert('Please enter a user ID');
                    return;
                }
                
                try {
                    const response = await fetch('https://us-central1-fitcheck-1c224.cloudfunctions.net/checkPineconeMigration?userId=' + userId);
                    const result = await response.json();
                    if (result.success) {
                        alert('User has ' + result.userItems + ' items in Pinecone\\nSample items: ' + result.sampleItems.map(i => i.itemName).join(', '));
                    } else {
                        alert('Check failed: ' + result.error);
                    }
                } catch (error) {
                    alert('Check failed: ' + error.message);
                }
            }
            
            // Auto-refresh every 30 seconds
            setTimeout(() => window.location.reload(), 30000);
        </script>
    </body>
    </html>`;
    
    res.send(html);
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).send(`<h1>Dashboard Error</h1><p>${error.message}</p>`);
  }
});

// Check migration status
exports.checkPineconeMigration = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }
    
    const pc = initPinecone();
    const index = pc.index('fitcheck-main');
    
    const stats = await index.describeIndexStats();
    
    const testQuery = await index.query({
      vector: Array.from({ length: 3072 }, () => 0),
      topK: 10,
      filter: { userId: { $eq: userId } },
      includeMetadata: true
    });
    
    res.json({
      success: true,
      userId: userId,
      indexStats: {
        totalVectors: stats.totalVectorCount || 0,
        dimension: stats.dimension || 0
      },
      userItems: testQuery.matches?.length || 0,
      sampleItems: testQuery.matches?.slice(0, 3).map(match => ({
        id: match.id,
        itemName: match.metadata?.itemName,
        similarity: match.score
      })) || []
    });
    
  } catch (error) {
    console.error('❌ Check migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});