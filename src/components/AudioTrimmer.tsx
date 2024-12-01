import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface AudioTrimmerProps {
  file: File;
  duration: number;
  startTime: number;
  onStartTimeChange: (time: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const AudioTrimmer: React.FC<AudioTrimmerProps> = ({
  file,
  duration,
  startTime,
  onStartTimeChange,
  onClose,
  onConfirm
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }
  }, [startTime]);

  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        
        if (audioRef.current.currentTime >= startTime + 30) {
          audioRef.current.currentTime = startTime;
        }
        
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, startTime]);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    handleDrag(e);
  };

  const handleDrag = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    if (newTime + 30 <= duration) {
      onStartTimeChange(newTime);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleTouchEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && progressRef.current) {
        handleDrag(e as unknown as React.TouchEvent);
      }
    };

    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Sélectionner 30 secondes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <audio
          ref={audioRef}
          src={URL.createObjectURL(file)}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="space-y-4">
          <div
            ref={progressRef}
            className="relative h-12 bg-dark-200 rounded-lg touch-none"
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
          >
            {/* Barre de progression totale */}
            <div className="absolute inset-0 bg-gray-700/30 rounded-lg" />
            
            {/* Zone de 30 secondes sélectionnée */}
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-accent-purple to-accent-blue rounded-lg"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${Math.min((30 / duration) * 100, 100 - (startTime / duration) * 100)}%`
              }}
            />
            
            {/* Indicateur de lecture */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg transition-all duration-100"
              style={{ 
                left: `${(currentTime / duration) * 100}%`,
                opacity: isPlaying ? 1 : 0
              }}
            />
            
            {/* Indicateur de position */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg"
              style={{ left: `${(startTime / duration) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-400">
            <span>{formatTime(startTime)}</span>
            <span>{formatTime(startTime + 30)}</span>
          </div>

          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white hover:opacity-90 transition-opacity"
          >
            Confirmer la sélection
          </button>
        </div>
      </div>
    </div>
  );
};