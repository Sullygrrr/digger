import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Track } from '../types/music';
import { useLocation } from 'react-router-dom';

const QUEUE_SIZE = 10;
const TOP_TAGS_COUNT = 4;
const SEEN_TRACK_PROBABILITY = 0.05; // 5% de chance de revoir une track déjà vue
const LIKED_TRACK_PROBABILITY = 0.02; // 2% de chance de revoir une track déjà likée
const WEIGHTS = {
  PREFERRED_TAGS_4: 0.4,
  PREFERRED_TAGS_3: 0.3,
  PREFERRED_TAGS_2: 0.2,
  PREFERRED_TAGS_1: 0.08,
  NO_PREFERRED_TAGS: 0.02
};

export const useTrackQueue = () => {
  const [queue, setQueue] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenTracks] = useState(new Set<string>());
  const [preferredTags, setPreferredTags] = useState<[string, number][]>([]);
  const { currentUser } = useAuth();
  const location = useLocation();

  const preloadMedia = async (track: Track) => {
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

  const setInitialTrack = (track: Track) => {
    setQueue([track]);
    setLoading(false);
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

  const calculateTrackScore = (track: Track, topTags: string[]) => {
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

  const resetQueue = () => {
    setQueue([]);
    seenTracks.clear();
    setLoading(true);
  };

  const fetchMoreTracks = async () => {
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
            return Math.random() < LIKED_TRACK_PROBABILITY;
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

      const selectedTracks = sortedTracks
        .slice(0, QUEUE_SIZE - queue.length)
        .map(({ track }) => track);

      selectedTracks.forEach(track => seenTracks.add(track.id));

      setQueue(prevQueue => [...prevQueue, ...selectedTracks]);

      selectedTracks.forEach(track => preloadMedia(track));

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

  // Réinitialiser la queue quand on revient sur la page découvrir
  useEffect(() => {
    if (location.pathname === '/') {
      resetQueue();
      fetchMoreTracks();
    }
  }, [location.pathname]);

  // Charger les tracks initiales
  useEffect(() => {
    if (currentUser && queue.length < QUEUE_SIZE) {
      fetchMoreTracks();
    }
  }, [currentUser]);

  return {
    currentTrack: queue[0] || null,
    loading,
    getNextTrack,
    setInitialTrack,
    preferredTags
  };
};