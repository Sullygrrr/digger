import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Track } from '../types/music';

export const useRandomTrack = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchRandomTrack = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les tracks sauf celles de l'utilisateur courant
      const tracksQuery = query(
        collection(db, 'tracks'),
        where('userId', '!=', currentUser?.uid)
      );
      
      const snapshot = await getDocs(tracksQuery);
      const tracks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Track[];

      if (tracks.length > 0) {
        // Sélectionner une track aléatoire
        const randomIndex = Math.floor(Math.random() * tracks.length);
        setCurrentTrack(tracks[randomIndex]);
      } else {
        setCurrentTrack(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des tracks:', error);
      setCurrentTrack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomTrack();
  }, [currentUser]);

  return { currentTrack, loading, fetchRandomTrack };
};