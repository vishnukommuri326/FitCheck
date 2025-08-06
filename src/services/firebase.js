// src/services/firebase.js - UPDATED with Pinecone sync
import { doc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const addUser = async (user, name) => {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: user.email,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding user to Firestore: ', error);
    throw error;
  }
};

export const addGarment = async (userId, imageUrl, garmentData) => {
  try {
    const wardrobeRef = collection(db, 'users', userId, 'wardrobe');
    
    // Extract data from garmentData
    const { name, type, color, aiResults } = garmentData;
    
    // Extract all embedding types from aiResults
    let attributeEmbedding = null;
    let textEmbedding = null;
    let clipEmbedding = null;
    let imageDescription = null;
    let embeddingVersion = null;
    
    if (aiResults) {
      // Attribute embedding (45D)
      attributeEmbedding = aiResults.embedding || null;
      
      // Text embedding (3072D) - check multiple possible fields
      textEmbedding = aiResults.textEmbedding || aiResults.trueImageEmbedding || null;
      
      // CLIP embedding (512D)
      clipEmbedding = aiResults.clipEmbedding || null;
      
      // Description
      imageDescription = aiResults.imageDescription || null;
      
      // Determine version
      if (clipEmbedding && textEmbedding) {
        embeddingVersion = 'hybrid-v3';
      } else if (textEmbedding) {
        embeddingVersion = 'text-v2';
      } else if (attributeEmbedding) {
        embeddingVersion = 'attribute-v1';
      }
    }
    
    // Save to Firestore
    const docRef = await addDoc(wardrobeRef, {
      imageUrl: imageUrl,
      tags: {
        name: name,
        type: type,
        color: color,
        aiResults: aiResults // Store full AI results for reference
      },
      
      // Store all embeddings at root level for easy access
      embedding: attributeEmbedding,          // 45D attribute embedding
      textEmbedding: textEmbedding,          // 3072D text embedding
      clipEmbedding: clipEmbedding,          // 512D CLIP embedding
      
      // Legacy field for backward compatibility
      trueImageEmbedding: textEmbedding,
      
      // Metadata
      imageDescription: imageDescription,
      embeddingVersion: embeddingVersion,
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Saved to Firestore:', docRef.id);
    
    // 🆕 SYNC TO PINECONE
    if (textEmbedding && aiResults?.analysis) {
      try {
        console.log('📤 Syncing to Pinecone...');
        const response = await fetch(
          'https://us-central1-fitcheck-1c224.cloudfunctions.net/addToPinecone',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: {
                userId: userId,
                itemId: docRef.id,
                embedding: textEmbedding,
                analysis: aiResults.analysis,
                imageUrl: imageUrl
              }
            })
          }
        );
        
        if (response.ok) {
          console.log('✅ Synced to Pinecone:', docRef.id);
        } else {
          console.warn('⚠️ Pinecone sync failed:', await response.text());
        }
      } catch (pineconeError) {
        console.error('⚠️ Pinecone sync error (non-critical):', pineconeError);
        // Don't throw - item is already saved to Firestore
      }
    } else {
      console.log('ℹ️ Skipping Pinecone sync - missing embeddings or analysis');
    }
    
  } catch (error) {
    console.error('Error adding garment to Firestore: ', error);
    throw error;
  }
};

export const getWardrobe = async (userId) => {
  try {
    const wardrobeRef = collection(db, 'users', userId, 'wardrobe');
    const q = query(wardrobeRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const wardrobe = [];
    querySnapshot.forEach((doc) => {
      wardrobe.push({ id: doc.id, ...doc.data() });
    });
    return wardrobe;
  } catch (error) {
    console.error('Error getting wardrobe from Firestore: ', error);
    throw error;
  }
};

export const deleteGarment = async (userId, garmentId) => {
  try {
    // 1. Delete from Firestore
    const garmentRef = doc(db, 'users', userId, 'wardrobe', garmentId);
    await deleteDoc(garmentRef);
    console.log('✅ Deleted from Firestore:', garmentId);
    
    // 2. 🆕 DELETE FROM PINECONE
    try {
      console.log('🗑️ Deleting from Pinecone...');
      const response = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/deleteFromPinecone',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              userId: userId,
              itemId: garmentId
            }
          })
        }
      );
      
      if (response.ok) {
        console.log('✅ Deleted from Pinecone:', garmentId);
      } else {
        console.warn('⚠️ Pinecone deletion failed:', await response.text());
      }
    } catch (pineconeError) {
      console.error('⚠️ Pinecone deletion error (non-critical):', pineconeError);
      // Don't throw - item is already deleted from Firestore
    }
    
  } catch (error) {
    console.error('Error deleting garment from Firestore: ', error);
    throw error;
  }
};

export const updateGarment = async (userId, garmentId, updatedData) => {
  try {
    // 1. Update Firestore
    const garmentRef = doc(db, 'users', userId, 'wardrobe', garmentId);
    await updateDoc(garmentRef, updatedData);
    console.log('✅ Updated in Firestore:', garmentId);
    
    // 2. 🆕 UPDATE IN PINECONE
    try {
      console.log('📝 Updating in Pinecone...');
      const response = await fetch(
        'https://us-central1-fitcheck-1c224.cloudfunctions.net/updateInPinecone',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              userId: userId,
              itemId: garmentId,
              updates: updatedData.tags || updatedData
            }
          })
        }
      );
      
      if (response.ok) {
        console.log('✅ Updated in Pinecone:', garmentId);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Pinecone update failed:', errorText);
        // If item not in Pinecone, that's okay - it might be an old item
        if (!errorText.includes('not found')) {
          console.error('Pinecone update error:', errorText);
        }
      }
    } catch (pineconeError) {
      console.error('⚠️ Pinecone update error (non-critical):', pineconeError);
      // Don't throw - item is already updated in Firestore
    }
    
  } catch (error) {
    console.error('Error updating garment in Firestore: ', error);
    throw error;
  }
};