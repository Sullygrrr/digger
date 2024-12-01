import React, { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../config/firebase';
import { Track } from '../types/music';
import { Music, ExternalLink } from 'lucide-react';
import { useUsername } from '../hooks/useUsername';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStorageCheck } from '../hooks/useStorageCheck';

interface ErrorMessageProps {
  title?: string;
  message: string;
  suggestion?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title = "Une erreur est survenue",
  message,
  suggestion
}) => {
  return (
    <div className="bg-dark-100 rounded-2xl p-6 text-center">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{message}</p>
      {suggestion && (
        <p className="text-sm text-gray-500">{suggestion}</p>
      )}
    </div>
  );
};

interface LikedTrack extends Track {
  likedAt: { toDate: () => Date };
  originalUserId: string;
}

export const LikedTracks: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { checkFileExists } = useStorageCheck();
  const [validTracks, setValidTracks] = useState<LikedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const likedTracksQuery = query(
    collection(db, `users/${currentUser?.uid}/likedTracks`),
    orderBy('likedAt', 'desc')
  );
  
  const [likedTracks, tracksLoading, error] = useCollectionData(likedTracksQuery, {
    idField: 'trackId'
  });

  useEffect(() => {
    const validateTracks = async () => {
      if (!likedTracks) return;

      const validatedTracks: LikedTrack[] = [];
      
      for (const track of likedTracks as LikedTrack[]) {
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
  }, [likedTracks, tracksLoading]);

  const handleTrackClick = (track: LikedTrack) => {
    localStorage.setItem('selectedTrack', JSON.stringify({
      id: track.trackId,
      title: track.title,
      audioUrl: track.audioUrl,
      mediaUrl: track.mediaUrl,
      mediaType: track.mediaType,
      tags: track.tags,
      platforms: track.platforms,
      userId: track.originalUserId,
      likes: track.likes,
      likedBy: track.likedBy
    }));
    
    navigate('/');
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
      <ErrorMessage 
        title="Erreur de chargement"
        message="Impossible de charger tes tracks likées"
        suggestion="Réessaie plus tard"
      />
    );
  }

  if (!validTracks.length) {
    return (
      <div className="text-center p-8 text-gray-400">
        Tu n'as pas encore liké de sons 💜
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {validTracks.map((track: LikedTrack) => (
        <TrackItem 
          key={track.trackId} 
          track={track} 
          onClick={() => handleTrackClick(track)}
        />
      ))}
    </div>
  );
};

interface TrackItemProps {
  track: LikedTrack;
  onClick: () => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onClick }) => {
  const username = useUsername(track.originalUserId);

  const platformStyles = {
    spotify: "bg-[#1DB954] hover:bg-[#1ed760] text-white",
    deezer: "bg-[#FF0092] hover:bg-[#ff1a9d] text-white",
    appleMusic: "bg-gradient-to-r from-[#FC5C7D] to-[#6A82FB] hover:opacity-90 text-white",
    youtube: "bg-[#FF0000] hover:bg-[#ff1a1a] text-white"
  };

  return (
    <div 
      className="bg-dark-100 rounded-xl p-4 shadow-lg hover:bg-dark-200 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-dark-200 rounded-lg flex items-center justify-center">
          <Music className="w-6 h-6 text-gray-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{track.title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">par {username}</p>
            <span className="text-gray-500 text-xs">•</span>
            <p className="text-gray-500 text-xs">
              {track.likedAt.toDate().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {Object.entries(track.platforms || {}).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-3">
            {Object.entries(track.platforms).map(([platform, url], index) => (
              <a
                key={index}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${platformStyles[platform as keyof typeof platformStyles]}`}
                onClick={(e) => e.stopPropagation()}
              >
                {platform}
                <ExternalLink className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};