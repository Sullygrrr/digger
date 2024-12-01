import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MusicUpload } from '../components/MusicUpload';
import { TrackList } from '../components/TrackList';
import { SettingsModal } from '../components/SettingsModal';
import { LogOut, Settings, Upload, Music } from 'lucide-react';

type Tab = 'upload' | 'tracks';

export const Home = () => {
  const { currentUser, username, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
                Yo {username}! 🔥
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
              className="p-2 rounded-full hover:bg-dark-100 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-100'
            }`}
          >
            <Upload className="w-5 h-5" />
            Drop ta track
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'tracks'
                ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-100'
            }`}
          >
            <Music className="w-5 h-5" />
            Mes sons
          </button>
        </div>

        {activeTab === 'upload' ? (
          <MusicUpload />
        ) : (
          <TrackList userId={currentUser?.uid || ''} />
        )}
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};