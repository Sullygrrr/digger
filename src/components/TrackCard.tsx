import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types/music';
import { Music, ThumbsUp, ThumbsDown, ExternalLink, ChevronUp, Heart } from 'lucide-react';
import { useUsername } from '../hooks/useUsername';
import { useLikes } from '../hooks/useLikes';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const SWIPE_THRESHOLD = 80; // Seuil de distance pour déclencher un swipe
const SWIPE_VELOCITY_THRESHOLD = 0.5; // Seuil de vitesse pour déclencher un swipe
const ROTATION_FACTOR = 0.08; // Facteur de rotation pour l'effet de carte
const SPRING_CONFIG = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Configuration de l'animation spring

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
  const [startTime, setStartTime] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const [isPlaying, setIsPlaying] = useState(!isFirstCard);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [detailsProgress, setDetailsProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(track.likes);
  const [lastX, setLastX] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const username = useUsername(track.userId);
  const { likes, isLiked, toggleLike } = useLikes(track.id, currentLikes, track.likedBy);

  useEffect(() => {
    const fetchCurrentLikes = async () => {
      try {
        const trackDoc = await getDoc(doc(db, 'tracks', track.id));
        if (trackDoc.exists()) {
          setCurrentLikes(trackDoc.data().likes);
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

  const updateVelocity = (currentX: number, currentTime: number) => {
    const deltaX = currentX - lastX;
    const deltaTime = currentTime - lastTime;
    if (deltaTime > 0) {
      setVelocity(deltaX / deltaTime);
    }
    setLastX(currentX);
    setLastTime(currentTime);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartX(clientX);
    setStartY(clientY);
    setStartTime(Date.now());
    setLastX(clientX);
    setLastTime(Date.now());
    setIsDragging(true);
    setDragDirection(null);
    setSwipeDirection(null);
    setVelocity(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - startX;
    const diffY = clientY - startY;
    const currentTime = Date.now();

    updateVelocity(clientX, currentTime);

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

    const endTime = Date.now();
    const swipeTime = endTime - startTime;
    const finalVelocity = Math.abs(velocity);

    if (dragDirection === 'horizontal' && 
        (Math.abs(currentX) > SWIPE_THRESHOLD || finalVelocity > SWIPE_VELOCITY_THRESHOLD)) {
      setIsExiting(true);
      
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      if (swipeDirection === 'right' && !isLiked) {
        await toggleLike();
      } else if (swipeDirection === 'left' && isLiked) {
        await toggleLike();
      }

      const exitDistance = window.innerWidth * (currentX > 0 ? 1.5 : -1.5);
      const exitDuration = Math.min(400, Math.max(250, swipeTime * 0.5));
      
      setCurrentX(exitDistance);
      setTimeout(() => {
        onNext();
      }, exitDuration);
    } else {
      // Animation de retour avec effet de ressort
      const springAnimation = () => {
        const progress = Math.min(1, (Date.now() - endTime) / 300);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCurrentX(currentX * (1 - easeProgress));
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(springAnimation);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(springAnimation);
    }

    setDragDirection(null);
    setSwipeDirection(null);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const cardStyle = {
    transform: dragDirection === 'horizontal'
      ? `translate3d(${currentX}px, 0, 0) rotate(${currentX * ROTATION_FACTOR}deg)`
      : 'translate3d(0, 0, 0)',
    transition: isDragging ? 'none' : `all 0.3s ${SPRING_CONFIG}`,
    opacity: isExiting ? 0 : 1,
    willChange: 'transform'
  };

  const detailsStyle = {
    transform: `translate3d(0, ${(1 - detailsProgress) * 100}%, 0)`,
    opacity: detailsProgress,
    transition: isDragging ? 'none' : `all 0.3s ${SPRING_CONFIG}`,
    willChange: 'transform, opacity'
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

      <div className="absolute inset-0">
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
