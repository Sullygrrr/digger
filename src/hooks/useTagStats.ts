import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useTagStats = () => {
  const updateGlobalTagStats = async (tags: string[], isAdding: boolean) => {
    try {
      // Traiter chaque tag
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().trim();
        const tagRef = doc(db, 'tags', normalizedTag);
        
        // Récupérer les stats actuelles du tag
        const tagDoc = await getDoc(tagRef);
        
        if (!tagDoc.exists()) {
          // Créer le document si c'est la première utilisation du tag
          await setDoc(tagRef, {
            count: isAdding ? 1 : 0,
            lastUsed: new Date()
          });
        } else {
          // Mettre à jour le compteur
          await setDoc(tagRef, {
            count: increment(isAdding ? 1 : -1),
            lastUsed: new Date()
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des stats des tags:', error);
      throw error; // Propager l'erreur pour la gestion en amont
    }
  };

  return { updateGlobalTagStats };
};