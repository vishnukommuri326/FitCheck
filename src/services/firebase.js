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
    
    // 🆕 Extract all embedding types from aiResults
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
    
    await addDoc(wardrobeRef, {
      imageUrl: imageUrl,
      tags: {
        name: name,
        type: type,
        color: color,
        aiResults: aiResults // Store full AI results for reference
      },
      
      // 🆕 Store all embeddings at root level for easy access
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
    
    console.log('✅ Saved garment with hybrid embeddings:', {
      hasAttributeEmbedding: !!attributeEmbedding,
      hasTextEmbedding: !!textEmbedding,
      hasClipEmbedding: !!clipEmbedding,
      hasDescription: !!imageDescription,
      embeddingVersion: embeddingVersion,
      itemName: name
    });
    
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
    const garmentRef = doc(db, 'users', userId, 'wardrobe', garmentId);
    await deleteDoc(garmentRef);
  } catch (error) {
    console.error('Error deleting garment from Firestore: ', error);
    throw error;
  }
};

export const updateGarment = async (userId, garmentId, updatedData) => {
  try {
    const garmentRef = doc(db, 'users', userId, 'wardrobe', garmentId);
    await updateDoc(garmentRef, updatedData);
  } catch (error) {
    console.error('Error updating garment in Firestore: ', error);
    throw error;
  }
};