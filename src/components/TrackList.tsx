import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { Music, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStorageCheck } from '../hooks/useStorageCheck';
import toast from 'react-hot-toast';
import { Track } from '../types/music';

interface TrackListProps {
  userId: string;
}

export const TrackList: React.FC<TrackListProps> = ({ userId }) => {
  const { currentUser } = useAuth();
  const { checkFileExists } = useStorageCheck();
  const [validTracks, setValidTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const tracksQuery = query(
    collection(db, 'tracks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const [tracks, tracksLoading, error] = useCollectionData(tracksQuery, {
    idField: 'id'
  });

  useEffect(() => {
    const validateTracks = async () => {
      if (!tracks) return;

      const validatedTracks: Track[] = [];
      
      for (const track of tracks as Track[]) {
        try {
          const audioExists = await checkFileExists(track.audioUrl);
          if (audioExists) {
            validatedTracks.push(track);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du fichier:', error);
        }
      }

      setValidTracks(validatedTracks);
      setLoading(false);
    };

    if (!tracksLoading) {
      validateTracks();
    }
  }, [tracks, tracksLoading]);

  const handleDelete = async (track: Track) => {
    if (track.userId !== currentUser?.uid) {
      toast.error('Vous n\'êtes pas autorisé à supprimer cette track');
      return;
    }

    if (!window.confirm('Tu veux vraiment supprimer ce son ?')) return;

    const toastId = toast.loading('Suppression...');

    try {
      // Fonction utilitaire pour extraire le chemin du storage
      const getStoragePath = (url: string) => {
        try {
          const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/music-6e66d.appspot.com/o/';
          const filePath = decodeURIComponent(url.replace(baseUrl, '').split('?')[0]);
          return filePath;
        } catch (error) {
          console.error('Erreur lors de l\'extraction du chemin:', error);
          return null;
        }
      };

      // Supprimer le fichier audio
      const audioPath = getStoragePath(track.audioUrl);
      if (audioPath) {
        try {
          const audioRef = ref(storage, audioPath);
          await deleteObject(audioRef);
        } catch (error) {
          console.error('Erreur lors de la suppression du fichier audio:', error);
        }
      }

      // Supprimer le média (image ou vidéo) si présent
      if (track.mediaUrl) {
        const mediaPath = getStoragePath(track.mediaUrl);
        if (mediaPath) {
          try {
            const mediaRef = ref(storage, mediaPath);
            await deleteObject(mediaRef);
          } catch (error) {
            console.error('Erreur lors de la suppression du média:', error);
          }
        }
      }

      toast.success('Fichiers supprimés! 🗑️', { id: toastId });
      
      // Mettre à jour la liste locale
      setValidTracks(prevTracks => prevTracks.filter(t => t.id !== track.id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer les fichiers', { id: toastId });
    }
  };

  if (loading || tracksLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Erreur lors du chargement des tracks
      </div>
    );
  }

  if (!validTracks.length) {
    return (
      <div className="text-center p-8 text-gray-400">
        Tu n'as pas encore drop de sons 🎵
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {validTracks.map((track: Track) => (
        <div 
          key={track.id} 
          className="bg-dark-100 rounded-xl p-4 shadow-lg hover:bg-dark-200 transition-colors"
        >
          <div className="flex items-center gap-4">
            {track.mediaUrl ? (
              <img
                src={track.mediaUrl}
                alt={track.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-dark-200 rounded-lg flex items-center justify-center">
                <Music className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{track.title}</h3>
              
              {track.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {track.tags.map((tag, index) => (
                    <span
                      key={`${track.id}-tag-${index}`}
                      className="bg-dark-200 text-gray-300 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(track)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <audio 
              controls 
              className="w-full [&::-webkit-media-controls-panel]:bg-dark-200 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
            >
              <source src={track.audioUrl} type="audio/mpeg" />
              Ton navigateur ne supporte pas la lecture audio
            </audio>
          </div>

          {Object.entries(track.platforms || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex flex-wrap gap-3">
                {Object.entries(track.platforms).map(([platform, url], index) => (
                  <a
                    key={`${track.id}-platform-${index}`}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent-purple hover:text-accent-blue transition-colors"
                  >
                    {platform}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};