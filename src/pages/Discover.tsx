import React, { useEffect } from 'react';
import { useTrackQueue } from '../contexts/TrackQueueContext';
import { TrackCard } from '../components/TrackCard';
import { Track } from '../types/music';

export const Discover = () => {
  const { currentTrack, loading, getNextTrack, setInitialTrack } = useTrackQueue();

  useEffect(() => {
    const selectedTrackJson = localStorage.getItem('selectedTrack');
    if (selectedTrackJson) {
      const selectedTrack = JSON.parse(selectedTrackJson) as Track;
      setInitialTrack(selectedTrack);
      localStorage.removeItem('selectedTrack');
    }
  }, []);

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {loading ? (
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
        </div>
      ) : currentTrack ? (
        <TrackCard 
          track={currentTrack} 
          onNext={getNextTrack}
          isFirstCard={true}
        />
      ) : (
        <div className="absolute inset-4 bg-dark-100 rounded-2xl flex items-center justify-center">
          <p className="text-center text-gray-400 px-4">
            Aucune track disponible pour le moment 🎵
          </p>
        </div>
      )}
    </div>
  );
};