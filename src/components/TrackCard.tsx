import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types/music';
import { Music, ThumbsUp, ThumbsDown, ExternalLink, ChevronUp, Heart } from 'lucide-react';
import { useUsername } from '../hooks/useUsername';
import { useLikes } from '../hooks/useLikes';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const platformStyles = {
  spotify: "bg-[#1DB954] hover:bg-[#1ed760] text-white",
  deezer: "bg-[#FF0092] hover:bg-[#ff1a9d] text-white",
  appleMusic: "bg-gradient-to-r from-[#FC5C7D] to-[#6A82FB] hover:opacity-90 text-white",
  youtube: "bg-[#FF0000] hover:bg-[#ff1a1a] text-white"
};

interface TrackCardProps {
  track: Track;
  onNext: () => void;
  isFirstCard?: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, onNext, isFirstCard = false }) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const [isPlaying, setIsPlaying] = useState(!isFirstCard);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [detailsProgress, setDetailsProgress] = useState(0);
  const [currentLikes, setCurrentLikes] = useState(track.likes);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const username = useUsername(track.userId);
  const { likes, isLiked, toggleLike } = useLikes(track.id, currentLikes, track.likedBy);

  // Mettre à jour le compteur de likes au montage du composant
  useEffect(() => {
    const fetchCurrentLikes = async () => {
      try {
        const trackDoc = await getDoc(doc(db, 'tracks', track.id));
        if (trackDoc.exists()) {
          const currentLikes = trackDoc.data().likes;
          setCurrentLikes(currentLikes);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des likes:', error);
      }
    };

    fetchCurrentLikes();
  }, [track.id]);

  useEffect(() => {
    if (!isFirstCard && audioRef.current) {
      audioRef.current.play();
    }
  }, [isFirstCard]);

  useEffect(() => {
    const handleAudioEnd = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setShowDetails(true);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnd);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnd);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDetails && detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } else {
        audioRef.current.play();
        if (videoRef.current) {
          videoRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartX(clientX);
    setStartY(clientY);
    setIsDragging(true);
    setDragDirection(null);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - startX;
    const diffY = clientY - startY;

    if (!dragDirection) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      if (absX > absY && absX > 5) {
        setDragDirection('horizontal');
      } else if (absY > absX && absY > 5) {
        setDragDirection('vertical');
      }
    }

    if (dragDirection === 'horizontal') {
      setCurrentX(diffX);
      if (diffX > 25) {
        setSwipeDirection('right');
      } else if (diffX < -25) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    } else if (dragDirection === 'vertical') {
      const maxDrag = window.innerHeight * 0.7;
      let progress;
      
      if (showDetails) {
        progress = 1 - Math.min(Math.max(diffY / maxDrag, 0), 1);
      } else {
        progress = Math.min(Math.max(-diffY / maxDrag, 0), 1);
      }
      
      setDetailsProgress(progress);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragDirection === 'horizontal' && Math.abs(currentX) > 50) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      if (swipeDirection === 'right' && !isLiked) {
        await toggleLike();
      } else if (swipeDirection === 'left' && isLiked) {
        await toggleLike();
      }
      
      onNext();
    } else if (dragDirection === 'vertical') {
      if (showDetails) {
        if (detailsProgress < 0.7) {
          setShowDetails(false);
        }
      } else {
        if (detailsProgress > 0.3) {
          setShowDetails(true);
        }
      }
      setDetailsProgress(showDetails ? 1 : 0);
    }

    setCurrentX(0);
    setCurrentY(0);
    setDragDirection(null);
    setSwipeDirection(null);
  };

  useEffect(() => {
    setDetailsProgress(showDetails ? 1 : 0);
  }, [showDetails]);

  const cardStyle = {
    transform: dragDirection === 'horizontal'
      ? `translate(${currentX}px) rotate(${currentX * 0.1}deg)`
      : 'none',
    transition: isDragging ? 'none' : 'all 0.3s ease',
  };

  const detailsStyle = {
    transform: `translateY(${(1 - detailsProgress) * 100}%)`,
    opacity: detailsProgress,
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const renderMedia = () => {
    if (track.mediaType === 'video' && track.mediaUrl) {
      return (
        <video
          ref={videoRef}
          autoPlay={!isFirstCard}
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={track.mediaUrl} type="video/mp4" />
        </video>
      );
    } else if (track.mediaType === 'image' && track.mediaUrl) {
      return (
        <img
          src={track.mediaUrl}
          alt={track.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      );
    } else {
      return (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-dark-200 to-dark flex items-center justify-center">
          <Music className="w-24 h-24 text-gray-600" />
        </div>
      );
    }
  };

  return (
    <div 
      className="absolute inset-4 bg-dark-100 rounded-2xl shadow-xl overflow-hidden touch-none select-none"
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <audio
        ref={audioRef}
        src={track.audioUrl}
      />

      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={togglePlay}
      >
        {renderMedia()}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/5 text-4xl font-bold">EN PAUSE</div>
          </div>
        )}

        <div className={`absolute inset-0 flex items-center justify-between px-8 pointer-events-none`}>
          <div className={`transform transition-all duration-200 ${
            swipeDirection === 'right' 
              ? 'opacity-100 scale-100 translate-x-0' 
              : 'opacity-0 scale-90 -translate-x-4'
          }`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <ThumbsUp className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className={`transform transition-all duration-200 ${
            swipeDirection === 'left'
              ? 'opacity-100 scale-100 translate-x-0'
              : 'opacity-0 scale-90 translate-x-4'
          }`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <ThumbsDown className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold">{track.title}</h2>
            <p className="text-white/70 text-sm">par {username}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            <span className="text-sm">{likes}</span>
          </button>
        </div>
        
        {track.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {track.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-white/10 backdrop-blur-sm text-xs px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div 
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(true);
          }}
        >
          <ChevronUp className="w-6 h-6 animate-bounce" />
          <span className="text-xs">Plus d'infos</span>
        </div>
      </div>

      <div 
        ref={detailsRef}
        className="fixed inset-x-0 bottom-0 bg-dark-100/95 backdrop-blur-sm rounded-t-3xl"
        style={{ 
          ...detailsStyle,
          height: '70vh'
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full my-3" />

        <div className="h-full overflow-y-auto px-6 pt-8 pb-24">
          {track.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{track.description}</p>
            </div>
          )}

          {Object.entries(track.platforms || {}).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Écouter sur</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(track.platforms).map(([platform, url], index) => (
                  <a
                    key={index}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${platformStyles[platform as keyof typeof platformStyles]}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="capitalize">{platform}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};