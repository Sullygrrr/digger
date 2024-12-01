import React, { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { validatePlatformUrl } from '../utils/validators';
import { Music, Upload, Film } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import { useAudioDuration } from '../hooks/useAudioDuration';
import { useTags } from '../hooks/useTags';
import { useTagStats } from '../hooks/useTagStats';
import { TagInput } from './TagInput';
import { PlatformLinks } from './PlatformLinks';
import { AudioTrimmer } from './AudioTrimmer';
import toast from 'react-hot-toast';

const MAX_TITLE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 500;

export const MusicUpload: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<{
    file: File;
    type: 'video' | 'image';
  } | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [platforms, setPlatforms] = useState({
    spotify: '',
    deezer: '',
    appleMusic: '',
    youtube: ''
  });
  const [loading, setLoading] = useState(false);
  const { uploadFile } = useFileUpload(currentUser?.uid || '');
  const { tags, currentTag, setCurrentTag, addTag, removeTag, clearTags, selectSuggestion } = useTags();
  const { duration, startTime, setStartTime, getDuration, trimAudio, setDuration } = useAudioDuration();
  const { updateGlobalTagStats } = useTagStats();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle.length <= MAX_TITLE_LENGTH) {
      setTitle(newTitle);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    if (newDescription.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(newDescription);
    }
  };

  const handlePlatformChange = (platform: string, url: string) => {
    setPlatforms(prev => ({ ...prev, [platform]: url }));
  };

  const validatePlatforms = () => {
    for (const [platform, url] of Object.entries(platforms)) {
      if (url && !validatePlatformUrl(url, platform)) {
        toast.error(`Le lien ${platform} n'est pas valide`);
        return false;
      }
    }
    return true;
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const audioDuration = await getDuration(file);
      
      if (audioDuration < 20) {
        toast.error('Le fichier audio doit durer au moins 20 secondes');
        if (audioInputRef.current) audioInputRef.current.value = '';
        return;
      }

      setDuration(audioDuration);
      setSelectedAudioFile(file);
      
      if (!title) {
        const fileName = file.name.replace(/\.(mp3|wav)$/, '');
        setTitle(fileName.slice(0, MAX_TITLE_LENGTH));
      }

      if (audioDuration > 30) {
        setShowTrimmer(true);
      }
    } catch (error) {
      toast.error('Erreur lors de la lecture du fichier audio');
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';

      const promise = new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          if (video.duration > 7) {
            reject(new Error('La vidéo doit durer 7 secondes maximum'));
          } else {
            setSelectedMediaFile({ file, type: 'video' });
            resolve();
          }
        };
        video.onerror = () => reject(new Error('Erreur lors de la lecture de la vidéo'));
      });

      video.src = URL.createObjectURL(file);

      try {
        await promise;
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
        if (mediaInputRef.current) mediaInputRef.current.value = '';
      }
    } else if (file.type.startsWith('image/')) {
      setSelectedMediaFile({ file, type: 'image' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedAudioFile(null);
    setSelectedMediaFile(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (mediaInputRef.current) mediaInputRef.current.value = '';
    clearTags();
    setPlatforms({ spotify: '', deezer: '', appleMusic: '', youtube: '' });
    setStartTime(0);
    setDuration(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedAudioFile) {
      toast.error('Fichier audio requis');
      return;
    }

    if (!validatePlatforms()) return;

    setLoading(true);
    const toastId = toast.loading('Upload en cours...');

    try {
      let finalAudioFile = selectedAudioFile;
      if (duration > 30) {
        const trimmedBlob = await trimAudio(selectedAudioFile, startTime, 30);
        finalAudioFile = new File([trimmedBlob], selectedAudioFile.name, {
          type: 'audio/mpeg'
        });
      }

      let audioUrl = '';
      try {
        audioUrl = await uploadFile(finalAudioFile, 'tracks');
      } catch (error) {
        toast.error('Erreur lors de l\'upload du fichier audio', { id: toastId });
        return;
      }

      let mediaUrl = '';
      if (selectedMediaFile) {
        try {
          const folder = selectedMediaFile.type === 'video' ? 'videos' : 'images';
          mediaUrl = await uploadFile(selectedMediaFile.file, folder);
        } catch (error) {
          toast.error(`Erreur lors de l'upload du ${selectedMediaFile.type}`, { id: toastId });
          return;
        }
      }

      try {
        // Mettre à jour les stats globales des tags
        await updateGlobalTagStats(tags, true);

        await addDoc(collection(db, 'tracks'), {
          title,
          description,
          audioUrl,
          mediaUrl,
          mediaType: selectedMediaFile?.type || null,
          tags,
          platforms: Object.fromEntries(
            Object.entries(platforms).filter(([_, url]) => url !== '')
          ),
          userId: currentUser.uid,
          createdAt: new Date(),
          likes: 0,
          likedBy: []
        });

        toast.success('Track uploadée! 🎵', { id: toastId });
        resetForm();
      } catch (error) {
        toast.error('Erreur lors de la sauvegarde', { id: toastId });
        console.error('Erreur Firestore:', error);
      }
    } catch (error) {
      console.error('Erreur générale:', error);
      toast.error('Une erreur est survenue', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-100 rounded-2xl p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Titre ({title.length}/{MAX_TITLE_LENGTH})
          </label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors text-white"
            placeholder="Nom de ta track 🎵"
            required
            maxLength={MAX_TITLE_LENGTH}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description ({description.length}/{MAX_DESCRIPTION_LENGTH})
          </label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors text-white resize-none"
            placeholder="Décris ta track (optionnel) 📝"
            rows={4}
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Music className="w-4 h-4 text-accent-purple" />
              Fichier MP3
            </label>
            <div className="relative">
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={handleAudioChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-accent-purple file:to-accent-blue file:text-white hover:file:opacity-90 cursor-pointer"
                required
              />
              {selectedAudioFile && (
                <p className="mt-2 text-sm text-gray-400">
                  Fichier sélectionné: {selectedAudioFile.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Film className="w-4 h-4 text-accent-purple" />
              Cover (vidéo 7s max ou image)
            </label>
            <div className="relative">
              <input
                ref={mediaInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleMediaChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-accent-purple file:to-accent-blue file:text-white hover:file:opacity-90 cursor-pointer"
              />
              {selectedMediaFile && (
                <p className="mt-2 text-sm text-gray-400">
                  {selectedMediaFile.type === 'video' ? 'Vidéo' : 'Image'} sélectionnée: {selectedMediaFile.file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <TagInput
          tags={tags}
          currentTag={currentTag}
          onTagChange={setCurrentTag}
          onKeyDown={addTag}
          onRemoveTag={removeTag}
          onSelectSuggestion={selectSuggestion}
        />

        <PlatformLinks
          platforms={platforms}
          onPlatformChange={handlePlatformChange}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            'Upload en cours...'
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Drop ta track
            </>
          )}
        </button>
      </form>

      {showTrimmer && selectedAudioFile && (
        <AudioTrimmer
          file={selectedAudioFile}
          duration={duration}
          startTime={startTime}
          onStartTimeChange={setStartTime}
          onClose={() => {
            setShowTrimmer(false);
            resetForm();
          }}
          onConfirm={() => setShowTrimmer(false)}
        />
      )}
    </div>
  );
};