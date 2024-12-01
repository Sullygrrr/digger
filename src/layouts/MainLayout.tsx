import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Discover } from '../pages/Discover';
import { Profile } from '../pages/Profile';
import { Compass, User } from 'lucide-react';
import { TouchFeedback } from '../components/TouchFeedback';

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-dark text-white flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

      <nav className="bg-dark-100/95 backdrop-blur-lg border-t border-gray-800/30 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center gap-16 py-2">
            <TouchFeedback
              onClick={() => navigate('/')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl ${
                location.pathname === '/' 
                  ? 'text-white bg-gradient-to-r from-accent-purple to-accent-blue'
                  : 'text-gray-400'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-xs">Découvrir</span>
            </TouchFeedback>

            <TouchFeedback
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl ${
                location.pathname === '/profile'
                  ? 'text-white bg-gradient-to-r from-accent-purple to-accent-blue'
                  : 'text-gray-400'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Moi</span>
            </TouchFeedback>
          </div>
        </div>
      </nav>
    </div>
  );
};
