import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Track } from '../types/music';
import toast from 'react-hot-toast';

export const useLikes = (trackId: string, initialLikes: number = 0, initialLikedBy: string[] = []) => {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  // Synchroniser l'état initial et vérifier le statut du like
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUser) return;

      try {
        // Vérifier dans Firestore si l'utilisateur a déjà liké
        const userLikedTrackRef = doc(db, 'users', currentUser.uid, 'likedTracks', trackId);
        const likedDoc = await getDoc(userLikedTrackRef);
        
        // Mettre à jour l'état local
        setIsLiked(likedDoc.exists());
        
        // Récupérer le nombre actuel de likes
        const trackRef = doc(db, 'tracks', trackId);
        const trackDoc = await getDoc(trackRef);
        if (trackDoc.exists()) {
          setLikes(trackDoc.data().likes || 0);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du like:', error);
      }
    };

    checkLikeStatus();
  }, [currentUser, trackId]);

  const updateTagStats = async (tags: string[], isAdding: boolean) => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const currentTagStats = userDoc.data()?.tagStats || {};

    const updatedTagStats = { ...currentTagStats };

    tags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().trim();
      if (isAdding) {
        updatedTagStats[normalizedTag] = (updatedTagStats[normalizedTag] || 0) + 1;
      } else {
        updatedTagStats[normalizedTag] = Math.max(0, (updatedTagStats[normalizedTag] || 0) - 1);
        // Supprimer les tags avec un compte de 0
        if (updatedTagStats[normalizedTag] === 0) {
          delete updatedTagStats[normalizedTag];
        }
      }
    });

    await updateDoc(userRef, {
      tagStats: updatedTagStats
    });
  };

  const toggleLike = async () => {
    if (!currentUser) return;

    const trackRef = doc(db, 'tracks', trackId);
    const userLikedTrackRef = doc(db, 'users', currentUser.uid, 'likedTracks', trackId);
    
    try {
      // Récupérer les données complètes de la track
      const trackSnapshot = await getDoc(trackRef);
      const trackData = trackSnapshot.data() as Track;

      if (isLiked) {
        // Retirer le like
        await updateDoc(trackRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUser.uid)
        });
        
        // Mettre à jour les stats des tags
        if (trackData.tags) {
          await updateTagStats(trackData.tags, false);
        }
        
        // Supprimer la référence dans la sous-collection de l'utilisateur
        await deleteDoc(userLikedTrackRef);
        setLikes(prev => prev - 1);
      } else {
        // Ajouter le like
        await updateDoc(trackRef, {
          likes: increment(1),
          likedBy: arrayUnion(currentUser.uid)
        });
        
        // Mettre à jour les stats des tags
        if (trackData.tags) {
          await updateTagStats(trackData.tags, true);
        }
        
        // Ajouter la référence avec toutes les informations de la track
        await setDoc(userLikedTrackRef, {
          ...trackData,
          likedAt: new Date(),
          trackId: trackId,
          originalUserId: trackData.userId
        });
        setLikes(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Erreur lors de la modification du like:', error);
      toast.error('Erreur lors de l\'ajout du like');
    }
  };

  return { likes, isLiked, toggleLike };
};