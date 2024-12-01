import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, getMetadata } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Track } from '../types/music';

const QUEUE_SIZE = 10;
const TOP_TAGS_COUNT = 4;
const SEEN_TRACK_PROBABILITY = 0.0005; // 0.05% chance de revoir une track déjà vue
const LIKED_TRACK_PROBABILITY = 0; // 0% chance de revoir une track déjà likée
const MAX_LIKES_FOR_BONUS = 100;
const LIKES_WEIGHT = 0.3;

const WEIGHTS = {
  PREFERRED_TAGS_4: 0.4,
  PREFERRED_TAGS_3: 0.3,
  PREFERRED_TAGS_2: 0.2,
  PREFERRED_TAGS_1: 0.08,
  NO_PREFERRED_TAGS: 0.02
};

interface TrackQueueContextType {
  currentTrack: Track | null;
  loading: boolean;
  getNextTrack: () => Track | null;
  setInitialTrack: (track: Track) => void;
  preferredTags: [string, number][];
}

const TrackQueueContext = createContext<TrackQueueContextType | null>(null);

export const useTrackQueue = () => {
  const context = useContext(TrackQueueContext);
  if (!context) {
    throw new Error('useTrackQueue must be used within a TrackQueueProvider');
  }
  return context;
};

export const TrackQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenTracks] = useState(new Set<string>());
  const [preferredTags, setPreferredTags] = useState<[string, number][]>([]);
  const { currentUser } = useAuth();

  const checkAudioFileExists = async (url: string): Promise<boolean> => {
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/music-6e66d.appspot.com/o/';
      const filePath = decodeURIComponent(url.replace(baseUrl, '').split('?')[0]);
      const audioRef = ref(storage, filePath);
      await getMetadata(audioRef);
      return true;
    } catch (error) {
      console.error('Fichier audio non trouvé:', error);
      return false;
    }
  };

  const preloadMedia = async (track: Track) => {
    // Vérifier si le fichier audio existe
    const audioExists = await checkAudioFileExists(track.audioUrl);
    if (!audioExists) {
      throw new Error('Fichier audio non trouvé');
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = track.audioUrl;

    if (track.mediaUrl) {
      if (track.mediaType === 'video') {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.src = track.mediaUrl;
      } else if (track.mediaType === 'image') {
        const img = new Image();
        img.src = track.mediaUrl;
      }
    }
  };

  const setInitialTrack = async (track: Track) => {
    try {
      await preloadMedia(track);
      setQueue([track]);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement de la track initiale:', error);
      setQueue([]);
      setLoading(false);
    }
  };

  const getPreferredTags = async () => {
    if (!currentUser) return [];

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const tagStats = userDoc.data()?.tagStats || {};

    return Object.entries(tagStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, TOP_TAGS_COUNT);
  };

  const getLikedTrackIds = async () => {
    if (!currentUser) return new Set<string>();

    const likedTracksRef = collection(db, 'users', currentUser.uid, 'likedTracks');
    const snapshot = await getDocs(likedTracksRef);
    return new Set(snapshot.docs.map(doc => doc.id));
  };

  const calculateTagScore = (track: Track, topTags: string[]) => {
    if (!track.tags) return 0;

    const matchingTags = track.tags.filter(tag => 
      topTags.includes(tag.toLowerCase())
    ).length;

    switch (matchingTags) {
      case 4: return WEIGHTS.PREFERRED_TAGS_4;
      case 3: return WEIGHTS.PREFERRED_TAGS_3;
      case 2: return WEIGHTS.PREFERRED_TAGS_2;
      case 1: return WEIGHTS.PREFERRED_TAGS_1;
      default: return WEIGHTS.NO_PREFERRED_TAGS;
    }
  };

  const calculateLikeScore = (likes: number) => {
    return Math.min(likes, MAX_LIKES_FOR_BONUS) / MAX_LIKES_FOR_BONUS;
  };

  const calculateTrackScore = (track: Track, topTags: string[]) => {
    const tagScore = calculateTagScore(track, topTags);
    const likeScore = calculateLikeScore(track.likes || 0);
    return (tagScore * (1 - LIKES_WEIGHT)) + (likeScore * LIKES_WEIGHT);
  };

  const fetchMoreTracks = async () => {
    if (queue.length >= QUEUE_SIZE) return;

    try {
      const [topTags, likedTrackIds] = await Promise.all([
        getPreferredTags(),
        getLikedTrackIds()
      ]);
      
      setPreferredTags(topTags);
      
      const tracksQuery = query(
        collection(db, 'tracks'),
        where('userId', '!=', currentUser?.uid)
      );
      
      const snapshot = await getDocs(tracksQuery);
      const allTracks = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Track))
        .filter(track => {
          // Filtrer les tracks déjà vues et likées
          const isLiked = likedTrackIds.has(track.id);
          const isSeen = seenTracks.has(track.id);

          if (isLiked) {
            return false; // Ne jamais montrer les tracks likées
          }
          if (isSeen) {
            return Math.random() < SEEN_TRACK_PROBABILITY;
          }
          return true;
        });

      const scoredTracks = allTracks.map(track => ({
        track,
        score: calculateTrackScore(track, topTags.map(([tag]) => tag))
      }));

      const sortedTracks = scoredTracks.sort((a, b) => {
        const randomFactor = Math.random() * 0.2 - 0.1;
        return (b.score + randomFactor) - (a.score + randomFactor);
      });

      // Vérifier l'existence des fichiers audio pour chaque track
      const validTracks: Track[] = [];
      for (const { track } of sortedTracks) {
        try {
          await preloadMedia(track);
          validTracks.push(track);
          if (validTracks.length >= QUEUE_SIZE - queue.length) break;
        } catch (error) {
          console.error(`Track ${track.id} ignorée: fichier audio non trouvé`);
          continue;
        }
      }

      validTracks.forEach(track => seenTracks.add(track.id));
      setQueue(prevQueue => [...prevQueue, ...validTracks]);

    } catch (error) {
      console.error('Erreur lors du chargement des tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextTrack = () => {
    if (queue.length === 0) return null;

    const [nextTrack, ...remainingTracks] = queue;
    setQueue(remainingTracks);

    if (remainingTracks.length < QUEUE_SIZE / 2) {
      fetchMoreTracks();
    }

    return nextTrack;
  };

  useEffect(() => {
    if (currentUser && queue.length < QUEUE_SIZE) {
      fetchMoreTracks();
    }
  }, [currentUser]);

  const value = {
    currentTrack: queue[0] || null,
    loading,
    getNextTrack,
    setInitialTrack,
    preferredTags
  };

  return (
    <TrackQueueContext.Provider value={value}>
      {children}
    </TrackQueueContext.Provider>
  );
};
