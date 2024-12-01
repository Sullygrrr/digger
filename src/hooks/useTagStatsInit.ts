import { useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Track } from '../types/music';

export const useTagStatsInit = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    const initializeTagStats = async () => {
      if (!currentUser) return;

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      // Vérifier si tagStats existe déjà
      if (!userDoc.exists() || !userDoc.data()?.tagStats) {
        // Récupérer toutes les tracks likées
        const likedTracksRef = collection(db, 'users', currentUser.uid, 'likedTracks');
        const likedTracksSnapshot = await getDocs(likedTracksRef);
        
        const tagStats: Record<string, number> = {};

        // Calculer les stats pour chaque tag
        likedTracksSnapshot.docs.forEach(doc => {
          const track = doc.data() as Track;
          if (track.tags) {
            track.tags.forEach(tag => {
              const normalizedTag = tag.toLowerCase().trim();
              tagStats[normalizedTag] = (tagStats[normalizedTag] || 0) + 1;
            });
          }
        });

        // Mettre à jour le document utilisateur avec les nouvelles stats
        await updateDoc(userRef, {
          tagStats: tagStats
        });
      }
    };

    initializeTagStats().catch(console.error);
  }, [currentUser]);
};