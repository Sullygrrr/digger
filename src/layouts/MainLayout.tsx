import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Discover } from '../pages/Discover';
import { Profile } from '../pages/Profile';
import { Compass, User } from 'lucide-react';

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark text-white pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

      {/* Navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-100/55 backdrop-blur-lg border-t border-gray-800/30">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center gap-16 py-1.5">
            <button
              onClick={() => navigate('/')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                location.pathname === '/' 
                  ? 'text-white bg-gradient-to-r from-accent-purple to-accent-blue'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[10px]">Découvrir</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                location.pathname === '/profile'
                  ? 'text-white bg-gradient-to-r from-accent-purple to-accent-blue'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[10px]">Moi</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};