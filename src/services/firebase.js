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
    
    // Extract embeddings from aiResults if available
    let embedding = null;
    let trueImageEmbedding = null;
    let imageDescription = null;
    
    if (aiResults) {
      embedding = aiResults.embedding || null;
      trueImageEmbedding = aiResults.trueImageEmbedding || null;
      imageDescription = aiResults.imageDescription || null;
    }
    
    await addDoc(wardrobeRef, {
      imageUrl: imageUrl,
      tags: {
        name: name,
        type: type,
        color: color,
        aiResults: aiResults // Store full AI results for reference
      },
      // Store embeddings at root level for easy RAG access
      embedding: embedding,
      trueImageEmbedding: trueImageEmbedding,
      imageDescription: imageDescription,
      embeddingVersion: trueImageEmbedding ? 'v2-hybrid' : (embedding ? 'v1' : null),
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Saved garment with embeddings:', {
      hasAttributeEmbedding: !!embedding,
      hasTrueImageEmbedding: !!trueImageEmbedding,
      hasDescription: !!imageDescription,
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