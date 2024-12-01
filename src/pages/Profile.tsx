import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MusicUpload } from '../components/MusicUpload';
import { TrackList } from '../components/TrackList';
import { LikedTracks } from '../components/LikedTracks';
import { SettingsModal } from '../components/SettingsModal';
import { Settings, Upload, Music, LogOut, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'upload' | 'tracks' | 'likes';

export const Profile = () => {
  const { currentUser, username, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('À bientôt! 👋');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              {username}
            </h1>
            <p className="text-gray-400 text-sm">{currentUser?.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-dark-100 transition-colors"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-dark-100 transition-colors text-red-500 hover:text-red-400"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('tracks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'tracks'
              ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-100'
          }`}
        >
          <Music className="w-5 h-5" />
          Mes sons
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'likes'
              ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-100'
          }`}
        >
          <Heart className="w-5 h-5" />
          Mes likes
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-100'
          }`}
        >
          <Upload className="w-5 h-5" />
          Drop ta track
        </button>
      </div>

      {activeTab === 'upload' && <MusicUpload />}
      {activeTab === 'tracks' && <TrackList userId={currentUser?.uid || ''} />}
      {activeTab === 'likes' && <LikedTracks />}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};